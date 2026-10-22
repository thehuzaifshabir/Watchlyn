import React, { useState, useEffect } from 'react';
import { Search, Play, Clock, Calendar, CheckCircle2 } from 'lucide-react';
import { TvSeasonSummary, TvEpisode } from '../types';
import { fetchTvSeasonDetails, getImageUrl } from '../services/tmdb';
import { formatRuntime, formatDateFull } from '../utils/formatters';

interface SeasonEpisodeSelectorProps {
  tvId: number;
  seasons: TvSeasonSummary[];
  activeSeason: number;
  activeEpisode: number;
  onSelectEpisode: (season: number, episode: number, episodeTitle?: string) => void;
}

export const SeasonEpisodeSelector: React.FC<SeasonEpisodeSelectorProps> = ({
  tvId,
  seasons,
  activeSeason,
  activeEpisode,
  onSelectEpisode,
}) => {
  // Sort regular numbered seasons (Season 1, 2, ...) first in ascending order, then append specials (Season 0) so all seasons are available
  const regularSeasons = [...seasons]
    .filter((s) => s.season_number > 0)
    .sort((a, b) => a.season_number - b.season_number);
  const specials = seasons.filter((s) => s.season_number === 0);
  const displaySeasons = regularSeasons.length > 0 ? [...regularSeasons, ...specials] : seasons;

  const [selectedSeasonNumber, setSelectedSeasonNumber] = useState<number>(
    activeSeason || regularSeasons[0]?.season_number || 1
  );
  const [episodes, setEpisodes] = useState<TvEpisode[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoadingEpisodes, setIsLoadingEpisodes] = useState<boolean>(true);

  // Sync selectedSeasonNumber when activeSeason prop changes
  useEffect(() => {
    if (activeSeason) {
      setSelectedSeasonNumber(activeSeason);
    }
  }, [activeSeason]);

  // Load episodes when selectedSeasonNumber or tvId changes
  useEffect(() => {
    let isCancelled = false;
    setIsLoadingEpisodes(true);

    fetchTvSeasonDetails(tvId, selectedSeasonNumber)
      .then((data) => {
        if (!isCancelled) {
          setEpisodes(data.episodes || []);
          setIsLoadingEpisodes(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load season episodes:', err);
        if (!isCancelled) {
          setEpisodes([]);
          setIsLoadingEpisodes(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [tvId, selectedSeasonNumber]);

  const filteredEpisodes = episodes.filter((ep) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      ep.name.toLowerCase().includes(q) ||
      `episode ${ep.episode_number}`.includes(q) ||
      `e${ep.episode_number}`.includes(q)
    );
  });

  return (
    <div className="mt-8 rounded-2xl bg-[#121216] border border-[#1f1f26] p-4 sm:p-6 shadow-xl">
      {/* Controls Bar: Season Selector Dropdown + Search Episode */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#1f1f26]">
        <div className="flex flex-wrap items-center gap-3">
          <label htmlFor="season-select" className="text-sm font-bold uppercase tracking-wider text-zinc-300">
            Season:
          </label>
          <div className="relative">
            <select
              id="season-select"
              value={selectedSeasonNumber}
              onChange={(e) => setSelectedSeasonNumber(Number(e.target.value))}
              className="appearance-none rounded-xl bg-zinc-900 border border-zinc-700/80 px-4 py-2.5 pr-10 text-sm font-bold text-white shadow-inner focus:border-[#e50914] focus:outline-none cursor-pointer min-h-[44px]"
            >
              {displaySeasons.map((s) => (
                <option key={s.id} value={s.season_number} className="bg-zinc-900 text-white">
                  {s.name || `Season ${s.season_number}`} ({s.episode_count} Episodes)
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400">
              ▼
            </div>
          </div>

          {selectedSeasonNumber !== activeSeason && (
            <button
              type="button"
              onClick={() => onSelectEpisode(selectedSeasonNumber, 1)}
              className="rounded-xl bg-[#e50914] hover:bg-red-700 px-3 py-2 text-xs font-bold text-white shadow-md transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Play className="h-3.5 w-3.5 fill-white" />
              <span>Play Season {selectedSeasonNumber} Ep 1</span>
            </button>
          )}
        </div>

        {/* Episode Search Bar */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search episode title or #..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl bg-zinc-900 border border-zinc-700/80 pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-[#e50914] focus:outline-none"
          />
        </div>
      </div>

      {/* Episodes List */}
      <div className="mt-5">
        {isLoadingEpisodes ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="h-28 rounded-xl bg-zinc-900/60 animate-pulse border border-zinc-800" />
            ))}
          </div>
        ) : filteredEpisodes.length === 0 ? (
          <div className="py-8 text-center text-sm text-zinc-400">
            No episodes found for this season.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 max-h-[580px] overflow-y-auto pr-1">
            {filteredEpisodes.map((ep) => {
              const isActive =
                selectedSeasonNumber === activeSeason && ep.episode_number === activeEpisode;
              const thumbnail = getImageUrl(ep.still_path, 'w342');

              return (
                <div
                  key={ep.id}
                  onClick={() => onSelectEpisode(selectedSeasonNumber, ep.episode_number, ep.name)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectEpisode(selectedSeasonNumber, ep.episode_number, ep.name);
                    }
                  }}
                  className={`group relative flex gap-3 rounded-xl p-2.5 transition-all cursor-pointer border ${
                    isActive
                      ? 'bg-zinc-800/90 border-[#e50914] ring-1 ring-[#e50914] shadow-lg shadow-red-950/20'
                      : 'bg-zinc-900/70 border-zinc-800/80 hover:bg-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  {/* Episode Still / Thumbnail */}
                  <div className="relative aspect-video w-28 sm:w-32 shrink-0 overflow-hidden rounded-lg bg-zinc-950">
                    {thumbnail ? (
                      <img
                        src={thumbnail}
                        alt={ep.name}
                        loading="lazy"
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[10px] text-zinc-600 bg-zinc-950">
                        No Still
                      </div>
                    )}

                    {/* Episode Number Badge */}
                    <div className="absolute top-1 left-1 rounded bg-black/85 px-1.5 py-0.5 text-[10px] font-bold text-amber-400">
                      E{ep.episode_number}
                    </div>

                    {/* Play icon overlay */}
                    <div
                      className={`absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity ${
                        isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      }`}
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e50914] text-white">
                        <Play className="h-4 w-4 fill-white ml-0.5" />
                      </div>
                    </div>
                  </div>

                  {/* Episode Details */}
                  <div className="flex flex-1 flex-col justify-center min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white truncate" title={ep.name}>
                        {ep.episode_number}. {ep.name || `Episode ${ep.episode_number}`}
                      </span>
                    </div>

                    <div className="mt-1 flex items-center gap-2 text-[10px] text-zinc-400">
                      {ep.runtime && (
                        <div className="flex items-center gap-0.5">
                          <Clock className="h-3 w-3 text-zinc-500" />
                          <span>{formatRuntime(ep.runtime)}</span>
                        </div>
                      )}
                      {ep.air_date && (
                        <div className="flex items-center gap-0.5">
                          <Calendar className="h-3 w-3 text-zinc-500" />
                          <span>{formatDateFull(ep.air_date)}</span>
                        </div>
                      )}
                    </div>

                    {ep.overview && (
                      <p className="mt-1 line-clamp-2 text-[11px] text-zinc-400 leading-snug">
                        {ep.overview}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
