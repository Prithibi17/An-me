import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseAvailabilityTimestamp,
  formatRelativeTime,
  normalizeProviderRecord,
  deduplicateAnimeRecords,
  sortLatestEpisodes,
  isProhibitedContent,
  isEligibleLatestRelease,
  mergeLatestEpisodesBatches,
} from '../src/services/latestEpisodes.ts';

describe('An:me — Latest Episodes Feed Deterministic Test Suite', () => {

  // 1. Newer availability timestamps sorting first
  it('1. Newer availability timestamps sorting first (irrespective of premiere date, score, or popularity)', () => {
    const olderAvailability = {
      id: 101,
      title: { english: 'Show A' },
      coverImage: {},
      genres: [],
      latestEpisodeTimestamp: 1700000000000, // Older availability
      seasonYear: 2026,
      averageScore: 95,
      subEpisodeCount: 12,
    };
    const newerAvailability = {
      id: 102,
      title: { english: 'Show B' },
      coverImage: {},
      genres: [],
      latestEpisodeTimestamp: 1700050000000, // Newer availability
      seasonYear: 2010,
      averageScore: 60,
      subEpisodeCount: 1,
    };

    const sorted = sortLatestEpisodes([olderAvailability, newerAvailability], 'sub');
    assert.equal(sorted[0].id, 102, 'Newer availability timestamp must sort to index 0');
    assert.equal(sorted[1].id, 101, 'Older availability timestamp must sort to index 1');
  });

  // 2. Older anime returning to the top when newly updated
  it('2. Older anime returning to the top when newly updated with a new episode', () => {
    const classicAnime = {
      id: 50,
      title: { english: 'One Piece (1999)' },
      coverImage: {},
      genres: [],
      seasonYear: 1999,
      latestEpisodeTimestamp: 1730000000000, // Updated 1 hour ago
      subEpisodeCount: 1120,
    };
    const modernAnime = {
      id: 99,
      title: { english: 'Brand New 2026 Show' },
      coverImage: {},
      genres: [],
      seasonYear: 2026,
      latestEpisodeTimestamp: 1729000000000, // Updated yesterday
      subEpisodeCount: 4,
    };

    const sorted = sortLatestEpisodes([modernAnime, classicAnime], 'sub');
    assert.equal(sorted[0].id, 50, 'Classic 1999 anime with recent episode update must jump to #1');
  });

  // 3. Duplicate episode mirrors being removed
  it('3. Duplicate episode mirrors being removed and merged into one canonical card', () => {
    const mirrorServer1 = {
      id: 200,
      title: { english: 'Attack on Titan' },
      coverImage: { large: 'https://cdn.example.com/poster1.jpg' },
      genres: ['Action'],
      latestEpisodeNumber: 5,
      subEpisodeCount: 5,
      dubEpisodeCount: 3,
      latestEpisodeTimestamp: 1700000000000,
    };
    const mirrorServer2 = {
      id: 200,
      title: { english: 'Attack on Titan' },
      coverImage: { large: 'https://cdn.example.com/poster1.jpg' },
      genres: ['Action'],
      latestEpisodeNumber: 6,
      subEpisodeCount: 6,
      dubEpisodeCount: 4,
      latestEpisodeTimestamp: 1700010000000, // Newer mirror
    };
    const anotherShow = {
      id: 201,
      title: { english: 'Other Show' },
      coverImage: {},
      genres: [],
      latestEpisodeNumber: 1,
      subEpisodeCount: 1,
      dubEpisodeCount: 0,
      latestEpisodeTimestamp: 1700000000000,
    };

    const deduplicated = deduplicateAnimeRecords([mirrorServer1, mirrorServer2, anotherShow]);
    assert.equal(deduplicated.length, 2, 'Should combine duplicate mirrors for id 200');

    const merged200 = deduplicated.find((a) => a.id === 200);
    assert.ok(merged200, 'Merged anime exists');
    assert.equal(merged200.subEpisodeCount, 6, 'Merged sub episode count should be the maximum available');
    assert.equal(merged200.dubEpisodeCount, 4, 'Merged dub episode count should be the maximum available');
    assert.equal(merged200.latestEpisodeTimestamp, 1700010000000, 'Merged timestamp should be newest');
  });

  // 4. SUB/DUB updates being handled correctly
  it('4. SUB/DUB updates being handled correctly and filtered properly', () => {
    const subOnly = {
      id: 301,
      title: { english: 'Sub Only Anime' },
      coverImage: {},
      genres: [],
      subEpisodeCount: 12,
      dubEpisodeCount: 0,
      latestEpisodeTimestamp: 1700000000000,
    };
    const dubOnly = {
      id: 302,
      title: { english: 'Dub Only Anime' },
      coverImage: {},
      genres: [],
      subEpisodeCount: 0,
      dubEpisodeCount: 8,
      latestEpisodeTimestamp: 1700000000000,
    };
    const both = {
      id: 303,
      title: { english: 'Both Sub and Dub Anime' },
      coverImage: {},
      genres: [],
      subEpisodeCount: 12,
      dubEpisodeCount: 12,
      latestEpisodeTimestamp: 1700000000000,
    };

    const list = [subOnly, dubOnly, both];
    const subResults = sortLatestEpisodes(list, 'sub');
    const dubResults = sortLatestEpisodes(list, 'dub');

    assert.equal(subResults.length, 2, 'SUB filter should only include items with subEpisodeCount > 0');
    assert.ok(subResults.some((a) => a.id === 301));
    assert.ok(subResults.some((a) => a.id === 303));
    assert.ok(!subResults.some((a) => a.id === 302), 'DUB-only update must be excluded from SUB releases');

    assert.equal(dubResults.length, 2, 'DUB filter should only include items with dubEpisodeCount > 0');
    assert.ok(dubResults.some((a) => a.id === 302));
    assert.ok(dubResults.some((a) => a.id === 303));
    assert.ok(!dubResults.some((a) => a.id === 301));
  });

  // 5. Missing timestamp handling
  it('5. Missing timestamp handling (retains authoritative fallback group at bottom)', () => {
    const validTime1 = {
      id: 401,
      title: { english: 'Show with Time 1' },
      coverImage: {},
      genres: [],
      subEpisodeCount: 1,
      latestEpisodeTimestamp: 1700000000000,
    };
    const validTime2 = {
      id: 402,
      title: { english: 'Show with Time 2' },
      coverImage: {},
      genres: [],
      subEpisodeCount: 1,
      latestEpisodeTimestamp: 1700050000000,
    };
    const noTimeA = {
      id: 403,
      title: { english: 'No Time A' },
      coverImage: {},
      genres: [],
      subEpisodeCount: 1,
      latestEpisodeTimestamp: 0,
    };
    const noTimeB = {
      id: 404,
      title: { english: 'No Time B' },
      coverImage: {},
      genres: [],
      subEpisodeCount: 1,
      latestEpisodeTimestamp: 0,
    };

    const sorted = sortLatestEpisodes([noTimeA, validTime1, noTimeB, validTime2], 'sub');
    assert.equal(sorted[0].id, 402, 'Newest verified time at index 0');
    assert.equal(sorted[1].id, 401, 'Older verified time at index 1');
    assert.equal(sorted[2].id, 403, 'Fallback group preserves original provider order');
    assert.equal(sorted[3].id, 404, 'Fallback group preserves original provider order');
  });

  // 6. Pagination without duplicates or skipped records
  it('6. Pagination slices dataset without duplicates or skipped records', () => {
    const items = Array.from({ length: 48 }, (_, i) => ({
      id: i + 1,
      title: { english: `Anime ${i + 1}` },
      coverImage: {},
      genres: [],
      subEpisodeCount: 1,
      latestEpisodeTimestamp: 1700000000000 - i * 1000,
    }));

    const sorted = sortLatestEpisodes(items, 'sub');
    const perPage = 24;
    const page1 = sorted.slice(0, perPage);
    const page2 = sorted.slice(perPage, perPage * 2);

    assert.equal(page1.length, 24);
    assert.equal(page2.length, 24);

    const ids1 = new Set(page1.map((a) => a.id));
    const ids2 = new Set(page2.map((a) => a.id));

    // Zero overlap
    for (const id of ids1) {
      assert.ok(!ids2.has(id), `ID ${id} must not appear on both page 1 and page 2`);
    }
    // Full coverage
    assert.equal(ids1.size + ids2.size, 48, 'Combined pages must cover entire 48 records');
  });

  // 7. Progressive carousel batch merging
  it('7. Progressive carousel batch merging appends older records without duplicate keys', () => {
    const batch1 = [
      { id: 1, title: { english: 'Show 1' }, coverImage: {}, genres: [], subEpisodeCount: 1 },
      { id: 2, title: { english: 'Show 2' }, coverImage: {}, genres: [], subEpisodeCount: 1 },
    ];
    const batch2 = [
      { id: 2, title: { english: 'Show 2 duplicate' }, coverImage: {}, genres: [], subEpisodeCount: 1 },
      { id: 3, title: { english: 'Show 3 new' }, coverImage: {}, genres: [], subEpisodeCount: 1 },
    ];

    const merged = mergeLatestEpisodesBatches(batch1, batch2);
    assert.equal(merged.length, 3, 'Should append only unique items');
    assert.equal(merged[0].id, 1);
    assert.equal(merged[1].id, 2);
    assert.equal(merged[2].id, 3);
  });

  // 8. Empty provider results
  it('8. Empty provider results are handled gracefully without error', () => {
    const emptyNormalized = deduplicateAnimeRecords([]);
    const sorted = sortLatestEpisodes(emptyNormalized, 'sub');
    assert.deepEqual(sorted, [], 'Empty input produces empty array cleanly');
  });

  // 9. Temporary API failures / malformed timestamps
  it('9. Malformed timestamps fall back to 0 without throwing error', () => {
    assert.equal(parseAvailabilityTimestamp(''), 0);
    assert.equal(parseAvailabilityTimestamp('invalid-date'), 0);
    assert.equal(parseAvailabilityTimestamp(undefined), 0);
    assert.ok(parseAvailabilityTimestamp('2026-11-02 18:16:27') > 0);
  });

  // 10. Missing posters fallback
  it('10. Missing posters provide valid local fallback placeholder image', () => {
    const rawNoPoster = {
      id: 999,
      title: 'No Poster Show',
      poster: '',
    };
    const normalized = normalizeProviderRecord(rawNoPoster);
    assert.ok(normalized.coverImage.large, 'Cover image must never be undefined');
    assert.ok(normalized.coverImage.large.includes('svg'), 'Fallback SVG placeholder provided');
  });

  // 11. Relative update time formatting
  it('11. Relative update time formatting provides verified human readable intervals', () => {
    const now = 1700000000000;
    assert.equal(formatRelativeTime(now - 1000 * 30, now), 'Just now');
    assert.equal(formatRelativeTime(now - 1000 * 60 * 5, now), '5m ago');
    assert.equal(formatRelativeTime(now - 1000 * 60 * 60 * 2, now), '2h ago');
    assert.equal(formatRelativeTime(now - 1000 * 60 * 60 * 25, now), 'Yesterday');
    assert.equal(formatRelativeTime(now - 1000 * 60 * 60 * 24 * 3, now), '3d ago');
  });

  // 12. Differences between Latest Episodes, Recently Added, and Airing Schedule
  it('12. Distinguishes Latest Episodes availability from Airing Schedule countdown', () => {
    const rawAiringAnime = {
      id: 888,
      title: 'Airing Anime',
      next_air_ep: 5,
      is_sub: 5, // provider incorrectly labeled sub 5 before air
    };
    const normalized = normalizeProviderRecord(rawAiringAnime);
    assert.equal(normalized.subEpisodeCount, 4, 'Playable sub episode cannot equal or exceed next_air_ep');
  });

  // 13. Adult and Hentai prohibited content filtering
  it('13. Prohibited adult and hentai content is cleanly filtered out', () => {
    const hentai1 = { id: 1, title: 'Adult Show', rating: 'Rx - Hentai' };
    const hentai2 = { id: 2, title: 'Explicit Show', rating: 'R18+' };
    const erotica = { id: 3, title: 'Erotica Show', terms_by_type: { genre: ['Action', 'Erotica'] } };
    const cleanShow = { id: 4, title: 'Clean Show', rating: 'PG-13', terms_by_type: { genre: ['Action', 'Fantasy'] } };

    assert.equal(isProhibitedContent(hentai1), true);
    assert.equal(isProhibitedContent(hentai2), true);
    assert.equal(isProhibitedContent(erotica), true);
    assert.equal(isProhibitedContent(cleanShow), false);
  });

  // 14. Retro historical backfills filtered out while keeping genuine airing series
  it('14. Excludes completed 1980s retro movies/OVAs while keeping genuine releasing series', () => {
    const retro1982Movie = {
      id: 10,
      title: 'The Ideon: A Contact',
      year: 1982,
      status: 'Not yet aired',
      episodes: '1',
      is_sub: 1,
    };
    const retro1992OVA = {
      id: 11,
      title: 'Legendary Brave da Garn',
      year: 1992,
      status: 'Finished Airing',
      episodes: '46',
      is_sub: 46,
    };
    const modern2026Airing = {
      id: 12,
      title: 'Bleach: Thousand-Year Blood War',
      year: 2026,
      status: 'Currently Airing',
      is_sub: 10,
    };
    const ongoingClassic = {
      id: 13,
      title: 'Case Closed',
      year: 1996,
      status: 'Currently Airing',
      is_sub: 1218,
    };

    assert.equal(isEligibleLatestRelease(retro1982Movie), false, 'Retro 1982 movie backfill must be rejected');
    assert.equal(isEligibleLatestRelease(retro1992OVA), false, 'Retro 1992 completed series must be rejected');
    assert.equal(isEligibleLatestRelease(modern2026Airing), true, 'Modern 2026 airing series must be accepted');
    assert.equal(isEligibleLatestRelease(ongoingClassic), true, 'Ongoing airing classic with active episodes must be accepted');
  });
});
