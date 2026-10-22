import React from 'react';
import { Search, Film, Tv, Clapperboard, Sparkles, User } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';

export const Navbar: React.FC = () => {
  const { route, navigate, totalSaved } = useApp();
  const { user, isAuthenticated } = useAuth();

  const navLinks = [
    { label: 'Home', path: '/', icon: Film },
    { label: 'Movies', path: '/movies', icon: Clapperboard },
    { label: 'Shows', path: '/series', icon: Tv },
    { label: 'Anime', path: '/anime', icon: Sparkles },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#1f1f26] bg-[#09090b]/85 backdrop-blur-md transition-colors">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <div className="flex items-center gap-8">
          <button
            type="button"
            onClick={() => navigate('/')}
            aria-label="watchlyn Home"
            className="group flex items-center gap-2 cursor-pointer focus:outline-none"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#e50914] to-red-800 text-white shadow-lg shadow-red-950/50 group-hover:scale-105 transition-transform">
              <Film className="h-5 w-5" />
            </div>
            <div className="flex items-center">
              <span className="text-xl sm:text-2xl font-black tracking-tight text-white lowercase">
                watch<span className="text-[#e50914]">lyn</span>
              </span>
            </div>
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive =
                link.path === '/'
                  ? route.pathname === '/'
                  : route.pathname.startsWith(link.path);

              return (
                <button
                  key={link.path}
                  type="button"
                  onClick={() => navigate(link.path)}
                  className={`relative flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors cursor-pointer ${
                    isActive
                      ? 'text-white bg-zinc-800/80 shadow-inner'
                      : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/40'
                  }`}
                >
                  <span>{link.label}</span>
                  {isActive && (
                    <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-[#e50914]" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right Actions: Search + Account */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <button
            type="button"
            onClick={() => navigate('/search')}
            aria-label="Open search"
            className="flex items-center gap-2 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800/80 px-3.5 py-2 text-xs sm:text-sm text-zinc-300 hover:text-white transition-all hover:border-zinc-700 cursor-pointer min-h-[40px]"
          >
            <Search className="h-4 w-4 text-zinc-400" />
            <span className="hidden sm:inline">What would you like to watch?</span>
            <span className="sm:hidden font-medium">Search</span>
            <kbd className="hidden lg:inline rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400 font-mono">
              /
            </kbd>
          </button>

          {/* Desktop & Tablet Account Button */}
          <button
            type="button"
            onClick={() => navigate('/account')}
            aria-label={isAuthenticated ? `${user?.name}'s Account` : 'Sign In'}
            className={`relative flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs sm:text-sm font-semibold transition-all border cursor-pointer min-h-[40px] ${
              route.pathname.startsWith('/account')
                ? 'bg-zinc-800 border-[#e50914] text-white shadow'
                : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-300 hover:text-white'
            }`}
          >
            {isAuthenticated && user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="h-6 w-6 rounded-full object-cover border border-zinc-700"
              />
            ) : (
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-800 text-zinc-400">
                <User className="h-3.5 w-3.5" />
              </div>
            )}
            <span className="hidden sm:inline max-w-[100px] truncate">
              {isAuthenticated ? user?.name : 'Sign In'}
            </span>

            {/* Red badge for saved lists items */}
            {totalSaved > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-[#e50914] px-1 text-[9px] font-bold text-white shadow-md ring-2 ring-zinc-950">
                {totalSaved > 99 ? '99+' : totalSaved}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
