/**
 * Video player server configurations and URL builders
 */

export interface VideoServer {
  id: string;
  name: string;
  badge?: string;
}

export const VIDEO_SERVERS: VideoServer[] = [
  { id: 'vidy', name: 'Server 1 (Vidy)', badge: 'Default - Auto Resume' },
  { id: 'vidking', name: 'Server 2 (VidKing)', badge: 'Multi-Audio' },
  { id: 'vidsrc-pro', name: 'Server 3 (VidSrc Pro)', badge: 'Fast HD' },
  { id: 'vidsrc-xyz', name: 'Server 4 (VidSrc XYZ)', badge: 'Multi-Sub' },
  { id: 'autoembed', name: 'Server 5 (AutoEmbed)', badge: 'Adaptive' },
  { id: 'multiembed', name: 'Server 6 (MultiEmbed)', badge: 'Backup' },
];

export interface VidyParams {
  tmdbId: number;
  mediaType: 'movie' | 'tv';
  season?: number;
  episode?: number;
  progressSeconds?: number;
}

export function buildVidyEmbedUrl({
  tmdbId,
  mediaType,
  season = 1,
  episode = 1,
  progressSeconds,
}: VidyParams): string {
  const s = Math.max(1, season || 1);
  const e = Math.max(1, episode || 1);

  const baseUrl =
    mediaType === 'movie'
      ? `https://vidy.st/movie/${tmdbId}`
      : `https://vidy.st/tv/${tmdbId}/${s}/${e}`;

  const searchParams = new URLSearchParams();
  searchParams.set('color', 'DC2626');
  searchParams.set('autoplay', 'true');

  if (progressSeconds !== undefined && progressSeconds !== null) {
    const rounded = Math.round(progressSeconds);
    if (rounded > 5) {
      searchParams.set('progress', String(rounded));
    }
  }

  if (mediaType === 'tv') {
    searchParams.set('nextEpisode', 'true');
    searchParams.set('episodeSelector', 'true');
    searchParams.set('autoplayNextEpisode', 'true');
  }

  return `${baseUrl}?${searchParams.toString()}`;
}

export interface PlayerParams {
  serverId?: string;
  mediaType: 'movie' | 'tv';
  tmdbId: number;
  season?: number;
  episode?: number;
  progressSeconds?: number;
}

export function getEmbedUrl({
  serverId = 'vidy',
  mediaType,
  tmdbId,
  season = 1,
  episode = 1,
  progressSeconds,
}: PlayerParams): string {
  const s = Math.max(1, season || 1);
  const e = Math.max(1, episode || 1);

  switch (serverId) {
    case 'vidy':
      return buildVidyEmbedUrl({
        tmdbId,
        mediaType,
        season: s,
        episode: e,
        progressSeconds,
      });

    case 'vidking':
      return mediaType === 'movie'
        ? `https://www.vidking.net/embed/movie/${tmdbId}?autoPlay=true`
        : `https://www.vidking.net/embed/tv/${tmdbId}/${s}/${e}?autoPlay=true&nextEpisode=true&episodeSelector=true`;

    case 'vidsrc-pro':
      return mediaType === 'movie'
        ? `https://vidsrc.cc/v2/embed/movie/${tmdbId}`
        : `https://vidsrc.cc/v2/embed/tv/${tmdbId}/${s}/${e}`;

    case 'vidsrc-xyz':
      return mediaType === 'movie'
        ? `https://vidsrc.xyz/embed/movie?tmdb=${tmdbId}`
        : `https://vidsrc.xyz/embed/tv?tmdb=${tmdbId}&season=${s}&episode=${e}`;

    case 'autoembed':
      return mediaType === 'movie'
        ? `https://player.autoembed.cc/embed/movie/${tmdbId}`
        : `https://player.autoembed.cc/embed/tv/${tmdbId}/${s}/${e}`;

    case 'multiembed':
    default:
      return mediaType === 'movie'
        ? `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1`
        : `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1&s=${s}&e=${e}`;
  }
}
