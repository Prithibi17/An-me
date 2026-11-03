import type { Anime } from '../types/anime.ts';

export interface RawProviderAnime {
  id: number;
  title: string;
  alternative?: string;
  titles?: string;
  native?: string;
  slug?: string;
  rating?: string;
  poster?: string;
  is_dub?: number | string | null;
  is_sub?: number | string | null;
  description?: string;
  aired?: string;
  season?: string;
  year?: number;
  duration?: string;
  status?: string;
  score?: string;
  mal_id?: string | number | null;
  ani_id?: string | number | null;
  episodes?: string | number | null;
  source?: string;
  s_id?: number;
  background_image?: string;
  updated_at?: string;
  next_air_schedule_time?: number;
  next_air_ep?: number;
  terms_by_type?: {
    genre?: string[];
    studios?: string[];
    type?: string[];
  };
}

export interface LatestEpisodesResult {
  items: Anime[];
  total: number;
  totalPages: number;
  currentPage: number;
  hasMore: boolean;
}

export type EpisodeAudioFilter = 'all' | 'sub' | 'dub';

const BASE_URL = 'https://anikotoapi.site';

/**
 * Checks whether an anime contains hentai, explicitly pornographic, or prohibited adult content.
 */
export function isProhibitedContent(raw: RawProviderAnime): boolean {
  if (raw.rating) {
    const r = raw.rating.trim().toLowerCase();
    if (
      r.includes('hentai') ||
      r === 'rx' ||
      r === 'r18+' ||
      r === 'r18' ||
      r.includes('pornographic') ||
      r.includes('explicit')
    ) {
      return true;
    }
  }

  const genres = raw.terms_by_type?.genre || [];
  for (const g of genres) {
    const lower = g.trim().toLowerCase();
    if (lower === 'hentai' || lower === 'erotica' || lower === 'pornographic') {
      return true;
    }
  }

  if ((raw as any).isAdult === true) {
    return true;
  }

  return false;
}

/**
 * Parses provider updated_at string (e.g. "2026-11-02 18:16:27") into a verified UTC epoch timestamp in milliseconds.
 * Returns 0 if invalid or missing.
 */
export function parseAvailabilityTimestamp(rawDate?: string): number {
  if (!rawDate || typeof rawDate !== 'string') return 0;
  const trimmed = rawDate.trim();
  if (!trimmed) return 0;

  // Normalise to ISO format: "YYYY-MM-DDTHH:mm:ssZ"
  const isoCandidate = trimmed.replace(' ', 'T') + 'Z';
  const parsed = Date.parse(isoCandidate);
  if (!isNaN(parsed) && parsed > 0) {
    return parsed;
  }

  const fallback = Date.parse(trimmed + ' UTC');
  if (!isNaN(fallback) && fallback > 0) {
    return fallback;
  }

  return 0;
}

/**
 * Formats a verified availability timestamp into a clean relative time string (e.g., "12m ago", "3h ago", "Yesterday").
 */
export function formatRelativeTime(timestampMs: number, referenceNow = Date.now()): string {
  if (!timestampMs || isNaN(timestampMs) || timestampMs <= 0) return '';
  const diffMs = referenceNow - timestampMs;

  if (diffMs < 0) return 'Just now'; // Slight clock skew
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return 'Just now';

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;

  const date = new Date(timestampMs);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Maps raw provider records into canonical Anime objects.
 * - Extracts canonical AniList ID (fallback to MAL ID, then provider ID).
 * - Enforces verified episode counts (no unreleased upcoming episodes displayed as playable).
 * - Attaches parsed timestamp and formatted relative time.
 */
export function normalizeProviderRecord(raw: RawProviderAnime, referenceNow = Date.now()): Anime {
  const aniId = Number(raw.ani_id);
  const malId = Number(raw.mal_id);
  const canonicalId = (aniId && aniId > 0) ? aniId : (malId && malId > 0) ? malId : raw.id;

  const isSubNum = Number(raw.is_sub) || 0;
  const isDubNum = Number(raw.is_dub) || 0;
  const totalEpNum = Number(raw.episodes) || null;

  // If next_air_ep is known (e.g. next episode is 6), the current playable episode cannot exceed next_air_ep - 1
  let verifiedSubCount = isSubNum;
  if (raw.next_air_ep && raw.next_air_ep > 1 && verifiedSubCount >= raw.next_air_ep) {
    verifiedSubCount = raw.next_air_ep - 1;
  }

  const latestEp = Math.max(verifiedSubCount, isDubNum, 1);
  const rawTimestamp = parseAvailabilityTimestamp(raw.updated_at);

  // For SUB releases: availability timestamp is valid if this release includes a SUB episode
  const subAvailabilityTimestamp = isSubNum > 0 ? rawTimestamp : 0;
  const relativeTime = rawTimestamp > 0 ? formatRelativeTime(rawTimestamp, referenceNow) : '';

  const genres = raw.terms_by_type?.genre || [];
  const studioName = raw.terms_by_type?.studios?.[0];

  return {
    id: canonicalId,
    idMal: malId > 0 ? malId : undefined,
    title: {
      english: raw.titles || raw.title,
      romaji: raw.alternative || raw.title,
      native: raw.native,
      userPreferred: raw.title,
    },
    coverImage: {
      large: raw.poster || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="450" viewBox="0 0 300 450"><rect width="300" height="450" fill="%2311151b"/><text x="50%" y="50%" fill="%23666" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="16">No Poster</text></svg>',
      medium: raw.poster,
    },
    bannerImage: raw.background_image || null,
    description: raw.description,
    format: raw.terms_by_type?.type?.[0] || 'TV',
    status: raw.status || 'RELEASING',
    episodes: totalEpNum,
    subEpisodeCount: verifiedSubCount,
    dubEpisodeCount: isDubNum,
    latestEpisodeNumber: latestEp,
    latestEpisodeTimestamp: subAvailabilityTimestamp || rawTimestamp,
    relativeUpdateTime: relativeTime,
    providerId: raw.id,
    duration: raw.duration ? parseInt(raw.duration, 10) || null : null,
    genres,
    averageScore: raw.score ? Math.round(parseFloat(raw.score) * 10) : null,
    season: raw.season,
    seasonYear: raw.year,
    studios: studioName ? { nodes: [{ name: studioName, isAnimationStudio: true }] } : undefined,
  };
}

/**
 * Deduplicates anime records by canonical anime identity.
 * - Distinct anime/seasons remain distinct entries.
 * - Server mirrors / duplicate notifications for the same anime are merged.
 * - Retains highest verified available episode number and newest availability timestamp.
 */
export function deduplicateAnimeRecords(animeList: Anime[]): Anime[] {
  const mergedMap = new Map<number, Anime>();

  for (const item of animeList) {
    const existing = mergedMap.get(item.id);
    if (!existing) {
      mergedMap.set(item.id, { ...item });
      continue;
    }

    // Merge duplicate records / mirrors:
    const bestSub = Math.max(existing.subEpisodeCount || 0, item.subEpisodeCount || 0);
    const bestDub = Math.max(existing.dubEpisodeCount || 0, item.dubEpisodeCount || 0);
    const bestTimestamp = Math.max(existing.latestEpisodeTimestamp || 0, item.latestEpisodeTimestamp || 0);
    const bestLatestEp = Math.max(existing.latestEpisodeNumber || 0, item.latestEpisodeNumber || 0, bestSub);

    mergedMap.set(item.id, {
      ...existing,
      subEpisodeCount: bestSub,
      dubEpisodeCount: bestDub,
      latestEpisodeNumber: bestLatestEp,
      latestEpisodeTimestamp: bestTimestamp,
      relativeUpdateTime: bestTimestamp > 0 ? formatRelativeTime(bestTimestamp) : existing.relativeUpdateTime,
      coverImage: {
        large: existing.coverImage.large || item.coverImage.large,
        medium: existing.coverImage.medium || item.coverImage.medium,
      },
    });
  }

  return Array.from(mergedMap.values());
}

/**
 * Merges a newly fetched older batch of anime into an existing list of anime:
 * - Appends new unique anime.
 * - Deduplicates without shifting the order of already visible cards.
 */
export function mergeLatestEpisodesBatches(currentList: Anime[], newBatch: Anime[]): Anime[] {
  const existingIds = new Set(currentList.map((a) => a.id));
  const uniqueNewItems: Anime[] = [];

  for (const item of newBatch) {
    if (!existingIds.has(item.id)) {
      existingIds.add(item.id);
      uniqueNewItems.push(item);
    }
  }

  return [...currentList, ...uniqueNewItems];
}

/**
 * Strict Specification Sorting:
 * 1. Verified availability timestamps first (newest timestamp first).
 * 2. Stable secondary key (anime.id DESC) for identical timestamps.
 * 3. Records with missing/unknown timestamps kept in a separate fallback group at the end,
 *    retaining their authoritative provider sequence.
 * 4. Never sorts by premiere date, popularity, rating, alphabetical order, or episode number.
 */
export function sortLatestEpisodes(
  list: Anime[],
  filter: EpisodeAudioFilter = 'sub'
): Anime[] {
  // Apply SUB / DUB availability filter
  let filtered = list;
  if (filter === 'sub') {
    // Only verified playable SUB episodes
    filtered = list.filter((a) => (a.subEpisodeCount || 0) > 0);
  } else if (filter === 'dub') {
    filtered = list.filter((a) => (a.dubEpisodeCount || 0) > 0);
  }

  const withTimestamp: Anime[] = [];
  const missingTimestamp: Anime[] = [];

  for (const item of filtered) {
    if (item.latestEpisodeTimestamp && item.latestEpisodeTimestamp > 0) {
      withTimestamp.push(item);
    } else {
      missingTimestamp.push(item);
    }
  }

  // Group A: Verified timestamps sorted descending, stable secondary sort on id
  withTimestamp.sort((a, b) => {
    const diff = (b.latestEpisodeTimestamp || 0) - (a.latestEpisodeTimestamp || 0);
    if (diff !== 0) return diff;
    return b.id - a.id;
  });

  // Group B retains original provider order
  return [...withTimestamp, ...missingTimestamp];
}

/**
 * Fetches latest episodes directly from provider with pagination, adult content filtering, and normalization.
 */
export async function fetchLatestEpisodesFeed(
  page = 1,
  perPage = 24,
  filter: EpisodeAudioFilter = 'sub'
): Promise<LatestEpisodesResult> {
  const safePage = Math.max(1, page);

  try {
    const res = await fetch(`${BASE_URL}/recent-anime?page=${safePage}&per_page=${perPage}`, {
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      throw new Error(`Provider returned HTTP ${res.status}`);
    }

    const data = await res.json();
    const rawRows: RawProviderAnime[] = data?.data || [];
    const total = Number(data?.pagination?.total) || rawRows.length;
    const totalPages = Number(data?.pagination?.total_pages) || Math.ceil(total / perPage) || 1;

    // 1. Filter out prohibited adult/hentai content
    const safeRows = rawRows.filter((r) => !isProhibitedContent(r));

    // 2. Filter for SUB if filter === 'sub' (DUB-only updates excluded)
    const filteredRows = filter === 'sub'
      ? safeRows.filter((r) => Number(r.is_sub) > 0)
      : filter === 'dub'
      ? safeRows.filter((r) => Number(r.is_dub) > 0)
      : safeRows;

    // 3. Normalize raw entries
    const normalized = filteredRows.map((r) => normalizeProviderRecord(r));

    // 4. Deduplicate any mirror records
    const deduplicated = deduplicateAnimeRecords(normalized);

    // 5. Apply strict availability timestamp sorting
    const sorted = sortLatestEpisodes(deduplicated, filter);

    return {
      items: sorted,
      total,
      totalPages,
      currentPage: Math.min(safePage, totalPages),
      hasMore: safePage < totalPages && rawRows.length > 0,
    };
  } catch (err) {
    console.error('[LatestEpisodes] Fetch error:', err);
    return {
      items: [],
      total: 0,
      totalPages: 1,
      currentPage: safePage,
      hasMore: false,
    };
  }
}
