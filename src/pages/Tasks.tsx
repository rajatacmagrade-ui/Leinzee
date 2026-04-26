import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { format, differenceInDays } from 'date-fns';
import { Task } from '../types';

export default function Tasks() {
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('pending');
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const tasks = useStore(state => state.tasks);
  const markComplete = useStore(state => state.markTaskComplete);
  const stats = useStore(state => state.stats);

  useEffect(() => {
    if (selectedTask) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedTask]);

  const getUrgencyClass = (deadline: string) => {
    const daysUntil = differenceInDays(new Date(deadline), new Date());
    if (daysUntil <= 2) return 'urgency-critical cursor-pointer';
    if (daysUntil <= 7) return 'urgency-warning cursor-pointer';
    return 'urgency-normal cursor-pointer';
  };

  const getDaysLabel = (deadline: string) => {
    const days = differenceInDays(new Date(deadline), new Date());
    if (days < 0) return `${Math.abs(days)} days overdue`;
    if (days === 0) return 'Due today';
    if (days === 1) return 'Due tomorrow';
    return `Due in ${days} days`;
  };

  const filteredTasks = tasks
    .filter(task => {
      if (filter === 'all') return true;
      return task.status === filter;
    })
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());

  const primaryTask = filteredTasks.find(t => t.status === 'pending');
  const queueTasks = filteredTasks.filter(t => t.status === 'pending' && t.id !== primaryTask?.id);
  const completedTasks = filteredTasks.filter(t => t.status === 'completed');

  const handleComplete = (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation();
    setCompletingId(taskId);
    setTimeout(() => {
      markComplete(taskId);
      setCompletingId(null);
      if (selectedTask?.id === taskId) setSelectedTask(null);
    }, 350);
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high': return 'URGENT';
      case 'medium': return 'SOON';
      default: return 'NORMAL';
    }
  };

  return (
    <div className="animate-fade-in-up pb-20">
      <div className="mb-8">
        <span className="text-secondary font-label text-[10px] uppercase tracking-[0.3em] font-black mb-3 block opacity-80">Productivity Engine</span>
        <h2 className="text-4xl md:text-5xl font-headline font-extrabold tracking-tight mt-2 text-on-surface">Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary italic">Tasks</span></h2>
        <p className="text-on-surface-variant text-sm mt-4">{stats.weeklyCompletedTasks} of {stats.weeklyTotalTasks} targets neutralized this week</p>
      </div>

      <div className="flex gap-2 mb-10 overflow-x-auto pb-2 no-scrollbar">
        {(['all', 'pending', 'completed'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              filter === f
                ? 'bg-primary text-on-primary shadow-lg shadow-primary/20'
                : 'bg-white/5 text-on-surface-variant hover:bg-white/10'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Two-Column Layout for Pending Tasks */}
      {filter !== 'completed' && filteredTasks.filter(t => t.status === 'pending').length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mb-8">
          {/* Primary Task - Left Column */}
          {primaryTask && (
            <div className="lg:col-span-2 animate-scale-in">
              <div className="mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(163,166,255,0.8)]"></span>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Priority Focus</span>
              </div>
              <div 
                onClick={() => setSelectedTask(primaryTask)}
                className={`group relative glass-card rounded-[2rem] p-8 border-2 transition-all duration-500 hover:border-primary/40 ${getUrgencyClass(primaryTask.deadline)} ${differenceInDays(new Date(primaryTask.deadline), new Date()) <= 2 ? 'animate-urgent-pulse border-error/40' : 'border-white/5'}`}
              >
                <div className="absolute top-6 right-6">
                  <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full ${primaryTask.priority === 'high' ? 'bg-error/20 text-error' : primaryTask.priority === 'medium' ? 'bg-warning/20 text-warning' : 'bg-secondary/20 text-secondary'}`}>
                    {getPriorityLabel(primaryTask.priority)}
                  </span>
                </div>

                <div className="flex flex-col gap-6">
                  <div className="w-full aspect-video rounded-2xl bg-white/5 overflow-hidden border border-white/5 shadow-2xl relative">
                    {primaryTask.thumbnail ? (
                      <img src={primaryTask.thumbnail} alt="Thumbnail" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-primary text-4xl opacity-20" style={{fontVariationSettings: "'FILL' 1"}}>bolt</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-2xl font-headline font-black text-white mb-3 leading-tight group-hover:text-primary transition-colors">{primaryTask.title}</h3>
                    <div className="flex items-center gap-6 mb-6">
                      <div className="flex items-center gap-2 text-on-surface-variant text-xs font-bold">
                        <span className="material-symbols-outlined text-sm text-primary">event</span>
                        <span>{format(new Date(primaryTask.deadline), 'MMM d, yyyy')}</span>
                      </div>
                      <div className="flex items-center gap-2 text-on-surface-variant text-xs font-bold">
                        <span className="material-symbols-outlined text-sm text-secondary">stars</span>
                        <span>+{primaryTask.tokens}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-2 flex gap-3">
                  <button
                    onClick={(e) => handleComplete(e, primaryTask.id)}
                    disabled={completingId === primaryTask.id}
                    className={`flex-1 py-4 bg-primary text-on-primary rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-primary/25 transition-all hover:-translate-y-1 active:translate-y-0 flex items-center justify-center gap-2 ${
                      completingId === primaryTask.id ? 'animate-slide-out-right' : ''
                    }`}
                  >
                    <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>check_circle</span>
                    Execute Target
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Queue - Right Column */}
          <div className="lg:col-span-3">
            <div className="mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-secondary shadow-[0_0_8px_rgba(107,255,143,0.6)]"></span>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary">Backlog ({queueTasks.length})</span>
            </div>
            <div className="space-y-4">
              {queueTasks.map((task, idx) => (
                <div
                  key={task.id}
                  onClick={() => setSelectedTask(task)}
                  className={`glass-card cursor-pointer rounded-2xl p-4 border border-white/5 transition-all duration-300 hover:bg-white/5 hover:border-white/10 group stagger-${Math.min(idx + 1, 5)} animate-fade-in-up`}
                  style={{ animationDelay: `${idx * 0.05}s` }}
                >
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-12 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0 border border-white/5 bg-white/5 shadow-lg">
                      {task.thumbnail ? (
                        <img src={task.thumbnail} alt="Thumbnail" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                      ) : (
                        <span className="material-symbols-outlined text-outline opacity-40">task</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-headline font-bold text-white leading-tight truncate text-base mb-1 group-hover:text-primary transition-colors">{task.title}</h4>
                      <div className="flex items-center gap-4">
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest ${
                          task.priority === 'high' ? 'bg-error/20 text-error' :
                          task.priority === 'medium' ? 'bg-warning/20 text-warning' : 'bg-secondary/20 text-secondary'
                        }`}>
                          {task.priority}
                        </span>
                        <span className="text-[10px] font-bold text-on-surface-variant flex items-center gap-1.5">
                          <span className="w-1 h-1 rounded-full bg-outline"></span>
                          {getDaysLabel(task.deadline)}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleComplete(e, task.id)}
                      disabled={completingId === task.id}
                      className={`w-10 h-10 bg-white/5 text-on-surface-variant rounded-xl flex items-center justify-center hover:bg-primary hover:text-on-primary transition-all active:scale-90 ${
                        completingId === task.id ? 'animate-slide-out-right' : ''
                      }`}
                    >
                      <span className="material-symbols-outlined text-lg">check</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Completed Tasks Container */}
      {(filter === 'all' || filter === 'completed') && completedTasks.length > 0 && (
        <div className="mt-12">
          <div className="mb-6 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-outline-variant/40"></span>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/60">Archived Targets ({completedTasks.length})</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {completedTasks.map((task, idx) => (
              <div
                key={task.id}
                onClick={() => setSelectedTask(task)}
                className="bg-white/[0.02] cursor-pointer rounded-2xl p-4 border border-white/5 opacity-60 hover:opacity-100 hover:bg-white/[0.04] transition-all animate-fade-in-up flex items-center gap-4"
                style={{ animationDelay: `${idx * 0.03}s` }}
              >
                <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-secondary text-lg" style={{fontVariationSettings: "'FILL' 1"}}>check_circle</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-headline font-bold text-white line-through decoration-secondary/40 leading-tight truncate">{task.title}</h4>
                  <p className="text-[9px] font-bold text-on-surface-variant/50 uppercase tracking-widest mt-1">
                    Completed {task.completedAt ? format(new Date(task.completedAt), 'MMM d') : ''}
                  </p>
                </div>
                <div className="text-secondary font-black font-headline text-sm">+{task.tokens}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Task Detail Modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xl animate-fade-in" onClick={() => setSelectedTask(null)}></div>
          
          <div className="relative w-full max-w-2xl bg-[#060e20] rounded-[2.5rem] overflow-hidden border border-white/10 shadow-[0_30px_100px_rgba(0,0,0,0.8)] animate-scale-in flex flex-col">
            <button 
              onClick={() => setSelectedTask(null)}
              className="absolute top-6 right-6 z-10 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md text-white flex items-center justify-center hover:bg-white/10 transition-all"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <div className="aspect-video w-full relative">
              {selectedTask.thumbnail ? (
                <img src={selectedTask.thumbnail} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-surface-container-highest flex items-center justify-center">
                  <span className="material-symbols-outlined text-6xl text-outline opacity-20">movie</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#060e20] via-transparent to-transparent"></div>
              <div className="absolute bottom-6 left-8">
                <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full ${
                  selectedTask.status === 'completed' ? 'bg-secondary/20 text-secondary' : 'bg-primary/20 text-primary'
                }`}>
                  {selectedTask.status}
                </span>
              </div>
            </div>

            <div className="p-8 md:p-12">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-3xl font-headline font-black text-white leading-tight flex-1">{selectedTask.title}</h2>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-8 mb-10">
                <div>
                  <p className="text-[9px] font-black text-on-surface-variant/50 uppercase tracking-widest mb-2">Target Date</p>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-lg">event</span>
                    <span className="text-sm font-bold text-white">{format(new Date(selectedTask.deadline), 'MMM dd, yyyy')}</span>
                  </div>
                </div>
                <div>
                  <p className="text-[9px] font-black text-on-surface-variant/50 uppercase tracking-widest mb-2">Priority</p>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${
                      selectedTask.priority === 'high' ? 'bg-error' :
                      selectedTask.priority === 'medium' ? 'bg-warning' : 'bg-secondary'
                    }`}></span>
                    <span className="text-sm font-bold text-white uppercase tracking-widest">{selectedTask.priority}</span>
                  </div>
                </div>
                <div className="hidden md:block">
                  <p className="text-[9px] font-black text-on-surface-variant/50 uppercase tracking-widest mb-2">Earnings</p>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary text-lg" style={{fontVariationSettings: "'FILL' 1"}}>stars</span>
                    <span className="text-sm font-bold text-white">+{selectedTask.tokens} Tokens</span>
                  </div>
                </div>
              </div>

              {selectedTask.caption && (
                <div className="mb-10">
                  <p className="text-[9px] font-black text-on-surface-variant/50 uppercase tracking-widest mb-3">Context & Notes</p>
                  <div className="bg-white/5 rounded-2xl p-5 border border-white/5">
                    <p className="text-sm text-on-surface-variant leading-relaxed italic">"{selectedTask.caption}"</p>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4">
                {selectedTask.sourceUrl && (
                  <a 
                    href={selectedTask.sourceUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] bg-white/5 text-white hover:bg-white/10 transition-all border border-white/10 flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-base">link</span>
                    View Source Reel
                  </a>
                )}
                {selectedTask.status === 'pending' && (
                  <button
                    onClick={(e) => handleComplete(e, selectedTask.id)}
                    className="flex-[1.5] py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] bg-gradient-to-r from-primary to-secondary text-on-primary hover:-translate-y-1 hover:shadow-primary/20 transition-all flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-base" style={{fontVariationSettings: "'FILL' 1"}}>check_circle</span>
                    Complete Task
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredTasks.length === 0 && (
        <div className="text-center py-20 animate-scale-in">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-white/5 flex items-center justify-center border border-white/5">
            <span className="material-symbols-outlined text-5xl text-secondary" style={{fontVariationSettings: "'FILL' 1"}}>task_alt</span>
          </div>
          <h3 className="text-2xl font-headline font-black text-white mb-2">All caught up!</h3>
          <p className="text-on-surface-variant text-sm max-w-xs mx-auto opacity-70">High performance breeds high rewards. Add a new reel to keep the momentum going.</p>
          <button
            onClick={() => window.location.href = '/add-reel'}
            className="mt-10 px-10 py-4 bg-primary text-on-primary rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-primary/25 hover:bg-primary-dim transition-all active:scale-95"
          >
            Add New Inspiration
          </button>
        </div>
      )}
    </div>
  );
}