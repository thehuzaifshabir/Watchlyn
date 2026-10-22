import React, { useState, useEffect, useRef } from 'react';
import { Play, Plus, Check, Star, ChevronLeft, ChevronRight, Info } from 'lucide-react';
import { MediaItem } from '../types';
import { getBackdropUrl, getImageUrl } from '../services/tmdb';
import { formatYear, formatRating } from '../utils/formatters';
import { useApp } from '../context/AppContext';

interface HeroBannerProps {
  items: MediaItem[];
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ items }) => {
  const { navigate, isItemInWatchlist, toggleWatchlist } = useApp();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const displayItems = items.slice(0, 8);
  const current = displayItems[currentIndex];

  useEffect(() => {
    if (displayItems.length <= 1 || isPaused) return;

    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % displayItems.length);
    }, 6000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [displayItems.length, isPaused]);

  if (!current) {
    return (
      <div className="relative w-full aspect-[21/9] min-h-[360px] md:min-h-[480px] bg-zinc-950 animate-pulse border-b border-zinc-900 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-zinc-950/70 to-transparent" />
        <div className="absolute bottom-10 left-6 sm:left-12 max-w-xl space-y-3">
          <div className="h-4 w-28 bg-zinc-800 rounded" />
          <div className="h-8 w-72 bg-zinc-800 rounded" />
          <div className="h-4 w-96 bg-zinc-800/80 rounded" />
          <div className="flex gap-3 pt-2">
            <div className="h-10 w-32 bg-zinc-800 rounded-xl" />
            <div className="h-10 w-32 bg-zinc-800 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  const title = current.title || current.name || 'Featured Title';
  const rawDate = current.release_date || current.first_air_date;
  const year = formatYear(rawDate);
  const rating = formatRating(current.vote_average);
  const mediaType: 'movie' | 'tv' = current.media_type === 'tv' || Boolean(current.first_air_date) ? 'tv' : 'movie';
  const inWatchlist = isItemInWatchlist(current.id);

  const backdropUrl = getBackdropUrl(current.backdrop_path, 'original') || getImageUrl(current.poster_path, 'original');
  const mobilePosterUrl = getImageUrl(current.poster_path, 'w500');

  const handlePlay = () => {
    navigate(`/${mediaType}/${current.id}`);
  };

  const handleWatchlist = () => {
    toggleWatchlist({
      id: current.id,
      mediaType,
      title,
      posterPath: current.poster_path || null,
      year,
      rating: current.vote_average,
    });
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? displayItems.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % displayItems.length);
  };

  return (
    <div
      className="relative w-full overflow-hidden bg-[#09090b] select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      {/* Hero Image Container */}
      <div className="relative h-[480px] sm:h-[540px] md:h-[620px] lg:h-[700px] w-full">
        {/* Desktop Backdrop */}
        {backdropUrl && (
          <img
            key={`backdrop-${current.id}`}
            src={backdropUrl}
            alt={title}
            className="hidden sm:block absolute inset-0 h-full w-full object-cover object-top transition-opacity duration-700 opacity-90 scale-100"
          />
        )}

        {/* Mobile Poster Blend */}
        {mobilePosterUrl && (
          <img
            key={`poster-${current.id}`}
            src={mobilePosterUrl}
            alt={title}
            className="block sm:hidden absolute inset-0 h-full w-full object-cover object-center opacity-70 filter brightness-90"
          />
        )}

        {/* Cinematic Multi-layered Vignettes */}
        {/* Bottom to top gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/60 to-transparent" />
        {/* Left side vignette for text legibility on desktop */}
        <div className="hidden sm:block absolute inset-0 bg-gradient-to-r from-[#09090b] via-[#09090b]/80 to-transparent w-3/4" />
        {/* Top vignette for navbar */}
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/80 to-transparent pointer-events-none" />

        {/* Content Overlay */}
        <div className="absolute inset-0 flex flex-col justify-end px-4 sm:px-8 lg:px-12 pb-12 sm:pb-16 max-w-7xl mx-auto pointer-events-none">
          <div className="max-w-2xl pointer-events-auto">
            {/* Tagline / Category pill */}
            <div className="flex items-center gap-2 mb-2">
              <span className="rounded-full bg-[#e50914] px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white shadow-md">
                {mediaType === 'tv' ? 'Trending Series' : 'Trending Movie'}
              </span>
              <span className="text-xs font-medium text-zinc-400">
                #{currentIndex + 1} of {displayItems.length}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-white drop-shadow-md line-clamp-2">
              {title}
            </h1>

            {/* Metadata Row */}
            <div className="mt-2.5 flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-zinc-300 font-medium">
              {rating !== 'NR' && (
                <div className="flex items-center gap-1 rounded bg-black/60 px-2 py-0.5 text-amber-400 border border-amber-500/20">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  <span>{rating} / 10</span>
                </div>
              )}
              {year && <span>{year}</span>}
              <span>•</span>
              <span className="rounded border border-zinc-700 bg-zinc-900/60 px-1.5 py-0.5 text-[11px] uppercase tracking-wide text-zinc-300">
                HD
              </span>
              <span className="rounded border border-zinc-700 bg-zinc-900/60 px-1.5 py-0.5 text-[11px] text-zinc-300">
                {mediaType === 'tv' ? 'Multi-Season' : 'Full Movie'}
              </span>
            </div>

            {/* Synopsis (2-line clamped) */}
            {current.overview && (
              <p className="mt-3 text-xs sm:text-sm md:text-base text-zinc-300 line-clamp-2 leading-relaxed drop-shadow">
                {current.overview}
              </p>
            )}

            {/* Action Buttons */}
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handlePlay}
                aria-label={`Play ${title}`}
                className="flex items-center justify-center gap-2 rounded-xl bg-[#e50914] px-6 py-3 text-sm sm:text-base font-bold text-white shadow-xl shadow-red-900/30 transition-all hover:bg-red-700 hover:scale-105 active:scale-95 cursor-pointer min-h-[44px]"
              >
                <Play className="h-5 w-5 fill-white" />
                <span>Play Now</span>
              </button>

              <button
                type="button"
                onClick={handleWatchlist}
                aria-label={inWatchlist ? 'Remove from My List' : 'Add to My List'}
                className="flex items-center justify-center gap-2 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700 px-5 py-3 text-sm sm:text-base font-semibold text-white backdrop-blur-md transition-all hover:scale-105 active:scale-95 cursor-pointer min-h-[44px]"
              >
                {inWatchlist ? <Check className="h-5 w-5 text-red-500" /> : <Plus className="h-5 w-5" />}
                <span>{inWatchlist ? 'In My List' : '+ My List'}</span>
              </button>

              <button
                type="button"
                onClick={() => navigate(`/${mediaType}/${current.id}`)}
                aria-label={`Details about ${title}`}
                className="hidden sm:flex items-center justify-center gap-1.5 rounded-xl bg-black/40 hover:bg-black/70 border border-zinc-800 px-4 py-3 text-sm font-medium text-zinc-300 backdrop-blur-md transition-all cursor-pointer min-h-[44px]"
              >
                <Info className="h-4 w-4" />
                <span>Details</span>
              </button>
            </div>
          </div>
        </div>

        {/* Carousel Navigation Arrows */}
        <button
          type="button"
          onClick={handlePrev}
          aria-label="Previous hero slide"
          className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-20 h-11 w-11 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/80 hover:scale-110 active:scale-95 border border-zinc-800 backdrop-blur-md transition-all"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>

        <button
          type="button"
          onClick={handleNext}
          aria-label="Next hero slide"
          className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-20 h-11 w-11 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/80 hover:scale-110 active:scale-95 border border-zinc-800 backdrop-blur-md transition-all"
        >
          <ChevronRight className="h-6 w-6" />
        </button>

        {/* Slide Indicators */}
        <div className="absolute bottom-4 right-4 sm:right-8 z-20 flex items-center gap-1.5">
          {displayItems.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === currentIndex ? 'w-6 bg-[#e50914]' : 'w-2 bg-zinc-600 hover:bg-zinc-400'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
