import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const realModulePath = path.resolve(__dirname, '../src/services/availability.ts');
const exampleModulePath = path.resolve(__dirname, '../src/services/availability.example.ts');
const targetModule = fs.existsSync(realModulePath) ? '../src/services/availability.ts' : '../src/services/availability.example.ts';

const {
  normalizeCatalogTitle,
  getSingleAnimeAvailability,
  enrichAnimeAvailability,
} = await import(targetModule);

describe('An:me — Multi-Source Sub & Dub Availability Engine Test Suite', () => {
  test('1. Title normalizer eliminates punctuation, casing, diacritics and whitespace', () => {
    assert.equal(normalizeCatalogTitle('Attack on Titan: Final Season!'), 'attackontitanfinalseason');
    assert.equal(normalizeCatalogTitle('One Piece (1999)'), 'onepiece1999');
    assert.equal(normalizeCatalogTitle('Pokémon: Horizons'), 'pokemonhorizons');
    assert.equal(normalizeCatalogTitle('   Frieren: Beyond Journey`s End   '), 'frierenbeyondjourneysend');
  });

  test('2. Matches anime by AniList ID and accurately extracts SUB and DUB counts', async () => {
    const mockAnime = {
      id: 21,
      idMal: 21,
      title: { english: 'One Piece', romaji: 'One Piece' },
      status: 'RELEASING',
      genres: ['Action', 'Adventure'],
    };

    const res = await getSingleAnimeAvailability(mockAnime);
    assert.ok(res.subCount >= 1000, `Expected One Piece subCount >= 1000, got ${res.subCount}`);
    assert.ok(res.dubCount >= 1000, `Expected One Piece dubCount >= 1000, got ${res.dubCount}`);
    assert.equal(res.hasDub, true);
  });

  test('3. Matches anime by MyAnimeList ID when AniList ID is absent', async () => {
    const mockAnime = {
      id: 9999999, // Unmatched AniList ID
      idMal: 16498, // Attack on Titan MAL ID
      title: { english: 'Attack on Titan' },
      status: 'FINISHED',
      episodes: 25,
      genres: ['Action'],
    };

    const res = await getSingleAnimeAvailability(mockAnime);
    assert.equal(res.subCount, 25);
    assert.equal(res.dubCount, 25);
    assert.equal(res.hasDub, true);
  });

  test('4. Matches anime by fuzzy title when IDs are absent', async () => {
    const mockAnime = {
      id: 8888888,
      idMal: null,
      title: { english: 'Death Note' },
      status: 'FINISHED',
      episodes: 37,
      genres: ['Mystery'],
    };

    const res = await getSingleAnimeAvailability(mockAnime);
    assert.equal(res.subCount, 37);
    assert.equal(res.dubCount, 37);
    assert.equal(res.hasDub, true);
  });

  test('5. Releasing anime is strictly clamped to current aired episode and never displays future phantom episodes', async () => {
    const airingAnime = {
      id: 204011,
      title: { english: 'Siren' },
      status: 'RELEASING',
      episodes: 12, // Planned episodes
      nextAiringEpisode: {
        episode: 6, // Next episode to air is 6
        airingAt: Math.floor(Date.now() / 1000) + 86400,
        timeUntilAiring: 86400,
      },
      genres: ['Supernatural'],
    };

    const res = await getSingleAnimeAvailability(airingAnime);
    // Current aired episode cannot exceed nextAiringEpisode.episode - 1 (which is 5)
    assert.ok(res.subCount <= 5, `Expected subCount <= 5 for Siren, got ${res.subCount}`);
    assert.ok(res.dubCount <= 5, `Expected dubCount <= 5 for Siren, got ${res.dubCount}`);
  });

  test('6. Batch enrichment accurately annotates lists of anime', async () => {
    const animeList = [
      { id: 21, idMal: 21, title: { english: 'One Piece' }, genres: ['Action'] },
      { id: 1535, idMal: 1535, title: { english: 'Death Note' }, genres: ['Mystery'] },
      { id: 269, idMal: 269, title: { english: 'Bleach' }, genres: ['Action'] },
    ];

    const enriched = await enrichAnimeAvailability(animeList);
    assert.equal(enriched.length, 3);
    assert.ok(enriched[0].subEpisodeCount > 1000);
    assert.ok(enriched[0].dubEpisodeCount > 1000);
    assert.equal(enriched[1].subEpisodeCount, 37);
    assert.equal(enriched[1].dubEpisodeCount, 37);
    assert.equal(enriched[2].subEpisodeCount, 366);
    assert.equal(enriched[2].dubEpisodeCount, 366);
  });

  test('7. Fallback resilience: Unmatched unknown anime defaults gracefully without errors', async () => {
    const unknownAnime = {
      id: 77777777,
      idMal: null,
      title: { english: 'Completely Unknown Fantasy Anime XYZ 999' },
      status: 'FINISHED',
      episodes: 12,
      genres: ['Fantasy'],
    };

    const res = await getSingleAnimeAvailability(unknownAnime);
    assert.equal(typeof res.subCount, 'number');
    assert.equal(typeof res.dubCount, 'number');
    assert.equal(typeof res.hasDub, 'boolean');
    assert.ok(res.subCount >= 1);
  });
});
