import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  UserProfile,
  PRESET_AVATARS,
  AUTH_STORAGE_KEYS,
  LEGACY_AUTH_STORAGE_KEYS,
  hashPassword,
  sanitizeUsername,
  validateEmail,
} from '../utils/auth';
import { STORAGE_KEYS } from '../utils/storage';

interface SignUpParams {
  name: string;
  username: string;
  email: string;
  password: string;
  avatar?: string;
}

interface SignInParams {
  loginIdentifier: string; // Email or Username
  password: string;
  rememberMe?: boolean;
}

interface UpdateProfileParams {
  name?: string;
  username?: string;
  avatar?: string;
  bio?: string;
  settings?: {
    defaultServer?: string;
    autoplay?: boolean;
    autoplayNextEpisode?: boolean;
  };
}

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signUp: (params: SignUpParams) => Promise<{ success: boolean; error?: string }>;
  signIn: (params: SignInParams) => Promise<{ success: boolean; error?: string }>;
  signOut: () => void;
  updateProfile: (params: UpdateProfileParams) => Promise<{ success: boolean; error?: string }>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  deleteAccount: () => Promise<void>;
  clearCache: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

function loadRegisteredUsers(): UserProfile[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEYS.USERS_REGISTRY) || localStorage.getItem(LEGACY_AUTH_STORAGE_KEYS.USERS_REGISTRY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRegisteredUsers(users: UserProfile[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(AUTH_STORAGE_KEYS.USERS_REGISTRY, JSON.stringify(users));
  } catch (err) {
    console.error('Failed to save users:', err);
  }
}

function loadSession(): { userId: string; rememberMe: boolean } | null {
  if (typeof window === 'undefined') return null;
  try {
    const local = localStorage.getItem(AUTH_STORAGE_KEYS.ACTIVE_SESSION) || localStorage.getItem(LEGACY_AUTH_STORAGE_KEYS.ACTIVE_SESSION);
    if (local) return JSON.parse(local);

    const session = sessionStorage.getItem(AUTH_STORAGE_KEYS.ACTIVE_SESSION) || sessionStorage.getItem(LEGACY_AUTH_STORAGE_KEYS.ACTIVE_SESSION);
    if (session) return JSON.parse(session);

    return null;
  } catch {
    return null;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Migrate Guest Data into user storage namespace
  const migrateGuestDataToUser = useCallback((userId: string) => {
    if (typeof window === 'undefined') return;
    try {
      const userKeyPrefix = `${AUTH_STORAGE_KEYS.USER_DATA_PREFIX}${userId}_`;

      // Check if user already has data
      const existingUserLists = localStorage.getItem(`${userKeyPrefix}${STORAGE_KEYS.CUSTOM_LISTS}`);
      if (!existingUserLists) {
        // Migrate guest lists if available
        const guestLists = localStorage.getItem(STORAGE_KEYS.CUSTOM_LISTS);
        if (guestLists) {
          localStorage.setItem(`${userKeyPrefix}${STORAGE_KEYS.CUSTOM_LISTS}`, guestLists);
        }
      }

      const existingUserHistory = localStorage.getItem(`${userKeyPrefix}${STORAGE_KEYS.CONTINUE_WATCHING}`);
      if (!existingUserHistory) {
        const guestHistory = localStorage.getItem(STORAGE_KEYS.CONTINUE_WATCHING);
        if (guestHistory) {
          localStorage.setItem(`${userKeyPrefix}${STORAGE_KEYS.CONTINUE_WATCHING}`, guestHistory);
        }
      }

      const existingReactions = localStorage.getItem(`${userKeyPrefix}${STORAGE_KEYS.REACTIONS}`);
      if (!existingReactions) {
        const guestReactions = localStorage.getItem(STORAGE_KEYS.REACTIONS);
        if (guestReactions) {
          localStorage.setItem(`${userKeyPrefix}${STORAGE_KEYS.REACTIONS}`, guestReactions);
        }
      }

      const existingComments = localStorage.getItem(`${userKeyPrefix}${STORAGE_KEYS.COMMENTS}`);
      if (!existingComments) {
        const guestComments = localStorage.getItem(STORAGE_KEYS.COMMENTS);
        if (guestComments) {
          localStorage.setItem(`${userKeyPrefix}${STORAGE_KEYS.COMMENTS}`, guestComments);
        }
      }
    } catch (err) {
      console.warn('Data migration warning:', err);
    }
  }, []);

  // Initialize session on mount
  useEffect(() => {
    const session = loadSession();
    if (session?.userId) {
      const users = loadRegisteredUsers();
      const matched = users.find((u) => u.id === session.userId);
      if (matched) {
        setUser(matched);
      }
    }
    setIsLoading(false);
  }, []);

  // Sign Up
  const signUp = useCallback(async (params: SignUpParams): Promise<{ success: boolean; error?: string }> => {
    const { name, username, email, password, avatar } = params;

    if (!name.trim()) return { success: false, error: 'Full name is required.' };
    const cleanUser = sanitizeUsername(username);
    if (!cleanUser || cleanUser.length < 3) {
      return { success: false, error: 'Username must be at least 3 characters (letters, numbers, underscores).' };
    }
    if (!validateEmail(email)) {
      return { success: false, error: 'Please enter a valid email address.' };
    }
    if (!password || password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters long.' };
    }

    const users = loadRegisteredUsers();

    // Check email uniqueness
    if (users.some((u) => u.email.toLowerCase() === email.trim().toLowerCase())) {
      return { success: false, error: 'An account with this email already exists.' };
    }
    // Check username uniqueness
    if (users.some((u) => u.username.toLowerCase() === cleanUser.toLowerCase())) {
      return { success: false, error: `Username @${cleanUser} is already taken.` };
    }

    const passwordHash = await hashPassword(password);
    const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const chosenAvatar = avatar || PRESET_AVATARS[Math.floor(Math.random() * PRESET_AVATARS.length)].avatar;

    const newUser: UserProfile = {
      id: userId,
      name: name.trim(),
      username: cleanUser,
      email: email.trim().toLowerCase(),
      avatar: chosenAvatar,
      passwordHash,
      createdAt: Date.now(),
      settings: {
        defaultServer: 'vidy',
        autoplay: true,
        autoplayNextEpisode: true,
      },
    };

    const updatedUsers = [...users, newUser];
    saveRegisteredUsers(updatedUsers);

    // Save session
    localStorage.setItem(AUTH_STORAGE_KEYS.ACTIVE_SESSION, JSON.stringify({ userId, rememberMe: true }));
    migrateGuestDataToUser(userId);
    setUser(newUser);

    return { success: true };
  }, [migrateGuestDataToUser]);

  // Sign In
  const signIn = useCallback(async (params: SignInParams): Promise<{ success: boolean; error?: string }> => {
    const { loginIdentifier, password, rememberMe = true } = params;
    const cleanId = loginIdentifier.trim().toLowerCase();

    if (!cleanId) return { success: false, error: 'Please enter your email or username.' };
    if (!password) return { success: false, error: 'Please enter your password.' };

    const users = loadRegisteredUsers();
    const cleanUser = sanitizeUsername(cleanId);

    const targetUser = users.find(
      (u) => u.email.toLowerCase() === cleanId || u.username.toLowerCase() === cleanUser
    );

    if (!targetUser) {
      return { success: false, error: 'Account not found. Please check your credentials or sign up.' };
    }

    const hash = await hashPassword(password);
    if (hash !== targetUser.passwordHash) {
      return { success: false, error: 'Invalid email/username or password.' };
    }

    // Set session
    const sessionData = { userId: targetUser.id, rememberMe };
    if (rememberMe) {
      localStorage.setItem(AUTH_STORAGE_KEYS.ACTIVE_SESSION, JSON.stringify(sessionData));
      sessionStorage.removeItem(AUTH_STORAGE_KEYS.ACTIVE_SESSION);
    } else {
      sessionStorage.setItem(AUTH_STORAGE_KEYS.ACTIVE_SESSION, JSON.stringify(sessionData));
      localStorage.removeItem(AUTH_STORAGE_KEYS.ACTIVE_SESSION);
    }

    migrateGuestDataToUser(targetUser.id);
    setUser(targetUser);
    return { success: true };
  }, [migrateGuestDataToUser]);

  // Sign Out
  const signOut = useCallback(() => {
    localStorage.removeItem(AUTH_STORAGE_KEYS.ACTIVE_SESSION);
    sessionStorage.removeItem(AUTH_STORAGE_KEYS.ACTIVE_SESSION);
    setUser(null);
  }, []);

  // Update Profile
  const updateProfile = useCallback(async (params: UpdateProfileParams): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Not authenticated.' };

    const users = loadRegisteredUsers();

    if (params.username) {
      const cleanUser = sanitizeUsername(params.username);
      if (cleanUser !== user.username) {
        if (users.some((u) => u.id !== user.id && u.username.toLowerCase() === cleanUser.toLowerCase())) {
          return { success: false, error: `Username @${cleanUser} is already taken.` };
        }
      }
    }

    const updatedUser: UserProfile = {
      ...user,
      name: params.name !== undefined ? params.name.trim() : user.name,
      username: params.username !== undefined ? sanitizeUsername(params.username) : user.username,
      avatar: params.avatar !== undefined ? params.avatar : user.avatar,
      bio: params.bio !== undefined ? params.bio.trim() : user.bio,
      settings: {
        ...user.settings,
        ...params.settings,
      },
    };

    const updatedUsers = users.map((u) => (u.id === user.id ? updatedUser : u));
    saveRegisteredUsers(updatedUsers);
    setUser(updatedUser);

    return { success: true };
  }, [user]);

  // Change Password
  const changePassword = useCallback(async (currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Not authenticated.' };
    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: 'New password must be at least 6 characters.' };
    }

    const currentHash = await hashPassword(currentPassword);
    if (currentHash !== user.passwordHash) {
      return { success: false, error: 'Current password is incorrect.' };
    }

    const newHash = await hashPassword(newPassword);
    const updatedUser: UserProfile = { ...user, passwordHash: newHash };

    const users = loadRegisteredUsers().map((u) => (u.id === user.id ? updatedUser : u));
    saveRegisteredUsers(users);
    setUser(updatedUser);

    return { success: true };
  }, [user]);

  // Delete Account
  const deleteAccount = useCallback(async () => {
    if (!user) return;
    const users = loadRegisteredUsers().filter((u) => u.id !== user.id);
    saveRegisteredUsers(users);
    signOut();
  }, [user, signOut]);

  // Clear Local Cache
  const clearCache = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEYS.CONTINUE_WATCHING);
      localStorage.removeItem(STORAGE_KEYS.CUSTOM_LISTS);
      sessionStorage.clear();
      window.location.reload();
    } catch (err) {
      console.error(err);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        signUp,
        signIn,
        signOut,
        updateProfile,
        changePassword,
        deleteAccount,
        clearCache,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
