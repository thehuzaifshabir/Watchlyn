import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  ContinueWatchingItem,
  UserCustomList,
  CustomListItem,
  UserReactions,
  CommentItem,
} from '../types';
import {
  loadStoredLists,
  saveStoredLists,
  loadContinueWatching,
  saveContinueWatchingList,
  loadReactions,
  saveReactions,
  loadComments,
  saveComments,
  serializeBackup,
  validateAndParseBackup,
  DEFAULT_LISTS,
  STORAGE_KEYS,
} from '../utils/storage';
import { useAuth } from './AuthContext';
import { AUTH_STORAGE_KEYS } from '../utils/auth';

export interface RouteState {
  pathname: string;
  search: string;
  params: Record<string, string>;
}

interface AppContextType {
  route: RouteState;
  navigate: (path: string, options?: { replace?: boolean }) => void;
  // Continue Watching
  continueWatching: ContinueWatchingItem[];
  saveProgress: (item: Omit<ContinueWatchingItem, 'timestamp' | 'updatedAt'>) => void;
  saveWatchProgress: (item: Omit<ContinueWatchingItem, 'timestamp' | 'updatedAt'>) => void;
  getSavedProgress: (tmdbId: number, mediaType: 'movie' | 'tv', season?: number, episode?: number) => ContinueWatchingItem | undefined;
  removeProgress: (tmdbId: number, mediaType: 'movie' | 'tv') => void;
  clearAllHistory: () => void;
  // Lists
  lists: UserCustomList[];
  totalSaved: number;
  createList: (name: string, description?: string) => string;
  deleteList: (id: string) => void;
  renameList: (id: string, name: string) => void;
  addItemToList: (listId: string, item: CustomListItem) => void;
  removeItemFromList: (listId: string, itemId: number) => void;
  isItemInList: (listId: string, itemId: number) => boolean;
  isItemInWatchlist: (itemId: number) => boolean;
  toggleWatchlist: (item: {
    id: number;
    mediaType: 'movie' | 'tv';
    title: string;
    posterPath: string | null;
    year?: string;
    rating?: number;
  }) => boolean;
  // Reactions
  reactions: UserReactions;
  toggleReaction: (tmdbId: number, type: 'like' | 'dislike') => void;
  getReactionData: (tmdbId: number) => { likes: number; dislikes: number; userReaction?: 'like' | 'dislike' | null };
  // Comments
  comments: Record<number, CommentItem[]>;
  addComment: (tmdbId: number, author: string, content: string, userAvatar?: string, username?: string) => void;
  deleteComment: (tmdbId: number, commentId: string) => void;
  upvoteComment: (tmdbId: number, commentId: string) => void;
  // Backup / Import / Export
  exportBackup: () => void;
  importBackup: (jsonContent: string) => { success: boolean; message: string };
  // Toast
  toast: { message: string; type: 'info' | 'success' | 'error' } | null;
  showToast: (message: string, type?: 'info' | 'success' | 'error') => void;
  // Global Modals
  activePersonId: number | null;
  setActivePersonId: (id: number | null) => void;
  addToListTarget: CustomListItem | null;
  setAddToListTarget: (item: CustomListItem | null) => void;
}

const AppContext = createContext<AppContextType | null>(null);

function parsePath(fullPath: string): RouteState {
  const [pathname = '/', search = ''] = fullPath.split('?');
  const params: Record<string, string> = {};

  const movieMatch = pathname.match(/^\/movie\/(\d+)/);
  if (movieMatch) params.id = movieMatch[1];

  const tvMatch = pathname.match(/^\/tv\/(\d+)/);
  if (tvMatch) params.id = tvMatch[1];

  const providerMatch = pathname.match(/^\/provider\/(\d+)/);
  if (providerMatch) params.id = providerMatch[1];

  const personMatch = pathname.match(/^\/person\/(\d+)/);
  if (personMatch) params.id = personMatch[1];

  return { pathname, search: search ? `?${search}` : '', params };
}

function getUserKey(baseKey: string, userId?: string | null): string {
  return userId ? `${AUTH_STORAGE_KEYS.USER_DATA_PREFIX}${userId}_${baseKey}` : baseKey;
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const userId = user?.id || null;

  const [route, setRoute] = useState<RouteState>(() => {
    if (typeof window === 'undefined') return { pathname: '/', search: '', params: {} };
    let path = window.location.pathname;
    let search = window.location.search;
    // Auto-redirect /lists to /account?tab=lists
    if (path === '/lists') {
      path = '/account';
      search = search ? `${search}&tab=lists` : '?tab=lists';
      window.history.replaceState(null, '', `${path}${search}`);
    }
    return parsePath(path + search);
  });

  // State scoped to active user / guest
  const [continueWatching, setContinueWatching] = useState<ContinueWatchingItem[]>([]);
  const [lists, setLists] = useState<UserCustomList[]>([]);
  const [reactions, setReactions] = useState<UserReactions>({});
  const [comments, setComments] = useState<Record<number, CommentItem[]>>({});

  const [toast, setToast] = useState<{ message: string; type: 'info' | 'success' | 'error' } | null>(null);
  const [activePersonId, setActivePersonId] = useState<number | null>(null);
  const [addToListTarget, setAddToListTarget] = useState<CustomListItem | null>(null);

  // Load user or guest data whenever userId changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const listsKey = getUserKey(STORAGE_KEYS.CUSTOM_LISTS, userId);
      const rawLists = localStorage.getItem(listsKey);
      setLists(rawLists ? JSON.parse(rawLists) : DEFAULT_LISTS);

      const historyKey = getUserKey(STORAGE_KEYS.CONTINUE_WATCHING, userId);
      const rawHistory = localStorage.getItem(historyKey);
      setContinueWatching(rawHistory ? JSON.parse(rawHistory) : []);

      const reactionsKey = getUserKey(STORAGE_KEYS.REACTIONS, userId);
      const rawReactions = localStorage.getItem(reactionsKey);
      setReactions(rawReactions ? JSON.parse(rawReactions) : {});

      const commentsKey = getUserKey(STORAGE_KEYS.COMMENTS, userId);
      const rawComments = localStorage.getItem(commentsKey);
      setComments(rawComments ? JSON.parse(rawComments) : {});
    } catch (err) {
      console.warn('Failed loading user storage:', err);
    }
  }, [userId]);

  // Sync browser back/forward buttons & handle /lists redirect
  useEffect(() => {
    const handlePopState = () => {
      let path = window.location.pathname;
      let search = window.location.search;
      if (path === '/lists') {
        path = '/account';
        search = search ? `${search}&tab=lists` : '?tab=lists';
        window.history.replaceState(null, '', `${path}${search}`);
      }
      setRoute(parsePath(path + search));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = useCallback((path: string, options?: { replace?: boolean }) => {
    if (typeof window !== 'undefined') {
      let targetPath = path;
      // Auto-redirect /lists to /account?tab=lists
      if (targetPath === '/lists' || targetPath.startsWith('/lists?')) {
        targetPath = targetPath.replace('/lists', '/account?tab=lists');
      }

      if (options?.replace) {
        window.history.replaceState(null, '', targetPath);
      } else {
        window.history.pushState(null, '', targetPath);
      }
      setRoute(parsePath(targetPath));
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, []);

  const showToast = useCallback((message: string, type: 'info' | 'success' | 'error' = 'info') => {
    setToast({ message, type });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 3200);
    return () => clearTimeout(timer);
  }, [toast]);

  // Persist helpers using active user namespace
  const persistLists = useCallback((updatedLists: UserCustomList[]) => {
    if (typeof window === 'undefined') return;
    const key = getUserKey(STORAGE_KEYS.CUSTOM_LISTS, userId);
    localStorage.setItem(key, JSON.stringify(updatedLists));
  }, [userId]);

  const persistHistory = useCallback((updatedHistory: ContinueWatchingItem[]) => {
    if (typeof window === 'undefined') return;
    const key = getUserKey(STORAGE_KEYS.CONTINUE_WATCHING, userId);
    localStorage.setItem(key, JSON.stringify(updatedHistory.slice(0, 50)));
  }, [userId]);

  const persistReactions = useCallback((updatedReactions: UserReactions) => {
    if (typeof window === 'undefined') return;
    const key = getUserKey(STORAGE_KEYS.REACTIONS, userId);
    localStorage.setItem(key, JSON.stringify(updatedReactions));
  }, [userId]);

  const persistComments = useCallback((updatedComments: Record<number, CommentItem[]>) => {
    if (typeof window === 'undefined') return;
    const key = getUserKey(STORAGE_KEYS.COMMENTS, userId);
    localStorage.setItem(key, JSON.stringify(updatedComments));
  }, [userId]);

  // Continue Watching Actions
  const saveProgress = useCallback((item: Omit<ContinueWatchingItem, 'timestamp' | 'updatedAt'>) => {
    const now = Date.now();
    setContinueWatching((prev) => {
      const existing = prev.find((p) => p.tmdbId === item.tmdbId && p.mediaType === item.mediaType);
      const filtered = prev.filter((p) => !(p.tmdbId === item.tmdbId && p.mediaType === item.mediaType));
      const updated: ContinueWatchingItem[] = [
        {
          ...item,
          progressSeconds: item.progressSeconds ?? existing?.progressSeconds,
          durationSeconds: item.durationSeconds ?? existing?.durationSeconds,
          timestamp: existing?.timestamp || now,
          updatedAt: now,
        },
        ...filtered,
      ];
      persistHistory(updated);
      return updated;
    });
  }, [persistHistory]);

  const saveWatchProgress = useCallback((item: Omit<ContinueWatchingItem, 'timestamp' | 'updatedAt'>) => {
    const now = Date.now();
    setContinueWatching((prev) => {
      const existing = prev.find((p) => p.tmdbId === item.tmdbId && p.mediaType === item.mediaType);
      const filtered = prev.filter((p) => !(p.tmdbId === item.tmdbId && p.mediaType === item.mediaType));
      const updated: ContinueWatchingItem[] = [
        {
          ...existing,
          ...item,
          timestamp: existing?.timestamp || now,
          updatedAt: now,
        },
        ...filtered,
      ];
      persistHistory(updated);
      return updated;
    });
  }, [persistHistory]);

  const getSavedProgress = useCallback(
    (tmdbId: number, mediaType: 'movie' | 'tv', season?: number, episode?: number) => {
      return continueWatching.find((item) => {
        if (item.tmdbId !== tmdbId || item.mediaType !== mediaType) return false;
        if (mediaType === 'tv') {
          if (season && item.season !== season) return false;
          if (episode && item.episode !== episode) return false;
        }
        return true;
      });
    },
    [continueWatching]
  );

  const removeProgress = useCallback((tmdbId: number, mediaType: 'movie' | 'tv') => {
    setContinueWatching((prev) => {
      const updated = prev.filter((p) => !(p.tmdbId === tmdbId && p.mediaType === mediaType));
      persistHistory(updated);
      return updated;
    });
    showToast('Removed from Continue Watching', 'info');
  }, [persistHistory, showToast]);

  const clearAllHistory = useCallback(() => {
    setContinueWatching([]);
    persistHistory([]);
    showToast('Watch history cleared', 'info');
  }, [persistHistory, showToast]);

  // Custom List Actions
  const createList = useCallback((name: string, description?: string) => {
    const id = `list-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newList: UserCustomList = {
      id,
      name: name.trim() || 'New List',
      description: description?.trim() || '',
      createdAt: Date.now(),
      items: [],
    };
    setLists((prev) => {
      const updated = [...prev, newList];
      persistLists(updated);
      return updated;
    });
    showToast(`Created list "${newList.name}"`, 'success');
    return id;
  }, [persistLists, showToast]);

  const deleteList = useCallback((id: string) => {
    setLists((prev) => {
      const target = prev.find((l) => l.id === id);
      if (target?.isDefault) {
        showToast('Default lists cannot be deleted', 'error');
        return prev;
      }
      const updated = prev.filter((l) => l.id !== id);
      persistLists(updated);
      showToast(`Deleted list "${target?.name || ''}"`, 'info');
      return updated;
    });
  }, [persistLists, showToast]);

  const renameList = useCallback((id: string, name: string) => {
    if (!name.trim()) return;
    setLists((prev) => {
      const updated = prev.map((l) => (l.id === id ? { ...l, name: name.trim() } : l));
      persistLists(updated);
      return updated;
    });
    showToast('List renamed', 'success');
  }, [persistLists, showToast]);

  const addItemToList = useCallback((listId: string, item: CustomListItem) => {
    setLists((prev) => {
      const list = prev.find((l) => l.id === listId);
      if (!list) return prev;
      if (list.items.some((i) => i.id === item.id && i.mediaType === item.mediaType)) {
        showToast(`Already in "${list.name}"`, 'info');
        return prev;
      }
      const updatedList = {
        ...list,
        items: [{ ...item, addedAt: Date.now() }, ...list.items],
      };
      const updated = prev.map((l) => (l.id === listId ? updatedList : l));
      persistLists(updated);
      showToast(`Added to "${list.name}"`, 'success');
      return updated;
    });
  }, [persistLists, showToast]);

  const removeItemFromList = useCallback((listId: string, itemId: number) => {
    setLists((prev) => {
      const list = prev.find((l) => l.id === listId);
      if (!list) return prev;
      const updatedList = {
        ...list,
        items: list.items.filter((i) => i.id !== itemId),
      };
      const updated = prev.map((l) => (l.id === listId ? updatedList : l));
      persistLists(updated);
      showToast(`Removed from "${list.name}"`, 'info');
      return updated;
    });
  }, [persistLists, showToast]);

  const isItemInList = useCallback((listId: string, itemId: number): boolean => {
    const list = lists.find((l) => l.id === listId);
    return list ? list.items.some((i) => i.id === itemId) : false;
  }, [lists]);

  const isItemInWatchlist = useCallback((itemId: number): boolean => {
    return isItemInList('watchlist', itemId);
  }, [isItemInList]);

  const toggleWatchlist = useCallback((item: {
    id: number;
    mediaType: 'movie' | 'tv';
    title: string;
    posterPath: string | null;
    year?: string;
    rating?: number;
  }): boolean => {
    const inList = isItemInWatchlist(item.id);
    if (inList) {
      removeItemFromList('watchlist', item.id);
      return false;
    } else {
      addItemToList('watchlist', {
        id: item.id,
        mediaType: item.mediaType,
        title: item.title,
        posterPath: item.posterPath,
        year: item.year,
        rating: item.rating,
        addedAt: Date.now(),
      });
      return true;
    }
  }, [isItemInWatchlist, removeItemFromList, addItemToList]);

  // Reactions
  const getReactionData = useCallback((tmdbId: number) => {
    const key = String(tmdbId);
    const existing = reactions[key];
    if (existing) return existing;
    const baseLikes = 40 + (tmdbId % 300);
    const baseDislikes = 2 + (tmdbId % 15);
    return {
      likes: baseLikes,
      dislikes: baseDislikes,
      userReaction: null,
    };
  }, [reactions]);

  const toggleReaction = useCallback((tmdbId: number, type: 'like' | 'dislike') => {
    const key = String(tmdbId);
    setReactions((prev) => {
      const current = prev[key] || {
        likes: 40 + (tmdbId % 300),
        dislikes: 2 + (tmdbId % 15),
        userReaction: null,
      };

      let newLikes = current.likes;
      let newDislikes = current.dislikes;
      let newReaction: 'like' | 'dislike' | null = null;

      if (current.userReaction === type) {
        if (type === 'like') newLikes = Math.max(0, newLikes - 1);
        if (type === 'dislike') newDislikes = Math.max(0, newDislikes - 1);
        newReaction = null;
      } else {
        if (current.userReaction === 'like') newLikes = Math.max(0, newLikes - 1);
        if (current.userReaction === 'dislike') newDislikes = Math.max(0, newDislikes - 1);

        if (type === 'like') newLikes += 1;
        if (type === 'dislike') newDislikes += 1;
        newReaction = type;
      }

      const updated = {
        ...prev,
        [key]: {
          likes: newLikes,
          dislikes: newDislikes,
          userReaction: newReaction,
        },
      };
      persistReactions(updated);
      return updated;
    });
  }, [persistReactions]);

  // Comments
  const addComment = useCallback((tmdbId: number, author: string, content: string, userAvatar?: string, username?: string) => {
    if (!content.trim()) return;
    const cleanAuthor = author.trim() || 'Anonymous';
    const newComment: CommentItem = {
      id: `c-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      tmdbId,
      author: cleanAuthor,
      content: content.trim(),
      createdAt: Date.now(),
      upvotes: 0,
      isUserCreated: true,
      ...(userAvatar ? { userAvatar } : {}),
      ...(username ? { username } : {}),
    } as any;

    setComments((prev) => {
      const currentList = prev[tmdbId] || [];
      const updated = {
        ...prev,
        [tmdbId]: [newComment, ...currentList],
      };
      persistComments(updated);
      return updated;
    });
    showToast('Comment posted', 'success');
  }, [persistComments, showToast]);

  const deleteComment = useCallback((tmdbId: number, commentId: string) => {
    setComments((prev) => {
      const currentList = prev[tmdbId] || [];
      const updated = {
        ...prev,
        [tmdbId]: currentList.filter((c) => c.id !== commentId),
      };
      persistComments(updated);
      return updated;
    });
    showToast('Comment deleted', 'info');
  }, [persistComments, showToast]);

  const upvoteComment = useCallback((tmdbId: number, commentId: string) => {
    setComments((prev) => {
      const currentList = prev[tmdbId] || [];
      const updatedList = currentList.map((c) => (c.id === commentId ? { ...c, upvotes: c.upvotes + 1 } : c));
      const updated = {
        ...prev,
        [tmdbId]: updatedList,
      };
      persistComments(updated);
      return updated;
    });
  }, [persistComments]);

  // Export / Import
  const exportBackup = useCallback(() => {
    try {
      const jsonStr = serializeBackup(lists, continueWatching);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cinejoy-account-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Exported cinejoy-account-backup.json', 'success');
    } catch (err: any) {
      showToast('Export failed: ' + err.message, 'error');
    }
  }, [lists, continueWatching, showToast]);

  const importBackup = useCallback((jsonContent: string) => {
    try {
      const { lists: importedLists, history: importedHistory } = validateAndParseBackup(jsonContent);

      setLists((prev) => {
        const existingIds = new Set(prev.map((l) => l.id));
        const merged = [...prev];
        for (const imp of importedLists) {
          if (!existingIds.has(imp.id)) {
            merged.push(imp);
            existingIds.add(imp.id);
          } else {
            const target = merged.find((l) => l.id === imp.id);
            if (target) {
              const existingItemKeys = new Set(target.items.map((it) => `${it.mediaType}-${it.id}`));
              for (const it of imp.items) {
                if (!existingItemKeys.has(`${it.mediaType}-${it.id}`)) {
                  target.items.push(it);
                  existingItemKeys.add(`${it.mediaType}-${it.id}`);
                }
              }
            }
          }
        }
        persistLists(merged);
        return merged;
      });

      if (importedHistory.length > 0) {
        setContinueWatching((prev) => {
          const map = new Map<string, ContinueWatchingItem>();
          [...importedHistory, ...prev].forEach((item) => {
            const key = `${item.mediaType}-${item.tmdbId}`;
            if (!map.has(key) || item.updatedAt > (map.get(key)?.updatedAt || 0)) {
              map.set(key, item);
            }
          });
          const merged = Array.from(map.values()).sort((a, b) => b.updatedAt - a.updatedAt);
          persistHistory(merged);
          return merged;
        });
      }

      showToast(`Imported ${importedLists.length} lists successfully!`, 'success');
      return { success: true, message: `Successfully imported ${importedLists.length} lists.` };
    } catch (err: any) {
      showToast(`Import error: ${err.message}`, 'error');
      return { success: false, message: err.message };
    }
  }, [persistLists, persistHistory, showToast]);

  const totalSaved = useMemo(() => {
    return lists.reduce((acc, curr) => acc + curr.items.length, 0);
  }, [lists]);

  return (
    <AppContext.Provider
      value={{
        route,
        navigate,
        continueWatching,
        saveProgress,
        saveWatchProgress,
        getSavedProgress,
        removeProgress,
        clearAllHistory,
        lists,
        totalSaved,
        createList,
        deleteList,
        renameList,
        addItemToList,
        removeItemFromList,
        isItemInList,
        isItemInWatchlist,
        toggleWatchlist,
        reactions,
        toggleReaction,
        getReactionData,
        comments,
        addComment,
        deleteComment,
        upvoteComment,
        exportBackup,
        importBackup,
        toast,
        showToast,
        activePersonId,
        setActivePersonId,
        addToListTarget,
        setAddToListTarget,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp(): AppContextType {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
