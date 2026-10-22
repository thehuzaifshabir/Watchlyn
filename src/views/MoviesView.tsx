import React, { useState, useEffect } from 'react';
import { Filter, RotateCcw, Clapperboard, ChevronDown } from 'lucide-react';
import { MediaItem, Genre } from '../types';
import { discoverMovies, fetchMovieGenres, OTT_PROVIDERS } from '../services/tmdb';
import { PosterCard } from '../components/PosterCard';

const SORT_OPTIONS = [
  { label: 'Popularity', value: 'popularity.desc' },
  { label: 'Top Rated', value: 'vote_average.desc' },
  { label: 'Latest Release', value: 'primary_release_date.desc' },
  { label: 'Box Office Revenue', value: 'revenue.desc' },
];

const COUNTRIES = [
  { label: 'All Countries', value: '' },
  { label: 'United States', value: 'US' },
  { label: 'United Kingdom', value: 'GB' },
  { label: 'South Korea', value: 'KR' },
  { label: 'Japan', value: 'JP' },
  { label: 'India', value: 'IN' },
  { label: 'France', value: 'FR' },
  { label: 'Spain', value: 'ES' },
  { label: 'Germany', value: 'DE' },
  { label: 'Canada', value: 'CA' },
];

// Generate years 2026 down to 1970
const YEARS = ['All Years', ...Array.from({ length: 2026 - 1970 + 1 }, (_, i) => String(2026 - i))];

export const MoviesView: React.FC = () => {
  const [genres, setGenres] = useState<Genre[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedSort, setSelectedSort] = useState<string>('popularity.desc');
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [selectedCountry, setSelectedCountry] = useState<string>('');

  const [movies, setMovies] = useState<MediaItem[]>([]);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);

  // Load genres once
  useEffect(() => {
    fetchMovieGenres()
      .then(setGenres)
      .catch((err) => console.error('Failed to load movie genres:', err));
  }, []);

  // Fetch movies when filters change (reset to page 1)
  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);
    setPage(1);

    discoverMovies({
      page: 1,
      genreId: selectedGenre || undefined,
      year: selectedYear && selectedYear !== 'All Years' ? selectedYear : undefined,
      sortBy: selectedSort,
      providerId: selectedProvider || undefined,
      country: selectedCountry || undefined,
    })
      .then((data) => {
        if (!isCancelled) {
          setMovies(data.results);
          setTotalPages(data.total_pages);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to discover movies:', err);
        if (!isCancelled) setIsLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [selectedGenre, selectedYear, selectedSort, selectedProvider, selectedCountry]);

  // Load More Handler
  const handleLoadMore = () => {
    if (page >= totalPages || isLoadingMore) return;
    const nextPage = page + 1;
    setIsLoadingMore(true);

    discoverMovies({
      page: nextPage,
      genreId: selectedGenre || undefined,
      year: selectedYear && selectedYear !== 'All Years' ? selectedYear : undefined,
      sortBy: selectedSort,
      providerId: selectedProvider || undefined,
      country: selectedCountry || undefined,
    })
      .then((data) => {
        setMovies((prev) => [...prev, ...data.results]);
        setPage(nextPage);
        setIsLoadingMore(false);
      })
      .catch((err) => {
        console.error('Failed to load more movies:', err);
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
      {/* Title & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Clapperboard className="h-6 w-6 text-[#e50914]" />
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Explore Movies
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Browse full-length feature films, blockbusters, and award-winning cinema.
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

      {/* Multi-Filter Control Bar (Horizontally scrollable on mobile / wrapping on desktop) */}
      <div className="rounded-2xl bg-[#121216] border border-[#1f1f26] p-3.5 sm:p-4 mb-6 shadow-md">
        <div className="flex items-center gap-2 text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">
          <Filter className="h-3.5 w-3.5 text-[#e50914]" />
          <span>Filters & Sort</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {/* Genre */}
          <div className="relative">
            <label htmlFor="movie-genre-filter" className="block text-[10px] font-semibold text-zinc-400 mb-1">GENRE</label>
            <div className="relative">
              <select
                id="movie-genre-filter"
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
            <label htmlFor="movie-year-filter" className="block text-[10px] font-semibold text-zinc-400 mb-1">RELEASE YEAR</label>
            <div className="relative">
              <select
                id="movie-year-filter"
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
            <label htmlFor="movie-sort-filter" className="block text-[10px] font-semibold text-zinc-400 mb-1">SORT BY</label>
            <div className="relative">
              <select
                id="movie-sort-filter"
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

          {/* Watch Provider */}
          <div className="relative">
            <label htmlFor="movie-provider-filter" className="block text-[10px] font-semibold text-zinc-400 mb-1">NETWORK / OTT</label>
            <div className="relative">
              <select
                id="movie-provider-filter"
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
            <label htmlFor="movie-country-filter" className="block text-[10px] font-semibold text-zinc-400 mb-1">COUNTRY</label>
            <div className="relative">
              <select
                id="movie-country-filter"
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

      {/* Movies Grid */}
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
      ) : movies.length === 0 ? (
        <div className="py-20 text-center rounded-2xl bg-[#121216] border border-[#1f1f26]">
          <Clapperboard className="mx-auto h-10 w-10 text-zinc-600 mb-2" />
          <h2 className="text-base font-bold text-white">No movies match your filters</h2>
          <p className="text-xs text-zinc-400 mt-1">Try adjusting your filters or resetting them.</p>
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
            {movies.map((movie) => (
              <PosterCard key={movie.id} item={movie} />
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
                    <span>Loading more movies...</span>
                  </>
                ) : (
                  <span>Load More Movies</span>
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
