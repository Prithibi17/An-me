import React, { useState, useEffect } from 'react';
import { Play, ChevronLeft, ChevronRight, Subtitles, Mic, Calendar, Clock, Plus, Check } from 'lucide-react';
import { Anime } from '../types/anime';
import { getAnimeTitle } from '../services/titleHelper';
import { saveToWatchlist, getWatchlist } from '../services/storage';

interface HiAnimeSpotlightProps {
  spotlightList: Anime[];
  onPlay: (anime: Anime, episode?: number) => void;
  onOpenDetails: (anime: Anime) => void;
}

export function HiAnimeSpotlight({ spotlightList, onPlay, onOpenDetails }: HiAnimeSpotlightProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [savedIds, setSavedIds] = useState<number[]>([]);

  const list = spotlightList.slice(0, 10);

  useEffect(() => {
    setSavedIds(getWatchlist().map((i) => i.anime.id));
  }, []);

  useEffect(() => {
    if (isPaused || list.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % list.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [isPaused, list.length]);

  if (list.length === 0) return null;

  const current = list[currentIndex];
  const title = getAnimeTitle(current);
  const bannerUrl = current.bannerImage || current.coverImage.extraLarge || current.coverImage.large;
  const isSaved = savedIds.includes(current.id);

  const cleanDescription = (current.description || '')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .trim();

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + list.length) % list.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % list.length);
  };

  const handleToggleWatchlist = () => {
    saveToWatchlist(current, 'watching');
    setSavedIds((prev) => [...prev, current.id]);
  };

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative w-full h-[380px] sm:h-[440px] md:h-[480px] overflow-hidden bg-[#0d0f15] select-none rounded-xl mb-4 border border-white/10 shadow-2xl"
    >
      {/* Full Hero Landscape Banner */}
      <div className="absolute inset-0 pointer-events-none">
        <img
          src={bannerUrl || ''}
          alt={title}
          className="w-full h-full object-cover object-right md:object-center opacity-75 md:opacity-85 transition-opacity duration-700 ease-in-out"
        />
        {/* Cinematic multi-tint scrims: Red tint on left, Blue on top-right, Dark bottom */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0b0e] via-[#0a0b0e]/85 md:via-[#0a0b0e]/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0b0e] via-transparent to-[#0a0b0e]/30" />
      </div>

      {/* Foreground Content */}
      <div className="relative z-10 w-full h-full max-w-[1720px] mx-auto px-6 lg:px-8 flex items-center justify-between gap-6">
        <div className="flex max-w-3xl items-center gap-4 sm:gap-6 py-6">
          <div className="max-w-xl lg:max-w-2xl flex flex-col gap-2.5">
            {/* Spotlight Rank: Tri-Color Badge */}
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-red-500/20 via-pink-500/20 to-blue-500/20 border border-pink-500/40 text-xs sm:text-sm font-extrabold text-pink-400 tracking-wide flex items-center gap-1.5 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                #{currentIndex + 1} Spotlight
              </span>
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight leading-tight line-clamp-2 drop-shadow-md">
              {title}
            </h1>

            {/* Metadata badges with Pink, Blue, and Red equal balance */}
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-white/80">
              {/* Red Accent: Format */}
              <span className="flex items-center gap-1 text-red-400 font-extrabold">
                <Play className="w-3.5 h-3.5 fill-current text-red-400" /> {current.format || 'TV'}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-white/60">
                <Clock className="w-3.5 h-3.5 text-blue-400" /> {current.duration || 24}m
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-white/60">
                <Calendar className="w-3.5 h-3.5 text-pink-400" /> {current.seasonYear || new Date().getFullYear()}
              </span>
              <span>•</span>
              {/* Pink & Blue Badges */}
              <div className="flex items-center gap-1">
                <span className="px-2 py-0.5 rounded bg-pink-600 text-white text-[10px] font-black flex items-center gap-0.5 shadow-sm shadow-pink-600/30">
                  <Subtitles className="w-2.5 h-2.5" /> SUB {current.episodes || 12}
                </span>
                {(current.dubEpisodeCount || 0) > 0 && (
                  <span className="px-2 py-0.5 rounded bg-blue-600 text-white text-[10px] font-black flex items-center gap-0.5 shadow-sm shadow-blue-600/30">
                    <Mic className="w-2.5 h-2.5" /> DUB {current.dubEpisodeCount}
                  </span>
                )}
              </div>
            </div>

            {/* Synopsis */}
            <p className="text-xs sm:text-sm text-slate-300 line-clamp-3 leading-relaxed drop-shadow max-w-xl">
              {cleanDescription || 'Explore this acclaimed title now streaming on An:me.'}
            </p>

            {/* Action Buttons: Red/Pink/Blue Tri-gradient */}
            <div className="flex items-center gap-3 mt-3">
              <button
                onClick={() => onPlay(current, 1)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-red-600 via-pink-600 to-blue-600 hover:from-red-500 hover:via-pink-500 hover:to-blue-500 text-white font-extrabold text-xs sm:text-sm transition-all shadow-lg shadow-pink-600/30 hover:scale-[1.03] active:scale-[0.98]"
              >
                <Play className="w-4 h-4 fill-white" />
                Watch Now
              </button>

              {/* Blue Accent Detail button */}
              <button
                onClick={() => onOpenDetails(current)}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#181a24] hover:bg-blue-600/20 border border-blue-500/30 hover:border-blue-500 text-blue-300 hover:text-white font-bold text-xs sm:text-sm transition-all hover:scale-[1.02]"
              >
                Detail
                <ChevronRight className="w-4 h-4 text-blue-400" />
              </button>

              {/* Red Accent Bookmark button */}
              <button
                onClick={handleToggleWatchlist}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-bold border transition-all ${
                  isSaved
                    ? 'bg-red-500/20 border-red-500/40 text-red-300'
                    : 'bg-[#181a24] hover:bg-red-600/20 border-red-500/30 text-red-300 hover:text-white'
                }`}
              >
                {isSaved ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                {isSaved ? 'In Library' : 'Bookmark'}
              </button>
            </div>
          </div>
        </div>

        {/* Carousel Prev/Next Buttons */}
        <div className="hidden sm:flex flex-col gap-2">
          <button
            onClick={handlePrev}
            className="w-10 h-10 rounded-full bg-black/60 hover:bg-blue-600 text-white flex items-center justify-center backdrop-blur-md border border-white/10 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={handleNext}
            className="w-10 h-10 rounded-full bg-black/60 hover:bg-pink-600 text-white flex items-center justify-center backdrop-blur-md border border-white/10 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
