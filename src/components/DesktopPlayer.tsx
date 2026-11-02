import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Server
} from 'lucide-react';
import { Anime } from '../types/anime';
import { getStreamUrl } from '../services/providers';
import { recordWatchProgress, getPreferences, savePreferences } from '../services/storage';

interface DesktopPlayerProps {
  anime: Anime;
  episode: number;
  onSelectEpisode: (epNum: number) => void;
  onBack: () => void;
}

export function DesktopPlayer({
  anime,
  episode,
  onSelectEpisode,
  onBack,
}: DesktopPlayerProps) {
  const prefs = getPreferences();
  const hasDub = Boolean((anime.dubEpisodeCount || 0) > 0);
  const [selectedServer, setSelectedServer] = useState<'megaplay' | 'zokoanime'>(prefs.preferredServer);
  const [track, setTrack] = useState<'sub' | 'dub'>(hasDub ? prefs.preferredTrack : 'sub');

  useEffect(() => {
    if (!hasDub && track === 'dub') {
      setTrack('sub');
    }
  }, [hasDub, track]);
  const [isIframeLoaded, setIsIframeLoaded] = useState(false);

  const title = anime.title.english || anime.title.romaji || 'Anime';
  const totalEpisodes = anime.episodes || 12;

  useEffect(() => {
    recordWatchProgress(anime, episode, 100);
    setIsIframeLoaded(false);
  }, [anime.id, episode]);

  const streamUrl = getStreamUrl({
    animeId: anime.id,
    episode,
    track,
    server: selectedServer,
  });

  const handleServerChange = (newServer: 'megaplay' | 'zokoanime') => {
    setSelectedServer(newServer);
    savePreferences({ preferredServer: newServer });
  };

  const handleTrackChange = (newTrack: 'sub' | 'dub') => {
    setTrack(newTrack);
    savePreferences({ preferredTrack: newTrack });
  };

  const handlePrevEpisode = () => {
    if (episode > 1) {
      onSelectEpisode(episode - 1);
    }
  };

  const handleNextEpisode = () => {
    if (episode < totalEpisodes) {
      onSelectEpisode(episode + 1);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#080A0D] overflow-hidden">
      {/* Top Controls Bar */}
      <div className="h-14 bg-[#0d0f15] border-b border-white/[0.08] flex items-center justify-between px-4 sm:px-6 shrink-0 z-20">
        {/* Left: Back button and Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 hover:text-white border border-blue-500/20 text-xs font-bold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </button>
          <div className="min-w-0">
            <h2 className="text-xs sm:text-sm font-extrabold text-white truncate max-w-xs sm:max-w-md">
              {title}
            </h2>
            <p className="text-[11px] text-pink-400 font-semibold">Episode {episode} of {totalEpisodes}</p>
          </div>
        </div>

        {/* Right: Server and SUB/DUB toggle */}
        <div className="flex items-center gap-2">
          {/* Audio Track (SUB in Pink / DUB in Blue) */}
          <div className="flex items-center bg-[#151924] p-0.5 rounded-lg border border-white/[0.08] text-xs">
            <button
              onClick={() => handleTrackChange('sub')}
              className={`px-2.5 py-1 rounded-md font-extrabold text-[11px] transition-all ${
                track === 'sub'
                  ? 'bg-pink-600 text-white shadow-sm shadow-pink-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              SUB
            </button>
            {hasDub && (
              <button
                onClick={() => handleTrackChange('dub')}
                className={`px-2.5 py-1 rounded-md font-extrabold text-[11px] transition-all ${
                  track === 'dub'
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                DUB
              </button>
            )}
          </div>

          {/* Server Selector: Server 1 in Red, Server 2 in Blue */}
          <div className="flex items-center bg-[#151924] p-0.5 rounded-lg border border-white/[0.08] text-xs">
            <button
              onClick={() => handleServerChange('megaplay')}
              className={`px-2.5 py-1 rounded-md font-bold text-[11px] transition-all flex items-center gap-1 ${
                selectedServer === 'megaplay'
                  ? 'bg-red-600 text-white shadow-sm shadow-red-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Server className="w-3 h-3" />
              <span className="hidden sm:inline">Server 1</span>
            </button>
            <button
              onClick={() => handleServerChange('zokoanime')}
              className={`px-2.5 py-1 rounded-md font-bold text-[11px] transition-all flex items-center gap-1 ${
                selectedServer === 'zokoanime'
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Server className="w-3 h-3" />
              <span className="hidden sm:inline">Server 2</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Video Embed Region */}
      <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
        {!isIframeLoaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 z-10 text-center">
            <div className="w-10 h-10 border-4 border-t-pink-500 border-r-blue-500 border-b-red-500 border-l-transparent rounded-full animate-spin mb-3" />
            <p className="text-xs font-semibold text-slate-300">Connecting to stream server...</p>
          </div>
        )}

        <iframe
          src={streamUrl}
          title={`Streaming ${title} Episode ${episode}`}
          className="w-full h-full border-none"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          onLoad={() => setIsIframeLoaded(true)}
        />
      </div>

      {/* Bottom Episode Navigation Bar */}
      <div className="h-16 bg-[#0d0f15] border-t border-white/[0.08] flex items-center justify-between px-4 sm:px-6 shrink-0 z-20">
        {/* Prev / Next buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevEpisode}
            disabled={episode <= 1}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              episode <= 1
                ? 'bg-white/5 text-slate-600 cursor-not-allowed'
                : 'bg-[#161a24] hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/20'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            Prev Episode
          </button>
          <button
            onClick={handleNextEpisode}
            disabled={episode >= totalEpisodes}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              episode >= totalEpisodes
                ? 'bg-white/5 text-slate-600 cursor-not-allowed'
                : 'bg-[#161a24] hover:bg-pink-600 text-pink-300 hover:text-white border border-pink-500/20'
            }`}
          >
            Next Episode
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Episode Jump Scroll */}
        <div className="hidden md:flex items-center gap-1 overflow-x-auto max-w-md py-1">
          {Array.from({ length: Math.min(totalEpisodes, 20) }).map((_, i) => {
            const ep = i + 1;
            const isCurrent = ep === episode;
            return (
              <button
                key={ep}
                onClick={() => onSelectEpisode(ep)}
                className={`w-7 h-7 rounded-lg text-xs font-bold transition-all shrink-0 ${
                  isCurrent
                    ? 'bg-gradient-to-r from-red-600 to-pink-600 text-white shadow-md'
                    : 'bg-[#161a24] text-slate-400 hover:text-white hover:bg-[#202738]'
                }`}
              >
                {ep}
              </button>
            );
          })}
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>Auto-Saved Progress</span>
        </div>
      </div>
    </div>
  );
}
