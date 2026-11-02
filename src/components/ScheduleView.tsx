import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Star, Play, ChevronRight } from 'lucide-react';
import { Anime } from '../types/anime';
import { getAiringSchedule } from '../services/anilist';

interface ScheduleViewProps {
  onSelectAnime: (anime: Anime) => void;
  onPlayAnime: (anime: Anime) => void;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function ScheduleView({ onSelectAnime, onPlayAnime }: ScheduleViewProps) {
  const todayIndex = new Date().getDay();
  const [selectedDay, setSelectedDay] = useState<number>(todayIndex);
  const [scheduleItems, setScheduleItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSchedule() {
      try {
        setLoading(true);
        // Current week window
        const now = Math.floor(Date.now() / 1000);
        const daySeconds = 86400;
        const startOfWeek = now - (todayIndex * daySeconds);
        const endOfWeek = startOfWeek + (7 * daySeconds);

        const items = await getAiringSchedule(startOfWeek, endOfWeek);
        setScheduleItems(items);
      } catch (err) {
        console.error('Schedule fetch error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSchedule();
  }, [todayIndex]);

  // Filter items by selected day
  const filtered = scheduleItems.filter((item) => {
    const itemDay = new Date(item.airingAt * 1000).getDay();
    return itemDay === selectedDay;
  });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white tracking-tight">Airing Schedule</h1>
            <p className="text-xs text-slate-400">Estimated broadcast timings for upcoming episodes</p>
          </div>
        </div>
      </div>

      {/* Week Day Selector */}
      <div className="grid grid-cols-7 gap-2">
        {DAYS.map((day, index) => {
          const isSelected = selectedDay === index;
          const isToday = todayIndex === index;
          return (
            <button
              key={day}
              onClick={() => setSelectedDay(index)}
              className={`p-3 rounded-xl border text-center transition-all ${
                isSelected
                  ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-600/30'
                  : 'bg-[#141724] border-white/[0.06] text-slate-300 hover:bg-[#1a1f33]'
              }`}
            >
              <div className="text-[11px] font-bold uppercase tracking-wider">{day.slice(0, 3)}</div>
              {isToday && (
                <span className="inline-block mt-1 text-[9px] px-1.5 py-0.2 rounded-full bg-pink-500 text-white font-extrabold">
                  TODAY
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* List of episodes airing on selected day */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 text-sm">Loading schedule...</div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center text-slate-400 text-sm bg-[#141724] rounded-2xl border border-white/[0.06]">
          No broadcast episodes recorded for this day.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map((item) => {
            const anime: Anime = item.media;
            const title = anime.title.english || anime.title.romaji || 'Anime';
            const airTime = new Date(item.airingAt * 1000).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={item.id}
                onClick={() => onSelectAnime(anime)}
                className="flex items-center gap-3.5 p-3 rounded-xl bg-[#141724] hover:bg-[#1a1f33] border border-white/[0.06] hover:border-purple-500/30 cursor-pointer transition-all group"
              >
                <img
                  src={anime.coverImage.medium || anime.coverImage.large}
                  alt={title}
                  className="w-14 h-20 object-cover rounded-lg flex-shrink-0 group-hover:scale-105 transition-transform"
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="flex items-center gap-1 text-[11px] text-purple-400 font-bold bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                      <Clock className="w-3 h-3" />
                      {airTime}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-400">
                      Episode {item.episode}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-100 truncate group-hover:text-purple-400 transition-colors">
                    {title}
                  </h3>

                  <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                    <span>{anime.format || 'TV'}</span>
                    {anime.averageScore && (
                      <span className="flex items-center gap-0.5 text-yellow-400">
                        <Star className="w-3 h-3 fill-yellow-400" />
                        {(anime.averageScore / 10).toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center text-slate-500 group-hover:text-purple-400 group-hover:translate-x-1 transition-all">
                  <ChevronRight className="w-5 h-5" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
