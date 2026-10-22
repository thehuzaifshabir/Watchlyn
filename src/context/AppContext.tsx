import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  ContinueWatchingItem,
  UserCustomList,
  CustomListItem,
  UserReactions,
  CommentItem,
} from '../types';
import {
  DEFAULT_LISTS,
  STORAGE_KEYS,
  serializeBackup,
  validateAndParseBackup,
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
  saveProgress: (item: Omit<ContinueWatchingItem, 'timestamp' | 'updatedAt'>, immediate?: boolean) => void;
  saveWatchProgress: (item: Omit<ContinueWatchingItem, 'timestamp' | 'updatedAt'>, immediate?: boolean) => void;
  flushWatchProgress: () => void;
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
  const [pathname, search] = fullPath.split('?');
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

  // Throttled Firestore Write References for Video Progress
  const lastFirestoreSyncTimeRef = useRef<number>(0);
  const pendingHistoryRef = useRef<ContinueWatchingItem[] | null>(null);
  const throttleTimeoutRef = useRef<any>(null);
  const isMergingRef = useRef<boolean>(false);

  // Toast Helper
  const showToast = useCallback((message: string, type: 'info' | 'success' | 'error' = 'info') => {
    setToast({ message, type });
  }, []);

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
      if (targetPath === '/lists' || targetPath.startsWith('/lists?')) {
        targetPath = targetPath.replace('/lists', '/account?tab=lists');
      }
      if (options?.replace) {
        window.history.replaceState(null, '', targetPath);
      } else {
        window.history.pushState(null, '', targetPath);
      }
      setRoute(parsePath(targetPath));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  // 1. Initial Local Load & Firestore Snapshot Sync
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Load initial cached snapshot from localStorage for instantaneous zero-latency cold-loads
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
      console.warn('Initial storage load warning:', err);
    }

    if (!userId) return;

    // Smart Guest-to-Cloud Merge on Login
    const performGuestMerge = async () => {
      if (isMergingRef.current) return;
      isMergingRef.current = true;
      try {
        const guestListsRaw = localStorage.getItem(STORAGE_KEYS.CUSTOM_LISTS);
        const guestHistoryRaw = localStorage.getItem(STORAGE_KEYS.CONTINUE_WATCHING);
        const guestReactionsRaw = localStorage.getItem(STORAGE_KEYS.REACTIONS);

        const guestLists: UserCustomList[] = guestListsRaw ? JSON.parse(guestListsRaw) : [];
        const guestHistory: ContinueWatchingItem[] = guestHistoryRaw ? JSON.parse(guestHistoryRaw) : [];
        const guestReactions: UserReactions = guestReactionsRaw ? JSON.parse(guestReactionsRaw) : {};

        const hasGuestData =
          (guestLists.length > 0 && guestLists.some((l) => l.items.length > 0)) ||
          guestHistory.length > 0 ||
          Object.keys(guestReactions).length > 0;

        if (hasGuestData) {
          const userDocRef = doc(db, 'users', userId);
          const snap = await getDoc(userDocRef);
          const cloudData = snap.exists() ? snap.data() : {};

          const cloudLists: UserCustomList[] = Array.isArray(cloudData?.lists) ? cloudData.lists : DEFAULT_LISTS;
          const cloudHistory: ContinueWatchingItem[] = Array.isArray(cloudData?.continueWatching) ? cloudData.continueWatching : [];
          const cloudReactions: UserReactions = cloudData?.likes || {};

          // Merge Continue Watching: Pick newer updatedAt
          const historyMap = new Map<string, ContinueWatchingItem>();
          [...cloudHistory, ...guestHistory].forEach((item) => {
            const key = `${item.mediaType}_${item.tmdbId}`;
            const existing = historyMap.get(key);
            if (!existing || (item.updatedAt || 0) > (existing.updatedAt || 0)) {
              historyMap.set(key, item);
            }
          });
          const mergedHistory = Array.from(historyMap.values()).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

          // Merge Lists: Combine watchlist/favorites items & append any custom lists
          const mergedLists = [...cloudLists];
          guestLists.forEach((gList) => {
            const cloudTarget = mergedLists.find((cl) => cl.id === gList.id);
            if (cloudTarget) {
              const existingKeys = new Set(cloudTarget.items.map((it) => `${it.mediaType}_${it.id}`));
              gList.items.forEach((gItem) => {
                if (!existingKeys.has(`${gItem.mediaType}_${gItem.id}`)) {
                  cloudTarget.items.push(gItem);
                  existingKeys.add(`${gItem.mediaType}_${gItem.id}`);
                }
              });
            } else if (gList.items.length > 0) {
              mergedLists.push(gList);
            }
          });

          // Merge Reactions
          const mergedReactions: UserReactions = { ...cloudReactions, ...guestReactions };

          // Save merged data to Firestore
          await setDoc(
            userDocRef,
            {
              lists: mergedLists,
              continueWatching: mergedHistory,
              likes: mergedReactions,
              updatedAt: Date.now(),
            },
            { merge: true }
          );

          // Clear guest keys to prevent duplicate merging on subsequent logins
          localStorage.removeItem(STORAGE_KEYS.CUSTOM_LISTS);
          localStorage.removeItem(STORAGE_KEYS.CONTINUE_WATCHING);
          localStorage.removeItem(STORAGE_KEYS.REACTIONS);
        }
      } catch (mergeErr) {
        console.warn('Guest merge warning:', mergeErr);
      } finally {
        isMergingRef.current = false;
      }
    };

    performGuestMerge();

    // 2. Real-Time Snapshot Listener for users/{uid}
    const userDocRef = doc(db, 'users', userId);
    const unsubscribeSnapshot = onSnapshot(
      userDocRef,
      (snapshot) => {
        if (!snapshot.exists()) return;
        const data = snapshot.data();

        if (Array.isArray(data.lists)) {
          setLists(data.lists);
          localStorage.setItem(getUserKey(STORAGE_KEYS.CUSTOM_LISTS, userId), JSON.stringify(data.lists));
        }

        if (Array.isArray(data.continueWatching)) {
          setContinueWatching(data.continueWatching);
          localStorage.setItem(getUserKey(STORAGE_KEYS.CONTINUE_WATCHING, userId), JSON.stringify(data.continueWatching));
        }

        if (data.likes && typeof data.likes === 'object') {
          setReactions(data.likes);
          localStorage.setItem(getUserKey(STORAGE_KEYS.REACTIONS, userId), JSON.stringify(data.likes));
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, `users/${userId}`);
      }
    );

    return () => {
      unsubscribeSnapshot();
    };
  }, [userId]);

  // Flush pending throttled video progress immediately to Firestore
  const flushWatchProgress = useCallback(() => {
    if (!userId || !pendingHistoryRef.current) return;
    if (throttleTimeoutRef.current) {
      clearTimeout(throttleTimeoutRef.current);
      throttleTimeoutRef.current = null;
    }
    const itemsToFlush = pendingHistoryRef.current;
    pendingHistoryRef.current = null;
    lastFirestoreSyncTimeRef.current = Date.now();

    setDoc(
      doc(db, 'users', userId),
      {
        continueWatching: itemsToFlush,
        updatedAt: Date.now(),
      },
      { merge: true }
    ).catch((err) => handleFirestoreError(err, OperationType.WRITE, `users/${userId}`));
  }, [userId]);

  // Continue Watching Save with Smart 15-Second Throttling & Immediate Triggers
  const saveWatchProgress = useCallback(
    (item: Omit<ContinueWatchingItem, 'timestamp' | 'updatedAt'>, immediate?: boolean) => {
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
        ].slice(0, 30); // Keep top 30 items

        // 1. Save to localStorage every second for instant local persistence
        const storageKey = getUserKey(STORAGE_KEYS.CONTINUE_WATCHING, userId);
        localStorage.setItem(storageKey, JSON.stringify(updated));

        // 2. Cloud Firestore Throttled / Immediate sync
        if (userId) {
          pendingHistoryRef.current = updated;

          if (immediate) {
            // Immediate write on pause, ended, episode switch, navigation
            if (throttleTimeoutRef.current) {
              clearTimeout(throttleTimeoutRef.current);
              throttleTimeoutRef.current = null;
            }
            lastFirestoreSyncTimeRef.current = now;
            setDoc(
              doc(db, 'users', userId),
              {
                continueWatching: updated,
                updatedAt: now,
              },
              { merge: true }
            ).catch((err) => handleFirestoreError(err, OperationType.WRITE, `users/${userId}`));
          } else {
            // Throttled: Write once every 15s during active playback
            const timeSinceLastSync = now - lastFirestoreSyncTimeRef.current;
            if (timeSinceLastSync >= 15000) {
              if (throttleTimeoutRef.current) {
                clearTimeout(throttleTimeoutRef.current);
                throttleTimeoutRef.current = null;
              }
              lastFirestoreSyncTimeRef.current = now;
              setDoc(
                doc(db, 'users', userId),
                {
                  continueWatching: updated,
                  updatedAt: now,
                },
                { merge: true }
              ).catch((err) => handleFirestoreError(err, OperationType.WRITE, `users/${userId}`));
            } else if (!throttleTimeoutRef.current) {
              const remainingWait = Math.max(1000, 15000 - timeSinceLastSync);
              throttleTimeoutRef.current = setTimeout(() => {
                if (pendingHistoryRef.current && userId) {
                  setDoc(
                    doc(db, 'users', userId),
                    {
                      continueWatching: pendingHistoryRef.current,
                      updatedAt: Date.now(),
                    },
                    { merge: true }
                  ).catch((err) => handleFirestoreError(err, OperationType.WRITE, `users/${userId}`));
                  lastFirestoreSyncTimeRef.current = Date.now();
                  pendingHistoryRef.current = null;
                }
                throttleTimeoutRef.current = null;
              }, remainingWait);
            }
          }
        }

        return updated;
      });
    },
    [userId]
  );

  const saveProgress = saveWatchProgress;

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

  const removeProgress = useCallback(
    (tmdbId: number, mediaType: 'movie' | 'tv') => {
      setContinueWatching((prev) => {
        const updated = prev.filter((p) => !(p.tmdbId === tmdbId && p.mediaType === mediaType));
        const storageKey = getUserKey(STORAGE_KEYS.CONTINUE_WATCHING, userId);
        localStorage.setItem(storageKey, JSON.stringify(updated));

        if (userId) {
          setDoc(
            doc(db, 'users', userId),
            {
              continueWatching: updated,
              updatedAt: Date.now(),
            },
            { merge: true }
          ).catch((err) => handleFirestoreError(err, OperationType.WRITE, `users/${userId}`));
        }

        return updated;
      });
      showToast('Removed from Continue Watching', 'info');
    },
    [userId, showToast]
  );

  const clearAllHistory = useCallback(() => {
    setContinueWatching([]);
    const storageKey = getUserKey(STORAGE_KEYS.CONTINUE_WATCHING, userId);
    localStorage.removeItem(storageKey);

    if (userId) {
      setDoc(
        doc(db, 'users', userId),
        {
          continueWatching: [],
          updatedAt: Date.now(),
        },
        { merge: true }
      ).catch((err) => handleFirestoreError(err, OperationType.WRITE, `users/${userId}`));
    }

    showToast('Watch history cleared', 'info');
  }, [userId, showToast]);

  // Custom List Operations with Cloud Sync
  const syncListsToCloud = useCallback(
    (newLists: UserCustomList[]) => {
      const storageKey = getUserKey(STORAGE_KEYS.CUSTOM_LISTS, userId);
      localStorage.setItem(storageKey, JSON.stringify(newLists));

      if (userId) {
        setDoc(
          doc(db, 'users', userId),
          {
            lists: newLists,
            updatedAt: Date.now(),
          },
          { merge: true }
        ).catch((err) => handleFirestoreError(err, OperationType.WRITE, `users/${userId}`));
      }
    },
    [userId]
  );

  const createList = useCallback(
    (name: string, description?: string) => {
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
        syncListsToCloud(updated);
        return updated;
      });
      showToast(`Created list "${newList.name}"`, 'success');
      return id;
    },
    [syncListsToCloud, showToast]
  );

  const deleteList = useCallback(
    (id: string) => {
      setLists((prev) => {
        const target = prev.find((l) => l.id === id);
        if (target?.isDefault) {
          showToast('Default lists cannot be deleted', 'error');
          return prev;
        }
        const updated = prev.filter((l) => l.id !== id);
        syncListsToCloud(updated);
        showToast(`Deleted list "${target?.name || ''}"`, 'info');
        return updated;
      });
    },
    [syncListsToCloud, showToast]
  );

  const renameList = useCallback(
    (id: string, name: string) => {
      if (!name.trim()) return;
      setLists((prev) => {
        const updated = prev.map((l) => (l.id === id ? { ...l, name: name.trim() } : l));
        syncListsToCloud(updated);
        return updated;
      });
      showToast('List renamed', 'success');
    },
    [syncListsToCloud, showToast]
  );

  const addItemToList = useCallback(
    (listId: string, item: CustomListItem) => {
      setLists((prev) => {
        const list = prev.find((l) => l.id === listId);
        if (!list) return prev;
        if (list.items.some((i) => i.id === item.id && i.mediaType === item.mediaType)) {
          showToast(`Already in "${list.name}"`, 'info');
          return prev;
        }
        const updatedList = {
          ...list,
          items: [item, ...list.items],
        };
        const updated = prev.map((l) => (l.id === listId ? updatedList : l));
        syncListsToCloud(updated);
        showToast(`Saved to "${list.name}"`, 'success');
        return updated;
      });
    },
    [syncListsToCloud, showToast]
  );

  const removeItemFromList = useCallback(
    (listId: string, itemId: number) => {
      setLists((prev) => {
        const list = prev.find((l) => l.id === listId);
        if (!list) return prev;
        const updatedList = {
          ...list,
          items: list.items.filter((i) => i.id !== itemId),
        };
        const updated = prev.map((l) => (l.id === listId ? updatedList : l));
        syncListsToCloud(updated);
        showToast(`Removed from "${list.name}"`, 'info');
        return updated;
      });
    },
    [syncListsToCloud, showToast]
  );

  const isItemInList = useCallback(
    (listId: string, itemId: number): boolean => {
      const list = lists.find((l) => l.id === listId);
      return !!list && list.items.some((i) => i.id === itemId);
    },
    [lists]
  );

  const isItemInWatchlist = useCallback(
    (itemId: number): boolean => {
      const watchlist = lists.find((l) => l.id === 'watchlist');
      return !!watchlist && watchlist.items.some((i) => i.id === itemId);
    },
    [lists]
  );

  const toggleWatchlist = useCallback(
    (item: {
      id: number;
      mediaType: 'movie' | 'tv';
      title: string;
      posterPath: string | null;
      year?: string;
      rating?: number;
    }): boolean => {
      const watchlist = lists.find((l) => l.id === 'watchlist');
      if (!watchlist) return false;

      const exists = watchlist.items.some((i) => i.id === item.id && i.mediaType === item.mediaType);
      if (exists) {
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
    },
    [lists, removeItemFromList, addItemToList]
  );

  // Reactions & Likes Cloud Sync
  const toggleReaction = useCallback(
    (tmdbId: number, type: 'like' | 'dislike') => {
      setReactions((prev) => {
        const key = tmdbId;
        const current = prev[key] || {
          likes: 12 + (tmdbId % 40),
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

        const updated: UserReactions = {
          ...prev,
          [key]: {
            likes: newLikes,
            dislikes: newDislikes,
            userReaction: newReaction,
          },
        };

        const storageKey = getUserKey(STORAGE_KEYS.REACTIONS, userId);
        localStorage.setItem(storageKey, JSON.stringify(updated));

        if (userId) {
          setDoc(
            doc(db, 'users', userId),
            {
              likes: updated,
              updatedAt: Date.now(),
            },
            { merge: true }
          ).catch((err) => handleFirestoreError(err, OperationType.WRITE, `users/${userId}`));
        }

        return updated;
      });
    },
    [userId]
  );

  const getReactionData = useCallback(
    (tmdbId: number) => {
      const data = reactions[tmdbId];
      if (data) return data;
      return {
        likes: 12 + (tmdbId % 40),
        dislikes: 2 + (tmdbId % 15),
        userReaction: null,
      };
    },
    [reactions]
  );

  // Comments (Local Storage Fallback State)
  const addComment = useCallback(
    (tmdbId: number, author: string, content: string, userAvatar?: string, username?: string) => {
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
        const storageKey = getUserKey(STORAGE_KEYS.COMMENTS, userId);
        localStorage.setItem(storageKey, JSON.stringify(updated));
        return updated;
      });
      showToast('Comment posted', 'success');
    },
    [userId, showToast]
  );

  const deleteComment = useCallback(
    (tmdbId: number, commentId: string) => {
      setComments((prev) => {
        const currentList = prev[tmdbId] || [];
        const updated = {
          ...prev,
          [tmdbId]: currentList.filter((c) => c.id !== commentId),
        };
        const storageKey = getUserKey(STORAGE_KEYS.COMMENTS, userId);
        localStorage.setItem(storageKey, JSON.stringify(updated));
        return updated;
      });
      showToast('Comment deleted', 'info');
    },
    [userId, showToast]
  );

  const upvoteComment = useCallback(
    (tmdbId: number, commentId: string) => {
      setComments((prev) => {
        const currentList = prev[tmdbId] || [];
        const updatedList = currentList.map((c) => (c.id === commentId ? { ...c, upvotes: c.upvotes + 1 } : c));
        const updated = {
          ...prev,
          [tmdbId]: updatedList,
        };
        const storageKey = getUserKey(STORAGE_KEYS.COMMENTS, userId);
        localStorage.setItem(storageKey, JSON.stringify(updated));
        return updated;
      });
    },
    [userId]
  );

  // Backup Import & Export
  const exportBackup = useCallback(() => {
    try {
      const jsonStr = serializeBackup(lists, continueWatching);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `watchlyn-account-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Exported watchlyn-account-backup.json', 'success');
    } catch (err: any) {
      showToast('Export failed: ' + err.message, 'error');
    }
  }, [lists, continueWatching, showToast]);

  const importBackup = useCallback(
    (jsonContent: string) => {
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
          syncListsToCloud(merged);
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
            const storageKey = getUserKey(STORAGE_KEYS.CONTINUE_WATCHING, userId);
            localStorage.setItem(storageKey, JSON.stringify(merged));
            if (userId) {
              setDoc(
                doc(db, 'users', userId),
                {
                  continueWatching: merged,
                  updatedAt: Date.now(),
                },
                { merge: true }
              ).catch((err) => handleFirestoreError(err, OperationType.WRITE, `users/${userId}`));
            }
            return merged;
          });
        }

        showToast(`Imported ${importedLists.length} lists successfully!`, 'success');
        return { success: true, message: `Successfully imported ${importedLists.length} lists.` };
      } catch (err: any) {
        showToast(`Import error: ${err.message}`, 'error');
        return { success: false, message: err.message };
      }
    },
    [userId, syncListsToCloud, showToast]
  );

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
        flushWatchProgress,
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
