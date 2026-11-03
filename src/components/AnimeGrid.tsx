import React, { useState, useEffect } from 'react';
import { LucideIcon, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Anime } from '../types/anime';
import { AnimeCard } from './AnimeCard';

interface AnimeGridProps {
  title: string;
  icon?: LucideIcon;
  animeList: Anime[];
  onSelectAnime: (anime: Anime) => void;
  onPlayAnime?: (anime: Anime) => void;
  showRank?: boolean;
  page?: number;
  onPrevPage?: () => void;
  onNextPage?: () => void;
  onPageChange?: (newPage: number) => void;
  hasPrevPage?: boolean;
  hasNextPage?: boolean;
  isLoadingPage?: boolean;
}

export function AnimeGrid({
  title,
  icon: Icon,
  animeList,
  onSelectAnime,
  onPlayAnime,
  showRank = false,
  page,
  onPrevPage,
  onNextPage,
  onPageChange,
  hasPrevPage = false,
  hasNextPage = false,
  isLoadingPage = false,
}: AnimeGridProps) {
  const [pageInput, setPageInput] = useState<string>(String(page || 1));

  useEffect(() => {
    if (typeof page === 'number') {
      setPageInput(String(page));
    }
  }, [page]);

  const handleCommitPage = () => {
    const clean = pageInput.trim();
    if (!clean) {
      if (typeof page === 'number') setPageInput(String(page));
      return;
    }
    const parsed = parseInt(clean, 10);
    if (!isNaN(parsed) && parsed >= 1 && onPageChange) {
      if (parsed !== page) {
        onPageChange(parsed);
      }
    } else if (typeof page === 'number') {
      setPageInput(String(page));
    }
  };
  if (!animeList || animeList.length === 0) return null;

  return (
    <section className="mb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {Icon && (
              <div className="w-7 h-7 rounded-lg bg-pink-500/15 border border-pink-500/25 flex items-center justify-center text-pink-400">
                <Icon className="w-4 h-4" />
              </div>
            )}
            <h2 className="text-lg font-black text-white tracking-tight">{title}</h2>
          </div>

          {/* <> Navigation Buttons right beside the title */}
          {(onPrevPage || onNextPage) && (
            <div className="flex items-center gap-1.5 ml-1">
              <button
                type="button"
                onClick={onPrevPage}
                disabled={!hasPrevPage || isLoadingPage}
                title="Previous page"
                className={`w-7 h-7 rounded-lg bg-[#141824] border border-white/10 flex items-center justify-center transition-all ${
                  !hasPrevPage || isLoadingPage
                    ? 'opacity-30 cursor-not-allowed text-white/30'
                    : 'text-white hover:bg-pink-600 hover:border-pink-500 hover:shadow-md hover:shadow-pink-600/30 cursor-pointer active:scale-95'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onNextPage}
                disabled={!hasNextPage || isLoadingPage}
                title="Next page"
                className={`w-7 h-7 rounded-lg bg-[#141824] border border-white/10 flex items-center justify-center transition-all ${
                  !hasNextPage || isLoadingPage
                    ? 'opacity-30 cursor-not-allowed text-white/30'
                    : 'text-white hover:bg-pink-600 hover:border-pink-500 hover:shadow-md hover:shadow-pink-600/30 cursor-pointer active:scale-95'
                }`}
              >
                {isLoadingPage ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-pink-400" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
              {typeof page === 'number' && (
                onPageChange ? (
                  <div className="relative flex items-center ml-1 group" title="Type any page number (1, 10, 100, 1000...) and press Enter to jump">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={pageInput}
                      onChange={(e) => setPageInput(e.target.value.replace(/[^0-9]/g, ''))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleCommitPage();
                          e.currentTarget.blur();
                        }
                      }}
                      onFocus={(e) => e.target.select()}
                      onBlur={handleCommitPage}
                      disabled={isLoadingPage}
                      aria-label="Jump to page"
                      style={{ width: `${Math.max(34, (pageInput.length || 1) * 9 + 18)}px` }}
                      className="h-7 text-center text-xs font-bold text-pink-400 bg-[#141824] border border-white/10 hover:border-pink-500/50 focus:border-pink-500 focus:bg-[#181d2c] focus:outline-none focus:ring-1 focus:ring-pink-500 rounded-lg transition-all cursor-text shadow-sm px-1"
                    />
                  </div>
                ) : (
                  <span className="text-[11px] font-bold text-slate-400 ml-1 px-2 py-0.5 rounded-md bg-[#141824] border border-white/10">
                    {page}
                  </span>
                )
              )}
            </div>
          )}
        </div>
      </div>

      {/* Grid */}
      <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5 transition-opacity duration-200 ${isLoadingPage ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
        {animeList.map((anime, index) => (
          <AnimeCard
            key={`${anime.id}-${index}`}
            anime={anime}
            onSelect={onSelectAnime}
            onPlay={onPlayAnime}
            rank={showRank ? index + 1 : undefined}
          />
        ))}
      </div>
    </section>
  );
}
