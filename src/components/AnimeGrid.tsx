import React, { useState, useEffect, useRef } from 'react';
import { LucideIcon, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Anime } from '../types/anime';
import { AnimeCard } from './AnimeCard';
import { getAnimeTitle } from '../services/titleHelper';

export type EpisodeFilterType = 'all' | 'sub' | 'dub';

interface AnimeGridProps {
  title: string;
  icon?: LucideIcon;
  animeList: Anime[];
  onSelectAnime: (anime: Anime) => void;
  onPlayAnime?: (anime: Anime) => void;
  showRank?: boolean;
  layout?: 'grid' | 'carousel';
  page?: number;
  totalPages?: number;
  onPrevPage?: () => void;
  onNextPage?: () => void;
  onPageChange?: (newPage: number) => void;
  onLoadMore?: () => void;
  hasPrevPage?: boolean;
  hasNextPage?: boolean;
  hasMore?: boolean;
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
  layout = 'grid',
  page,
  totalPages,
  onPrevPage,
  onNextPage,
  onPageChange,
  onLoadMore,
  hasPrevPage = false,
  hasNextPage = false,
  hasMore = false,
  isLoadingPage = false,
  onViewAll,
  audioFilter,
  onFilterChange,
}: AnimeGridProps) {
  // Grid mode state
  const [pageInput, setPageInput] = useState<string>(String(page || 1));

  // Carousel mode state
  const carouselRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [currentGroup, setCurrentGroup] = useState<number>(1);
  const [canScrollLeft, setCanScrollLeft] = useState<boolean>(false);
  const [canScrollRight, setCanScrollRight] = useState<boolean>(true);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);

  useEffect(() => {
    if (typeof page === 'number') {
      setPageInput(String(page));
    }
  }, [page]);

  // Update carousel scroll status and calculate current group
  const updateCarouselState = () => {
    if (!carouselRef.current) return;
    const { scrollLeft, clientWidth, scrollWidth } = carouselRef.current;
    const group = Math.round(scrollLeft / clientWidth) + 1;
    setCurrentGroup(Math.max(1, group));
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10 || hasMore);

    // If approaching the end and more items can be loaded, request next batch
    if (scrollLeft + clientWidth >= scrollWidth - clientWidth && hasMore && !isLoadingPage && onLoadMore) {
      onLoadMore();
    }
  };

  const handleCarouselScroll = () => {
    updateCarouselState();
  };

  const handleNextCarouselGroup = () => {
    if (!carouselRef.current) return;
    const { scrollLeft, clientWidth, scrollWidth } = carouselRef.current;
    const nextLeft = scrollLeft + clientWidth;
    carouselRef.current.scrollBy({ left: clientWidth, behavior: 'smooth' });

    if (nextLeft >= scrollWidth - clientWidth * 1.5 && hasMore && !isLoadingPage && onLoadMore) {
      onLoadMore();
    }
  };

  const handlePrevCarouselGroup = () => {
    if (!carouselRef.current) return;
    const { clientWidth } = carouselRef.current;
    carouselRef.current.scrollBy({ left: -clientWidth, behavior: 'smooth' });
  };

  // Keyboard navigation for Carousel
  const handleCarouselKeyDown = (e: React.KeyboardEvent) => {
    const activeTag = (document.activeElement as HTMLElement)?.tagName?.toLowerCase();
    if (activeTag === 'input' || activeTag === 'textarea' || (document.activeElement as HTMLElement)?.isContentEditable) {
      return;
    }

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      setFocusedIndex((prev) => {
        const next = Math.min(animeList.length - 1, prev + 1);
        cardRefs.current[next]?.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
        cardRefs.current[next]?.focus();
        return next;
      });
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setFocusedIndex((prev) => {
        const next = Math.max(0, prev - 1);
        cardRefs.current[next]?.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
        cardRefs.current[next]?.focus();
        return next;
      });
    } else if (e.key === 'Enter') {
      if (focusedIndex >= 0 && animeList[focusedIndex]) {
        e.preventDefault();
        onSelectAnime(animeList[focusedIndex]);
      }
    }
  };

  const handleCommitPage = () => {
    const clean = pageInput.trim();
    if (!clean) {
      if (typeof page === 'number') setPageInput(String(page));
      return;
    }
    const parsed = parseInt(clean, 10);
    if (!isNaN(parsed) && parsed >= 1 && onPageChange) {
      const maxAllowed = totalPages && totalPages > 20 ? totalPages : 384;
      const targetPage = Math.min(parsed, maxAllowed);
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
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-[2/3] rounded-lg bg-[#11151b] animate-pulse border border-white/5" />
            ))}
          </div>
        </section>
      );
    }
    return null;
  }

  // -------------------------
  // 1. CAROUSEL MODE (Homepage)
  // -------------------------
  if (layout === 'carousel') {
    return (
      <section className="mb-8 select-none">
        {/* Header: Title, < > arrows, numerical indicator, and View All */}
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

            {/* Carousel navigation controls: Previous, Next, and Group indicator */}
            <div className="flex items-center gap-1.5 ml-1">
              <button
                type="button"
                onClick={handlePrevCarouselGroup}
                disabled={!canScrollLeft}
                aria-label="Previous carousel group"
                title="Previous group"
                className={`w-7 h-7 rounded-lg bg-[#141824] border border-white/10 flex items-center justify-center transition-all ${
                  !canScrollLeft
                    ? 'opacity-30 cursor-not-allowed text-white/30'
                    : 'text-white hover:bg-pink-600 hover:border-pink-500 hover:shadow-md hover:shadow-pink-600/30 cursor-pointer active:scale-95'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNextCarouselGroup}
                disabled={!canScrollRight && !hasMore}
                aria-label="Next carousel group"
                title="Next group"
                className={`w-7 h-7 rounded-lg bg-[#141824] border border-white/10 flex items-center justify-center transition-all ${
                  !canScrollRight && !hasMore
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

              {/* Minimalistic Numerical Indicator */}
              <div
                className="min-w-[28px] h-7 px-2 rounded-lg bg-[#141824] border border-white/10 flex items-center justify-center text-pink-400 font-bold text-xs select-none shadow-sm ml-0.5"
                title={`Group ${currentGroup}`}
                aria-live="polite"
              >
                {currentGroup}
              </div>
            </div>
          </div>

          {/* View All Button on Right */}
          {onViewAll && (
            <button
              type="button"
              onClick={onViewAll}
              aria-label="View all latest episodes"
              className="flex items-center gap-1 text-xs font-bold text-pink-400 hover:text-pink-300 transition-colors hover:underline cursor-pointer"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Carousel Horizontal Scrollable Row */}
        <div
          ref={carouselRef}
          onScroll={handleCarouselScroll}
          onKeyDown={handleCarouselKeyDown}
          tabIndex={0}
          role="region"
          aria-label={`${title} Carousel`}
          className="flex items-stretch gap-3 sm:gap-4 md:gap-5 overflow-x-auto no-scrollbar scroll-smooth pb-2 focus:outline-none focus-visible:ring-1 focus-visible:ring-pink-500/50 rounded-lg"
        >
          {animeList.map((anime, index) => (
            <div
              key={`${anime.id}-${index}`}
              ref={(el) => { cardRefs.current[index] = el; }}
              tabIndex={0}
              role="button"
              aria-label={getAnimeTitle(anime)}
              onFocus={() => setFocusedIndex(index)}
              className="w-[calc((100%-12px)/2)] sm:w-[calc((100%-32px)/3)] md:w-[calc((100%-48px)/4)] lg:w-[calc((100%-64px)/5)] xl:w-[calc((100%-80px)/6)] shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 rounded-lg transition-transform"
            >
              <AnimeCard
                anime={anime}
                onSelect={onSelectAnime}
                onPlay={onPlayAnime}
                rank={showRank ? index + 1 : undefined}
              />
            </div>
          ))}
          {isLoadingPage && (
            <div className="w-[calc((100%-12px)/2)] sm:w-[calc((100%-32px)/3)] md:w-[calc((100%-48px)/4)] lg:w-[calc((100%-64px)/5)] xl:w-[calc((100%-80px)/6)] shrink-0 aspect-[2/3] rounded-lg bg-[#11151b] animate-pulse border border-white/5 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-pink-500/60" />
            </div>
          )}
        </div>
      </section>
    );
  }

  // -------------------------
  // 2. GRID MODE (Full View / Standard Grid)
  // -------------------------
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

          {/* Navigation Buttons & Page Number Input */}
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

      {/* Grid Layout */}
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
