import React, { useState, useEffect } from 'react';
import { Bookmark, Play, Trash2, CheckCircle2, Clock, Heart, Eye, Database } from 'lucide-react';
import { Anime, WatchlistItem, WatchlistStatus } from '../types/anime';
import { getAnimeTitle } from '../services/titleHelper';
import { getWatchlist, removeFromWatchlist, saveToWatchlist } from '../services/storage';
import { getCurrentUser } from '../services/auth';
import { addAnimeToCloud, removeAnimeFromCloud } from '../services/librarySync';

interface LibraryViewProps {
  onSelectAnime: (anime: Anime) => void;
  onPlayAnime: (anime: Anime, episode?: number) => void;
  onUpdateCount: () => void;
}

export function LibraryView({ onSelectAnime, onPlayAnime, onUpdateCount }: LibraryViewProps) {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [currentFilter, setCurrentFilter] = useState<WatchlistStatus | 'all'>('all');

  const loadData = () => {
    const list = getWatchlist();
    setItems(list);
    onUpdateCount();
  };

  useEffect(() => {
    loadData();
  }, []);

  const currentUser = getCurrentUser();

  const handleRemove = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    removeFromWatchlist(id);
    if (currentUser) {
      removeAnimeFromCloud(currentUser, id);
    }
    loadData();
  };

  const handleStatusChange = (anime: Anime, newStatus: WatchlistStatus, e: React.ChangeEvent<HTMLSelectElement>) => {
    e.stopPropagation();
    saveToWatchlist(anime, newStatus);
    if (currentUser) {
      addAnimeToCloud(currentUser, anime, newStatus);
    }
    loadData();
  };

  const filteredItems = currentFilter === 'all'
    ? items
    : items.filter((item) => item.status === currentFilter);

  const tabs: Array<{ id: WatchlistStatus | 'all'; label: string; icon: any }> = [
    { id: 'all', label: 'All', icon: Bookmark },
    { id: 'watching', label: 'Watching', icon: Eye },
    { id: 'plan_to_watch', label: 'Plan to Watch', icon: Clock },
    { id: 'completed', label: 'Completed', icon: CheckCircle2 },
    { id: 'favorite', label: 'Favorites', icon: Heart },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/[0.06] gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Bookmark className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-white tracking-tight">My Anime Library</h1>
              {currentUser && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold flex items-center gap-1">
                  <Database className="w-2.5 h-2.5" /> Synced to Web
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">Manage your watchlists, saved favorites and tracked progress</p>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center bg-[#141724] p-1 rounded-xl border border-white/[0.06] text-xs self-start sm:self-auto overflow-x-auto max-w-full">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const count = tab.id === 'all' ? items.length : items.filter((i) => i.status === tab.id).length;
            const isActive = currentFilter === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setCurrentFilter(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-purple-800' : 'bg-white/10'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid or Empty State */}
      {filteredItems.length === 0 ? (
        <div className="py-24 text-center bg-[#141724] rounded-2xl border border-white/[0.06]">
          <Bookmark className="w-10 h-10 mx-auto text-slate-500 mb-3" />
          <h3 className="text-base font-bold text-slate-200">No anime in this section</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
            Browse anime from the Home or Discover page and click "Add to Watchlist" to save them here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
          {filteredItems.map(({ anime, status, lastWatchedEpisode }) => {
            const title = getAnimeTitle(anime);
            const poster = anime.coverImage.large || anime.coverImage.medium;

            return (
              <div
                key={anime.id}
                onClick={() => onSelectAnime(anime)}
                className="group relative flex flex-col cursor-pointer transition-transform duration-200 hover:-translate-y-1"
              >
                <div className="relative aspect-[3/4.2] w-full rounded-xl overflow-hidden bg-[#181c2c] border border-white/[0.06] shadow-md group-hover:shadow-xl group-hover:border-purple-500/40 transition-all">
                  <img
                    src={poster}
                    alt={title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />

                  {/* Status Badge */}
                  <div className="absolute top-2 left-2">
                    <span className="px-2 py-0.5 rounded-md bg-purple-600/90 text-white font-bold text-[10px] tracking-wide uppercase shadow">
                      {status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  {/* Quick Delete */}
                  <button
                    onClick={(e) => handleRemove(anime.id, e)}
                    title="Remove from Library"
                    className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-black/60 hover:bg-red-600 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  {/* Bottom play trigger */}
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                    {lastWatchedEpisode ? (
                      <span className="text-[11px] font-semibold text-purple-300 bg-black/70 px-2 py-0.5 rounded">
                        Ep {lastWatchedEpisode}
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400">
                        {anime.episodes ? `${anime.episodes} eps` : 'Ongoing'}
                      </span>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onPlayAnime(anime, lastWatchedEpisode || 1);
                      }}
                      className="w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center shadow hover:scale-105 transition-transform"
                    >
                      <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-2 px-0.5">
                  <h3 className="text-xs font-bold text-slate-200 truncate group-hover:text-purple-400 transition-colors">
                    {title}
                  </h3>
                  {/* Status quick select */}
                  <select
                    value={status}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => handleStatusChange(anime, e.target.value as WatchlistStatus, e)}
                    className="mt-1 w-full bg-[#1b1f30] text-[10px] text-slate-300 border border-white/[0.06] rounded px-1.5 py-0.5 focus:outline-none"
                  >
                    <option value="watching">Watching</option>
                    <option value="plan_to_watch">Plan to Watch</option>
                    <option value="completed">Completed</option>
                    <option value="dropped">Dropped</option>
                    <option value="favorite">Favorite</option>
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
