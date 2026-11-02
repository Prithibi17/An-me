import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, Flame } from 'lucide-react';
import { Anime } from '../types/anime';

interface HiAnimeTrendingStripProps {
  items: Anime[];
  onSelect: (anime: Anime) => void;
}

export function HiAnimeTrendingStrip({ items, onSelect }: HiAnimeTrendingStripProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const offset = direction === 'left' ? -340 : 340;
      scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  const trendingList = items.slice(0, 10);

  // Equal distribution of Pink, Blue, Red for rank tags
  const getRankColor = (index: number) => {
    const mod = index % 3;
    if (mod === 0) return 'text-red-500 border-red-500/30';
    if (mod === 1) return 'text-pink-400 border-pink-500/30';
    return 'text-blue-400 border-blue-500/30';
  };

  const getBorderHover = (index: number) => {
    const mod = index % 3;
    if (mod === 0) return 'group-hover:border-red-500/60';
    if (mod === 1) return 'group-hover:border-pink-500/60';
    return 'group-hover:border-blue-500/60';
  };

  return (
    <div className="w-full flex flex-col gap-3 select-none my-6">
      {/* Title & Arrows */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
            <Flame className="w-4 h-4 fill-current" />
          </div>
          <h2 className="text-lg sm:text-xl font-black text-white">Trending Now</h2>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Blue left scroll */}
          <button
            onClick={() => handleScroll('left')}
            aria-label="Scroll left"
            className="w-7 h-7 rounded bg-[#161824] hover:bg-blue-600 text-white flex items-center justify-center transition-colors cursor-pointer border border-white/5"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          {/* Pink right scroll */}
          <button
            onClick={() => handleScroll('right')}
            aria-label="Scroll right"
            className="w-7 h-7 rounded bg-[#161824] hover:bg-pink-600 text-white flex items-center justify-center transition-colors cursor-pointer border border-white/5"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Horizontal Scrollable Row with equal tri-color rotation */}
      <div
        ref={scrollRef}
        className="flex items-center gap-3 overflow-x-auto no-scrollbar scroll-smooth pb-2"
      >
        {trendingList.map((item, index) => {
          const title = item.title.english || item.title.romaji || 'Anime';
          const rankStr = String(index + 1).padStart(2, '0');
          const poster = item.coverImage.large || item.coverImage.medium;
          const colorClass = getRankColor(index);
          const hoverBorderClass = getBorderHover(index);

          return (
            <div
              key={item.id}
              onClick={() => onSelect(item)}
              className="relative shrink-0 cursor-pointer group"
            >
              <div className={`relative flex w-[190px] sm:w-[210px] h-[260px] sm:h-[280px] overflow-hidden bg-[#13151e] border border-white/5 shadow-md rounded-lg transition-all ${hoverBorderClass}`}>
                {/* Left Strip with Rotated Vertical Text */}
                <div className="w-11 bg-[#161924] flex flex-col-reverse items-center justify-between py-2.5 shrink-0 border-r border-white/5">
                  <span className={`font-mono text-xl font-black ${colorClass}`}>
                    {rankStr}
                  </span>
                  <span
                    className="[writing-mode:vertical-rl] rotate-180 block max-h-[205px] overflow-hidden whitespace-nowrap text-ellipsis text-xs font-bold text-white tracking-wide leading-none group-hover:text-white"
                    title={title}
                  >
                    {title}
                  </span>
                </div>

                {/* Right: Poster artwork with hover zoom */}
                <div className="relative flex-1 h-full overflow-hidden">
                  <img
                    src={poster}
                    alt={title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
