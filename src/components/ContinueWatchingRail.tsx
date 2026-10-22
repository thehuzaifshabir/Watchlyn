import React from 'react';
import { Play, X, Clock, PlayCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getBackdropUrl, getImageUrl } from '../services/tmdb';
import { formatTimeRemaining, formatProgressTime } from '../utils/formatters';

export const ContinueWatchingRail: React.FC = () => {
  const { continueWatching, navigate, removeProgress } = useApp();

  if (!continueWatching || continueWatching.length === 0) {
    return null;
  }

  return (
    <section className="my-6 md:my-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-[#e50914]" />
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">Continue Watching</h2>
        </div>
        <span className="text-xs text-zinc-400 font-medium">Auto-Resuming on Vidy</span>
      </div>

      <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-3 pt-1 no-scrollbar snap-x snap-mandatory">
        {continueWatching.map((item) => {
          const thumbnail =
            getBackdropUrl(item.backdropPath, 'w780') ||
            getImageUrl(item.posterPath, 'w500');

          const hasEpisode = item.mediaType === 'tv' && item.season && item.episode;
          const episodeBadge = hasEpisode ? `S${item.season}:E${item.episode}` : 'Movie';

          // Time remaining or timestamp
          const timeRemaining = formatTimeRemaining(item.progressSeconds, item.durationSeconds);

          // Calculate percentage for visual progress bar
          const progressPercent =
            item.progressSeconds && item.durationSeconds && item.durationSeconds > 0
              ? Math.min(100, Math.max(5, (item.progressSeconds / item.durationSeconds) * 100))
              : item.progressSeconds && item.progressSeconds > 10
              ? 35
              : 15;

          const handleResume = () => {
            if (item.mediaType === 'tv') {
              navigate(`/tv/${item.tmdbId}?season=${item.season || 1}&episode=${item.episode || 1}`);
            } else {
              navigate(`/movie/${item.tmdbId}`);
            }
          };

          return (
            <div
              key={`${item.mediaType}-${item.tmdbId}`}
              className="group relative flex w-[220px] sm:w-[260px] shrink-0 flex-col overflow-hidden rounded-xl bg-[#121216] border border-[#1f1f26] shadow-md snap-start transition-transform duration-200 hover:scale-[1.02] cursor-pointer"
              onClick={handleResume}
            >
              {/* Thumbnail Container (16:9) */}
              <div className="relative aspect-video w-full overflow-hidden bg-zinc-900">
                {thumbnail ? (
                  <img
                    src={thumbnail}
                    alt={item.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-zinc-500">
                    {item.title}
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

                {/* Play Button Overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e50914] text-white shadow-lg backdrop-blur-sm group-hover:scale-110 transition-transform">
                    <Play className="h-5 w-5 fill-white ml-0.5" />
                  </div>
                </div>

                {/* S{season}:E{episode} Badge (Top Left) */}
                <div className="absolute top-2 left-2 rounded bg-black/85 px-2 py-0.5 text-[11px] font-bold text-amber-400 backdrop-blur-md shadow">
                  {episodeBadge}
                </div>

                {/* Remaining Time / Timestamp Badge (Bottom Left over thumbnail) */}
                {timeRemaining && (
                  <div className="absolute bottom-2.5 left-2 rounded bg-zinc-950/85 px-2 py-0.5 text-[10px] font-bold text-zinc-200 backdrop-blur-md border border-zinc-800">
                    {timeRemaining}
                  </div>
                )}

                {/* Remove Button (Top Right) */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeProgress(item.tmdbId, item.mediaType);
                  }}
                  aria-label={`Remove ${item.title} from continue watching`}
                  className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>

                {/* Bottom Crimson Progress Bar */}
                <div className="absolute inset-x-0 bottom-0 h-1.5 bg-zinc-800/90">
                  <div
                    className="h-full bg-[#e50914] shadow-sm shadow-red-500 transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Title & Info */}
              <div className="p-3">
                <h3 className="truncate text-xs sm:text-sm font-semibold text-white" title={item.title}>
                  {item.title}
                </h3>
                {item.episodeTitle && (
                  <p className="truncate text-[11px] text-zinc-400 mt-0.5">
                    {item.episodeTitle}
                  </p>
                )}
                <div className="mt-1 flex items-center justify-between text-[10px] text-zinc-500">
                  <span className="uppercase tracking-wider">{item.mediaType}</span>
                  <span className="text-[#e50914] font-medium flex items-center gap-1">
                    <PlayCircle className="h-3 w-3" />
                    <span>Resume Watch</span>
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
