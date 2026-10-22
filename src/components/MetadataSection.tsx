import React, { useState, useEffect } from 'react';
import { Star, ThumbsUp, ThumbsDown, Bookmark, Clock, DollarSign, Globe, Calendar, UserCheck } from 'lucide-react';
import { MovieDetails, TvDetails, CreditsResponse } from '../types';
import {
  formatRuntime,
  calculateEndsAt,
  formatCurrency,
  formatYear,
  formatRating,
  formatDateFull,
} from '../utils/formatters';
import { useApp } from '../context/AppContext';

interface MetadataSectionProps {
  media: MovieDetails | TvDetails;
  credits: CreditsResponse;
  certification: string;
}

export const MetadataSection: React.FC<MetadataSectionProps> = ({
  media,
  credits,
  certification,
}) => {
  const {
    getReactionData,
    toggleReaction,
    setAddToListTarget,
    isItemInWatchlist,
    toggleWatchlist,
  } = useApp();

  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // Update clock every minute so "Ends At" is live and accurate
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const isMovie = media.media_type === 'movie' || !('number_of_seasons' in media);
  const runtimeMinutes = isMovie
    ? (media as MovieDetails).runtime || 0
    : (media as TvDetails).episode_run_time?.[0] || 45;

  const endsAtText = runtimeMinutes > 0 ? calculateEndsAt(runtimeMinutes, currentTime) : '';
  const formattedRuntime = formatRuntime(runtimeMinutes);

  const title = media.title || media.name || 'Untitled';
  const releaseDate = media.release_date || media.first_air_date;
  const year = formatYear(releaseDate);
  const rating = formatRating(media.vote_average);
  const language = (media.original_language || 'en').toUpperCase();

  const budget = (media as MovieDetails).budget;
  const revenue = (media as MovieDetails).revenue;

  // Director or Creator
  const director = credits?.crew?.find((c) => c.job === 'Director');
  const creator = (media as TvDetails).created_by?.[0];
  const directorOrCreator = director?.name || creator?.name;

  const reactionData = getReactionData(media.id);
  const inWatchlist = isItemInWatchlist(media.id);

  return (
    <div className="mt-6 flex flex-col gap-5">
      {/* Title & Tagline */}
      <div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight">
          {title}
        </h1>
        {media.tagline && (
          <p className="mt-1 text-xs sm:text-sm italic text-zinc-400">"{media.tagline}"</p>
        )}
      </div>

      {/* Header Row: Genres, Year, Runtime, Certification, Rating */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm">
        {/* Rating Badge */}
        {rating !== 'NR' && (
          <div className="flex items-center gap-1 rounded-lg bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 font-bold text-amber-400 shadow-sm">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            <span>{rating} / 10</span>
          </div>
        )}

        {/* Certification Badge */}
        {certification && certification !== 'NR' && (
          <span className="rounded-lg border border-zinc-700 bg-zinc-800/80 px-2 py-1 font-mono text-xs font-bold text-white shadow-sm">
            {certification}
          </span>
        )}

        {/* Release Year */}
        {year && <span className="font-semibold text-zinc-300">{year}</span>}

        <span>•</span>

        {/* Runtime */}
        {runtimeMinutes > 0 && <span className="text-zinc-300 font-medium">{formattedRuntime}</span>}

        {/* Genre Pills */}
        {media.genres && media.genres.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 ml-1">
            {media.genres.map((g) => (
              <span
                key={g.id}
                className="rounded-full bg-zinc-800/90 border border-zinc-700 px-2.5 py-0.5 text-[11px] font-medium text-zinc-300"
              >
                {g.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Interactive Action Row: Likes, Dislikes, Add to List, Director */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#121216] border border-[#1f1f26] p-3 sm:p-4">
        <div className="flex items-center gap-2">
          {/* Like Button */}
          <button
            type="button"
            onClick={() => toggleReaction(media.id, 'like')}
            aria-label={`Like ${title}`}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition-all cursor-pointer min-h-[40px] ${
              reactionData.userReaction === 'like'
                ? 'bg-[#e50914] text-white shadow-md'
                : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white border border-zinc-800'
            }`}
          >
            <ThumbsUp className={`h-4 w-4 ${reactionData.userReaction === 'like' ? 'fill-white' : ''}`} />
            <span>{reactionData.likes}</span>
          </button>

          {/* Dislike Button */}
          <button
            type="button"
            onClick={() => toggleReaction(media.id, 'dislike')}
            aria-label={`Dislike ${title}`}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition-all cursor-pointer min-h-[40px] ${
              reactionData.userReaction === 'dislike'
                ? 'bg-zinc-700 text-white shadow-md'
                : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white border border-zinc-800'
            }`}
          >
            <ThumbsDown className={`h-4 w-4 ${reactionData.userReaction === 'dislike' ? 'fill-white' : ''}`} />
            <span>{reactionData.dislikes}</span>
          </button>

          {/* Add to List Dropdown / Modal Trigger */}
          <button
            type="button"
            onClick={() =>
              setAddToListTarget({
                id: media.id,
                mediaType: isMovie ? 'movie' : 'tv',
                title,
                posterPath: media.poster_path || null,
                year,
                rating: media.vote_average,
                addedAt: Date.now(),
              })
            }
            aria-label={`Add ${title} to custom list`}
            className="flex items-center gap-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 px-3.5 py-2 text-xs font-semibold text-white transition-all cursor-pointer min-h-[40px]"
          >
            <Bookmark className="h-4 w-4 text-[#e50914]" />
            <span>Add to List</span>
          </button>

          {/* Quick Watchlist toggle */}
          <button
            type="button"
            onClick={() =>
              toggleWatchlist({
                id: media.id,
                mediaType: isMovie ? 'movie' : 'tv',
                title,
                posterPath: media.poster_path || null,
                year,
                rating: media.vote_average,
              })
            }
            className={`hidden sm:flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-semibold transition-all cursor-pointer min-h-[40px] ${
              inWatchlist
                ? 'bg-red-950/40 text-red-400 border border-red-800/50'
                : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            <span>{inWatchlist ? '✓ In Watchlist' : '+ Watchlist'}</span>
          </button>
        </div>

        {/* Director / Creator credit */}
        {directorOrCreator && (
          <div className="flex items-center gap-1.5 text-xs text-zinc-400">
            <UserCheck className="h-4 w-4 text-zinc-500" />
            <span className="text-zinc-500">{director ? 'Directed by:' : 'Created by:'}</span>
            <span className="font-semibold text-zinc-200">{directorOrCreator}</span>
          </div>
        )}
      </div>

      {/* Live "Ends At" Calculator & Financial / Spec Pills (Exact Cinejoy requirement) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        {/* Live Ends At Calculator Pill */}
        {endsAtText && (
          <div className="flex flex-col rounded-xl bg-[#121216] border border-[#1f1f26] p-3 shadow-sm">
            <div className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-[#e50914]">
              <Clock className="h-3.5 w-3.5" />
              <span>Finishes At</span>
            </div>
            <div className="mt-1 text-sm font-extrabold text-white">
              Ends {endsAtText}
            </div>
            <span className="text-[10px] text-zinc-500">Live local clock</span>
          </div>
        )}

        {/* Language Pill */}
        <div className="flex flex-col rounded-xl bg-[#121216] border border-[#1f1f26] p-3 shadow-sm">
          <div className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
            <Globe className="h-3.5 w-3.5" />
            <span>Language</span>
          </div>
          <div className="mt-1 text-sm font-extrabold text-white">{language}</div>
          <span className="text-[10px] text-zinc-500">Original Audio</span>
        </div>

        {/* Release Date */}
        {releaseDate && (
          <div className="flex flex-col rounded-xl bg-[#121216] border border-[#1f1f26] p-3 shadow-sm">
            <div className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              <Calendar className="h-3.5 w-3.5" />
              <span>Release Date</span>
            </div>
            <div className="mt-1 text-sm font-extrabold text-white truncate">
              {formatDateFull(releaseDate)}
            </div>
            <span className="text-[10px] text-zinc-500">Theatrical / Air</span>
          </div>
        )}

        {/* Budget */}
        {budget && budget > 0 ? (
          <div className="flex flex-col rounded-xl bg-[#121216] border border-[#1f1f26] p-3 shadow-sm">
            <div className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              <DollarSign className="h-3.5 w-3.5" />
              <span>Budget</span>
            </div>
            <div className="mt-1 text-sm font-extrabold text-emerald-400 truncate">
              {formatCurrency(budget)}
            </div>
            <span className="text-[10px] text-zinc-500">Production</span>
          </div>
        ) : null}

        {/* Revenue */}
        {revenue && revenue > 0 ? (
          <div className="flex flex-col rounded-xl bg-[#121216] border border-[#1f1f26] p-3 shadow-sm">
            <div className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              <DollarSign className="h-3.5 w-3.5" />
              <span>Box Office</span>
            </div>
            <div className="mt-1 text-sm font-extrabold text-emerald-400 truncate">
              {formatCurrency(revenue)}
            </div>
            <span className="text-[10px] text-zinc-500">Worldwide Gross</span>
          </div>
        ) : null}
      </div>

      {/* Overview */}
      {media.overview && (
        <div className="rounded-2xl bg-[#121216] border border-[#1f1f26] p-4 sm:p-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-2">
            Storyline
          </h2>
          <p className="text-sm sm:text-base text-zinc-300 leading-relaxed">
            {media.overview}
          </p>
        </div>
      )}
    </div>
  );
};
