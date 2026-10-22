/**
 * Authentication and password hashing utilities using Web Crypto API
 */

export interface UserProfile {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar: string;
  bio?: string;
  passwordHash: string;
  createdAt: number;
  settings?: {
    defaultServer?: string;
    autoplay?: boolean;
    autoplayNextEpisode?: boolean;
  };
}

export interface PresetAvatar {
  id: string;
  name: string;
  avatar: string;
}

export const PRESET_AVATARS: PresetAvatar[] = [
  { id: 'director', name: 'Classic Director', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
  { id: 'cinema', name: 'Cinema Fan', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' },
  { id: 'anime', name: 'Anime Master', avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80' },
  { id: 'cyber', name: 'Cyberpunk', avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80' },
  { id: 'scifi', name: 'Sci-Fi Geek', avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80' },
  { id: 'neon', name: 'Midnight Binger', avatar: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=150&auto=format&fit=crop&q=80' },
];

export const AUTH_STORAGE_KEYS = {
  USERS_REGISTRY: 'cinejoy_registered_users',
  ACTIVE_SESSION: 'cinejoy_active_session',
  USER_DATA_PREFIX: 'cinejoy_userdata_',
};

/**
 * Computes SHA-256 hash using Web Crypto API (browser & node-compatible)
 */
export async function hashPassword(password: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(password.trim());
  let hashBuffer: ArrayBuffer;

  if (typeof crypto !== 'undefined' && crypto.subtle) {
    hashBuffer = await crypto.subtle.digest('SHA-256', data);
  } else {
    // Fallback for Node test environments if needed
    const nodeCrypto = await import('node:crypto');
    const hash = nodeCrypto.createHash('sha256').update(password.trim()).digest('hex');
    return hash;
  }

  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function sanitizeUsername(username: string): string {
  return username
    .trim()
    .toLowerCase()
    .replace(/^@+/, '')
    .replace(/[^a-z0-9_.]/g, '');
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}
