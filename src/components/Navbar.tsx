import React, { useState, useEffect, useRef } from 'react';
import {
  Menu,
  Search,
  Shuffle,
  Bookmark,
  History,
  Bell,
  ChevronDown,
  X,
  Star,
  Minus,
  Square,
  Copy,
  SlidersHorizontal,
  Flame,
  Radio
} from 'lucide-react';
import { Anime } from '../types/anime';
import { getAnimeTitle } from '../services/titleHelper';
import { User } from '../types/user';
import { searchAnime } from '../services/anilist';
import { getAvatarSrc } from '../services/avatarRegistry';
import { executeIntelligentSearch } from '../services/searchEngine';

interface NavbarProps {
  onOpenSidebar: () => void;
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onSelectAnime: (anime: Anime) => void;
  onOpenSearch?: (params: { query?: string; genre?: string }) => void;
  watchlistCount: number;
  user?: User | null;
  unreadNotifCount?: number;
  onOpenAuth?: () => void;
  onOpenProfile?: () => void;
  onToggleNotifications?: () => void;
  isNotificationsOpen?: boolean;
}

export function Navbar({
  onOpenSidebar,
  currentTab,
  onSelectTab,
  onSelectAnime,
  onOpenSearch,
  watchlistCount,
  user,
  unreadNotifCount = 0,
  onOpenAuth,
  onOpenProfile,
  onToggleNotifications,
  isNotificationsOpen = false,
}: NavbarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Anime[]>([]);
  const [correctedQuery, setCorrectedQuery] = useState<string | undefined>(undefined);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const [isMaximized, setIsMaximized] = useState(false);
  const isDesktop = Boolean((window as any).electronAPI);

  useEffect(() => {
    if ((window as any).electronAPI?.onWindowStateChange) {
      const unsub = (window as any).electronAPI.onWindowStateChange((state: { isMaximized: boolean }) => {
        setIsMaximized(state.isMaximized);
      });
      return unsub;
    }
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setCorrectedQuery(undefined);
      setIsSearching(false);
      setSelectedIndex(-1);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const timer = setTimeout(async () => {
      try {
        setIsSearching(true);
        const res = await executeIntelligentSearch({
          query: searchQuery.trim(),
          perPage: 8,
          signal: controller.signal,
        });
        if (!controller.signal.aborted) {
          setSearchResults(res.items);
          setCorrectedQuery(res.isTypoCorrected ? res.correctedQuery : undefined);
          setSelectedIndex(-1);
        }
      } catch (err: any) {
        if (err?.name !== 'AbortError') {
          console.error('Search error:', err);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsSearching(false);
        }
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchQuery]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRandom = async () => {
    try {
      const trending = await searchAnime({ sort: 'TRENDING_DESC', perPage: 25 });
      if (trending.length > 0) {
        const picked = trending[Math.floor(Math.random() * trending.length)];
        onSelectAnime(picked);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <header className="sticky top-0 left-0 right-0 z-40 bg-[#0c0e14]/95 backdrop-blur-md border-b border-white/[0.08] py-2 px-3 sm:px-6 select-none transition-colors app-drag-region">
      <div className="w-full max-w-[1720px] mx-auto flex items-center justify-between gap-3 sm:gap-4">
        {/* Left: Mobile Menu + Brand Logo */}
        <div className="flex items-center gap-3 sm:gap-4 shrink-0 app-no-drag">
          <button
            onClick={onOpenSidebar}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Navigation Menu"
            title="Open Menu"
          >
            <Menu className="w-5 h-5 text-blue-400" />
          </button>

          {/* An:me Previous Logo with Rounded Corners */}
          <button
            onClick={() => onSelectTab('home-reset')}
            className="flex items-center gap-1.5 group cursor-pointer focus:outline-none"
            title="Return to An:me Home"
          >
            <div className="overflow-hidden rounded-xl p-0.5 transition-transform group-hover:scale-[1.02]">
              <img
                src="./anme-logo-dark.png"
                alt="An:me"
                className="h-8 sm:h-9 object-contain drop-shadow-[0_0_16px_rgba(236,72,153,0.3)] rounded-xl"
              />
            </div>
            {/* Subtle Tri-Color Accent Dot */}
            <span className="flex items-center gap-1 ml-1 hidden sm:flex">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-pink-500"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            </span>
          </button>
        </div>

        {/* Primary media switcher with exact replica of user screenshot */}
        <nav className="hidden md:flex items-center rounded-full border border-white/10 bg-[#141722] p-0.5 text-xs font-bold app-no-drag">
          <button
            onClick={() => onSelectTab('home')}
            className={`rounded-full px-4 py-1.5 transition-all cursor-pointer ${
              currentTab === 'home' || currentTab === 'details' || currentTab === 'watch'
                ? 'bg-gradient-to-r from-red-500 via-pink-500 to-pink-600 text-white shadow-md shadow-pink-600/30 font-black'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Anime
          </button>
          <button
            onClick={() => onSelectTab('discover')}
            className={`rounded-full px-4 py-1.5 transition-all cursor-pointer ${
              currentTab === 'discover' || currentTab === 'search'
                ? 'bg-gradient-to-r from-red-500 via-pink-500 to-pink-600 text-white shadow-md shadow-pink-600/30 font-black'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Catalog
          </button>
        </nav>

        {/* Center: Live Search Bar with exact screenshot styling */}
        <div ref={searchRef} className="flex-1 max-w-[460px] mx-2 hidden sm:block relative app-no-drag">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-white/40 absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  if (!showDropdown) setShowDropdown(true);
                  setSelectedIndex((prev) => {
                    const max = searchResults.length > 0 ? searchResults.length : -1;
                    return prev < max ? prev + 1 : 0;
                  });
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  setSelectedIndex((prev) => (prev > 0 ? prev - 1 : searchResults.length));
                } else if (e.key === 'Enter') {
                  e.preventDefault();
                  if (selectedIndex >= 0 && selectedIndex < searchResults.length) {
                    onSelectAnime(searchResults[selectedIndex]);
                    setShowDropdown(false);
                  } else if (searchQuery.trim()) {
                    onOpenSearch?.({ query: searchQuery.trim() });
                    setShowDropdown(false);
                  }
                } else if (e.key === 'Escape') {
                  setShowDropdown(false);
                }
              }}
              placeholder="Search anime, studio, genre..."
              className="w-full bg-[#12151e] border border-white/10 rounded-full pl-10 pr-10 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all"
            />
            <div className="absolute right-3 flex items-center gap-1">
              {isSearching ? (
                <div className="w-3.5 h-3.5 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
              ) : searchQuery ? (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSearchResults([]);
                    setShowDropdown(false);
                  }}
                  className="text-white/40 hover:text-white p-0.5 cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : null}
            </div>
          </div>

          {/* Autocomplete Dropdown */}
          {showDropdown && searchQuery.trim() !== '' && (
            <div className="absolute top-full mt-2 left-0 right-0 bg-[#121622] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 animate-fade-in divide-y divide-white/[0.04]">
              {correctedQuery && (
                <div className="px-3 py-1.5 bg-pink-500/10 border-b border-pink-500/20 text-[11px] text-pink-300 flex items-center justify-between">
                  <span>
                    Showing results for <strong className="text-white underline">{correctedQuery}</strong>
                  </span>
                </div>
              )}

              <div className="max-h-[380px] overflow-y-auto divide-y divide-white/[0.04]">
                {isSearching && searchResults.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                    <span className="w-3 h-3 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"></span>
                    <span>Searching catalog...</span>
                  </div>
                ) : searchResults.length > 0 ? (
                  searchResults.map((anime, index) => {
                    const title = getAnimeTitle(anime);
                    const isSelected = selectedIndex === index;
                    const subCount = anime.subEpisodeCount || anime.episodes || 0;

                    return (
                      <div
                        key={anime.id}
                        onClick={() => {
                          onSelectAnime(anime);
                          setShowDropdown(false);
                          setSearchQuery('');
                        }}
                        onMouseEnter={() => setSelectedIndex(index)}
                        className={`flex items-center gap-3 p-2.5 transition-colors cursor-pointer group ${
                          isSelected ? 'bg-pink-600/20 border-l-2 border-pink-500' : 'hover:bg-white/[0.04]'
                        }`}
                      >
                        <img
                          src={anime.coverImage.medium || anime.coverImage.large || './anme-logo-dark.png'}
                          alt={title}
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = './anme-logo-dark.png';
                          }}
                          className="w-9 h-12 object-cover rounded bg-[#181c28] flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-white truncate group-hover:text-pink-400 transition-colors">
                            {title}
                          </h4>
                          <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                            <span className="text-blue-400 font-semibold">{anime.format || 'TV'}</span>
                            {anime.seasonYear && (
                              <>
                                <span>•</span>
                                <span>{anime.seasonYear}</span>
                              </>
                            )}
                            {subCount > 0 && (
                              <>
                                <span>•</span>
                                <span className="px-1.5 py-0.2 rounded bg-pink-500/20 text-pink-300 font-semibold text-[9px]">
                                  SUB {subCount}
                                </span>
                              </>
                            )}
                            {anime.averageScore && (
                              <span className="flex items-center text-[#F5C451] ml-auto">
                                <Star className="w-2.5 h-2.5 fill-current mr-0.5" />
                                {(anime.averageScore / 10).toFixed(1)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-4 text-center text-xs text-slate-400">
                    <p>No matching anime found for "{searchQuery}"</p>
                    <button
                      onClick={() => {
                        onOpenSearch?.({ query: searchQuery.trim() });
                        setShowDropdown(false);
                      }}
                      className="mt-2 text-pink-400 hover:text-pink-300 text-[11px] font-semibold underline cursor-pointer"
                    >
                      Browse full catalog
                    </button>
                  </div>
                )}
              </div>

              {/* View All Results Action */}
              {searchResults.length > 0 && (
                <button
                  onClick={() => {
                    onOpenSearch?.({ query: searchQuery.trim() });
                    setShowDropdown(false);
                  }}
                  onMouseEnter={() => setSelectedIndex(searchResults.length)}
                  className={`w-full py-2.5 px-3 text-center text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                    selectedIndex === searchResults.length
                      ? 'bg-gradient-to-r from-red-600 to-pink-600 text-white'
                      : 'bg-[#151926] hover:bg-white/[0.06] text-pink-400 hover:text-pink-300'
                  }`}
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>View all results for "{searchQuery}"</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right Nav Icons matching user screenshot */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 app-no-drag">
          {/* Shuffle / Random Anime */}
          <button
            onClick={handleRandom}
            title="Random Anime"
            className="w-8 h-8 rounded-full bg-transparent hover:bg-white/10 text-white/80 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <Shuffle className="w-4 h-4" />
          </button>

          {/* Library Button (Pink outlined pill matching screenshot) */}
          <button
            onClick={() => onSelectTab('library')}
            title="My Library"
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
              currentTab === 'library'
                ? 'bg-pink-600 text-white border-pink-500 shadow-md shadow-pink-600/30'
                : 'border-pink-500/60 bg-pink-500/10 text-pink-400 hover:bg-pink-500/20'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5 fill-current" />
            <span className="hidden sm:inline">Library</span>
            {watchlistCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-pink-600 text-white font-black">
                {watchlistCount}
              </span>
            )}
          </button>

          {/* Watch History Clock */}
          <button
            onClick={() => onSelectTab('history')}
            title="Watch History"
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
              currentTab === 'history'
                ? 'bg-white/15 text-white'
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            <History className="w-4 h-4" />
          </button>

          {/* Notifications Bell with Pink Unread Badge */}
          <div className="relative">
            <button
              onClick={onToggleNotifications}
              title="Notifications"
              className={`relative w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                isNotificationsOpen ? 'bg-pink-600/20 text-pink-400' : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <Bell className="w-4 h-4" />
              {unreadNotifCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[14px] h-[14px] px-1 rounded-full bg-pink-600 text-white text-[9px] font-black flex items-center justify-center ring-2 ring-[#0c0e14]">
                  {unreadNotifCount > 9 ? '9+' : unreadNotifCount}
                </span>
              )}
            </button>
          </div>

          {/* User Profile Avatar / Sign In */}
          {user ? (
            <button
              onClick={onOpenProfile}
              title={`Logged in as ${user.username}`}
              className="flex items-center gap-1.5 p-1 pr-2 rounded-full hover:bg-white/10 border border-white/10 transition-colors cursor-pointer group"
            >
              <div className="w-6 h-6 rounded-full overflow-hidden border border-pink-500/60 shadow-sm flex items-center justify-center shrink-0">
                <img
                  src={getAvatarSrc(user.avatar)}
                  alt={user.username}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-xs font-bold text-white/90 hidden sm:inline max-w-[90px] truncate">
                {user.username}
              </span>
              <ChevronDown className="w-3 h-3 text-white/40 group-hover:text-white transition-colors" />
            </button>
          ) : (
            <button
              onClick={onOpenAuth}
              title="Sign in with your web database"
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-red-500 via-pink-500 to-blue-600 hover:from-red-600 hover:to-blue-700 text-white text-xs font-extrabold shadow-sm transition-all cursor-pointer"
            >
              <span>Sign In</span>
            </button>
          )}

          {/* Desktop Window Controls (Seamless titlebar) */}
          {isDesktop && (
            <div className="flex items-center ml-2 pl-2 border-l border-white/10 space-x-1 app-no-drag">
              <button
                onClick={() => (window as any).electronAPI?.minimize()}
                className="w-7 h-7 flex items-center justify-center rounded text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Minimize"
              >
                <Minus className="w-3 h-3" />
              </button>
              <button
                onClick={() => {
                  (window as any).electronAPI?.maximize();
                  setIsMaximized(!isMaximized);
                }}
                className="w-7 h-7 flex items-center justify-center rounded text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title={isMaximized ? "Restore" : "Maximize"}
              >
                {isMaximized ? <Copy className="w-3 h-3" /> : <Square className="w-3 h-3" />}
              </button>
              <button
                onClick={() => (window as any).electronAPI?.close()}
                className="w-7 h-7 flex items-center justify-center rounded text-white/60 hover:text-white hover:bg-red-600 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
