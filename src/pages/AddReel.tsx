import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Task } from '../types';
import { format } from 'date-fns';
import { mockExtract } from '../utils/mockExtract';

// --- Sub-components for better structure ---

const Header = () => (
  <div className="mb-10 text-center md:text-left">
    <span className="text-primary font-label text-[10px] uppercase tracking-[0.3em] font-black mb-3 block opacity-80">
      Automated Workflow
    </span>
    <h1 className="font-headline text-4xl md:text-5xl font-extrabold tracking-tight mb-4 leading-[1.1]">
      Capture <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary italic">Inspiration</span>, <br />
      Trigger Action.
    </h1>
    <p className="text-on-surface-variant text-base max-w-lg leading-relaxed mx-auto md:mx-0">
      Paste a short-form video link below. Our AI extracts key tutorials, recipes, or tips and turns them into trackable tasks instantly.
    </p>
  </div>
);

const SuccessToast = () => (
  <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl bg-secondary/90 backdrop-blur-md border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] animate-slide-down flex items-center gap-3">
    <span className="material-symbols-outlined text-surface-container-lowest" style={{fontVariationSettings: "'FILL' 1"}}>check_circle</span>
    <span className="font-bold text-surface-container-lowest">Task successfully enqueued!</span>
  </div>
);

export default function AddReel() {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [extractedData, setExtractedData] = useState<{
    title: string;
    deadline: string;
    caption: string;
    hashtags: string[];
    mentions: string[];
    priority: 'high' | 'medium' | 'low';
    platform: string;
    thumbnail?: string;
  } | null>(null);

  const [editTitle, setEditTitle] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [expandedCaption, setExpandedCaption] = useState(false);
  const [generatedTask, setGeneratedTask] = useState<Task | null>(null);
  const addTask = useStore(state => state.addTask);
  const instagramUser = useStore(state => state.instagramUser);

  const isValidUrl = (value: string) => {
    try {
      const urlObj = new URL(value);
      const host = urlObj.hostname.toLowerCase();
      const path = urlObj.pathname.toLowerCase();
      return host.includes('instagram.com') || 
             host.includes('facebook.com') || 
             host.includes('fb.com') || 
             host.includes('linkedin.com') || 
             host.includes('tiktok.com') || 
             host.includes('youtube.com') || 
             host.includes('youtu.be') ||
             path.includes('shorts') ||
             path.includes('reel');
    } catch {
      return false;
    }
  };

  const urlValid = url.length > 0 ? isValidUrl(url) : null;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedUrl = params.get('url') || params.get('text');
    
    if (sharedUrl) {
      const urlMatch = sharedUrl.match(/https?:\/\/[^\s]+/);
      const finalUrl = urlMatch ? urlMatch[0] : sharedUrl;
      
      if (isValidUrl(finalUrl)) {
        setUrl(finalUrl);
        setTimeout(() => {
          const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
          handleExtract(fakeEvent, finalUrl);
        }, 100);
      }
    }
  }, []);

  const handleExtract = async (e: React.FormEvent, overrideUrl?: string) => {
    e.preventDefault();
    const targetUrl = overrideUrl || url;
    if (!targetUrl) return;

    setIsLoading(true);
    setExtractedData(null);
    setGeneratedTask(null);
    setShowError(false);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      try {
        // FIXED: Using targetUrl instead of state url
        const response = await fetch(`http://localhost:8000/extract?url=${encodeURIComponent(targetUrl)}&username=${encodeURIComponent(instagramUser || '')}`, { signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(errorData?.detail || 'Extraction failed');
        }
        const data = await response.json();
        setExtractedData({
          title: data.title,
          deadline: data.deadline,
          caption: data.caption || data.title,
          hashtags: data.hashtags || [],
          mentions: data.mentions || [],
          priority: data.priority || 'medium',
          platform: data.platform || 'unknown',
          thumbnail: data.thumbnail,
        });
        setEditTitle(data.title);
        setSelectedPriority(data.priority || 'medium');
        setShowError(false);
      } catch (err: any) {
        const isBackendError = err.message === 'Failed to fetch' || err.name === 'AbortError';
        if (isBackendError) {
          const mockData = mockExtract(targetUrl);
          setExtractedData({
            title: mockData.title,
            deadline: mockData.deadline,
            caption: mockData.caption,
            hashtags: mockData.hashtags,
            mentions: mockData.mentions,
            priority: mockData.priority,
            platform: 'demo',
            thumbnail: mockData.thumbnail,
          });
          setEditTitle(mockData.title);
          setSelectedPriority(mockData.priority);
          setShowError(false);
        } else {
          setErrorMessage(err.message || 'Failed to extract reel details.');
          setShowError(true);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmTask = () => {
    if (!extractedData) return;

    const generateId = () => {
      try {
        return crypto.randomUUID();
      } catch {
        return Math.random().toString(36).substring(2) + Date.now().toString(36);
      }
    };

    const newTask: Task = {
      id: generateId(),
      title: editTitle || extractedData.title,
      deadline: extractedData.deadline,
      tokens: 5,
      status: 'pending',
      createdAt: new Date().toISOString(),
      priority: selectedPriority,
      caption: extractedData.caption,
      hashtags: extractedData.hashtags,
      mentions: extractedData.mentions,
      platform: extractedData.platform,
      thumbnail: extractedData.thumbnail,
      sourceUrl: url,
    };

    try {
      addTask(newTask);
      setGeneratedTask(newTask);
      setExtractedData(null);
      setUrl('');
      setShowSuccess(true);
    } catch (err) {
      console.error('Failed to add task:', err);
      setErrorMessage('Failed to save task to your workflow.');
      setShowError(true);
    }
    setTimeout(() => setShowSuccess(false), 3000);
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
    <div className="min-h-[80vh] flex flex-col justify-center max-w-2xl mx-auto py-8 md:py-12">
      {showSuccess && <SuccessToast />}

      <Header />

      {/* Error Message */}
      {showError && (
        <div className="mb-8 p-4 rounded-2xl bg-error/10 border border-error/20 flex items-start gap-4 animate-scale-in">
          <div className="w-10 h-10 rounded-full bg-error/20 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-error">warning</span>
          </div>
          <div className="flex-1">
            <p className="font-bold text-error mb-1">Extraction Error</p>
            <p className="text-on-surface-variant text-sm mb-3">{errorMessage}</p>
            <button 
              onClick={() => setShowError(false)}
              className="text-xs font-bold text-error uppercase tracking-widest hover:underline"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Input Section */}
      {!extractedData && !generatedTask && !isLoading && (
        <div className="animate-fade-in-up">
          <form onSubmit={handleExtract} className="space-y-6">
            <div className="relative group">
              {/* Outer glow effect */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-secondary rounded-3xl blur opacity-20 group-focus-within:opacity-40 transition duration-500"></div>
              
              <div className="relative flex flex-col md:flex-row gap-4 p-2 bg-surface-container-low rounded-3xl border border-white/5 shadow-2xl">
                <div className="relative flex-1 flex items-center">
                  <span className="absolute left-6 material-symbols-outlined text-on-surface-variant">link</span>
                  <input
                    className="w-full bg-transparent border-none pl-14 pr-12 py-5 focus:ring-0 text-on-surface placeholder:text-outline font-body text-base outline-none"
                    placeholder="Paste your inspiration link..."
                    required
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                  />
                  {url.length > 0 && (
                    <div className="absolute right-4 flex items-center">
                      <span className={`material-symbols-outlined ${urlValid ? 'text-secondary' : 'text-error'} transition-all`}>
                        {urlValid ? 'check_circle' : 'error'}
                      </span>
                    </div>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={!urlValid || isLoading}
                  className="px-8 py-4 md:py-0 bg-primary text-on-primary font-headline font-bold text-base rounded-2xl shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>auto_awesome</span>
                  <span>Analyze</span>
                </button>
              </div>
            </div>
            
            <div className="flex flex-wrap justify-center gap-6 pt-4 opacity-50">
              {['Instagram', 'TikTok', 'YouTube', 'LinkedIn'].map(p => (
                <div key={p} className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em]">
                  <span className="w-1 h-1 rounded-full bg-outline"></span>
                  {p}
                </div>
              ))}
            </div>
          </form>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="animate-fade-in-up space-y-8">
          <div className="glass-card rounded-[2rem] p-8 border border-white/5 overflow-hidden relative">
            {/* Shimmer overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-shimmer" style={{backgroundSize: '200% 100%'}}></div>
            
            <div className="flex flex-col md:flex-row gap-8">
              <div className="w-full md:w-48 h-64 md:h-48 bg-white/5 rounded-2xl animate-pulse"></div>
              <div className="flex-1 space-y-6">
                <div className="h-4 w-1/4 bg-white/5 rounded-full animate-pulse"></div>
                <div className="h-10 w-3/4 bg-white/5 rounded-xl animate-pulse"></div>
                <div className="space-y-3">
                  <div className="h-4 w-full bg-white/5 rounded-full animate-pulse"></div>
                  <div className="h-4 w-5/6 bg-white/5 rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>
            <div className="mt-8 flex gap-4">
              <div className="h-14 flex-1 bg-white/5 rounded-2xl animate-pulse"></div>
              <div className="h-14 flex-1 bg-white/5 rounded-2xl animate-pulse"></div>
            </div>
          </div>
          <p className="text-center text-on-surface-variant font-label text-xs animate-pulse">
            Consulting the Oracle for metadata...
          </p>
        </div>
      )}

      {/* Extracted Data Card */}
      {extractedData && !isLoading && (
        <div className="animate-scale-in space-y-6">
          <div className="glass-card rounded-[2rem] p-1 md:p-2 border border-primary/20 shadow-[0_0_80px_rgba(163,166,255,0.1)] relative overflow-hidden">
            <div className="bg-surface-container-low rounded-[1.8rem] p-6 md:p-8">
              {/* Badge */}
              <div className="absolute top-6 right-6 flex items-center gap-2">
                <div className="px-3 py-1 bg-primary/10 border border-primary/20 rounded-full flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px] text-primary" style={{fontVariationSettings: "'FILL' 1"}}>psychology</span>
                  <span className="text-[10px] font-black text-primary uppercase tracking-widest">AI Intelligence</span>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-8">
                {/* Visual Preview */}
                <div className="w-full md:w-48 shrink-0">
                  <div className="relative group aspect-[3/4] md:h-64 rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                    {extractedData.thumbnail ? (
                      <img 
                        src={extractedData.thumbnail} 
                        alt="Preview" 
                        className="w-full h-full object-cover transition duration-700 group-hover:scale-110" 
                        referrerPolicy="no-referrer" 
                      />
                    ) : (
                      <div className="w-full h-full bg-surface-container-highest flex items-center justify-center">
                        <span className="material-symbols-outlined text-4xl text-outline opacity-20">movie</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                  
                  <div className="mt-4 flex items-center justify-between px-1">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-secondary"></span>
                      <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">{extractedData.platform}</span>
                    </div>
                    <span className="text-[10px] font-bold text-primary">{getDaysLabel(extractedData.deadline)}</span>
                  </div>
                </div>

                {/* Edit Form */}
                <div className="flex-1 space-y-6">
                  <div>
                    <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2.5 block px-1">Task Objective</label>
                    <textarea
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      rows={2}
                      className="w-full bg-white/5 border border-white/5 focus:border-primary/30 rounded-2xl px-5 py-4 focus:ring-0 text-on-surface font-headline font-bold text-lg outline-none transition-all resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2.5 block px-1">Priority Level</label>
                      <div className="flex p-1 bg-white/5 rounded-2xl border border-white/5">
                        {(['high', 'medium', 'low'] as const).map((p) => (
                          <button
                            key={p}
                            onClick={() => setSelectedPriority(p)}
                            className={`flex-1 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                              selectedPriority === p
                                ? (p === 'high' ? 'bg-error text-white shadow-lg shadow-error/20' : 
                                   p === 'medium' ? 'bg-warning text-black shadow-lg shadow-warning/20' : 
                                   'bg-secondary text-black shadow-lg shadow-secondary/20')
                                : 'text-on-surface-variant hover:text-on-surface'
                            }`}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2.5 block px-1">Deadline</label>
                      <div className="h-[46px] flex items-center justify-center bg-white/5 rounded-2xl border border-white/5 font-bold text-xs text-on-surface">
                        {format(new Date(extractedData.deadline), 'MMM dd, yyyy')}
                      </div>
                    </div>
                  </div>

                  {extractedData.caption && (
                    <div>
                      <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2.5 block px-1">Extracted Context</label>
                      <div 
                        onClick={() => setExpandedCaption(!expandedCaption)}
                        className={`group cursor-pointer p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-white/10 transition-all ${expandedCaption ? 'ring-1 ring-primary/20' : ''}`}
                      >
                        <p className={`text-on-surface-variant text-xs leading-relaxed italic transition-all ${expandedCaption ? '' : 'line-clamp-2'}`}>
                          "{extractedData.caption}"
                        </p>
                        <div className="mt-2 flex justify-end">
                          <span className="material-symbols-outlined text-[16px] text-outline opacity-40 group-hover:opacity-100">
                            {expandedCaption ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-10 pt-8 border-t border-white/5 flex flex-col md:flex-row gap-4">
                <button
                  onClick={() => setExtractedData(null)}
                  className="flex-1 py-5 bg-white/5 hover:bg-white/10 text-on-surface font-black text-xs uppercase tracking-[0.2em] rounded-2xl transition-all"
                >
                  Discard
                </button>
                <button
                  onClick={handleConfirmTask}
                  className="flex-[2] py-5 bg-gradient-to-r from-secondary to-[#4ade80] text-surface-container-lowest font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-secondary/10 hover:shadow-secondary/20 hover:-translate-y-1 active:translate-y-0 transition-all"
                >
                  Deploy to Pipeline
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success View */}
      {generatedTask && (
        <div className="animate-scale-in text-center space-y-8 pt-4">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-secondary/20 blur-3xl rounded-full animate-pulse"></div>
            <div className="relative w-24 h-24 rounded-full bg-secondary/10 border border-secondary/20 flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined text-5xl text-secondary" style={{fontVariationSettings: "'FILL' 1"}}>check_circle</span>
            </div>
          </div>
          
          <div>
            <h2 className="font-headline text-3xl font-bold mb-2">Operation Successful</h2>
            <p className="text-on-surface-variant text-sm max-w-sm mx-auto">
              The task "{generatedTask.title}" has been integrated into your active workflow.
            </p>
          </div>

          <div className="glass-card rounded-3xl p-6 border border-white/5 max-w-sm mx-auto flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0">
              {generatedTask.thumbnail ? (
                <img src={generatedTask.thumbnail} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary">task</span>
                </div>
              )}
            </div>
            <div className="text-left overflow-hidden">
              <p className="text-[9px] font-black text-primary uppercase tracking-widest mb-1">Queued Task</p>
              <p className="font-bold text-sm truncate">{generatedTask.title}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase ${
                  generatedTask.priority === 'high' ? 'bg-error/20 text-error' :
                  generatedTask.priority === 'medium' ? 'bg-warning/20 text-warning' : 'bg-secondary/20 text-secondary'
                }`}>
                  {generatedTask.priority}
                </span>
                <span className="text-[9px] text-outline font-medium">Earn +5 Tokens</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              setGeneratedTask(null);
              setShowSuccess(false);
            }}
            className="px-10 py-4 bg-white/5 hover:bg-white/10 text-on-surface font-black text-xs uppercase tracking-[0.2em] rounded-2xl transition-all border border-white/5"
          >
            Add Another Inspiration
          </button>
        </div>
      )}
    </div>
  );
}
