import React, { useState, useEffect } from 'react';
import { ArrowLeft, Clapperboard, Tv, ChevronDown } from 'lucide-react';
import { MediaItem } from '../types';
import { OTT_PROVIDERS, discoverMovies, discoverTv } from '../services/tmdb';
import { PosterCard } from '../components/PosterCard';
import { useApp } from '../context/AppContext';

interface ProviderCatalogViewProps {
  providerId: number;
}

export const ProviderCatalogView: React.FC<ProviderCatalogViewProps> = ({ providerId }) => {
  const { navigate } = useApp();
  const provider = OTT_PROVIDERS.find((p) => p.id === providerId) || OTT_PROVIDERS[0];

  const [activeTab, setActiveTab] = useState<'movie' | 'tv'>('movie');
  const [sortBy, setSortBy] = useState<string>('popularity.desc');
  const [items, setItems] = useState<MediaItem[]>([]);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);

  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);
    setPage(1);

    const fetcher =
      activeTab === 'movie'
        ? discoverMovies({ page: 1, providerId: provider.id, sortBy })
        : discoverTv({ page: 1, providerId: provider.id, sortBy });

    fetcher
      .then((data) => {
        if (!isCancelled) {
          setItems(data.results);
          setTotalPages(data.total_pages);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load provider catalog:', err);
        if (!isCancelled) setIsLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [provider.id, activeTab, sortBy]);

  const handleLoadMore = () => {
    if (page >= totalPages || isLoadingMore) return;
    const nextPage = page + 1;
    setIsLoadingMore(true);

    const fetcher =
      activeTab === 'movie'
        ? discoverMovies({ page: nextPage, providerId: provider.id, sortBy })
        : discoverTv({ page: nextPage, providerId: provider.id, sortBy });

    fetcher
      .then((data) => {
        setItems((prev) => [...prev, ...data.results]);
        setPage(nextPage);
        setIsLoadingMore(false);
      })
      .catch((err) => {
        console.error('Failed to load more:', err);
        setIsLoadingMore(false);
      });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 md:py-8 min-h-screen">
      {/* Top Header */}
      <button
        type="button"
        onClick={() => navigate('/')}
        className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-white mb-4 cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Home</span>
      </button>

      {/* Provider Hero Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-zinc-900 via-[#121216] to-zinc-900 border border-[#1f1f26] p-6 sm:p-8 mb-8 shadow-xl">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          <div
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-black/80 p-2 border border-zinc-800 shadow-2xl font-black text-2xl tracking-tighter"
            style={{ color: provider.color }}
          >
            {provider.name === 'Netflix'
              ? 'N'
              : provider.name === 'Disney+'
              ? 'D+'
              : provider.name === 'Prime Video'
              ? 'prime'
              : provider.name === 'Apple TV+'
              ? 'tv+'
              : provider.name === 'Max'
              ? 'MAX'
              : provider.name.charAt(0)}
          </div>

          <div className="text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-300">
                Network Catalog
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white mt-1">
              Stream on {provider.name}
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-xl">
              Explore movies and TV series distributed by {provider.name}. Instant multi-server playback available.
            </p>
          </div>
        </div>

        {/* Tab & Sort Controls */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-zinc-800/80">
          <div className="flex items-center gap-1 rounded-xl bg-zinc-900 p-1 border border-zinc-800">
            <button
              type="button"
              onClick={() => setActiveTab('movie')}
              className={`flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'movie'
                  ? 'bg-[#e50914] text-white shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Clapperboard className="h-3.5 w-3.5" />
              <span>Movies</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('tv')}
              className={`flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'tv'
                  ? 'bg-[#e50914] text-white shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Tv className="h-3.5 w-3.5" />
              <span>TV Shows</span>
            </button>
          </div>

          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-1.5 pr-8 text-xs font-medium text-white focus:outline-none cursor-pointer"
            >
              <option value="popularity.desc">Most Popular</option>
              <option value="vote_average.desc">Top Rated</option>
              <option value="primary_release_date.desc">Recently Added</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
          </div>
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
          {Array.from({ length: 18 }).map((_, idx) => (
            <div key={idx} className="animate-pulse">
              <div className="aspect-[2/3] w-full rounded-xl bg-zinc-900 border border-zinc-800" />
              <div className="mt-2 h-3.5 w-3/4 rounded bg-zinc-800" />
              <div className="mt-1 h-3 w-1/2 rounded bg-zinc-800/60" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="py-20 text-center rounded-2xl bg-[#121216] border border-[#1f1f26]">
          <p className="text-sm font-semibold text-white">No titles found for {provider.name}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
            {items.map((item) => (
              <PosterCard key={item.id} item={{ ...item, media_type: activeTab }} />
            ))}
          </div>

          {page < totalPages && (
            <div className="mt-10 flex justify-center">
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 px-8 py-3 text-sm font-bold text-white shadow-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer min-h-[44px]"
              >
                {isLoadingMore ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
