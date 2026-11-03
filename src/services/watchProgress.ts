import type { Anime, WatchHistoryItem } from '../types/anime.ts';
import { localStore } from './localStore.ts';
import { recordWatchProgress, getWatchHistory } from './storage.ts';

export type EpisodeWatchStatus = 'unwatched' | 'watching' | 'watched';

export interface EpisodeProgress {
  animeId: number;
  episodeNumber: number;
  status: EpisodeWatchStatus;
  currentTime: number; // in seconds
  duration: number; // in seconds (default 1440s = 24 mins)
  progressPercent: number; // 0 to 100
  lastUpdated: number; // timestamp in ms
}

export interface AnimeWatchState {
  animeId: number;
  title: string;
  coverImage: string;
  totalEpisodes: number;
  currentEpisode: number;
  lastPlaybackPosition: number; // in seconds
  lastUpdated: number;
  episodes: Record<number, EpisodeProgress>;
}

const STORAGE_KEY_PREFIX = 'anme_watch_state_';
const ALL_ANIME_KEYS_INDEX = 'anme_watch_anime_index';
const COMPLETION_THRESHOLD = 90; // 90% watched = marked as 'watched'
const DEFAULT_EPISODE_DURATION = 24 * 60; // 24 minutes in seconds

// Custom event name for instant cross-component synchronization
export const WATCH_PROGRESS_EVENT = 'anme_watch_progress_sync';

function notifyProgressChange(state: AnimeWatchState) {
  try {
    if (typeof window !== 'undefined') {
      const event = new CustomEvent(WATCH_PROGRESS_EVENT, { detail: state });
      window.dispatchEvent(event);
    }
  } catch (err) {
    console.warn('[watchProgress] Event dispatch warning:', err);
  }
}

/**
 * Retrieves the index of anime IDs that have tracking state
 */
function getTrackedAnimeIds(): number[] {
  try {
    const raw = localStore.get<number[]>(ALL_ANIME_KEYS_INDEX, []);
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

function saveTrackedAnimeIds(ids: number[]) {
  try {
    const unique = Array.from(new Set(ids));
    localStore.set(ALL_ANIME_KEYS_INDEX, unique);
  } catch (err) {
    console.warn('[watchProgress] Failed to save tracked IDs:', err);
  }
}

/**
 * Retrieves the complete watch state for an anime from local storage
 */
export function getAnimeWatchState(animeId: number): AnimeWatchState | null {
  if (!animeId) return null;
  const key = `${STORAGE_KEY_PREFIX}${animeId}`;
  return localStore.get<AnimeWatchState>(key, null);
}

/**
 * Saves the watch state for an anime and updates the continue watching list
 */
export function saveAnimeWatchState(state: AnimeWatchState): void {
  if (!state || !state.animeId) return;
  const key = `${STORAGE_KEY_PREFIX}${state.animeId}`;
  localStore.set(key, state);

  // Update tracked index
  const tracked = getTrackedAnimeIds();
  if (!tracked.includes(state.animeId)) {
    tracked.unshift(state.animeId);
    saveTrackedAnimeIds(tracked.slice(0, 100));
  }

  // Also sync with legacy WatchHistoryItem for maximum compatibility
  try {
    const currentEp = state.episodes[state.currentEpisode];
    const progressPercent = currentEp ? currentEp.progressPercent : 0;
    const history = getWatchHistory();
    const existingIdx = history.findIndex((h) => h.animeId === state.animeId);
    const item: WatchHistoryItem = {
      animeId: state.animeId,
      title: state.title,
      coverImage: state.coverImage,
      episode: state.currentEpisode,
      totalEpisodes: state.totalEpisodes,
      progressPercent,
      lastUpdated: state.lastUpdated,
    };
    if (existingIdx > -1) {
      history.splice(existingIdx, 1);
    }
    history.unshift(item);
    localStorage.setItem('anme_desktop_history', JSON.stringify(history.slice(0, 40)));
  } catch {
    // legacy sync protection
  }

  notifyProgressChange(state);
}

/**
 * Returns viewing status for a specific episode of an anime
 */
export function getEpisodeWatchStatus(animeId: number, episodeNumber: number): EpisodeWatchStatus {
  const state = getAnimeWatchState(animeId);
  if (!state || !state.episodes || !state.episodes[episodeNumber]) {
    return 'unwatched';
  }
  return state.episodes[episodeNumber].status;
}

/**
 * Returns episode progress record for a specific episode
 */
export function getEpisodeProgress(animeId: number, episodeNumber: number): EpisodeProgress | null {
  const state = getAnimeWatchState(animeId);
  if (!state || !state.episodes || !state.episodes[episodeNumber]) {
    return null;
  }
  return state.episodes[episodeNumber];
}

/**
 * Updates playback progress for an anime episode.
 * Automatically marks as 'watched' when progress exceeds completion threshold (90%).
 */
export function recordEpisodeProgress(
  anime: Anime,
  episodeNumber: number,
  currentTimeSeconds: number,
  durationSeconds?: number
): EpisodeProgress {
  const animeId = anime.id;
  const title = anime.title.english || anime.title.romaji || anime.title.userPreferred || 'Anime';
  const coverImage = anime.coverImage.large || anime.coverImage.medium || '';
  const totalEpisodes = anime.episodes || 12;

  const duration = durationSeconds && durationSeconds > 0 ? durationSeconds : DEFAULT_EPISODE_DURATION;
  const currentTime = Math.max(0, Math.min(currentTimeSeconds, duration));
  const progressPercent = Math.min(100, Math.max(0, Math.round((currentTime / duration) * 100)));

  let status: EpisodeWatchStatus = 'watching';
  if (progressPercent >= COMPLETION_THRESHOLD) {
    status = 'watched';
  } else if (currentTime < 5 && progressPercent < 2) {
    // Started playing, initial status
    status = 'watching';
  }

  const existingState = getAnimeWatchState(animeId) || {
    animeId,
    title,
    coverImage,
    totalEpisodes,
    currentEpisode: episodeNumber,
    lastPlaybackPosition: currentTime,
    lastUpdated: Date.now(),
    episodes: {},
  };

  const existingEp = existingState.episodes[episodeNumber];
  // If already marked as 'watched', do not downgrade to 'watching' unless user rewound significantly (< 20%)
  if (existingEp && existingEp.status === 'watched' && progressPercent >= 20) {
    status = 'watched';
  }

  const epProgress: EpisodeProgress = {
    animeId,
    episodeNumber,
    status,
    currentTime,
    duration,
    progressPercent,
    lastUpdated: Date.now(),
  };

  existingState.title = title;
  existingState.coverImage = coverImage;
  existingState.totalEpisodes = totalEpisodes;
  existingState.currentEpisode = episodeNumber;
  existingState.lastPlaybackPosition = currentTime;
  existingState.lastUpdated = Date.now();
  existingState.episodes[episodeNumber] = epProgress;

  saveAnimeWatchState(existingState);
  return epProgress;
}

/**
 * Explicitly marks an episode as Watched
 */
export function markEpisodeWatched(anime: Anime, episodeNumber: number): void {
  const animeId = anime.id;
  const title = anime.title.english || anime.title.romaji || anime.title.userPreferred || 'Anime';
  const coverImage = anime.coverImage.large || anime.coverImage.medium || '';
  const totalEpisodes = anime.episodes || 12;

  const existingState = getAnimeWatchState(animeId) || {
    animeId,
    title,
    coverImage,
    totalEpisodes,
    currentEpisode: episodeNumber,
    lastPlaybackPosition: DEFAULT_EPISODE_DURATION,
    lastUpdated: Date.now(),
    episodes: {},
  };

  const duration = existingState.episodes[episodeNumber]?.duration || DEFAULT_EPISODE_DURATION;

  existingState.episodes[episodeNumber] = {
    animeId,
    episodeNumber,
    status: 'watched',
    currentTime: duration,
    duration,
    progressPercent: 100,
    lastUpdated: Date.now(),
  };

  existingState.currentEpisode = episodeNumber;
  existingState.lastUpdated = Date.now();

  saveAnimeWatchState(existingState);
}

/**
 * Explicitly marks an episode as Unwatched (resets progress)
 */
export function markEpisodeUnwatched(animeId: number, episodeNumber: number): void {
  const existingState = getAnimeWatchState(animeId);
  if (!existingState || !existingState.episodes) return;

  delete existingState.episodes[episodeNumber];
  existingState.lastUpdated = Date.now();

  saveAnimeWatchState(existingState);
}

/**
 * Finds the best episode to resume for an anime.
 * Returns the currently watching episode or next unwatched episode.
 */
export function getResumeInfo(animeId: number): {
  episode: number;
  currentTime: number;
  progressPercent: number;
  status: EpisodeWatchStatus;
} | null {
  const state = getAnimeWatchState(animeId);
  if (!state || !state.episodes) return null;

  // 1. If currently watching an episode, resume it
  const currentEp = state.episodes[state.currentEpisode];
  if (currentEp && currentEp.status === 'watching') {
    return {
      episode: currentEp.episodeNumber,
      currentTime: currentEp.currentTime,
      progressPercent: currentEp.progressPercent,
      status: 'watching',
    };
  }

  // 2. Otherwise find the highest watched episode + 1
  const episodeNumbers = Object.keys(state.episodes)
    .map(Number)
    .sort((a, b) => a - b);

  let highestWatched = 0;
  for (const num of episodeNumbers) {
    if (state.episodes[num].status === 'watched') {
      highestWatched = Math.max(highestWatched, num);
    }
  }

  if (highestWatched > 0) {
    const nextEp = highestWatched + 1;
    const existingNext = state.episodes[nextEp];
    return {
      episode: nextEp,
      currentTime: existingNext?.currentTime || 0,
      progressPercent: existingNext?.progressPercent || 0,
      status: existingNext?.status || 'unwatched',
    };
  }

  if (currentEp) {
    return {
      episode: currentEp.episodeNumber,
      currentTime: currentEp.currentTime,
      progressPercent: currentEp.progressPercent,
      status: currentEp.status,
    };
  }

  return null;
}

/**
 * Returns all in-progress or recently watched anime for the Continue Watching section
 */
export function getContinueWatchingList(): AnimeWatchState[] {
  const ids = getTrackedAnimeIds();
  const list: AnimeWatchState[] = [];

  for (const id of ids) {
    const state = getAnimeWatchState(id);
    if (state) {
      list.push(state);
    }
  }

  // Sort descending by last updated timestamp
  return list.sort((a, b) => b.lastUpdated - a.lastUpdated);
}
