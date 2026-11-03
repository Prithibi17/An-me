import React, { useState, useEffect } from 'react';
import { Play, Clock, Check, X, Sparkles } from 'lucide-react';
import { getContinueWatchingList, AnimeWatchState, WATCH_PROGRESS_EVENT, markEpisodeUnwatched } from '../../services/watchProgress';
import { getAnimeDetails } from '../../services/anilist';
import { Anime } from '../../types/anime';

interface ContinueWatchingSectionProps {
  onPlayEpisode: (animeId: number, episode: number) => void;
  onOpenDetails: (anime: Anime) => void;
}

export function ContinueWatchingSection({ onPlayEpisode, onOpenDetails }: ContinueWatchingSectionProps) {
  const [list, setList] = useState<AnimeWatchState[]>([]);

  const loadData = () => {
    const items = getContinueWatchingList();
    // Filter to items that have at least one watching or watched episode
    const active = items.filter((item) => {
      const ep = item.episodes[item.currentEpisode];
      return ep && (ep.status === 'watching' || ep.status === 'watched');
    });
    setList(active.slice(0, 8));
  };

  useEffect(() => {
    loadData();

    const handleSync = () => {
      loadData();
    };

    window.addEventListener(WATCH_PROGRESS_EVENT, handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener(WATCH_PROGRESS_EVENT, handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  if (list.length === 0) {
    return null;
  }

  const handleDismiss = (e: React.MouseEvent, animeId: number, episode: number) => {
    e.stopPropagation();
    markEpisodeUnwatched(animeId, episode);
    loadData();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <section className="rounded-2xl border border-white/[0.08] bg-[#0d1017]/95 p-4 sm:p-5 shadow-xl animate-fade-in">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-pink-400" />
          <h3 className="text-sm font-black uppercase tracking-wider text-white">
            Continue Watching
          </h3>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300">
            {list.length} in progress
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
        {list.map((item) => {
          const currentEp = item.episodes[item.currentEpisode];
          const isCompleted = currentEp?.status === 'watched';
          const percent = currentEp?.progressPercent || 0;
          const posSeconds = currentEp?.currentTime || 0;

          return (
            <div
              key={item.animeId}
              onClick={() => onPlayEpisode(item.animeId, item.currentEpisode)}
              className="group relative flex gap-3 p-2.5 rounded-xl bg-[#131722] hover:bg-[#1a2030] border border-white/[0.06] hover:border-pink-500/40 transition-all cursor-pointer shadow-md overflow-hidden"
            >
              {/* Poster Thumbnail */}
              <div className="relative w-16 aspect-[2/3] rounded-lg overflow-hidden bg-black/60 shrink-0">
                <img
                  src={item.coverImage || './anme-logo-dark.png'}
                  alt={item.title}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = './anme-logo-dark.png';
                  }}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                  <div className="w-7 h-7 rounded-full bg-pink-600 text-white flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                    <Play className="w-3 h-3 fill-white ml-0.5" />
                  </div>
                </div>
              </div>

              {/* Text Info */}
              <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                <div>
                  <div className="flex items-center justify-between gap-1">
                    <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded ${
                      isCompleted
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-pink-500/20 text-pink-300 border border-pink-500/30'
                    }`}>
                      {isCompleted ? 'Watched' : 'Watching'}
                    </span>
                    <button
                      onClick={(e) => handleDismiss(e, item.animeId, item.currentEpisode)}
                      className="text-white/30 hover:text-white p-0.5 cursor-pointer"
                      title="Remove from continue watching"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>

                  <h4 className="text-xs font-bold text-white truncate group-hover:text-pink-400 transition-colors mt-1">
                    {item.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 font-semibold">
                    Episode {item.currentEpisode}
                  </p>
                </div>

                {/* Progress bar */}
                <div className="mt-2">
                  <div className="flex items-center justify-between text-[9px] text-slate-400 mb-1">
                    <span>{isCompleted ? 'Completed' : `${formatTime(posSeconds)} left off`}</span>
                    <span className="font-bold text-slate-300">{percent}%</span>
                  </div>
                  <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isCompleted ? 'bg-emerald-500' : 'bg-gradient-to-r from-red-500 to-pink-500'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
