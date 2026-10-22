import React, { useState, useEffect } from 'react';
import { MessageSquare, ThumbsUp, Trash2, Send, User, Cloud } from 'lucide-react';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  increment,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { CommentItem } from '../types';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';

interface CommentsSectionProps {
  tmdbId: number;
  mediaType?: 'movie' | 'tv';
}

export const CommentsSection: React.FC<CommentsSectionProps> = ({ tmdbId, mediaType = 'movie' }) => {
  const { comments, addComment, deleteComment, upvoteComment, showToast } = useApp();
  const { user, isAuthenticated } = useAuth();
  const [author, setAuthor] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [sortBy, setSortBy] = useState<'newest' | 'top'>('newest');
  const [cloudComments, setCloudComments] = useState<CommentItem[] | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const mediaKey = `${mediaType}_${tmdbId}`;

  // Prepopulate author name from current user
  useEffect(() => {
    if (isAuthenticated && user) {
      setAuthor(user.name || user.username);
    }
  }, [isAuthenticated, user]);

  // Real-time Firestore Cloud Comments Query
  useEffect(() => {
    let isMounted = true;
    try {
      const q = query(
        collection(db, 'media_comments'),
        where('mediaKey', '==', mediaKey),
        orderBy('createdAt', 'desc')
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (!isMounted) return;
          const items: CommentItem[] = snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            const isUserAuthor = Boolean(user?.id && data.uid === user.id);
            return {
              id: docSnap.id,
              tmdbId,
              author: data.displayName || data.username || 'Anonymous Cinephile',
              content: data.text || '',
              createdAt: typeof data.createdAt === 'number' ? data.createdAt : Date.now(),
              upvotes: Number(data.likesCount) || 0,
              isUserCreated: isUserAuthor,
              userAvatar: data.photoURL || undefined,
              username: data.username || undefined,
            } as CommentItem;
          });
          setCloudComments(items);
        },
        (error) => {
          handleFirestoreError(error, OperationType.LIST, 'media_comments');
          if (isMounted) {
            setCloudComments(null); // Fallback to localStorage comments
          }
        }
      );

      return () => {
        isMounted = false;
        unsubscribe();
      };
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'media_comments');
      setCloudComments(null);
    }
  }, [mediaKey, tmdbId, user?.id]);

  // Combined list of comments (Cloud prioritized, localStorage fallback)
  const activeComments = cloudComments !== null ? cloudComments : comments[tmdbId] || [];

  const sortedComments = [...activeComments].sort((a, b) => {
    if (sortBy === 'top') {
      return b.upvotes - a.upvotes || b.createdAt - a.createdAt;
    }
    return b.createdAt - a.createdAt;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const authorName = author.trim() || (user ? user.name : 'Anonymous Cinephile');
    const commentText = content.trim();

    try {
      if (cloudComments !== null) {
        // Post directly to Cloud Firestore
        await addDoc(collection(db, 'media_comments'), {
          mediaKey,
          uid: user?.id || `anon_${Date.now()}`,
          displayName: authorName,
          username: user?.username || 'cinephile',
          photoURL: user?.avatar || '',
          text: commentText,
          createdAt: Date.now(),
          likesCount: 0,
        });
        showToast('Comment posted to cloud', 'success');
      } else {
        // Fallback to local storage
        addComment(tmdbId, authorName, commentText, user?.avatar, user?.username);
      }
      setContent('');
    } catch (err) {
      console.warn('Posting comment to cloud had error, saving locally:', err);
      addComment(tmdbId, authorName, commentText, user?.avatar, user?.username);
      setContent('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpvote = async (commentId: string) => {
    // If in cloud, update doc
    if (cloudComments !== null) {
      try {
        await updateDoc(doc(db, 'media_comments', commentId), {
          likesCount: increment(1),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `media_comments/${commentId}`);
        upvoteComment(tmdbId, commentId);
      }
    } else {
      upvoteComment(tmdbId, commentId);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (cloudComments !== null) {
      try {
        await deleteDoc(doc(db, 'media_comments', commentId));
        showToast('Comment deleted', 'info');
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `media_comments/${commentId}`);
        deleteComment(tmdbId, commentId);
      }
    } else {
      deleteComment(tmdbId, commentId);
    }
  };

  const formatCommentDate = (epochMs: number) => {
    const diffSecs = Math.floor((Date.now() - epochMs) / 1000);
    if (diffSecs < 60) return 'Just now';
    if (diffSecs < 3600) return `${Math.floor(diffSecs / 60)}m ago`;
    if (diffSecs < 86400) return `${Math.floor(diffSecs / 3600)}h ago`;
    return `${Math.floor(diffSecs / 86400)}d ago`;
  };

  return (
    <section className="mt-10 rounded-2xl bg-[#121216] border border-[#1f1f26] p-4 sm:p-6 shadow-xl">
      {/* Header with Sort Toggle & Cloud Indicator */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#1f1f26]">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-[#e50914]" />
          <h2 className="text-base sm:text-lg font-bold text-white">
            Comments ({activeComments.length})
          </h2>
          {cloudComments !== null && (
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
              <Cloud className="h-3 w-3" />
              Live Sync
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 rounded-lg bg-zinc-900 p-1 border border-zinc-800">
          <button
            type="button"
            onClick={() => setSortBy('newest')}
            className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors cursor-pointer ${
              sortBy === 'newest' ? 'bg-[#e50914] text-white shadow' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Newest
          </button>
          <button
            type="button"
            onClick={() => setSortBy('top')}
            className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors cursor-pointer ${
              sortBy === 'top' ? 'bg-[#e50914] text-white shadow' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Top
          </button>
        </div>
      </div>

      {/* Comment Form */}
      <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Your name or nickname (optional)"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            className="sm:w-64 rounded-xl bg-zinc-900 border border-zinc-700/80 px-3.5 py-2 text-xs sm:text-sm text-white placeholder-zinc-500 focus:border-[#e50914] focus:outline-none"
          />
        </div>
        <div className="relative">
          <textarea
            rows={3}
            placeholder="Share your thoughts on this title..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full rounded-xl bg-zinc-900 border border-zinc-700/80 p-3 text-xs sm:text-sm text-white placeholder-zinc-500 focus:border-[#e50914] focus:outline-none resize-none"
          />
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!content.trim() || isSubmitting}
            className="flex items-center gap-2 rounded-xl bg-[#e50914] px-5 py-2 text-xs sm:text-sm font-bold text-white transition-all hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer min-h-[40px]"
          >
            <Send className="h-4 w-4" />
            <span>{isSubmitting ? 'Posting...' : 'Post Comment'}</span>
          </button>
        </div>
      </form>

      {/* Comments List / Empty State */}
      <div className="mt-6 flex flex-col gap-3">
        {sortedComments.length === 0 ? (
          <div className="py-10 text-center text-zinc-500 text-sm">
            <p className="italic">Be the first to say something about this title.</p>
          </div>
        ) : (
          sortedComments.map((comment) => (
            <div
              key={comment.id}
              className="flex flex-col gap-1.5 rounded-xl bg-zinc-900/60 p-3.5 border border-zinc-800/80"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {comment.userAvatar ? (
                    <img
                      src={comment.userAvatar}
                      alt={comment.author}
                      className="h-7 w-7 rounded-full object-cover border border-zinc-700"
                    />
                  ) : (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-800 text-zinc-300">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                  <span className="text-xs sm:text-sm font-semibold text-white">
                    {comment.author}
                  </span>
                  <span className="text-[10px] text-zinc-500">
                    • {formatCommentDate(comment.createdAt)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleUpvote(comment.id)}
                    aria-label="Upvote comment"
                    className="flex items-center gap-1 text-xs text-zinc-400 hover:text-amber-400 transition-colors cursor-pointer"
                  >
                    <ThumbsUp className="h-3.5 w-3.5" />
                    <span>{comment.upvotes}</span>
                  </button>

                  {comment.isUserCreated && (
                    <button
                      type="button"
                      onClick={() => handleDelete(comment.id)}
                      aria-label="Delete comment"
                      className="text-zinc-500 hover:text-red-400 transition-colors p-1 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <p className="text-xs sm:text-sm text-zinc-300 pl-9 whitespace-pre-wrap leading-relaxed">
                {comment.content}
              </p>
            </div>
          ))
        )}
      </div>
    </section>
  );
};
