import React, { useState } from 'react';
import { Star, Play, Plus, Check } from 'lucide-react';
import { MediaItem } from '../types';
import { getImageUrl } from '../services/tmdb';
import { formatYear, formatRating } from '../utils/formatters';
import { useApp } from '../context/AppContext';

interface PosterCardProps {
  item: MediaItem;
  episodeBadge?: string;
  subBadge?: string;
  showQuickWatchlist?: boolean;
  className?: string;
}

export const PosterCard: React.FC<PosterCardProps> = ({
  item,
  episodeBadge,
  subBadge,
  showQuickWatchlist = true,
  className = '',
}) => {
  const { navigate, isItemInWatchlist, toggleWatchlist } = useApp();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const title = item.title || item.name || 'Untitled';
  const rawDate = item.release_date || item.first_air_date;
  const year = formatYear(rawDate);
  const rating = formatRating(item.vote_average);
  const mediaType: 'movie' | 'tv' = item.media_type === 'tv' || Boolean(item.first_air_date) ? 'tv' : 'movie';
  const posterUrl = getImageUrl(item.poster_path, 'w342');
  const inWatchlist = isItemInWatchlist(item.id);

  const handleClick = () => {
    navigate(`/${mediaType}/${item.id}`);
  };

  const handleWatchlistToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleWatchlist({
      id: item.id,
      mediaType,
      title,
      posterPath: item.poster_path || null,
      year,
      rating: item.vote_average,
    });
  };

  return (
    <div
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      aria-label={`${title} (${year}), rated ${rating}`}
      className={`group relative flex flex-col cursor-pointer select-none transition-transform duration-200 active:scale-95 md:hover:scale-[1.03] ${className}`}
    >
      {/* Poster Image Container */}
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-[#121216] border border-[#1f1f26] shadow-md group-hover:border-zinc-700/60 transition-colors">
        {/* Shimmer skeleton before image loads */}
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 animate-pulse" />
        )}

        {posterUrl && !imageError ? (
          <img
            src={posterUrl}
            alt={title}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            className={`h-full w-full object-cover transition-opacity duration-300 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center p-3 text-center bg-zinc-900 text-zinc-500">
            <span className="text-xs font-semibold line-clamp-3">{title}</span>
            <span className="text-[10px] mt-1 text-zinc-600">No Poster</span>
          </div>
        )}

        {/* Dark subtle gradient bottom vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />

        {/* Rating Badge (Top Left) */}
        {rating !== 'NR' && (
          <div className="absolute top-2 left-2 flex items-center gap-1 rounded-md bg-black/75 px-1.5 py-0.5 text-[11px] font-bold text-amber-400 backdrop-blur-md shadow">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            <span>{rating}</span>
          </div>
        )}

        {/* Episode / Custom Badge (Top Right) */}
        {episodeBadge && (
          <div className="absolute top-2 right-2 max-w-[80%] truncate rounded-md bg-[#e50914] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-lg">
            {episodeBadge}
          </div>
        )}

        {/* Quick Watchlist Button (Desktop Hover / Mobile Accessible) */}
        {showQuickWatchlist && (
          <button
            type="button"
            onClick={handleWatchlistToggle}
            aria-label={inWatchlist ? `Remove ${title} from watchlist` : `Add ${title} to watchlist`}
            className={`absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 ${
              inWatchlist
                ? 'bg-[#e50914] text-white opacity-100 shadow-md'
                : 'bg-zinc-900/80 text-zinc-300 opacity-0 group-hover:opacity-100 hover:bg-white hover:text-black hover:scale-110 active:scale-95'
            } md:opacity-0 md:group-hover:opacity-100 max-md:opacity-90 backdrop-blur-sm`}
          >
            {inWatchlist ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          </button>
        )}

        {/* Play Icon on hover */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#e50914]/90 text-white shadow-xl backdrop-blur-sm">
            <Play className="h-5 w-5 fill-white ml-0.5" />
          </div>
        </div>

        {/* Sub-badge / Season info (Bottom Left over poster) */}
        {subBadge && (
          <div className="absolute bottom-2 left-2 max-w-[70%] truncate rounded bg-zinc-900/85 px-1.5 py-0.5 text-[10px] font-medium text-zinc-300 backdrop-blur-md">
            {subBadge}
          </div>
        )}
      </div>

      {/* Card Metadata Footer (Exact Cinejoy spec: Title 1-line truncate, Release Year) */}
      <div className="mt-2 flex flex-col px-0.5">
        <h3 className="truncate text-xs sm:text-sm font-medium text-[#f8fafc] group-hover:text-white transition-colors" title={title}>
          {title}
        </h3>
        <div className="flex items-center gap-1.5 text-[11px] text-[#94a3b8] mt-0.5">
          {year && <span>{year}</span>}
          {year && <span>•</span>}
          <span className="uppercase font-medium text-[10px] tracking-wider text-zinc-400">
            {mediaType === 'tv' ? 'Series' : 'Movie'}
          </span>
        </div>
      </div>
    </div>
  );
};
