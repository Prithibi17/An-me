import React, { useState, useEffect } from 'react';
import { LucideIcon, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Anime } from '../types/anime';
import { AnimeCard } from './AnimeCard';

export type EpisodeFilterType = 'all' | 'sub' | 'dub';

interface AnimeGridProps {
  title: string;
  icon?: LucideIcon;
  animeList: Anime[];
  onSelectAnime: (anime: Anime) => void;
  onPlayAnime?: (anime: Anime) => void;
  showRank?: boolean;
  page?: number;
  totalPages?: number;
  onPrevPage?: () => void;
  onNextPage?: () => void;
  onPageChange?: (newPage: number) => void;
  hasPrevPage?: boolean;
  hasNextPage?: boolean;
  isLoadingPage?: boolean;
  onViewAll?: () => void;
  audioFilter?: EpisodeFilterType;
  onFilterChange?: (filter: EpisodeFilterType) => void;
}

export function AnimeGrid({
  title,
  icon: Icon,
  animeList,
  onSelectAnime,
  onPlayAnime,
  showRank = false,
  page,
  totalPages,
  onPrevPage,
  onNextPage,
  onPageChange,
  hasPrevPage = false,
  hasNextPage = false,
  isLoadingPage = false,
  onViewAll,
  audioFilter,
  onFilterChange,
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
      const targetPage = totalPages ? Math.min(parsed, totalPages) : parsed;
      setPageInput(String(targetPage));
      if (targetPage !== page) {
        onPageChange(targetPage);
      }
    } else if (typeof page === 'number') {
      setPageInput(String(page));
    }
  };

  if (!animeList || animeList.length === 0) {
    if (isLoadingPage) {
      return (
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            {Icon && (
              <div className="w-7 h-7 rounded-lg bg-pink-500/15 border border-pink-500/25 flex items-center justify-center text-pink-400">
                <Icon className="w-4 h-4" />
              </div>
            )}
            <h2 className="text-lg font-black text-white tracking-tight">{title}</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="aspect-[2/3] rounded-lg bg-[#11151b] animate-pulse border border-white/5" />
            ))}
          </div>
        </section>
      );
    }
    return null;
  }

  return (
    <section className="mb-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {Icon && (
              <div className="w-7 h-7 rounded-lg bg-pink-500/15 border border-pink-500/25 flex items-center justify-center text-pink-400">
                <Icon className="w-4 h-4" />
              </div>
            )}
            <h2 className="text-lg font-black text-white tracking-tight">{title}</h2>
          </div>

          {/* View All Button */}
          {onViewAll && (
            <button
              type="button"
              onClick={onViewAll}
              className="flex items-center gap-1 text-xs font-bold text-pink-400 hover:text-pink-300 transition-colors ml-1 hover:underline cursor-pointer"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}

          {/* <> Navigation Buttons & Page Number Input */}
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
                  <div className="relative flex items-center ml-1 group" title="Type any page number (e.g. 1, 10, 50, 100...) and press Enter">
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
                      style={{ width: `${Math.max(38, (pageInput.length || 1) * 10 + 20)}px` }}
                      className="h-7 text-center text-xs font-bold text-pink-400 bg-[#141824] border border-white/10 hover:border-pink-500/50 focus:border-pink-500 focus:bg-[#181d2c] focus:outline-none focus:ring-1 focus:ring-pink-500 rounded-lg transition-all cursor-text shadow-sm px-1"
                    />
                    {totalPages && (
                      <span className="text-[10px] text-white/30 ml-1.5 select-none font-medium">
                        / {totalPages}
                      </span>
                    )}
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

        {/* Audio Filter Controls (All, SUB, DUB) */}
        {onFilterChange && (
          <div className="flex items-center gap-1 bg-[#121620] p-1 rounded-lg border border-white/10">
            {(['all', 'sub', 'dub'] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => onFilterChange(filter)}
                className={`px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  audioFilter === filter
                    ? 'bg-pink-600 text-white shadow-sm'
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        )}
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
