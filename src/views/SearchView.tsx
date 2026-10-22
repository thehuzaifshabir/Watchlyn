import React, { useState, useEffect, useRef } from 'react';
import { Search as SearchIcon, X, Flame, Film, Tv, User, Clapperboard } from 'lucide-react';
import { MediaItem } from '../types';
import { searchMulti, fetchTrendingAll, getProfileUrl } from '../services/tmdb';
import { PosterCard } from '../components/PosterCard';
import { useApp } from '../context/AppContext';

export const SearchView: React.FC = () => {
  const { setActivePersonId } = useApp();
  const [query, setQuery] = useState<string>('');
  const [debouncedQuery, setDebouncedQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'all' | 'movie' | 'tv' | 'person'>('all');

  const [trendingResults, setTrendingResults] = useState<MediaItem[]>([]);
  const [searchResults, setSearchResults] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
    // Load trending today as default state
    fetchTrendingAll('day')
      .then(setTrendingResults)
      .catch((err) => console.error('Failed to load trending today:', err));
  }, []);

  // 300ms debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Execute live search
  useEffect(() => {
    if (!debouncedQuery) {
      setSearchResults([]);
      setIsLoading(false);
      return;
    }

    let isCancelled = false;
    setIsLoading(true);

    searchMulti(debouncedQuery, 1)
      .then((data) => {
        if (!isCancelled) {
          setSearchResults(data.results || []);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error('Search error:', err);
        if (!isCancelled) setIsLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [debouncedQuery]);

  // Filter results by active tab
  const filteredResults = searchResults.filter((item) => {
    if (activeTab === 'all') return true;
    return item.media_type === activeTab;
  });

  const handleClear = () => {
    setQuery('');
    setDebouncedQuery('');
    inputRef.current?.focus();
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 md:py-8 min-h-screen">
      {/* 1. Large Auto-focused Search Input Header */}
      <div className="relative mb-6">
        <div className="relative flex items-center">
          <SearchIcon className="absolute left-4 h-6 w-6 text-zinc-400 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="What would you like to watch?"
            className="w-full rounded-2xl bg-[#121216] border border-[#1f1f26] pl-13 pr-12 py-4 text-base sm:text-lg font-medium text-white placeholder-zinc-500 shadow-2xl focus:border-[#e50914] focus:ring-1 focus:ring-[#e50914] focus:outline-none transition-all"
          />
          {query && (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Clear search input"
              className="absolute right-4 flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Tabs (All, Movies, TV Series, People) when searching */}
      {debouncedQuery && (
        <div className="flex items-center gap-2 mb-6 overflow-x-auto no-scrollbar pb-1">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
              activeTab === 'all'
                ? 'bg-[#e50914] text-white shadow'
                : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800'
            }`}
          >
            <span>All Results</span>
            <span className="text-[10px] opacity-80">({searchResults.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('movie')}
            className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
              activeTab === 'movie'
                ? 'bg-[#e50914] text-white shadow'
                : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800'
            }`}
          >
            <Clapperboard className="h-3.5 w-3.5" />
            <span>Movies</span>
            <span className="text-[10px] opacity-80">
              ({searchResults.filter((i) => i.media_type === 'movie').length})
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tv')}
            className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
              activeTab === 'tv'
                ? 'bg-[#e50914] text-white shadow'
                : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800'
            }`}
          >
            <Tv className="h-3.5 w-3.5" />
            <span>TV Series</span>
            <span className="text-[10px] opacity-80">
              ({searchResults.filter((i) => i.media_type === 'tv').length})
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('person')}
            className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
              activeTab === 'person'
                ? 'bg-[#e50914] text-white shadow'
                : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800'
            }`}
          >
            <User className="h-3.5 w-3.5" />
            <span>People</span>
            <span className="text-[10px] opacity-80">
              ({searchResults.filter((i) => i.media_type === 'person').length})
            </span>
          </button>
        </div>
      )}

      {/* Content Section */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
          {Array.from({ length: 12 }).map((_, idx) => (
            <div key={idx} className="animate-pulse">
              <div className="aspect-[2/3] w-full rounded-xl bg-zinc-900 border border-zinc-800" />
              <div className="mt-2 h-3.5 w-3/4 rounded bg-zinc-800" />
              <div className="mt-1 h-3 w-1/2 rounded bg-zinc-800/60" />
            </div>
          ))}
        </div>
      ) : debouncedQuery ? (
        filteredResults.length === 0 ? (
          <div className="py-20 text-center rounded-2xl bg-[#121216] border border-[#1f1f26]">
            <SearchIcon className="mx-auto h-12 w-12 text-zinc-600 mb-3" />
            <h2 className="text-base sm:text-lg font-bold text-white">
              No results for "{debouncedQuery}"
            </h2>
            <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
              Check your spelling or search for another movie, TV show, actor, or director.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
            {filteredResults.map((item) => {
              if (item.media_type === 'person') {
                const profileUrl = getProfileUrl((item as any).profile_path, 'h632');
                return (
                  <div
                    key={`person-${item.id}`}
                    onClick={() => setActivePersonId(item.id)}
                    className="group relative flex flex-col cursor-pointer transition-transform hover:scale-[1.03]"
                  >
                    <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-zinc-900 border border-[#1f1f26]">
                      {profileUrl ? (
                        <img
                          src={profileUrl}
                          alt={item.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-zinc-800 text-zinc-500">
                          <User className="h-10 w-10" />
                        </div>
                      )}
                      <div className="absolute top-2 left-2 rounded bg-black/80 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                        Actor / Crew
                      </div>
                    </div>
                    <div className="mt-2 px-1">
                      <p className="truncate text-xs sm:text-sm font-semibold text-white group-hover:text-[#e50914]">
                        {item.name}
                      </p>
                      <p className="text-[11px] text-zinc-500">
                        {(item as any).known_for_department || 'Filmography'}
                      </p>
                    </div>
                  </div>
                );
              }

              return <PosterCard key={`${item.id}-${item.media_type || 'm'}`} item={item} />;
            })}
          </div>
        )
      ) : (
        /* Default State (Empty Query): Trending Today */
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Flame className="h-5 w-5 text-[#e50914]" />
            <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
              Trending Today
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
            {trendingResults.map((item) => (
              <PosterCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
