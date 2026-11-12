// Example Availability & Catalog Mapping Template
// Duplicate this file to `availability.ts` to connect your own episode availability provider.

import { Anime } from '../types/anime';

export interface AvailabilityResult {
  subCount: number;
  dubCount: number;
  hasDub: boolean;
  source: string;
  anizipData?: any;
}

export async function getSingleAnimeAvailability(anime: Anime): Promise<AvailabilityResult> {
  const sub = anime.subEpisodeCount || anime.episodes || 12;
  const dub = anime.dubEpisodeCount || Math.floor(sub * 0.8);
  return {
    subCount: sub,
    dubCount: dub,
    hasDub: dub > 0,
    source: 'Example Multi-Source Provider',
  };
}

export async function enrichAnimeAvailability(animeList: Anime[]): Promise<Anime[]> {
  return animeList.map((anime) => ({
    ...anime,
    subEpisodeCount: anime.episodes || 12,
    dubEpisodeCount: anime.dubEpisodeCount || Math.floor((anime.episodes || 12) * 0.8),
  }));
}
