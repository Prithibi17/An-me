import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Layers } from 'lucide-react';

const GENRES = [
  'Action', 'Adventure', 'Cars', 'Comedy', 'Dementia', 'Demons', 'Drama', 'Ecchi', 'Fantasy', 'Game',
  'Harem', 'Historical', 'Horror', 'Isekai', 'Josei', 'Kids', 'Magic', 'Martial Arts', 'Mecha', 'Military',
  'Music', 'Mystery', 'Parody', 'Police', 'Psychological', 'Romance', 'Samurai', 'School', 'Sci-Fi', 'Seinen',
  'Shoujo', 'Shoujo Ai', 'Shounen', 'Shounen Ai', 'Slice of Life', 'Space', 'Sports', 'Super Power',
  'Supernatural', 'Thriller', 'Vampire'
];

interface GenresCardProps {
  onSelectGenre: (genre: string) => void;
}

export function GenresCard({ onSelectGenre }: GenresCardProps) {
  const [expanded, setExpanded] = useState(false);
  const displayGenres = expanded ? GENRES : GENRES.slice(0, 24);

  // Equal distribution of Pink, Blue, Red hover states
  const getHoverColor = (index: number) => {
    const mod = index % 3;
    if (mod === 0) return 'hover:bg-red-600 hover:text-white border-red-500/10';
    if (mod === 1) return 'hover:bg-pink-600 hover:text-white border-pink-500/10';
    return 'hover:bg-blue-600 hover:text-white border-blue-500/10';
  };

  return (
    <section className="flex w-full flex-col gap-3 rounded-xl border border-white/[0.07] bg-[#0f1218]/90 p-3.5 shadow-[0_18px_48px_rgba(0,0,0,0.18)]">
      <div className="flex items-center justify-between border-b border-white/[0.07] pb-2.5">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-pink-400" />
          <h3 className="text-base font-black uppercase tracking-[0.08em] text-white">Genres</h3>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {displayGenres.map((genre, index) => (
          <button
            key={genre}
            onClick={() => onSelectGenre(genre)}
            className={`rounded bg-[#161b24] border px-2.5 py-1 text-xs font-semibold text-slate-300 transition-colors ${getHoverColor(index)}`}
          >
            {genre}
          </button>
        ))}
      </div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="mt-1 flex items-center justify-center gap-1 rounded bg-[#161b24]/60 py-1.5 text-xs font-bold text-white/70 hover:bg-gradient-to-r hover:from-red-600 hover:via-pink-600 hover:to-blue-600 hover:text-white transition-all"
      >
        {expanded ? 'Show less' : 'Show more'}
        {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>
    </section>
  );
}
