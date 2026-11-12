import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  Loader2,
  LogOut,
  Sparkles,
  Database,
  Bookmark,
  AlertCircle,
  Edit2,
  Camera,
  RefreshCw,
  Download,
  ExternalLink,
  CheckCircle2,
  ArrowUpCircle
} from 'lucide-react';
import { User } from '../../types/user';
import { updateProfile, logout } from '../../services/auth';
import { getAvatarSrc, getAvatarInfo } from '../../services/avatarRegistry';
import { checkForAppUpdate, UpdateInfo } from '../../services/updater';
import { AvatarPicker } from './AvatarPicker';

interface ProfileModalProps {
  isOpen: boolean;
  user: User;
  onClose: () => void;
  onProfileUpdated: (updated: User) => void;
  onLogout: () => void;
  libraryCount?: number;
}

export function ProfileModal({
  isOpen,
  user,
  onClose,
  onProfileUpdated,
  onLogout,
  libraryCount = 0,
}: ProfileModalProps) {
  const [username, setUsername] = useState(user.username);
  const [avatar, setAvatar] = useState(user.avatar || 'avatar-01');
  const [isEditingName, setIsEditingName] = useState(false);
  const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // App Update states
  const [appVersion, setAppVersion] = useState<string>('1.0.0');
  const [updateStatus, setUpdateStatus] = useState<'idle' | 'checking' | 'up-to-date' | 'available' | 'downloading' | 'installing' | 'error'>('idle');
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<{ percent: number; transferredMB: number; totalMB: number } | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);

  useEffect(() => {
    const api = (window as any).electronAPI;
    if (api?.getAppVersion) {
      api.getAppVersion().then((v: string) => {
        if (v) setAppVersion(v);
      }).catch(console.error);
    }
  }, []);

  const handleCheckUpdates = async () => {
    setUpdateError(null);
    setUpdateStatus('checking');
    try {
      const res = await checkForAppUpdate();
      setUpdateInfo(res);
      if (res.isUpdateAvailable) {
        setUpdateStatus('available');
      } else {
        setUpdateStatus('up-to-date');
      }
    } catch (err: any) {
      setUpdateError(err?.message || 'Failed to check GitHub releases.');
      setUpdateStatus('error');
    }
  };

  const handleInstallUpdate = async () => {
    if (!updateInfo?.downloadUrl) return;
    const api = (window as any).electronAPI;

    if (api?.updater?.downloadAndInstall) {
      setUpdateStatus('downloading');
      setDownloadProgress({ percent: 5, transferredMB: 12, totalMB: 245 });

      const unsub = api.updater.onProgress((data: any) => {
        if (data?.percent !== undefined) {
          setDownloadProgress({
            percent: data.percent,
            transferredMB: data.transferredMB || Math.round((data.percent / 100) * 245),
            totalMB: data.totalMB || 245,
          });
        }
        if (data?.status === 'installing') {
          setUpdateStatus('installing');
        } else if (data?.status === 'error') {
          setUpdateError(data.error || 'Download failed');
          setUpdateStatus('error');
        }
      });

      try {
        await api.updater.downloadAndInstall(updateInfo.downloadUrl, updateInfo.assetName || 'An-me.Setup.exe');
      } catch (err: any) {
        setUpdateError(err?.message || 'Failed to install update');
        setUpdateStatus('error');
      } finally {
        unsub?.();
      }
    } else {
      // Browser fallback
      window.open(updateInfo.downloadUrl, '_blank');
    }
  };

  if (!isOpen) return null;

  const currentAvatarInfo = getAvatarInfo(avatar);
  const avatarSrc = getAvatarSrc(avatar);

  const handleSave = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const updated = await updateProfile(user.id, {
        username: username.trim(),
        avatar,
      });
      onProfileUpdated(updated);
      setIsEditingName(false);
      setSuccessMsg('Profile updated and saved to web database!');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    logout();
    onLogout();
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg bg-[#0F1218] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="p-5 border-b border-white/[0.08] flex items-center justify-between bg-gradient-to-r from-red-950/20 via-pink-950/20 to-blue-950/20">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-white">User Profile</h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold flex items-center gap-1">
                <Database className="w-2.5 h-2.5" /> Cloud Connected
              </span>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content Body */}
          <div className="p-6 flex flex-col gap-5 max-h-[75vh] overflow-y-auto">
            {/* Alerts */}
            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}
            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* User Hero Preview with Clickable Avatar */}
            <div className="p-4 rounded-xl bg-[#141722] border border-white/[0.08] flex items-center gap-4">
              <div className="relative group shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAvatarPickerOpen(true)}
                  title="Click to change avatar"
                  className="w-16 h-16 rounded-full overflow-hidden border-2 border-pink-500/80 shadow-lg shadow-pink-600/30 flex items-center justify-center cursor-pointer transition-transform group-hover:scale-105 focus:outline-none"
                >
                  <img
                    src={avatarSrc}
                    alt={user.username}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
                    <Camera className="w-5 h-5 text-white" />
                  </div>
                </button>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-pink-500 text-white flex items-center justify-center shadow pointer-events-none ring-2 ring-[#141722]">
                  <Edit2 className="w-2.5 h-2.5" />
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {isEditingName ? (
                    <div className="flex items-center gap-1.5 flex-1">
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="bg-black/40 border border-pink-500/50 rounded-lg px-2.5 py-1 text-sm font-bold text-white focus:outline-none w-full max-w-[200px]"
                      />
                      <button
                        onClick={() => setIsEditingName(false)}
                        className="text-xs text-slate-400 hover:text-white px-1.5 py-1 rounded"
                      >
                        Done
                      </button>
                    </div>
                  ) : (
                    <>
                      <h3 className="text-lg font-black text-white truncate">{username}</h3>
                      <button
                        onClick={() => setIsEditingName(true)}
                        title="Edit username"
                        className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-pink-400 transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                  {user.isVip && (
                    <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 text-black text-[10px] font-black tracking-wider shadow-sm flex items-center gap-0.5">
                      <Sparkles className="w-2.5 h-2.5" /> VIP
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 truncate mt-0.5">{user.email}</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Avatar: <span className="text-pink-400 font-medium">{currentAvatarInfo.name}</span> • Member since {user.joinedAt}
                </p>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 shrink-0">
                  <Bookmark className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cloud Library</p>
                  <p className="text-sm font-black text-white">{libraryCount} Saved</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Database</p>
                  <p className="text-sm font-black text-white">Turso Live</p>
                </div>
              </div>
            </div>

            {/* Profile Avatar Selection Section */}
            <div className="p-4 rounded-xl bg-[#141722] border border-white/[0.08]">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Profile Avatar
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Currently selected: <span className="text-pink-400 font-semibold">{currentAvatarInfo.name}</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAvatarPickerOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-pink-500/20 hover:bg-pink-500/30 border border-pink-500/40 text-pink-300 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Choose Avatar</span>
                </button>
              </div>

              {/* Quick Preview strip of avatars */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 scrollbar-thin">
                {['avatar-01', 'avatar-02', 'avatar-03', 'avatar-05', 'avatar-07', 'avatar-09', 'avatar-11', 'avatar-12', 'avatar-18', 'avatar-22'].map((id) => {
                  const info = getAvatarInfo(id);
                  const isSelected = avatar === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setAvatar(id)}
                      title={info.name}
                      className={`relative w-10 h-10 rounded-full shrink-0 transition-transform cursor-pointer focus:outline-none ${
                        isSelected
                          ? 'ring-2 ring-pink-500 scale-105 shadow-md shadow-pink-500/40'
                          : 'opacity-70 hover:opacity-100 hover:scale-105'
                      }`}
                    >
                      <img
                        src={info.src}
                        alt={info.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setIsAvatarPickerOpen(true)}
                  className="w-10 h-10 rounded-full shrink-0 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
                  title="View all 30 avatars"
                >
                  +20
                </button>
              </div>
            </div>

            {/* App Version & Auto-Update Card */}
            <div className="p-4 rounded-xl bg-[#141722] border border-white/[0.08] flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400">
                    <ArrowUpCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <span>An:me Updates</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-slate-300 font-mono font-normal">
                        v{appVersion}
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Check for updates or install the latest release directly from GitHub.
                    </p>
                  </div>
                </div>

                {updateStatus === 'idle' && (
                  <button
                    type="button"
                    onClick={handleCheckUpdates}
                    className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-200 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-pink-400" />
                    <span>Check for Updates</span>
                  </button>
                )}

                {updateStatus === 'checking' && (
                  <div className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-400 flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-pink-400" />
                    <span>Checking GitHub...</span>
                  </div>
                )}
              </div>

              {/* Status: Up to date */}
              {updateStatus === 'up-to-date' && (
                <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/20 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-emerald-300 font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>You're on the latest version of An:me! (v{appVersion})</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCheckUpdates}
                    className="text-[11px] font-bold text-slate-400 hover:text-white underline cursor-pointer"
                  >
                    Check again
                  </button>
                </div>
              )}

              {/* Status: Error */}
              {updateStatus === 'error' && (
                <div className="p-3 rounded-lg bg-red-950/20 border border-red-500/20 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-red-300">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>{updateError || 'Unable to contact GitHub releases.'}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCheckUpdates}
                    className="text-[11px] font-bold text-slate-400 hover:text-white underline cursor-pointer"
                  >
                    Retry
                  </button>
                </div>
              )}

              {/* Status: Update Available */}
              {updateStatus === 'available' && updateInfo && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-pink-950/40 via-purple-950/30 to-black/40 border border-pink-500/40 shadow-lg shadow-pink-600/10 flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full bg-pink-500/20 border border-pink-500/30 text-pink-300 text-[10px] font-black tracking-wider uppercase">
                          Update Available
                        </span>
                        <span className="text-xs font-mono font-bold text-white">v{updateInfo.latestVersion}</span>
                      </div>
                      <h5 className="text-sm font-extrabold text-white mt-1">
                        {updateInfo.releaseName}
                      </h5>
                      <p className="text-xs text-slate-300 mt-0.5">
                        A new update is available on GitHub. Would you like to install it now?
                      </p>
                    </div>

                    <a
                      href="https://github.com/Prithibi17/An-me/releases/latest"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-slate-400 hover:text-pink-400 flex items-center gap-1 transition-colors shrink-0"
                    >
                      <span>Notes</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] font-mono text-slate-400">
                      {updateInfo.isDeltaUpdate ? 'In-place update package: ' : 'Package size: '}~{updateInfo.assetSize ? `${Math.round(updateInfo.assetSize / (1024 * 1024))} MB` : '14 MB'}
                    </span>
                    <button
                      type="button"
                      onClick={handleInstallUpdate}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-pink-600/30 transition-all active:scale-95 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{updateInfo.isDeltaUpdate ? 'Apply Update Now' : 'Update An:me'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Status: Downloading */}
              {updateStatus === 'downloading' && (
                <div className="p-4 rounded-xl bg-[#0f121b] border border-pink-500/30 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-white flex items-center gap-2">
                      <Download className="w-3.5 h-3.5 text-pink-400 animate-bounce" />
                      Downloading Update...
                    </span>
                    <span className="font-mono text-pink-400">
                      {downloadProgress?.percent || 0}%
                    </span>
                  </div>

                  <div className="w-full h-2.5 rounded-full bg-white/5 border border-white/10 overflow-hidden p-0.5">
                    <div
                      style={{ width: `${downloadProgress?.percent || 0}%` }}
                      className="h-full rounded-full bg-gradient-to-r from-pink-500 to-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.7)] transition-all duration-200"
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span>{downloadProgress?.transferredMB || 0} MB / {downloadProgress?.totalMB || 14} MB</span>
                    <span>Please do not close An:me</span>
                  </div>
                </div>
              )}

              {/* Status: Installing */}
              {updateStatus === 'installing' && (
                <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 flex items-center gap-3">
                  <Loader2 className="w-5 h-5 text-emerald-400 animate-spin shrink-0" />
                  <div>
                    <h5 className="text-xs font-bold text-white">Applying In-Place Update...</h5>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Updating files and restarting An:me into the new version.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons Footer */}
          <div className="p-4 border-t border-white/[0.08] bg-black/40 flex items-center justify-between gap-3">
            <button
              onClick={handleSignOut}
              className="px-3.5 py-2 rounded-xl border border-red-500/30 bg-red-950/20 hover:bg-red-900/30 text-red-400 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-red-500 via-pink-500 to-blue-600 hover:from-red-600 hover:via-pink-600 hover:to-blue-700 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-md shadow-pink-600/30 transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 30-Avatar Selection Dialog */}
      <AvatarPicker
        isOpen={isAvatarPickerOpen}
        currentAvatarId={avatar}
        onSelect={(newId) => {
          setAvatar(newId);
          setIsAvatarPickerOpen(false);
        }}
        onClose={() => setIsAvatarPickerOpen(false)}
      />
    </>
  );
}
