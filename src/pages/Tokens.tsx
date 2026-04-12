import { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { format } from 'date-fns';

function AnimatedCounter({ value, duration = 1000 }: { value: number; duration?: number }) {
  const [displayValue, setDisplayValue] = useState(0);
  const startTime = useRef<number | null>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    const animate = (timestamp: number) => {
      if (!startTime.current) startTime.current = timestamp;
      const progress = Math.min((timestamp - startTime.current) / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.floor(easeOut * value));

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [value, duration]);

  return <>{isNaN(displayValue) ? 0 : displayValue}</>;
}

export default function Tokens() {
  const stats = useStore(state => state.stats);
  const tasks = useStore(state => state.tasks);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const weeklyGoal = 7;
  const weeklyCompleted = stats.weeklyCompletedTasks ?? 0;
  const weeklyProgress = Math.min((weeklyCompleted / weeklyGoal) * 100, 100);

  // Earning history from notifications
  const earningNotifications = tasks
    .filter(t => t.status === 'completed')
    .sort((a, b) => (b.completedAt ? new Date(b.completedAt).getTime() : 0) - (a.completedAt ? new Date(a.completedAt).getTime() : 0))
    .slice(0, 5);

  return (
    <>
      {/* Hero Token Counter */}
      <section className="relative mb-12 animate-fade-in-up">
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-primary/20 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="absolute -bottom-12 right-0 w-48 h-48 bg-secondary/10 blur-[100px] rounded-full pointer-events-none"></div>

        <div
          className={`glass-card p-10 rounded-lg flex flex-col items-center justify-center text-center overflow-hidden relative border border-outline-variant/10 transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
            <span className="material-symbols-outlined text-9xl text-secondary" style={{fontVariationSettings: "'FILL' 1"}}>toll</span>
          </div>
          <p className="font-headline text-sm font-bold uppercase tracking-[0.2em] text-on-surface-variant mb-4">Total Tokens</p>
          <div className="flex items-center gap-4 mb-2">
            <span className="material-symbols-outlined text-6xl md:text-8xl text-secondary animate-pulse" style={{fontVariationSettings: "'FILL' 1"}}>toll</span>
            <h1 className="text-7xl md:text-9xl font-headline font-black text-on-surface tracking-tighter">
              <AnimatedCounter value={stats.totalTokens} duration={1200} />
            </h1>
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              onClick={() => window.location.href = '/tasks'}
              className="bg-gradient-to-r from-primary to-primary-dim text-on-primary px-8 py-3 rounded-full font-bold text-sm shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
            >
              Earn More
            </button>
            <button
              onClick={() => window.location.href = '/shop'}
              className="bg-surface-container-highest text-on-surface px-8 py-3 rounded-full font-bold text-sm border border-outline-variant/15 hover:bg-surface-bright transition-all"
            >
              Withdraw
            </button>
          </div>
        </div>
      </section>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className={`bg-surface-container-low p-6 rounded-lg flex flex-col gap-1 animate-fade-in-up stagger-1 ${isVisible ? '' : 'opacity-0'}`}>
          <span className="text-on-surface-variant text-xs font-bold uppercase tracking-widest">This Week</span>
          <div className="flex items-end justify-between">
            <span className="text-3xl font-headline font-bold text-secondary">{stats.weeklyCompletedTasks}</span>
            <span className="text-sm text-on-surface-variant">tasks</span>
          </div>
          <div className="h-1.5 w-full bg-surface-container-highest rounded-full mt-3 overflow-hidden">
            <div
              className="h-full bg-secondary rounded-full transition-all duration-1000"
              style={{ width: `${weeklyProgress}%` }}
            />
          </div>
          <span className="text-[10px] text-on-surface-variant mt-1">{Math.round(weeklyProgress)}% of weekly goal ({weeklyGoal} tasks)</span>
        </div>

        <div className={`bg-surface-container-low p-6 rounded-lg flex flex-col gap-1 animate-fade-in-up stagger-2 ${isVisible ? '' : 'opacity-0'}`}>
          <span className="text-on-surface-variant text-xs font-bold uppercase tracking-widest">This Week</span>
          <div className="flex items-end justify-between">
            <span className="text-3xl font-headline font-bold text-primary">{stats.weeklyTokenEarnings ?? 0}</span>
            <span className="text-sm text-on-surface-variant">tokens earned</span>
          </div>
          <div className="h-1.5 w-full bg-surface-container-highest rounded-full mt-3 overflow-hidden">
            <div className="h-full bg-primary w-full" />
          </div>
          <span className="text-[10px] text-on-surface-variant mt-1">+{stats.weeklyTokenEarnings} tokens this week</span>
        </div>

        <div className={`bg-surface-container-low p-6 rounded-lg flex flex-col gap-1 animate-fade-in-up stagger-3 ${isVisible ? '' : 'opacity-0'}`}>
          <span className="text-on-surface-variant text-xs font-bold uppercase tracking-widest">All Time</span>
          <div className="flex items-end justify-between">
            <span className="text-3xl font-headline font-bold text-tertiary">{stats.lifetimeCompletedTasks ?? 0}</span>
            <span className="text-sm text-on-surface-variant">tasks completed</span>
          </div>
          <div className="flex gap-1 mt-3">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-1.5 flex-1 rounded-full bg-surface-container-highest"
              />
            ))}
          </div>
          <span className="text-[10px] text-on-surface-variant mt-1">Lifetime productivity</span>
        </div>
      </div>

      {/* Weekly Progress */}
      <section className="mb-12 animate-fade-in-up stagger-2">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-headline font-extrabold text-on-surface tracking-tight">Weekly Goal</h2>
          <span className="px-4 py-1 bg-surface-container-highest rounded-full text-xs font-bold text-primary border border-primary/20">
            {stats.weeklyCompletedTasks ?? 0} / {weeklyGoal} tasks
          </span>
        </div>
        <div className="glass-card p-8 rounded-lg border border-outline-variant/10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-secondary text-2xl" style={{fontVariationSettings: "'FILL' 1"}}>toll</span>
              <div>
                <p className="font-headline font-bold text-on-surface">7 Tasks This Week</p>
                <p className="text-xs text-on-surface-variant">Complete 7 tasks to hit your weekly target</p>
              </div>
            </div>
            <span className="text-3xl font-headline font-black text-primary">{Math.round(weeklyProgress)}%</span>
          </div>
          <div className="h-4 bg-surface-container-highest rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${weeklyProgress}%` }}
            />
          </div>
          {weeklyProgress >= 100 && (
            <div className="mt-4 flex items-center gap-2 text-secondary animate-scale-in">
              <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>celebration</span>
              <span className="font-bold text-sm">Weekly goal achieved!</span>
            </div>
          )}
        </div>
      </section>

      {/* Earning History */}
      <section className="animate-fade-in-up stagger-3">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-headline font-extrabold text-on-surface tracking-tight">Recent Earnings</h2>
        </div>
        <div className="space-y-3">
          {earningNotifications.length === 0 ? (
            <div className="text-center py-12 text-on-surface-variant">
              <span className="material-symbols-outlined text-4xl mb-4 block opacity-30">toll</span>
              <p className="text-sm">Complete tasks to see your earning history here.</p>
            </div>
          ) : (
            earningNotifications.map((task, idx) => (
              <div
                key={task.id}
                className="flex items-center justify-between p-4 bg-surface-container-low rounded-lg border border-outline-variant/5 hover:bg-surface-container transition-colors animate-fade-in-up"
                style={{ animationDelay: `${idx * 0.05}s` }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-secondary" style={{fontVariationSettings: "'FILL' 1"}}>check_circle</span>
                  </div>
                  <div>
                    <p className="font-headline font-bold text-on-surface">{task.title}</p>
                    <p className="text-xs text-on-surface-variant">
                      {task.completedAt ? format(new Date(task.completedAt), 'MMM d, yyyy') : 'Completed'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-secondary font-bold">
                  <span className="material-symbols-outlined text-sm" style={{fontVariationSettings: "'FILL' 1"}}>toll</span>
                  <span>+{task.tokens}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </>
  );
}