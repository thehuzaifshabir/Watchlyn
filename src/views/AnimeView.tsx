import React, { useState, useEffect } from 'react';
import { Sparkles, Radio, Filter, RotateCcw, ChevronDown, Flame, Swords, ShieldAlert, Award } from 'lucide-react';
import { MediaItem } from '../types';
import {
  fetchTrendingAnime,
  fetchAiringAnime,
  fetchTopRatedAnime,
  fetchPopularAnimeMovies,
  fetchShonenAnime,
  fetchDarkFantasyAnime,
  discoverAnimeCatalog,
} from '../services/tmdb';
import { HeroBanner } from '../components/HeroBanner';
import { MediaRail } from '../components/MediaRail';
import { PosterCard } from '../components/PosterCard';

const ANIME_SUBGENRES = [
  { label: 'All Sub-Genres', value: '' },
  { label: 'Action & Adventure', value: '10759' },
  { label: 'Sci-Fi & Fantasy', value: '10765' },
  { label: 'Mystery & Psychological', value: '9648' },
  { label: 'Comedy', value: '35' },
  { label: 'Drama', value: '18' },
  { label: 'Romance', value: '10749' },
];

const ANIME_SORTS = [
  { label: 'Most Popular', value: 'popularity.desc' },
  { label: 'Highest Rated', value: 'vote_average.desc' },
  { label: 'Newest Releases', value: 'first_air_date.desc' },
];

const ANIME_YEARS = [
  'All Years',
  ...Array.from({ length: 2026 - 1980 + 1 }, (_, i) => String(2026 - i)),
];

export const AnimeView: React.FC = () => {
  // Rails state
  const [trending, setTrending] = useState<MediaItem[]>([]);
  const [airing, setAiring] = useState<MediaItem[]>([]);
  const [topRated, setTopRated] = useState<MediaItem[]>([]);
  const [animeMovies, setAnimeMovies] = useState<MediaItem[]>([]);
  const [shonen, setShonen] = useState<MediaItem[]>([]);
  const [darkFantasy, setDarkFantasy] = useState<MediaItem[]>([]);
  const [isRailsLoading, setIsRailsLoading] = useState<boolean>(true);

  // Catalog Filter State
  const [filterType, setFilterType] = useState<'tv' | 'movie'>('tv');
  const [selectedSubGenre, setSelectedSubGenre] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedSort, setSelectedSort] = useState<string>('popularity.desc');

  const [catalogItems, setCatalogItems] = useState<MediaItem[]>([]);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isCatalogLoading, setIsCatalogLoading] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);

  // Load Rails
  useEffect(() => {
    let isCancelled = false;
    setIsRailsLoading(true);

    Promise.all([
      fetchTrendingAnime(1),
      fetchAiringAnime(1),
      fetchTopRatedAnime(1),
      fetchPopularAnimeMovies(1),
      fetchShonenAnime(1),
      fetchDarkFantasyAnime(1),
    ])
      .then(([trend, air, top, movs, sho, dark]) => {
        if (!isCancelled) {
          setTrending(trend);
          setAiring(air);
          setTopRated(top);
          setAnimeMovies(movs);
          setShonen(sho);
          setDarkFantasy(dark);
          setIsRailsLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load anime rails:', err);
        if (!isCancelled) setIsRailsLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  // Filter Catalog
  useEffect(() => {
    let isCancelled = false;
    setIsCatalogLoading(true);
    setPage(1);

    discoverAnimeCatalog({
      page: 1,
      type: filterType,
      subGenreId: selectedSubGenre || undefined,
      year: selectedYear && selectedYear !== 'All Years' ? selectedYear : undefined,
      sortBy: selectedSort,
    })
      .then((data) => {
        if (!isCancelled) {
          setCatalogItems(data.results);
          setTotalPages(data.total_pages);
          setIsCatalogLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to discover anime catalog:', err);
        if (!isCancelled) setIsCatalogLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [filterType, selectedSubGenre, selectedYear, selectedSort]);

  const handleLoadMore = () => {
    if (page >= totalPages || isLoadingMore) return;
    const nextPage = page + 1;
    setIsLoadingMore(true);

    discoverAnimeCatalog({
      page: nextPage,
      type: filterType,
      subGenreId: selectedSubGenre || undefined,
      year: selectedYear && selectedYear !== 'All Years' ? selectedYear : undefined,
      sortBy: selectedSort,
    })
      .then((data) => {
        setCatalogItems((prev) => [...prev, ...data.results]);
        setPage(nextPage);
        setIsLoadingMore(false);
      })
      .catch((err) => {
        console.error('Failed to load more anime:', err);
        setIsLoadingMore(false);
      });
  };

  const handleResetFilters = () => {
    setFilterType('tv');
    setSelectedSubGenre('');
    setSelectedYear('');
    setSelectedSort('popularity.desc');
  };

  const hasActiveFilters =
    filterType !== 'tv' ||
    Boolean(selectedSubGenre) ||
    (Boolean(selectedYear) && selectedYear !== 'All Years') ||
    selectedSort !== 'popularity.desc';

  return (
    <div className="min-h-screen pb-16">
      {/* 1. Anime Hero Banner Carousel */}
      <HeroBanner items={trending} />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-6">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-6 w-6 text-[#e50914]" />
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Anime Hub
          </h1>
          <span className="rounded bg-[#e50914]/20 border border-[#e50914]/40 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-400">
            Vidy Stream · Multi-Season
          </span>
        </div>
        <p className="text-xs sm:text-sm text-zinc-400">
          Stream subbed & dubbed seasonal anime series, shonen hits, and feature films in HD.
        </p>
      </div>

      {/* 2. Simulcast / New Anime Episodes Airing Rail */}
      <div className="mt-6">
        <MediaRail
          title="Simulcast & Airing Seasonal Anime"
          items={airing}
          isLoading={isRailsLoading}
          getEpisodeBadge={() => 'New Ep · On Air'}
          getSubBadge={(item) => (item.first_air_date ? `Anime (${item.first_air_date.split('-')[0]})` : 'Simulcast')}
        />
      </div>

      {/* 3. Curated Anime Rails */}
      <MediaRail
        title="Trending Anime Series"
        items={trending}
        isLoading={isRailsLoading}
      />

      <MediaRail
        title="Top Rated Anime of All Time"
        items={topRated}
        isLoading={isRailsLoading}
      />

      <MediaRail
        title="Popular Anime Movies"
        items={animeMovies}
        isLoading={isRailsLoading}
      />

      <MediaRail
        title="Shonen Action & Adventure"
        items={shonen}
        isLoading={isRailsLoading}
      />

      <MediaRail
        title="Dark Fantasy, Mystery & Supernatural"
        items={darkFantasy}
        isLoading={isRailsLoading}
      />

      {/* 4. Interactive Multi-Filter Anime Catalog Grid */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-[#1f1f26]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <Filter className="h-5 w-5 text-[#e50914]" />
              <span>Explore Anime Catalog</span>
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
              Filter by sub-genres, format, and release years.
            </p>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="flex items-center gap-1.5 self-start sm:self-auto rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:text-white transition-colors cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5 text-[#e50914]" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>

        {/* Filter Bar */}
        <div className="rounded-2xl bg-[#121216] border border-[#1f1f26] p-4 mb-6 shadow-md">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Format Type */}
            <div>
              <label htmlFor="anime-type-filter" className="block text-[10px] font-semibold text-zinc-400 mb-1">FORMAT</label>
              <div className="relative">
                <select
                  id="anime-type-filter"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as 'tv' | 'movie')}
                  className="w-full appearance-none rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs font-medium text-white focus:border-[#e50914] focus:outline-none cursor-pointer"
                >
                  <option value="tv">TV Series</option>
                  <option value="movie">Anime Movies</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
              </div>
            </div>

            {/* Sub-Genre */}
            <div>
              <label htmlFor="anime-subgenre-filter" className="block text-[10px] font-semibold text-zinc-400 mb-1">SUB-GENRE</label>
              <div className="relative">
                <select
                  id="anime-subgenre-filter"
                  value={selectedSubGenre}
                  onChange={(e) => setSelectedSubGenre(e.target.value)}
                  className="w-full appearance-none rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs font-medium text-white focus:border-[#e50914] focus:outline-none cursor-pointer"
                >
                  {ANIME_SUBGENRES.map((g) => (
                    <option key={g.value} value={g.value}>
                      {g.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
              </div>
            </div>

            {/* Release Year */}
            <div>
              <label htmlFor="anime-year-filter" className="block text-[10px] font-semibold text-zinc-400 mb-1">YEAR</label>
              <div className="relative">
                <select
                  id="anime-year-filter"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-full appearance-none rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs font-medium text-white focus:border-[#e50914] focus:outline-none cursor-pointer"
                >
                  {ANIME_YEARS.map((y) => (
                    <option key={y} value={y === 'All Years' ? '' : y}>
                      {y}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
              </div>
            </div>

            {/* Sort */}
            <div>
              <label htmlFor="anime-sort-filter" className="block text-[10px] font-semibold text-zinc-400 mb-1">SORT BY</label>
              <div className="relative">
                <select
                  id="anime-sort-filter"
                  value={selectedSort}
                  onChange={(e) => setSelectedSort(e.target.value)}
                  className="w-full appearance-none rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs font-medium text-white focus:border-[#e50914] focus:outline-none cursor-pointer"
                >
                  {ANIME_SORTS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Catalog Grid */}
        {isCatalogLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
            {Array.from({ length: 18 }).map((_, idx) => (
              <div key={idx} className="animate-pulse">
                <div className="aspect-[2/3] w-full rounded-xl bg-zinc-900 border border-zinc-800" />
                <div className="mt-2 h-3.5 w-3/4 rounded bg-zinc-800" />
                <div className="mt-1 h-3 w-1/2 rounded bg-zinc-800/60" />
              </div>
            ))}
          </div>
        ) : catalogItems.length === 0 ? (
          <div className="py-20 text-center rounded-2xl bg-[#121216] border border-[#1f1f26]">
            <Sparkles className="mx-auto h-10 w-10 text-zinc-600 mb-2" />
            <h3 className="text-base font-bold text-white">No anime matched your filters</h3>
            <p className="text-xs text-zinc-400 mt-1">Try resetting the sub-genre or year filter.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
              {catalogItems.map((anime) => (
                <PosterCard key={anime.id} item={anime} />
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
                  {isLoadingMore ? 'Loading More Anime...' : 'Load More Anime'}
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
};
