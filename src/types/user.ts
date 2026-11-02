export interface User {
  id: string;
  username: string;
  email: string;
  avatar: string;
  isVip: boolean;
  joinedAt: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'episode_drop' | 'announcement' | 'system';
  animeId?: number | null;
  animeTitle?: string | null;
  animeCover?: string | null;
  animeBanner?: string | null;
  episodeNumber?: number | null;
  createdAt: string;
  isRead?: boolean;
}

export interface CloudLibraryItem {
  id: string;
  userId: string;
  animeId: number;
  animeTitle: string;
  animeCover: string;
  animeFormat: string;
  animeEpisodes: number;
  animeScore: number;
  status: 'watching' | 'completed' | 'plan_to_watch' | 'dropped' | 'on_hold';
  progress: number;
  updatedAt: string;
}
