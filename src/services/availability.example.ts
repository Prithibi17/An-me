// Example Availability & Catalog Mapping Template
// Duplicate this file to `availability.ts` to connect your own episode availability provider.

import { Anime } from '../types/anime';

export async function enrichAnimeAvailability(animeList: Anime[]): Promise<Anime[]> {
  // Returns anime list with stream availability metadata
  return animeList.map((anime) => ({
    ...anime,
    subEpisodeCount: anime.episodes || 12,
    dubEpisodeCount: Math.floor((anime.episodes || 12) * 0.8),
  }));
}
