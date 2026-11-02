import React, { useState, useEffect, useMemo } from 'react';
import { Play, Clock, Calendar } from 'lucide-react';
import { Anime } from '../types/anime';
import { getAiringSchedule } from '../services/anilist';

interface EstimatedScheduleProps {
  onSelectAnime: (anime: Anime) => void;
  onPlayAnime: (anime: Anime) => void;
}

export function EstimatedSchedule({ onSelectAnime, onPlayAnime }: EstimatedScheduleProps) {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const days = useMemo(() => {
    const list: { day: string; date: string; dateStr: string; timestamp: number; isToday: boolean }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = -3; i <= 3; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dayShort = d.toLocaleDateString(undefined, { weekday: 'short' });
      const dateShort = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      const dateStr = d.toDateString();

      list.push({
        day: dayShort,
        date: dateShort,
        dateStr,
        timestamp: Math.floor(d.getTime() / 1000),
        isToday: i === 0,
      });
    }
    return list;
  }, []);

  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today.toDateString();
  });

  const timezoneStr = useMemo(() => {
    try {
      const offsetMinutes = -new Date().getTimezoneOffset();
      const sign = offsetMinutes >= 0 ? '+' : '-';
      const hours = String(Math.floor(Math.abs(offsetMinutes) / 60)).padStart(2, '0');
      const mins = String(Math.abs(offsetMinutes) % 60).padStart(2, '0');
      return `GMT${sign}${hours}:${mins}`;
    } catch {
      return 'GMT';
    }
  }, []);

  useEffect(() => {
    async function fetchWeekly() {
      try {
        setLoading(true);
        const now = Math.floor(Date.now() / 1000);
        const daySeconds = 86400;
        const start = now - 3 * daySeconds;
        const end = now + 4 * daySeconds;
        const data = await getAiringSchedule(start, end);
        setSchedules(data);
      } catch (err) {
        console.error('Failed to fetch schedule:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchWeekly();
  }, []);

  const daySchedules = useMemo(() => {
    return schedules.filter((item) => {
      const itemDate = new Date(item.airingAt * 1000);
      itemDate.setHours(0, 0, 0, 0);
      return itemDate.toDateString() === selectedDateStr;
    });
  }, [schedules, selectedDateStr]);

  return (
    <section className="my-6 rounded-xl border border-white/[0.07] bg-[#0f1218]/90 p-4 shadow-[0_18px_48px_rgba(0,0,0,0.18)]">
      {/* Header with Blue icon and tri-color subtitle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-white/[0.07] gap-2">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-400" />
          <h3 className="text-base font-black uppercase tracking-[0.08em] text-white">Estimated Schedule</h3>
        </div>
        <span className="text-xs font-semibold text-slate-400">
          ( {timezoneStr} )
        </span>
      </div>

      {/* 7-Day Strip with Tri-Color Highlight */}
      <div className="my-3 flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {days.map((item) => {
          const isSelected = item.dateStr === selectedDateStr;
          return (
            <button
              key={item.dateStr}
              onClick={() => setSelectedDateStr(item.dateStr)}
              className={`flex-1 min-w-[70px] rounded-lg py-2 px-1 text-center border transition-all ${
                isSelected
                  ? 'bg-gradient-to-r from-red-600 via-pink-600 to-blue-600 border-transparent text-white font-extrabold shadow-lg shadow-pink-600/30'
                  : 'bg-[#161b24] border-white/5 text-slate-300 hover:bg-[#1f2533]'
              }`}
            >
              <div className="text-[11px] font-bold uppercase">{item.day}</div>
              <div className="text-[10px] opacity-75 mt-0.5">{item.date}</div>
            </button>
          );
        })}
      </div>

      {/* Schedule List */}
      <div className="divide-y divide-white/[0.04]">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading broadcast schedule...</div>
        ) : daySchedules.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">No estimated airings for this date.</div>
        ) : (
          daySchedules.map((item) => {
            const anime = item.media;
            const title = anime.title.english || anime.title.romaji || 'Anime';
            const timeStr = new Date(item.airingAt * 1000).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            });

            return (
              <div
                key={item.id}
                onClick={() => onSelectAnime(anime)}
                className="flex items-center justify-between py-2.5 px-2 hover:bg-white/[0.04] rounded-lg cursor-pointer transition-colors group"
              >
                {/* Blue Time */}
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs font-mono font-bold text-blue-400 shrink-0">
                    {timeStr}
                  </span>
                  <h4 className="text-xs sm:text-sm font-semibold text-slate-200 truncate group-hover:text-pink-400 transition-colors">
                    {title}
                  </h4>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Pink Episode */}
                  <span className="px-2 py-0.5 rounded bg-pink-500/15 text-pink-300 border border-pink-500/20 text-[11px] font-bold">
                    Episode {item.episode}
                  </span>
                  {/* Red Play */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onPlayAnime(anime);
                    }}
                    className="w-7 h-7 rounded-lg bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white flex items-center justify-center transition-colors"
                  >
                    <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
