import { NavLink } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useState } from 'react';

export default function Sidebar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const totalTokens = useStore(state => state.stats.totalTokens);
  const unreadCount = useStore(state => state.notifications.filter(n => !n.read).length);

  const navItems = [
    { to: '/add-reel', icon: 'add_circle', label: 'Add Reel' },
    { to: '/tasks', icon: 'checklist', label: 'Tasks' },
    { to: '/calendar', icon: 'calendar_month', label: 'Calendar' },
    { to: '/notifications', icon: 'notifications', label: 'Notifications', badge: unreadCount },
    { to: '/lien-score', icon: 'leaderboard', label: 'Lien Score' },
    { to: '/tokens', icon: 'stars', label: 'Tokens' },
    { to: '/shop', icon: 'shopping_bag', label: 'Shop' },
  ];

  const mobileNavItems = [
    { to: '/add-reel', icon: 'add_circle', label: 'Add' },
    { to: '/tasks', icon: 'checklist', label: 'Tasks' },
    { to: '/calendar', icon: 'calendar_month', label: 'Calendar' },
    { to: '/tokens', icon: 'toll', label: 'Tokens' },
  ];

  return (
    <>
      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-50 bg-[#060e20]/80 backdrop-blur-xl flex items-center justify-between px-6 h-16 shadow-none">
        <div className="flex items-center gap-4">
          <button
            className="md:hidden text-[#a3a6ff] hover:bg-[#192540] transition-colors p-2 rounded-full active:scale-95"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
          <h1 className="text-xl font-black text-[#a3a6ff] tracking-tighter font-headline hidden sm:block md:hidden lg:block hidden">
            Reel-to-Action
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Token Badge with subtle glow */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-secondary/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative bg-[#192540] rounded-full px-3 py-1.5 flex items-center gap-2 border border-secondary/20 transition-all duration-300 hover:border-secondary/40">
              <span className="material-symbols-outlined text-secondary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
              <span className="text-xs font-bold font-label uppercase tracking-widest text-[#a3a6ff]">{totalTokens}</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-outline-variant/30 bg-surface-container-highest flex items-center justify-center text-on-surface-variant font-bold">
            U
          </div>
        </div>
      </header>

      {/* Side Navigation (Web) */}
      <aside className={`fixed inset-y-0 left-0 w-[240px] z-[60] bg-[#060e20]/95 backdrop-blur-2xl flex-col p-6 gap-4 shadow-[20px_0_40px_rgba(0,0,0,0.4)] transition-transform duration-300 md:flex ${mobileMenuOpen ? 'translate-x-0 flex' : '-translate-x-full md:translate-x-0 hidden'}`}>
        {/* Glass morphism inner glow */}
        <div className="absolute inset-0 border-r border-white/5 pointer-events-none" />

        <div className="mb-4 flex items-center justify-between relative">
          <h2 className="font-headline text-sm font-semibold uppercase tracking-widest text-[#a3a6ff]">Menu</h2>
          <button className="md:hidden text-on-surface-variant p-1 hover:bg-surface-container-high rounded-full transition-colors" onClick={() => setMobileMenuOpen(false)}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <nav className="flex flex-col gap-1.5 relative">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-headline text-sm font-semibold uppercase tracking-widest ${
                  isActive
                    ? 'text-[#a3a6ff] bg-[#192540]/80'
                    : 'text-[#a3aac4] hover:text-[#6bff8f] hover:bg-[#192540]/40'
                }`
              }
            >
              {/* Active indicator bar */}
              {({ isActive }) => (
                <>
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full shadow-[0_0_12px_rgba(163,166,255,0.6)]" />
                  )}
                  <span className="material-symbols-outlined" style={item.badge && item.badge > 0 ? { fontVariationSettings: "'FILL' 1" } : {}}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="ml-auto bg-[#ff6e84] text-white w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold animate-pulse">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom section with stats */}
        <div className="mt-auto pt-6 border-t border-white/5 relative">
          <div className="bg-[#192540]/40 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>toll</span>
              </div>
              <div>
                <p className="text-[10px] text-on-surface-variant uppercase tracking-widest">Total Earned</p>
                <p className="text-lg font-headline font-bold text-on-surface">{totalTokens}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile menu */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 md:hidden backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* BottomNavBar (Mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full flex justify-around items-center px-4 pb-6 pt-3 bg-[#060e20]/90 backdrop-blur-lg z-50 rounded-t-[2rem] shadow-[0_-10px_30px_rgba(0,0,0,0.3)]">
        {mobileNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center transition-all duration-200 active:scale-90 ${
                isActive
                  ? 'text-secondary bg-[#192540] rounded-full px-6 py-2'
                  : 'text-[#a3aac4] hover:text-[#a3a6ff]'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className="material-symbols-outlined mb-1" style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}>
                  {item.icon}
                </span>
                <span className="font-label text-[10px] font-bold uppercase tracking-wider mt-0.5">
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </>
  );
}