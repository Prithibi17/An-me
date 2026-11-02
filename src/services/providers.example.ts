// Example Stream Provider Configuration Template
// Duplicate this file to `providers.ts` and configure your own streaming server endpoints.

export interface ServerOption {
  id: string;
  name: string;
  badge: string;
  source: 'anilist' | 'mal' | 'direct';
  description: string;
}

export const AVAILABLE_SERVERS: ServerOption[] = [
  { id: 'server-1', name: 'Server 1 · Primary HD', badge: 'HD 1', source: 'anilist', description: 'Primary High-Definition Stream' },
  { id: 'server-2', name: 'Server 2 · Mirror', badge: 'HD 2', source: 'mal', description: 'Secondary Mirror Stream' },
];

export interface StreamConfig {
  animeId: number;
  idMal?: number;
  episode: number;
  track?: 'sub' | 'dub';
  server?: string;
}

export function getStreamUrl({
  animeId,
  idMal,
  episode,
  track = 'sub',
  server = 'server-1',
}: StreamConfig): string {
  const language = track === 'dub' ? 'dub' : 'sub';
  const malId = idMal || animeId;

  // Configure your target video embed / stream URL structure here
  switch (server) {
    case 'server-2':
      return `https://example.com/stream/mal/${malId}/${episode}/${language}`;
    case 'server-1':
    default:
      return `https://example.com/stream/ani/${animeId}/${episode}/${language}`;
  }
}
