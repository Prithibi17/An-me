// Direct static imports to bundle assets directly into Vite and Electron
import av01 from '../assets/avatars/avatar-01.webp';
import av02 from '../assets/avatars/avatar-02.webp';
import av03 from '../assets/avatars/avatar-03.webp';
import av04 from '../assets/avatars/avatar-04.webp';
import av05 from '../assets/avatars/avatar-05.webp';
import av06 from '../assets/avatars/avatar-06.webp';
import av07 from '../assets/avatars/avatar-07.webp';
import av08 from '../assets/avatars/avatar-08.webp';
import av09 from '../assets/avatars/avatar-09.webp';
import av10 from '../assets/avatars/avatar-10.webp';
import av11 from '../assets/avatars/avatar-11.webp';
import av12 from '../assets/avatars/avatar-12.webp';
import av13 from '../assets/avatars/avatar-13.webp';
import av14 from '../assets/avatars/avatar-14.webp';
import av15 from '../assets/avatars/avatar-15.webp';
import av16 from '../assets/avatars/avatar-16.webp';
import av17 from '../assets/avatars/avatar-17.webp';
import av18 from '../assets/avatars/avatar-18.webp';
import av19 from '../assets/avatars/avatar-19.webp';
import av20 from '../assets/avatars/avatar-20.webp';
import av21 from '../assets/avatars/avatar-21.webp';
import av22 from '../assets/avatars/avatar-22.webp';
import av23 from '../assets/avatars/avatar-23.webp';
import av24 from '../assets/avatars/avatar-24.webp';
import av25 from '../assets/avatars/avatar-25.webp';
import av26 from '../assets/avatars/avatar-26.webp';
import av27 from '../assets/avatars/avatar-27.webp';
import av28 from '../assets/avatars/avatar-28.webp';
import av29 from '../assets/avatars/avatar-29.webp';
import av30 from '../assets/avatars/avatar-30.webp';

export interface AvatarInfo {
  id: string;
  src: string;
  name: string;
}

export const AVATAR_IMAGE_MAP: Record<string, string> = {
  'avatar-01': av01,
  'avatar-02': av02,
  'avatar-03': av03,
  'avatar-04': av04,
  'avatar-05': av05,
  'avatar-06': av06,
  'avatar-07': av07,
  'avatar-08': av08,
  'avatar-09': av09,
  'avatar-10': av10,
  'avatar-11': av11,
  'avatar-12': av12,
  'avatar-13': av13,
  'avatar-14': av14,
  'avatar-15': av15,
  'avatar-16': av16,
  'avatar-17': av17,
  'avatar-18': av18,
  'avatar-19': av19,
  'avatar-20': av20,
  'avatar-21': av21,
  'avatar-22': av22,
  'avatar-23': av23,
  'avatar-24': av24,
  'avatar-25': av25,
  'avatar-26': av26,
  'avatar-27': av27,
  'avatar-28': av28,
  'avatar-29': av29,
  'avatar-30': av30,
};

export const DEFAULT_AVATARS: AvatarInfo[] = [
  // Image 1: Row 1
  { id: 'avatar-01', src: av01, name: 'Naruto Uzumaki' },
  { id: 'avatar-02', src: av02, name: 'Itachi Uchiha' },
  { id: 'avatar-03', src: av03, name: 'Son Goku' },
  { id: 'avatar-04', src: av04, name: 'Saitama' },
  { id: 'avatar-05', src: av05, name: 'Satoru Gojo' },

  // Image 1: Row 2
  { id: 'avatar-06', src: av06, name: 'Tanjiro Kamado' },
  { id: 'avatar-07', src: av07, name: 'Monkey D. Luffy' },
  { id: 'avatar-08', src: av08, name: 'Doraemon' },
  { id: 'avatar-09', src: av09, name: 'Pikachu' },
  { id: 'avatar-10', src: av10, name: 'Eevee' },

  // Image 1: Row 3
  { id: 'avatar-11', src: av11, name: 'Anya Forger' },
  { id: 'avatar-12', src: av12, name: 'Kakashi Hatake' },
  { id: 'avatar-13', src: av13, name: 'Totoro' },
  { id: 'avatar-14', src: av14, name: 'Shin-chan' },
  { id: 'avatar-15', src: av15, name: 'Pochita' },

  // Image 2: Row 1
  { id: 'avatar-16', src: av16, name: 'Sakura Shrine' },
  { id: 'avatar-17', src: av17, name: 'Blood Moon Ronin' },
  { id: 'avatar-18', src: av18, name: 'Cyberpunk Boy' },
  { id: 'avatar-19', src: av19, name: 'Cool Cat' },
  { id: 'avatar-20', src: av20, name: 'Space Wanderer' },

  // Image 2: Row 2
  { id: 'avatar-21', src: av21, name: 'Straw Hat Jolly Roger' },
  { id: 'avatar-22', src: av22, name: 'Chidori Kakashi' },
  { id: 'avatar-23', src: av23, name: 'Sunset Saiyan' },
  { id: 'avatar-24', src: av24, name: 'Hollow Ichigo' },
  { id: 'avatar-25', src: av25, name: 'Nine-Tails Shadow' },

  // Image 2: Row 3
  { id: 'avatar-26', src: av26, name: 'Pixel Gamer Kitty' },
  { id: 'avatar-27', src: av27, name: 'Starlight Kirby' },
  { id: 'avatar-28', src: av28, name: 'Midnight Snorlax' },
  { id: 'avatar-29', src: av29, name: 'WALL-E & Sprout' },
  { id: 'avatar-30', src: av30, name: 'No-Face on Bridge' },
];

export const DEFAULT_AVATAR_ID = 'avatar-01';

const AVATAR_MAP = new Map<string, AvatarInfo>(
  DEFAULT_AVATARS.map((av) => [av.id, av])
);

/**
 * Validates whether an avatar ID is one of the 30 predefined avatars.
 */
export function isPredefinedAvatar(id?: string | null): boolean {
  if (!id) return false;
  return AVATAR_MAP.has(id);
}

/**
 * Returns the AvatarInfo object for a given avatar ID, or the default avatar info.
 */
export function getAvatarInfo(avatarId?: string | null): AvatarInfo {
  if (avatarId) {
    const clean = avatarId.trim();
    if (AVATAR_MAP.has(clean)) {
      return AVATAR_MAP.get(clean)!;
    }
    // Also try matching by filename e.g. "avatar-05.webp"
    for (const av of DEFAULT_AVATARS) {
      if (clean.includes(av.id)) return av;
    }
  }
  return DEFAULT_AVATARS[0];
}

/**
 * Resolves an avatar ID or URL to a hardcoded bundled asset URL.
 * Guaranteed to return a valid URL or path.
 * Fallback to default avatar-01 if invalid or missing.
 */
export function getAvatarSrc(avatarId?: string | null): string {
  if (!avatarId || typeof avatarId !== 'string') {
    return av01;
  }

  const clean = avatarId.trim();

  // If matching avatar-XX
  if (AVATAR_IMAGE_MAP[clean]) {
    return AVATAR_IMAGE_MAP[clean];
  }

  // If path contains avatar-XX
  const match = clean.match(/avatar-(\d{2})/);
  if (match && AVATAR_IMAGE_MAP[`avatar-${match[1]}`]) {
    return AVATAR_IMAGE_MAP[`avatar-${match[1]}`];
  }

  // External URLs (http/https/data)
  if (clean.startsWith('http://') || clean.startsWith('https://') || clean.startsWith('data:image/')) {
    return clean;
  }

  // Fallback to avatar-01 bundled asset
  return av01;
}
