"""
Reel Description Extractor - FastAPI Backend
Uses Instaloader to extract caption/description from Instagram Reels.
"""
import re
import math
from datetime import datetime, timedelta
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import instaloader

app = FastAPI(title="Reel Description Extractor")

# Enable CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Instaloader instance
L = instaloader.Instaloader()


class ExtractedReel(BaseModel):
    title: str
    deadline: str  # ISO date string
    caption: str
    hashtags: list[str]
    mentions: list[str]


def extract_shortcode(url: str) -> str:
    """Extract shortcode from various Instagram URL formats."""
    patterns = [
        r'instagram\.com/reel/([A-Za-z0-9_-]+)',
        r'instagram\.com/p/([A-Za-z0-9_-]+)',
        r'instagram\.com/tv/([A-Za-z0-9_-]+)',
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    raise ValueError(f"Could not extract shortcode from URL: {url}")


def estimate_deadline(caption: str) -> str:
    """
    Estimate a reasonable deadline based on caption content.
    Falls back to a smart default (7 days from now).
    """
    caption_lower = caption.lower()

    # Keywords suggesting urgency
    urgent_keywords = ["urgent", "asap", "immediately", "today", "deadline tomorrow"]
    medium_keywords = ["this week", "soon", "upcoming", "by friday", "by monday"]

    days_to_add = 7  # default

    if any(kw in caption_lower for kw in urgent_keywords):
        days_to_add = 3
    elif any(kw in caption_lower for kw in medium_keywords):
        days_to_add = 5

    # Check for explicit date mentions
    date_patterns = [
        (r'january\s+(\d+)', 1),
        (r'february\s+(\d+)', 2),
        (r'march\s+(\d+)', 3),
        (r'april\s+(\d+)', 4),
        (r'may\s+(\d+)', 5),
        (r'june\s+(\d+)', 6),
        (r'july\s+(\d+)', 7),
        (r'august\s+(\d+)', 8),
        (r'september\s+(\d+)', 9),
        (r'october\s+(\d+)', 10),
        (r'november\s+(\d+)', 11),
        (r'december\s+(\d+)', 12),
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

    deadline = today + timedelta(days=days_to_add)
    return deadline.isoformat()


def extract_hashtags(text: str) -> list[str]:
    """Extract all hashtags from text."""
    return re.findall(r'#(\w+)', text)


def extract_mentions(text: str) -> list[str]:
    """Extract all @mentions from text."""
    return re.findall(r'@(\w+)', text)


def clean_caption(caption: str) -> str:
    """Remove extra whitespace and normalize caption."""
    # Remove hashtags and mentions from main text for display
    lines = [line.strip() for line in caption.split('\n') if line.strip()]
    return ' '.join(lines)


def generate_title(caption: str, max_length: int = 60) -> str:
    """
    Generate a task title from caption.
    Takes first meaningful sentence or phrase.
    """
    # Remove hashtags and mentions for title generation
    text = re.sub(r'#[\w]+', '', caption)
    text = re.sub(r'@[\w]+', '', text)
    text = re.sub(r'\s+', ' ', text).strip()

    # Try to find a good title: first sentence or first clause
    sentences = re.split(r'[.!?]', text)
    if sentences and sentences[0].strip():
        title = sentences[0].strip()
        if len(title) <= max_length:
            return title

    # Fallback: truncate
    if len(text) > max_length:
        return text[:max_length].rsplit(' ', 1)[0] + '...'
    return text or "Untitled Reel Task"


@app.get("/extract")
def extract_reel(url: str) -> ExtractedReel:
    """
    Extract description/caption from an Instagram Reel URL.

    Query params:
        url: Instagram reel URL (e.g., https://www.instagram.com/reel/ABC123/)

    Returns:
        ExtractedReel with title, deadline, caption, hashtags, and mentions.
    """
    try:
        shortcode = extract_shortcode(url)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    try:
        post = instaloader.Post.from_shortcode(L.context, shortcode)
    except Exception as e:
        raise HTTPException(
            status_code=404,
            detail=f"Could not fetch reel. It may be private, deleted, or the URL is invalid. ({str(e)})"
        )

    caption = post.caption or ""
    caption_clean = clean_caption(caption)
    hashtags = extract_hashtags(caption)
    mentions = extract_mentions(caption)
    title = generate_title(caption_clean)
    deadline = estimate_deadline(caption)

    return ExtractedReel(
        title=title,
        deadline=deadline,
        caption=caption_clean,
        hashtags=hashtags,
        mentions=mentions,
    )


@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
