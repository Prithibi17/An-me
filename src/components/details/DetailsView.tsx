import React, { useState, useEffect } from 'react';
import {
  Play,
  Star,
  Plus,
  Check,
  ChevronRight,
  Calendar,
  Clock,
  Tv,
  Users,
  Layers,
  Search,
  Subtitles,
  Mic,
  Film,
  Grid,
  List
} from 'lucide-react';
import { Anime, WatchlistStatus } from '../../types/anime';
import { getAnimeDetails, getAnimeEpisodeCount, getAnimeEpisodesList } from '../../services/anilist';
import { getSingleAnimeAvailability } from '../../services/availability';
import { saveToWatchlist, getWatchlist, getWatchHistory } from '../../services/storage';
import { getCurrentUser } from '../../services/auth';
import { addAnimeToCloud } from '../../services/librarySync';
import {
  getResumeInfo,
  getEpisodeProgress,
  getEpisodeWatchStatus,
  markEpisodeWatched,
  markEpisodeUnwatched,
  WATCH_PROGRESS_EVENT,
  EpisodeWatchStatus,
} from '../../services/watchProgress';

interface DetailsViewProps {
  anime: Anime;
  onBack: () => void;
  onPlayEpisode: (anime: Anime, episode: number) => void;
  onSelectRelated: (anime: Anime) => void;
}

export function DetailsView({
  anime,
  onBack,
  onPlayEpisode,
  onSelectRelated,
}: DetailsViewProps) {
  const [details, setDetails] = useState<Anime>(anime);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'episodes' | 'characters' | 'related'>('overview');
  const [searchEp, setSearchEp] = useState('');
  const [selectedRange, setSelectedRange] = useState(0);
  const [savedStatus, setSavedStatus] = useState<WatchlistStatus | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    const list = getWatchlist();
    const item = list.find((i) => i.anime.id === anime.id);
    if (item) setSavedStatus(item.status);
  }, [anime.id]);

  useEffect(() => {
    async function loadFullDetails() {
      try {
        setLoading(true);
        const full = await getAnimeDetails(anime.id);
        const avail = await getSingleAnimeAvailability(full);
        setDetails({
          ...full,
          subEpisodeCount: avail.subCount,
          dubEpisodeCount: avail.dubCount,
        });
      } catch (err) {
        console.error('Failed to load full anime details:', err);
      } finally {
        setLoading(false);
      }
    }
    loadFullDetails();
  }, [anime.id]);

  const title = details.title.english || details.title.romaji || 'Anime';
  const subtitle = details.title.native || details.title.romaji || '';
  const banner = details.bannerImage || details.coverImage.extraLarge || details.coverImage.large;
  const poster = details.coverImage.large || details.coverImage.medium;
  const episodesList = getAnimeEpisodesList(details);
  const totalEpisodes = episodesList.length || getAnimeEpisodeCount(details);
  const episodesPerPage = 100;
  const rangeCount = Math.ceil(totalEpisodes / episodesPerPage);

  const cleanDescription = (details.description || '')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .trim();

  const handleToggleList = () => {
    const nextStatus: WatchlistStatus = savedStatus ? (savedStatus === 'watching' ? 'completed' : 'watching') : 'watching';
    saveToWatchlist(details, nextStatus);
    setSavedStatus(nextStatus);
    const currentUser = getCurrentUser();
    if (currentUser) {
      addAnimeToCloud(currentUser, details, nextStatus);
    }
  };

  // Find saved episode if watched
  const [, setWatchTick] = useState(0);

  useEffect(() => {
    const handleSync = () => setWatchTick((t) => t + 1);
    window.addEventListener(WATCH_PROGRESS_EVENT, handleSync);
    return () => window.removeEventListener(WATCH_PROGRESS_EVENT, handleSync);
  }, []);

  const resumeInfo = getResumeInfo(details.id);
  const resumeEpisode = resumeInfo ? resumeInfo.episode : 1;

  // Filter episodes by search
  const filteredEpisodes = episodesList.filter((ep) => {
    if (!searchEp.trim()) return true;
    return ep.title.toLowerCase().includes(searchEp.toLowerCase()) || String(ep.number) === searchEp.trim();
  });

  return (
    <div className="w-full min-h-screen bg-[#080A0D] text-white pb-16 animate-fade-in select-none">
      {/* 1. Full Hero Section */}
      <section className="relative w-full min-h-[480px] md:min-h-[540px] overflow-hidden bg-[#080A0D]">
        {/* Background Backdrop with Scrims */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <img
            src={banner || poster}
            alt={title}
            className="w-full h-full object-cover object-center opacity-40 md:opacity-50 filter brightness-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#080A0D] via-[#080A0D]/75 to-[#080A0D]/40" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#080A0D] via-[#080A0D]/70 to-transparent" />
        </div>

        {/* Hero Foreground */}
        <div className="relative z-10 max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-10 flex flex-col md:flex-row gap-6 md:gap-8 items-start md:items-end">
          {/* Big Poster */}
          <div className="relative w-36 sm:w-44 md:w-56 shrink-0 aspect-[2/3] rounded-xl overflow-hidden bg-[#11151B] border border-white/10 shadow-2xl">
            <img
              src={poster}
              alt={title}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Details & Actions */}
          <div className="flex-1 flex flex-col gap-3 min-w-0">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-1.5 text-xs text-white/55 flex-wrap">
              <button onClick={onBack} className="hover:text-blue-400 transition-colors">Home</button>
              <ChevronRight className="w-3 h-3 text-white/30" />
              <span className="text-pink-400 font-semibold">{details.format || 'TV'}</span>
              <ChevronRight className="w-3 h-3 text-white/30" />
              <span className="text-white truncate max-w-xs">{title}</span>
            </nav>

            {/* Title & Native Title */}
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight leading-tight">
                {title}
              </h1>
              {subtitle && subtitle !== title && (
                <p className="text-xs sm:text-sm text-white/50 font-medium mt-1">
                  {subtitle}
                </p>
              )}
            </div>

            {/* Badges Bar (Tri-Color: Red Format, Pink SUB, Blue DUB) */}
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-white/80">
              {details.averageScore && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                  <Star className="w-3.5 h-3.5 fill-yellow-400" />
                  {(details.averageScore / 10).toFixed(1)}
                </span>
              )}
              <span className="px-2 py-0.5 rounded-md bg-red-500/20 text-red-300 border border-red-500/30">
                {details.format || 'TV'}
              </span>
              <span className="flex items-center gap-1 text-white/60">
                <Clock className="w-3.5 h-3.5 text-blue-400" /> {details.duration || 24}m
              </span>
              <span className="flex items-center gap-1 text-white/60">
                <Calendar className="w-3.5 h-3.5 text-pink-400" /> {details.seasonYear || new Date().getFullYear()}
              </span>
              <div className="flex items-center gap-1">
                <span className="px-2 py-0.5 rounded bg-pink-600 text-white text-[10px] font-black flex items-center gap-0.5 shadow-sm">
                  <Subtitles className="w-2.5 h-2.5" /> SUB {details.subEpisodeCount || totalEpisodes}
                </span>
                {(details.dubEpisodeCount || 0) > 0 && (
                  <span className="px-2 py-0.5 rounded bg-blue-600 text-white text-[10px] font-black flex items-center gap-0.5 shadow-sm">
                    <Mic className="w-2.5 h-2.5" /> DUB {details.dubEpisodeCount}
                  </span>
                )}
              </div>
            </div>

            {/* Synopsis snippet */}
            <p className="text-xs sm:text-sm text-slate-300 line-clamp-3 leading-relaxed max-w-2xl">
              {cleanDescription || 'Dive into this story currently available on An:me.'}
            </p>

            {/* Action Buttons: Red/Pink/Blue Tri-gradient */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => onPlayEpisode(details, resumeEpisode)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-red-600 via-pink-600 to-blue-600 hover:from-red-500 hover:to-blue-500 text-white font-black text-xs sm:text-sm shadow-xl shadow-pink-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                {resumeInfo ? (
                  <span>Resume Ep {resumeEpisode}</span>
                ) : (
                  <span>Watch Ep 1</span>
                )}
              </button>

              <button
                onClick={handleToggleList}
                className={`flex items-center gap-1.5 px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold border transition-all ${
                  savedStatus
                    ? 'bg-red-500/20 border-red-500/40 text-red-300'
                    : 'bg-[#181a24] hover:bg-white/10 border-white/15 text-white'
                }`}
              >
                {savedStatus ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                {savedStatus ? `In List (${savedStatus.replace(/_/g, ' ')})` : 'Add to List'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Details Tabs Navigation */}
      <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 mt-2">
        <div className="w-full border-b border-white/10 flex items-center gap-6 sm:gap-8">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'episodes', label: 'Episodes', count: totalEpisodes },
            { id: 'characters', label: 'Characters', count: details.characters?.nodes?.length },
            { id: 'related', label: 'Related', count: (details.relations?.nodes?.length || 0) + (details.recommendations?.nodes?.filter((r) => r.mediaRecommendation?.id).length || 0) },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`relative py-3 text-sm font-bold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
                  isActive
                    ? 'border-pink-500 text-white'
                    : 'border-transparent text-white/50 hover:text-white'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                    isActive ? 'bg-gradient-to-r from-red-600 to-pink-600 text-white' : 'bg-white/10 text-white/60'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* 3. Tab Contents */}
        <div className="pt-6">
          {/* TAB: Overview */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column: Synopsis & Genres */}
              <div className="lg:col-span-8 flex flex-col gap-4">
                <h3 className="text-base font-extrabold text-white">Synopsis</h3>
                <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                  {cleanDescription || 'No description available for this anime.'}
                </p>

                {details.genres && details.genres.length > 0 && (
                  <div className="flex flex-col gap-2 pt-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Genres</h4>
                    <div className="flex flex-wrap gap-2">
                      {details.genres.map((g, idx) => {
                        const chipColor = idx % 3 === 0
                          ? 'border-red-500/20 text-red-300 bg-red-950/30'
                          : idx % 3 === 1
                          ? 'border-pink-500/20 text-pink-300 bg-pink-950/30'
                          : 'border-blue-500/20 text-blue-300 bg-blue-950/30';
                        return (
                          <span
                            key={g}
                            className={`px-3 py-1 rounded-md border text-xs font-semibold ${chipColor}`}
                          >
                            {g}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Metadata Box */}
              <div className="lg:col-span-4 bg-[#11151B] border border-white/10 rounded-xl p-4 sm:p-5 flex flex-col gap-3">
                <h4 className="text-sm font-black uppercase tracking-wider text-pink-400 pb-2 border-b border-white/10">
                  Information
                </h4>
                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Status:</span>
                    <span className="font-bold text-white">{details.status || 'Finished'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Episodes:</span>
                    <span className="font-bold text-white">{totalEpisodes}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Duration:</span>
                    <span className="font-bold text-white">{details.duration || 24}m per ep</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Format:</span>
                    <span className="font-bold text-red-400">{details.format || 'TV'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Premiered:</span>
                    <span className="font-bold text-blue-400">{details.season || 'Fall'} {details.seasonYear || ''}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Studio:</span>
                    <span className="font-bold text-white">{details.studios?.nodes?.[0]?.name || 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Rating Score:</span>
                    <span className="font-bold text-yellow-400">{details.averageScore ? (details.averageScore / 10).toFixed(1) : 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: Episodes */}
          {activeTab === 'episodes' && (
            <div className="space-y-4">
              {/* Episode Search, View Mode & Range Selector */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="relative w-64">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={searchEp}
                      onChange={(e) => setSearchEp(e.target.value)}
                      placeholder="Search episode by name or number..."
                      className="w-full bg-[#161a24] border border-white/10 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-pink-500"
                    />
                  </div>

                  {/* Grid / List toggle */}
                  <div className="flex items-center bg-[#161a24] border border-white/10 rounded-lg p-0.5">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-1.5 rounded text-xs transition-colors ${
                        viewMode === 'grid' ? 'bg-gradient-to-r from-red-600 via-pink-600 to-blue-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                      title="Grid View"
                    >
                      <Grid className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-1.5 rounded text-xs transition-colors ${
                        viewMode === 'list' ? 'bg-gradient-to-r from-red-600 via-pink-600 to-blue-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                      title="List View"
                    >
                      <List className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {rangeCount > 1 && !searchEp && (
                  <div className="flex flex-wrap gap-1.5">
                    {Array.from({ length: rangeCount }).map((_, idx) => {
                      const start = idx * episodesPerPage + 1;
                      const end = Math.min((idx + 1) * episodesPerPage, totalEpisodes);
                      return (
                        <button
                          key={idx}
                          onClick={() => setSelectedRange(idx)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                            selectedRange === idx
                              ? 'bg-gradient-to-r from-red-600 via-pink-600 to-blue-600 text-white shadow-md'
                              : 'bg-[#161a24] text-slate-400 hover:text-white'
                          }`}
                        >
                          {start} - {end}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Episodes Content (Grid or List View) */}
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5">
                  {(searchEp ? filteredEpisodes : filteredEpisodes.slice(selectedRange * episodesPerPage, (selectedRange + 1) * episodesPerPage)).map((ep) => {
                    const epProg = getEpisodeProgress(details.id, ep.number);
                    const isWatched = epProg?.status === 'watched';
                    const isResumeTarget = resumeInfo?.episode === ep.number;

                    let buttonStyle = 'bg-[#11151B] border-white/5 hover:border-white/20 hover:bg-[#161b24] text-slate-300 hover:text-white';
                    if (isResumeTarget) {
                      buttonStyle = 'bg-gradient-to-r from-blue-600 via-indigo-500 to-pink-500 text-white font-black shadow-lg shadow-pink-500/30 border border-pink-400/80 scale-[1.02] ring-2 ring-pink-500/40';
                    } else if (isWatched) {
                      buttonStyle = 'bg-sky-400/10 hover:bg-sky-400/20 border border-sky-400/25 text-sky-200/70 opacity-60 hover:opacity-100 transition-opacity';
                    }

                    return (
                      <button
                        key={ep.number}
                        onClick={() => onPlayEpisode(details, ep.number)}
                        className={`group relative p-3 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer ${buttonStyle}`}
                        title={
                          isResumeTarget
                            ? `Episode ${ep.number}: Next to Watch`
                            : isWatched
                            ? `Episode ${ep.number}: Watched`
                            : `Episode ${ep.number}`
                        }
                      >
                        <div className="flex items-center gap-1.5">
                          {isResumeTarget ? (
                            <Play className="w-2.5 h-2.5 fill-current" />
                          ) : isWatched ? (
                            <Check className="w-2.5 h-2.5 text-sky-400" />
                          ) : null}
                          <span className="text-xs font-black">
                            EP {ep.number}
                          </span>
                        </div>
                        {ep.title !== `Episode ${ep.number}` && (
                          <span className="text-[10px] text-slate-400 truncate w-full text-center mt-1">
                            {ep.title}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {(searchEp ? filteredEpisodes : filteredEpisodes.slice(selectedRange * episodesPerPage, (selectedRange + 1) * episodesPerPage)).map((ep) => {
                    const epProg = getEpisodeProgress(details.id, ep.number);
                    const isWatched = epProg?.status === 'watched';
                    const isResumeTarget = resumeInfo?.episode === ep.number;

                    let rowStyle = 'bg-[#11151B] border-white/5 hover:border-white/20 hover:bg-[#161b24] text-slate-300 hover:text-white';
                    if (isResumeTarget) {
                      rowStyle = 'bg-gradient-to-r from-blue-950/40 via-indigo-950/40 to-pink-950/40 border-pink-500/60 text-white';
                    } else if (isWatched) {
                      rowStyle = 'bg-sky-400/10 hover:bg-sky-400/15 border-sky-400/25 text-white opacity-60 hover:opacity-100 transition-opacity';
                    }

                    return (
                      <div
                        key={ep.number}
                        onClick={() => onPlayEpisode(details, ep.number)}
                        className={`group flex items-center gap-3 p-2.5 rounded-xl border transition-all cursor-pointer ${rowStyle}`}
                      >
                        {/* Thumbnail or Number Box */}
                        {ep.thumbnail ? (
                          <div className="relative w-20 aspect-video rounded-lg overflow-hidden shrink-0 bg-black/60">
                            <img src={ep.thumbnail} alt={ep.title} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/30 group-hover:bg-transparent flex items-center justify-center transition-all">
                              <Play className="w-4 h-4 text-white fill-white opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </div>
                        ) : (
                          <div className={`w-12 h-10 rounded-lg border flex items-center justify-center shrink-0 ${
                            isResumeTarget
                              ? 'bg-gradient-to-br from-blue-600 to-pink-500 text-white border-pink-400/60'
                              : isWatched
                              ? 'bg-sky-950/40 border-sky-400/30 text-sky-300'
                              : 'bg-[#1a1f2b] border-white/10 text-slate-300'
                          }`}>
                            <span className="text-xs font-black">{ep.number}</span>
                          </div>
                        )}

                        {/* Title and Ep Number */}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-white group-hover:text-pink-300 truncate transition-colors">
                            {ep.title}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-slate-400 font-medium">Episode {ep.number}</span>
                            {isResumeTarget ? (
                              <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-gradient-to-r from-blue-600 to-pink-500 text-white border border-pink-400/40 flex items-center gap-1">
                                <Play className="w-2.5 h-2.5 fill-current" />
                                Current Episode
                              </span>
                            ) : isWatched ? (
                              <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-sky-400/20 text-sky-300 border border-sky-400/30 flex items-center gap-1">
                                <Check className="w-2.5 h-2.5 text-sky-400" />
                                Watched
                              </span>
                            ) : (
                              <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-white/5 text-slate-500">
                                Yet to Watch
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Quick Mark Watched toggle icon */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isWatched) {
                              markEpisodeUnwatched(details.id, ep.number);
                            } else {
                              markEpisodeWatched(details, ep.number);
                            }
                          }}
                          className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                            isWatched
                              ? 'bg-sky-400/20 text-sky-300 border-sky-400/40'
                              : 'bg-white/5 text-slate-400 hover:text-white border-white/10 hover:bg-white/10'
                          }`}
                          title={isWatched ? "Mark as Yet to Watch" : "Mark as Watched"}
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>

                        <div className="shrink-0 pr-1">
                          <Play className={`w-4 h-4 ${isResumeTarget ? 'text-pink-400 fill-pink-400' : 'text-slate-500 group-hover:text-blue-400'}`} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB: Characters */}
          {activeTab === 'characters' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {details.characters?.nodes && details.characters.nodes.length > 0 ? (
                details.characters.nodes.map((char) => (
                  <div
                    key={char.id}
                    className="p-2.5 rounded-xl bg-[#11151B] border border-white/5 flex items-center gap-3 hover:border-pink-500/30 transition-colors"
                  >
                    <img
                      src={char.image?.large || char.image?.medium || './anme-logo-dark.png'}
                      alt={char.name.full}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = './anme-logo-dark.png';
                      }}
                      className="w-12 h-12 rounded-lg object-cover flex-shrink-0 bg-black/40"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{char.name.full}</p>
                      <p className="text-[10px] text-pink-400 capitalize font-medium">{char.role?.toLowerCase() || 'character'}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-12 text-center text-xs text-slate-500">
                  No character roster loaded for this title.
                </div>
              )}
            </div>
          )}

          {/* TAB: Related Anime & Recommendations */}
          {activeTab === 'related' && (
            <div className="space-y-6">
              {/* 1. Franchise Relations (Prequels, Sequels, Adaptations) */}
              {details.relations?.nodes && details.relations.nodes.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                    Franchise Relations ({details.relations.nodes.length})
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {details.relations.nodes.map((rel: any) => {
                      const relTitle = rel.title?.english || rel.title?.romaji || rel.title?.native || 'Anime';
                      return (
                        <div
                          key={rel.id}
                          onClick={() => onSelectRelated(rel)}
                          className="group cursor-pointer flex flex-col"
                        >
                          <div className="relative aspect-[2/3] w-full rounded-xl overflow-hidden bg-[#11151B] border border-white/5 group-hover:border-pink-500/50 transition-colors shadow-md">
                            <img
                              src={rel.coverImage?.large || rel.coverImage?.medium || './anme-logo-dark.png'}
                              alt={relTitle}
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = './anme-logo-dark.png';
                              }}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                            {rel.relationType && (
                              <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/75 backdrop-blur-sm border border-white/10 text-[9px] font-bold text-pink-300 uppercase">
                                {rel.relationType.replace(/_/g, ' ')}
                              </div>
                            )}
                          </div>
                          <h4 className="text-xs font-bold text-white truncate mt-2 group-hover:text-pink-400 transition-colors">
                            {relTitle}
                          </h4>
                          <p className="text-[10px] text-blue-400 capitalize">{rel.format || 'Anime'}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 2. Recommended Anime for this Title */}
              {details.recommendations?.nodes && details.recommendations.nodes.some((n) => n.mediaRecommendation?.id) && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                    Recommended For You
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {details.recommendations.nodes
                      .filter((n) => n.mediaRecommendation && n.mediaRecommendation.id)
                      .slice(0, 18)
                      .map((n) => {
                        const rec = n.mediaRecommendation!;
                        const recTitle = rec.title?.english || rec.title?.romaji || rec.title?.native || 'Anime';
                        return (
                          <div
                            key={rec.id}
                            onClick={() => onSelectRelated(rec)}
                            className="group cursor-pointer flex flex-col"
                          >
                            <div className="relative aspect-[2/3] w-full rounded-xl overflow-hidden bg-[#11151B] border border-white/5 group-hover:border-pink-500/50 transition-colors shadow-md">
                              <img
                                src={rec.coverImage?.large || rec.coverImage?.medium || './anme-logo-dark.png'}
                                alt={recTitle}
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).src = './anme-logo-dark.png';
                                }}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                            </div>
                            <h4 className="text-xs font-bold text-white truncate mt-2 group-hover:text-pink-400 transition-colors">
                              {recTitle}
                            </h4>
                            <p className="text-[10px] text-blue-400">{rec.format || 'Anime'}</p>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {(!details.relations?.nodes || details.relations.nodes.length === 0) &&
                (!details.recommendations?.nodes || !details.recommendations.nodes.some((n) => n.mediaRecommendation?.id)) && (
                  <div className="py-12 text-center text-xs text-slate-500">
                    No related or recommended titles available.
                  </div>
                )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
