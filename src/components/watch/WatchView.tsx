import React, { useState, useEffect, useRef } from 'react';
import {
  Home,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Layers,
  Mic,
  Subtitles,
  Play,
  Heart,
  Maximize2,
  PictureInPicture2,
  Calendar,
  Clock,
  Folder,
  Share2,
  MoreHorizontal,
  Star,
  Plus,
  Check,
  ArrowRight,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { Anime } from '../../types/anime';
import { getAnimeTitle } from '../../services/titleHelper';
import { getStreamUrl, AVAILABLE_SERVERS } from '../../services/providers';
import { getAnimeEpisodesList, getAnimeEpisodeCount, getAnimeDetails, getPopularSeasonAnime } from '../../services/anilist';
import { getSingleAnimeAvailability, enrichAnimeAvailability } from '../../services/availability';
import { getPreferences, savePreferences, saveToWatchlist, getWatchlist } from '../../services/storage';
import { getCurrentUser } from '../../services/auth';
import { addAnimeToCloud, removeAnimeFromCloud } from '../../services/librarySync';
import {
  recordEpisodeProgress,
  getEpisodeProgress,
  getEpisodeWatchStatus,
  markEpisodeWatched,
  markEpisodeUnwatched,
  WATCH_PROGRESS_EVENT,
  EpisodeWatchStatus,
} from '../../services/watchProgress';

interface WatchViewProps {
  anime: Anime;
  currentEpisode: number;
  onSelectEpisode: (epNum: number) => void;
  onOpenDetails: (anime: Anime) => void;
  onBack: () => void;
  onSelectAnime?: (anime: Anime) => void;
}

export function WatchView({
  anime,
  currentEpisode,
  onSelectEpisode,
  onOpenDetails,
  onBack,
  onSelectAnime,
}: WatchViewProps) {
  const prefs = getPreferences();
  const [currentAnime, setCurrentAnime] = useState<Anime>(anime);
  const hasDub = Boolean((currentAnime.dubEpisodeCount || 0) > 0);
  const server4Id = AVAILABLE_SERVERS[3]?.id || 'zokoanime-mal';
  const [selectedServer, setSelectedServer] = useState<string>(prefs.preferredServer || server4Id);
  const [track, setTrack] = useState<'sub' | 'dub'>(hasDub ? prefs.preferredTrack : 'sub');

  // If anime does not have dub available, force track to 'sub'
  useEffect(() => {
    if (!hasDub && track === 'dub') {
      setTrack('sub');
    }
  }, [hasDub, track]);
  const [isIframeLoaded, setIsIframeLoaded] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isExpandedDesc, setIsExpandedDesc] = useState(false);
  const [selectedQuality, setSelectedQuality] = useState('1080p');
  const [selectedSubtitle, setSelectedSubtitle] = useState('English');
  const [similarAnimeList, setSimilarAnimeList] = useState<Anime[]>([]);

  // Dropdown states
  const [showServerMenu, setShowServerMenu] = useState(false);
  const [showTrackMenu, setShowTrackMenu] = useState(false);
  const [showSubMenu, setShowSubMenu] = useState(false);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [showRangeMenu, setShowRangeMenu] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  // Range selection for 100 episodes per group
  const [selectedRangeIndex, setSelectedRangeIndex] = useState(0);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = () => {
      setShowServerMenu(false);
      setShowTrackMenu(false);
      setShowSubMenu(false);
      setShowQualityMenu(false);
      setShowRangeMenu(false);
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  // Fetch full details if needed & resolve similar anime
  useEffect(() => {
    setCurrentAnime(anime);
    let isSubscribed = true;

    async function loadData() {
      let full = anime;
      try {
        if (!anime.streamingEpisodes || anime.streamingEpisodes.length === 0 || !anime.recommendations) {
          const res = await getAnimeDetails(anime.id);
          if (res) full = res;
        }
        const avail = await getSingleAnimeAvailability(full);
        full = {
          ...full,
          subEpisodeCount: avail.subCount,
          dubEpisodeCount: avail.dubCount,
        };
        if (isSubscribed) setCurrentAnime(full);
      } catch (err) {
        console.error(err);
      }

      // Populate similar anime (show all at once, no 4-card cap)
      const recs = full.recommendations?.nodes?.map((n) => n.mediaRecommendation).filter(Boolean) as Anime[] || [];
      const rels = full.relations?.nodes?.filter((r) => r.id !== full.id) || [];
      const combined = [...recs, ...rels].filter((item, index, self) =>
        index === self.findIndex((t) => t.id === item.id)
      );

      let rawSimilar: Anime[] = combined;
      if (rawSimilar.length < 8) {
        try {
          const fallback = await getPopularSeasonAnime(1, 16);
          const filtered = fallback.filter((a) => a.id !== full.id && !combined.some((c) => c.id === a.id));
          rawSimilar = [...combined, ...filtered].slice(0, 16);
        } catch {
          // Ignore fallback error
        }
      }

      // Enrich similar anime availability so dub badges only show when available
      enrichAnimeAvailability(rawSimilar).then((enriched) => {
        if (isSubscribed) setSimilarAnimeList(enriched);
      }).catch(() => {
        if (isSubscribed) setSimilarAnimeList(rawSimilar);
      });
    }

    loadData();

    return () => {
      isSubscribed = false;
    };
  }, [anime.id]);

  const title = currentAnime.title.english || currentAnime.title.romaji || 'Anime';
  const episodesList = getAnimeEpisodesList(currentAnime);
  const totalEpisodes = episodesList.length || getAnimeEpisodeCount(currentAnime);
  const episodesPerRange = 100;
  const rangeCount = Math.ceil(totalEpisodes / episodesPerRange);

  // Sync selected range with current episode
  useEffect(() => {
    setSelectedRangeIndex(Math.floor((currentEpisode - 1) / episodesPerRange));
  }, [currentEpisode]);

  const [currentProgress, setCurrentProgress] = useState(() => getEpisodeProgress(currentAnime.id, currentEpisode));
  const [, setWatchTick] = useState(0);

  // Sync episode progress when anime or episode changes, reset iframe loaded
  useEffect(() => {
    setIsIframeLoaded(false);
    setCurrentProgress(getEpisodeProgress(currentAnime.id, currentEpisode));
  }, [currentAnime.id, currentEpisode]);

  // Listen for video player events (ended, timeupdate near completion)
  useEffect(() => {
    const handlePlayerMessage = (e: MessageEvent) => {
      try {
        const payload = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        const eventName = payload?.event || payload?.type || '';

        // Real video completed event from player embed
        if (
          eventName === 'ended' ||
          eventName === 'video_ended' ||
          eventName === 'player:ended' ||
          eventName === 'finish' ||
          payload?.ended === true
        ) {
          markEpisodeWatched(currentAnime, currentEpisode);
          setCurrentProgress(getEpisodeProgress(currentAnime.id, currentEpisode));
        } else if (
          eventName === 'timeupdate' &&
          typeof payload?.currentTime === 'number' &&
          typeof payload?.duration === 'number' &&
          payload.duration > 0
        ) {
          // If playback naturally reaches near end (>= 92%), mark as completed
          if (payload.currentTime / payload.duration >= 0.92) {
            markEpisodeWatched(currentAnime, currentEpisode);
            setCurrentProgress(getEpisodeProgress(currentAnime.id, currentEpisode));
          }
        }
      } catch {
        // non-json
      }
    };
    window.addEventListener('message', handlePlayerMessage);
    return () => window.removeEventListener('message', handlePlayerMessage);
  }, [currentAnime.id, currentEpisode]);

  // Cross-component sync listener
  useEffect(() => {
    const handleSync = () => {
      setWatchTick((t) => t + 1);
    };
    window.addEventListener(WATCH_PROGRESS_EVENT, handleSync);
    return () => window.removeEventListener(WATCH_PROGRESS_EVENT, handleSync);
  }, []);

  useEffect(() => {
    const list = getWatchlist();
    const item = list.find((i) => i.anime.id === currentAnime.id);
    setIsSaved(Boolean(item));
    setIsFavorite(item?.status === 'favorite');
  }, [currentAnime.id]);

  const streamUrl = getStreamUrl({
    animeId: currentAnime.id,
    idMal: currentAnime.idMal,
    episode: currentEpisode,
    track,
    server: selectedServer,
  });

  // Always reset to Server 4 when episode or anime changes, even if changed previously
  useEffect(() => {
    setSelectedServer(server4Id);
  }, [currentAnime.id, currentEpisode, server4Id]);

  const handleSelectServer = (serverId: string) => {
    setSelectedServer(serverId);
    savePreferences({ preferredServer: serverId, preferredTrack: track });
  };

  const handleSelectTrack = (newTrack: 'sub' | 'dub') => {
    setTrack(newTrack);
    savePreferences({ preferredServer: selectedServer, preferredTrack: newTrack });
  };

  const handleToggleBookmark = () => {
    const nextSaved = !isSaved;
    const nextStatus = nextSaved ? 'watching' : 'completed';
    saveToWatchlist(currentAnime, nextStatus, currentEpisode);
    setIsSaved(nextSaved);

    const currentUser = getCurrentUser();
    if (currentUser) {
      if (nextSaved) {
        addAnimeToCloud(currentUser, currentAnime, nextStatus);
      } else {
        removeAnimeFromCloud(currentUser, currentAnime.id);
      }
    }
  };

  const handleToggleFavorite = () => {
    saveToWatchlist(currentAnime, isFavorite ? 'watching' : 'favorite', currentEpisode);
    setIsFavorite(!isFavorite);
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  };

  // Find server display name
  const currentServerObj = AVAILABLE_SERVERS.find((s) => s.id === selectedServer) || AVAILABLE_SERVERS[0];
  const serverIndex = AVAILABLE_SERVERS.findIndex((s) => s.id === selectedServer);
  const serverDisplay = `Server ${serverIndex >= 0 ? serverIndex + 1 : 1}`;

  // Clean description
  const cleanDescription = (currentAnime.description || '')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .trim();

  // Episode range calculation (renders all episodes in the selected 100-episode group)
  const rangeStart = selectedRangeIndex * episodesPerRange + 1;
  const rangeEnd = Math.min((selectedRangeIndex + 1) * episodesPerRange, totalEpisodes);

  const rangeEpisodes: number[] = [];
  for (let i = rangeStart; i <= rangeEnd; i++) {
    rangeEpisodes.push(i);
  }

  // Aired status text
  const airedText = `${currentAnime.season || 'Apr'} ${currentAnime.seasonYear || 2023} – ${
    currentAnime.status === 'FINISHED' ? 'Completed' : 'Present'
  }`;

  return (
    <div className="w-full min-h-screen bg-[#090A0E] text-white select-none animate-fade-in pb-16">
      {/* 1. Breadcrumbs Row matching user screenshot */}
      <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 py-3 flex items-center gap-2 text-xs text-white/50">
        <button
          onClick={onBack}
          className="hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
          title="Home"
        >
          <Home className="w-3.5 h-3.5" />
        </button>
        <ChevronRight className="w-3 h-3 text-white/30" />
        <button
          onClick={onBack}
          className="hover:text-white transition-colors cursor-pointer"
        >
          Anime
        </button>
        <ChevronRight className="w-3 h-3 text-white/30" />
        <button
          onClick={() => onOpenDetails(currentAnime)}
          className="hover:text-pink-400 truncate max-w-xs transition-colors cursor-pointer"
        >
          {title}
        </button>
        <ChevronRight className="w-3 h-3 text-white/30" />
        <span className="text-white font-bold">Episode {currentEpisode}</span>
      </div>

      {/* 2. Main 2-Column Grid */}
      <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* ================= LEFT COLUMN (~68% width) ================= */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            {/* 16:9 Video Player Frame */}
            <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black border border-white/10 shadow-2xl group">
              {!isIframeLoaded && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-10 text-center">
                  <div className="w-10 h-10 border-4 border-t-red-500 border-r-pink-500 border-b-blue-500 border-l-transparent rounded-full animate-spin mb-3" />
                  <p className="text-xs font-semibold text-slate-300">
                    Connecting to {currentServerObj.name}...
                  </p>
                </div>
              )}

              {/* Streaming Embed iframe */}
              <iframe
                id="anime-player-iframe"
                src={streamUrl}
                title={`Streaming ${title} Episode ${currentEpisode}`}
                className="w-full h-full border-none"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                onLoad={() => setIsIframeLoaded(true)}
              />
            </div>

            {/* Dropdown Selectors Bar (Server, Audio, Subtitles, Quality) */}
            <div className="bg-[#10131A] border border-white/10 rounded-xl px-4 py-2.5 flex items-center justify-between flex-wrap gap-2 shadow-md relative z-30">
              <div className="flex items-center flex-wrap gap-2.5">
                {/* 1. Server Dropdown */}
                <div className="relative" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => {
                      const server4 = AVAILABLE_SERVERS[3]?.id || 'zokoanime-mal';
                      if (selectedServer !== server4) {
                        handleSelectServer(server4);
                      }
                      setShowServerMenu(!showServerMenu);
                      setShowTrackMenu(false);
                      setShowSubMenu(false);
                      setShowQualityMenu(false);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#161a24] hover:bg-[#1e2333] border border-white/10 text-xs font-bold text-white transition-all cursor-pointer"
                  >
                    <Layers className="w-3.5 h-3.5 text-blue-400" />
                    <span>{serverDisplay}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-white/40 ml-0.5" />
                  </button>

                  {showServerMenu && (
                    <div className="absolute left-0 bottom-full mb-2 w-48 bg-[#141824] border border-white/10 rounded-xl shadow-2xl py-1.5 z-50 animate-fade-in divide-y divide-white/[0.04]">
                      {AVAILABLE_SERVERS.map((server, idx) => {
                        const isCurrent = selectedServer === server.id;
                        return (
                          <button
                            key={server.id}
                            onClick={() => {
                              handleSelectServer(server.id);
                              setShowServerMenu(false);
                            }}
                            className={`w-full px-3 py-2 text-left text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                              isCurrent
                                ? 'bg-pink-600/20 text-pink-400'
                                : 'text-slate-300 hover:bg-white/5 hover:text-white'
                            }`}
                          >
                            <span>Server {idx + 1} ({server.badge})</span>
                            {isCurrent && <Check className="w-3.5 h-3.5 text-pink-400" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 2. Audio (Sub / Dub) Dropdown */}
                <div className="relative" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => {
                      if (!hasDub) return;
                      setShowTrackMenu(!showTrackMenu);
                      setShowServerMenu(false);
                      setShowSubMenu(false);
                      setShowQualityMenu(false);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#161a24] border border-white/10 text-xs font-bold text-white transition-all ${
                      hasDub ? 'hover:bg-[#1e2333] cursor-pointer' : 'cursor-default opacity-85'
                    }`}
                    title={hasDub ? 'Select audio track' : 'Dub not available for this anime'}
                  >
                    <Mic className="w-3.5 h-3.5 text-pink-400" />
                    <span className="capitalize">{hasDub ? track : 'Sub'}</span>
                    {hasDub && <ChevronDown className="w-3.5 h-3.5 text-white/40 ml-0.5" />}
                  </button>

                  {hasDub && showTrackMenu && (
                    <div className="absolute left-0 bottom-full mb-2 w-32 bg-[#141824] border border-white/10 rounded-xl shadow-2xl py-1.5 z-50 animate-fade-in">
                      <button
                        onClick={() => {
                          handleSelectTrack('sub');
                          setShowTrackMenu(false);
                        }}
                        className={`w-full px-3 py-2 text-left text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                          track === 'sub' ? 'bg-pink-600/20 text-pink-400' : 'text-slate-300 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <span>Sub</span>
                        {track === 'sub' && <Check className="w-3.5 h-3.5 text-pink-400" />}
                      </button>
                      <button
                        onClick={() => {
                          handleSelectTrack('dub');
                          setShowTrackMenu(false);
                        }}
                        className={`w-full px-3 py-2 text-left text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                          track === 'dub' ? 'bg-pink-600/20 text-pink-400' : 'text-slate-300 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <span>Dub</span>
                        {track === 'dub' && <Check className="w-3.5 h-3.5 text-pink-400" />}
                      </button>
                    </div>
                  )}
                </div>
                {/* 3. Mark Watched / In Progress Toggle */}
                <button
                  onClick={() => {
                    if (currentProgress?.status === 'watched') {
                      markEpisodeUnwatched(currentAnime.id, currentEpisode);
                      setCurrentProgress(null);
                    } else {
                      markEpisodeWatched(currentAnime, currentEpisode);
                      setCurrentProgress(getEpisodeProgress(currentAnime.id, currentEpisode));
                    }
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                    currentProgress?.status === 'watched'
                      ? 'bg-sky-400/15 border-sky-400/30 text-sky-200 hover:bg-sky-400/25'
                      : 'bg-[#161a24] hover:bg-[#1e2333] border-white/10 text-slate-300 hover:text-white'
                  }`}
                  title={currentProgress?.status === 'watched' ? "Mark as Yet to Watch" : "Mark as Completed"}
                >
                  <Check className={`w-3.5 h-3.5 ${currentProgress?.status === 'watched' ? 'text-sky-400' : 'text-slate-400'}`} />
                  <span>{currentProgress?.status === 'watched' ? 'Watched' : 'Mark Watched'}</span>
                </button>
              </div>
            </div>

            {/* Episodes Grid Section matching screenshot */}
            <div className="bg-[#10131A] border border-white/10 rounded-xl p-4 sm:p-5 flex flex-col gap-3 shadow-md">
              {/* Header: Play icon + "Episodes" with pink underline & Range dropdown */}
              <div className="flex items-center justify-between pb-1">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2 text-sm font-black text-white">
                    <Play className="w-3.5 h-3.5 text-pink-500 fill-pink-500" />
                    <span>Episodes</span>
                  </div>
                  {/* Vibrant pink underline bar */}
                  <div className="w-14 h-0.5 bg-gradient-to-r from-red-500 to-pink-500 rounded-full mt-1.5" />
                </div>

                {/* Range Selector: e.g. "1 – 100 ▾" */}
                {rangeCount > 1 && (
                  <div className="relative" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setShowRangeMenu(!showRangeMenu)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#161a24] hover:bg-[#1e2333] border border-white/10 text-xs font-bold text-white transition-all cursor-pointer"
                    >
                      <span>{rangeStart} – {rangeEnd}</span>
                      <ChevronDown className="w-3.5 h-3.5 text-white/40" />
                    </button>

                    {showRangeMenu && (
                      <div className="absolute right-0 top-full mt-1.5 w-36 bg-[#141824] border border-white/10 rounded-xl shadow-2xl py-1.5 z-50 animate-fade-in max-h-56 overflow-y-auto">
                        {Array.from({ length: rangeCount }).map((_, rIdx) => {
                          const rStart = rIdx * episodesPerRange + 1;
                          const rEnd = Math.min((rIdx + 1) * episodesPerRange, totalEpisodes);
                          const isCurrent = selectedRangeIndex === rIdx;
                          return (
                            <button
                              key={rIdx}
                              onClick={() => {
                                setSelectedRangeIndex(rIdx);
                                setShowRangeMenu(false);
                              }}
                              className={`w-full px-3 py-2 text-left text-xs font-bold flex items-center justify-between transition-colors cursor-pointer ${
                                isCurrent ? 'bg-pink-600/20 text-pink-400' : 'text-slate-300 hover:bg-white/5 hover:text-white'
                              }`}
                            >
                              <span>{rStart} – {rEnd}</span>
                              {isCurrent && <Check className="w-3.5 h-3.5 text-pink-400" />}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Numbered Episodes Grid (All episodes in selected range) */}
              <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 mt-2 max-h-[380px] overflow-y-auto pr-1">
                {rangeEpisodes.map((epNum) => {
                  const isActive = epNum === currentEpisode;
                  const epProg = getEpisodeProgress(currentAnime.id, epNum);
                  const isWatched = epProg?.status === 'watched';

                  let buttonStyle = 'bg-[#141721] hover:bg-[#1e2333] border border-white/5 text-slate-300 hover:text-white';
                  if (isActive) {
                    buttonStyle = 'bg-gradient-to-r from-blue-600 via-indigo-500 to-pink-500 text-white font-black shadow-lg shadow-pink-500/30 border border-pink-400/80 scale-[1.02] ring-2 ring-pink-500/40';
                  } else if (isWatched) {
                    buttonStyle = 'bg-sky-400/10 hover:bg-sky-400/20 border border-sky-400/25 text-sky-200/70 opacity-60 hover:opacity-100 transition-opacity';
                  }

                  return (
                    <button
                      key={epNum}
                      onClick={() => onSelectEpisode(epNum)}
                      title={
                        isActive
                          ? `Episode ${epNum}: Playing Now`
                          : isWatched
                          ? `Episode ${epNum}: Watched`
                          : `Episode ${epNum}`
                      }
                      className={`relative py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${buttonStyle}`}
                    >
                      <div className="flex items-center gap-1">
                        {isActive ? (
                          <Play className="w-2.5 h-2.5 fill-current" />
                        ) : isWatched ? (
                          <Check className="w-2.5 h-2.5 text-sky-400" />
                        ) : null}
                        <span>{epNum}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ================= RIGHT COLUMN (~32% width) ================= */}
          <div className="lg:col-span-4 flex flex-col gap-5">
            {/* 1. Anime Info Card */}
            <div className="bg-[#10131A] border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col gap-4 shadow-xl">
              <div className="flex gap-4 items-start">
                {/* Poster */}
                <div className="relative w-24 sm:w-28 aspect-[2/3] rounded-xl overflow-hidden bg-black/60 border border-white/10 shrink-0 shadow-lg">
                  <img
                    src={currentAnime.coverImage.large || currentAnime.coverImage.medium}
                    alt={title}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Info Text & Badges */}
                <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                  <h2 className="text-base sm:text-lg font-black text-white leading-tight truncate">
                    {title}
                  </h2>

                  {/* Badges: Format pill, episode count, rating */}
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="px-2 py-0.5 rounded-md bg-[#e62058]/20 border border-[#e62058]/40 text-[#ff4d79] text-[10px] font-black uppercase">
                      {currentAnime.format || 'ONA'}
                    </span>
                    <span className="text-slate-400 text-xs font-medium">
                      · {totalEpisodes} Episodes ·
                    </span>
                    {currentAnime.averageScore && (
                      <span className="flex items-center gap-0.5 text-yellow-400 font-bold text-xs">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        {(currentAnime.averageScore / 10).toFixed(1)}
                      </span>
                    )}
                  </div>

                  {/* Synopsis snippet with "More ▾" */}
                  <div className="text-xs text-slate-300 leading-relaxed mt-1">
                    <p className={isExpandedDesc ? '' : 'line-clamp-3'}>
                      {cleanDescription || 'The story unfolds in a magnificent universe where myth and power collide.'}
                    </p>
                    {cleanDescription.length > 120 && (
                      <button
                        onClick={() => setIsExpandedDesc(!isExpandedDesc)}
                        className="text-pink-400 hover:text-pink-300 font-bold text-xs mt-1 cursor-pointer flex items-center gap-0.5"
                      >
                        {isExpandedDesc ? 'Less ▲' : 'More ▼'}
                      </button>
                    )}
                  </div>

                  {/* Action Buttons: Add to Library + Detail */}
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={handleToggleBookmark}
                      className="flex-1 py-2 px-3.5 rounded-full bg-gradient-to-r from-red-500 via-pink-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-pink-600/30 transition-all cursor-pointer"
                    >
                      {isSaved ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                      <span>{isSaved ? 'In Library' : 'Add to Library'}</span>
                    </button>

                    <button
                      onClick={() => onOpenDetails(currentAnime)}
                      title="View anime details"
                      className="py-2 px-4 rounded-full bg-[#181c26] hover:bg-[#222838] border border-white/10 flex items-center justify-center text-xs font-bold text-slate-200 hover:text-white transition-colors cursor-pointer shrink-0"
                    >
                      Detail
                    </button>
                  </div>
                </div>
              </div>

              {/* Bottom 3-Column Stats Row (Aired, Duration, Genres) */}
              <div className="border-t border-white/[0.08] pt-3.5 grid grid-cols-3 gap-2 text-xs">
                {/* Aired */}
                <div className="flex items-center gap-2 min-w-0">
                  <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] text-slate-400 font-medium">Aired</p>
                    <p className="text-white font-bold truncate text-[11px]">{airedText}</p>
                  </div>
                </div>

                {/* Duration */}
                <div className="flex items-center gap-2 min-w-0">
                  <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] text-slate-400 font-medium">Duration</p>
                    <p className="text-white font-bold truncate text-[11px]">~ {currentAnime.duration || 22} min</p>
                  </div>
                </div>

                {/* Genres */}
                <div className="flex items-center gap-2 min-w-0">
                  <Folder className="w-4 h-4 text-slate-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] text-slate-400 font-medium">Genres</p>
                    <p className="text-white font-bold truncate text-[11px]">
                      {(currentAnime.genres || []).slice(0, 3).join(', ') || 'Action, Fantasy'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Similar Anime Section (Show All at Once) */}
            <div className="bg-[#10131A] border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col gap-3 shadow-xl">
              {/* Header: Layers icon + Title + Count Badge */}
              <div className="flex items-center justify-between pb-1">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-400" />
                  <h3 className="text-sm font-black text-white">Similar Anime</h3>
                </div>
                {similarAnimeList.length > 0 && (
                  <span className="text-[10px] font-bold text-slate-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
                    {similarAnimeList.length} Titles
                  </span>
                )}
              </div>

              {/* All Similar Anime Cards Grid (Show all at once in rows of 4) */}
              <div className="grid grid-cols-4 gap-2.5 mt-1 max-h-[580px] overflow-y-auto pr-1">
                {similarAnimeList.map((similar) => {
                  const simTitle = getAnimeTitle(similar);
                  return (
                    <div
                      key={similar.id}
                      onClick={() => {
                        if (onSelectAnime) {
                          onSelectAnime(similar);
                        } else {
                          onOpenDetails(similar);
                        }
                      }}
                      className="group cursor-pointer flex flex-col"
                    >
                      {/* Card Poster */}
                      <div className="relative aspect-[2/3] w-full rounded-xl overflow-hidden bg-black/60 border border-white/10 group-hover:border-pink-500/50 transition-all shadow-md">
                        <img
                          src={similar.coverImage.large || similar.coverImage.medium}
                          alt={simTitle}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>

                      {/* Card Title */}
                      <h4 className="text-[11px] font-bold text-white truncate mt-1.5 group-hover:text-pink-400 transition-colors">
                        {simTitle}
                      </h4>

                      {/* Card Rating */}
                      <div className="flex items-center gap-0.5 text-[10px] text-yellow-400 font-bold mt-0.5">
                        <Star className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400" />
                        <span>
                          {similar.averageScore ? (similar.averageScore / 10).toFixed(1) : '7.5'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
