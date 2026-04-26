import { NavLink } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useState } from 'react';
import logoUrl from '../../assets/leinzee only symbol (fevicon).png';

export default function Sidebar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { stats, notifications, instagramUser, setInstagramUser } = useStore();
  const totalTokens = stats.totalTokens;
  const unreadCount = notifications.filter(n => !n.read).length;

  const handleDisconnect = () => {
    setInstagramUser(null);
  };

  type NavItem = {
    to: string;
    icon: string;
    label: string;
    badge?: number;
  };

  type MenuSection = {
    title: string;
    items: NavItem[];
  };

  const menuSections: MenuSection[] = [
    {
      title: 'General',
      items: [
        { to: '/dashboard', icon: 'dashboard', label: 'Performance' },
        { to: '/add-reel', icon: 'add_circle', label: 'Convert Reel' },
        { to: '/tasks', icon: 'checklist', label: 'Daily Tasks' },
        { to: '/calendar', icon: 'calendar_month', label: 'Schedule' },
      ]
    },
    {
      title: 'Activity',
      items: [
        { to: '/notifications', icon: 'notifications', label: 'Alerts', badge: unreadCount },
        { to: '/lien-score', icon: 'leaderboard', label: 'Ranking' },
      ]
    },
    {
      title: 'Growth',
      items: [
        { to: '/tokens', icon: 'stars', label: 'Wallet' },
        { to: '/shop', icon: 'redeem', label: 'Redeem Rewards' },
      ]
    }
  ];

  const mobileNavItems: NavItem[] = [
    { to: '/dashboard', icon: 'dashboard', label: 'Home' },
    { to: '/add-reel', icon: 'add_circle', label: 'Convert' },
    { to: '/tasks', icon: 'checklist', label: 'Tasks' },
    { to: '/shop', icon: 'redeem', label: 'Rewards' },
  ];

  return (
    <>
      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-50 bg-[#060e20]/80 backdrop-blur-xl flex items-center justify-between px-6 h-16 border-b border-white/5">
        <div className="flex items-center gap-4">
          <button
            className="md:hidden text-[#a3a6ff] hover:bg-[#192540] transition-colors p-2 rounded-full active:scale-95"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
          <div className="flex items-center gap-2">
            <img src={logoUrl} alt="Leinzeee Logo" className="w-8 h-8 object-contain drop-shadow-[0_0_10px_rgba(163,166,255,0.4)]" />
            <h1 className="text-lg font-black text-[#a3a6ff] tracking-tight font-headline hidden sm:block">
              LEINZEEE
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-[#192540] rounded-full pl-2 pr-4 py-1 flex items-center gap-2 border border-secondary/20 shadow-inner">
            <div className="w-6 h-6 rounded-full bg-secondary/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-secondary text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
            </div>
            <span className="text-[10px] font-bold font-label uppercase tracking-widest text-secondary">{totalTokens}</span>
          </div>
          <div className="w-10 h-10 rounded-xl overflow-hidden border border-outline-variant/30 bg-surface-container-highest flex items-center justify-center text-on-surface-variant font-bold shadow-lg">
            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${instagramUser || 'User'}`} alt="Avatar" />
          </div>
        </div>
      </header>

      {/* Side Navigation (Web) */}
      <aside className={`fixed inset-y-0 left-0 w-[260px] z-[60] bg-[#060e20] flex-col p-6 shadow-[20px_0_60px_rgba(0,0,0,0.5)] transition-transform duration-300 md:flex ${mobileMenuOpen ? 'translate-x-0 flex' : '-translate-x-full md:translate-x-0 hidden'}`}>
        {/* Header in sidebar */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={logoUrl} alt="Leinzeee Logo" className="w-8 h-8 object-contain" />
            <h1 className="text-lg font-black text-white tracking-tight font-headline">
              LEINZEEE
            </h1>
          </div>
          <button className="md:hidden text-on-surface-variant p-2 hover:bg-surface-container-high rounded-full" onClick={() => setMobileMenuOpen(false)}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Navigation Sections */}
        <div className="space-y-8 overflow-y-auto custom-scrollbar flex-1 -mx-2 px-2">
          {menuSections.map((section) => (
            <div key={section.title} className="space-y-2">
              <h3 className="px-4 text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-[0.2em] mb-3">
                {section.title}
              </h3>
              <nav className="flex flex-col gap-1">
                {section.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `group relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-headline text-sm font-semibold tracking-tight ${
                        isActive
                          ? 'text-[#a3a6ff] bg-[#192540] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]'
                          : 'text-on-surface-variant hover:text-white hover:bg-white/5'
                      }`
                    }
                  >
                    <span className="material-symbols-outlined text-lg opacity-70 group-hover:opacity-100 transition-opacity" style={item.badge && item.badge > 0 ? { fontVariationSettings: "'FILL' 1" } : {}}>
                      {item.icon}
                    </span>
                    <span className="flex-1">{item.label}</span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="bg-[#ff6e84] text-white min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[9px] font-black shadow-[0_0_10px_rgba(255,110,132,0.4)]">
                        {item.badge}
                      </span>
                    )}
                    {/* Active dot */}
                    <div className="absolute right-2 w-1.5 h-1.5 rounded-full bg-primary opacity-0 scale-0 transition-all duration-300 group-[.active]:opacity-100 group-[.active]:scale-100" />
                  </NavLink>
                ))}
              </nav>
            </div>
          ))}
        </div>

        {/* Bottom profile section */}
        <div className="mt-8 pt-6 border-t border-white/5">
          {instagramUser ? (
            <div className="bg-[#192540]/30 rounded-2xl p-4 border border-white/5 hover:border-primary/20 transition-all duration-300">
               <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#f09433] via-[#e6683c] to-[#bc1888] flex items-center justify-center text-white shrink-0 shadow-lg">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>photo_camera</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] text-on-surface-variant uppercase tracking-widest font-black opacity-50">Creator</p>
                  <p className="text-xs font-bold text-white truncate">@{instagramUser}</p>
                </div>
                <button 
                  onClick={handleDisconnect}
                  className="p-2 text-on-surface-variant hover:text-error transition-colors"
                  title="Disconnect"
                >
                  <span className="material-symbols-outlined text-lg">logout</span>
                </button>
              </div>
            </div>
          ) : (
            <NavLink to="/login" className="flex items-center gap-3 px-4 py-4 rounded-2xl bg-primary text-on-primary font-bold text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">
              <span className="material-symbols-outlined">login</span>
              <span>Connect Instagram</span>
            </NavLink>
          )}
        </div>
      </aside>

      {/* Overlay for mobile menu */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-[55] md:hidden backdrop-blur-md animate-fade-in"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* BottomNavBar (Mobile) */}
      <nav className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm flex justify-around items-center px-2 py-2 bg-[#192540]/80 backdrop-blur-2xl z-50 rounded-2xl border border-white/10 shadow-[0_15px_40px_rgba(0,0,0,0.4)]">
        {mobileNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center py-2 transition-all duration-300 relative ${
                isActive
                  ? 'text-primary'
                  : 'text-on-surface-variant'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className="material-symbols-outlined text-2xl transition-transform duration-300 group-active:scale-90" style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}>
                  {item.icon}
                </span>
                <span className="text-[8px] font-black uppercase tracking-tighter mt-1">
                  {item.label}
                </span>
                {isActive && (
                  <div className="absolute -bottom-1 w-1 h-1 rounded-full bg-primary shadow-[0_0_5px_#a3a6ff]" />
                )}
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute top-1 right-1/4 bg-error text-white w-4 h-4 flex items-center justify-center rounded-full text-[8px] font-black border-2 border-[#192540]">
                    {item.badge}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </>
  );
}