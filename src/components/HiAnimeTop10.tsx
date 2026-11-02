import React, { useState } from 'react';
import { Trophy } from 'lucide-react';
import { Anime } from '../types/anime';
import { CinematicMediaRow } from './CinematicMediaRow';

interface HiAnimeTop10Props {
  topAnime: Anime[];
  onSelectAnime: (anime: Anime) => void;
}

export function HiAnimeTop10({ topAnime, onSelectAnime }: HiAnimeTop10Props) {
  const [activeTab, setActiveTab] = useState<'Today' | 'Week' | 'Month'>('Today');

  const getTabList = () => {
    if (activeTab === 'Today') return topAnime.slice(0, 10);
    if (activeTab === 'Week') return [...topAnime].reverse().slice(0, 10);
    return topAnime.slice(0, 10);
  };

  const animeList = getTabList();

  const getTabActiveStyle = (tab: 'Today' | 'Week' | 'Month') => {
    if (activeTab !== tab) return 'text-white/50 hover:text-white';
    if (tab === 'Today') return 'bg-red-600 text-white shadow-md shadow-red-600/30';
    if (tab === 'Week') return 'bg-pink-600 text-white shadow-md shadow-pink-600/30';
    return 'bg-blue-600 text-white shadow-md shadow-blue-600/30';
  };

  return (
    <section className="mb-6 flex w-full flex-col gap-3 rounded-xl border border-white/[0.07] bg-[#0f1218]/90 p-3.5 shadow-[0_18px_48px_rgba(0,0,0,0.18)]">
      <div className="flex items-center justify-between border-b border-white/[0.07] pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-red-500 via-pink-500 to-blue-500 flex items-center justify-center text-white">
            <Trophy className="w-3.5 h-3.5" />
          </div>
          <h3 className="text-base font-black uppercase tracking-[0.08em] text-white">Top 10</h3>
        </div>

        {/* Tabs: Today (Red), Week (Pink), Month (Blue) */}
        <div className="flex rounded-lg border border-white/[0.07] bg-black/20 p-0.5 text-[10px] font-bold">
          {(['Today', 'Week', 'Month'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded-md px-2.5 py-1 font-bold transition-all ${getTabActiveStyle(tab)}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {animeList.map((item, index) => (
          <CinematicMediaRow
            key={item.id}
            anime={item}
            rank={index + 1}
            onSelect={onSelectAnime}
          />
        ))}
      </div>
    </section>
  );
}
