import React from 'react';
import { Bell, Check, X, Tv, Megaphone, Info, Play, Clock, Trash2 } from 'lucide-react';
import { AppNotification } from '../../types/user';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onSelectNotification: (notif: AppNotification) => void;
  onMarkAllRead: () => void;
  onClearAll: () => void;
}

function formatRelativeTime(dateString: string): string {
  try {
    const diff = Date.now() - new Date(dateString).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return 'Recently';
  }
}

export function NotificationDrawer({
  isOpen,
  onClose,
  notifications,
  onSelectNotification,
  onMarkAllRead,
  onClearAll,
}: NotificationDrawerProps) {
  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="absolute right-0 top-full mt-2 w-96 sm:w-[420px] bg-[#0E1118] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 animate-fade-in flex flex-col"
    >
      {/* Top Header */}
      <div className="p-3.5 px-4 border-b border-white/[0.08] flex items-center justify-between bg-gradient-to-r from-red-950/20 via-pink-950/20 to-blue-950/20">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-pink-600/20 text-pink-400 border border-pink-500/30 flex items-center justify-center">
            <Bell className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-black text-white">Notifications</span>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-pink-600 text-white text-[10px] font-black shadow-sm">
              {unreadCount}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={onMarkAllRead}
              title="Mark all as read"
              className="text-[11px] font-bold text-slate-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer px-1.5 py-0.5 rounded hover:bg-white/5"
            >
              <Check className="w-3 h-3 text-emerald-400" />
              <span>Mark read</span>
            </button>
          )}

          {notifications.length > 0 && (
            <button
              onClick={onClearAll}
              title="Clear all notifications"
              className="text-[11px] font-bold text-red-400/90 hover:text-red-300 flex items-center gap-1 transition-colors cursor-pointer px-1.5 py-0.5 rounded hover:bg-red-950/30"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear all</span>
            </button>
          )}

          <button
            onClick={onClose}
            aria-label="Close notifications"
            className="w-6 h-6 rounded-md bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer ml-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Notifications List (Direct from Database) */}
      <div className="max-h-[460px] overflow-y-auto divide-y divide-white/[0.06] scrollbar-thin">
        {notifications.length === 0 ? (
          <div className="py-14 text-center text-slate-500 text-xs flex flex-col items-center gap-2">
            <Bell className="w-9 h-9 opacity-30 text-slate-400" />
            <p className="font-semibold text-slate-400">No notifications</p>
            <p className="text-[11px] text-slate-500">You're all caught up with episode drops and updates.</p>
          </div>
        ) : (
          notifications.map((notif) => {
            const isEpisodeDrop = notif.type === 'episode_drop';
            const isAnnouncement = notif.type === 'announcement';

            const badgeBg = isEpisodeDrop
              ? 'bg-pink-600/20 text-pink-400 border-pink-500/30'
              : isAnnouncement
              ? 'bg-blue-600/20 text-blue-400 border-blue-500/30'
              : 'bg-emerald-600/20 text-emerald-400 border-emerald-500/30';

            return (
              <div
                key={notif.id}
                onClick={() => onSelectNotification(notif)}
                className={`p-3.5 flex gap-3.5 items-start transition-all cursor-pointer relative group ${
                  notif.isRead
                    ? 'bg-transparent hover:bg-white/[0.03]'
                    : 'bg-pink-950/[0.12] hover:bg-pink-950/[0.20]'
                }`}
              >
                {/* Unread indicator bar */}
                {!notif.isRead && (
                  <div className="absolute left-0 top-3 bottom-3 w-1 rounded-r bg-pink-500 shadow-sm" />
                )}

                {/* Poster Card */}
                {notif.animeCover ? (
                  <div className="relative w-14 sm:w-16 h-20 sm:h-22 rounded-xl overflow-hidden shrink-0 border border-white/10 bg-black/50 shadow-md group-hover:scale-105 transition-transform">
                    <img
                      src={notif.animeCover}
                      alt={notif.animeTitle || notif.title}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                    {notif.episodeNumber && (
                      <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded-md bg-black/80 text-pink-400 text-[9px] font-black border border-pink-500/40 backdrop-blur-xs">
                        EP {notif.episodeNumber}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="w-12 h-16 rounded-xl bg-[#161a24] border border-white/10 flex items-center justify-center text-slate-300 shrink-0">
                    {isEpisodeDrop ? (
                      <Tv className="w-5 h-5 text-pink-400" />
                    ) : isAnnouncement ? (
                      <Megaphone className="w-5 h-5 text-blue-400" />
                    ) : (
                      <Info className="w-5 h-5 text-emerald-400" />
                    )}
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    {/* Badge & Timestamp */}
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border uppercase tracking-wider ${badgeBg}`}>
                        {isEpisodeDrop ? 'Episode Drop' : isAnnouncement ? 'Announcement' : 'System'}
                      </span>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {formatRelativeTime(notif.createdAt)}
                      </span>
                    </div>

                    {/* Post Title */}
                    <h4 className="text-xs font-extrabold text-white leading-snug line-clamp-1 group-hover:text-pink-400 transition-colors">
                      {notif.title}
                    </h4>

                    {/* Description */}
                    <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2 mt-1">
                      {notif.message}
                    </p>
                  </div>

                  {/* Action Link */}
                  {notif.animeId && (
                    <div className="mt-2 flex items-center gap-1.5 text-[11px] font-extrabold text-pink-400 group-hover:text-pink-300 transition-colors">
                      <Play className="w-3 h-3 fill-current" />
                      <span>Watch Episode</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="p-2.5 px-4 bg-black/40 border-t border-white/[0.05] text-[10px] text-center text-slate-500 flex items-center justify-between">
        <span>Cloud Database Sync</span>
        <span className="text-emerald-400 font-semibold">• Live Feed</span>
      </div>
    </div>
  );
}
