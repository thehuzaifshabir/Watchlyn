import React, { useState, useRef, useEffect } from 'react';
import {
  User,
  Bookmark,
  Clock,
  Heart,
  Settings,
  LogIn,
  UserPlus,
  LogOut,
  Download,
  Upload,
  Plus,
  Trash2,
  Edit2,
  Check,
  Play,
  Film,
  Tv,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  FolderOpen,
  MessageSquare,
  ThumbsUp,
  Sliders,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { PRESET_AVATARS, sanitizeUsername, validateEmail } from '../utils/auth';
import { formatProgressTime, formatYear, formatRating } from '../utils/formatters';
import { CustomListItem } from '../types';
import { VIDEO_SERVERS } from '../utils/player';

export const AccountView: React.FC = () => {
  const {
    user,
    isAuthenticated,
    isLoading: isAuthLoading,
    signIn,
    signUp,
    signOut,
    updateProfile,
    changePassword,
    deleteAccount,
    clearCache,
  } = useAuth();

  const {
    route,
    navigate,
    lists,
    createList,
    deleteList,
    renameList,
    removeItemFromList,
    exportBackup,
    importBackup,
    continueWatching,
    removeProgress,
    clearAllHistory,
    reactions,
    comments,
    deleteComment,
    showToast,
  } = useApp();

  // Tab State: 'lists' | 'history' | 'activity' | 'settings'
  const searchParams = new URLSearchParams(route.search);
  const initialTab = (searchParams.get('tab') as 'lists' | 'history' | 'activity' | 'settings') || 'lists';
  const [activeTab, setActiveTab] = useState<'lists' | 'history' | 'activity' | 'settings'>(initialTab);

  // Sync tab with URL query changes
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab') as 'lists' | 'history' | 'activity' | 'settings';
    if (tabFromUrl && ['lists', 'history', 'activity', 'settings'].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [route.search]);

  const handleTabChange = (tab: 'lists' | 'history' | 'activity' | 'settings') => {
    setActiveTab(tab);
    window.history.replaceState(null, '', `/account?tab=${tab}`);
  };

  // Auth Form State
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [authLoading, setAuthLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Sign In inputs
  const [loginId, setLoginId] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Sign Up inputs
  const [regName, setRegName] = useState<string>('');
  const [regUsername, setRegUsername] = useState<string>('');
  const [regEmail, setRegEmail] = useState<string>('');
  const [regPassword, setRegPassword] = useState<string>('');
  const [regAvatar, setRegAvatar] = useState<string>(PRESET_AVATARS[0].avatar);

  // Lists Tab State
  const [activeListId, setActiveListId] = useState<string>(lists[0]?.id || 'watchlist');
  const [isCreatingList, setIsCreatingList] = useState<boolean>(false);
  const [newListName, setNewListName] = useState<string>('');
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [editedName, setEditedName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile Edit State
  const [editName, setEditName] = useState<string>('');
  const [editBio, setEditBio] = useState<string>('');
  const [editAvatar, setEditAvatar] = useState<string>('');
  const [isEditingAvatar, setIsEditingAvatar] = useState<boolean>(false);

  // Password Change State
  const [currentPw, setCurrentPw] = useState<string>('');
  const [newPw, setNewPw] = useState<string>('');
  const [confirmPw, setConfirmPw] = useState<string>('');

  // Player Preferences State
  const [prefServer, setPrefServer] = useState<string>(user?.settings?.defaultServer || 'vidy');
  const [prefAutoplay, setPrefAutoplay] = useState<boolean>(user?.settings?.autoplay ?? true);
  const [prefAutoplayNext, setPrefAutoplayNext] = useState<boolean>(user?.settings?.autoplayNextEpisode ?? true);

  // Update profile fields when user loads
  useEffect(() => {
    if (user) {
      setEditName(user.name);
      setEditBio(user.bio || '');
      setEditAvatar(user.avatar);
      setPrefServer(user.settings?.defaultServer || 'vidy');
      setPrefAutoplay(user.settings?.autoplay ?? true);
      setPrefAutoplayNext(user.settings?.autoplayNextEpisode ?? true);
    }
  }, [user]);

  // Keep active list valid if list deleted
  useEffect(() => {
    if (lists.length > 0 && !lists.some((l) => l.id === activeListId)) {
      setActiveListId(lists[0].id);
    }
  }, [lists, activeListId]);

  // Quick Demo Sign In
  const handleQuickDemoLogin = async () => {
    setAuthLoading(true);
    setAuthError(null);
    const res = await signIn({
      loginIdentifier: 'alex_cinema',
      password: 'password123',
    });
    setAuthLoading(false);
    if (!res.success) {
      // If demo user doesn't exist yet in registry, create it!
      const signUpRes = await signUp({
        name: 'Alex Johnson',
        username: 'alex_cinema',
        email: 'alex@watchlyn.com',
        password: 'password123',
        avatar: PRESET_AVATARS[0].avatar,
      });
      if (!signUpRes.success) {
        setAuthError(signUpRes.error || 'Failed to sign in demo user');
      } else {
        showToast('Welcome, Alex! Demo account loaded.', 'success');
      }
    } else {
      showToast('Welcome back, Alex!', 'success');
    }
  };

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!loginId.trim()) {
      setAuthError('Please enter your email or username');
      return;
    }
    if (!loginPassword) {
      setAuthError('Please enter your password');
      return;
    }

    setAuthLoading(true);
    const res = await signIn({
      loginIdentifier: loginId.trim(),
      password: loginPassword,
      rememberMe,
    });
    setAuthLoading(false);

    if (res.success) {
      showToast('Signed in successfully!', 'success');
      setLoginPassword('');
    } else {
      setAuthError(res.error || 'Invalid credentials');
    }
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (!regName.trim()) {
      setAuthError('Please enter your full name');
      return;
    }
    const cleanUsername = sanitizeUsername(regUsername);
    if (cleanUsername.length < 3) {
      setAuthError('Username must be at least 3 alphanumeric characters');
      return;
    }
    if (!validateEmail(regEmail.trim())) {
      setAuthError('Please provide a valid email address');
      return;
    }
    if (regPassword.length < 6) {
      setAuthError('Password must be at least 6 characters long');
      return;
    }

    setAuthLoading(true);
    const res = await signUp({
      name: regName.trim(),
      username: cleanUsername,
      email: regEmail.trim(),
      password: regPassword,
      avatar: regAvatar,
    });
    setAuthLoading(false);

    if (res.success) {
      showToast('Account created! Your watchlists and history have been synced.', 'success');
    } else {
      setAuthError(res.error || 'Failed to create account');
    }
  };

  // Profile Save
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      showToast('Name cannot be blank', 'error');
      return;
    }
    const res = await updateProfile({
      name: editName.trim(),
      bio: editBio.trim(),
      avatar: editAvatar,
    });
    if (res.success) {
      showToast('Profile updated!', 'success');
      setIsEditingAvatar(false);
    } else {
      showToast(res.error || 'Failed to update profile', 'error');
    }
  };

  // Password Change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPw) {
      showToast('Enter your current password', 'error');
      return;
    }
    if (newPw.length < 6) {
      showToast('New password must be at least 6 characters', 'error');
      return;
    }
    if (newPw !== confirmPw) {
      showToast('New passwords do not match', 'error');
      return;
    }

    const res = await changePassword(currentPw, newPw);
    if (res.success) {
      showToast('Password changed successfully!', 'success');
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
    } else {
      showToast(res.error || 'Failed to change password', 'error');
    }
  };

  // Player Prefs Save
  const handleSavePreferences = async () => {
    const res = await updateProfile({
      settings: {
        defaultServer: prefServer,
        autoplay: prefAutoplay,
        autoplayNextEpisode: prefAutoplayNext,
      },
    });
    if (res.success) {
      showToast('Streaming preferences saved!', 'success');
    } else {
      showToast('Failed to save preferences', 'error');
    }
  };

  // Delete Account
  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to delete your account? All saved watchlists, watch progress, and ratings will be permanently removed.')) {
      await deleteAccount();
      showToast('Account deleted', 'info');
    }
  };

  // Lists Actions
  const activeList = lists.find((l) => l.id === activeListId) || lists[0];
  const totalTitlesInLists = lists.reduce((acc, curr) => acc + curr.items.length, 0);

  const handleCreateList = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;
    const newId = createList(newListName.trim());
    setActiveListId(newId);
    setNewListName('');
    setIsCreatingList(false);
    showToast('New list created!', 'success');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        importBackup(content);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Compute Live Stats
  const totalSavedCount = totalTitlesInLists;
  const inProgressCount = continueWatching.length;
  const totalWatchSeconds = continueWatching.reduce((acc, item) => acc + (item.progressSeconds || 0), 0);
  const totalWatchHours = Math.floor(totalWatchSeconds / 3600);
  const totalWatchMins = Math.floor((totalWatchSeconds % 3600) / 60);
  const watchTimeText = totalWatchHours > 0 ? `${totalWatchHours}h ${totalWatchMins}m` : `${totalWatchMins}m`;

  const likedCount = Object.values(reactions).filter((r) => r.userReaction === 'like').length;
  const userCommentsCount = Object.values(comments).reduce((acc, group) => {
    return acc + group.filter((c) => c.isUserCreated).length;
  }, 0);
  const likedAndReviewedCount = likedCount + userCommentsCount;

  // Unauthenticated / Auth Gateway View
  if (!isAuthenticated || !user) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12 min-h-screen">
        {/* Watchlyn Account Branding */}
        <div className="text-center mb-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e50914]/15 border border-[#e50914]/30 shadow-lg mb-3">
            <User className="h-7 w-7 text-[#e50914]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Watchlyn Account
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-md mx-auto">
            Sign in to sync your custom watchlists, resume episodes across devices, and personalize your streaming experience.
          </p>

          {/* Quick Demo Login Banner */}
          <div className="mt-4 inline-flex items-center gap-2 rounded-xl bg-zinc-900 border border-zinc-800 p-2 text-xs text-zinc-300">
            <Sparkles className="h-4 w-4 text-amber-400 shrink-0" />
            <span>Want to test features right away?</span>
            <button
              type="button"
              onClick={handleQuickDemoLogin}
              disabled={authLoading}
              className="rounded-lg bg-[#e50914] px-2.5 py-1 text-xs font-bold text-white hover:bg-red-700 transition-colors cursor-pointer"
            >
              Sign In as Demo User
            </button>
          </div>
        </div>

        {/* Auth Mode Toggle */}
        <div className="flex rounded-xl bg-zinc-900 p-1 border border-zinc-800 mb-6">
          <button
            type="button"
            onClick={() => {
              setAuthMode('signin');
              setAuthError(null);
            }}
            className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              authMode === 'signin'
                ? 'bg-[#e50914] text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <LogIn className="h-4 w-4" />
            <span>Sign In</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode('signup');
              setAuthError(null);
            }}
            className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              authMode === 'signup'
                ? 'bg-[#e50914] text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <UserPlus className="h-4 w-4" />
            <span>Create Account</span>
          </button>
        </div>

        {/* Error Banner */}
        {authError && (
          <div className="mb-5 flex items-center gap-2 rounded-xl bg-red-950/40 border border-red-800/60 p-3 text-xs sm:text-sm text-red-300">
            <AlertTriangle className="h-4 w-4 text-[#e50914] shrink-0" />
            <span>{authError}</span>
          </div>
        )}

        {/* SIGN IN FORM */}
        {authMode === 'signin' && (
          <form
            onSubmit={handleSignInSubmit}
            className="rounded-2xl bg-[#121216] border border-[#1f1f26] p-5 sm:p-7 shadow-xl space-y-4"
          >
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                Email or Username
              </label>
              <input
                type="text"
                autoComplete="username"
                placeholder="e.g. alex@watchlyn.com or alex_cinema"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                className="w-full rounded-xl bg-zinc-900 border border-zinc-700/80 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-[#e50914] focus:outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Password
                </label>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full rounded-xl bg-zinc-900 border border-zinc-700/80 pl-3.5 pr-10 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-[#e50914] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-400">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-zinc-700 text-[#e50914] focus:ring-[#e50914]"
                />
                <span>Remember me on this browser</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#e50914] hover:bg-red-700 py-3 text-sm font-bold text-white shadow-lg shadow-red-950/40 transition-all cursor-pointer disabled:opacity-50 min-h-[44px]"
            >
              {authLoading ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent animate-spin rounded-full" />
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* SIGN UP FORM */}
        {authMode === 'signup' && (
          <form
            onSubmit={handleSignUpSubmit}
            className="rounded-2xl bg-[#121216] border border-[#1f1f26] p-5 sm:p-7 shadow-xl space-y-4"
          >
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                placeholder="e.g., Alex Johnson"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                className="w-full rounded-xl bg-zinc-900 border border-zinc-700/80 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-[#e50914] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                Username
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">@</span>
                <input
                  type="text"
                  placeholder="alex_cinema"
                  value={regUsername}
                  onChange={(e) => setRegUsername(sanitizeUsername(e.target.value))}
                  className="w-full rounded-xl bg-zinc-900 border border-zinc-700/80 pl-8 pr-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-[#e50914] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                placeholder="alex@watchlyn.com"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                className="w-full rounded-xl bg-zinc-900 border border-zinc-700/80 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-[#e50914] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                Password (min 6 characters)
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a strong password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full rounded-xl bg-zinc-900 border border-zinc-700/80 pl-3.5 pr-10 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-[#e50914] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Avatar Picker */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                Choose Profile Avatar
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {PRESET_AVATARS.map((item) => {
                  const isSelected = regAvatar === item.avatar;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setRegAvatar(item.avatar)}
                      className={`flex flex-col items-center gap-1.5 rounded-xl p-2.5 border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#e50914] bg-red-950/30 scale-105 shadow-md shadow-red-900/20'
                          : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'
                      }`}
                    >
                      <img
                        src={item.avatar}
                        alt={item.name}
                        className="h-10 w-10 rounded-full bg-zinc-800 object-cover"
                      />
                      <span className="text-[10px] font-medium text-zinc-300 truncate w-full text-center">
                        {item.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Guest Sync Callout */}
            <div className="flex items-start gap-2.5 rounded-xl bg-emerald-950/20 border border-emerald-800/40 p-3 text-xs text-emerald-300">
              <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                Your guest watchlists ({totalTitlesInLists} titles) and watch history ({continueWatching.length} items) will be preserved and tied directly to your new account!
              </span>
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#e50914] hover:bg-red-700 py-3 text-sm font-bold text-white shadow-lg shadow-red-950/40 transition-all cursor-pointer disabled:opacity-50 min-h-[44px]"
            >
              {authLoading ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent animate-spin rounded-full" />
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  <span>Create Account & Sync Data</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Guest Preview Section */}
        <div className="mt-10 pt-8 border-t border-[#1f1f26]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <Bookmark className="h-5 w-5 text-[#e50914]" />
                <h2 className="text-lg font-bold text-white">Guest Watchlists & Stream History</h2>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Sign in or create an account to lock in your lists, watch history, and profile across all devices.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={exportBackup}
                title="Export guest backup JSON"
                className="flex items-center gap-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:text-white transition-colors cursor-pointer"
              >
                <Download className="h-3.5 w-3.5 text-[#e50914]" />
                <span>Export (.json)</span>
              </button>
            </div>
          </div>

          {/* Guest Lists Preview Cards */}
          {totalTitlesInLists === 0 && continueWatching.length === 0 ? (
            <div className="rounded-2xl bg-[#121216] border border-[#1f1f26] p-8 text-center">
              <Bookmark className="mx-auto h-10 w-10 text-zinc-700 mb-2" />
              <p className="text-xs text-zinc-400">
                You haven't saved any movies or series in guest mode yet. Tap "+ My List" on any title while browsing!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Active List Selector */}
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                {lists.map((list) => (
                  <button
                    key={list.id}
                    type="button"
                    onClick={() => setActiveListId(list.id)}
                    className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold border transition-all cursor-pointer ${
                      activeListId === list.id
                        ? 'bg-zinc-800 text-white border-[#e50914]'
                        : 'bg-zinc-900/80 text-zinc-400 border-zinc-800 hover:text-white'
                    }`}
                  >
                    <span>{list.name}</span>
                    <span className="rounded-full bg-zinc-700 px-1.5 py-0.2 text-[10px] text-zinc-300 font-mono">
                      {list.items.length}
                    </span>
                  </button>
                ))}
              </div>

              {/* Items grid */}
              {activeList && activeList.items.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {activeList.items.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => navigate(`/${item.mediaType}/${item.id}`)}
                      className="group relative flex flex-col rounded-xl overflow-hidden bg-[#121216] border border-[#1f1f26] cursor-pointer hover:border-zinc-700 transition-all"
                    >
                      <div className="relative aspect-[2/3] w-full bg-zinc-900 overflow-hidden">
                        {item.posterPath ? (
                          <img
                            src={`https://image.tmdb.org/t/p/w500${item.posterPath}`}
                            alt={item.title}
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-zinc-600">
                            <Film className="h-8 w-8" />
                          </div>
                        )}
                        {item.rating && (
                          <div className="absolute top-1.5 left-1.5 rounded bg-black/80 px-1.5 py-0.5 text-[9px] font-bold text-amber-400">
                            ★ {formatRating(item.rating)}
                          </div>
                        )}
                      </div>
                      <div className="p-2">
                        <p className="text-xs font-bold text-white truncate">{item.title}</p>
                        <p className="text-[10px] text-zinc-400">{item.year || ''}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // AUTHENTICATED DASHBOARD VIEW
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 md:py-8 min-h-screen">
      {/* Hidden file input for list import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* 1. Profile Header Bar */}
      <div className="rounded-2xl bg-[#121216] border border-[#1f1f26] p-5 sm:p-7 shadow-xl mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <img
                src={user.avatar}
                alt={user.name}
                className="h-16 w-16 sm:h-20 sm:w-20 rounded-full border-2 border-[#e50914] object-cover bg-zinc-900 shadow-lg"
              />
              <button
                type="button"
                onClick={() => {
                  handleTabChange('settings');
                  setIsEditingAvatar(true);
                }}
                title="Change Avatar"
                className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-zinc-900 border border-zinc-700 text-zinc-300 hover:text-white hover:border-[#e50914] transition-colors cursor-pointer"
              >
                <Edit2 className="h-3.5 w-3.5" />
              </button>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white">{user.name}</h1>
                <span className="rounded-md bg-red-950/60 border border-red-800/60 px-2 py-0.5 text-[10px] font-bold text-red-400">
                  Watchlyn VIP
                </span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-400 font-mono mt-0.5">@{user.username}</p>
              {user.bio ? (
                <p className="text-xs text-zinc-300 mt-1 max-w-md line-clamp-2">{user.bio}</p>
              ) : (
                <p className="text-[11px] text-zinc-500 mt-1">
                  Member since {new Date(user.createdAt).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>

          {/* Quick Sign Out */}
          <div className="flex items-center gap-2 self-start sm:self-center">
            <button
              type="button"
              onClick={signOut}
              className="flex items-center gap-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 px-3.5 py-2 text-xs font-semibold text-zinc-300 hover:text-white transition-colors cursor-pointer min-h-[40px]"
            >
              <LogOut className="h-4 w-4 text-zinc-400" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* 2. Live 4-KPI Stats Counter Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6 pt-6 border-t border-[#1f1f26]">
          <button
            type="button"
            onClick={() => handleTabChange('lists')}
            className="flex items-center gap-3 rounded-xl bg-zinc-900/60 p-3 border border-zinc-800 hover:border-zinc-700 transition-colors text-left cursor-pointer"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-950/40 border border-red-800/40 text-[#e50914] shrink-0">
              <Bookmark className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-black text-white leading-none">{totalSavedCount}</p>
              <p className="text-[11px] text-zinc-400 mt-1">Saved in Lists</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('history')}
            className="flex items-center gap-3 rounded-xl bg-zinc-900/60 p-3 border border-zinc-800 hover:border-zinc-700 transition-colors text-left cursor-pointer"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-950/40 border border-amber-800/40 text-amber-400 shrink-0">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-black text-white leading-none">{inProgressCount}</p>
              <p className="text-[11px] text-zinc-400 mt-1">In Progress</p>
            </div>
          </button>

          <div className="flex items-center gap-3 rounded-xl bg-zinc-900/60 p-3 border border-zinc-800 text-left">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-950/40 border border-blue-800/40 text-blue-400 shrink-0">
              <Play className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-black text-white leading-none">{watchTimeText}</p>
              <p className="text-[11px] text-zinc-400 mt-1">Watch Time Tracked</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleTabChange('activity')}
            className="flex items-center gap-3 rounded-xl bg-zinc-900/60 p-3 border border-zinc-800 hover:border-zinc-700 transition-colors text-left cursor-pointer"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-950/40 border border-purple-800/40 text-purple-400 shrink-0">
              <Heart className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-black text-white leading-none">{likedAndReviewedCount}</p>
              <p className="text-[11px] text-zinc-400 mt-1">Liked & Reviewed</p>
            </div>
          </button>
        </div>
      </div>

      {/* 3. 4-Tab Navigation Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar border-b border-[#1f1f26] pb-3 mb-6">
        <button
          type="button"
          onClick={() => handleTabChange('lists')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap min-h-[42px] ${
            activeTab === 'lists'
              ? 'bg-[#e50914] text-white shadow-lg shadow-red-950/40'
              : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800'
          }`}
        >
          <Bookmark className="h-4 w-4" />
          <span>My Lists ({totalSavedCount})</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('history')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap min-h-[42px] ${
            activeTab === 'history'
              ? 'bg-[#e50914] text-white shadow-lg shadow-red-950/40'
              : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800'
          }`}
        >
          <Clock className="h-4 w-4" />
          <span>Continue Watching ({inProgressCount})</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('activity')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap min-h-[42px] ${
            activeTab === 'activity'
              ? 'bg-[#e50914] text-white shadow-lg shadow-red-950/40'
              : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800'
          }`}
        >
          <Heart className="h-4 w-4" />
          <span>Likes & Activity ({likedAndReviewedCount})</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('settings')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap min-h-[42px] ${
            activeTab === 'settings'
              ? 'bg-[#e50914] text-white shadow-lg shadow-red-950/40'
              : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800'
          }`}
        >
          <Settings className="h-4 w-4" />
          <span>Player & Settings</span>
        </button>
      </div>

      {/* TAB 1: MY LISTS */}
      {activeTab === 'lists' && (
        <div>
          {/* Action Header for Lists */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
            <div>
              <h2 className="text-xl font-black text-white">Custom Watchlists</h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Organize your favorite movies and series. Backup or import anytime.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={exportBackup}
                title="Export Watchlists as JSON"
                className="flex items-center gap-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 px-3 py-2 text-xs font-semibold text-zinc-300 hover:text-white transition-colors cursor-pointer min-h-[38px]"
              >
                <Download className="h-3.5 w-3.5 text-[#e50914]" />
                <span>Export (.json)</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Import Watchlists from JSON"
                className="flex items-center gap-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 px-3 py-2 text-xs font-semibold text-zinc-300 hover:text-white transition-colors cursor-pointer min-h-[38px]"
              >
                <Upload className="h-3.5 w-3.5 text-[#e50914]" />
                <span>Import (.json)</span>
              </button>

              <button
                type="button"
                onClick={() => setIsCreatingList(true)}
                className="flex items-center gap-1.5 rounded-xl bg-[#e50914] hover:bg-red-700 px-3.5 py-2 text-xs font-bold text-white shadow-md transition-all cursor-pointer min-h-[38px]"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>New List</span>
              </button>
            </div>
          </div>

          {/* Inline Create List Form */}
          {isCreatingList && (
            <form
              onSubmit={handleCreateList}
              className="my-4 rounded-2xl bg-[#121216] border border-[#1f1f26] p-4 flex flex-col sm:flex-row gap-3 items-center shadow-lg"
            >
              <div className="flex-1 w-full">
                <input
                  type="text"
                  autoFocus
                  placeholder="e.g., Mind-Bending Thrillers, Weekend Binge..."
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  className="w-full rounded-xl bg-zinc-900 border border-zinc-700 px-3.5 py-2 text-sm text-white placeholder-zinc-500 focus:border-[#e50914] focus:outline-none"
                />
              </div>
              <div className="flex gap-2 self-end sm:self-center">
                <button
                  type="submit"
                  disabled={!newListName.trim()}
                  className="rounded-xl bg-[#e50914] px-4 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-40 cursor-pointer min-h-[38px]"
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreatingList(false)}
                  className="rounded-xl bg-zinc-800 px-3.5 py-2 text-xs font-semibold text-zinc-300 hover:text-white cursor-pointer min-h-[38px]"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* List Selector Pills */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2 mb-4">
            {lists.map((list) => {
              const isSelected = list.id === activeListId;
              const isDefault = list.id === 'watchlist' || list.id === 'favorites';
              return (
                <div
                  key={list.id}
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 border transition-all shrink-0 ${
                    isSelected
                      ? 'bg-zinc-800 text-white border-[#e50914]'
                      : 'bg-zinc-900/80 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setActiveListId(list.id)}
                    className="flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                  >
                    <span>{list.name}</span>
                    <span className="rounded-full bg-zinc-700 px-1.5 py-0.2 text-[10px] text-zinc-300 font-mono">
                      {list.items.length}
                    </span>
                  </button>

                  {!isDefault && (
                    <div className="flex items-center gap-1 ml-1 pl-1 border-l border-zinc-700">
                      <button
                        type="button"
                        onClick={() => {
                          const newTitle = prompt('Rename list to:', list.name);
                          if (newTitle && newTitle.trim()) {
                            renameList(list.id, newTitle.trim());
                            showToast('List renamed', 'success');
                          }
                        }}
                        className="text-zinc-500 hover:text-white"
                        title="Rename"
                      >
                        <Edit2 className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Delete list "${list.name}"?`)) {
                            deleteList(list.id);
                            showToast('List deleted', 'info');
                          }
                        }}
                        className="text-zinc-500 hover:text-red-400"
                        title="Delete"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Active List Items Grid */}
          {activeList && (
            <div>
              <div className="flex items-center justify-between pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  {activeList.name} ({activeList.items.length} titles)
                </span>
              </div>

              {activeList.items.length === 0 ? (
                <div className="rounded-2xl bg-[#121216] border border-[#1f1f26] p-12 text-center">
                  <Bookmark className="mx-auto h-12 w-12 text-zinc-700 mb-3" />
                  <h3 className="text-base font-bold text-white">This list is currently empty</h3>
                  <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
                    Browse movies, shows, or anime and tap the "+ My List" button to save titles here.
                  </p>
                  <div className="flex justify-center gap-2 mt-4">
                    <button
                      type="button"
                      onClick={() => navigate('/movies')}
                      className="rounded-xl bg-[#e50914] px-4 py-2 text-xs font-bold text-white hover:bg-red-700 cursor-pointer"
                    >
                      Browse Movies
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate('/anime')}
                      className="rounded-xl bg-zinc-800 px-4 py-2 text-xs font-bold text-white hover:bg-zinc-700 cursor-pointer"
                    >
                      Browse Anime
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                  {activeList.items.map((item) => (
                    <div
                      key={`${item.mediaType}-${item.id}`}
                      className="group relative flex flex-col rounded-xl overflow-hidden bg-[#121216] border border-[#1f1f26] transition-all duration-300 hover:scale-[1.03] hover:border-zinc-700"
                    >
                      {/* Poster Image with direct navigation */}
                      <div
                        onClick={() => navigate(`/${item.mediaType}/${item.id}`)}
                        className="relative aspect-[2/3] w-full bg-zinc-900 cursor-pointer overflow-hidden"
                      >
                        {item.posterPath ? (
                          <img
                            src={`https://image.tmdb.org/t/p/w500${item.posterPath}`}
                            alt={item.title}
                            loading="lazy"
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-zinc-600">
                            <Film className="h-10 w-10" />
                          </div>
                        )}

                        {/* Top Rating Badge */}
                        {item.rating && item.rating > 0 && (
                          <div className="absolute top-2 left-2 rounded-md bg-black/80 px-1.5 py-0.5 text-[10px] font-bold text-amber-400 backdrop-blur-sm">
                            ★ {formatRating(item.rating)}
                          </div>
                        )}

                        {/* Remove item button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeItemFromList(activeList.id, item.id);
                            showToast(`Removed from ${activeList.name}`, 'info');
                          }}
                          title="Remove from list"
                          className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/80 border border-zinc-700 text-zinc-400 hover:text-red-400 hover:border-red-500 transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Card Footer Info */}
                      <div
                        onClick={() => navigate(`/${item.mediaType}/${item.id}`)}
                        className="p-2.5 flex flex-col flex-1 justify-between cursor-pointer"
                      >
                        <h4 className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-[#e50914] transition-colors">
                          {item.title}
                        </h4>
                        <div className="flex items-center justify-between text-[10px] text-zinc-400 mt-1">
                          <span className="uppercase font-semibold text-zinc-500">
                            {item.mediaType === 'movie' ? 'Movie' : 'Series'}
                          </span>
                          <span>{item.year || ''}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CONTINUE WATCHING & HISTORY */}
      {activeTab === 'history' && (
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
            <div>
              <h2 className="text-xl font-black text-white">Watch History & Progress</h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Automatically tracks your Vidy stream timestamp and episode progress.
              </p>
            </div>

            {continueWatching.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Clear all watch history?')) {
                    clearAllHistory();
                    showToast('History cleared', 'info');
                  }
                }}
                className="flex items-center gap-1.5 rounded-xl bg-zinc-900 hover:bg-red-950/40 border border-zinc-800 hover:border-red-800 text-xs font-semibold text-zinc-400 hover:text-red-300 px-3.5 py-2 transition-colors cursor-pointer min-h-[38px] self-start sm:self-center"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Clear All History</span>
              </button>
            )}
          </div>

          {continueWatching.length === 0 ? (
            <div className="rounded-2xl bg-[#121216] border border-[#1f1f26] p-12 text-center">
              <Clock className="mx-auto h-12 w-12 text-zinc-700 mb-3" />
              <h3 className="text-base font-bold text-white">No stream history yet</h3>
              <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
                Play any movie or episode and your playback time will be automatically recorded here.
              </p>
              <button
                type="button"
                onClick={() => navigate('/')}
                className="mt-4 rounded-xl bg-[#e50914] px-5 py-2.5 text-xs font-bold text-white hover:bg-red-700 cursor-pointer"
              >
                Browse Popular Titles
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {continueWatching.map((item) => {
                const targetUrl =
                  item.mediaType === 'movie'
                    ? `/movie/${item.tmdbId}`
                    : `/tv/${item.tmdbId}?season=${item.season || 1}&episode=${item.episode || 1}`;

                // Calculate progress %
                let progressPercent = 0;
                if (item.progressSeconds && item.durationSeconds && item.durationSeconds > 0) {
                  progressPercent = Math.min(100, Math.round((item.progressSeconds / item.durationSeconds) * 100));
                }

                return (
                  <div
                    key={`${item.mediaType}-${item.tmdbId}-${item.season || 0}-${item.episode || 0}`}
                    className="flex flex-col rounded-xl overflow-hidden bg-[#121216] border border-[#1f1f26] group hover:border-zinc-700 transition-all shadow-md"
                  >
                    {/* Backdrop / Poster Container */}
                    <div
                      onClick={() => navigate(targetUrl)}
                      className="relative aspect-video w-full bg-zinc-900 cursor-pointer overflow-hidden"
                    >
                      {item.backdropPath || item.posterPath ? (
                        <img
                          src={`https://image.tmdb.org/t/p/w780${item.backdropPath || item.posterPath}`}
                          alt={item.title}
                          loading="lazy"
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-zinc-600">
                          <Film className="h-10 w-10" />
                        </div>
                      )}

                      {/* Play overlay button */}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/20 transition-colors">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#e50914] text-white shadow-lg group-hover:scale-110 transition-transform">
                          <Play className="h-5 w-5 fill-white ml-0.5" />
                        </div>
                      </div>

                      {/* Top Badges */}
                      <div className="absolute top-2 left-2 flex items-center gap-1.5">
                        <span className="rounded bg-black/80 px-1.5 py-0.5 text-[10px] font-bold text-white uppercase backdrop-blur-sm">
                          {item.mediaType === 'movie' ? 'Movie' : 'TV Series'}
                        </span>
                        {item.mediaType === 'tv' && (
                          <span className="rounded bg-red-950/90 border border-red-800/80 px-1.5 py-0.5 text-[10px] font-bold text-red-300 backdrop-blur-sm">
                            S{item.season || 1} • Ep {item.episode || 1}
                          </span>
                        )}
                      </div>

                      {/* Individual delete */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeProgress(item.tmdbId, item.mediaType);
                          showToast('Removed from history', 'info');
                        }}
                        title="Remove from history"
                        className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/80 border border-zinc-700 text-zinc-400 hover:text-red-400 hover:border-red-500 transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>

                      {/* Progress Bar along bottom */}
                      {progressPercent > 0 && (
                        <div className="absolute bottom-0 inset-x-0 h-1.5 bg-zinc-800">
                          <div
                            className="h-full bg-[#e50914]"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Card Content & Resume Button */}
                    <div className="p-3.5 flex flex-col justify-between flex-1">
                      <div>
                        <h4
                          onClick={() => navigate(targetUrl)}
                          className="text-sm font-bold text-white truncate hover:text-[#e50914] cursor-pointer"
                        >
                          {item.title}
                        </h4>
                        {item.episodeTitle && (
                          <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                            {item.episodeTitle}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-3 mt-2 border-t border-zinc-800/80">
                        <div className="text-[11px] text-zinc-400">
                          {item.progressSeconds && item.progressSeconds > 5 ? (
                            <span className="text-red-400 font-semibold">
                              {formatProgressTime(item.progressSeconds)}
                              {item.durationSeconds ? ` / ${formatProgressTime(item.durationSeconds)}` : ''}
                            </span>
                          ) : (
                            <span>Started</span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => navigate(targetUrl)}
                          className="flex items-center gap-1.5 rounded-lg bg-[#e50914] px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700 transition-colors cursor-pointer"
                        >
                          <Play className="h-3 w-3 fill-white" />
                          <span>Resume</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: LIKES & ACTIVITY */}
      {activeTab === 'activity' && (
        <div className="space-y-8">
          {/* Liked Titles */}
          <div>
            <div className="flex items-center gap-2 pb-3 border-b border-[#1f1f26]">
              <ThumbsUp className="h-5 w-5 text-purple-400" />
              <h2 className="text-lg font-black text-white">Titles You Liked</h2>
            </div>

            {likedCount === 0 ? (
              <div className="rounded-2xl bg-[#121216] border border-[#1f1f26] p-8 text-center text-zinc-500 text-xs mt-4">
                You haven't liked any movies or series yet. Tap the thumbs-up icon on any title!
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 mt-4">
                {Object.entries(reactions)
                  .filter(([_, data]) => data.userReaction === 'like')
                  .map(([tmdbId]) => (
                    <div
                      key={tmdbId}
                      onClick={() => navigate(`/movie/${tmdbId}`)}
                      className="rounded-xl bg-[#121216] border border-[#1f1f26] p-3 text-center hover:border-purple-500/50 transition-colors cursor-pointer group"
                    >
                      <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-purple-950/40 border border-purple-800/40 text-purple-400 mb-2 group-hover:scale-105 transition-transform">
                        <Heart className="h-7 w-7 fill-purple-400" />
                      </div>
                      <p className="text-xs font-bold text-white truncate">Title #{tmdbId}</p>
                      <span className="text-[10px] text-zinc-500">Liked by you</span>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* User Comments */}
          <div>
            <div className="flex items-center gap-2 pb-3 border-b border-[#1f1f26]">
              <MessageSquare className="h-5 w-5 text-[#e50914]" />
              <h2 className="text-lg font-black text-white">Your Posted Reviews & Comments</h2>
            </div>

            {userCommentsCount === 0 ? (
              <div className="rounded-2xl bg-[#121216] border border-[#1f1f26] p-8 text-center text-zinc-500 text-xs mt-4">
                You haven't posted any comments yet. Share your thoughts on any movie or series!
              </div>
            ) : (
              <div className="space-y-3 mt-4">
                {Object.entries(comments).flatMap(([tmdbIdStr, commentList]) =>
                  commentList
                    .filter((c) => c.isUserCreated)
                    .map((c) => (
                      <div
                        key={c.id}
                        className="rounded-xl bg-[#121216] border border-[#1f1f26] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold text-white">On Title #{tmdbIdStr}</span>
                            <span className="text-[10px] text-zinc-500">
                              • {new Date(c.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-300 italic">"{c.content}"</p>
                        </div>

                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => navigate(`/movie/${tmdbIdStr}`)}
                            className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            <span>View</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              deleteComment(parseInt(tmdbIdStr, 10), c.id);
                              showToast('Comment deleted', 'info');
                            }}
                            className="text-zinc-500 hover:text-red-400"
                            title="Delete comment"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: PLAYER & SETTINGS */}
      {activeTab === 'settings' && (
        <div className="space-y-6 max-w-3xl">
          {/* Edit Profile Card */}
          <div className="rounded-2xl bg-[#121216] border border-[#1f1f26] p-5 sm:p-6 shadow-xl">
            <h3 className="text-base font-bold text-white mb-1">Profile Information</h3>
            <p className="text-xs text-zinc-400 mb-4">
              Update your Watchlyn display name, bio, and avatar.
            </p>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Display Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-xl bg-zinc-900 border border-zinc-700 px-3.5 py-2 text-sm text-white focus:border-[#e50914] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Bio / About You
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g., Anime lover and sci-fi movie fanatic"
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  className="w-full rounded-xl bg-zinc-900 border border-zinc-700 px-3.5 py-2 text-sm text-white focus:border-[#e50914] focus:outline-none resize-none"
                />
              </div>

              {/* Avatar Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                  Change Avatar
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {PRESET_AVATARS.map((item) => {
                    const isSelected = editAvatar === item.avatar;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setEditAvatar(item.avatar)}
                        className={`flex flex-col items-center gap-1 rounded-xl p-2 border transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[#e50914] bg-red-950/40 scale-105'
                            : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'
                        }`}
                      >
                        <img
                          src={item.avatar}
                          alt={item.name}
                          className="h-9 w-9 rounded-full bg-zinc-800 object-cover"
                        />
                        <span className="text-[9px] font-semibold text-zinc-300 truncate w-full text-center">
                          {item.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="rounded-xl bg-[#e50914] hover:bg-red-700 px-5 py-2 text-xs font-bold text-white transition-colors cursor-pointer min-h-[38px]"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>

          {/* Streaming & Player Preferences Card */}
          <div className="rounded-2xl bg-[#121216] border border-[#1f1f26] p-5 sm:p-6 shadow-xl">
            <div className="flex items-center gap-2 mb-1">
              <Sliders className="h-5 w-5 text-[#e50914]" />
              <h3 className="text-base font-bold text-white">Player & Streaming Preferences</h3>
            </div>
            <p className="text-xs text-zinc-400 mb-4">
              Configure your default video engine, autoplay behavior, and episode playback.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Default Streaming Server
                </label>
                <select
                  value={prefServer}
                  onChange={(e) => setPrefServer(e.target.value)}
                  className="w-full rounded-xl bg-zinc-900 border border-zinc-700 px-3.5 py-2.5 text-xs sm:text-sm text-white focus:border-[#e50914] focus:outline-none"
                >
                  {VIDEO_SERVERS.map((server) => (
                    <option key={server.id} value={server.id}>
                      {server.name} {server.badge ? `(${server.badge})` : ''}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-zinc-500 mt-1">
                  Server 1 (Vidy) is highly recommended for automatic watch progress sync and resume capabilities.
                </p>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                <div>
                  <p className="text-xs sm:text-sm font-bold text-white">Autoplay Video</p>
                  <p className="text-[11px] text-zinc-400">
                    Immediately start video playback with sound upon entering title page
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={prefAutoplay}
                  onChange={(e) => setPrefAutoplay(e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-700 text-[#e50914] focus:ring-[#e50914]"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                <div>
                  <p className="text-xs sm:text-sm font-bold text-white">Autoplay Next Episode</p>
                  <p className="text-[11px] text-zinc-400">
                    Automatically load next TV episode when the current one finishes
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={prefAutoplayNext}
                  onChange={(e) => setPrefAutoplayNext(e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-700 text-[#e50914] focus:ring-[#e50914]"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleSavePreferences}
                  className="rounded-xl bg-[#e50914] hover:bg-red-700 px-5 py-2 text-xs font-bold text-white transition-colors cursor-pointer min-h-[38px]"
                >
                  Save Player Settings
                </button>
              </div>
            </div>
          </div>

          {/* Change Password Card */}
          <div className="rounded-2xl bg-[#121216] border border-[#1f1f26] p-5 sm:p-6 shadow-xl">
            <h3 className="text-base font-bold text-white mb-1">Change Password</h3>
            <p className="text-xs text-zinc-400 mb-4">
              Update your account password with Web Crypto SHA-256 security.
            </p>

            <form onSubmit={handleChangePassword} className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPw}
                  onChange={(e) => setCurrentPw(e.target.value)}
                  className="w-full rounded-xl bg-zinc-900 border border-zinc-700 px-3.5 py-2 text-sm text-white focus:border-[#e50914] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPw}
                    onChange={(e) => setNewPw(e.target.value)}
                    className="w-full rounded-xl bg-zinc-900 border border-zinc-700 px-3.5 py-2 text-sm text-white focus:border-[#e50914] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPw}
                    onChange={(e) => setConfirmPw(e.target.value)}
                    className="w-full rounded-xl bg-zinc-900 border border-zinc-700 px-3.5 py-2 text-sm text-white focus:border-[#e50914] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="rounded-xl bg-zinc-800 hover:bg-zinc-700 px-5 py-2 text-xs font-bold text-white transition-colors cursor-pointer min-h-[38px]"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>

          {/* Danger Zone: Cache & Delete Account */}
          <div className="rounded-2xl bg-red-950/20 border border-red-900/40 p-5 sm:p-6 shadow-xl">
            <h3 className="text-base font-bold text-red-400 mb-1">Danger Zone</h3>
            <p className="text-xs text-zinc-400 mb-4">
              Clear local cached queries or permanently delete your Watchlyn account.
            </p>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-red-900/30">
              <div>
                <p className="text-xs sm:text-sm font-bold text-white">Reset Local Cache</p>
                <p className="text-[11px] text-zinc-400">Purges temporary API responses and reloads fresh data</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  clearCache();
                  showToast('App cache cleared', 'info');
                }}
                className="rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 px-3.5 py-2 text-xs font-semibold text-zinc-300 hover:text-white cursor-pointer"
              >
                Clear Cache
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 mt-4 border-t border-red-900/30">
              <div>
                <p className="text-xs sm:text-sm font-bold text-red-400">Delete Account Permanently</p>
                <p className="text-[11px] text-zinc-400">Erase user credentials, lists, and watch progress</p>
              </div>
              <button
                type="button"
                onClick={handleDeleteAccount}
                className="rounded-xl bg-red-900/60 hover:bg-red-800 border border-red-700 px-3.5 py-2 text-xs font-bold text-red-200 hover:text-white cursor-pointer"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
