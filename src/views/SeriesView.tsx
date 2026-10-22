import React, { useState, useEffect } from 'react';
import { Filter, RotateCcw, Tv, ChevronDown, Radio } from 'lucide-react';
import { MediaItem, Genre } from '../types';
import { discoverTv, fetchTvGenres, fetchOnTheAirSeries, OTT_PROVIDERS } from '../services/tmdb';
import { PosterCard } from '../components/PosterCard';
import { MediaRail } from '../components/MediaRail';

const SORT_OPTIONS = [
  { label: 'Popularity', value: 'popularity.desc' },
  { label: 'Top Rated', value: 'vote_average.desc' },
  { label: 'Latest Air Date', value: 'first_air_date.desc' },
];

const COUNTRIES = [
  { label: 'All Countries', value: '' },
  { label: 'United States', value: 'US' },
  { label: 'United Kingdom', value: 'GB' },
  { label: 'South Korea', value: 'KR' },
  { label: 'Japan', value: 'JP' },
  { label: 'Spain', value: 'ES' },
  { label: 'France', value: 'FR' },
  { label: 'Canada', value: 'CA' },
];

const YEARS = ['All Years', ...Array.from({ length: 2026 - 1970 + 1 }, (_, i) => String(2026 - i))];

export const SeriesView: React.FC = () => {
  const [onTheAir, setOnTheAir] = useState<MediaItem[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedSort, setSelectedSort] = useState<string>('popularity.desc');
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [selectedCountry, setSelectedCountry] = useState<string>('');

  const [seriesList, setSeriesList] = useState<MediaItem[]>([]);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);

  // Load On The Air rail & TV Genres once
  useEffect(() => {
    fetchOnTheAirSeries(1)
      .then(setOnTheAir)
      .catch((err) => console.error('Failed to load on-the-air series:', err));

    fetchTvGenres()
      .then(setGenres)
      .catch((err) => console.error('Failed to load tv genres:', err));
  }, []);

  // Filter changes -> fetch page 1
  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);
    setPage(1);

    discoverTv({
      page: 1,
      genreId: selectedGenre || undefined,
      year: selectedYear && selectedYear !== 'All Years' ? selectedYear : undefined,
      sortBy: selectedSort,
      providerId: selectedProvider || undefined,
      country: selectedCountry || undefined,
    })
      .then((data) => {
        if (!isCancelled) {
          setSeriesList(data.results);
          setTotalPages(data.total_pages);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to discover tv:', err);
        if (!isCancelled) setIsLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [selectedGenre, selectedYear, selectedSort, selectedProvider, selectedCountry]);

  const handleLoadMore = () => {
    if (page >= totalPages || isLoadingMore) return;
    const nextPage = page + 1;
    setIsLoadingMore(true);

    discoverTv({
      page: nextPage,
      genreId: selectedGenre || undefined,
      year: selectedYear && selectedYear !== 'All Years' ? selectedYear : undefined,
      sortBy: selectedSort,
      providerId: selectedProvider || undefined,
      country: selectedCountry || undefined,
    })
      .then((data) => {
        setSeriesList((prev) => [...prev, ...data.results]);
        setPage(nextPage);
        setIsLoadingMore(false);
      })
      .catch((err) => {
        console.error('Failed to load more tv:', err);
        setIsLoadingMore(false);
      });
  };

  const handleResetFilters = () => {
    setSelectedGenre('');
    setSelectedYear('');
    setSelectedSort('popularity.desc');
    setSelectedProvider('');
    setSelectedCountry('');
  };

  const hasActiveFilters =
    Boolean(selectedGenre) ||
    (Boolean(selectedYear) && selectedYear !== 'All Years') ||
    selectedSort !== 'popularity.desc' ||
    Boolean(selectedProvider) ||
    Boolean(selectedCountry);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 md:py-8 min-h-screen">
      {/* 1. New Seasons Airing Rail (Signature Watchlyn Feature) */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1 px-1">
          <Radio className="h-5 w-5 text-[#e50914] animate-pulse" />
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            New Seasons Airing Now
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-zinc-400 mb-3 px-1">
          Fresh episodes and active television seasons broadcasting worldwide.
        </p>

        <MediaRail
          title=""
          items={onTheAir}
          isLoading={onTheAir.length === 0}
          getEpisodeBadge={(item) => {
            // Format dynamic air badge: e.g. "Ep 3 · On Air" or "New Ep"
            return 'New Ep · On Air';
          }}
          getSubBadge={(item) => {
            const rawYear = item.first_air_date ? item.first_air_date.split('-')[0] : '';
            return rawYear ? `Series (${rawYear})` : 'Active Season';
          }}
        />
      </div>

      {/* Catalog Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Tv className="h-6 w-6 text-[#e50914]" />
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              All TV Series & Shows
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Binge multi-season dramas, anime, comedies, and mini-series.
          </p>
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleResetFilters}
            className="flex items-center gap-1.5 self-start sm:self-auto rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5 text-[#e50914]" />
            <span>Reset Filters</span>
          </button>
        )}
      </div>

      {/* Multi-Filter Bar */}
      <div className="rounded-2xl bg-[#121216] border border-[#1f1f26] p-3.5 sm:p-4 mb-6 shadow-md">
        <div className="flex items-center gap-2 text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">
          <Filter className="h-3.5 w-3.5 text-[#e50914]" />
          <span>Series Filters</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {/* Genre */}
          <div className="relative">
            <label htmlFor="series-genre-filter" className="block text-[10px] font-semibold text-zinc-400 mb-1">GENRE</label>
            <div className="relative">
              <select
                id="series-genre-filter"
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                className="w-full appearance-none rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs font-medium text-white focus:border-[#e50914] focus:outline-none cursor-pointer"
              >
                <option value="">All Genres</option>
                {genres.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
            </div>
          </div>

          {/* Year */}
          <div className="relative">
            <label htmlFor="series-year-filter" className="block text-[10px] font-semibold text-zinc-400 mb-1">FIRST AIR YEAR</label>
            <div className="relative">
              <select
                id="series-year-filter"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full appearance-none rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs font-medium text-white focus:border-[#e50914] focus:outline-none cursor-pointer"
              >
                {YEARS.map((y) => (
                  <option key={y} value={y === 'All Years' ? '' : y}>
                    {y}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
            </div>
          </div>

          {/* Sort By */}
          <div className="relative">
            <label htmlFor="series-sort-filter" className="block text-[10px] font-semibold text-zinc-400 mb-1">SORT BY</label>
            <div className="relative">
              <select
                id="series-sort-filter"
                value={selectedSort}
                onChange={(e) => setSelectedSort(e.target.value)}
                className="w-full appearance-none rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs font-medium text-white focus:border-[#e50914] focus:outline-none cursor-pointer"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
            </div>
          </div>

          {/* Provider */}
          <div className="relative">
            <label htmlFor="series-provider-filter" className="block text-[10px] font-semibold text-zinc-400 mb-1">NETWORK / OTT</label>
            <div className="relative">
              <select
                id="series-provider-filter"
                value={selectedProvider}
                onChange={(e) => setSelectedProvider(e.target.value)}
                className="w-full appearance-none rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs font-medium text-white focus:border-[#e50914] focus:outline-none cursor-pointer"
              >
                <option value="">All Networks</option>
                {OTT_PROVIDERS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
            </div>
          </div>

          {/* Country */}
          <div className="relative">
            <label htmlFor="series-country-filter" className="block text-[10px] font-semibold text-zinc-400 mb-1">ORIGIN COUNTRY</label>
            <div className="relative">
              <select
                id="series-country-filter"
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="w-full appearance-none rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs font-medium text-white focus:border-[#e50914] focus:outline-none cursor-pointer"
              >
                {COUNTRIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Series Grid */}
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
      ) : seriesList.length === 0 ? (
        <div className="py-20 text-center rounded-2xl bg-[#121216] border border-[#1f1f26]">
          <Tv className="mx-auto h-10 w-10 text-zinc-600 mb-2" />
          <h2 className="text-base font-bold text-white">No series match your filters</h2>
          <p className="text-xs text-zinc-400 mt-1">Try broadening your selected filters.</p>
          <button
            type="button"
            onClick={handleResetFilters}
            className="mt-4 rounded-xl bg-[#e50914] px-4 py-2 text-xs font-bold text-white hover:bg-red-700"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
            {seriesList.map((series) => (
              <PosterCard key={series.id} item={series} />
            ))}
          </div>

          {/* Load More Button */}
          {page < totalPages && (
            <div className="mt-10 flex justify-center">
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="flex items-center gap-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 px-8 py-3 text-sm font-bold text-white shadow-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer min-h-[44px]"
              >
                {isLoadingMore ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#e50914] border-t-transparent" />
                    <span>Loading more series...</span>
                  </>
                ) : (
                  <span>Load More Shows</span>
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
