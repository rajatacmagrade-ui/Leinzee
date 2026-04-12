import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';

export default function LienScore() {
  const stats = useStore(state => state.stats);
  const currentStreak = useStore(state => state.currentStreak);
  const getScore = useStore(state => state.getScore);
  const getTier = useStore(state => state.getTier);
  const getWeeklyData = useStore(state => state.getWeeklyData);

  const [animatedScore, setAnimatedScore] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const score = getScore();
  const tier = getTier();
  const weeklyData = getWeeklyData();

  useEffect(() => {
    setIsVisible(true);
    // Animate score counting up
    const duration = 1500;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 4);
      setAnimatedScore(Math.floor(easeOut * score));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [score]);

  const getTierColor = () => {
    switch (tier) {
      case 'Getting Started': return '#a3aac4';
      case 'Building Momentum': return '#a3a6ff';
      case 'On Fire': return '#ffc842';
      case 'Elite': return '#6bff8f';
      case 'Legendary': return '#ff6e84';
      default: return '#a3a6ff';
    }
  };

  const tierColor = getTierColor();

  // SVG gauge calculations
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const progress = (animatedScore / 100) * circumference;
  const dashOffset = circumference - progress;

  const maxBarHeight = 80;
  const maxCount = Math.max(...weeklyData.map(d => d.count), 1);

  return (
    <>
      <section className={`max-w-4xl mx-auto flex flex-col items-center mt-10 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        {/* Animated SVG Gauge */}
        <div className="relative w-72 h-72 md:w-96 md:h-96 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 280 280">
            {/* Background circle */}
            <circle
              cx="140"
              cy="140"
              r={radius}
              fill="none"
              stroke="#192540"
              strokeWidth="16"
            />
            {/* Progress circle */}
            <circle
              cx="140"
              cy="140"
              r={radius}
              fill="none"
              stroke={tierColor}
              strokeWidth="16"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              className="transition-all duration-1000 ease-out"
              style={{
                filter: `drop-shadow(0 0 12px ${tierColor}40)`,
              }}
            />
          </svg>

          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-headline text-[5rem] md:text-[8rem] font-extrabold leading-none tracking-tighter text-on-surface">
              {animatedScore}
            </span>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm uppercase tracking-[0.2em] font-bold" style={{ color: tierColor }}>
                {tier}
              </span>
            </div>
          </div>

          {/* Ambient glow */}
          <div
            className="absolute inset-0 rounded-full blur-[60px] -z-10 transition-all duration-1000"
            style={{ backgroundColor: `${tierColor}20` }}
          />
        </div>

        {/* Stat Cards */}
        <div className="mt-12 w-full grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Current Streak */}
          <div className="bg-surface-container-low rounded-xl p-6 border border-outline-variant/10 animate-fade-in-up stagger-1">
            <div className="flex items-center justify-between mb-3">
              <span className="text-on-surface-variant text-[10px] font-bold uppercase tracking-widest">Current Streak</span>
              <div className="w-10 h-10 rounded-full bg-[rgba(255,110,132,0.1)] flex items-center justify-center">
                <span className="material-symbols-outlined text-[#ff6e84]" style={{fontVariationSettings: "'FILL' 1"}}>local_fire_department</span>
              </div>
            </div>
            <p className="text-3xl font-headline font-bold text-on-surface">
              {currentStreak} <span className="text-sm font-medium text-on-surface-variant">days</span>
            </p>
          </div>

          {/* Weekly Completion */}
          <div className="bg-surface-container-low rounded-xl p-6 border border-outline-variant/10 animate-fade-in-up stagger-2">
            <div className="flex items-center justify-between mb-3">
              <span className="text-on-surface-variant text-[10px] font-bold uppercase tracking-widest">Weekly Progress</span>
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary" style={{fontVariationSettings: "'FILL' 1"}}>check_circle</span>
              </div>
            </div>
            <p className="text-3xl font-headline font-bold text-on-surface">
              {stats.weeklyCompletedTasks}
              <span className="text-sm font-medium text-on-surface-variant"> / {stats.weeklyTotalTasks}</span>
            </p>
          </div>

          {/* All-Time Completions */}
          <div className="bg-surface-container-low rounded-xl p-6 border border-outline-variant/10 animate-fade-in-up stagger-3">
            <div className="flex items-center justify-between mb-3">
              <span className="text-on-surface-variant text-[10px] font-bold uppercase tracking-widest">All-Time</span>
              <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-secondary" style={{fontVariationSettings: "'FILL' 1"}}>emoji_events</span>
              </div>
            </div>
            <p className="text-3xl font-headline font-bold text-on-surface">
              {stats.lifetimeCompletedTasks}
              <span className="text-sm font-medium text-on-surface-variant"> tasks</span>
            </p>
          </div>
        </div>

        {/* Weekly Bar Chart */}
        <div className="mt-10 w-full bg-surface-container-low rounded-xl p-6 border border-outline-variant/10 animate-fade-in-up stagger-4">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-headline font-bold text-on-surface">Weekly Activity</h3>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-sm" style={{fontVariationSettings: "'FILL' 1"}}>toll</span>
              <span className="text-sm text-on-surface-variant">{stats.weeklyCompletedTasks} tasks completed</span>
            </div>
          </div>
          <div className="flex items-end justify-between gap-3 h-40 px-4">
            {weeklyData.map((d, i) => {
              const height = maxCount > 0 ? (d.count / maxCount) * maxBarHeight : 0;
              const isToday = i === new Date().getDay();

              return (
                <div key={d.day} className="flex flex-col items-center gap-2 flex-1">
                  <span className="text-[10px] text-on-surface-variant font-bold uppercase">{d.count}</span>
                  <div
                    className={`w-full rounded-t-lg transition-all duration-700 ease-out ${
                      isToday ? 'bg-primary' : 'bg-secondary/40'
                    }`}
                    style={{
                      height: `${height}px`,
                      minHeight: d.count > 0 ? '4px' : '0',
                      boxShadow: d.count > 0 && isToday ? `0 0 12px ${tierColor}60` : undefined,
                    }}
                  />
                  <span className={`text-[10px] font-bold uppercase ${isToday ? 'text-primary' : 'text-on-surface-variant'}`}>
                    {d.day}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tier Legend */}
        <div className="mt-10 w-full grid grid-cols-5 gap-2 animate-fade-in-up stagger-5">
          {['Getting Started', 'Building Momentum', 'On Fire', 'Elite', 'Legendary'].map((t, i) => {
            const colors = ['#a3aac4', '#a3a6ff', '#ffc842', '#6bff8f', '#ff6e84'];
            const range = [`${i * 20}-${i === 4 ? 100 : (i + 1) * 20}`];
            const isActive = tier === t;

            return (
              <div
                key={t}
                className={`p-3 rounded-lg text-center transition-all ${
                  isActive ? 'bg-surface-container-high border-2' : 'bg-surface-container-low border border-transparent'
                }`}
                style={{
                  borderColor: isActive ? colors[i] : undefined,
                  boxShadow: isActive ? `0 0 16px ${colors[i]}30` : undefined,
                }}
              >
                <div
                  className="w-3 h-3 rounded-full mx-auto mb-2"
                  style={{ backgroundColor: colors[i] }}
                />
                <p className="text-[9px] font-bold uppercase tracking-wider text-on-surface">{t}</p>
                <p className="text-[8px] text-on-surface-variant mt-1">{range}</p>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}