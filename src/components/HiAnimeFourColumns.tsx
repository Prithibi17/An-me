import React from 'react';
import { ChevronRight, Radio, Heart, CheckCircle2 } from 'lucide-react';
import { Anime } from '../types/anime';
import { CinematicMediaRow } from './CinematicMediaRow';

interface HiAnimeFourColumnsProps {
  topAiring: Anime[];
  mostFavorite: Anime[];
  latestCompleted: Anime[];
  onSelectAnime: (anime: Anime) => void;
  onViewMore: (category: string) => void;
}

function ColumnBlock({
  title,
  icon: Icon,
  accentColor,
  hoverColor,
  items,
  onSelect,
  onMore,
}: {
  title: string;
  icon: any;
  accentColor: string;
  hoverColor: string;
  items: Anime[];
  onSelect: (anime: Anime) => void;
  onMore: () => void;
}) {
  return (
    <section className="rounded-xl border border-white/[0.07] bg-[#0f1218]/90 p-3.5 shadow-[0_18px_48px_rgba(0,0,0,0.18)]">
      <div className="mb-3 flex items-center justify-between border-b border-white/[0.07] pb-2.5">
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${accentColor}`} />
          <h3 className={`text-sm font-black uppercase tracking-[0.08em] ${accentColor}`}>{title}</h3>
        </div>
        <button
          onClick={onMore}
          className={`inline-flex items-center gap-1 text-[11px] font-bold text-white/45 transition-colors ${hoverColor}`}
        >
          More <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="flex flex-col gap-2">
        {items.slice(0, 5).map((item) => (
          <CinematicMediaRow key={item.id} anime={item} onSelect={onSelect} />
        ))}
      </div>
    </section>
  );
}

export function HiAnimeFourColumns({
  topAiring,
  mostFavorite,
  latestCompleted,
  onSelectAnime,
  onViewMore,
}: HiAnimeFourColumnsProps) {
  return (
    <div className="my-6 grid w-full grid-cols-1 gap-4 md:grid-cols-3">
      {/* 1. Top Airing - Electric Blue */}
      <ColumnBlock
        title="Top Airing"
        icon={Radio}
        accentColor="text-blue-400"
        hoverColor="hover:text-blue-400"
        items={topAiring}
        onSelect={onSelectAnime}
        onMore={() => onViewMore('Top Airing')}
      />

      {/* 2. Most Favorite - Vibrant Pink */}
      <ColumnBlock
        title="Most Favorite"
        icon={Heart}
        accentColor="text-pink-400"
        hoverColor="hover:text-pink-400"
        items={mostFavorite}
        onSelect={onSelectAnime}
        onMore={() => onViewMore('Most Favorite')}
      />

      {/* 3. Latest Completed - Ruby Red */}
      <ColumnBlock
        title="Latest Completed"
        icon={CheckCircle2}
        accentColor="text-red-400"
        hoverColor="hover:text-red-400"
        items={latestCompleted}
        onSelect={onSelectAnime}
        onMore={() => onViewMore('Latest Completed')}
      />
    </div>
  );
}
