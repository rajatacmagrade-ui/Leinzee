import { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, differenceInDays } from 'date-fns';
import { useStore } from '../store/useStore';

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const tasks = useStore(state => state.tasks);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const getDayTasks = (day: Date) => tasks.filter(t => {
    const taskDate = new Date(t.deadline);
    return isSameDay(taskDate, day);
  });

  const getTaskHeatIntensity = (day: Date) => {
    const count = getDayTasks(day).filter(t => t.status === 'pending').length;
    if (count === 0) return 0;
    if (count === 1) return 0.3;
    if (count === 2) return 0.6;
    return 1;
  };

  const groupedTasks = {
    overdue: tasks.filter(t => t.status === 'pending' && differenceInDays(new Date(t.deadline), new Date()) < 0),
    today: tasks.filter(t => t.status === 'pending' && differenceInDays(new Date(t.deadline), new Date()) === 0),
    thisWeek: tasks.filter(t => {
      const diff = differenceInDays(new Date(t.deadline), new Date());
      return t.status === 'pending' && diff > 0 && diff <= 7;
    }),
    later: tasks.filter(t => {
      const diff = differenceInDays(new Date(t.deadline), new Date());
      return t.status === 'pending' && diff > 7;
    }),
  };

  const selectedDayTasks = selectedDay ? getDayTasks(selectedDay) : [];

  return (
    <>
      <section className="flex items-end justify-between mb-8">
        <div className="space-y-1">
          <span className="text-sm font-label uppercase tracking-widest text-primary font-bold">Time Management</span>
          <h2 className="text-4xl font-headline font-extrabold tracking-tight text-on-surface">{format(currentDate, 'MMMM yyyy')}</h2>
        </div>
        <div className="flex gap-2">
          <button
            onClick={prevMonth}
            className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center hover:bg-surface-container-highest transition-colors active:scale-90 border border-outline-variant/10 text-on-surface-variant"
          >
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-4 py-2 bg-primary text-on-primary rounded-full font-bold text-xs uppercase tracking-wider hover:bg-primary-dim transition-colors"
          >
            Today
          </button>
          <button
            onClick={nextMonth}
            className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center hover:bg-surface-container-highest transition-colors active:scale-90 border border-outline-variant/10 text-on-surface-variant"
          >
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
      </section>

      {/* Calendar Grid */}
      <section className="bg-surface-container-low rounded-lg p-6 mb-8 shadow-xl border border-outline-variant/5">
        <div className="grid grid-cols-7 mb-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center py-2 text-xs font-bold uppercase tracking-widest text-on-surface-variant/60">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {/* Empty cells for days before month start */}
          {Array.from({ length: monthStart.getDay() }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}
          {days.map((day) => {
            const dayTasks = getDayTasks(day);
            const pendingCount = dayTasks.filter(t => t.status === 'pending').length;
            const isToday = isSameDay(day, new Date());
            const isSelected = selectedDay && isSameDay(day, selectedDay);
            const intensity = getTaskHeatIntensity(day);

            return (
              <div
                key={day.toISOString()}
                onClick={() => setSelectedDay(isSameDay(day, selectedDay ?? new Date()) ? null : day)}
                className={`aspect-square flex items-center justify-center relative group cursor-pointer rounded-lg transition-all ${
                  isToday ? 'bg-primary-container/20' : 'hover:bg-surface-container-highest'
                } ${isSelected ? 'ring-2 ring-primary bg-surface-container-high' : ''}`}
              >
                <span className={`z-10 text-sm font-medium ${isToday ? 'font-bold text-primary' : 'text-on-surface-variant group-hover:text-on-surface'}`}>
                  {format(day, 'd')}
                </span>

                {pendingCount > 0 && (
                  <div
                    className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-0.5"
                    style={{ opacity: 0.4 + intensity * 0.6 }}
                  >
                    {Array.from({ length: Math.min(pendingCount, 3) }).map((_, i) => (
                      <div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full"
                        style={{
                          backgroundColor: pendingCount >= 3 ? '#ff6e84' : pendingCount >= 2 ? '#ffc842' : '#6bff8f',
                        }}
                      />
                    ))}
                  </div>
                )}

                {isToday && (
                  <div className="absolute inset-0 rounded-lg border-2 border-primary/50 animate-glow pointer-events-none" />
                )}
              </div>
            );
          })}
        </div>

        {/* Selected Day Detail */}
        {selectedDay && (
          <div className="mt-6 pt-6 border-t border-outline-variant/20 animate-slide-down">
            <h4 className="text-sm font-bold uppercase tracking-widest text-primary mb-3">
              {format(selectedDay, 'EEEE, MMMM d')}
            </h4>
            {selectedDayTasks.length === 0 ? (
              <p className="text-on-surface-variant text-sm italic">No tasks due this day.</p>
            ) : (
              <div className="space-y-2">
                {selectedDayTasks.map(task => (
                  <div
                    key={task.id}
                    className={`p-3 rounded-lg bg-surface-container-high border-l-4 flex items-center gap-3 ${
                      task.priority === 'high' ? 'border-l-[#ff6e84]' :
                      task.priority === 'medium' ? 'border-l-[#ffc842]' : 'border-l-[#6bff8f]'
                    }`}
                  >
                    {task.thumbnail && (
                      <div className="w-8 h-8 rounded-md overflow-hidden flex-shrink-0 border border-outline-variant/10">
                        <img src={task.thumbnail} alt="Thumbnail" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                    )}
                    <div className="flex-1 flex items-center justify-between min-w-0">
                      <span className="font-medium text-on-surface text-sm truncate">{task.title}</span>
                      <span className="text-secondary text-xs font-bold whitespace-nowrap ml-2">+{task.tokens}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Task Groups */}
      <section className="space-y-8">
        {/* Overdue */}
        {groupedTasks.overdue.length > 0 && (
          <div className="animate-fade-in-up">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-3 h-3 rounded-full bg-[#ff6e84] shadow-[0_0_10px_rgba(255,110,132,0.6)]"></span>
              <h3 className="text-xl font-headline font-bold text-on-surface">Overdue</h3>
              <span className="px-3 py-1 bg-[rgba(255,110,132,0.15)] text-[#ff6e84] text-xs font-bold rounded-full">{groupedTasks.overdue.length}</span>
            </div>
            <div className="space-y-3">
              {groupedTasks.overdue.map((task) => (
                <div key={task.id} className="bg-surface-container-high p-4 rounded-lg border border-[rgba(255,110,132,0.3)] animate-urgent-pulse">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0 border border-outline-variant/10">
                      {task.thumbnail ? (
                        <img src={task.thumbnail} alt="Thumbnail" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <span className="material-symbols-outlined text-[#ff6e84]">warning</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-headline font-bold text-on-surface leading-tight">{task.title}</h4>
                      <span className="text-xs text-[#ff6e84]">{differenceInDays(new Date(task.deadline), new Date()) * -1} days overdue</span>
                    </div>
                    <span className="text-secondary font-bold text-sm">+{task.tokens}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Today */}
        {groupedTasks.today.length > 0 && (
          <div className="animate-fade-in-up stagger-1">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-3 h-3 rounded-full bg-primary shadow-[0_0_10px_rgba(163,166,255,0.6)]"></span>
              <h3 className="text-xl font-headline font-bold text-on-surface">Today</h3>
              <span className="px-3 py-1 bg-primary/15 text-primary text-xs font-bold rounded-full">{groupedTasks.today.length}</span>
            </div>
            <div className="space-y-3">
              {groupedTasks.today.map((task) => (
                <div key={task.id} className="bg-surface-container-high p-4 rounded-lg border border-primary/20">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0 border border-outline-variant/10">
                      {task.thumbnail ? (
                        <img src={task.thumbnail} alt="Thumbnail" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <span className="material-symbols-outlined text-primary" style={{fontVariationSettings: "'FILL' 1"}}>bolt</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-headline font-bold text-on-surface leading-tight">{task.title}</h4>
                      <span className="text-xs text-on-surface-variant">Due today</span>
                    </div>
                    <span className="text-secondary font-bold text-sm">+{task.tokens}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* This Week */}
        {groupedTasks.thisWeek.length > 0 && (
          <div className="animate-fade-in-up stagger-2">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-3 h-3 rounded-full bg-[#ffc842] shadow-[0_0_10px_rgba(255,200,66,0.6)]"></span>
              <h3 className="text-xl font-headline font-bold text-on-surface">This Week</h3>
              <span className="px-3 py-1 bg-[rgba(255,200,66,0.15)] text-[#ffc842] text-xs font-bold rounded-full">{groupedTasks.thisWeek.length}</span>
            </div>
            <div className="space-y-3">
              {groupedTasks.thisWeek.map((task) => (
                <div key={task.id} className="bg-surface-container-high p-4 rounded-lg border border-[rgba(255,200,66,0.2)]">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0 border border-outline-variant/10">
                      {task.thumbnail ? (
                        <img src={task.thumbnail} alt="Thumbnail" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <span className="material-symbols-outlined text-[#ffc842]">schedule</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-headline font-bold text-on-surface leading-tight">{task.title}</h4>
                      <span className="text-xs text-on-surface-variant">{format(new Date(task.deadline), 'MMM d')}</span>
                    </div>
                    <span className="text-secondary font-bold text-sm">+{task.tokens}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Later */}
        {groupedTasks.later.length > 0 && (
          <div className="animate-fade-in-up stagger-3">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-3 h-3 rounded-full bg-secondary shadow-[0_0_10px_rgba(107,255,143,0.6)]"></span>
              <h3 className="text-xl font-headline font-bold text-on-surface">Later</h3>
              <span className="px-3 py-1 bg-secondary/15 text-secondary text-xs font-bold rounded-full">{groupedTasks.later.length}</span>
            </div>
            <div className="space-y-3">
              {groupedTasks.later.map((task) => (
                <div key={task.id} className="bg-surface-container-high p-4 rounded-lg border border-secondary/10">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0 border border-outline-variant/10">
                      {task.thumbnail ? (
                        <img src={task.thumbnail} alt="Thumbnail" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <span className="material-symbols-outlined text-secondary">event</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-headline font-bold text-on-surface leading-tight">{task.title}</h4>
                      <span className="text-xs text-on-surface-variant">{format(new Date(task.deadline), 'MMM d')}</span>
                    </div>
                    <span className="text-secondary font-bold text-sm">+{task.tokens}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All caught up */}
        {tasks.filter(t => t.status === 'pending').length === 0 && (
          <div className="text-center py-16 animate-scale-in">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-surface-container-high flex items-center justify-center">
              <span className="material-symbols-outlined text-4xl text-secondary" style={{fontVariationSettings: "'FILL' 1"}}>celebration</span>
            </div>
            <h3 className="text-2xl font-headline font-bold text-on-surface mb-2">All caught up!</h3>
            <p className="text-on-surface-variant text-sm">No pending tasks. Enjoy your day!</p>
          </div>
        )}
      </section>
    </>
  );
}