import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  sendPasswordResetEmail,
  signOut as firebaseSignOut,
  updateProfile as firebaseUpdateProfile,
  updatePassword as firebaseUpdatePassword,
  deleteUser as firebaseDeleteUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { auth, googleProvider, db, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  UserProfile,
  PRESET_AVATARS,
  AUTH_STORAGE_KEYS,
  LEGACY_AUTH_STORAGE_KEYS,
  sanitizeUsername,
  validateEmail,
  hashPassword,
} from '../utils/auth';
import { STORAGE_KEYS, DEFAULT_LISTS } from '../utils/storage';

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

export interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isCloudSynced: boolean;
  signUp: (params: SignUpParams) => Promise<{ success: boolean; error?: string }>;
  signIn: (params: SignInParams) => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  sendPasswordReset: (email: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCloudSynced, setIsCloudSynced] = useState<boolean>(false);

  // Helper to construct a UserProfile from FirebaseUser & Firestore doc
  const buildUserProfile = (fbUser: FirebaseUser, cloudProfile?: any): UserProfile => {
    const email = fbUser.email || cloudProfile?.email || '';
    const baseUsername = email ? email.split('@')[0] : `user_${fbUser.uid.slice(0, 5)}`;
    return {
      id: fbUser.uid,
      name: cloudProfile?.displayName || fbUser.displayName || email.split('@')[0] || 'Watchlyn Member',
      username: cloudProfile?.username || sanitizeUsername(baseUsername),
      email,
      avatar: cloudProfile?.photoURL || fbUser.photoURL || PRESET_AVATARS[0].avatar,
      bio: cloudProfile?.bio || '',
      createdAt: cloudProfile?.createdAt || (fbUser.metadata.creationTime ? new Date(fbUser.metadata.creationTime).getTime() : Date.now()),
      settings: cloudProfile?.settings || {
        defaultServer: 'vidy',
        autoplay: true,
        autoplayNextEpisode: true,
      },
    };
  };

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        try {
          const userDocRef = doc(db, 'users', fbUser.uid);
          const snap = await getDoc(userDocRef);
          let cloudData = snap.exists() ? snap.data() : null;

          if (!cloudData) {
            // First time Google or newly verified user: Initialize doc in Firestore
            const initialProfile = {
              uid: fbUser.uid,
              displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'Watchlyn Member',
              username: sanitizeUsername(fbUser.email?.split('@')[0] || `user_${fbUser.uid.slice(0, 5)}`),
              email: fbUser.email || '',
              photoURL: fbUser.photoURL || PRESET_AVATARS[0].avatar,
              bio: '',
              createdAt: Date.now(),
              updatedAt: Date.now(),
            };

            cloudData = {
              profile: initialProfile,
              lists: DEFAULT_LISTS,
              continueWatching: [],
              likes: {},
              settings: {
                defaultServer: 'vidy',
                autoplay: true,
                autoplayNextEpisode: true,
              },
              updatedAt: Date.now(),
            };

            await setDoc(userDocRef, cloudData, { merge: true });
          }

          const profile = buildUserProfile(fbUser, cloudData.profile);
          setUser(profile);
          setIsCloudSynced(true);
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, `users/${fbUser.uid}`);
          // Fallback to basic Firebase user profile
          const profile = buildUserProfile(fbUser);
          setUser(profile);
          setIsCloudSynced(true);
        }
      } else {
        // If not in Firebase Auth, check local demo or offline user session
        try {
          const localSession = localStorage.getItem(AUTH_STORAGE_KEYS.ACTIVE_SESSION) || localStorage.getItem(LEGACY_AUTH_STORAGE_KEYS.ACTIVE_SESSION);
          if (localSession) {
            const parsed = JSON.parse(localSession);
            if (parsed?.userId) {
              const users = loadRegisteredUsers();
              const matched = users.find((u) => u.id === parsed.userId);
              if (matched) {
                setUser(matched);
                setIsCloudSynced(false);
              } else {
                setUser(null);
                setIsCloudSynced(false);
              }
            } else {
              setUser(null);
              setIsCloudSynced(false);
            }
          } else {
            setUser(null);
            setIsCloudSynced(false);
          }
        } catch {
          setUser(null);
          setIsCloudSynced(false);
        }
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Email & Password Registration
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

    try {
      const chosenAvatar = avatar || PRESET_AVATARS[0].avatar;
      const cred = await createUserWithEmailAndPassword(auth, email.trim().toLowerCase(), password);

      // Set Firebase Auth Display Name and Photo URL
      await firebaseUpdateProfile(cred.user, {
        displayName: name.trim(),
        photoURL: chosenAvatar,
      });

      // Prepare Initial Cloud Document
      const initialProfile = {
        uid: cred.user.uid,
        displayName: name.trim(),
        username: cleanUser,
        email: email.trim().toLowerCase(),
        photoURL: chosenAvatar,
        bio: '',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const userDocRef = doc(db, 'users', cred.user.uid);
      await setDoc(userDocRef, {
        profile: initialProfile,
        lists: DEFAULT_LISTS,
        continueWatching: [],
        likes: {},
        settings: {
          defaultServer: 'vidy',
          autoplay: true,
          autoplayNextEpisode: true,
        },
        updatedAt: Date.now(),
      }, { merge: true });

      const newProfile = buildUserProfile(cred.user, initialProfile);
      setUser(newProfile);
      setIsCloudSynced(true);

      // Also store in local registry for instant offline fallback
      const users = loadRegisteredUsers().filter((u) => u.email.toLowerCase() !== email.trim().toLowerCase());
      saveRegisteredUsers([...users, newProfile]);

      return { success: true };
    } catch (err: any) {
      console.error('Sign up error:', err);
      let message = err?.message || 'Registration failed.';
      if (err?.code === 'auth/email-already-in-use') {
        message = 'This email is already registered. Please sign in instead.';
      } else if (err?.code === 'auth/weak-password') {
        message = 'Password must be at least 6 characters.';
      } else if (err?.code === 'auth/invalid-email') {
        message = 'The email address is invalid.';
      }
      return { success: false, error: message };
    }
  }, []);

  // Email & Password Sign In
  const signIn = useCallback(async (params: SignInParams): Promise<{ success: boolean; error?: string }> => {
    const { loginIdentifier, password } = params;
    const cleanId = loginIdentifier.trim().toLowerCase();

    if (!cleanId) return { success: false, error: 'Please enter your email or username.' };
    if (!password) return { success: false, error: 'Please enter your password.' };

    let emailToUse = cleanId;
    if (!emailToUse.includes('@')) {
      const users = loadRegisteredUsers();
      const matched = users.find((u) => u.username.toLowerCase() === sanitizeUsername(cleanId));
      if (matched) {
        emailToUse = matched.email;
      } else if (cleanId === 'alex_cinema') {
        emailToUse = 'alex@watchlyn.com';
      } else {
        return { success: false, error: 'Please enter your email address to sign in to the cloud.' };
      }
    }

    try {
      const cred = await signInWithEmailAndPassword(auth, emailToUse, password);
      // Fetch Firestore profile document
      try {
        const userDocRef = doc(db, 'users', cred.user.uid);
        const snap = await getDoc(userDocRef);
        const cloudData = snap.exists() ? snap.data() : null;
        const profile = buildUserProfile(cred.user, cloudData?.profile);
        setUser(profile);
        setIsCloudSynced(true);
      } catch (docErr) {
        handleFirestoreError(docErr, OperationType.GET, `users/${cred.user.uid}`);
        setUser(buildUserProfile(cred.user));
        setIsCloudSynced(true);
      }
      return { success: true };
    } catch (err: any) {
      console.warn('Firebase sign in failed:', err);

      // Special check: If demo user credentials and not yet in Firebase, auto-create demo user
      if ((cleanId === 'alex_cinema' || emailToUse === 'alex@watchlyn.com') && password === 'password123') {
        try {
          const cred = await createUserWithEmailAndPassword(auth, 'alex@watchlyn.com', 'password123');
          await firebaseUpdateProfile(cred.user, {
            displayName: 'Alex Johnson',
            photoURL: PRESET_AVATARS[0].avatar,
          });
          const initialProfile = {
            uid: cred.user.uid,
            displayName: 'Alex Johnson',
            username: 'alex_cinema',
            email: 'alex@watchlyn.com',
            photoURL: PRESET_AVATARS[0].avatar,
            bio: 'Avid film cinephile & TV show binger.',
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          await setDoc(doc(db, 'users', cred.user.uid), {
            profile: initialProfile,
            lists: DEFAULT_LISTS,
            continueWatching: [],
            likes: {},
            settings: { defaultServer: 'vidy', autoplay: true, autoplayNextEpisode: true },
            updatedAt: Date.now(),
          }, { merge: true });

          setUser(buildUserProfile(cred.user, initialProfile));
          setIsCloudSynced(true);
          return { success: true };
        } catch {
          // If already created, try sign in again
          try {
            const cred2 = await signInWithEmailAndPassword(auth, 'alex@watchlyn.com', 'password123');
            setUser(buildUserProfile(cred2.user));
            setIsCloudSynced(true);
            return { success: true };
          } catch {}
        }
      }

      // Offline / Local Registry Fallback
      const localUsers = loadRegisteredUsers();
      const localMatched = localUsers.find(
        (u) => u.email.toLowerCase() === emailToUse || u.username.toLowerCase() === sanitizeUsername(cleanId)
      );

      if (localMatched && localMatched.passwordHash) {
        const hash = await hashPassword(password);
        if (hash === localMatched.passwordHash) {
          localStorage.setItem(AUTH_STORAGE_KEYS.ACTIVE_SESSION, JSON.stringify({ userId: localMatched.id, rememberMe: true }));
          setUser(localMatched);
          setIsCloudSynced(false);
          return { success: true };
        }
      }

      let message = 'Invalid email or password.';
      if (err?.code === 'auth/invalid-credential' || err?.code === 'auth/user-not-found' || err?.code === 'auth/wrong-password') {
        message = 'Invalid email or password. Please verify your credentials or create an account.';
      } else if (err?.code === 'auth/too-many-requests') {
        message = 'Access temporarily disabled due to many failed attempts. Try again later or reset password.';
      }
      return { success: false, error: message };
    }
  }, []);

  // 1-Click "Continue with Google"
  const signInWithGoogle = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await signInWithPopup(auth, googleProvider);
      const fbUser = res.user;

      // Check or initialize Firestore document
      const userDocRef = doc(db, 'users', fbUser.uid);
      const snap = await getDoc(userDocRef);
      let cloudData = snap.exists() ? snap.data() : null;

      if (!cloudData) {
        const initialProfile = {
          uid: fbUser.uid,
          displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'Watchlyn Member',
          username: sanitizeUsername(fbUser.email?.split('@')[0] || `user_${fbUser.uid.slice(0, 5)}`),
          email: fbUser.email || '',
          photoURL: fbUser.photoURL || PRESET_AVATARS[0].avatar,
          bio: '',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        cloudData = {
          profile: initialProfile,
          lists: DEFAULT_LISTS,
          continueWatching: [],
          likes: {},
          settings: {
            defaultServer: 'vidy',
            autoplay: true,
            autoplayNextEpisode: true,
          },
          updatedAt: Date.now(),
        };

        await setDoc(userDocRef, cloudData, { merge: true });
      }

      const profile = buildUserProfile(fbUser, cloudData?.profile);
      setUser(profile);
      setIsCloudSynced(true);
      return { success: true };
    } catch (err: any) {
      console.warn('signInWithPopup failed, attempting redirect fallback:', err);
      if (err?.code === 'auth/popup-blocked' || err?.code === 'auth/popup-closed-by-user') {
        try {
          await signInWithRedirect(auth, googleProvider);
          return { success: true };
        } catch (redirErr: any) {
          return { success: false, error: redirErr?.message || 'Google sign in redirect failed.' };
        }
      }
      return { success: false, error: err?.message || 'Google sign-in could not be completed.' };
    }
  }, []);

  // Forgot Password / Password Reset Email
  const sendPasswordReset = useCallback(async (email: string): Promise<{ success: boolean; error?: string }> => {
    if (!email || !validateEmail(email)) {
      return { success: false, error: 'Please enter a valid email address.' };
    }
    try {
      await sendPasswordResetEmail(auth, email.trim().toLowerCase());
      return { success: true };
    } catch (err: any) {
      let message = err?.message || 'Failed to send password reset email.';
      if (err?.code === 'auth/user-not-found') {
        message = 'No account found with this email address.';
      }
      return { success: false, error: message };
    }
  }, []);

  // Sign Out
  const signOut = useCallback(async (): Promise<void> => {
    try {
      await firebaseSignOut(auth);
    } catch (err) {
      console.warn('Firebase sign out warning:', err);
    }
    localStorage.removeItem(AUTH_STORAGE_KEYS.ACTIVE_SESSION);
    sessionStorage.removeItem(AUTH_STORAGE_KEYS.ACTIVE_SESSION);
    setUser(null);
    setFirebaseUser(null);
    setIsCloudSynced(false);
  }, []);

  // Update Profile
  const updateProfile = useCallback(async (params: UpdateProfileParams): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Not authenticated.' };

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

    // Update Firebase Auth if current user
    if (auth.currentUser) {
      try {
        await firebaseUpdateProfile(auth.currentUser, {
          displayName: updatedUser.name,
          photoURL: updatedUser.avatar,
        });

        const userDocRef = doc(db, 'users', user.id);
        await setDoc(userDocRef, {
          profile: {
            uid: user.id,
            displayName: updatedUser.name,
            username: updatedUser.username,
            email: updatedUser.email,
            photoURL: updatedUser.avatar,
            bio: updatedUser.bio,
            updatedAt: Date.now(),
          },
          settings: updatedUser.settings,
          updatedAt: Date.now(),
        }, { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${user.id}`);
      }
    }

    // Update local storage registry
    const users = loadRegisteredUsers().map((u) => (u.id === user.id ? updatedUser : u));
    saveRegisteredUsers(users);
    setUser(updatedUser);

    return { success: true };
  }, [user]);

  // Change Password
  const changePassword = useCallback(async (currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Not authenticated.' };
    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: 'New password must be at least 6 characters.' };
    }

    if (auth.currentUser) {
      try {
        await firebaseUpdatePassword(auth.currentUser, newPassword);
        return { success: true };
      } catch (err: any) {
        if (err?.code === 'auth/requires-recent-login') {
          return { success: false, error: 'Please sign out and sign in again before changing your password.' };
        }
        return { success: false, error: err?.message || 'Could not update password.' };
      }
    }

    // Local fallback
    const currentHash = await hashPassword(currentPassword);
    if (user.passwordHash && currentHash !== user.passwordHash) {
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
  const deleteAccount = useCallback(async (): Promise<void> => {
    if (!user) return;

    if (auth.currentUser) {
      try {
        await deleteDoc(doc(db, 'users', user.id));
        await firebaseDeleteUser(auth.currentUser);
      } catch (err) {
        console.warn('Account deletion in Firebase had warning:', err);
      }
    }

    const users = loadRegisteredUsers().filter((u) => u.id !== user.id);
    saveRegisteredUsers(users);
    await signOut();
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
        firebaseUser,
        isAuthenticated: !!user,
        isLoading,
        isCloudSynced,
        signUp,
        signIn,
        signInWithGoogle,
        sendPasswordReset,
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
