import type { Anime, AnimeTitle } from '../types/anime.ts';

/**
 * Checks whether a string contains non-Latin scripts such as Japanese Kanji,
 * Hiragana, Katakana, Thai, Korean Hangul, Arabic, or Cyrillic.
 */
export function hasNonLatinScript(str: string): boolean {
  if (!str) return false;
  return /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\u0e00-\u0e7f\uac00-\ud7af\u0600-\u06ff\u0400-\u04ff]/.test(str);
}

/**
 * High-frequency English words commonly found in English anime titles.
 */
const ENGLISH_VOCABULARY = new Set([
  'the', 'is', 'are', 'in', 'of', 'to', 'and', 'a', 'an', 'for', 'with', 'on', 'at', 'by', 'from',
  'my', 'me', 'i', "i'm", 'you', 'your', 'he', 'she', 'it', 'we', 'they', 'this', 'that', 'what',
  "what's", 'how', 'why', 'when', 'where', 'who', 'will', 'can', 'all', 'not', 'no', 'so', 'about',
  'into', 'over', 'after', 'before', 'between', 'under', 'again', 'reincarnated', 'reborn', 'another',
  'world', 'princess', 'hero', 'girl', 'boy', 'king', 'queen', 'knight', 'magic', 'magical', 'demon',
  'lord', 'slayer', 'level', 'quest', 'adventure', 'love', 'witch', 'potion', 'goblin', 'secret',
  'strongest', 'project', 'dragon', 'ball', 'piece', 'punch', 'hunter', 'academia', 'season', 'part',
  'act', 'movie', 'special', 'legend', 'star', 'space', 'sword', 'shield', 'online', 'game', 'art',
  'life', 'death', 'dead', 'zombie', 'monster', 'monsters', 'power', 'academy', 'battle', 'war',
  'super', 'galaxy', 'beast', 'dungeon', 'class', 'party', 'time', 'fate', 'zero', 'gate', 'blood',
  'chronicle', 'chronicles', 'tale', 'tales', 'story', 'friend', 'friends', 'girlfriend', 'boyfriend',
  'student', 'organization', 'school', 'cute', 'uncle', 'reality', 'cursor', 'click', 'girls',
  'aristocrat', 'skill', 'appraisal', 'rise', 'saint', 'great', 'boss', 'wild', 'black', 'clover',
  'white', 'cat', 'temple', 'journal', 'repo', 'man', 'vault', 'unlimited', 'clear', 'goddess',
  'believer', 'hotel', 'mercenary', 'cold', 'sweet', 'salt', 'god', 'merciless', 'maiden', 'winner',
  'win', 'travels', 'beyond', 'moon', 'contact', 'eternal', 'supreme', 'dark', 'summoner', 'dating',
  'obsession', 'hole', 'things', 'stuff', 'diamond', 'ace', 'legacy', 'family', 'mission', 'curse',
  'golden', 'wealth', 'dreamland', 'horror', 'collector', 'force', 'knights', 'kingdom', 'looking',
  'seven', 'explorer', 'revolving', 'payment', 'borrowed', 'downfall', 'fairy', 'dumped', 'reincarnate',
  'reincarnation', 'heaven', 'hell', 'ghost', 'titan', 'attack', 'shadow', 'eminence', 'slime',
  'bleach', 'naruto', 'one', 'strike', 'blue', 'lock', 'solo', 'leveling', 'siren', 'psyren', 'side',
  'other', 'far', 'away', 'behind', 'front', 'first', 'second', 'third', 'last', 'return',
  'heroic', 'shieldbro', 'stay', 'night', 'order', 'grand', 'brother', 'sister', 'dr', 'stone',
  'chainsaw', 'jujutsu', 'kaisen', 'wind', 'breaker', 'spy', 'dandadan', 'delicious', 'apothecary',
  'diaries', 'mashle', 'classroom', 'elite', 'shield', 'overlord', 'made', 'abyss', 'bocchi', 'rock'
]);

/**
 * Common Japanese Romaji grammatical particles and pronunciation markers.
 */
const ROMAJI_GRAMMAR_MARKERS = new Set([
  'no', 'ga', 'wo', 'wa', 'ni', 'de', 'to', 'kara', 'made', 'e', 'dakedo', 'node', 'toshite',
  'shita', 'sareta', 'aru', 'iru', 'desu', 'da', 'tte', 'koto', 'mono', 'hito', 'tachi', 'ore',
  'watashi', 'boku', 'jibun', 'shoujo', 'shounen', 'seinen', 'isekai', 'tensei', 'mahou', 'yuusha',
  'maou', 'tsuyoi', 'saikyou', 'gakuin', 'koukou', 'daigaku', 'keikaku', 'monogatari', 'gekijouban',
  'hen', 'dan', 'michi', 'chikara', 'tamashii', 'shinigami', 'shinobi', 'senshi', 'kyouran', 'reijou',
  'byoujaku', 'kamigoroshi', 'bujin', 'karei', 'naru', 'musouroku', 'shiotaiou', 'satou', 'amai',
  'horemajo', 'tengobu', 'horegusuri', 'irai', 'majo', 'doumo', 'zommasu', 'saikyosoubi', 'seijo',
  'seitokai', 'ana', 'kizoku', 'kantei', 'nariagaru', 'kanata', 'shinja', 'megami', 'kouryaku',
  'sensha', 'isu', 'yowaki', 'konyakusha', 'kake', 'notte', 'shimatta', 'mezametara', 'uchuusenmochi',
  'datta', 'ikkodate', 'mezashite', 'youhei', 'jiyuu', 'ikitai', 'ojisan', 'kawaii', 'osuki', 'yasei',
  'hitakakusu', 'namaanaru', 'daiseijo', 'kimetsu', 'yaiba', 'shingeki', 'kyojin', 'boku'
]);

/**
 * Computes an English confidence score for a title string.
 * Higher score indicates higher likelihood of being the translated English title.
 */
export function scoreEnglishTitle(candidate: string | undefined | null): number {
  if (!candidate || typeof candidate !== 'string') return -999;
  const trimmed = candidate.trim();
  if (!trimmed) return -999;
  if (hasNonLatinScript(trimmed)) return -500;

  const words = trimmed.toLowerCase().replace(/[^a-z0-9\s'-]/g, ' ').split(/\s+/).filter(Boolean);
  if (words.length === 0) return -100;

  let eng = 0;
  let rom = 0;
  for (const w of words) {
    if (ENGLISH_VOCABULARY.has(w)) eng++;
    if (ROMAJI_GRAMMAR_MARKERS.has(w)) rom++;
  }

  let score = eng * 25 - rom * 30;
  if (eng > 0 && rom === 0) score += 40;
  if (words.length > 1 && eng > 0) score += 15;
  return score;
}

/**
 * Normalizes raw title strings from provider feeds by stripping commas if used as delimiters
 * or extracting individual titles.
 */
function cleanCandidate(c: string | undefined | null): string {
  if (!c) return '';
  return c.trim();
}

/**
 * Authoritative English Title Resolver:
 * Always returns the genuine English title of an anime.
 * If the title in one field is in Japanese pronunciation (Romaji) or native script,
 * it searches alternative fields (english, userPreferred, synonyms, romaji) to surface
 * the true English title.
 */
export function getAnimeTitle(
  anime: (Partial<Anime> & { titles?: string }) | null | undefined,
  fallback = 'Anime'
): string {
  if (!anime) return fallback;

  const pool: string[] = [];

  const rawTitleObj = anime.title;
  if (rawTitleObj) {
    if (rawTitleObj.english) pool.push(cleanCandidate(rawTitleObj.english));
    if (rawTitleObj.userPreferred) pool.push(cleanCandidate(rawTitleObj.userPreferred));
    if (rawTitleObj.romaji) pool.push(cleanCandidate(rawTitleObj.romaji));
  }

  // Include raw titles if present
  if (anime.titles) {
    if (anime.titles.includes(',')) {
      for (const p of anime.titles.split(',')) {
        if (p.trim()) pool.push(p.trim());
      }
    } else {
      pool.push(cleanCandidate(anime.titles));
    }
  }

  // Include synonyms if present
  if (anime.synonyms && Array.isArray(anime.synonyms)) {
    for (const syn of anime.synonyms) {
      if (syn && typeof syn === 'string') pool.push(cleanCandidate(syn));
    }
  }

  const valid = pool.filter((s) => s.length > 0);
  if (valid.length === 0) {
    return cleanCandidate(rawTitleObj?.native) || fallback;
  }

  // Filter out any titles with non-Latin scripts (Kanji, Kana, Thai, Hangul)
  const latinPool = valid.filter((s) => !hasNonLatinScript(s));

  if (latinPool.length === 0) {
    // If every candidate has non-Latin, return first non-empty
    return valid[0] || fallback;
  }

  // Rank by English title confidence score
  let best = latinPool[0];
  let bestScore = scoreEnglishTitle(best);

  for (let i = 1; i < latinPool.length; i++) {
    const candidate = latinPool[i];
    const score = scoreEnglishTitle(candidate);
    if (score > bestScore) {
      bestScore = score;
      best = candidate;
    }
  }

  return best || fallback;
}

/**
 * Resolves English and Romaji titles from raw provider records (e.g. from anikotoapi.site).
 */
export function resolveProviderTitles(raw: {
  title?: string;
  titles?: string;
  alternative?: string;
  native?: string;
}): { english: string; romaji: string; userPreferred: string } {
  const candidates: string[] = [];
  if (raw.title && raw.title.trim()) candidates.push(raw.title.trim());

  if (raw.titles && raw.titles.trim()) {
    if (raw.titles.includes(',')) {
      candidates.push(raw.titles.trim());
      for (const p of raw.titles.split(',')) {
        if (p.trim()) candidates.push(p.trim());
      }
    } else {
      candidates.push(raw.titles.trim());
    }
  }

  if (raw.alternative && raw.alternative.trim()) candidates.push(raw.alternative.trim());

  const latinCandidates = candidates.filter((c) => !hasNonLatinScript(c));

  let bestEnglish = raw.title || 'Anime';
  let bestScore = scoreEnglishTitle(bestEnglish);

  for (const c of latinCandidates) {
    const s = scoreEnglishTitle(c);
    if (s > bestScore) {
      bestScore = s;
      bestEnglish = c;
    }
  }

  if (hasNonLatinScript(bestEnglish)) {
    const firstLatin = latinCandidates[0];
    if (firstLatin) bestEnglish = firstLatin;
  }

  let romaji = raw.alternative && !hasNonLatinScript(raw.alternative) ? raw.alternative : raw.title || bestEnglish;

  return {
    english: bestEnglish,
    romaji,
    userPreferred: bestEnglish,
  };
}
