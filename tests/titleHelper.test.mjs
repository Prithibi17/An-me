import test from 'node:test';
import assert from 'node:assert/strict';
import { getAnimeTitle, scoreEnglishTitle, hasNonLatinScript, resolveProviderTitles } from '../src/services/titleHelper.ts';

test('An:me — Authoritative English Anime Title Suite', async (t) => {
  await t.test('1. Prefers English translated title over Japanese Romaji pronunciation', () => {
    const anime = {
      id: 209219,
      title: {
        english: "So What's Wrong with Getting Reborn as a Goblin?",
        romaji: 'Tensei Goblin dakedo Shitsumon Aru?',
        native: '転生ゴブリンだけど質問ある？',
        userPreferred: 'Tensei Goblin dakedo Shitsumon Aru?',
      },
    };
    assert.equal(getAnimeTitle(anime), "So What's Wrong with Getting Reborn as a Goblin?");
  });

  await t.test('2. Filters out Thai and Kanji/Kana when English title is present in raw provider data', () => {
    const raw = {
      id: 9073,
      ani_id: '209219',
      title: "So What's Wrong with Getting Reborn as a Goblin?",
      titles: '転ゴブ, เกิดใหม่เป็นก็อบลินแล้วไง มีคำถามอะไรไหม?, Tengobu',
      alternative: 'Tensei Goblin dakedo Shitsumon Aru?',
      native: '転生ゴブリンだけど質問ある？',
    };
    const resolved = resolveProviderTitles(raw);
    assert.equal(resolved.english, "So What's Wrong with Getting Reborn as a Goblin?");
    assert.equal(resolved.romaji, 'Tensei Goblin dakedo Shitsumon Aru?');
  });

  await t.test('3. Replaces Japanese abbreviation (Horemajo) with full English title', () => {
    const raw = {
      id: 9048,
      ani_id: '207191',
      title: 'Hello, I Am a Witch and My Crush Wants Me to Make a Love Potion!',
      titles: 'Horemajo',
      alternative: 'Doumo, Suki na Hito ni Horegusuri wo Irai sareta Majo desu.',
      native: 'どうも、好きな人に惚れ薬を依頼された魔女です。',
    };
    const resolved = resolveProviderTitles(raw);
    assert.equal(resolved.english, 'Hello, I Am a Witch and My Crush Wants Me to Make a Love Potion!');
  });

  await t.test('4. Promotes English alternative from titles when raw.title is Japanese romaji', () => {
    const raw = {
      id: 9064,
      ani_id: '160803',
      title: 'Mahou Shoujo Ikusei Keikaku: Restart',
      titles: 'Magical Girl Raising Project: Restart',
      alternative: 'Mahou Shoujo Ikusei Keikaku: Restart',
      native: '魔法少女育成計画 restart',
    };
    const resolved = resolveProviderTitles(raw);
    assert.equal(resolved.english, 'Magical Girl Raising Project: Restart');
    assert.equal(resolved.romaji, 'Mahou Shoujo Ikusei Keikaku: Restart');
  });

  await t.test('5. Detects non-Latin scripts (Japanese, Thai, Korean, Cyrillic, Arabic)', () => {
    assert.equal(hasNonLatinScript('転ゴブ'), true);
    assert.equal(hasNonLatinScript('เกิดใหม่เป็นก็อบลิน'), true);
    assert.equal(hasNonLatinScript('Mahou Shoujo'), false);
    assert.equal(hasNonLatinScript('Demon Slayer: Kimetsu no Yaiba'), false);
    assert.equal(hasNonLatinScript('Attack on Titan'), false);
  });

  await t.test('6. Falls back cleanly to Romaji in Latin characters when no English title exists', () => {
    const anime = {
      id: 3166,
      title: {
        romaji: 'Ayakashi',
        native: 'アヤカシ',
      },
    };
    assert.equal(getAnimeTitle(anime), 'Ayakashi');
  });

  await t.test('7. Looks up English title from synonyms when title.english is omitted', () => {
    const anime = {
      id: 160803,
      title: {
        romaji: 'Mahou Shoujo Ikusei Keikaku: Restart',
      },
      synonyms: [
        'Mahou Shoujo Ikusei Keikaku',
        'Magical Girl Raising Project: Restart',
      ],
    };
    assert.equal(getAnimeTitle(anime), 'Magical Girl Raising Project: Restart');
  });
});
