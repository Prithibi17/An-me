import React, { useState, useEffect } from 'react';
import {
  X,
  Play,
  Star,
  Users,
  Tv,
  Layers
} from 'lucide-react';
import { Anime, WatchlistStatus } from '../types/anime';
import { getAnimeDetails } from '../services/anilist';
import { saveToWatchlist, getWatchlist } from '../services/storage';

interface AnimeDetailModalProps {
  anime: Anime;
  onClose: () => void;
  onPlayEpisode: (anime: Anime, episode: number) => void;
  onSelectRelated: (anime: Anime) => void;
}

export function AnimeDetailModal({
  anime,
  onClose,
  onPlayEpisode,
  onSelectRelated,
}: AnimeDetailModalProps) {
  const [details, setDetails] = useState<Anime>(anime);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'episodes' | 'characters' | 'relations'>('episodes');
  const [selectedRange, setSelectedRange] = useState(0);
  const [watchlistStatus, setWatchlistStatus] = useState<WatchlistStatus | null>(null);

  useEffect(() => {
    const list = getWatchlist();
    const item = list.find((i) => i.anime.id === anime.id);
    if (item) setWatchlistStatus(item.status);
  }, [anime.id]);

  useEffect(() => {
    async function loadFullDetails() {
      try {
        setLoading(true);
        const full = await getAnimeDetails(anime.id);
        setDetails(full);
      } catch (err) {
        console.error('Failed to load full anime details:', err);
      } finally {
        setLoading(false);
      }
    }
    loadFullDetails();
  }, [anime.id]);

  const title = details.title.english || details.title.romaji || 'Anime';
  const banner = details.bannerImage || details.coverImage.extraLarge || details.coverImage.large;
  const poster = details.coverImage.large || details.coverImage.medium;

  const totalEpisodes = details.episodes || 12;
  const episodesPerPage = 25;
  const rangeCount = Math.ceil(totalEpisodes / episodesPerPage);

  const cleanDescription = (details.description || '')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .trim();

  const handleSetStatus = (status: WatchlistStatus) => {
    saveToWatchlist(details, status);
    setWatchlistStatus(status);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-[#0c0e14] border border-white/10 rounded-2xl shadow-2xl overflow-y-auto flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-30 w-9 h-9 rounded-full bg-black/60 hover:bg-white/20 text-white flex items-center justify-center backdrop-blur-md border border-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Hero Header with Banner */}
        <div className="relative h-64 sm:h-72 w-full overflow-hidden shrink-0 bg-[#161a24]">
          <img
            src={banner || poster}
            alt={title}
            className="w-full h-full object-cover filter brightness-[0.55]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0c0e14] via-[#0c0e14]/60 to-transparent" />

          {/* Quick Play Float */}
          <div className="absolute bottom-6 left-6 sm:left-10 flex items-end gap-5">
            <img
              src={poster}
              alt={title}
              className="w-24 sm:w-32 aspect-[3/4.2] object-cover rounded-xl border-2 border-pink-500/40 shadow-2xl shrink-0 -mb-2"
            />
            <div className="text-white pb-2">
              <div className="flex items-center gap-2 mb-1.5">
                {details.averageScore && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-yellow-500/20 text-yellow-300 text-xs font-bold border border-yellow-500/30">
                    <Star className="w-3.5 h-3.5 fill-yellow-400" />
                    {(details.averageScore / 10).toFixed(1)} Rating
                  </span>
                )}
                <span className="px-2 py-0.5 rounded-md bg-red-500/20 text-red-300 text-xs font-bold border border-red-500/30">
                  {details.format || 'TV'}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-500/30">
                  {totalEpisodes} Episodes
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-snug drop-shadow line-clamp-2">
                {title}
              </h2>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6 flex-1">
          {/* Action Row & Watchlist selector */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-3">
              <button
                onClick={() => onPlayEpisode(details, 1)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 via-pink-600 to-blue-600 hover:from-red-500 hover:to-blue-500 text-white font-bold text-xs sm:text-sm shadow-xl shadow-pink-600/30 transition-all hover:scale-[1.02]"
              >
                <Play className="w-4 h-4 fill-white" />
                Play Episode 1
              </button>

              <div className="flex items-center gap-1.5 bg-[#161a24] p-1 rounded-xl border border-white/[0.08]">
                <button
                  onClick={() => handleSetStatus('watching')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    watchlistStatus === 'watching'
                      ? 'bg-pink-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Watching
                </button>
                <button
                  onClick={() => handleSetStatus('plan_to_watch')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    watchlistStatus === 'plan_to_watch'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Plan to Watch
                </button>
                <button
                  onClick={() => handleSetStatus('completed')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    watchlistStatus === 'completed'
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Completed
                </button>
              </div>
            </div>

            {/* Studio / Season tag */}
            <div className="flex items-center gap-2 text-xs text-slate-400">
              {details.studios?.nodes?.[0] && (
                <span className="font-semibold text-slate-300">
                  Studio: {details.studios.nodes[0].name}
                </span>
              )}
              {details.season && (
                <span>• {details.season} {details.seasonYear}</span>
              )}
            </div>
          </div>

          {/* Synopsis */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Synopsis</h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {cleanDescription || 'No detailed synopsis available.'}
            </p>
          </div>

          {/* Tri-Color Genres */}
          <div className="flex flex-wrap gap-2">
            {details.genres.map((genre, idx) => {
              const chipColor = idx % 3 === 0
                ? 'text-red-300 border-red-500/20 bg-red-950/40'
                : idx % 3 === 1
                ? 'text-pink-300 border-pink-500/20 bg-pink-950/40'
                : 'text-blue-300 border-blue-500/20 bg-blue-950/40';

              return (
                <span
                  key={genre}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${chipColor}`}
                >
                  {genre}
                </span>
              );
            })}
          </div>

          {/* Tab Navigation with Red / Pink / Blue */}
          <div className="flex items-center gap-4 border-b border-white/[0.06] pt-2">
            <button
              onClick={() => setActiveTab('episodes')}
              className={`pb-2.5 text-xs font-extrabold flex items-center gap-2 border-b-2 transition-all ${
                activeTab === 'episodes'
                  ? 'border-pink-500 text-pink-400'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Tv className="w-4 h-4 text-pink-400" />
              Episodes ({totalEpisodes})
            </button>
            <button
              onClick={() => setActiveTab('characters')}
              className={`pb-2.5 text-xs font-extrabold flex items-center gap-2 border-b-2 transition-all ${
                activeTab === 'characters'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4 text-blue-400" />
              Characters
            </button>
            <button
              onClick={() => setActiveTab('relations')}
              className={`pb-2.5 text-xs font-extrabold flex items-center gap-2 border-b-2 transition-all ${
                activeTab === 'relations'
                  ? 'border-red-500 text-red-400'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-4 h-4 text-red-400" />
              Related Anime
            </button>
          </div>

          {/* Tab: Episodes */}
          {activeTab === 'episodes' && (
            <div className="space-y-4">
              {rangeCount > 1 && (
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: rangeCount }).map((_, idx) => {
                    const start = idx * episodesPerPage + 1;
                    const end = Math.min((idx + 1) * episodesPerPage, totalEpisodes);
                    return (
                      <button
                        key={idx}
                        onClick={() => setSelectedRange(idx)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                          selectedRange === idx
                            ? 'bg-gradient-to-r from-red-600 to-pink-600 text-white'
                            : 'bg-[#161a24] text-slate-400 hover:text-white'
                        }`}
                      >
                        {start} - {end}
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2.5">
                {Array.from({ length: Math.min(episodesPerPage, totalEpisodes - selectedRange * episodesPerPage) }).map((_, i) => {
                  const epNum = selectedRange * episodesPerPage + i + 1;
                  return (
                    <button
                      key={epNum}
                      onClick={() => onPlayEpisode(details, epNum)}
                      className="group p-2.5 rounded-xl bg-[#161a24] hover:bg-gradient-to-br hover:from-red-600/30 hover:to-blue-600/30 border border-white/[0.06] hover:border-pink-500/50 flex flex-col items-center justify-center transition-all"
                    >
                      <span className="text-xs font-black text-slate-200 group-hover:text-pink-300">
                        EP {epNum}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab: Characters */}
          {activeTab === 'characters' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {details.characters?.nodes && details.characters.nodes.length > 0 ? (
                details.characters.nodes.map((char) => (
                  <div
                    key={char.id}
                    className="flex items-center gap-2.5 p-2 rounded-xl bg-[#161a24] border border-white/[0.06]"
                  >
                    <img
                      src={char.image?.medium}
                      alt={char.name.full}
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-200 truncate">{char.name.full}</p>
                      <p className="text-[10px] text-blue-400 capitalize">{char.role?.toLowerCase()}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-8 text-center text-xs text-slate-500">
                  No character roster loaded for this title.
                </div>
              )}
            </div>
          )}

          {/* Tab: Related Anime */}
          {activeTab === 'relations' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {details.relations?.nodes && details.relations.nodes.length > 0 ? (
                details.relations.nodes.map((rel) => {
                  const relTitle = rel.title.english || rel.title.romaji || 'Anime';
                  return (
                    <div
                      key={rel.id}
                      onClick={() => onSelectRelated(rel)}
                      className="p-2 rounded-xl bg-[#161a24] hover:bg-[#202738] border border-white/[0.06] cursor-pointer transition-all group"
                    >
                      <img
                        src={rel.coverImage.medium || rel.coverImage.large}
                        alt={relTitle}
                        className="w-full aspect-[3/4] object-cover rounded-lg group-hover:scale-105 transition-transform"
                      />
                      <p className="text-xs font-bold text-slate-200 truncate mt-2 group-hover:text-pink-400">
                        {relTitle}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{rel.format || 'Anime'}</p>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full py-8 text-center text-xs text-slate-500">
                  No connected adaptations found.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
