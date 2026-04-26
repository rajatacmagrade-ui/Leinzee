import { useStore } from '../store/useStore';
import { isToday, isYesterday, isThisWeek } from 'date-fns';

export default function Notifications() {
  const notifications = useStore(state => state.notifications);
  const markRead = useStore(state => state.markNotificationRead);
  const markAllRead = useStore(state => state.markAllNotificationsRead);

  const sortedNotifications = [...notifications].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const unreadCount = notifications.filter(n => !n.read).length;

  const groupNotifications = () => {
    const today: typeof sortedNotifications = [];
    const yesterday: typeof sortedNotifications = [];
    const thisWeek: typeof sortedNotifications = [];
    const older: typeof sortedNotifications = [];

    sortedNotifications.forEach(n => {
      const date = new Date(n.createdAt);
      if (isToday(date)) today.push(n);
      else if (isYesterday(date)) yesterday.push(n);
      else if (isThisWeek(date)) thisWeek.push(n);
      else older.push(n);
    });

    return { today, yesterday, thisWeek, older };
  };

  const grouped = groupNotifications();

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getNotificationIcon = (type: string, _read: boolean) => {
    switch (type) {
      case 'reward':
        return { icon: 'stars', filled: true, color: '#6bff8f' };
      case 'deadline':
        return { icon: 'schedule', filled: false, color: '#ffc842' };
      default:
        return { icon: 'notifications', filled: false, color: '#a3a6ff' };
    }
  };

  const renderNotificationItem = (notification: typeof sortedNotifications[0]) => {
    const { icon, filled, color } = getNotificationIcon(notification.type, notification.read);

    return (
      <div
        key={notification.id}
        onClick={() => markRead(notification.id)}
        className={`relative pl-8 py-4 transition-all cursor-pointer ${
          notification.read ? 'opacity-60' : ''
        }`}
      >
        {/* Timeline dot */}
        <div
          className={`absolute left-0 top-6 w-3 h-3 rounded-full transition-all ${
            notification.read ? 'bg-outline-variant' : ''
          }`}
          style={{ backgroundColor: !notification.read ? color : undefined }}
        >
          {!notification.read && (
            <span
              className="absolute inset-0 rounded-full animate-ping"
              style={{ backgroundColor: color, opacity: 0.5 }}
            />
          )}
        </div>

        {/* Unread pulse indicator */}
        {!notification.read && (
          <div className="absolute -left-1 top-6 w-5 h-5 rounded-full bg-primary/20 animate-pulse" />
        )}

        <div className="flex items-start gap-4">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{
              backgroundColor: notification.read ? 'rgba(25,37,64,0.6)' : `${color}15`,
            }}
          >
            <span
              className="material-symbols-outlined text-xl"
              style={{
                color: notification.read ? '#a3aac4' : color,
                fontVariationSettings: filled && !notification.read ? "'FILL' 1" : undefined,
              }}
            >
              {icon}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h3 className={`font-headline font-bold text-base ${
                notification.read ? 'text-on-surface-variant' : 'text-on-surface'
              }`}>
                {notification.title || (notification.type === 'reward' ? 'Reward Earned' : notification.type === 'deadline' ? 'Deadline Approaching' : 'System Update')}
              </h3>
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest whitespace-nowrap ml-2">
                {getTimeAgo(new Date(notification.createdAt))}
              </span>
            </div>
            <p className={`text-sm leading-relaxed ${
              notification.read ? 'text-on-surface-variant/70' : 'text-on-surface-variant'
            }`}>
              {notification.message}
            </p>
          </div>
        </div>
      </div>
    );
  };

  const renderGroup = (title: string, items: typeof sortedNotifications, color: string) => {
    if (items.length === 0) return null;

    return (
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-1 h-5 rounded-full" style={{ backgroundColor: color }} />
          <h3 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant">{title}</h3>
          <span className="text-xs text-on-surface-variant/60">{items.length}</span>
        </div>
        <div className="pl-4 border-l-2 border-outline-variant/20">
          {items.map(renderNotificationItem)}
        </div>
      </div>
    );
  };

  return (
    <>
      <header className="mb-10 relative flex items-start justify-between">
        <div>
          <span className="label-sm text-[10px] uppercase tracking-[0.2em] text-primary font-bold">Activity Feed</span>
          <h2 className="text-4xl md:text-5xl font-headline font-extrabold text-on-surface tracking-tighter mt-2">Notifications</h2>
        </div>
        <div className="flex items-center gap-4">
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="px-4 py-2 bg-surface-container-high rounded-full text-xs font-bold uppercase tracking-wider text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface transition-all"
            >
              Mark all read
            </button>
          )}
        </div>
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-primary/10 rounded-full blur-[100px] -z-10"></div>
      </header>

      <div className="flex flex-col gap-6">
        {sortedNotifications.length === 0 && (
          <div className="text-center py-20 animate-scale-in">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-surface-container-high flex items-center justify-center">
              <span className="material-symbols-outlined text-5xl text-outline-variant/30" style={{fontVariationSettings: "'FILL' 1"}}>notifications_none</span>
            </div>
            <h3 className="text-xl font-headline font-bold text-on-surface mb-2">No new updates</h3>
            <p className="text-on-surface-variant text-sm max-w-md mx-auto">You're all caught up! Complete tasks to earn rewards and notifications.</p>
          </div>
        )}

        {renderGroup('Today', grouped.today, '#a3a6ff')}
        {renderGroup('Yesterday', grouped.yesterday, '#6bff8f')}
        {renderGroup('This Week', grouped.thisWeek, '#ffc842')}
        {renderGroup('Older', grouped.older, '#a3aac4')}
      </div>


    </>
  );
}