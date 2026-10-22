import {
  MediaItem,
  MovieDetails,
  TvDetails,
  TvSeasonDetails,
  CreditsResponse,
  PersonCombinedCredits,
  PersonDetails,
  Genre,
  WatchProvider,
} from '../types';

const API_KEY = 'fb55e7723094aeaefcea98f7d1b1df16';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

// In-memory request cache (TTL: 10 minutes)
interface CacheEntry {
  data: any;
  timestamp: number;
}
const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 10 * 60 * 1000;

export const OTT_PROVIDERS: WatchProvider[] = [
  { id: 8, name: 'Netflix', logo: 'https://images.ctfassets.net/4cd45et68cgf/Rx83wWuqcdtYrbe2RBixJ/137b3d4d51e3e3863d42861036590602/Netflix-Symbol.png', color: '#E50914' },
  { id: 337, name: 'Disney+', logo: 'https://cnbl-cdn.bamgrid.com/assets/7ecc8bcb60ad77193058d63e321bd21cbac2fc67281dbd9927676ea4a4c83594/original', color: '#113CCF' },
  { id: 9, name: 'Prime Video', logo: 'https://m.media-amazon.com/images/G/01/digital/video/acquisition/amazon_video_light_quality._CB485934890_.png', color: '#00A8E1' },
  { id: 350, name: 'Apple TV+', logo: 'https://tv.apple.com/assets/brand/appletvplus-logo.svg', color: '#FFFFFF' },
  { id: 1899, name: 'Max', logo: 'https://play-lh.googleusercontent.com/1-hPxOdh_KffclGnQ6LgnqCCvIwNuAtZZFdNetUakZKNeystZsJoyFsQKWKnSLWuXnc', color: '#002BE7' },
  { id: 386, name: 'Peacock', logo: 'https://images.ctfassets.net/70b0h2i565t9/5q1j5aP8fE9mXz3WfL2oG4/peacock.png', color: '#000000' },
  { id: 15, name: 'Hulu', logo: 'https://assetshuluimcom-a.akamaihd.net/h3o/icons/favicon/favicon.ico', color: '#1CE783' },
  { id: 531, name: 'Paramount+', logo: 'https://www.paramountplus.com/favicon.ico', color: '#0064FF' },
];

async function fetchFromTmdb<T>(endpoint: string, params: Record<string, string | number | boolean | undefined> = {}): Promise<T> {
  const urlObj = new URL(`${BASE_URL}${endpoint}`);
  urlObj.searchParams.set('api_key', API_KEY);

  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      urlObj.searchParams.set(key, String(val));
    }
  });

  const cacheKey = urlObj.toString();
  const cached = cache.get(cacheKey);
  const now = Date.now();
  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return cached.data as T;
  }

  const res = await fetch(cacheKey);
  if (!res.ok) {
    throw new Error(`TMDB API Error: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  cache.set(cacheKey, { data, timestamp: now });
  return data as T;
}

export function getImageUrl(path?: string | null, size: 'w185' | 'w342' | 'w500' | 'w780' | 'original' = 'w500'): string {
  if (!path) return '';
  return `${IMAGE_BASE_URL}/${size}${path}`;
}

export function getBackdropUrl(path?: string | null, size: 'w780' | 'w1280' | 'original' = 'original'): string {
  if (!path) return '';
  return `${IMAGE_BASE_URL}/${size}${path}`;
}

export function getProfileUrl(path?: string | null, size: 'w185' | 'h632' | 'original' = 'w185'): string {
  if (!path) return '';
  return `${IMAGE_BASE_URL}/${size}${path}`;
}

// Trending & Editorial Rails
export async function fetchTrendingAll(timeWindow: 'day' | 'week' = 'day'): Promise<MediaItem[]> {
  const data = await fetchFromTmdb<{ results: MediaItem[] }>(`/trending/all/${timeWindow}`);
  return (data.results || []).filter(item => item.media_type !== 'person');
}

export async function fetchTrendingMovies(timeWindow: 'day' | 'week' = 'week'): Promise<MediaItem[]> {
  const data = await fetchFromTmdb<{ results: MediaItem[] }>(`/trending/movie/${timeWindow}`);
  return (data.results || []).map(m => ({ ...m, media_type: 'movie' }));
}

export async function fetchTrendingSeries(timeWindow: 'day' | 'week' = 'week'): Promise<MediaItem[]> {
  const data = await fetchFromTmdb<{ results: MediaItem[] }>(`/trending/tv/${timeWindow}`);
  return (data.results || []).map(s => ({ ...s, media_type: 'tv' }));
}

export async function fetchTopRatedMovies(page = 1): Promise<{ results: MediaItem[]; total_pages: number }> {
  const data = await fetchFromTmdb<{ results: MediaItem[]; total_pages: number }>('/movie/top_rated', { page });
  return {
    results: (data.results || []).map(m => ({ ...m, media_type: 'movie' })),
    total_pages: data.total_pages || 1,
  };
}

export async function fetchTopRatedSeries(page = 1): Promise<{ results: MediaItem[]; total_pages: number }> {
  const data = await fetchFromTmdb<{ results: MediaItem[]; total_pages: number }>('/tv/top_rated', { page });
  return {
    results: (data.results || []).map(s => ({ ...s, media_type: 'tv' })),
    total_pages: data.total_pages || 1,
  };
}

export async function fetchOnTheAirSeries(page = 1): Promise<MediaItem[]> {
  const data = await fetchFromTmdb<{ results: MediaItem[] }>('/tv/on_the_air', { page });
  return (data.results || []).map(s => ({ ...s, media_type: 'tv' }));
}

export async function fetchAwardWinningMovies(page = 1): Promise<MediaItem[]> {
  // Discover acclaimed movies with high vote count and top ratings
  const data = await fetchFromTmdb<{ results: MediaItem[] }>('/discover/movie', {
    page,
    sort_by: 'vote_average.desc',
    'vote_count.gte': 5000,
    with_original_language: 'en|fr|ko|ja',
  });
  return (data.results || []).map(m => ({ ...m, media_type: 'movie' }));
}

export async function fetchAwardWinningShows(page = 1): Promise<MediaItem[]> {
  // High vote count critically acclaimed series
  const data = await fetchFromTmdb<{ results: MediaItem[] }>('/discover/tv', {
    page,
    sort_by: 'vote_average.desc',
    'vote_count.gte': 2500,
  });
  return (data.results || []).map(s => ({ ...s, media_type: 'tv' }));
}

export async function fetchPsychologicalThrillers(page = 1): Promise<MediaItem[]> {
  const data = await fetchFromTmdb<{ results: MediaItem[] }>('/discover/movie', {
    page,
    with_genres: '53,9648', // Thriller + Mystery
    sort_by: 'vote_average.desc',
    'vote_count.gte': 1500,
  });
  return (data.results || []).map(m => ({ ...m, media_type: 'movie' }));
}

export async function fetchCannesAcclaimed(page = 1): Promise<MediaItem[]> {
  const data = await fetchFromTmdb<{ results: MediaItem[] }>('/discover/movie', {
    page,
    sort_by: 'vote_average.desc',
    'vote_count.gte': 3000,
    with_original_language: 'fr|ko|ja|it|en',
  });
  return (data.results || []).map(m => ({ ...m, media_type: 'movie' }));
}

export async function fetchMoviesByProvider(providerId: number, page = 1): Promise<MediaItem[]> {
  const data = await fetchFromTmdb<{ results: MediaItem[] }>('/discover/movie', {
    page,
    with_watch_providers: providerId,
    watch_region: 'US',
    sort_by: 'popularity.desc',
  });
  return (data.results || []).map(m => ({ ...m, media_type: 'movie' }));
}

export async function fetchSeriesByProvider(providerId: number, page = 1): Promise<MediaItem[]> {
  const data = await fetchFromTmdb<{ results: MediaItem[] }>('/discover/tv', {
    page,
    with_watch_providers: providerId,
    watch_region: 'US',
    sort_by: 'popularity.desc',
  });
  return (data.results || []).map(s => ({ ...s, media_type: 'tv' }));
}

// Genres
export async function fetchMovieGenres(): Promise<Genre[]> {
  const data = await fetchFromTmdb<{ genres: Genre[] }>('/genre/movie/list');
  return data.genres || [];
}

export async function fetchTvGenres(): Promise<Genre[]> {
  const data = await fetchFromTmdb<{ genres: Genre[] }>('/genre/tv/list');
  return data.genres || [];
}

// Filtered Catalogs
export interface MovieFilterParams {
  page?: number;
  genreId?: number | string;
  year?: string | number;
  sortBy?: string;
  providerId?: number | string;
  country?: string;
}

export async function discoverMovies(filters: MovieFilterParams): Promise<{ results: MediaItem[]; total_pages: number }> {
  const params: Record<string, any> = {
    page: filters.page || 1,
    sort_by: filters.sortBy || 'popularity.desc',
  };
  if (filters.genreId) params.with_genres = filters.genreId;
  if (filters.year) params.primary_release_year = filters.year;
  if (filters.providerId) {
    params.with_watch_providers = filters.providerId;
    params.watch_region = 'US';
  }
  if (filters.country) params.with_origin_country = filters.country;

  const data = await fetchFromTmdb<{ results: MediaItem[]; total_pages: number }>('/discover/movie', params);
  return {
    results: (data.results || []).map(m => ({ ...m, media_type: 'movie' })),
    total_pages: Math.min(data.total_pages || 1, 500),
  };
}

export interface TvFilterParams {
  page?: number;
  genreId?: number | string;
  year?: string | number;
  sortBy?: string;
  providerId?: number | string;
  country?: string;
}

export async function discoverTv(filters: TvFilterParams): Promise<{ results: MediaItem[]; total_pages: number }> {
  const params: Record<string, any> = {
    page: filters.page || 1,
    sort_by: filters.sortBy || 'popularity.desc',
  };
  if (filters.genreId) params.with_genres = filters.genreId;
  if (filters.year) params.first_air_date_year = filters.year;
  if (filters.providerId) {
    params.with_watch_providers = filters.providerId;
    params.watch_region = 'US';
  }
  if (filters.country) params.with_origin_country = filters.country;

  const data = await fetchFromTmdb<{ results: MediaItem[]; total_pages: number }>('/discover/tv', params);
  return {
    results: (data.results || []).map(s => ({ ...s, media_type: 'tv' })),
    total_pages: Math.min(data.total_pages || 1, 500),
  };
}

// Media Details with appended credits, videos, and recommendations
export async function fetchMovieDetails(id: number): Promise<{
  movie: MovieDetails;
  credits: CreditsResponse;
  certification: string;
}> {
  const data = await fetchFromTmdb<any>(`/movie/${id}`, {
    append_to_response: 'credits,videos,recommendations,release_dates,similar',
  });

  // Extract US certification if available
  let cert = 'NR';
  if (data.release_dates && Array.isArray(data.release_dates.results)) {
    const usRel = data.release_dates.results.find((r: any) => r.iso_3166_1 === 'US');
    if (usRel && Array.isArray(usRel.release_dates)) {
      const match = usRel.release_dates.find((d: any) => d.certification && d.certification.trim() !== '');
      if (match) cert = match.certification;
    }
  }

  const credits: CreditsResponse = data.credits || { id, cast: [], crew: [] };

  return {
    movie: { ...data, media_type: 'movie' },
    credits,
    certification: cert,
  };
}

export async function fetchTvDetails(id: number): Promise<{
  tv: TvDetails;
  credits: CreditsResponse;
  certification: string;
}> {
  const data = await fetchFromTmdb<any>(`/tv/${id}`, {
    append_to_response: 'credits,videos,recommendations,content_ratings,similar',
  });

  // Extract US content rating
  let cert = 'TV-MA';
  if (data.content_ratings && Array.isArray(data.content_ratings.results)) {
    const usRating = data.content_ratings.results.find((r: any) => r.iso_3166_1 === 'US');
    if (usRating && usRating.rating) {
      cert = usRating.rating;
    }
  }

  const credits: CreditsResponse = data.credits || { id, cast: [], crew: [] };

  return {
    tv: { ...data, media_type: 'tv' },
    credits,
    certification: cert,
  };
}

export async function fetchTvSeasonDetails(tvId: number, seasonNumber: number): Promise<TvSeasonDetails> {
  const data = await fetchFromTmdb<TvSeasonDetails>(`/tv/${tvId}/season/${seasonNumber}`);
  return data;
}

// Multi Search
export async function searchMulti(query: string, page = 1): Promise<{ results: MediaItem[]; total_pages: number }> {
  if (!query || !query.trim()) {
    return { results: [], total_pages: 0 };
  }
  const data = await fetchFromTmdb<{ results: MediaItem[]; total_pages: number }>('/search/multi', {
    query: query.trim(),
    page,
    include_adult: false,
  });

  return {
    results: (data.results || []).filter(item => item.media_type !== 'person' || (item as any).profile_path),
    total_pages: Math.min(data.total_pages || 1, 50),
  };
}

// Person Details and Credits
export async function fetchPersonDetails(personId: number): Promise<PersonDetails> {
  return await fetchFromTmdb<PersonDetails>(`/person/${personId}`);
}

export async function fetchPersonCombinedCredits(personId: number): Promise<PersonCombinedCredits> {
  return await fetchFromTmdb<PersonCombinedCredits>(`/person/${personId}/combined_credits`);
}

// Dedicated Anime Endpoints
export async function fetchTrendingAnime(page = 1): Promise<MediaItem[]> {
  const data = await fetchFromTmdb<{ results: MediaItem[] }>('/discover/tv', {
    page,
    with_genres: 16,
    with_origin_country: 'JP',
    sort_by: 'popularity.desc',
  });
  return (data.results || []).map((s) => ({ ...s, media_type: 'tv' }));
}

export async function fetchAiringAnime(page = 1): Promise<MediaItem[]> {
  // Discover seasonal / active anime series
  const data = await fetchFromTmdb<{ results: MediaItem[] }>('/discover/tv', {
    page,
    with_genres: 16,
    with_origin_country: 'JP',
    'first_air_date.gte': '2023-01-01',
    sort_by: 'popularity.desc',
  });
  return (data.results || []).map((s) => ({ ...s, media_type: 'tv' }));
}

export async function fetchTopRatedAnime(page = 1): Promise<MediaItem[]> {
  const data = await fetchFromTmdb<{ results: MediaItem[] }>('/discover/tv', {
    page,
    with_genres: 16,
    with_origin_country: 'JP',
    sort_by: 'vote_average.desc',
    'vote_count.gte': 1000,
  });
  return (data.results || []).map((s) => ({ ...s, media_type: 'tv' }));
}

export async function fetchPopularAnimeMovies(page = 1): Promise<MediaItem[]> {
  const data = await fetchFromTmdb<{ results: MediaItem[] }>('/discover/movie', {
    page,
    with_genres: 16,
    with_origin_country: 'JP',
    sort_by: 'popularity.desc',
  });
  return (data.results || []).map((m) => ({ ...m, media_type: 'movie' }));
}

export async function fetchShonenAnime(page = 1): Promise<MediaItem[]> {
  const data = await fetchFromTmdb<{ results: MediaItem[] }>('/discover/tv', {
    page,
    with_genres: '16,10759', // Animation + Action & Adventure
    with_origin_country: 'JP',
    sort_by: 'popularity.desc',
  });
  return (data.results || []).map((s) => ({ ...s, media_type: 'tv' }));
}

export async function fetchDarkFantasyAnime(page = 1): Promise<MediaItem[]> {
  const data = await fetchFromTmdb<{ results: MediaItem[] }>('/discover/tv', {
    page,
    with_genres: '16,10765,9648', // Animation + Sci-Fi/Fantasy + Mystery
    with_origin_country: 'JP',
    sort_by: 'vote_average.desc',
    'vote_count.gte': 300,
  });
  return (data.results || []).map((s) => ({ ...s, media_type: 'tv' }));
}

export interface AnimeFilterParams {
  page?: number;
  type?: 'tv' | 'movie';
  subGenreId?: string | number;
  year?: string | number;
  sortBy?: string;
}

export async function discoverAnimeCatalog(filters: AnimeFilterParams): Promise<{ results: MediaItem[]; total_pages: number }> {
  const endpoint = filters.type === 'movie' ? '/discover/movie' : '/discover/tv';
  const params: Record<string, any> = {
    page: filters.page || 1,
    with_genres: filters.subGenreId ? `16,${filters.subGenreId}` : 16,
    with_origin_country: 'JP',
    sort_by: filters.sortBy || 'popularity.desc',
  };

  if (filters.year) {
    if (filters.type === 'movie') {
      params.primary_release_year = filters.year;
    } else {
      params.first_air_date_year = filters.year;
    }
  }

  const data = await fetchFromTmdb<{ results: MediaItem[]; total_pages: number }>(endpoint, params);
  return {
    results: (data.results || []).map((item) => ({
      ...item,
      media_type: filters.type === 'movie' ? 'movie' : 'tv',
    })),
    total_pages: Math.min(data.total_pages || 1, 500),
  };
}

