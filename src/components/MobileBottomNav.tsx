import React from 'react';
import { Home, Clapperboard, Tv, Sparkles, User } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';

export const MobileBottomNav: React.FC = () => {
  const { route, navigate, totalSaved } = useApp();
  const { user, isAuthenticated } = useAuth();

  const tabs = [
    { label: 'Home', path: '/', icon: Home },
    { label: 'Movies', path: '/movies', icon: Clapperboard },
    { label: 'Shows', path: '/series', icon: Tv },
    { label: 'Anime', path: '/anime', icon: Sparkles },
    {
      label: 'Account',
      path: '/account',
      icon: User,
      isAccount: true,
      badge: totalSaved > 0 ? totalSaved : undefined,
    },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-[#1f1f26] bg-[#09090b]/95 backdrop-blur-lg px-1 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-1.5"
    >
      <div className="grid grid-cols-5 items-center">
        {tabs.map((tab) => {
          const isActive =
            tab.path === '/'
              ? route.pathname === '/'
              : route.pathname.startsWith(tab.path);

          const Icon = tab.icon;

          return (
            <button
              key={tab.path}
              type="button"
              onClick={() => navigate(tab.path)}
              aria-label={tab.label}
              className={`relative flex min-h-[48px] flex-col items-center justify-center gap-1 rounded-xl py-1 transition-all ${
                isActive ? 'text-[#e50914]' : 'text-zinc-400 active:text-zinc-200'
              }`}
            >
              <div className="relative">
                {tab.isAccount && isAuthenticated && user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className={`h-5 w-5 rounded-full object-cover border transition-transform ${
                      isActive ? 'border-[#e50914] scale-110' : 'border-zinc-700'
                    }`}
                  />
                ) : (
                  <Icon className={`h-5 w-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                )}

                {tab.badge !== undefined && (
                  <span className="absolute -top-1.5 -right-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#e50914] px-1 text-[9px] font-bold text-white shadow">
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-semibold tracking-tight ${isActive ? 'text-white' : ''}`}>
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute top-0.5 h-0.5 w-6 rounded-full bg-[#e50914]" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
