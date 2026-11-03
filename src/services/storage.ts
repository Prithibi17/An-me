import type { Anime, WatchHistoryItem, WatchlistItem, WatchlistStatus } from '../types/anime.ts';

const WATCHLIST_KEY = 'anme_desktop_watchlist';
const HISTORY_KEY = 'anme_desktop_history';
const PREFS_KEY = 'anme_desktop_preferences';

export interface UserPreferences {
  preferredServer: string;
  preferredTrack: 'sub' | 'dub';
  autoplay: boolean;
  autoNext: boolean;
}

const DEFAULT_PREFS: UserPreferences = {
  preferredServer: 'zokoanime-mal',
  preferredTrack: 'sub',
  autoplay: true,
  autoNext: true,
};

export function getWatchlist(): WatchlistItem[] {
  try {
    const raw = localStorage.getItem(WATCHLIST_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveToWatchlist(anime: Anime, status: WatchlistStatus, lastWatchedEpisode?: number): void {
  try {
    const current = getWatchlist();
    const index = current.findIndex((item) => item.anime.id === anime.id);

    if (index > -1) {
      current[index] = {
        ...current[index],
        status,
        lastWatchedEpisode: lastWatchedEpisode ?? current[index].lastWatchedEpisode,
      };
    } else {
      current.unshift({
        anime,
        status,
        addedAt: Date.now(),
        lastWatchedEpisode,
      });
    }

    localStorage.setItem(WATCHLIST_KEY, JSON.stringify(current));

    // Show native desktop notification if in Electron
    if ((window as any).electronAPI?.showNotification) {
      const titleName = anime.title.english || anime.title.romaji || 'Anime';
      (window as any).electronAPI.showNotification('Watchlist Updated', `"${titleName}" set to ${status.replace(/_/g, ' ')}`);
    }
  } catch (err) {
    console.error('Error saving to watchlist:', err);
  }
}

export function removeFromWatchlist(animeId: number): void {
  try {
    const current = getWatchlist().filter((item) => item.anime.id !== animeId);
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify(current));
  } catch (err) {
    console.error('Error removing from watchlist:', err);
  }
}

export function getWatchHistory(): WatchHistoryItem[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function recordWatchProgress(
  anime: Anime,
  episode: number,
  progressPercent = 100
): void {
  try {
    const history = getWatchHistory();
    const title = anime.title.english || anime.title.romaji || 'Anime';
    const coverImage = anime.coverImage.large || anime.coverImage.medium || '';

    const existingIndex = history.findIndex((h) => h.animeId === anime.id);
    const updatedItem: WatchHistoryItem = {
      animeId: anime.id,
      title,
      coverImage,
      episode,
      totalEpisodes: anime.episodes,
      progressPercent,
      lastUpdated: Date.now(),
    };

    if (existingIndex > -1) {
      history.splice(existingIndex, 1);
    }
    history.unshift(updatedItem);

    // Keep top 30 history items
    const trimmed = history.slice(0, 30);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));

    // Also update watchlist episode progress if in list
    const watchlist = getWatchlist();
    const wlIndex = watchlist.findIndex((item) => item.anime.id === anime.id);
    if (wlIndex > -1) {
      watchlist[wlIndex].lastWatchedEpisode = episode;
      localStorage.setItem(WATCHLIST_KEY, JSON.stringify(watchlist));
    }
  } catch (err) {
    console.error('Error recording watch progress:', err);
  }
}

export function clearWatchHistory(): void {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch (err) {
    console.error('Error clearing history:', err);
  }
}

export function getPreferences(): UserPreferences {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    return raw ? { ...DEFAULT_PREFS, ...JSON.parse(raw) } : DEFAULT_PREFS;
  } catch {
    return DEFAULT_PREFS;
  }
}

export function savePreferences(prefs: Partial<UserPreferences>): void {
  try {
    const current = getPreferences();
    const updated = { ...current, ...prefs };
    localStorage.setItem(PREFS_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Error saving preferences:', err);
  }
}
