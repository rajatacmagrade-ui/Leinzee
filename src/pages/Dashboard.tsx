import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { format, subDays } from 'date-fns';

export default function Dashboard() {
  const navigate = useNavigate();

  // Use individual selectors to avoid Zustand re-render loop
  const tasks         = useStore(s => s.tasks);
  const stats         = useStore(s => s.stats);
  const currentStreak = useStore(s => s.currentStreak);
  const instagramUser = useStore(s => s.instagramUser);

  // Build last-7-days chart data using simple date-string comparison
  const weeklyData = [6, 5, 4, 3, 2, 1, 0].map(daysAgo => {
    const date    = subDays(new Date(), daysAgo);
    const dateStr = format(date, 'yyyy-MM-dd');
    const count   = tasks.filter(
      t => t.status === 'completed' && t.completedAt &&
           format(new Date(t.completedAt), 'yyyy-MM-dd') === dateStr
    ).length;
    return { day: format(date, 'EEE'), dateStr, count, isToday: daysAgo === 0 };
  });

  const maxCount = Math.max(...weeklyData.map(d => d.count), 1);
  const completionRate = stats.weeklyTotalTasks > 0
    ? Math.round((stats.weeklyCompletedTasks / stats.weeklyTotalTasks) * 100)
    : 0;

  const recentTasks = tasks
    .filter(t => t.status === 'pending')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  return (
    <div className="animate-fade-in pb-20">
      {/* ── Header ───────────────────────────────────────── */}
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="animate-fade-in-up">
          <span className="text-primary font-label text-[10px] uppercase tracking-[0.3em] font-black mb-3 block opacity-80">
            System Performance
          </span>
          <h2 className="text-4xl md:text-5xl font-headline font-black text-white tracking-tighter leading-none mb-4">
            Command{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary italic">
              Center
            </span>
          </h2>
          <p className="text-on-surface-variant text-sm max-w-md">
            Welcome back,{' '}
            <span className="text-white font-bold">@{instagramUser || 'User'}</span>. Pipeline
            running at{' '}
            <span className="text-secondary font-bold">{completionRate}% efficiency</span>.
          </p>
        </div>

        <div className="animate-scale-in">
          <div className="glass-card rounded-2xl px-6 py-4 border border-white/5 shadow-2xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center">
              <span
                className="material-symbols-outlined text-secondary text-2xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                local_fire_department
              </span>
            </div>
            <div>
              <p className="text-[10px] font-black text-on-surface-variant/50 uppercase tracking-widest leading-none mb-1">
                Current Streak
              </p>
              <span className="text-2xl font-black font-headline text-white">
                {currentStreak} Days
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* ── Stats row ────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-10">
        {[
          { label: 'Total Tokens',     value: stats.totalTokens,            icon: 'stars',        color: 'text-primary',   bg: 'bg-primary/10'   },
          { label: 'Completed Tasks',  value: stats.lifetimeCompletedTasks, icon: 'task_alt',     color: 'text-secondary', bg: 'bg-secondary/10' },
          { label: 'Weekly Earnings',  value: stats.weeklyTokenEarnings,    icon: 'payments',     color: 'text-[#ffc842]', bg: 'bg-[#ffc842]/10' },
          { label: 'Tier',             value: stats.totalTokens > 5000 ? 'Elite' : 'Active', icon: 'military_tech', color: 'text-white', bg: 'bg-white/5' },
        ].map((stat, i) => (
          <div
            key={stat.label}
            className={`glass-card rounded-3xl p-5 border border-white/5 hover:border-white/10 transition-all stagger-${i + 1} animate-fade-in-up`}
          >
            <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center mb-4`}>
              <span
                className={`material-symbols-outlined ${stat.color} text-xl`}
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                {stat.icon}
              </span>
            </div>
            <p className="text-[10px] font-black text-on-surface-variant/50 uppercase tracking-widest mb-1">
              {stat.label}
            </p>
            <h4 className="text-2xl font-black font-headline text-white">{stat.value}</h4>
          </div>
        ))}
      </div>

      {/* ── Chart + Circle ───────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Bar chart */}
        <div className="lg:col-span-2 glass-card rounded-[2.5rem] p-8 md:p-10 border border-white/5">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-xl font-headline font-black text-white">Task Momentum</h3>
              <p className="text-xs text-on-surface-variant">Completions over last 7 days</p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-primary"></span>
              <span className="text-[10px] font-bold text-on-surface-variant uppercase">Completed</span>
            </div>
          </div>

          <div className="flex items-end justify-between h-44 gap-2 md:gap-4 px-2">
            {weeklyData.map(data => (
              <div key={data.dateStr} className="flex-1 flex flex-col items-center gap-3 group/bar">
                <div className="relative w-full flex flex-col justify-end items-center h-36">
                  {/* Hover tooltip */}
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-primary text-on-primary text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                    {data.count} tasks
                  </div>
                  <div
                    className={`w-full max-w-[36px] rounded-t-xl transition-all duration-700 ease-out ${
                      data.isToday
                        ? 'bg-gradient-to-t from-primary to-secondary shadow-[0_0_20px_rgba(163,166,255,0.3)]'
                        : 'bg-white/5 group-hover/bar:bg-white/10'
                    }`}
                    style={{
                      height: `${(data.count / maxCount) * 100}%`,
                      minHeight: data.count > 0 ? '8px' : '0',
                    }}
                  />
                </div>
                <span
                  className={`text-[10px] font-black uppercase tracking-widest ${
                    data.isToday ? 'text-primary' : 'text-on-surface-variant/40'
                  }`}
                >
                  {data.day}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Circular progress */}
        <div className="glass-card rounded-[2.5rem] p-8 border border-white/5 flex flex-col items-center justify-center text-center">
          <h3 className="text-xl font-headline font-black text-white mb-8">Weekly Target</h3>

          <div className="relative w-44 h-44 mb-8">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
              <circle
                cx="50" cy="50" r="40"
                fill="transparent"
                stroke="url(#grad-dash)"
                strokeWidth="8"
                strokeDasharray={`${completionRate * 2.513} 251.3`}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
              <defs>
                <linearGradient id="grad-dash" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#a3a6ff" />
                  <stop offset="100%" stopColor="#6bff8f" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-black font-headline text-white">{completionRate}%</span>
              <span className="text-[9px] font-black text-on-surface-variant/50 uppercase tracking-widest">Efficiency</span>
            </div>
          </div>

          <p className="text-sm text-on-surface-variant leading-relaxed px-2">
            <span className="text-white font-bold">{stats.weeklyCompletedTasks}</span> of{' '}
            <span className="text-white font-bold">{stats.weeklyTotalTasks}</span> weekly targets cleared.
          </p>
        </div>
      </div>

      {/* ── Bottom row ───────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        {/* Recent tasks */}
        <div className="glass-card rounded-[2.5rem] p-8 border border-white/5">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-headline font-black text-white">Recent Enqueues</h3>
            <button
              onClick={() => navigate('/tasks')}
              className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline"
            >
              View All
            </button>
          </div>

          <div className="space-y-4">
            {recentTasks.length > 0 ? (
              recentTasks.map(task => (
                <div
                  key={task.id}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all"
                >
                  <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-primary/10">
                    {task.thumbnail ? (
                      <img src={task.thumbnail} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-primary">task</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-white truncate">{task.title}</h4>
                    <p className="text-[10px] text-on-surface-variant opacity-60">
                      Added {format(new Date(task.createdAt), 'MMM d, h:mm a')}
                    </p>
                  </div>
                  <span
                    className={`text-[9px] font-black px-2 py-1 rounded uppercase tracking-widest ${
                      task.priority === 'high'   ? 'bg-[rgba(255,110,132,0.2)] text-[#ff6e84]' :
                      task.priority === 'medium' ? 'bg-[rgba(255,200,66,0.2)] text-[#ffc842]'  :
                                                   'bg-secondary/20 text-secondary'
                    }`}
                  >
                    {task.priority}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-10 opacity-40">
                <span className="material-symbols-outlined text-3xl block mb-2">inbox</span>
                <p className="text-sm italic">No pending tasks. Great work!</p>
              </div>
            )}
          </div>
        </div>

        {/* Tips panel */}
        <div className="bg-gradient-to-br from-primary/20 via-secondary/10 to-transparent rounded-[2.5rem] p-8 border border-white/5 relative overflow-hidden flex flex-col">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[80px] pointer-events-none" />
          <h3 className="text-xl font-headline font-black text-white mb-6">Performance Tip</h3>
          <div className="flex-1">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-primary text-2xl">lightbulb</span>
            </div>
            <p className="text-lg font-headline font-bold text-white mb-4 leading-tight">
              Morning-queued tasks have a 40% higher completion rate.
            </p>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Extract reels early and let the AI structure your day before it gets busy.
            </p>
          </div>

          <button
            onClick={() => navigate('/add-reel')}
            className="mt-8 w-full py-4 bg-white text-[#060e20] rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl"
          >
            New Extraction
          </button>
        </div>
      </div>
    </div>
  );
}
