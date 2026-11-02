import React from 'react';
import { Star, Play, Subtitles, Mic } from 'lucide-react';
import { Anime } from '../types/anime';

interface AnimeCardProps {
  anime: Anime;
  onSelect: (anime: Anime) => void;
  onPlay?: (anime: Anime) => void;
  rank?: number;
}

export function AnimeCard({ anime, onSelect, onPlay, rank }: AnimeCardProps) {
  const title = anime.title.english || anime.title.romaji || 'Anime';
  const poster = anime.coverImage.large || anime.coverImage.medium;
  const score = anime.averageScore ? (anime.averageScore / 10).toFixed(1) : null;
  const subCount = anime.subEpisodeCount || (anime.nextAiringEpisode?.episode
    ? anime.nextAiringEpisode.episode - 1
    : anime.episodes || 12);
  // Only show dub count if the anime actually has a dub available
  const dubCount = anime.dubEpisodeCount || 0;
  const rankNumber = rank ? String(rank).padStart(2, '0') : null;

  // Abbreviate format to avoid pushing sub/dub count out of card
  const formatShort = (() => {
    const f = (anime.format || 'TV').toUpperCase();
    if (f === 'TV_SHORT') return 'TV';
    if (f === 'SPECIAL') return 'SP';
    if (f === 'MOVIE') return 'MOV';
    return f;
  })();

  // Tri-color rank badge: 1 is Red, 2 is Pink, 3 is Blue, others default
  const rankStyle = rank === 1
    ? 'text-red-400 border-red-500/40 bg-red-950'
    : rank === 2
    ? 'text-pink-400 border-pink-500/40 bg-pink-950'
    : rank === 3
    ? 'text-blue-400 border-blue-500/40 bg-blue-950'
    : 'text-white border-white/10 bg-[#0a0d14]';

  return (
    <div
      onClick={() => onSelect(anime)}
      className="group relative flex flex-col w-full text-left cursor-pointer transition-transform duration-200 ease-out hover:-translate-y-1 rounded-lg select-none"
    >
      {/* Poster Container (2:3 aspect ratio, isolated stacking context to prevent badge floating) */}
      <div className="relative w-full aspect-[2/3] rounded-lg overflow-hidden bg-[#11151B] border border-white/5 shadow-md group-hover:border-blue-500/40 transition-colors isolate transform-gpu">
        <img
          src={poster}
          alt={title}
          loading="lazy"
          className="w-full h-full object-cover transition-opacity duration-200 group-hover:opacity-95"
        />

        {/* Tri-Color Gradient Play Button on Hover */}
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-red-600 via-pink-600 to-blue-600 text-white flex items-center justify-center shadow-lg shadow-pink-600/40 transform scale-90 group-hover:scale-100 transition-transform duration-180">
            <Play className="w-4 h-4 fill-current ml-0.5" />
          </div>
        </div>

        {/* Ranking Badge (01 in Red, 02 in Pink, 03 in Blue) */}
        {rankNumber && (
          <div className="absolute top-2 left-2 z-10 pointer-events-none">
            <span className={`px-2 py-0.5 rounded font-mono text-xs font-bold border tracking-wider shadow-sm ${rankStyle}`}>
              {rankNumber}
            </span>
          </div>
        )}

        {/* Rating Badge (Solid background, locked to poster) */}
        {score && (
          <div className="absolute top-2 right-2 z-10 pointer-events-none">
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#0a0d14] text-[#F5C451] text-xs font-semibold border border-white/10 shadow-sm">
              <Star className="w-3 h-3 fill-current" />
              {score}
            </span>
          </div>
        )}

        {/* Red, Pink, Blue Tri-Balanced Badges at bottom (Solid background, locked to poster) */}
        <div className="absolute bottom-1.5 left-1.5 right-1.5 z-10 flex items-center justify-between gap-1 text-[9px] pointer-events-none">
          {/* Red Accent for Format */}
          <span className="shrink-0 px-1 py-0.5 rounded bg-[#0a0d14] text-red-400 font-black border border-red-500/20 uppercase tracking-tight leading-none shadow-sm">
            {formatShort}
          </span>
          <div className="flex items-center gap-0.5 shrink-0">
            {/* Pink Accent for SUB */}
            <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded bg-pink-600 text-white font-black shadow-sm leading-none shrink-0">
              <Subtitles className="w-2.5 h-2.5 shrink-0" />
              <span>{subCount}</span>
            </span>
            {/* Blue Accent for DUB */}
            {dubCount > 0 && (
              <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded bg-blue-600 text-white font-black shadow-sm leading-none shrink-0">
                <Mic className="w-2.5 h-2.5 shrink-0" />
                <span>{dubCount}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Title */}
      <div className="mt-2 px-0.5">
        <h3 className="line-clamp-2 text-xs sm:text-sm font-semibold text-white group-hover:text-pink-400 transition-colors leading-snug">
          {title}
        </h3>
        <p className="text-[11px] font-medium text-white/40 mt-0.5 truncate">
          {anime.genres.slice(0, 2).join(' • ') || (anime.season ? `${anime.season} ${anime.seasonYear || ''}` : 'Anime')}
        </p>
      </div>
    </div>
  );
}
