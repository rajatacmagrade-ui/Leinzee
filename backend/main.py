import os
import re
import json
import math
import sqlite3
import subprocess
from html import unescape
from datetime import datetime, timedelta
from typing import Optional, Dict, List

import requests
import hashlib
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import instaloader

app = FastAPI(title="Social Media Description Extractor")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────── Database ──────────────────────────

DB_PATH = "leinzeee.db"

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    return conn

def init_db():
    conn = get_db()
    cur = conn.cursor()
    cur.executescript("""
        CREATE TABLE IF NOT EXISTS tasks (
            id              TEXT PRIMARY KEY,
            title           TEXT NOT NULL,
            deadline        TEXT NOT NULL,
            status          TEXT NOT NULL DEFAULT 'pending',
            tokens          INTEGER NOT NULL DEFAULT 0,
            priority        TEXT NOT NULL DEFAULT 'medium',
            created_at      TEXT NOT NULL,
            completed_at    TEXT,
            caption         TEXT,
            hashtags        TEXT,
            mentions        TEXT,
            platform        TEXT,
            thumbnail       TEXT,
            source_url      TEXT
        );

        CREATE TABLE IF NOT EXISTS stats (
            id                      INTEGER PRIMARY KEY DEFAULT 1,
            total_tokens            INTEGER DEFAULT 0,
            weekly_completed_tasks  INTEGER DEFAULT 0,
            weekly_total_tasks      INTEGER DEFAULT 0,
            weekly_token_earnings   INTEGER DEFAULT 0,
            lifetime_completed_tasks INTEGER DEFAULT 0,
            current_streak          INTEGER DEFAULT 0,
            longest_streak          INTEGER DEFAULT 0,
            last_completion_date    TEXT,
            week_key                TEXT,
            instagram_user          TEXT
        );

        INSERT OR IGNORE INTO stats (id) VALUES (1);
    """)
    conn.commit()
    conn.close()

init_db()


# Create and serve thumbnails directory
THUMBNAILS_DIR = "thumbnails"
os.makedirs(THUMBNAILS_DIR, exist_ok=True)
app.mount("/thumbnails", StaticFiles(directory=THUMBNAILS_DIR), name="thumbnails")

# Global Instaloader instance (kept for legacy support if needed)
L = instaloader.Instaloader()
SESSION_FILE = "instagram_session"


# ─────────────────────────── Models ───────────────────────────

class LoginRequest(BaseModel):
    username: str
    password: str


class ExtractedReel(BaseModel):
    title: str
    deadline: str
    caption: str
    hashtags: list[str]
    mentions: list[str]
    priority: str
    platform: str
    thumbnail: Optional[str] = None


# ─────────────────────── Helper Functions ─────────────────────

def extract_hashtags(text: str) -> list[str]:
    return re.findall(r'#(\w+)', text)


def extract_mentions(text: str) -> list[str]:
    return re.findall(r'@(\w+)', text)


def clean_caption(caption: str) -> str:
    if not caption:
        return ""
    lines = [line.strip() for line in caption.split('\n') if line.strip()]
    return unescape(' '.join(lines))


def generate_title(caption: str, max_length: int = 60) -> str:
    if not caption: return "Untitled Task"
    text = re.sub(r'#[\w]+', '', caption)
    text = re.sub(r'@[\w]+', '', text)
    text = re.sub(r'\s+', ' ', text).strip()
    sentences = re.split(r'[.!?]', text)
    if sentences and sentences[0].strip():
        title = sentences[0].strip()
        if len(title) <= max_length:
            return title
    if len(text) > max_length:
        return text[:max_length].rsplit(' ', 1)[0] + '...'
    return text or "Untitled Task"


def estimate_deadline(caption: str) -> str:
    if not caption: return datetime.now().isoformat()
    caption_lower = caption.lower()
    urgent_keywords = ["urgent", "asap", "immediately", "today", "deadline tomorrow"]
    medium_keywords = ["this week", "soon", "upcoming", "by friday", "by monday"]
    days_to_add = 7

    if any(kw in caption_lower for kw in urgent_keywords):
        days_to_add = 3
    elif any(kw in caption_lower for kw in medium_keywords):
        days_to_add = 5

    date_patterns = [
        (r'january\s+(\d+)', 1), (r'february\s+(\d+)', 2),
        (r'march\s+(\d+)', 3),   (r'april\s+(\d+)', 4),
        (r'may\s+(\d+)', 5),     (r'june\s+(\d+)', 6),
        (r'july\s+(\d+)', 7),    (r'august\s+(\d+)', 8),
        (r'september\s+(\d+)', 9),(r'october\s+(\d+)', 10),
        (r'november\s+(\d+)', 11),(r'december\s+(\d+)', 12),
    ]
    today = datetime.now()
    for pattern, month in date_patterns:
        match = re.search(pattern, caption_lower)
        if match:
            day = int(match.group(1))
            try:
                target = datetime(today.year, month, day)
                if target < today:
                    target = datetime(today.year + 1, month, day)
                days_to_add = max(1, (target - today).days)
                break
            except ValueError:
                pass
    return (today + timedelta(days=days_to_add)).isoformat()


def detect_priority(deadline: str) -> str:
    days_until = math.ceil((datetime.fromisoformat(deadline) - datetime.now()).total_seconds() / 86400)
    if days_until <= 3:
        return "high"
    if days_until <= 7:
        return "medium"
    return "low"


def download_thumbnail(thumbnail_url: str, platform: str, post_id: str) -> Optional[str]:
    if not thumbnail_url: return None
    try:
        url_hash = hashlib.md5(thumbnail_url.encode()).hexdigest()[:8]
        extension = "jpg"
        if ".png" in thumbnail_url.lower(): extension = "png"
        elif ".webp" in thumbnail_url.lower(): extension = "webp"
        
        filename = f"{platform}_{post_id}_{url_hash}.{extension}"
        filepath = os.path.join(THUMBNAILS_DIR, filename)
        
        # Don't re-download if exists
        if os.path.exists(filepath):
            return f"http://localhost:8000/thumbnails/{filename}"
            
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
        response = requests.get(thumbnail_url, headers=headers, timeout=10)
        response.raise_for_status()
        
        with open(filepath, 'wb') as f:
            f.write(response.content)
            
        return f"http://localhost:8000/thumbnails/{filename}"
    except Exception as e:
        print(f"[Download] Failed: {e}")
        return thumbnail_url # Fallback to remote URL


def infer_platform(url: str) -> str:
    url_lower = url.lower()
    if "instagram.com" in url_lower:
        return "instagram"
    if "facebook.com" in url_lower or "fb.com" in url_lower:
        return "facebook"
    if "linkedin.com" in url_lower:
        return "linkedin"
    if "tiktok.com" in url_lower:
        return "tiktok"
    if "youtube.com" in url_lower or "youtu.be" in url_lower:
        return "youtube"
    return "unknown"


def extract_meta_content(html: str, patterns: List[str]) -> Optional[str]:
    for pattern in patterns:
        match = re.search(pattern, html, re.IGNORECASE | re.DOTALL)
        if match:
            value = unescape(match.group(1).strip())
            if value:
                return value
    return None


def extract_generic_metadata(url: str, platform: str) -> Dict:
    result = {"platform": platform, "url": url, "description": None, "thumbnail": None, "error": None}

    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"
        }
        response = requests.get(url, headers=headers, timeout=15)
        response.raise_for_status()
        html = response.text

        description = extract_meta_content(html, [
            r'<meta[^>]+property=["\']og:description["\'][^>]+content=["\']([^"\']+)["\']',
            r'<meta[^>]+name=["\']description["\'][^>]+content=["\']([^"\']+)["\']',
            r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']og:description["\']',
            r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+name=["\']description["\']',
        ])
        title = extract_meta_content(html, [
            r'<meta[^>]+property=["\']og:title["\'][^>]+content=["\']([^"\']+)["\']',
            r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']og:title["\']',
            r'<title[^>]*>(.*?)</title>',
        ])
        thumbnail = extract_meta_content(html, [
            r'<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\']+)["\']',
            r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']og:image["\']',
        ])

        result["description"] = description or title
        if thumbnail:
            post_id = hashlib.md5(url.encode()).hexdigest()[:10]
            result["thumbnail"] = download_thumbnail(thumbnail, platform, post_id)
    except Exception as exc:
        result["error"] = str(exc)

    return result


def extract_with_ytdlp(url: str, platform: str) -> Dict:
    result = {"platform": platform, "url": url, "description": None, "thumbnail": None, "error": None}

    try:
        import yt_dlp

        ydl_opts = {
            "quiet": True,
            "no_warnings": True,
            "extract_flat": False,
            "skip_download": True,
            "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
        }

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            description_parts = [
                info.get("description"),
                info.get("title"),
                info.get("fulltitle"),
            ]
            result["description"] = next((part for part in description_parts if part), None)
            thumbnail = info.get("thumbnail")
            if thumbnail:
                post_id = (
                    info.get("id")
                    or extract_instagram_id(url)
                    or extract_facebook_id(url)
                    or hashlib.md5(url.encode()).hexdigest()[:10]
                )
                result["thumbnail"] = download_thumbnail(thumbnail, platform, str(post_id))
    except Exception as exc:
        result["error"] = str(exc)

    return result


# ─────────────────────── Extraction Logic ─────────────────────

def extract_instagram_id(url: str) -> Optional[str]:
    patterns = [
        r'instagram\.com/p/([^/?&]+)',
        r'instagram\.com/reel/([^/?&]+)',
        r'instagram\.com/tv/([^/?&]+)'
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match: return match.group(1)
    return None


def extract_facebook_id(url: str) -> Optional[str]:
    patterns = [
        r'facebook\.com/.*?/posts/(\d+)',
        r'fb\.com/.*?/posts/(\d+)',
        r'facebook\.com/groups/.*?/posts/(\d+)',
        r'facebook\.com/permalink\.php\?story_fbid=(\d+)',
        r'facebook\.com/reel/(\d+)',
        r'facebook\.com/watch/\?v=(\d+)',
        r'facebook\.com/.*?/videos/(\d+)'
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match: return match.group(1)
    return None


def run_snscrape_command(cmd: List[str]) -> str:
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        return result.stdout.strip()
    except Exception:
        return ""


def extract_instagram_with_ytdlp(url: str, username: str = None) -> Dict:
    result = {"platform": "instagram", "url": url, "description": None, "thumbnail": None, "error": None}
    try:
        # Try instaloader first if session exists
        if username:
            session_path = f"{SESSION_FILE}_{username}"
            if os.path.exists(session_path):
                try:
                    # Use instaloader to fetch post metadata
                    L.load_session_from_file(username, filename=session_path)
                    post_shortcode = extract_instagram_id(url)
                    if post_shortcode:
                        post = instaloader.Post.from_shortcode(L.context, post_shortcode)
                        result["description"] = post.caption if post.caption else ""
                        if post.url:
                            import requests
                            result["thumbnail"] = download_thumbnail(post.url, "instagram", post_shortcode)
                        print(f"[Instagram] Extracted via instaloader: {post_shortcode}")
                        return result
                except Exception as inst_err:
                    print(f"[Instagram] Instaloader failed: {inst_err}")

        ytdlp_result = extract_with_ytdlp(url, "instagram")
        result.update(ytdlp_result)
    except Exception as e:
        print(f"[Instagram] Error: {e}")
        result["error"] = str(e)
    return result


def extract_facebook_with_snscrape(url: str) -> Dict:
    result = {"platform": "facebook", "url": url, "description": None, "thumbnail": None, "error": None}
    
    # Try yt-dlp first for Facebook as it's often more reliable for media
    try:
        ytdlp_result = extract_with_ytdlp(url, "facebook")
        result.update(ytdlp_result)
        if result["description"] or result["thumbnail"]:
            return result
    except Exception as e:
        print(f"[Facebook] yt-dlp fallback failed: {e}")

    try:
        post_id = extract_facebook_id(url)
        if not post_id:
            result["error"] = "Could not extract Facebook post ID"
            return result
        cmd = ["snscrape", "--jsonl", "facebook-post", post_id]
        output = run_snscrape_command(cmd)
        if output:
            data = json.loads(output.split('\n')[0])
            result["description"] = data.get("content", "")
            if data.get("images"):
                result["thumbnail"] = data["images"][0].get("url")
                if result["thumbnail"]:
                    result["thumbnail"] = download_thumbnail(result["thumbnail"], "facebook", post_id)
        else:
            result["error"] = "No output from snscrape"
    except Exception as e:
        result["error"] = str(e)
    return result


def extract_linkedin_with_selenium(url: str) -> Dict:
    result = {"platform": "linkedin", "url": url, "description": None, "thumbnail": None, "error": None}
    driver = None
    try:
        from selenium import webdriver
        from selenium.webdriver.common.by import By
        from selenium.webdriver.chrome.options import Options
        from selenium.webdriver.chrome.service import Service
        from webdriver_manager.chrome import ChromeDriverManager
        import time
        
        options = Options()
        options.add_argument("--headless")
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--disable-gpu")
        options.add_argument("--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
        
        try:
            service = Service(ChromeDriverManager().install())
            driver = webdriver.Chrome(service=service, options=options)
            driver.set_page_load_timeout(20)
            driver.get(url)
            time.sleep(3)
            
            # Find description
            desc_selectors = [
                "article .feed-shared-update-v2__description",
                ".feed-shared-text",
                "[data-test-id='main-feed-activity-card__commentary']",
                ".update-components-text",
                ".feed-shared-update-v2__commentary"
            ]
            for selector in desc_selectors:
                try:
                    element = driver.find_element(By.CSS_SELECTOR, selector)
                    result["description"] = element.text.strip()
                    if result["description"]: break
                except: continue
            
            # Find thumbnail
            img_selectors = [
                ".feed-shared-image img",
                ".update-components-article__image img",
                ".update-components-image__image",
                ".ivm-view-attr__img--centered",
                "article img[src*='media']",
                ".feed-shared-linkedin-video__container img"
            ]
            for selector in img_selectors:
                try:
                    img = driver.find_element(By.CSS_SELECTOR, selector)
                    src = img.get_attribute("src")
                    if src and src.startswith("http") and "profile-displayphoto" not in src:
                        post_id = re.search(r'activity:(\d+)', url) or re.search(r'posts/.*?-(\d+)', url)
                        id_str = post_id.group(1) if post_id else "unknown"
                        result["thumbnail"] = download_thumbnail(src, "linkedin", id_str)
                        break
                except: continue
        except Exception as inner_e:
            print(f"[LinkedIn] Selenium Error: {inner_e}")
            result["error"] = str(inner_e)
    except Exception as e:
        print(f"[LinkedIn] General Error: {e}")
        result["error"] = str(e)
    finally:
        if driver:
            try:
                driver.quit()
            except: pass
    return result


def extract_description_unified(url: str, username: str = None) -> Dict:
    platform = infer_platform(url)

    if platform == "instagram":
        primary = extract_instagram_with_ytdlp(url, username)
    elif platform == "facebook":
        primary = extract_facebook_with_snscrape(url)
    elif platform == "linkedin":
        primary = extract_linkedin_with_selenium(url)
    else:
        primary = extract_with_ytdlp(url, platform)

    if primary.get("description") or primary.get("thumbnail"):
        return primary

    generic = extract_generic_metadata(url, platform)
    if generic.get("description") or generic.get("thumbnail"):
        return generic

    return {
        "platform": platform,
        "url": url,
        "description": None,
        "thumbnail": None,
        "error": primary.get("error") or generic.get("error") or "Unsupported platform",
    }


# ─────────────────────────── Routes ───────────────────────────

@app.post("/login")
def login(request: LoginRequest):
    """Legacy Instagram login (retained for compatibility if needed)."""
    try:
        L.login(request.username, request.password)
        session_path = f"{SESSION_FILE}_{request.username}"
        L.save_session_to_file(filename=session_path)
        return {"status": "success", "message": "Logged in successfully", "username": request.username}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Login failed: {str(e)}")


@app.get("/connection-status")
def get_status(username: Optional[str] = None):
    if not username: return {"connected": False}
    session_path = f"{SESSION_FILE}_{username}"
    connected = os.path.exists(session_path)
    return {"connected": connected, "username": username if connected else None}


@app.get("/extract")
def extract_social_post(url: str, username: str = None) -> ExtractedReel:
    """Extract metadata from various social media platforms."""
    print(f"[Extract] URL={url}, username={username}")

    result = extract_description_unified(url, username)

    # If extraction failed, still derive the task from whatever page metadata we can salvage.
    if not result.get("description"):
        print(f"[Extract] Using mock fallback for: {url}")
        mock_title = url.split('/')[-2] if url.endswith('/') else url.split('/')[-1]
        mock_title = mock_title.replace('-', ' ').replace('_', ' ').title()
        fallback_caption = f"Review this content and turn it into an action item: {mock_title or url}"
        fallback_deadline = estimate_deadline(fallback_caption)

        return ExtractedReel(
            title=mock_title or "Extracted Task",
            deadline=fallback_deadline,
            caption=fallback_caption,
            hashtags=extract_hashtags(""),
            mentions=extract_mentions(""),
            priority=detect_priority(fallback_deadline),
            platform=result.get("platform", "unknown"),
            thumbnail=result.get("thumbnail")
        )

    caption = result.get("description", "")
    caption_clean = clean_caption(caption)
    deadline = estimate_deadline(caption_clean)

    return ExtractedReel(
        title=generate_title(caption_clean),
        deadline=deadline,
        caption=caption_clean,
        hashtags=extract_hashtags(caption),
        mentions=extract_mentions(caption),
        priority=detect_priority(deadline),
        platform=result["platform"],
        thumbnail=result.get("thumbnail")
    )


@app.get("/health")
def health_check():
    return {"status": "ok"}


# ─────────────────────── DB Task Models ────────────────────────

class TaskIn(BaseModel):
    id: str
    title: str
    deadline: str
    status: str = "pending"
    tokens: int = 0
    priority: str = "medium"
    createdAt: str
    completedAt: Optional[str] = None
    caption: Optional[str] = None
    hashtags: Optional[List[str]] = None
    mentions: Optional[List[str]] = None
    platform: Optional[str] = None
    thumbnail: Optional[str] = None
    sourceUrl: Optional[str] = None


class StatsIn(BaseModel):
    totalTokens: int = 0
    weeklyCompletedTasks: int = 0
    weeklyTotalTasks: int = 0
    weeklyTokenEarnings: int = 0
    lifetimeCompletedTasks: int = 0
    currentStreak: int = 0
    longestStreak: int = 0
    lastCompletionDate: Optional[str] = None
    weekKey: Optional[str] = None
    instagramUser: Optional[str] = None


def row_to_task(row: sqlite3.Row) -> dict:
    return {
        "id": row["id"],
        "title": row["title"],
        "deadline": row["deadline"],
        "status": row["status"],
        "tokens": row["tokens"],
        "priority": row["priority"],
        "createdAt": row["created_at"],
        "completedAt": row["completed_at"],
        "caption": row["caption"],
        "hashtags": json.loads(row["hashtags"]) if row["hashtags"] else [],
        "mentions": json.loads(row["mentions"]) if row["mentions"] else [],
        "platform": row["platform"],
        "thumbnail": row["thumbnail"],
        "sourceUrl": row["source_url"],
    }


def row_to_stats(row: sqlite3.Row) -> dict:
    return {
        "totalTokens": row["total_tokens"],
        "weeklyCompletedTasks": row["weekly_completed_tasks"],
        "weeklyTotalTasks": row["weekly_total_tasks"],
        "weeklyTokenEarnings": row["weekly_token_earnings"],
        "lifetimeCompletedTasks": row["lifetime_completed_tasks"],
        "currentStreak": row["current_streak"],
        "longestStreak": row["longest_streak"],
        "lastCompletionDate": row["last_completion_date"],
        "weekKey": row["week_key"],
        "instagramUser": row["instagram_user"],
    }


# ────────────────────────── Task Routes ────────────────────────

@app.get("/db/tasks")
def get_tasks():
    conn = get_db()
    rows = conn.execute("SELECT * FROM tasks ORDER BY created_at DESC").fetchall()
    conn.close()
    return [row_to_task(r) for r in rows]


@app.post("/db/tasks", status_code=201)
def create_task(task: TaskIn):
    conn = get_db()
    try:
        conn.execute("""
            INSERT OR REPLACE INTO tasks
              (id, title, deadline, status, tokens, priority, created_at,
               completed_at, caption, hashtags, mentions, platform, thumbnail, source_url)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        """, (
            task.id, task.title, task.deadline, task.status, task.tokens,
            task.priority, task.createdAt, task.completedAt, task.caption,
            json.dumps(task.hashtags or []),
            json.dumps(task.mentions or []),
            task.platform, task.thumbnail, task.sourceUrl,
        ))
        conn.commit()
    finally:
        conn.close()
    return {"ok": True, "id": task.id}


@app.patch("/db/tasks/{task_id}/complete")
def complete_task(task_id: str):
    conn = get_db()
    try:
        now = datetime.now().isoformat()
        result = conn.execute(
            "UPDATE tasks SET status='completed', completed_at=? WHERE id=?",
            (now, task_id)
        )
        conn.commit()
        if result.rowcount == 0:
            raise HTTPException(status_code=404, detail="Task not found")
    finally:
        conn.close()
    return {"ok": True}


@app.delete("/db/tasks/{task_id}")
def delete_task(task_id: str):
    conn = get_db()
    try:
        conn.execute("DELETE FROM tasks WHERE id=?", (task_id,))
        conn.commit()
    finally:
        conn.close()
    return {"ok": True}


# ────────────────────────── Stats Routes ───────────────────────

@app.get("/db/stats")
def get_stats():
    conn = get_db()
    row = conn.execute("SELECT * FROM stats WHERE id=1").fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Stats not found")
    return row_to_stats(row)


@app.put("/db/stats")
def save_stats(s: StatsIn):
    conn = get_db()
    try:
        conn.execute("""
            UPDATE stats SET
                total_tokens=?, weekly_completed_tasks=?, weekly_total_tasks=?,
                weekly_token_earnings=?, lifetime_completed_tasks=?,
                current_streak=?, longest_streak=?, last_completion_date=?,
                week_key=?, instagram_user=?
            WHERE id=1
        """, (
            s.totalTokens, s.weeklyCompletedTasks, s.weeklyTotalTasks,
            s.weeklyTokenEarnings, s.lifetimeCompletedTasks,
            s.currentStreak, s.longestStreak, s.lastCompletionDate,
            s.weekKey, s.instagramUser,
        ))
        conn.commit()
    finally:
        conn.close()
    return {"ok": True}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
