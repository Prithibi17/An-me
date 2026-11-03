import test, { describe } from 'node:test';
import assert from 'node:assert/strict';

// Mock browser environments for node:test runner
if (typeof globalThis.window === 'undefined') {
  globalThis.window = {
    dispatchEvent: () => true,
    addEventListener: () => {},
    removeEventListener: () => {},
  };
}

if (typeof globalThis.CustomEvent === 'undefined') {
  globalThis.CustomEvent = class CustomEvent {
    constructor(type, eventInitDict) {
      this.type = type;
      this.detail = eventInitDict?.detail;
    }
  };
}

// In-memory mock localStorage
const memoryStore = new Map();
if (typeof globalThis.localStorage === 'undefined') {
  globalThis.localStorage = {
    getItem: (key) => memoryStore.get(key) || null,
    setItem: (key, val) => memoryStore.set(key, String(val)),
    removeItem: (key) => memoryStore.delete(key),
    clear: () => memoryStore.clear(),
  };
}

// Import watch progress service
const {
  getAnimeWatchState,
  saveAnimeWatchState,
  getEpisodeWatchStatus,
  getEpisodeProgress,
  recordEpisodeProgress,
  markEpisodeWatched,
  markEpisodeUnwatched,
  getResumeInfo,
  getContinueWatchingList,
} = await import('../src/services/watchProgress.ts');

const mockAnime = {
  id: 101,
  title: {
    romaji: 'Sousou no Frieren',
    english: 'Frieren: Beyond Journey\'s End',
    userPreferred: 'Frieren: Beyond Journey\'s End',
  },
  coverImage: {
    large: 'https://example.com/frieren.jpg',
  },
  episodes: 28,
  duration: 24,
};

describe('An:me — Offline Viewing Status & Watch Progress Test Suite', () => {
  test('1. Unstarted episode starts with Yet to Watch (unwatched) status', () => {
    const status = getEpisodeWatchStatus(mockAnime.id, 1);
    assert.equal(status, 'unwatched', 'Default unstarted episode must be unwatched');

    const progress = getEpisodeProgress(mockAnime.id, 1);
    assert.equal(progress, null, 'No progress record exists before watching');
  });

  test('2. Playback under 90% completion threshold sets Currently Watching status with position', () => {
    // 24 mins = 1440 seconds. 600s = ~42%
    const ep1 = recordEpisodeProgress(mockAnime, 1, 600, 1440);
    assert.equal(ep1.status, 'watching');
    assert.equal(ep1.currentTime, 600);
    assert.equal(ep1.progressPercent, 42);

    const savedStatus = getEpisodeWatchStatus(mockAnime.id, 1);
    assert.equal(savedStatus, 'watching', 'Stored status must be currently watching');
  });

  test('3. Playback reaching or exceeding 90% automatically marks episode as Watched', () => {
    // 1300s / 1440s = 90.28% -> rounds to 90%
    const ep1 = recordEpisodeProgress(mockAnime, 1, 1300, 1440);
    assert.equal(ep1.status, 'watched', 'Progress >= 90% must mark episode as watched');
    assert.equal(ep1.progressPercent, 90);

    const status = getEpisodeWatchStatus(mockAnime.id, 1);
    assert.equal(status, 'watched');
  });

  test('4. Full 100% completion marks as Watched', () => {
    const ep1 = recordEpisodeProgress(mockAnime, 1, 1440, 1440);
    assert.equal(ep1.status, 'watched');
    assert.equal(ep1.progressPercent, 100);
  });

  test('5. Once Watched, normal playback does not accidentally downgrade to Watching', () => {
    // Rewind slightly to credits / last minute (1200s = 83%)
    const ep1 = recordEpisodeProgress(mockAnime, 1, 1200, 1440);
    assert.equal(ep1.status, 'watched', 'Watched state must be preserved during rewatch/rewind');
  });

  test('6. Explicit markEpisodeWatched marks episode as 100% Watched', () => {
    markEpisodeWatched(mockAnime, 2);
    const status = getEpisodeWatchStatus(mockAnime.id, 2);
    assert.equal(status, 'watched');

    const progress = getEpisodeProgress(mockAnime.id, 2);
    assert.equal(progress?.status, 'watched');
    assert.equal(progress?.progressPercent, 100);
  });

  test('7. Explicit markEpisodeUnwatched resets episode back to Yet to Watch', () => {
    markEpisodeUnwatched(mockAnime.id, 2);
    const status = getEpisodeWatchStatus(mockAnime.id, 2);
    assert.equal(status, 'unwatched', 'Episode must reset to unwatched');

    const progress = getEpisodeProgress(mockAnime.id, 2);
    assert.equal(progress, null, 'Progress record removed upon reset');
  });

  test('8. getResumeInfo targets currently watching episode with exact timestamp and progress', () => {
    // Start episode 3 at 450 seconds (31%)
    recordEpisodeProgress(mockAnime, 3, 450, 1440);

    const resume = getResumeInfo(mockAnime.id);
    assert.notEqual(resume, null);
    assert.equal(resume?.episode, 3);
    assert.equal(resume?.currentTime, 450);
    assert.equal(resume?.progressPercent, 31);
    assert.equal(resume?.status, 'watching');
  });

  test('9. When current episode finishes, getResumeInfo points to next unwatched episode', () => {
    // Mark episode 3 as finished
    markEpisodeWatched(mockAnime, 3);

    const resume = getResumeInfo(mockAnime.id);
    assert.notEqual(resume, null);
    assert.equal(resume?.episode, 4, 'Should target next episode (ep 3 + 1 = ep 4)');
    assert.equal(resume?.currentTime, 0);
    assert.equal(resume?.status, 'unwatched');
  });

  test('10. Continue watching list aggregates tracked series without duplicates', () => {
    const mockAnime2 = {
      id: 202,
      title: { english: 'Jujutsu Kaisen' },
      coverImage: { large: 'https://example.com/jjk.jpg' },
      episodes: 24,
      duration: 24,
    };

    recordEpisodeProgress(mockAnime2, 1, 300, 1440);

    const list = getContinueWatchingList();
    assert.ok(list.length >= 2, 'Should include both tracked anime');

    const ids = list.map((item) => item.animeId);
    assert.ok(ids.includes(mockAnime.id));
    assert.ok(ids.includes(mockAnime2.id));

    // Ensure no duplicates
    const uniqueIds = Array.from(new Set(ids));
    assert.equal(ids.length, uniqueIds.length, 'No duplicate entries allowed in continue watching list');
  });

  test('11. Local store state persists offline without external network calls', () => {
    const rawState = getAnimeWatchState(mockAnime.id);
    assert.notEqual(rawState, null);
    assert.equal(rawState?.animeId, mockAnime.id);
    assert.ok(rawState?.episodes[1] !== undefined);
  });
});
