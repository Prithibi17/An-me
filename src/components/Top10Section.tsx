import React, { useState } from 'react';
import { Flame, Star, Play, Trophy } from 'lucide-react';
import { Anime } from '../types/anime';

interface Top10SectionProps {
  topAnime: Anime[];
  onSelectAnime: (anime: Anime) => void;
  onPlayAnime: (anime: Anime, episode?: number) => void;
}

export function Top10Section({ topAnime, onSelectAnime, onPlayAnime }: Top10SectionProps) {
  const [filter, setFilter] = useState<'today' | 'week' | 'month'>('week');

  const displayedList = topAnime.slice(0, 10);

  return (
    <div className="bg-[#141724] border border-white/[0.06] rounded-2xl p-6 mb-10 shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 mb-4 border-b border-white/[0.06] gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-md shadow-orange-500/20">
            <Trophy className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white tracking-tight">Top 10 Ranked</h2>
            <p className="text-xs text-slate-400">Most trending & highest rated anime</p>
          </div>
        </div>

        {/* Time Tabs */}
        <div className="flex items-center bg-[#1b1f30] p-1 rounded-xl border border-white/[0.06] text-xs">
          {(['today', 'week', 'month'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1 rounded-lg font-bold capitalize transition-all ${
                filter === tab
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Ranked List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {displayedList.map((anime, index) => {
          const rank = index + 1;
          const title = anime.title.english || anime.title.romaji || 'Anime';
          const poster = anime.coverImage.medium || anime.coverImage.large;

          return (
            <div
              key={anime.id}
              onClick={() => onSelectAnime(anime)}
              className="flex items-center gap-3.5 p-2.5 rounded-xl bg-[#181c2c]/70 hover:bg-[#1f2438] border border-white/[0.04] hover:border-purple-500/30 cursor-pointer transition-all group"
            >
              {/* Rank Number */}
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center font-extrabold text-sm flex-shrink-0 shadow ${
                  rank === 1
                    ? 'bg-amber-400 text-black shadow-amber-400/40'
                    : rank === 2
                    ? 'bg-slate-200 text-black shadow-slate-300/40'
                    : rank === 3
                    ? 'bg-amber-700 text-white shadow-amber-700/40'
                    : 'bg-[#252a3d] text-slate-300'
                }`}
              >
                {rank < 10 ? `0${rank}` : rank}
              </div>

              {/* Poster */}
              <img
                src={poster}
                alt={title}
                className="w-12 h-16 object-cover rounded-lg flex-shrink-0 group-hover:scale-105 transition-transform"
              />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h4 className="text-xs sm:text-sm font-bold text-slate-100 truncate group-hover:text-purple-400 transition-colors">
                  {title}
                </h4>
                <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                  {anime.averageScore && (
                    <span className="flex items-center gap-0.5 text-yellow-400 font-semibold">
                      <Star className="w-3 h-3 fill-yellow-400" />
                      {(anime.averageScore / 10).toFixed(1)}
                    </span>
                  )}
                  <span>•</span>
                  <span>{anime.format || 'TV'}</span>
                  {anime.episodes && (
                    <>
                      <span>•</span>
                      <span>{anime.episodes} eps</span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-1 mt-1 text-[10px] text-purple-300">
                  {anime.genres.slice(0, 2).join(', ')}
                </div>
              </div>

              {/* Quick Play Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPlayAnime(anime, 1);
                }}
                className="w-8 h-8 rounded-lg bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white flex items-center justify-center transition-all flex-shrink-0"
              >
                <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
