import { AppNotification, User } from '../types/user';
import { executeSql } from './db';
import { localStore } from './localStore';

const LAST_NOTIFIED_KEY = 'anme_last_notified_notifs';
const NOTIFICATION_SOUND_ENABLED_KEY = 'anme_notifs_sound_enabled';
const NOTIFICATIONS_CACHE_KEY = 'anme_notifications_cache';
const CLEARED_NOTIFS_KEY = 'anme_cleared_notifs';

export function isNotificationSoundEnabled(): boolean {
  return localStore.get<string>(NOTIFICATION_SOUND_ENABLED_KEY, 'true') !== 'false';
}

export function setNotificationSoundEnabled(enabled: boolean): void {
  localStore.set(NOTIFICATION_SOUND_ENABLED_KEY, String(enabled));
}

/**
 * Fetches real notifications directly from the Turso database.
 * No fake notifications, no synthetic data, no hardcoded fallbacks.
 */
export async function fetchNotifications(user?: User | null): Promise<AppNotification[]> {
  try {
    const clearedIds = new Set<string>(localStore.get<string[]>(CLEARED_NOTIFS_KEY, []) || []);

    const dbNotifs = await executeSql<{
      id: string;
      title: string;
      message: string;
      type: 'episode_drop' | 'announcement' | 'system';
      animeId: number | null;
      animeTitle: string | null;
      animeCover: string | null;
      episodeNumber: number | null;
      createdAt: string;
    }>(
      'SELECT id, title, message, type, anime_id as animeId, anime_title as animeTitle, anime_cover as animeCover, episode_number as episodeNumber, created_at as createdAt FROM notifications ORDER BY created_at DESC LIMIT 50'
    );

    let readIds = new Set<string>();
    if (user) {
      try {
        const readRows = await executeSql<{ notification_id: string }>(
          'SELECT notification_id FROM user_notification_reads WHERE user_id = ?',
          [user.id]
        );
        readIds = new Set((readRows || []).map((r) => r.notification_id));
      } catch {
        // local fallback
      }
    } else {
      const localReads = localStore.get<string[]>('anme_guest_read_notifs', []) || [];
      readIds = new Set(localReads);
    }

    // Filter out cleared notifications and map read state
    const realNotifs: AppNotification[] = (dbNotifs || [])
      .filter((n) => !clearedIds.has(n.id))
      .map((n) => ({
        ...n,
        isRead: readIds.has(n.id),
      }));

    // Cache real notifications to local store
    await localStore.set(NOTIFICATIONS_CACHE_KEY, realNotifs);
    return realNotifs;
  } catch (err) {
    console.error('[Notifications] Failed fetching from database:', err);
    const cached = localStore.get<AppNotification[]>(NOTIFICATIONS_CACHE_KEY, []) || [];
    const clearedIds = new Set<string>(localStore.get<string[]>(CLEARED_NOTIFS_KEY, []) || []);
    return cached.filter((n) => !clearedIds.has(n.id));
  }
}

export async function markNotificationAsRead(notifId: string, user?: User | null): Promise<void> {
  try {
    if (user) {
      await executeSql(
        'INSERT OR IGNORE INTO user_notification_reads (user_id, notification_id) VALUES (?, ?)',
        [user.id, notifId]
      );
    }
    
    const localReads = localStore.get<string[]>('anme_guest_read_notifs', []) || [];
    if (!localReads.includes(notifId)) {
      localReads.push(notifId);
      await localStore.set('anme_guest_read_notifs', localReads);
    }

    // Update in local cache
    const cached = localStore.get<AppNotification[]>(NOTIFICATIONS_CACHE_KEY, []);
    if (cached) {
      const updated = cached.map((n) => (n.id === notifId ? { ...n, isRead: true } : n));
      await localStore.set(NOTIFICATIONS_CACHE_KEY, updated);
    }
  } catch (err) {
    console.error('[Notifications] Mark as read failed:', err);
  }
}

export async function markAllNotificationsAsRead(notifIds: string[], user?: User | null): Promise<void> {
  try {
    if (user) {
      for (const id of notifIds) {
        await executeSql(
          'INSERT OR IGNORE INTO user_notification_reads (user_id, notification_id) VALUES (?, ?)',
          [user.id, id]
        );
      }
    }
    
    await localStore.set('anme_guest_read_notifs', notifIds);

    const cached = localStore.get<AppNotification[]>(NOTIFICATIONS_CACHE_KEY, []);
    if (cached) {
      const readSet = new Set(notifIds);
      const updated = cached.map((n) => (readSet.has(n.id) ? { ...n, isRead: true } : n));
      await localStore.set(NOTIFICATIONS_CACHE_KEY, updated);
    }
  } catch (err) {
    console.error('[Notifications] Mark all read failed:', err);
  }
}

/**
 * Clears and dismisses all notifications from the local store and user feed.
 */
export async function clearAllNotifications(notifIds: string[], user?: User | null): Promise<void> {
  try {
    const clearedList = localStore.get<string[]>(CLEARED_NOTIFS_KEY, []) || [];
    const merged = Array.from(new Set([...clearedList, ...notifIds]));
    await localStore.set(CLEARED_NOTIFS_KEY, merged);
    await localStore.set(NOTIFICATIONS_CACHE_KEY, []);

    if (user && notifIds.length > 0) {
      for (const id of notifIds) {
        await executeSql(
          'INSERT OR IGNORE INTO user_notification_reads (user_id, notification_id) VALUES (?, ?)',
          [user.id, id]
        );
      }
    }
  } catch (err) {
    console.error('[Notifications] Clear all failed:', err);
  }
}

export function triggerDesktopNotification(_title: string, _body: string, _icon?: string): void {
  // Silent in-app notifications only - disabled noisy OS-level desktop popup alerts
}

/**
 * Kept for interface compatibility; automatic desktop OS alerts are disabled
 * to prevent unwanted Windows toast popups on PC startup and intervals.
 */
export async function checkAndDispatchDesktopAlerts(_user?: User | null): Promise<void> {
  // No-op: in-app notifications are displayed inside the notification drawer
}
