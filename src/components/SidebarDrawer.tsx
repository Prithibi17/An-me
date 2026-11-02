import React, { useState } from 'react';
import {
  ChevronLeft,
  Home,
  Film,
  Tv,
  Flame,
  Sparkles,
  Calendar,
  Layers,
  Compass,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Bookmark,
  History
} from 'lucide-react';

interface SidebarDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: string, filterParams?: any) => void;
}

const NAV_LINKS = [
  { label: 'Home', tab: 'home', icon: Home, color: 'text-red-400' },
  { label: 'Subbed Anime', tab: 'discover', filter: { language: 'SUB' }, icon: Layers, color: 'text-pink-400' },
  { label: 'Dubbed Anime', tab: 'discover', filter: { language: 'DUB' }, icon: Layers, color: 'text-blue-400' },
  { label: 'Most Popular', tab: 'discover', filter: { sort: 'POPULARITY_DESC' }, icon: Flame, color: 'text-red-400' },
  { label: 'Movies', tab: 'discover', filter: { format: 'MOVIE' }, icon: Film, color: 'text-pink-400' },
  { label: 'TV Series', tab: 'discover', filter: { format: 'TV' }, icon: Tv, color: 'text-blue-400' },
  { label: 'OVAs', tab: 'discover', filter: { format: 'OVA' }, icon: Compass, color: 'text-red-400' },
  { label: 'ONAs', tab: 'discover', filter: { format: 'ONA' }, icon: Compass, color: 'text-pink-400' },
  { label: 'Top Airing', tab: 'discover', filter: { sort: 'POPULARITY_DESC', season: 'FALL' }, icon: Flame, color: 'text-blue-400' },
  { label: 'Estimated Schedule', tab: 'schedule', icon: Calendar, color: 'text-red-400' },
  { label: 'Filter Anime', tab: 'discover', icon: SlidersHorizontal, color: 'text-pink-400' },
  { label: 'My Library', tab: 'library', icon: Bookmark, color: 'text-pink-400' },
  { label: 'Watch History', tab: 'history', icon: History, color: 'text-red-400' },
];

const POPULAR_GENRES = [
  'Action',
  'Adventure',
  'Comedy',
  'Drama',
  'Fantasy',
  'Horror',
  'Mecha',
  'Mystery',
  'Psychological',
  'Romance',
  'Sci-Fi',
  'Slice of Life',
  'Sports',
  'Supernatural',
  'Thriller',
];

export function SidebarDrawer({ isOpen, onClose, onNavigate }: SidebarDrawerProps) {
  const [genresExpanded, setGenresExpanded] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex animate-fade-in">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
      />

      {/* Drawer */}
      <div className="relative w-72 sm:w-80 max-w-[85vw] h-full bg-[#0d0f15] border-r border-white/[0.08] flex flex-col z-10 shadow-2xl overflow-y-auto">
        {/* Header with Close and Previous Logo (Rounded Corners) */}
        <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
          <div className="overflow-hidden rounded-xl">
            <img src="./anme-logo-dark.png" alt="An:me" className="h-8 object-contain rounded-xl" />
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list with balanced colors */}
        <div className="p-3 space-y-1">
          {NAV_LINKS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                onClick={() => {
                  onNavigate(item.tab, item.filter);
                  onClose();
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold text-slate-300 hover:text-white hover:bg-white/[0.06] transition-colors text-left"
              >
                <Icon className={`w-4 h-4 ${item.color}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Genres section */}
        <div className="p-4 border-t border-white/[0.06] mt-2">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-white">Genres</h4>
            <button
              onClick={() => setGenresExpanded(!genresExpanded)}
              className="text-[11px] font-bold text-blue-400 flex items-center gap-0.5"
            >
              {genresExpanded ? 'Show less' : 'Show more'}
              {genresExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {(genresExpanded ? POPULAR_GENRES : POPULAR_GENRES.slice(0, 9)).map((genre, idx) => {
              const hoverColor = idx % 3 === 0
                ? 'hover:bg-red-600'
                : idx % 3 === 1
                ? 'hover:bg-pink-600'
                : 'hover:bg-blue-600';

              return (
                <button
                  key={genre}
                  onClick={() => {
                    onNavigate('discover', { genre });
                    onClose();
                  }}
                  className={`px-2.5 py-1 rounded bg-[#161822] ${hoverColor} text-slate-300 hover:text-white text-[11px] font-semibold transition-colors`}
                >
                  {genre}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
