import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Clock
} from 'lucide-react';
import { Navbar } from './components/Navbar';
import { SidebarDrawer } from './components/SidebarDrawer';
import { HiAnimeSpotlight } from './components/HiAnimeSpotlight';
import { HiAnimeTrendingStrip } from './components/HiAnimeTrendingStrip';
import { HiAnimeTop10 } from './components/HiAnimeTop10';
import { HiAnimeFourColumns } from './components/HiAnimeFourColumns';
import { EstimatedSchedule } from './components/EstimatedSchedule';
import { GenresCard } from './components/GenresCard';
import { AnimeGrid } from './components/AnimeGrid';
import { DetailsView } from './components/details/DetailsView';
import { WatchView } from './components/watch/WatchView';
import { SearchView } from './components/search/SearchView';
import { LibraryView } from './components/LibraryView';
import { HistoryView } from './components/HistoryView';
import { AuthModal } from './components/auth/AuthModal';
import { ProfileModal } from './components/profile/ProfileModal';
import { NotificationDrawer } from './components/notifications/NotificationDrawer';
import { SplashScreen } from './components/SplashScreen';
import { Anime } from './types/anime';
import { User, AppNotification } from './types/user';
import {
  getTrendingAnime,
  getPopularSeasonAnime,
  getTopRatedAnime,
  getRecentlyUpdatedAnime,
  getAnimeDetails
} from './services/anilist';
import { getWatchlist } from './services/storage';
import { enrichAnimeAvailability } from './services/availability';
import { getCurrentUser, restoreAuthSession } from './services/auth';
import { syncUserLibrary } from './services/librarySync';
import {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  clearAllNotifications
} from './services/notifications';

export function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState<'home' | 'details' | 'watch' | 'search' | 'schedule' | 'library' | 'history'>('home');
  const [searchParams, setSearchParams] = useState<{ query?: string; genre?: string }>({});

  const [trending, setTrending] = useState<Anime[]>([]);
  const [popularSeason, setPopularSeason] = useState<Anime[]>([]);
  const [topRated, setTopRated] = useState<Anime[]>([]);
  const [recentlyUpdated, setRecentlyUpdated] = useState<Anime[]>([]);
  const [recentPage, setRecentPage] = useState(1);
  const [loadingRecent, setLoadingRecent] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);

  const handleRecentPageChange = async (newPage: number) => {
    if (newPage < 1 || loadingRecent) return;
    try {
      setLoadingRecent(true);
      const rawRecent = await getRecentlyUpdatedAnime(newPage, 24);
      if (rawRecent && rawRecent.length > 0) {
        setRecentPage(newPage);
        setRecentlyUpdated(rawRecent);
        enrichAnimeAvailability(rawRecent).then((enriched) => {
          const byId = new Map(enriched.map((a) => [a.id, a]));
          setRecentlyUpdated(rawRecent.map((a) => byId.get(a.id) || a));
        }).catch(console.error);
      }
    } catch (err) {
      console.error('Failed to paginate recent anime:', err);
    } finally {
      setLoadingRecent(false);
    }
  };

  // Active viewing states
  const [activeAnime, setActiveAnime] = useState<Anime | null>(null);
  const [activeEpisode, setActiveEpisode] = useState<number>(1);
  const [watchlistCount, setWatchlistCount] = useState(0);

  // User Authentication & Cloud Sync
  const [user, setUser] = useState<User | null>(() => getCurrentUser());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const updateCount = () => {
    setWatchlistCount(getWatchlist().length);
  };

  const reloadNotifications = async (u = user) => {
    try {
      const list = await fetchNotifications(u);
      setNotifications(list);
    } catch (e) {
      console.error(e);
    }
  };

  // Exclusive Local Store Session Auto-Restore on App Startup
  useEffect(() => {
    restoreAuthSession().then((restored) => {
      if (restored) {
        setUser(restored);
        reloadNotifications(restored);
        syncUserLibrary(restored).then(() => updateCount());
      }
    });
  }, []);

  useEffect(() => {
    updateCount();
    reloadNotifications(user);

    // If user is logged in, sync cloud library with local
    if (user) {
      syncUserLibrary(user).then(() => {
        updateCount();
      }).catch(console.error);
    }

    // Periodic in-app notifications sync (every 5 minutes)
    const alertInterval = setInterval(() => {
      reloadNotifications(user);
    }, 5 * 60 * 1000);

    return () => clearInterval(alertInterval);
  }, [user]);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [rawTrending, rawPopular, rawTop, rawRecent] = await Promise.all([
          getTrendingAnime(1, 10),
          getPopularSeasonAnime(1, 12),
          getTopRatedAnime(1, 12),
          getRecentlyUpdatedAnime(1, 24),
        ]);

        setTrending(rawTrending);
        setPopularSeason(rawPopular);
        setTopRated(rawTop);
        setRecentlyUpdated(rawRecent);

        // Enrich with real dub and sub counts from catalog
        const allItems = [...rawTrending, ...rawPopular, ...rawTop, ...rawRecent];
        enrichAnimeAvailability(allItems).then((enriched) => {
          const byId = new Map(enriched.map((a) => [a.id, a]));
          setTrending(rawTrending.map((a) => byId.get(a.id) || a));
          setPopularSeason(rawPopular.map((a) => byId.get(a.id) || a));
          setTopRated(rawTop.map((a) => byId.get(a.id) || a));
          setRecentlyUpdated(rawRecent.map((a) => byId.get(a.id) || a));
        }).catch(console.error);
      } catch (err) {
        console.error('Failed to load anime feed:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (currentTab === 'watch' && activeAnime) {
          setCurrentTab('details');
        } else if (currentTab === 'details') {
          setCurrentTab('home');
        } else if (isSidebarOpen) {
          setIsSidebarOpen(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentTab, activeAnime, isSidebarOpen]);

  // Navigate to Details page
  const handleOpenDetails = (anime: Anime) => {
    setActiveAnime(anime);
    setCurrentTab('details');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Navigate to Watch page
  const handleStartPlay = (anime: Anime, episode = 1) => {
    setActiveAnime(anime);
    setActiveEpisode(episode);
    setCurrentTab('watch');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Navigate to Search page
  const handleOpenSearch = (params: { query?: string; genre?: string }) => {
    setSearchParams(params);
    setCurrentTab('search');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResumeFromHistory = async (animeId: number, episode: number) => {
    try {
      const details = await getAnimeDetails(animeId);
      handleStartPlay(details, episode);
    } catch {
      // Fallback
    }
  };

  const handleSelectNotification = async (notif: AppNotification) => {
    await markNotificationAsRead(notif.id, user);
    reloadNotifications(user);
    setIsNotificationsOpen(false);
    if (notif.animeId) {
      try {
        const details = await getAnimeDetails(notif.animeId);
        handleStartPlay(details, notif.episodeNumber || 1);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleMarkAllRead = async () => {
    const ids = notifications.map((n) => n.id);
    await markAllNotificationsAsRead(ids, user);
    reloadNotifications(user);
  };

  const handleClearAll = async () => {
    const ids = notifications.map((n) => n.id);
    setNotifications([]);
    await clearAllNotifications(ids, user);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#080A0D] text-slate-100 overflow-hidden font-sans relative">
      {/* 1. Sidebar Drawer */}
      <SidebarDrawer
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onNavigate={(tab, filter) => {
          if (tab === 'discover') {
            handleOpenSearch(filter || {});
          } else {
            setCurrentTab(tab as any);
          }
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* 2. Top An:me Navbar with User Auth & Notification integration */}
      <div className="relative z-40">
        <Navbar
          onOpenSidebar={() => setIsSidebarOpen(true)}
          currentTab={currentTab}
          onSelectTab={(tab) => {
            if (tab === 'discover') {
              handleOpenSearch({});
            } else {
              setCurrentTab(tab as any);
            }
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onSelectAnime={handleOpenDetails}
          watchlistCount={watchlistCount}
          user={user}
          unreadNotifCount={notifications.filter((n) => !n.isRead).length}
          onOpenAuth={() => setIsAuthModalOpen(true)}
          onOpenProfile={() => setIsProfileModalOpen(true)}
          onToggleNotifications={() => setIsNotificationsOpen(!isNotificationsOpen)}
          isNotificationsOpen={isNotificationsOpen}
        />

        {/* In-app Notification Dropdown */}
        {isNotificationsOpen && (
          <div className="max-w-[1720px] mx-auto px-4 sm:px-6 relative">
            <NotificationDrawer
              isOpen={isNotificationsOpen}
              onClose={() => setIsNotificationsOpen(false)}
              notifications={notifications}
              onSelectNotification={handleSelectNotification}
              onMarkAllRead={handleMarkAllRead}
              onClearAll={handleClearAll}
            />
          </div>
        )}
      </div>

      {/* 3. Main Views Router */}
      <div className="flex-1 overflow-y-auto">
        {/* VIEW: Watch Page (HiAnime video player & episode sidebar) */}
        {currentTab === 'watch' && activeAnime && (
          <WatchView
            anime={activeAnime}
            currentEpisode={activeEpisode}
            onSelectEpisode={(ep) => setActiveEpisode(ep)}
            onOpenDetails={handleOpenDetails}
            onBack={() => setCurrentTab('home')}
            onSelectAnime={(anime) => handleStartPlay(anime, 1)}
          />
        )}

        {/* VIEW: Details Page (AnimeHero, Overview, Episodes, Characters, Related) */}
        {currentTab === 'details' && activeAnime && (
          <DetailsView
            anime={activeAnime}
            onBack={() => setCurrentTab('home')}
            onPlayEpisode={(anime, ep) => handleStartPlay(anime, ep)}
            onSelectRelated={handleOpenDetails}
          />
        )}

        {/* VIEW: Search & Browse Page (BrowseListing with filters, pagination, sidebar) */}
        {currentTab === 'search' && (
          <SearchView
            initialQuery={searchParams.query}
            initialGenre={searchParams.genre}
            topAnime={topRated}
            onSelectAnime={handleOpenDetails}
            onPlayAnime={(anime) => handleStartPlay(anime, 1)}
          />
        )}

        {/* VIEW: Home Page */}
        {currentTab === 'home' && (
          <main className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 py-4 w-full">
            {/* Spotlight Hero Banner */}
            {loading ? (
              <div className="h-[420px] w-full rounded-xl bg-[#0f1218] animate-pulse flex items-center justify-center text-slate-500 text-sm mb-4">
                Loading spotlight banner...
              </div>
            ) : (
              <HiAnimeSpotlight
                spotlightList={trending}
                onPlay={(anime, ep) => handleStartPlay(anime, ep || 1)}
                onOpenDetails={handleOpenDetails}
              />
            )}

            {/* Trending Strip */}
            <HiAnimeTrendingStrip
              items={trending}
              onSelect={handleOpenDetails}
            />

            {/* 2-Column Section (Main 70% / Sidebar 30%) */}
            <div className="my-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Latest Episodes, Seasonal & Schedule */}
              <div className="lg:col-span-8 flex flex-col gap-6">
                <AnimeGrid
                  title="Latest Episodes"
                  icon={Clock}
                  animeList={recentlyUpdated}
                  onSelectAnime={handleOpenDetails}
                  onPlayAnime={(anime) => handleStartPlay(anime, 1)}
                  page={recentPage}
                  hasPrevPage={recentPage > 1}
                  hasNextPage={true}
                  isLoadingPage={loadingRecent}
                  onPrevPage={() => handleRecentPageChange(recentPage - 1)}
                  onNextPage={() => handleRecentPageChange(recentPage + 1)}
                  onPageChange={handleRecentPageChange}
                />

                <AnimeGrid
                  title="Popular This Season"
                  icon={Sparkles}
                  animeList={popularSeason}
                  onSelectAnime={handleOpenDetails}
                  onPlayAnime={(anime) => handleStartPlay(anime, 1)}
                />

                <EstimatedSchedule
                  onSelectAnime={handleOpenDetails}
                  onPlayAnime={(anime) => handleStartPlay(anime, 1)}
                />
              </div>

              {/* Right Column: Top 10 + Genres */}
              <div className="lg:col-span-4 flex flex-col gap-6">
                <HiAnimeTop10
                  topAnime={topRated}
                  onSelectAnime={handleOpenDetails}
                />

                <GenresCard
                  onSelectGenre={(genre) => {
                    handleOpenSearch({ genre });
                  }}
                />
              </div>
            </div>

            {/* Four Columns (Top Airing, Most Favorite, Latest Completed) */}
            <HiAnimeFourColumns
              topAiring={popularSeason}
              mostFavorite={topRated}
              latestCompleted={trending}
              onSelectAnime={handleOpenDetails}
              onViewMore={() => handleOpenSearch({})}
            />
          </main>
        )}

        {/* VIEW: Airing Schedule */}
        {currentTab === 'schedule' && (
          <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <EstimatedSchedule
              onSelectAnime={handleOpenDetails}
              onPlayAnime={(anime) => handleStartPlay(anime, 1)}
            />
          </div>
        )}

        {/* VIEW: Library */}
        {currentTab === 'library' && (
          <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <LibraryView
              onSelectAnime={handleOpenDetails}
              onPlayAnime={(anime, ep) => handleStartPlay(anime, ep || 1)}
              onUpdateCount={updateCount}
            />
          </div>
        )}

        {/* VIEW: History */}
        {currentTab === 'history' && (
          <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <HistoryView
              onResume={(animeId, ep) => handleResumeFromHistory(animeId, ep)}
            />
          </div>
        )}
      </div>

      {/* Cloud Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={(newUser) => {
          setUser(newUser);
          syncUserLibrary(newUser).then(() => updateCount());
          reloadNotifications(newUser);
        }}
      />

      {/* User Profile Modal (Name Changing, Logo/Avatar Changing, Cloud Sync) */}
      {user && (
        <ProfileModal
          isOpen={isProfileModalOpen}
          user={user}
          onClose={() => setIsProfileModalOpen(false)}
          onProfileUpdated={(updated) => setUser(updated)}
          onLogout={() => {
            setUser(null);
            updateCount();
            reloadNotifications(null);
          }}
          libraryCount={watchlistCount}
        />
      )}

      {/* Cinematic Branded App Launch Splash Screen */}
      {showSplash && (
        <SplashScreen
          isLoading={loading}
          onFinished={() => setShowSplash(false)}
        />
      )}
    </div>
  );
}
