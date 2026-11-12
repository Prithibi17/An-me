import type { Anime } from '../types/anime.ts';
import { searchAnime, getTrendingAnime, getPopularSeasonAnime } from './anilist.ts';
import { enrichAnimeAvailability } from './availability.ts';

// ---------------------------------------------------------------------------
// 1. Centralized Adult Content Filter
// ---------------------------------------------------------------------------
const PROHIBITED_GENRES = new Set(['hentai', 'erotica', 'rx', 'r18+']);

export function isAdultAnime(anime: Anime): boolean {
  if (anime.isAdult === true) return true;
  if (!anime.genres || !Array.isArray(anime.genres)) return false;
  return anime.genres.some((g) => PROHIBITED_GENRES.has(g.trim().toLowerCase()));
}

export function filterAdultAnime(list: Anime[]): Anime[] {
  return list.filter((a) => !isAdultAnime(a));
}

// ---------------------------------------------------------------------------
// 2. Query Normalization
// ---------------------------------------------------------------------------
/**
 * Normalizes text for forgiving, punctuation-tolerant, and case-insensitive matching.
 * Preserves CJK characters (Hiragana, Katakana, Kanji) while stripping diacritics
 * from Latin characters and unifying separators.
 */
export function normalizeText(input: string): string {
  if (!input) return '';
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Strip Latin accents/diacritics (e.g. Pokémon -> Pokemon)
    .toLowerCase()
    .replace(/[;:\-_/\\|~`!@#$%^&*()_+=[\]{}<>,.?]/g, ' ') // Separators and punctuation become space
    .replace(/['"’‘]/g, '') // Quotes stripped cleanly (e.g. what's -> whats)
    .replace(/\s+/g, ' ')
    .trim();
}

export function tokenize(input: string): string[] {
  const norm = normalizeText(input);
  return norm ? norm.split(' ').filter(Boolean) : [];
}

// ---------------------------------------------------------------------------
// 3. Known Abbreviations & Franchises Dictionary
// ---------------------------------------------------------------------------
export const KNOWN_ABBREVIATIONS: Record<string, string[]> = {
  dbz: ['Dragon Ball Z', 'Dragon Ball'],
  db: ['Dragon Ball'],
  dbs: ['Dragon Ball Super'],
  dbgt: ['Dragon Ball GT'],
  aot: ['Attack on Titan', 'Shingeki no Kyojin'],
  snk: ['Shingeki no Kyojin', 'Attack on Titan'],
  mha: ['My Hero Academia', 'Boku no Hero Academia'],
  bnha: ['Boku no Hero Academia', 'My Hero Academia'],
  opm: ['One Punch Man'],
  fma: ['Fullmetal Alchemist'],
  fmab: ['Fullmetal Alchemist Brotherhood', 'Fullmetal Alchemist'],
  sao: ['Sword Art Online'],
  jjk: ['Jujutsu Kaisen'],
  csm: ['Chainsaw Man'],
  ds: ['Demon Slayer', 'Kimetsu no Yaiba'],
  kny: ['Kimetsu no Yaiba', 'Demon Slayer'],
  hxh: ['Hunter x Hunter'],
  eva: ['Neon Genesis Evangelion', 'Evangelion'],
  nge: ['Neon Genesis Evangelion'],
  cge: ['Code Geass'],
  op: ['One Piece'],
  slime: ['That Time I Got Reincarnated as a Slime', 'Tensei shitara Slime Datta Ken'],
  danmachi: ['Is It Wrong to Try to Pick Up Girls in a Dungeon', 'Dungeon ni Deai wo Motomeru no wa Machigatteiru Darou ka'],
  oregairu: ['My Teen Romantic Comedy SNAFU', 'Yahari Ore no Seishun Love Come wa Machigatteiru'],
  konosuba: ['KonoSuba God Blessing on This Wonderful World', 'Kono Subarashii Sekai ni Shukufuku wo'],
  kaguya: ['Kaguya-sama Love Is War', 'Kaguya-sama wa Kokurasetai'],
  bocchi: ['Bocchi the Rock'],
  conan: ['Detective Conan', 'Case Closed'],
  fate: ['Fate stay night', 'Fate Zero'],
  bleach: ['Bleach', 'Bleach Thousand-Year Blood War'],
  naruto: ['Naruto', 'Naruto Shippuden'],
  nar: ['Naruto', 'Naruto Shippuden'],
};

// ---------------------------------------------------------------------------
// 4. Typo-Tolerant Vocabulary & Damerau-Levenshtein Distance
// ---------------------------------------------------------------------------
export function damerauLevenshtein(a: string, b: string): number {
  const al = a.length;
  const bl = b.length;
  if (al === 0) return bl;
  if (bl === 0) return al;

  const matrix: number[][] = Array.from({ length: al + 1 }, () => Array(bl + 1).fill(0));

  for (let i = 0; i <= al; i++) matrix[i][0] = i;
  for (let j = 0; j <= bl; j++) matrix[0][j] = j;

  for (let i = 1; i <= al; i++) {
    for (let j = 1; j <= bl; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );

      // Transposition
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        matrix[i][j] = Math.min(matrix[i][j], matrix[i - 2][j - 2] + cost);
      }
    }
  }

  return matrix[al][bl];
}

const COMMON_FRANCHISES = [
  'naruto',
  'naruto shippuden',
  'one piece',
  'one punch man',
  'dragon ball',
  'dragon ball z',
  'dragon ball super',
  'attack on titan',
  'shingeki no kyojin',
  'jujutsu kaisen',
  'demon slayer',
  'kimetsu no yaiba',
  'bleach',
  'death note',
  'fullmetal alchemist',
  'hunter x hunter',
  'chainsaw man',
  'my hero academia',
  'sword art online',
  'tokyo ghoul',
  'steins gate',
  'cowboy bebop',
  'neon genesis evangelion',
  'mob psycho 100',
  'vinland saga',
  'black clover',
  'frieren',
  'solo leveling',
  'cyberpunk edgerunners',
  'spy x family',
  'detective conan',
  'haikyuu',
  'overlord',
  'mushoku tensei',
  'blue lock',
];

export interface TypoResolution {
  corrected: string;
  isCorrected: boolean;
  confidence: number;
}

export function resolveTypo(query: string): TypoResolution {
  const norm = normalizeText(query);
  if (!norm || norm.length < 4) {
    return { corrected: query, isCorrected: false, confidence: 0 };
  }

  // Exact match with known title doesn't need typo correction
  if (COMMON_FRANCHISES.includes(norm)) {
    return { corrected: query, isCorrected: false, confidence: 1 };
  }

  // Check against common franchises
  let bestMatch = '';
  let minDistance = Infinity;

  for (const franchise of COMMON_FRANCHISES) {
    // Check full franchise
    const dist = damerauLevenshtein(norm, franchise);
    if (dist < minDistance) {
      minDistance = dist;
      bestMatch = franchise;
    }

    // Check individual words if multi-word query (e.g. "atack on titan" -> "attack on titan")
    const queryTokens = tokenize(norm);
    const franchiseTokens = tokenize(franchise);

    if (queryTokens.length === franchiseTokens.length && queryTokens.length > 1) {
      let tokenDist = 0;
      for (let i = 0; i < queryTokens.length; i++) {
        tokenDist += damerauLevenshtein(queryTokens[i], franchiseTokens[i]);
      }
      if (tokenDist < minDistance) {
        minDistance = tokenDist;
        bestMatch = franchise;
      }
    }
  }

  // Allowed error threshold based on query length:
  // length 4-6: max 1 edit
  // length 7+: max 2 edits
  const maxAllowedDist = norm.length <= 6 ? 1 : 2;

  if (minDistance <= maxAllowedDist && bestMatch && bestMatch !== norm) {
    return {
      corrected: bestMatch,
      isCorrected: true,
      confidence: 1 - minDistance / Math.max(norm.length, bestMatch.length),
    };
  }

  return { corrected: query, isCorrected: false, confidence: 0 };
}

// ---------------------------------------------------------------------------
// 5. Weighted Search Ranking
// ---------------------------------------------------------------------------
export function getAllAnimeTitles(anime: Anime): string[] {
  const titles = new Set<string>();
  if (anime.title.english) titles.add(anime.title.english);
  if (anime.title.romaji) titles.add(anime.title.romaji);
  if (anime.title.native) titles.add(anime.title.native);
  if (anime.title.userPreferred) titles.add(anime.title.userPreferred);
  if (Array.isArray(anime.synonyms)) {
    for (const syn of anime.synonyms) {
      if (syn) titles.add(syn);
    }
  }
  return Array.from(titles);
}

/**
 * Computes a deterministic relevance score for an anime against a query.
 *
 * Scoring weights:
 * - Exact primary canonical title: 100
 * - Exact alternative / synonym: 95
 * - Primary title prefix: 85
 * - Alternative title prefix: 80
 * - Word-prefix match: 75
 * - Abbreviation match: 70
 * - Partial substring match: 60
 * - High-confidence fuzzy match: 45
 * - Secondary tie-breakers: popularity bonus (max 3), score bonus (max 2)
 */
export function scoreAnimeMatch(anime: Anime, query: string): number {
  const normQuery = normalizeText(query);
  if (!normQuery) return 0;

  const canonicalTitles = [
    anime.title.english,
    anime.title.romaji,
    anime.title.userPreferred,
    anime.title.native,
  ].filter(Boolean) as string[];

  const synonyms = (anime.synonyms || []).filter(Boolean);

  let bestBaseScore = 0;

  // 1. Check Exact Canonical Matches (100)
  for (const t of canonicalTitles) {
    const norm = normalizeText(t);
    if (norm === normQuery) {
      bestBaseScore = Math.max(bestBaseScore, 100);
      break;
    }
  }

  // 2. Check Exact Synonym / Alternative Matches (95)
  if (bestBaseScore < 95) {
    for (const s of synonyms) {
      const norm = normalizeText(s);
      if (norm === normQuery) {
        bestBaseScore = Math.max(bestBaseScore, 95);
        break;
      }
    }
  }

  // 3. Known abbreviation expansion check (70)
  if (bestBaseScore < 70 && KNOWN_ABBREVIATIONS[normQuery]) {
    const targets = KNOWN_ABBREVIATIONS[normQuery].map(normalizeText);
    for (const t of [...canonicalTitles, ...synonyms]) {
      const norm = normalizeText(t);
      if (targets.some((target) => norm === target || norm.startsWith(target))) {
        bestBaseScore = Math.max(bestBaseScore, 70);
        break;
      }
    }
  }

  // 4. Primary Title Starts-With (Prefix) (85)
  if (bestBaseScore < 85) {
    for (const t of canonicalTitles) {
      const norm = normalizeText(t);
      if (norm.startsWith(normQuery)) {
        bestBaseScore = Math.max(bestBaseScore, 85);
        break;
      }
    }
  }

  // 5. Alternative Title Starts-With (Prefix) (80)
  if (bestBaseScore < 80) {
    for (const s of synonyms) {
      const norm = normalizeText(s);
      if (norm.startsWith(normQuery)) {
        bestBaseScore = Math.max(bestBaseScore, 80);
        break;
      }
    }
  }

  // 6. Word-Prefix Match (75) (e.g. query "titan" matches "Attack on Titan")
  if (bestBaseScore < 75) {
    const queryTokens = tokenize(normQuery);
    for (const t of [...canonicalTitles, ...synonyms]) {
      const titleTokens = tokenize(t);
      const allTokensMatchPrefix = queryTokens.every((qToken) =>
        titleTokens.some((tToken) => tToken.startsWith(qToken))
      );
      if (allTokensMatchPrefix) {
        bestBaseScore = Math.max(bestBaseScore, 75);
        break;
      }
    }
  }

  // 7. Partial Substring Match (60)
  if (bestBaseScore < 60) {
    for (const t of [...canonicalTitles, ...synonyms]) {
      const norm = normalizeText(t);
      if (norm.includes(normQuery)) {
        bestBaseScore = Math.max(bestBaseScore, 60);
        break;
      }
    }
  }

  // 8. Typo / Fuzzy match (45) - only allowed for queries of length >= 4
  if (bestBaseScore < 45 && normQuery.length >= 4) {
    for (const t of canonicalTitles) {
      const norm = normalizeText(t);
      const dist = damerauLevenshtein(normQuery, norm);
      if (dist <= 2) {
        bestBaseScore = Math.max(bestBaseScore, 45);
        break;
      }
      // Check first words
      const tFirst = tokenize(norm)[0];
      if (tFirst && damerauLevenshtein(normQuery, tFirst) <= 1) {
        bestBaseScore = Math.max(bestBaseScore, 45);
        break;
      }
    }
  }

  if (bestBaseScore === 0) {
    return 0;
  }

  // Secondary tie-breakers (Never let popularity override a higher match tier)
  const popularityBonus = Math.min(3, ((anime.popularity || 0) / 100000) * 3);
  const scoreBonus = Math.min(2, ((anime.averageScore || 0) / 100) * 2);

  return bestBaseScore + popularityBonus + scoreBonus;
}

// ---------------------------------------------------------------------------
// 6. Query Caching
// ---------------------------------------------------------------------------
interface SearchCacheEntry {
  timestamp: number;
  results: Anime[];
  totalMatches: number;
  correctedQuery?: string;
}

const searchMemoryCache = new Map<string, SearchCacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export function clearSearchCache(): void {
  searchMemoryCache.clear();
}

// ---------------------------------------------------------------------------
// 7. Intelligent Search Orchestration
// ---------------------------------------------------------------------------
export interface SearchExecutionOptions {
  query?: string;
  genre?: string;
  genres?: string[];
  year?: number;
  season?: string;
  format?: string;
  formats?: string[];
  status?: string;
  country?: string;
  audio?: 'all' | 'sub' | 'dub';
  minScore?: number;
  sort?: string;
  page?: number;
  perPage?: number;
  signal?: AbortSignal;
}

export interface SearchExecutionResult {
  items: Anime[];
  total: number;
  page: number;
  hasMore: boolean;
  correctedQuery?: string;
  isTypoCorrected: boolean;
  relatedFallback: boolean;
  relatedItems?: Anime[];
}

/**
 * Main intelligent search engine entrypoint.
 * Debounced, cancellable, typo-tolerant, ranked, and adult-filtered.
 */
export async function executeIntelligentSearch(
  options: SearchExecutionOptions
): Promise<SearchExecutionResult> {
  const {
    query = '',
    genre,
    genres,
    year,
    season,
    format,
    formats,
    status,
    country,
    audio = 'all',
    minScore,
    sort,
    page = 1,
    perPage = 24,
    signal,
  } = options;

  const rawQuery = query.trim();
  const normalized = normalizeText(rawQuery);

  // If no search query, perform standard catalogue filter search
  if (!normalized) {
    const data = await searchAnime({
      genre: genre !== 'All' ? genre : undefined,
      genres,
      season: season !== 'All' ? season : undefined,
      format: format !== 'All' ? format : undefined,
      formats,
      status: status !== 'All' ? status : undefined,
      country: country !== 'All' ? country : undefined,
      minScore,
      sort: sort || 'POPULARITY_DESC',
      year,
      page,
      perPage,
    });
    const filtered = filterAdultAnime(data);
    let enriched = await enrichAnimeAvailability(filtered);
    if (audio === 'sub') {
      enriched = enriched.filter((a) => (a.subEpisodeCount || 0) > 0);
    } else if (audio === 'dub') {
      enriched = enriched.filter((a) => (a.dubEpisodeCount || 0) > 0);
    }
    return {
      items: enriched,
      total: enriched.length,
      page,
      hasMore: enriched.length >= perPage,
      isTypoCorrected: false,
      relatedFallback: false,
    };
  }

  // Check cache for page 1
  const cacheKey = `${normalized}::${genre || ''}::${format || ''}::${year || ''}::${page}::${perPage}`;
  const cached = searchMemoryCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return {
      items: cached.results,
      total: cached.totalMatches,
      page,
      hasMore: cached.results.length >= perPage,
      correctedQuery: cached.correctedQuery,
      isTypoCorrected: Boolean(cached.correctedQuery),
      relatedFallback: false,
    };
  }

  if (signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }

  // 1. Check for abbreviation expansion
  let primarySearchTerm = rawQuery;
  if (KNOWN_ABBREVIATIONS[normalized]) {
    // If the abbreviation is e.g. "dbz", search for the full canonical franchise name directly
    primarySearchTerm = KNOWN_ABBREVIATIONS[normalized][0];
  }

  // 2. Check for typo resolution
  const typoInfo = resolveTypo(rawQuery);
  let correctedSearchTerm: string | undefined;
  if (typoInfo.isCorrected) {
    correctedSearchTerm = typoInfo.corrected;
  }

  // 3. Execute query with primary term
  let rawList: Anime[] = [];
  try {
    rawList = await searchAnime({
      search: primarySearchTerm,
      genre: genre !== 'All' ? genre : undefined,
      genres,
      season: season !== 'All' ? season : undefined,
      format: format !== 'All' ? format : undefined,
      formats,
      status: status !== 'All' ? status : undefined,
      country: country !== 'All' ? country : undefined,
      minScore,
      sort: sort || (primarySearchTerm.length <= 3 ? 'POPULARITY_DESC' : 'SEARCH_MATCH'),
      year,
      page,
      perPage: Math.max(perPage, 20),
    });
  } catch (err) {
    console.warn('[searchEngine] Primary query warning:', err);
  }

  if (signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }

  // 4. If primary query returned nothing and typo was detected, query with corrected term!
  let isTypoApplied = false;
  if (rawList.length === 0 && correctedSearchTerm) {
    try {
      rawList = await searchAnime({
        search: correctedSearchTerm,
        genre: genre !== 'All' ? genre : undefined,
        genres,
        season: season !== 'All' ? season : undefined,
        format: format !== 'All' ? format : undefined,
        formats,
        status: status !== 'All' ? status : undefined,
        country: country !== 'All' ? country : undefined,
        minScore,
        sort: 'POPULARITY_DESC',
        year,
        page,
        perPage: Math.max(perPage, 20),
      });
      if (rawList.length > 0) {
        isTypoApplied = true;
      }
    } catch (err) {
      console.warn('[searchEngine] Typo correction query warning:', err);
    }
  }

  // 5. Filter adult content completely
  let filtered = filterAdultAnime(rawList);

  // 6. Deduplicate by canonical ID
  const seenIds = new Set<number>();
  const uniqueList: Anime[] = [];
  for (const item of filtered) {
    if (!seenIds.has(item.id)) {
      seenIds.add(item.id);
      uniqueList.push(item);
    }
  }

  // 7. Score and Rank Results by Weighted Relevance
  const effectiveQueryForScoring = isTypoApplied && correctedSearchTerm ? correctedSearchTerm : rawQuery;
  const scoredItems = uniqueList.map((anime) => ({
    anime,
    score: scoreAnimeMatch(anime, effectiveQueryForScoring),
  }));

  // Sort descending by relevance score
  scoredItems.sort((a, b) => b.score - a.score);

  // If results exist but all scored 0 (e.g. vague fuzzy results), keep them at bottom
  let sortedAnime = scoredItems.map((s) => s.anime);

  // Enrich with SUB availability
  let enrichedItems = await enrichAnimeAvailability(sortedAnime.slice(0, perPage));
  if (audio === 'sub') {
    enrichedItems = enrichedItems.filter((a) => (a.subEpisodeCount || 0) > 0);
  } else if (audio === 'dub') {
    enrichedItems = enrichedItems.filter((a) => (a.dubEpisodeCount || 0) > 0);
  }

  // 8. If 0 matching results exist, retrieve verified recommendations as a graceful fallback
  let relatedFallback = false;
  let relatedItems: Anime[] = [];

  if (enrichedItems.length === 0 && page === 1) {
    try {
      const fallbackList = await getTrendingAnime(1, 12);
      relatedItems = filterAdultAnime(fallbackList);
      relatedFallback = true;
    } catch {
      // Ignore fallback error
    }
  }

  const result: SearchExecutionResult = {
    items: enrichedItems,
    total: enrichedItems.length,
    page,
    hasMore: enrichedItems.length >= perPage,
    correctedQuery: isTypoApplied ? correctedSearchTerm : undefined,
    isTypoCorrected: isTypoApplied,
    relatedFallback,
    relatedItems,
  };

  // Cache page 1 results
  if (page === 1 && enrichedItems.length > 0) {
    searchMemoryCache.set(cacheKey, {
      timestamp: Date.now(),
      results: enrichedItems,
      totalMatches: enrichedItems.length,
      correctedQuery: result.correctedQuery,
    });
  }

  return result;
}
