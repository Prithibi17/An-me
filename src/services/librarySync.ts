import { Anime } from '../types/anime';
import { User, CloudLibraryItem } from '../types/user';
import { executeSql } from './db';
import { getWatchlist, saveToWatchlist, removeFromWatchlist } from './storage';

export async function fetchUserCloudLibrary(userId: string): Promise<CloudLibraryItem[]> {
  try {
    const rows = await executeSql<CloudLibraryItem>(
      'SELECT id, user_id as userId, anime_id as animeId, anime_title as animeTitle, anime_cover as animeCover, anime_format as animeFormat, anime_episodes as animeEpisodes, anime_score as animeScore, status, progress, updated_at as updatedAt FROM user_library WHERE user_id = ? ORDER BY updated_at DESC',
      [userId]
    );
    return rows;
  } catch (err) {
    console.error('[LibrarySync] Failed to fetch cloud library:', err);
    return [];
  }
}

export async function syncUserLibrary(user: User): Promise<void> {
  try {
    const cloudItems = await fetchUserCloudLibrary(user.id);
    const localItems = getWatchlist();

    // Map local items into cloud if missing
    for (const local of localItems) {
      const exists = cloudItems.some((c) => c.animeId === local.id);
      if (!exists) {
        const id = `lib-${user.id}-${local.id}`;
        const title = local.title.english || local.title.romaji || 'Anime';
        const cover = local.coverImage.large || local.coverImage.medium || '';
        await executeSql(
          'INSERT OR IGNORE INTO user_library (id, user_id, anime_id, anime_title, anime_cover, anime_format, anime_episodes, anime_score, status, progress) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [
            id,
            user.id,
            local.id,
            title,
            cover,
            local.format || 'TV',
            local.episodes || 0,
            local.averageScore ? local.averageScore / 10 : 0,
            'watching',
            0,
          ]
        );
      }
    }

    // Merge cloud items into local storage
    for (const cloud of cloudItems) {
      const localExists = localItems.some((l) => l.id === cloud.animeId);
      if (!localExists) {
        saveToWatchlist({
          id: cloud.animeId,
          title: { english: cloud.animeTitle, romaji: cloud.animeTitle },
          coverImage: { large: cloud.animeCover, medium: cloud.animeCover },
          format: cloud.animeFormat,
          episodes: cloud.animeEpisodes,
          averageScore: Math.round(cloud.animeScore * 10),
          status: 'RELEASING',
        } as Anime);
      }
    }
  } catch (err) {
    console.error('[LibrarySync] Sync error:', err);
  }
}

export async function addAnimeToCloud(user: User, anime: Anime, status = 'watching'): Promise<void> {
  saveToWatchlist(anime);
  try {
    const id = `lib-${user.id}-${anime.id}`;
    const title = anime.title.english || anime.title.romaji || 'Anime';
    const cover = anime.coverImage.large || anime.coverImage.medium || '';
    await executeSql(
      'INSERT INTO user_library (id, user_id, anime_id, anime_title, anime_cover, anime_format, anime_episodes, anime_score, status, progress) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(user_id, anime_id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP, status = excluded.status',
      [
        id,
        user.id,
        anime.id,
        title,
        cover,
        anime.format || 'TV',
        anime.episodes || 0,
        anime.averageScore ? anime.averageScore / 10 : 0,
        status,
        0,
      ]
    );
  } catch (err) {
    console.error('[LibrarySync] Failed to save anime to cloud:', err);
  }
}

export async function removeAnimeFromCloud(user: User, animeId: number): Promise<void> {
  removeFromWatchlist(animeId);
  try {
    await executeSql('DELETE FROM user_library WHERE user_id = ? AND anime_id = ?', [user.id, animeId]);
  } catch (err) {
    console.error('[LibrarySync] Failed to remove anime from cloud:', err);
  }
}
