export interface AnimeTitle {
  romaji?: string;
  english?: string;
  native?: string;
  userPreferred?: string;
}

export interface AnimeImage {
  extraLarge?: string;
  large?: string;
  medium?: string;
  color?: string;
}

export interface AiringEpisode {
  airingAt: number;
  timeUntilAiring: number;
  episode: number;
}

export interface CharacterItem {
  id: number;
  name: {
    full: string;
    native?: string;
  };
  image?: {
    medium?: string;
    large?: string;
  };
  role: string;
}

export interface StreamingEpisode {
  title?: string;
  thumbnail?: string;
  url?: string;
  site?: string;
}

export interface Anime {
  id: number;
  idMal?: number;
  title: AnimeTitle;
  coverImage: AnimeImage;
  bannerImage?: string | null;
  description?: string;
  format?: string;
  status?: string;
  episodes?: number | null;
  subEpisodeCount?: number;
  dubEpisodeCount?: number;
  anizipEpisodes?: Record<string, any>;
  availabilitySource?: string;
  latestEpisodeNumber?: number;
  latestEpisodeTimestamp?: number;
  relativeUpdateTime?: string;
  providerId?: number;
  duration?: number | null;
  genres: string[];
  synonyms?: string[];
  isAdult?: boolean;
  averageScore?: number | null;
  popularity?: number;
  season?: string;
  seasonYear?: number;
  nextAiringEpisode?: AiringEpisode | null;
  streamingEpisodes?: StreamingEpisode[];
  studios?: {
    nodes: Array<{ name: string; isAnimationStudio: boolean }>;
  };
  characters?: {
    nodes: CharacterItem[];
  };
  relations?: {
    nodes: Anime[];
  };
  recommendations?: {
    nodes: Array<{
      mediaRecommendation?: Anime;
    }>;
  };
}

export type WatchlistStatus = 'watching' | 'plan_to_watch' | 'completed' | 'dropped' | 'favorite';

export interface WatchHistoryItem {
  animeId: number;
  title: string;
  coverImage: string;
  episode: number;
  totalEpisodes?: number | null;
  progressPercent: number;
  lastUpdated: number;
}

export interface WatchlistItem {
  anime: Anime;
  status: WatchlistStatus;
  addedAt: number;
  lastWatchedEpisode?: number;
}
