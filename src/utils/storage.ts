import { ContinueWatchingItem, UserCustomList, CommentItem, UserReactions } from '../types';

export const STORAGE_KEYS = {
  CONTINUE_WATCHING: 'watchlyn_continue_watching',
  CUSTOM_LISTS: 'watchlyn_custom_lists',
  REACTIONS: 'watchlyn_reactions',
  COMMENTS: 'watchlyn_comments',
};

const LEGACY_STORAGE_KEYS = {
  CONTINUE_WATCHING: 'cinejoy_continue_watching',
  CUSTOM_LISTS: 'cinejoy_custom_lists',
  REACTIONS: 'cinejoy_reactions',
  COMMENTS: 'cinejoy_comments',
};

export const DEFAULT_LISTS: UserCustomList[] = [
  {
    id: 'watchlist',
    name: 'My Watchlist',
    description: 'Saved movies and shows to watch next',
    isDefault: true,
    createdAt: Date.now(),
    items: [],
  },
  {
    id: 'favorites',
    name: 'Favorites',
    description: 'All-time favorite movies and series',
    isDefault: true,
    createdAt: Date.now(),
    items: [],
  },
];

export function loadStoredLists(): UserCustomList[] {
  if (typeof window === 'undefined') return DEFAULT_LISTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CUSTOM_LISTS) || localStorage.getItem(LEGACY_STORAGE_KEYS.CUSTOM_LISTS);
    if (!raw) return DEFAULT_LISTS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return DEFAULT_LISTS;
  } catch (err) {
    console.error('Failed to load lists from storage:', err);
    return DEFAULT_LISTS;
  }
}

export function saveStoredLists(lists: UserCustomList[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.CUSTOM_LISTS, JSON.stringify(lists));
  } catch (err) {
    console.error('Failed to save lists:', err);
  }
}

export function loadContinueWatching(): ContinueWatchingItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CONTINUE_WATCHING) || localStorage.getItem(LEGACY_STORAGE_KEYS.CONTINUE_WATCHING);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveContinueWatchingList(items: ContinueWatchingItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    // Keep max 30 items
    const truncated = items.slice(0, 30);
    localStorage.setItem(STORAGE_KEYS.CONTINUE_WATCHING, JSON.stringify(truncated));
  } catch (err) {
    console.error('Failed to save continue watching:', err);
  }
}

export function loadReactions(): UserReactions {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.REACTIONS) || localStorage.getItem(LEGACY_STORAGE_KEYS.REACTIONS);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveReactions(reactions: UserReactions): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.REACTIONS, JSON.stringify(reactions));
  } catch (err) {
    console.error('Failed to save reactions:', err);
  }
}

export function loadComments(): Record<number, CommentItem[]> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.COMMENTS) || localStorage.getItem(LEGACY_STORAGE_KEYS.COMMENTS);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveComments(comments: Record<number, CommentItem[]>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(comments));
  } catch (err) {
    console.error('Failed to save comments:', err);
  }
}

export interface BackupPayload {
  version: number;
  exportedAt: string;
  source: 'watchlyn' | 'cinejoy';
  lists: UserCustomList[];
  history: ContinueWatchingItem[];
}

export function serializeBackup(lists: UserCustomList[], history: ContinueWatchingItem[]): string {
  const payload: BackupPayload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    source: 'watchlyn',
    lists,
    history,
  };
  return JSON.stringify(payload, null, 2);
}

export function validateAndParseBackup(jsonString: string): { lists: UserCustomList[]; history: ContinueWatchingItem[] } {
  const data = JSON.parse(jsonString);
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid backup format: Not a JSON object');
  }

  const rawLists = Array.isArray(data.lists) ? data.lists : [];
  const rawHistory = Array.isArray(data.history) ? data.history : [];

  // Validate lists structure
  const lists: UserCustomList[] = rawLists.map((l: any, idx: number) => ({
    id: typeof l.id === 'string' ? l.id : `list-${Date.now()}-${idx}`,
    name: typeof l.name === 'string' && l.name.trim() ? l.name.trim() : `Imported List ${idx + 1}`,
    description: typeof l.description === 'string' ? l.description : '',
    isDefault: !!l.isDefault,
    createdAt: typeof l.createdAt === 'number' ? l.createdAt : Date.now(),
    items: Array.isArray(l.items)
      ? l.items.filter((it: any) => it && typeof it.id === 'number' && typeof it.title === 'string')
      : [],
  }));

  const history: ContinueWatchingItem[] = rawHistory
    .filter((h: any) => h && typeof h.tmdbId === 'number' && typeof h.title === 'string')
    .map((h: any) => ({
      tmdbId: h.tmdbId,
      mediaType: h.mediaType === 'tv' ? 'tv' : 'movie',
      title: h.title,
      posterPath: h.posterPath || null,
      backdropPath: h.backdropPath || null,
      season: typeof h.season === 'number' ? h.season : undefined,
      episode: typeof h.episode === 'number' ? h.episode : undefined,
      episodeTitle: typeof h.episodeTitle === 'string' ? h.episodeTitle : undefined,
      runtimeMinutes: typeof h.runtimeMinutes === 'number' ? h.runtimeMinutes : undefined,
      progressSeconds: typeof h.progressSeconds === 'number' ? h.progressSeconds : undefined,
      durationSeconds: typeof h.durationSeconds === 'number' ? h.durationSeconds : undefined,
      timestamp: typeof h.timestamp === 'number' ? h.timestamp : Date.now(),
      updatedAt: typeof h.updatedAt === 'number' ? h.updatedAt : Date.now(),
    }));

  return { lists, history };
}
