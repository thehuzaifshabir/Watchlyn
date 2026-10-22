import React, { useState, useEffect } from 'react';
import { ArrowLeft, Share2, Star } from 'lucide-react';
import { MovieDetails, TvDetails, CreditsResponse, VideoItem, MediaItem } from '../types';
import { fetchMovieDetails, fetchTvDetails } from '../services/tmdb';
import { VideoPlayer } from '../components/VideoPlayer';
import { SeasonEpisodeSelector } from '../components/SeasonEpisodeSelector';
import { MetadataSection } from '../components/MetadataSection';
import { CastCarousel } from '../components/CastCarousel';
import { TrailersSection } from '../components/TrailersSection';
import { CommentsSection } from '../components/CommentsSection';
import { MediaRail } from '../components/MediaRail';
import { useApp } from '../context/AppContext';

interface DetailViewProps {
  mediaType: 'movie' | 'tv';
  id: number;
}

export const DetailView: React.FC<DetailViewProps> = ({ mediaType, id }) => {
  const { route, navigate, saveProgress, showToast } = useApp();

  const [media, setMedia] = useState<MovieDetails | TvDetails | null>(null);
  const [credits, setCredits] = useState<CreditsResponse | null>(null);
  const [certification, setCertification] = useState<string>('NR');
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [recommendations, setRecommendations] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Parse season & episode from query if TV
  const searchParams = new URLSearchParams(route.search);
  const initialSeason = parseInt(searchParams.get('season') || '1', 10);
  const initialEpisode = parseInt(searchParams.get('episode') || '1', 10);

  const [activeSeason, setActiveSeason] = useState<number>(initialSeason);
  const [activeEpisode, setActiveEpisode] = useState<number>(initialEpisode);

  // Sync state if query changes
  useEffect(() => {
    const s = parseInt(searchParams.get('season') || '1', 10);
    const e = parseInt(searchParams.get('episode') || '1', 10);
    setActiveSeason(s);
    setActiveEpisode(e);
  }, [route.search]);

  // Load Title Details
  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);

    const loadData = mediaType === 'movie' ? fetchMovieDetails(id) : fetchTvDetails(id);

    loadData
      .then((res: any) => {
        if (!isCancelled) {
          const detailData = mediaType === 'movie' ? res.movie : res.tv;
          setMedia(detailData);
          setCredits(res.credits);
          setCertification(res.certification);

          // Videos
          if (detailData.videos && Array.isArray(detailData.videos.results)) {
            setVideos(detailData.videos.results);
          }

          // Recommendations
          const recs =
            detailData.recommendations?.results?.length > 0
              ? detailData.recommendations.results
              : detailData.similar?.results || [];
          setRecommendations(
            recs.map((r: any) => ({
              ...r,
              media_type: mediaType,
            }))
          );

          // Save to Continue Watching
          const title = detailData.title || detailData.name || 'Untitled';
          if (mediaType === 'movie') {
            saveProgress({
              tmdbId: id,
              mediaType: 'movie',
              title,
              posterPath: detailData.poster_path || null,
              backdropPath: detailData.backdrop_path || null,
              runtimeMinutes: (detailData as MovieDetails).runtime,
            });
          } else {
            saveProgress({
              tmdbId: id,
              mediaType: 'tv',
              title,
              posterPath: detailData.poster_path || null,
              backdropPath: detailData.backdrop_path || null,
              season: activeSeason,
              episode: activeEpisode,
            });
          }

          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load media details:', err);
        if (!isCancelled) setIsLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [mediaType, id]);

  const handleSelectEpisode = (seasonNum: number, episodeNum: number, episodeTitle?: string) => {
    setActiveSeason(seasonNum);
    setActiveEpisode(episodeNum);

    // Update URL query without full page reload
    const newUrl = `/tv/${id}?season=${seasonNum}&episode=${episodeNum}`;
    window.history.replaceState(null, '', newUrl);

    if (media) {
      saveProgress({
        tmdbId: id,
        mediaType: 'tv',
        title: media.title || media.name || 'Untitled',
        posterPath: media.poster_path || null,
        backdropPath: media.backdrop_path || null,
        season: seasonNum,
        episode: episodeNum,
        episodeTitle,
      });
      showToast(`Playing Season ${seasonNum} • Episode ${episodeNum}`, 'info');
    }

    // Smooth scroll to player container on mobile
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleShare = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      showToast('Link copied to clipboard!', 'success');
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 min-h-screen">
        <div className="aspect-video w-full rounded-2xl bg-zinc-900 animate-pulse border border-zinc-800" />
        <div className="mt-6 h-8 w-1/3 rounded bg-zinc-800 animate-pulse" />
        <div className="mt-3 h-4 w-1/4 rounded bg-zinc-800/60 animate-pulse" />
        <div className="mt-6 h-24 w-full rounded bg-zinc-900/50 animate-pulse" />
      </div>
    );
  }

  if (!media) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <h2 className="text-xl font-bold text-white">Title not found</h2>
        <p className="text-zinc-400 text-sm mt-1">
          The requested media could not be located on TMDB.
        </p>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="mt-4 rounded-xl bg-[#e50914] px-5 py-2.5 text-xs font-bold text-white hover:bg-red-700 cursor-pointer"
        >
          Back to Home
        </button>
      </div>
    );
  }

  const title = media.title || media.name || 'Untitled';
  const tvDetails = mediaType === 'tv' ? (media as TvDetails) : null;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 sm:py-6 min-h-screen">
      {/* Top Breadcrumb & Share */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </button>

        <button
          type="button"
          onClick={handleShare}
          aria-label="Share title"
          className="flex items-center gap-1.5 rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          <Share2 className="h-3.5 w-3.5" />
          <span>Share</span>
        </button>
      </div>

      {/* 1. Working Multi-Server Video Player Container (16:9) */}
      <VideoPlayer
        mediaType={mediaType}
        tmdbId={id}
        season={activeSeason}
        episode={activeEpisode}
        title={title}
        posterPath={media.poster_path}
        backdropPath={media.backdrop_path}
        onEpisodeEnded={() => {
          if (mediaType === 'tv' && tvDetails?.seasons) {
            const currentSeasonData = tvDetails.seasons.find((s) => s.season_number === activeSeason);
            if (currentSeasonData && activeEpisode < currentSeasonData.episode_count) {
              handleSelectEpisode(activeSeason, activeEpisode + 1);
            }
          }
        }}
      />

      {/* 2. TV Series Season & Episode Selector (For TV Only) */}
      {mediaType === 'tv' && tvDetails?.seasons && (
        <SeasonEpisodeSelector
          tvId={id}
          seasons={tvDetails.seasons}
          activeSeason={activeSeason}
          activeEpisode={activeEpisode}
          onSelectEpisode={handleSelectEpisode}
        />
      )}

      {/* 3. Minute-Detail Metadata Section (Exact Cinejoy Layout) */}
      {credits && (
        <MetadataSection
          media={media}
          credits={credits}
          certification={certification}
        />
      )}

      {/* 4. Top Cast Carousel */}
      {credits?.cast && <CastCarousel cast={credits.cast} />}

      {/* 5. Official YouTube Trailers */}
      <TrailersSection videos={videos} />

      {/* 6. Comments Section with Real Persistence */}
      <CommentsSection tmdbId={id} />

      {/* 7. You Might Also Like */}
      {recommendations.length > 0 && (
        <MediaRail
          title="You Might Also Like"
          items={recommendations}
        />
      )}
    </div>
  );
};
