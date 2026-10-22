import React from 'react';
import { Film, Mail, Heart } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Footer: React.FC = () => {
  const { navigate } = useApp();

  return (
    <footer className="mt-16 border-t border-[#1f1f26] bg-[#09090b] pb-24 md:pb-12 pt-12 text-zinc-400">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-[#1f1f26]">
          {/* Logo & Slogan */}
          <div className="flex flex-col items-center md:items-start gap-2">
            <div
              onClick={() => navigate('/')}
              className="flex items-center gap-2 cursor-pointer"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#e50914] text-white">
                <Film className="h-4 w-4" />
              </div>
              <span className="text-xl font-black text-white lowercase tracking-tight">
                watch<span className="text-[#e50914]">lyn</span>
              </span>
            </div>
            <p className="text-xs text-zinc-400 text-center md:text-left">
              The premier mobile-first platform for discovering and streaming movies & TV shows.
            </p>
          </div>

          {/* Quick links */}
          <div className="flex flex-wrap justify-center gap-6 text-xs font-semibold text-zinc-300">
            <button onClick={() => navigate('/')} className="hover:text-white cursor-pointer">
              Home
            </button>
            <button onClick={() => navigate('/movies')} className="hover:text-white cursor-pointer">
              Movies
            </button>
            <button onClick={() => navigate('/series')} className="hover:text-white cursor-pointer">
              TV Shows
            </button>
            <button onClick={() => navigate('/lists')} className="hover:text-white cursor-pointer">
              My Lists
            </button>
            <button onClick={() => navigate('/search')} className="hover:text-white cursor-pointer">
              Search
            </button>
          </div>
        </div>

        {/* Legal Disclaimer */}
        <div className="pt-6 flex flex-col items-center justify-center gap-3 text-center">
          <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed">
            Watchlyn does not host, store, or distribute any media files. All content is sourced from third-party providers. contact@watchlyn.com
          </p>
          <div className="flex items-center gap-1 text-[11px] text-zinc-400">
            <span>Powered by TMDB API</span>
            <span>•</span>
            <a
              href="mailto:contact@watchlyn.com"
              className="flex items-center gap-1 text-[#e50914] hover:underline"
            >
              <Mail className="h-3 w-3" />
              <span>contact@watchlyn.com</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
