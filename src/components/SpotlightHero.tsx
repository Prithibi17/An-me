import React, { useState, useEffect } from 'react';
import { Play, Plus, Check, Info, Star, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { Anime, WatchlistStatus } from '../types/anime';
import { saveToWatchlist, getWatchlist } from '../services/storage';

interface SpotlightHeroProps {
  animeList: Anime[];
  onPlay: (anime: Anime, episode?: number) => void;
  onOpenDetails: (anime: Anime) => void;
}

export function SpotlightHero({ animeList, onPlay, onOpenDetails }: SpotlightHeroProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [watchlistIds, setWatchlistIds] = useState<number[]>([]);

  useEffect(() => {
    const list = getWatchlist();
    setWatchlistIds(list.map((item) => item.anime.id));
  }, []);

  // Auto rotate banner every 7 seconds
  useEffect(() => {
    if (animeList.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % animeList.length);
    }, 7000);
    return () => clearInterval(timer);
  }, [animeList.length]);

  if (!animeList || animeList.length === 0) return null;

  const currentAnime = animeList[currentIndex];
  const title = currentAnime.title.english || currentAnime.title.romaji || 'Anime';
  const banner = currentAnime.bannerImage || currentAnime.coverImage.extraLarge || currentAnime.coverImage.large;
  const isSaved = watchlistIds.includes(currentAnime.id);

  const cleanDescription = (currentAnime.description || '')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .trim();

  const handleToggleWatchlist = () => {
    if (isSaved) {
      // Keep it in watching
    } else {
      saveToWatchlist(currentAnime, 'watching');
      setWatchlistIds((prev) => [...prev, currentAnime.id]);
    }
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? animeList.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % animeList.length);
  };

  return (
    <div className="relative w-full h-[400px] md:h-[460px] rounded-2xl overflow-hidden mb-8 border border-white/[0.08] shadow-2xl bg-[#141724]">
      {/* Background Banner with gradient scrims */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-all duration-700 filter brightness-[0.65] transform scale-105"
        style={{ backgroundImage: `url(${banner})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0b0d14] via-[#0b0d14]/70 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0b0d14] via-[#0b0d14]/80 to-transparent" />

      {/* Content Overlay */}
      <div className="relative h-full flex flex-col justify-end p-6 md:p-10 max-w-3xl z-10">
        {/* Spotlight Rank & Tags */}
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2.5 py-1 rounded-md bg-purple-600/90 text-white font-extrabold text-[11px] tracking-wider uppercase flex items-center gap-1 shadow-md shadow-purple-600/30">
            <Sparkles className="w-3 h-3 text-pink-300" />
            Spotlight #{currentIndex + 1}
          </span>
          {currentAnime.format && (
            <span className="px-2 py-0.5 rounded-md bg-white/10 text-slate-300 text-xs font-semibold backdrop-blur-sm border border-white/10">
              {currentAnime.format}
            </span>
          )}
          {currentAnime.averageScore && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-yellow-500/20 text-yellow-300 text-xs font-bold border border-yellow-500/30">
              <Star className="w-3 h-3 fill-yellow-400" />
              {(currentAnime.averageScore / 10).toFixed(1)}
            </span>
          )}
          {currentAnime.status && (
            <span className="hidden sm:inline px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
              {currentAnime.status}
            </span>
          )}
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight line-clamp-2 leading-tight mb-2 drop-shadow-lg">
          {title}
        </h1>

        {/* Genres */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {currentAnime.genres.slice(0, 4).map((genre) => (
            <span key={genre} className="text-[11px] font-semibold text-purple-300 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-500/20">
              {genre}
            </span>
          ))}
          {currentAnime.episodes && (
            <span className="text-[11px] text-slate-400 self-center ml-1">
              • {currentAnime.episodes} Episodes
            </span>
          )}
        </div>

        {/* Description snippet */}
        <p className="text-xs sm:text-sm text-slate-300 line-clamp-2 md:line-clamp-3 mb-5 leading-relaxed max-w-2xl drop-shadow">
          {cleanDescription || 'Dive into an unforgettable story in this acclaimed anime.'}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => onPlay(currentAnime, 1)}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-xl shadow-purple-600/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Play className="w-4 h-4 fill-white" />
            Watch Now
          </button>

          <button
            onClick={handleToggleWatchlist}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm backdrop-blur-md border transition-all ${
              isSaved
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                : 'bg-white/10 hover:bg-white/15 border-white/10 text-white'
            }`}
          >
            {isSaved ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {isSaved ? 'In Watchlist' : 'Watchlist'}
          </button>

          <button
            onClick={() => onOpenDetails(currentAnime)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white font-semibold text-xs sm:text-sm transition-all"
          >
            <Info className="w-4 h-4" />
            Details
          </button>
        </div>
      </div>

      {/* Prev / Next controls */}
      <div className="absolute right-4 bottom-6 flex items-center gap-2 z-20">
        <button
          onClick={handlePrev}
          className="w-9 h-9 rounded-xl bg-black/40 hover:bg-black/70 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/80 hover:text-white transition-all hover:scale-105"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-xs font-semibold text-slate-400 px-1">
          {currentIndex + 1} / {animeList.length}
        </span>
        <button
          onClick={handleNext}
          className="w-9 h-9 rounded-xl bg-black/40 hover:bg-black/70 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/80 hover:text-white transition-all hover:scale-105"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
