import React, { useState, useEffect } from 'react';
import { History, Play, Trash2, Clock } from 'lucide-react';
import { WatchHistoryItem } from '../types/anime';
import { getWatchHistory, clearWatchHistory } from '../services/storage';

interface HistoryViewProps {
  onResume: (animeId: number, episode: number) => void;
}

export function HistoryView({ onResume }: HistoryViewProps) {
  const [history, setHistory] = useState<WatchHistoryItem[]>([]);

  const loadData = () => {
    setHistory(getWatchHistory());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleClear = () => {
    if (confirm('Clear all watch history?')) {
      clearWatchHistory();
      loadData();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white tracking-tight">Watch History</h1>
            <p className="text-xs text-slate-400">Jump right back into recently played anime</p>
          </div>
        </div>

        {history.length > 0 && (
          <button
            onClick={handleClear}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear History
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="py-24 text-center bg-[#141724] rounded-2xl border border-white/[0.06]">
          <History className="w-10 h-10 mx-auto text-slate-500 mb-3" />
          <h3 className="text-base font-bold text-slate-200">No watch history yet</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
            Whenever you stream an episode in An:me, it will be automatically saved here for quick resumption.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {history.map((item) => {
            const timeAgo = new Date(item.lastUpdated).toLocaleDateString([], {
              month: 'short',
              day: 'numeric',
            });

            return (
              <div
                key={`${item.animeId}-${item.episode}`}
                onClick={() => onResume(item.animeId, item.episode)}
                className="group p-3 rounded-2xl bg-[#141724] hover:bg-[#1a1f33] border border-white/[0.06] hover:border-purple-500/30 cursor-pointer transition-all flex flex-col justify-between"
              >
                <div className="flex gap-3">
                  <img
                    src={item.coverImage}
                    alt={item.title}
                    className="w-16 h-22 object-cover rounded-xl flex-shrink-0 group-hover:scale-105 transition-transform"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="inline-block px-2 py-0.5 rounded-md bg-purple-600/20 text-purple-300 font-bold text-[10px] border border-purple-500/30 mb-1">
                      Episode {item.episode}
                    </span>
                    <h3 className="text-xs font-bold text-slate-100 truncate group-hover:text-purple-400 transition-colors">
                      {item.title}
                    </h3>
                    <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-2">
                      <Clock className="w-3 h-3" />
                      <span>{timeAgo}</span>
                    </div>
                  </div>
                </div>

                {/* Progress bar and Resume button */}
                <div className="mt-3 pt-3 border-t border-white/[0.04] flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-400">
                    {item.totalEpisodes ? `${item.episode} / ${item.totalEpisodes} eps` : `Episode ${item.episode}`}
                  </span>
                  <button className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-purple-600 group-hover:bg-purple-500 text-white font-bold text-xs shadow-md transition-colors">
                    <Play className="w-3 h-3 fill-white" />
                    Resume
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
