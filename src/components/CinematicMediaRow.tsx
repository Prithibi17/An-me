import React from 'react';
import { CalendarDays, Star, Subtitles, Mic } from 'lucide-react';
import { Anime } from '../types/anime';

interface CinematicMediaRowProps {
  anime: Anime;
  rank?: number;
  onSelect?: (anime: Anime) => void;
}

export function CinematicMediaRow({ anime, rank, onSelect }: CinematicMediaRowProps) {
  const title = anime.title.english || anime.title.romaji || 'Anime';
  const poster = anime.coverImage.large || anime.coverImage.medium;
  const banner = anime.bannerImage || poster;
  const score = anime.averageScore ? (anime.averageScore / 10).toFixed(1) : null;
  const subCount = anime.subEpisodeCount || anime.episodes || 12;
  const dubCount = anime.dubEpisodeCount || 0;

  // Tri-color rank styling
  const rankClass = rank === 1
    ? 'cinematic-row__rank--top-1 font-black text-red-500'
    : rank === 2
    ? 'cinematic-row__rank--top-2 font-black text-pink-500'
    : rank === 3
    ? 'cinematic-row__rank--top-3 font-black text-blue-500'
    : '';

  // Tri-color glowing dot
  const dotColor = (rank || 0) % 3 === 1
    ? 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.7)]'
    : (rank || 0) % 3 === 2
    ? 'bg-pink-500 shadow-[0_0_12px_rgba(236,72,153,0.7)]'
    : 'bg-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.7)]';

  return (
    <article
      onClick={() => onSelect && onSelect(anime)}
      className="cinematic-row group"
    >
      {banner && (
        <div className="cinematic-row__backdrop" aria-hidden="true">
          <img src={banner} alt="" />
        </div>
      )}
      <div className="cinematic-row__scrim" aria-hidden="true" />

      {typeof rank === 'number' && (
        <span className={`cinematic-row__rank ${rankClass}`}>
          {String(rank).padStart(2, '0')}
        </span>
      )}

      <div className="cinematic-row__poster">
        <img src={poster} alt="" />
      </div>

      <div className="relative z-10 min-w-0 flex-1 py-2 pr-3">
        <div className="flex items-start gap-2">
          <span className={`mt-[0.35rem] h-2 w-2 shrink-0 rounded-full ${dotColor}`} />
          <h4 className="line-clamp-2 text-xs sm:text-sm font-semibold leading-snug text-white transition-colors group-hover:text-pink-400">
            {title}
          </h4>
        </div>

        {/* Tri-color badges */}
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 pl-4 text-[10px] sm:text-[11px] font-bold text-white/55">
          {/* Red format badge */}
          <span className="rounded bg-red-500/15 text-red-300 border border-red-500/20 px-1.5 py-0.5">
            {anime.format || 'TV'}
          </span>
          {anime.seasonYear && (
            <span className="inline-flex items-center gap-1 rounded bg-white/[0.06] px-1.5 py-0.5">
              <CalendarDays className="h-3 w-3" /> {anime.seasonYear}
            </span>
          )}
          {/* Pink SUB badge */}
          <span className="inline-flex items-center gap-1 text-pink-400 font-extrabold">
            <Subtitles className="h-3 w-3" /> {subCount}
          </span>
          {/* Blue DUB badge (only if anime actually has dub) */}
          {dubCount > 0 && (
            <span className="inline-flex items-center gap-1 text-blue-400 font-extrabold">
              <Mic className="h-3 w-3" /> {dubCount}
            </span>
          )}
          {score && (
            <span className="inline-flex items-center gap-1 text-[#F5C451]">
              <Star className="h-3 w-3 fill-current" /> {score}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
