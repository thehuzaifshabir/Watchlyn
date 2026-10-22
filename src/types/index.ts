export type MediaType = 'movie' | 'tv' | 'person';

export interface MediaItem {
  id: number;
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  vote_average?: number;
  vote_count?: number;
  release_date?: string;
  first_air_date?: string;
  genre_ids?: number[];
  genres?: { id: number; name: string }[];
  media_type?: MediaType;
  popularity?: number;
  origin_country?: string[];
  original_language?: string;
}

export interface TvSeasonSummary {
  id: number;
  season_number: number;
  name: string;
  episode_count: number;
  air_date?: string;
  poster_path?: string | null;
  overview?: string;
}

export interface MovieDetails extends MediaItem {
  runtime?: number;
  budget?: number;
  revenue?: number;
  status?: string;
  tagline?: string;
  spoken_languages?: { english_name: string; iso_639_1: string; name: string }[];
}

export interface TvDetails extends MediaItem {
  number_of_seasons?: number;
  number_of_episodes?: number;
  episode_run_time?: number[];
  seasons?: TvSeasonSummary[];
  status?: string;
  tagline?: string;
  created_by?: { id: number; name: string; profile_path?: string | null }[];
  spoken_languages?: { english_name: string; iso_639_1: string; name: string }[];
}

export interface TvEpisode {
  id: number;
  name: string;
  overview: string;
  episode_number: number;
  season_number: number;
  still_path?: string | null;
  air_date?: string;
  runtime?: number;
  vote_average?: number;
  vote_count?: number;
}

export interface TvSeasonDetails {
  id: number;
  season_number: number;
  name: string;
  overview: string;
  episodes: TvEpisode[];
  air_date?: string;
  poster_path?: string | null;
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
}

export interface CrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
}

export interface CreditsResponse {
  id: number;
  cast: CastMember[];
  crew: CrewMember[];
}

export interface PersonCreditItem extends MediaItem {
  character?: string;
  job?: string;
}

export interface PersonCombinedCredits {
  id: number;
  cast: PersonCreditItem[];
  crew: PersonCreditItem[];
}

export interface PersonDetails {
  id: number;
  name: string;
  biography?: string;
  birthday?: string;
  place_of_birth?: string;
  profile_path?: string | null;
  known_for_department?: string;
}

export interface VideoItem {
  id: string;
  key: string;
  name: string;
  site: string;
  size: number;
  type: string;
  official: boolean;
  published_at?: string;
}

export interface WatchProvider {
  id: number;
  name: string;
  logo: string;
  color: string;
}

export interface Genre {
  id: number;
  name: string;
}

export interface ContinueWatchingItem {
  tmdbId: number;
  mediaType: 'movie' | 'tv';
  title: string;
  posterPath: string | null;
  backdropPath?: string | null;
  season?: number;
  episode?: number;
  episodeTitle?: string;
  runtimeMinutes?: number;
  progressSeconds?: number;
  durationSeconds?: number;
  timestamp: number; // last watched epoch ms
  updatedAt: number;
}

export interface CustomListItem {
  id: number;
  mediaType: 'movie' | 'tv';
  title: string;
  posterPath: string | null;
  year?: string;
  rating?: number;
  addedAt: number;
}

export interface UserCustomList {
  id: string;
  name: string;
  description?: string;
  isDefault?: boolean;
  createdAt: number;
  items: CustomListItem[];
}

export interface CommentItem {
  id: string;
  tmdbId: number;
  author: string;
  content: string;
  createdAt: number;
  upvotes: number;
  isUserCreated?: boolean;
  userAvatar?: string;
  username?: string;
}

export interface UserReactions {
  [tmdbId: string]: {
    likes: number;
    dislikes: number;
    userReaction?: 'like' | 'dislike' | null;
  };
}
