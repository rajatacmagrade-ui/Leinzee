import { useState } from 'react';
import { useStore } from '../store/useStore';
import { mockExtract } from '../utils/mockExtract';
import { Task } from '../types';
import { format } from 'date-fns';

export default function AddReel() {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [expandedCaption, setExpandedCaption] = useState(false);
  const [extractedData, setExtractedData] = useState<{
    title: string;
    deadline: string;
    caption: string;
    hashtags: string[];
    mentions: string[];
    priority: 'high' | 'medium' | 'low';
  } | null>(null);

  const [editTitle, setEditTitle] = useState('');
  const [generatedTask, setGeneratedTask] = useState<Task | null>(null);
  const addTask = useStore(state => state.addTask);

  const isValidUrl = (value: string) => {
    try {
      new URL(value);
      return value.includes('instagram.com') || value.includes('tiktok.com') || value.includes('youtube.com') || value.includes('shorts');
    } catch {
      return false;
    }
  };

  const urlValid = url.length > 0 ? isValidUrl(url) : null;

  const handleExtract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    setIsLoading(true);
    setExtractedData(null);
    setGeneratedTask(null);
    setShowError(false);

    try {
      const response = await fetch(`http://localhost:8000/extract?url=${encodeURIComponent(url)}`);
      if (!response.ok) {
        throw new Error('Extraction failed');
      }
      const data = await response.json();
      setExtractedData({
        title: data.title,
        deadline: data.deadline,
        caption: data.caption || data.title,
        hashtags: data.hashtags || [],
        mentions: data.mentions || [],
        priority: data.priority || 'medium',
      });
      setEditTitle(data.title);
    } catch (error) {
      console.error('Error extracting reel:', error);
      // Use mock fallback
      const extracted = mockExtract(url);
      setExtractedData(extracted);
      setEditTitle(extracted.title);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmTask = () => {
    if (!extractedData) return;

    const newTask: Task = {
      id: crypto.randomUUID(),
      title: editTitle || extractedData.title,
      deadline: extractedData.deadline,
      tokens: 5,
      status: 'pending',
      createdAt: new Date().toISOString(),
      priority: extractedData.priority,
      caption: extractedData.caption,
      hashtags: extractedData.hashtags,
      mentions: extractedData.mentions,
    };

    addTask(newTask);
    setGeneratedTask(newTask);
    setExtractedData(null);
    setUrl('');
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      setGeneratedTask(null);
    }, 3000);
  };

  const handleTryAgain = () => {
    setShowError(false);
    setErrorMessage('');
    setUrl('');
    setExtractedData(null);
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high': return 'URGENT';
      case 'medium': return 'SOON';
      default: return 'NORMAL';
    }
  };

  const getDaysLabel = (deadline: string) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const days = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (days < 0) return `${Math.abs(days)} days overdue`;
    if (days === 0) return 'Due today';
    if (days === 1) return 'Due tomorrow';
    return `Due in ${days} days`;
  };

  return (
    <div className="max-w-2xl mx-auto animate-fade-in-up">
      <div className="mb-12">
        <span className="text-secondary font-label text-[10px] uppercase tracking-[0.2em] font-bold mb-2 block">New Workflow</span>
        <h2 className="font-headline text-4xl font-extrabold tracking-tight mb-4 leading-tight">Capture <span className="text-primary italic">Inspiration</span>, Trigger Action.</h2>
        <p className="text-on-surface-variant text-sm max-w-md leading-relaxed">Paste a short-form video link below. Our AI extracts key tutorials, recipes, or tips and turns them into trackable tasks. You can verify and edit the exact task title before saving.</p>
      </div>

      {/* Success Toast */}
      {showSuccess && (
        <div className="mb-6 p-4 rounded-xl bg-secondary/20 border border-secondary/30 shadow-lg animate-slide-down flex items-center gap-3">
          <span className="material-symbols-outlined text-secondary" style={{fontVariationSettings: "'FILL' 1"}}>check_circle</span>
          <span className="font-bold text-secondary">Task added! Check your queue.</span>
        </div>
      )}

      {/* Error State */}
      {showError && (
        <div className="mb-6 p-4 rounded-xl bg-[rgba(255,110,132,0.1)] border border-[rgba(255,110,132,0.4)] shadow-lg animate-scale-in flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[#ff6e84]">error</span>
            <span className="font-bold text-[#ff6e84]">{errorMessage || 'Extraction failed. Please try again.'}</span>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleTryAgain}
              className="px-6 py-2 bg-surface-container-high text-on-surface rounded-lg font-bold text-sm hover:bg-surface-container-highest transition-all"
            >
              Try Again
            </button>
            <button
              onClick={() => {
                setShowError(false);
                const extracted = mockExtract(url);
                setExtractedData(extracted);
                setEditTitle(extracted.title);
              }}
              className="px-6 py-2 bg-secondary text-surface-container-lowest rounded-lg font-bold text-sm hover:bg-secondary/80 transition-all"
            >
              Use Demo Mode
            </button>
          </div>
        </div>
      )}

      {!extractedData && !generatedTask && (
        <form onSubmit={handleExtract} className="space-y-6">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-lg blur opacity-25 group-focus-within:opacity-100 transition duration-1000 group-focus-within:duration-200"></div>
            <div className="relative flex items-center">
              <span className="absolute left-4 material-symbols-outlined text-on-surface-variant">link</span>
              <input
                className={`w-full bg-surface-container-lowest border-none rounded-DEFAULT pl-12 pr-12 py-5 focus:ring-2 focus:ring-primary text-on-surface placeholder:text-outline font-body text-base shadow-inner outline-none transition-all ${
                  urlValid === false ? 'ring-2 ring-[#ff6e84]/50' : ''
                }`}
                placeholder="Paste reel link here..."
                required
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
              {url.length > 0 && (
                <span className={`absolute right-4 material-symbols-outlined transition-all ${
                  urlValid ? 'text-secondary' : 'text-[#ff6e84]'
                }`}>
                  {urlValid ? 'check_circle' : 'cancel'}
                </span>
              )}
            </div>
          </div>
          <button
            type="submit"
            disabled={!url || isLoading}
            className="w-full py-4 bg-gradient-to-r from-primary to-primary-dim text-on-primary font-headline font-bold text-lg rounded-DEFAULT shadow-[0_10px_30px_rgba(163,166,255,0.3)] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <span className="material-symbols-outlined animate-spin text-on-primary">sync</span>
                Extracting Context...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>bolt</span>
                Extract Content
              </>
            )}
          </button>
        </form>
      )}

      {/* Loading Shimmer */}
      {isLoading && (
        <div className="space-y-4 animate-fade-in-up">
          <div className="bg-surface-container-high rounded-xl p-6 border border-outline-variant/10">
            <div className="h-4 w-32 bg-surface-container-highest rounded animate-shimmer mb-4"></div>
            <div className="h-8 w-3/4 bg-surface-container-highest rounded animate-shimmer mb-6"></div>
            <div className="flex gap-4">
              <div className="h-10 w-24 bg-surface-container-highest rounded animate-shimmer"></div>
              <div className="h-10 w-24 bg-surface-container-highest rounded animate-shimmer"></div>
            </div>
          </div>
        </div>
      )}

      {/* Extracted Data Card */}
      {extractedData && !isLoading && (
        <div className="animate-scale-in space-y-6">
          <div className="bg-surface-container-high rounded-xl p-6 border border-primary/30 shadow-[0_0_40px_rgba(163,166,255,0.1)] relative">
            <div className="absolute top-0 right-0 px-4 py-1 bg-primary text-on-primary rounded-bl-lg rounded-tr-xl text-[10px] uppercase font-bold tracking-widest leading-none flex items-center gap-1 shadow-lg">
              <span className="material-symbols-outlined text-sm">psychology</span> AI Extracted
            </div>

            <div className="flex items-center gap-2 mb-4 mt-2">
              <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${
                extractedData.priority === 'high' ? 'priority-high' :
                extractedData.priority === 'medium' ? 'priority-medium' : 'priority-low'
              }`}>
                {getPriorityLabel(extractedData.priority)}
              </span>
              <span className="text-xs text-on-surface-variant">{getDaysLabel(extractedData.deadline)}</span>
            </div>

            <h3 className="font-headline font-bold text-on-surface text-xl mb-4">Verify Details</h3>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-primary uppercase tracking-widest mb-2 block">Exact Task Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary text-on-surface font-body text-base outline-none"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-surface-container-lowest rounded-lg border border-outline-variant/30">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-outline-variant">calendar_clock</span>
                  <span className="text-on-surface font-medium text-sm">Suggested Deadline</span>
                </div>
                <span className="text-primary font-bold text-sm bg-primary/10 px-3 py-1 rounded">
                  {format(new Date(extractedData.deadline), 'MMM d, yyyy')}
                </span>
              </div>

              {extractedData.caption && (
                <div className="p-4 bg-surface-container-lowest rounded-lg border border-outline-variant/30">
                  <button
                    onClick={() => setExpandedCaption(!expandedCaption)}
                    className="w-full flex items-center justify-between"
                  >
                    <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-2">Reel Caption</p>
                    <span className="material-symbols-outlined text-on-surface-variant text-sm">{expandedCaption ? 'expand_less' : 'expand_more'}</span>
                  </button>
                  <p className={`text-on-surface text-sm leading-relaxed italic opacity-80 transition-all ${expandedCaption ? '' : 'line-clamp-2'}`}>
                    "{extractedData.caption}"
                  </p>
                </div>
              )}

              {(extractedData.hashtags.length > 0 || extractedData.mentions.length > 0) && (
                <div className="flex flex-wrap gap-2">
                  {extractedData.hashtags.map(tag => (
                    <span key={tag} className="bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded border border-primary/20">#{tag}</span>
                  ))}
                  {extractedData.mentions.map(mention => (
                    <span key={mention} className="bg-secondary/10 text-secondary text-xs font-bold px-2 py-1 rounded border border-secondary/20">@{mention}</span>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-8 flex gap-3">
              <button
                onClick={() => setExtractedData(null)}
                className="flex-1 py-3 bg-surface-container-highest text-on-surface-variant hover:text-on-surface font-bold text-sm uppercase tracking-widest rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmTask}
                className="flex-1 py-3 bg-secondary text-surface-container-lowest font-bold text-sm uppercase tracking-widest rounded-lg shadow-lg hover:-translate-y-1 transition-transform"
              >
                Lock It In
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success State */}
      {generatedTask && (
        <div className="animate-scale-in">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-headline text-lg font-bold text-on-surface flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-secondary shadow-[0_0_10px_rgba(107,255,143,0.8)]"></span>
              Task Enqueued
            </h3>
            <span className="text-secondary text-[10px] font-label uppercase tracking-widest">Success Feedback</span>
          </div>

          <div className="glass-panel rounded-lg p-1 overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-4 z-10">
              <div className="bg-secondary text-secondary-container px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-lg flex items-center gap-1">
                <span className="material-symbols-outlined text-sm font-bold">check</span> Verified
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-6 p-4">
              <div className="w-full md:w-32 h-48 md:h-32 rounded-DEFAULT overflow-hidden bg-surface-container-lowest shrink-0 shadow-2xl relative border border-outline-variant/10">
                <img alt="Thumbnail placeholder" className="w-full h-full object-cover opacity-60" src="https://images.unsplash.com/photo-1616423640778-28d1b53229bd?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-3xl" style={{fontVariationSettings: "'FILL' 1"}}>play_circle</span>
                </div>
              </div>
              <div className="flex-1 space-y-3 py-1 flex flex-col justify-center">
                <div>
                  <p className="text-[10px] font-label text-primary font-bold uppercase tracking-widest mb-1">Target Action</p>
                  <h4 className="font-headline text-xl font-bold leading-tight text-on-surface">{generatedTask.title}</h4>
                </div>
                <div className="pt-2 border-t border-outline-variant/10 mt-auto">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary text-lg">checklist_rtl</span>
                    </div>
                    <span className="text-sm font-medium text-on-surface-variant flex items-center gap-2">Reward Pool: <span className="text-secondary font-bold">5 Tokens</span></span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              setGeneratedTask(null);
              setShowSuccess(false);
            }}
            className="w-full mt-6 py-4 border border-outline-variant/30 text-on-surface hover:bg-surface-container-high font-bold text-sm rounded-lg transition-all"
          >
            Add Another Reel
          </button>
        </div>
      )}
    </div>
  );
}