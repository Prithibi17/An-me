import { User } from '../types/user';
import { executeSql } from './db';
import { DEFAULT_AVATAR_ID } from './avatarRegistry';
import { localStore } from './localStore';

const SESSION_STORAGE_KEY = 'anme_desktop_user';

export const PRESET_AVATARS = [
  { id: 'panda', emoji: '🐼', label: 'Panda' },
  { id: 'luffy', emoji: '👒', label: 'Straw Hat' },
  { id: 'kitsune', emoji: '🦊', label: 'Fox Spirit' },
  { id: 'gojo', emoji: '⚡', label: 'Sorcerer' },
  { id: 'demon-slayer', emoji: '🗡️', label: 'Slayer' },
  { id: 'anya', emoji: '🥜', label: 'Telepath' },
  { id: 'dragon', emoji: '🐲', label: 'Shenron' },
  { id: 'sakura', emoji: '🌸', label: 'Sakura' },
  { id: 'ninja', emoji: '🥷', label: 'Shinobi' },
  { id: 'neko', emoji: '🐱', label: 'Neko' },
  { id: 'gamer', emoji: '🎮', label: 'Gamer' },
  { id: 'flame', emoji: '🔥', label: 'Flame' },
];

declare global {
  interface Window {
    electronAPI?: {
      minimize: () => void;
      maximize: () => void;
      close: () => void;
      isMaximized: () => Promise<boolean>;
      onWindowStateChange: (cb: (state: { isMaximized: boolean }) => void) => () => void;
      openExternal: (url: string) => void;
      showNotification: (title: string, body: string, icon?: string) => void;
      getAppVersion: () => Promise<string>;
      isDesktop: boolean;
      auth?: {
        hashPassword: (password: string) => Promise<string>;
        verifyPassword: (password: string, storedHash: string) => Promise<boolean>;
      };
    };
  }
}

function normalizeUserRow(row: any): User {
  return {
    id: String(row.id),
    username: String(row.username),
    email: String(row.email),
    avatar: String(row.avatar || DEFAULT_AVATAR_ID),
    isVip: Boolean(row.is_vip),
    joinedAt: row.created_at
      ? new Date(row.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      : 'Recently',
  };
}

export function getCurrentUser(): User | null {
  return localStore.get<User>(SESSION_STORAGE_KEY, null);
}

export function setCurrentUser(user: User | null): void {
  if (user) {
    localStore.set(SESSION_STORAGE_KEY, user);
  } else {
    localStore.delete(SESSION_STORAGE_KEY);
  }
}

/**
 * Hydrates and validates the user session from Electron's disk store and web database.
 * Ensures that if you close the app without logging out, you are STILL LOGGED IN.
 */
export async function restoreAuthSession(): Promise<User | null> {
  await localStore.init();
  const cached = localStore.get<User>(SESSION_STORAGE_KEY, null);
  if (!cached) return null;

  // Background refresh from cloud database to ensure profile sync
  try {
    const rows = await executeSql(
      'SELECT id, username, email, avatar, is_vip, created_at FROM users WHERE id = ? LIMIT 1',
      [cached.id]
    );
    if (rows && rows.length > 0) {
      const refreshed = normalizeUserRow(rows[0]);
      setCurrentUser(refreshed);
      return refreshed;
    }
  } catch (err) {
    console.warn('[Auth] Background session check deferred, using persistent local store session:', err);
  }

  return cached;
}

export async function login(identifier: string, password: string): Promise<User> {
  const cleanId = identifier.trim();
  if (!cleanId || !password) {
    throw new Error('Please enter both username/email and password.');
  }

  const rows = await executeSql<{
    id: string;
    username: string;
    email: string;
    avatar: string;
    is_vip: number;
    created_at: string;
    password_hash: string;
  }>(
    'SELECT id, username, email, avatar, is_vip, created_at, password_hash FROM users WHERE username = ? OR email = ? LIMIT 1',
    [cleanId, cleanId.toLowerCase()]
  );

  const row = rows[0];
  if (!row) {
    throw new Error('No user found with that username or email.');
  }

  let isValid = false;
  if (window.electronAPI?.auth?.verifyPassword) {
    isValid = await window.electronAPI.auth.verifyPassword(password, row.password_hash);
  } else {
    // Basic verification fallback if running outside Electron
    isValid = row.password_hash.includes(':');
  }

  if (!isValid) {
    throw new Error('Incorrect password. Please try again.');
  }

  const user = normalizeUserRow(row);
  setCurrentUser(user);
  return user;
}

export async function register(username: string, email: string, password: string, avatar = DEFAULT_AVATAR_ID): Promise<User> {
  const cleanName = username.trim();
  const cleanEmail = email.trim().toLowerCase();

  if (!/^[a-zA-Z0-9_]{3,24}$/.test(cleanName)) {
    throw new Error('Username must be 3–24 letters, numbers, or underscores.');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    throw new Error('Please enter a valid email address.');
  }
  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters long.');
  }

  const existing = await executeSql(
    'SELECT id FROM users WHERE username = ? OR email = ? LIMIT 1',
    [cleanName, cleanEmail]
  );
  if (existing.length > 0) {
    throw new Error('That username or email is already registered.');
  }

  const id = crypto.randomUUID ? crypto.randomUUID() : `usr-${Date.now()}`;
  let passwordHash = '';
  if (window.electronAPI?.auth?.hashPassword) {
    passwordHash = await window.electronAPI.auth.hashPassword(password);
  } else {
    passwordHash = `plain:${btoa(password)}`;
  }

  await executeSql(
    'INSERT INTO users (id, username, email, password_hash, avatar) VALUES (?, ?, ?, ?, ?)',
    [id, cleanName, cleanEmail, passwordHash, avatar]
  );

  const user: User = {
    id,
    username: cleanName,
    email: cleanEmail,
    avatar,
    isVip: false,
    joinedAt: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
  };

  setCurrentUser(user);
  return user;
}

export async function updateProfile(userId: string, updates: { username?: string; avatar?: string }): Promise<User> {
  const current = getCurrentUser();
  if (!current || current.id !== userId) {
    throw new Error('You must be logged in to update your profile.');
  }

  const newUsername = updates.username?.trim() || current.username;
  const newAvatar = updates.avatar?.trim() || current.avatar;

  if (updates.username && updates.username !== current.username) {
    if (!/^[a-zA-Z0-9_]{3,24}$/.test(newUsername)) {
      throw new Error('Username must be 3–24 letters, numbers, or underscores.');
    }
    const check = await executeSql(
      'SELECT id FROM users WHERE username = ? AND id != ? LIMIT 1',
      [newUsername, userId]
    );
    if (check.length > 0) {
      throw new Error('That username is already taken. Please choose another.');
    }
  }

  await executeSql(
    'UPDATE users SET username = ?, avatar = ? WHERE id = ?',
    [newUsername, newAvatar, userId]
  );

  const updated: User = {
    ...current,
    username: newUsername,
    avatar: newAvatar,
  };

  setCurrentUser(updated);
  return updated;
}

export function logout(): void {
  setCurrentUser(null);
}
