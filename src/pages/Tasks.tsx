import { useState } from 'react';
import { useStore } from '../store/useStore';
import { format, differenceInDays } from 'date-fns';

export default function Tasks() {
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('pending');
  const [completingId, setCompletingId] = useState<string | null>(null);
  const tasks = useStore(state => state.tasks);
  const markComplete = useStore(state => state.markTaskComplete);
  const stats = useStore(state => state.stats);

  const getUrgencyClass = (deadline: string) => {
    const daysUntil = differenceInDays(new Date(deadline), new Date());
    if (daysUntil <= 2) return 'urgency-critical';
    if (daysUntil <= 7) return 'urgency-warning';
    return 'urgency-normal';
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

  const handleComplete = (taskId: string) => {
    setCompletingId(taskId);
    setTimeout(() => {
      markComplete(taskId);
      setCompletingId(null);
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
    <div className="animate-fade-in-up">
      <div className="mb-8">
        <span className="text-secondary font-label text-xs font-bold uppercase tracking-[0.2em]">Productivity Engine</span>
        <h2 className="text-4xl md:text-5xl font-headline font-extrabold tracking-tight mt-2 text-on-surface">Your Tasks</h2>
        <p className="text-on-surface-variant text-sm mt-2">{stats.weeklyCompletedTasks} of {stats.weeklyTotalTasks} completed this week</p>
      </div>

      <div className="flex gap-2 mb-10 overflow-x-auto pb-2 no-scrollbar">
        {(['all', 'pending', 'completed'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-6 py-2 rounded-full text-sm font-bold transition-all capitalize ${
              filter === f
                ? 'bg-primary text-on-primary shadow-lg shadow-primary/20'
                : 'bg-surface-container-highest text-on-surface-variant hover:bg-surface-bright'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Two-Column Layout for Pending Tasks */}
      {filter !== 'completed' && filteredTasks.filter(t => t.status === 'pending').length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
          {/* Primary Task - Left Column */}
          {primaryTask && (
            <div className="lg:col-span-2 animate-scale-in">
              <div className="mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(163,166,255,0.8)]"></span>
                <span className="text-xs font-bold uppercase tracking-widest text-primary">Primary Task</span>
              </div>
              <div className={`relative bg-surface-container-high rounded-xl p-6 border-2 transition-all duration-500 ${getUrgencyClass(primaryTask.deadline)} ${differenceInDays(new Date(primaryTask.deadline), new Date()) <= 2 ? 'animate-urgent-pulse' : ''}`}>
                <div className="absolute top-4 right-4">
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${primaryTask.priority === 'high' ? 'priority-high' : primaryTask.priority === 'medium' ? 'priority-medium' : 'priority-low'}`}>
                    {getPriorityLabel(primaryTask.priority)}
                  </span>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-primary text-2xl" style={{fontVariationSettings: "'FILL' 1"}}>bolt</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-headline font-bold text-on-surface mb-2 leading-tight pr-20">{primaryTask.title}</h3>
                    <div className="flex items-center gap-3 text-on-surface-variant text-sm">
                      <span className="material-symbols-outlined text-sm">schedule</span>
                      <span>{format(new Date(primaryTask.deadline), 'MMM d, yyyy')}</span>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                        differenceInDays(new Date(primaryTask.deadline), new Date()) <= 2
                          ? 'bg-[rgba(255,110,132,0.15)] text-[#ff6e84]'
                          : 'bg-secondary/10 text-secondary'
                      }`}>
                        {getDaysLabel(primaryTask.deadline)}
                      </span>
                      <span className="text-xs text-on-surface-variant">+{primaryTask.tokens} tokens</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => handleComplete(primaryTask.id)}
                    disabled={completingId === primaryTask.id}
                    className={`flex-1 py-3 bg-primary text-on-primary rounded-xl font-bold text-sm shadow-lg shadow-primary/25 transition-all active:scale-95 flex items-center justify-center gap-2 ${
                      completingId === primaryTask.id ? 'animate-slide-out-right' : ''
                    }`}
                  >
                    <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>check_circle</span>
                    Mark Complete
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Queue - Right Column */}
          <div className="lg:col-span-3">
            <div className="mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-secondary shadow-[0_0_8px_rgba(107,255,143,0.6)]"></span>
              <span className="text-xs font-bold uppercase tracking-widest text-secondary">Queue ({queueTasks.length})</span>
            </div>
            <div className="space-y-3">
              {queueTasks.map((task, idx) => (
                <div
                  key={task.id}
                  className={`bg-surface-container-high rounded-xl p-4 border transition-all duration-300 hover:bg-surface-container-highest group ${getUrgencyClass(task.deadline)} stagger-${Math.min(idx + 1, 5)} animate-fade-in-up`}
                  style={{ animationDelay: `${idx * 0.05}s` }}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      task.priority === 'high' ? 'bg-[rgba(255,110,132,0.1)]' :
                      task.priority === 'medium' ? 'bg-[rgba(255,200,66,0.1)]' : 'bg-secondary/10'
                    }`}>
                      <span className={`material-symbols-outlined ${
                        task.priority === 'high' ? 'text-[#ff6e84]' :
                        task.priority === 'medium' ? 'text-[#ffc842]' : 'text-secondary'
                      }`}>task_alt</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-headline font-bold text-on-surface leading-tight truncate">{task.title}</h4>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-on-surface-variant">{getDaysLabel(task.deadline)}</span>
                        <span className="text-xs text-secondary font-bold">+{task.tokens} tokens</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleComplete(task.id)}
                      disabled={completingId === task.id}
                      className={`px-4 py-2 bg-primary/10 text-primary rounded-lg font-bold text-xs hover:bg-primary hover:text-on-primary transition-all active:scale-95 ${
                        completingId === task.id ? 'animate-slide-out-right' : ''
                      }`}
                    >
                      Done
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Completed Tasks */}
      {filter === 'all' && completedTasks.length > 0 && (
        <div className="mt-8">
          <div className="mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-outline-variant shadow-[0_0_6px_rgba(163,166,255,0.4)]"></span>
            <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Completed ({completedTasks.length})</span>
          </div>
          <div className="space-y-3">
            {completedTasks.map((task, idx) => (
              <div
                key={task.id}
                className="bg-surface-container-low/50 rounded-xl p-4 border border-outline-variant/10 opacity-70 animate-fade-in-up"
                style={{ animationDelay: `${idx * 0.05}s` }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-secondary" style={{fontVariationSettings: "'FILL' 1"}}>check_circle</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-headline font-bold text-on-surface-variant line-through decoration-secondary/40 leading-tight">{task.title}</h4>
                    <span className="text-xs text-on-surface-variant/70">Completed {task.completedAt ? format(new Date(task.completedAt), 'MMM d, yyyy') : ''}</span>
                  </div>
                  <span className="text-secondary font-bold text-sm">+{task.tokens}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed only filter */}
      {filter === 'completed' && completedTasks.length > 0 && (
        <div className="space-y-3">
          {completedTasks.map((task, idx) => (
            <div
              key={task.id}
              className="bg-surface-container-low/50 rounded-xl p-4 border border-outline-variant/10 opacity-70 animate-fade-in-up"
              style={{ animationDelay: `${idx * 0.05}s` }}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-secondary" style={{fontVariationSettings: "'FILL' 1"}}>check_circle</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-headline font-bold text-on-surface-variant line-through decoration-secondary/40 leading-tight">{task.title}</h4>
                  <span className="text-xs text-on-surface-variant/70">Completed {task.completedAt ? format(new Date(task.completedAt), 'MMM d, yyyy') : ''}</span>
                </div>
                <span className="text-secondary font-bold text-sm">+{task.tokens}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {filteredTasks.length === 0 && (
        <div className="text-center py-20 animate-scale-in">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-surface-container-high flex items-center justify-center">
            <span className="material-symbols-outlined text-5xl text-secondary" style={{fontVariationSettings: "'FILL' 1"}}>task_alt</span>
          </div>
          <h3 className="text-2xl font-headline font-bold text-on-surface mb-2">All caught up!</h3>
          <p className="text-on-surface-variant text-sm max-w-md mx-auto">High performance breeds high rewards. Add a new reel to keep the momentum going.</p>
          <button
            onClick={() => window.location.href = '/add-reel'}
            className="mt-6 px-8 py-3 bg-primary text-on-primary rounded-full font-bold text-sm shadow-lg shadow-primary/25 hover:bg-primary-dim transition-all active:scale-95"
          >
            Add New Task
          </button>
        </div>
      )}
    </div>
  );
}