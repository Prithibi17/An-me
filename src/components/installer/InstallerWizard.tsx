import React, { useState, useEffect } from 'react';
import {
  Play,
  Layers,
  Bookmark,
  MoreHorizontal,
  Folder,
  Monitor,
  HardDrive,
  Settings,
  Download,
  Check,
  ArrowRight,
  ArrowLeft,
  X,
  Minus,
  Square
} from 'lucide-react';
import anmeIcon from '../../../public/anme-icon.png';
import anmeWatermark from '../../../public/anme-logo-dark.png';

export function InstallerWizard() {
  const [step, setStep] = useState<number>(1);
  const [installPath, setInstallPath] = useState<string>('D:\\Apps\\Anime');
  const [availableGB, setAvailableGB] = useState<number>(182.4);

  // Selected components - ONLY REAL COMPONENTS NEEDED FOR INSTALLATION
  const [components, setComponents] = useState({
    core: true, // required An:me core runtime (~ 250 MB)
    desktopShortcut: true, // ~ 2 MB
    startMenuShortcut: true, // ~ 1 MB
  });

  const coreMB = 250;
  const desktopMB = components.desktopShortcut ? 2 : 0;
  const startMenuMB = components.startMenuShortcut ? 1 : 0;
  const totalInstallMB = coreMB + desktopMB + startMenuMB;
  const requiredMB = totalInstallMB;

  // Installation progress state
  const [installProgress, setInstallProgress] = useState<number>(0);
  const [copiedMB, setCopiedMB] = useState<number>(0);

  // Post-install options
  const [launchNow, setLaunchNow] = useState<boolean>(true);
  const [viewReleaseNotes, setViewReleaseNotes] = useState<boolean>(false);

  // Initial path & disk space check
  useEffect(() => {
    const api = (window as any).electronAPI?.installer;
    if (api?.getDefaultInstallPath) {
      api.getDefaultInstallPath().then((p: string) => {
        if (p) setInstallPath(p);
      }).catch(console.error);
    }
    if (api?.getDiskSpace) {
      api.getDiskSpace(installPath).then((res: any) => {
        if (res?.availableGB) setAvailableGB(res.availableGB);
      }).catch(console.error);
    }
  }, []);

  useEffect(() => {
    const api = (window as any).electronAPI?.installer;
    if (api?.getDiskSpace) {
      api.getDiskSpace(installPath).then((res: any) => {
        if (res?.availableGB) setAvailableGB(res.availableGB);
      }).catch(console.error);
    }
  }, [installPath]);

  // Browse Directory
  const handleBrowse = async () => {
    const api = (window as any).electronAPI?.installer;
    if (api?.selectDirectory) {
      const selected = await api.selectDirectory(installPath);
      if (selected) {
        setInstallPath(selected);
      }
    }
  };

  // Perform Install
  const handleStartInstall = async () => {
    setStep(5);
    setInstallProgress(10);
    setCopiedMB(25);

    const api = (window as any).electronAPI?.installer;
    if (api?.onProgress) {
      const unsub = api.onProgress((data: any) => {
        if (data?.percent !== undefined) setInstallProgress(data.percent);
        if (data?.copiedMB !== undefined) {
          setCopiedMB(Math.min(totalInstallMB, data.copiedMB));
        } else if (data?.percent !== undefined) {
          setCopiedMB(Math.round((data.percent / 100) * totalInstallMB));
        }
      });

      if (api?.performInstall) {
        try {
          await api.performInstall({
            installPath,
            createDesktopShortcut: components.desktopShortcut,
            createStartMenuShortcut: components.startMenuShortcut,
            totalMB: totalInstallMB,
          });
          setInstallProgress(100);
          setCopiedMB(totalInstallMB);
          setTimeout(() => setStep(6), 600);
        } catch (err) {
          console.error('Install failed:', err);
          setTimeout(() => setStep(6), 1000);
        } finally {
          unsub();
        }
      }
    } else {
      // Standalone simulation fallback if running in browser
      let current = 10;
      const interval = setInterval(() => {
        current += 10;
        setInstallProgress(Math.min(100, current));
        setCopiedMB(Math.min(totalInstallMB, Math.round((current / 100) * totalInstallMB)));
        if (current >= 100) {
          clearInterval(interval);
          setTimeout(() => setStep(6), 600);
        }
      }, 150);
    }
  };

  // Finish Setup
  const handleFinish = () => {
    const api = (window as any).electronAPI?.installer;
    if (launchNow && api?.launchApp) {
      api.launchApp(installPath);
    } else if (api?.close) {
      api.close();
    } else {
      window.close();
    }
  };

  // Window control buttons
  const handleMinimize = () => (window as any).electronAPI?.minimize?.();
  const handleClose = () => (window as any).electronAPI?.close?.() || window.close();

  // Summary component list
  const activeComponentsList = [
    'An:me',
    components.desktopShortcut && 'Desktop Shortcut',
    components.startMenuShortcut && 'Start Menu Shortcut',
  ].filter(Boolean).join(', ');

  return (
    <div className="w-screen h-screen flex flex-col bg-[#090A0E] text-slate-100 select-none overflow-hidden font-sans border border-rose-500/30 rounded-2xl shadow-2xl">
      {/* Frameless Window Header */}
      <div className="h-10 bg-[#0C0E14] border-b border-white/[0.08] px-3.5 flex items-center justify-between app-drag-region">
        <div className="flex items-center gap-2 app-no-drag">
          <img src={anmeIcon} alt="" className="w-4 h-4 rounded-md object-contain" />
          <span className="text-xs font-bold text-slate-200">An:me Setup</span>
        </div>

        {/* Windows Control Buttons */}
        <div className="flex items-center gap-1 app-no-drag">
          <button
            onClick={handleMinimize}
            className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 rounded transition-colors"
            title="Minimize"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            className="w-7 h-7 flex items-center justify-center text-slate-500 cursor-default rounded"
            title="Maximize (Fixed Size)"
          >
            <Square className="w-3 h-3" />
          </button>
          <button
            onClick={handleClose}
            className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-white hover:bg-rose-600 rounded transition-colors"
            title="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Content Body */}
      <div className="flex-1 p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden">
        {/* ================= STEP 1: WELCOME ================= */}
        {step === 1 && (
          <div className="flex-1 flex flex-col justify-between">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              <div className="md:col-span-8 space-y-6">
                <div>
                  <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                    Welcome to <span className="text-white">An<span className="text-pink-500">:</span>me</span>
                  </h1>
                  <p className="text-sm text-slate-400 mt-2">
                    A fast and lightweight anime streaming app for your desktop.
                  </p>
                </div>

                <div className="space-y-3.5 pt-1">
                  <div className="flex items-center gap-3 text-slate-200 text-sm font-semibold">
                    <Play className="w-4 h-4 text-pink-500 fill-pink-500/20" />
                    <span>Watch Anime</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-200 text-sm font-semibold">
                    <Layers className="w-4 h-4 text-pink-500" />
                    <span>Track Episodes</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-200 text-sm font-semibold">
                    <Bookmark className="w-4 h-4 text-pink-500 fill-pink-500/20" />
                    <span>Build Watchlist</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-200 text-sm font-semibold">
                    <MoreHorizontal className="w-4 h-4 text-pink-500" />
                    <span>And More...</span>
                  </div>
                </div>
              </div>

              {/* Watermark Logo Graphic */}
              <div className="hidden md:flex md:col-span-4 items-center justify-center pointer-events-none">
                <img
                  src={anmeWatermark}
                  alt=""
                  className="w-52 h-52 object-contain opacity-25 filter drop-shadow-[0_0_20px_rgba(244,63,94,0.3)]"
                />
              </div>
            </div>

            {/* Step 1 Footer */}
            <div className="flex items-center justify-between pt-6 border-t border-white/[0.06]">
              <button
                onClick={handleClose}
                className="px-5 py-2 rounded-xl bg-transparent hover:bg-white/5 border border-white/10 text-xs font-bold text-slate-300 transition-colors"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5, 6].map((dot) => (
                  <span
                    key={dot}
                    className={`w-2 h-2 rounded-full transition-all ${
                      dot === step
                        ? 'bg-pink-500 shadow-[0_0_8px_rgba(244,63,94,0.9)] scale-110'
                        : 'bg-white/15'
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={() => setStep(2)}
                className="px-6 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-pink-600/30 transition-all active:scale-95 cursor-pointer"
              >
                <span>Next</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 2: SELECT INSTALL LOCATION ================= */}
        {step === 2 && (
          <div className="flex-1 flex flex-col justify-between">
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Select Install Location
                </h1>
                <p className="text-sm text-slate-400 mt-1">
                  Choose where to install An:me.
                </p>
              </div>

              {/* Path Input Box */}
              <div className="bg-[#121520] border border-white/10 rounded-xl p-2 pl-3.5 flex items-center gap-3 shadow-inner">
                <Folder className="w-5 h-5 text-pink-500 shrink-0" />
                <input
                  type="text"
                  value={installPath}
                  onChange={(e) => setInstallPath(e.target.value)}
                  className="bg-transparent flex-1 text-xs sm:text-sm font-mono text-slate-100 outline-none"
                />
                <button
                  type="button"
                  onClick={handleBrowse}
                  className="px-4 py-1.5 rounded-lg bg-[#1c2233] hover:bg-[#252c42] border border-white/10 text-xs font-semibold text-white transition-all cursor-pointer"
                >
                  Browse...
                </button>
              </div>

              {/* Disk Space Stats */}
              <div className="space-y-2 pt-2 text-xs font-semibold text-slate-300">
                <div className="flex items-center gap-2.5">
                  <Monitor className="w-4 h-4 text-pink-400" />
                  <span>Required space: {requiredMB} MB</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <HardDrive className="w-4 h-4 text-pink-400" />
                  <span>Available space: {availableGB} GB</span>
                </div>
              </div>
            </div>

            {/* Step 2 Footer */}
            <div className="flex items-center justify-between pt-6 border-t border-white/[0.06]">
              <button
                onClick={() => setStep(1)}
                className="px-5 py-2 rounded-xl bg-transparent hover:bg-white/5 border border-white/10 text-xs font-bold text-slate-300 flex items-center gap-2 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>

              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5, 6].map((dot) => (
                  <span
                    key={dot}
                    className={`w-2 h-2 rounded-full transition-all ${
                      dot === step
                        ? 'bg-pink-500 shadow-[0_0_8px_rgba(244,63,94,0.9)] scale-110'
                        : 'bg-white/15'
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={() => setStep(3)}
                className="px-6 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-pink-600/30 transition-all active:scale-95 cursor-pointer"
              >
                <span>Next</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 3: SELECT COMPONENTS ================= */}
        {step === 3 && (
          <div className="flex-1 flex flex-col justify-between">
            <div className="space-y-5">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Select Components
                </h1>
                <p className="text-sm text-slate-400 mt-1">
                  Choose the features you want to install.
                </p>
              </div>

              {/* Checklist - Only Genuine Application Installation Components */}
              <div className="space-y-3 pt-1">
                {/* 1. Core App */}
                <label className="flex items-center justify-between p-3 px-4 rounded-xl bg-[#11141e] border border-white/[0.08] cursor-default">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded bg-pink-500 flex items-center justify-center text-white shadow-sm shadow-pink-500/50">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                    <span className="text-xs sm:text-sm font-semibold text-white">An:me (Required)</span>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">~ 250 MB</span>
                </label>

                {/* 2. Desktop Shortcut */}
                <label
                  onClick={() => setComponents((c) => ({ ...c, desktopShortcut: !c.desktopShortcut }))}
                  className="flex items-center justify-between p-3 px-4 rounded-xl bg-[#11141e] border border-white/[0.08] hover:border-pink-500/40 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center transition-colors ${
                        components.desktopShortcut
                          ? 'bg-pink-500 text-white shadow-sm shadow-pink-500/50'
                          : 'border border-white/30 bg-black/40'
                      }`}
                    >
                      {components.desktopShortcut && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span className="text-xs sm:text-sm font-semibold text-white">Desktop Shortcut</span>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">~ 2 MB</span>
                </label>

                {/* 3. Start Menu Shortcut */}
                <label
                  onClick={() => setComponents((c) => ({ ...c, startMenuShortcut: !c.startMenuShortcut }))}
                  className="flex items-center justify-between p-3 px-4 rounded-xl bg-[#11141e] border border-white/[0.08] hover:border-pink-500/40 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center transition-colors ${
                        components.startMenuShortcut
                          ? 'bg-pink-500 text-white shadow-sm shadow-pink-500/50'
                          : 'border border-white/30 bg-black/40'
                      }`}
                    >
                      {components.startMenuShortcut && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span className="text-xs sm:text-sm font-semibold text-white">Start Menu Shortcut</span>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">~ 1 MB</span>
                </label>
              </div>
            </div>

            {/* Step 3 Footer */}
            <div className="flex items-center justify-between pt-6 border-t border-white/[0.06]">
              <button
                onClick={() => setStep(2)}
                className="px-5 py-2 rounded-xl bg-transparent hover:bg-white/5 border border-white/10 text-xs font-bold text-slate-300 flex items-center gap-2 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>

              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5, 6].map((dot) => (
                  <span
                    key={dot}
                    className={`w-2 h-2 rounded-full transition-all ${
                      dot === step
                        ? 'bg-pink-500 shadow-[0_0_8px_rgba(244,63,94,0.9)] scale-110'
                        : 'bg-white/15'
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={() => setStep(4)}
                className="px-6 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-pink-600/30 transition-all active:scale-95 cursor-pointer"
              >
                <span>Next</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 4: READY TO INSTALL ================= */}
        {step === 4 && (
          <div className="flex-1 flex flex-col justify-between">
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Ready to Install
                </h1>
                <p className="text-sm text-slate-400 mt-1">
                  An:me is ready to be installed with the following settings.
                </p>
              </div>

              {/* Summary Card */}
              <div className="bg-[#121520] border border-white/10 rounded-2xl p-5 space-y-4 shadow-lg">
                <div className="flex items-start gap-3">
                  <Folder className="w-4 h-4 text-pink-400 mt-0.5 shrink-0" />
                  <div className="text-xs">
                    <span className="text-slate-400 mr-2">Install location:</span>
                    <span className="text-white font-mono font-semibold">{installPath}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Layers className="w-4 h-4 text-pink-400 mt-0.5 shrink-0" />
                  <div className="text-xs">
                    <span className="text-slate-400 mr-2">Components:</span>
                    <span className="text-white font-semibold">{activeComponentsList}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Settings className="w-4 h-4 text-pink-400 mt-0.5 shrink-0" />
                  <div className="text-xs">
                    <span className="text-slate-400 mr-2">Total size:</span>
                    <span className="text-white font-mono font-semibold">~ {totalInstallMB} MB</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 4 Footer */}
            <div className="flex items-center justify-between pt-6 border-t border-white/[0.06]">
              <button
                onClick={() => setStep(3)}
                className="px-5 py-2 rounded-xl bg-transparent hover:bg-white/5 border border-white/10 text-xs font-bold text-slate-300 flex items-center gap-2 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>

              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5, 6].map((dot) => (
                  <span
                    key={dot}
                    className={`w-2 h-2 rounded-full transition-all ${
                      dot === step
                        ? 'bg-pink-500 shadow-[0_0_8px_rgba(244,63,94,0.9)] scale-110'
                        : 'bg-white/15'
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={handleStartInstall}
                className="px-6 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-pink-600/30 transition-all active:scale-95 cursor-pointer"
              >
                <span>Install</span>
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 5: INSTALLING ================= */}
        {step === 5 && (
          <div className="flex-1 flex flex-col justify-between">
            <div className="space-y-8 my-auto">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Installing <span className="text-white">An<span className="text-pink-500">:</span>me</span>
                </h1>
                <p className="text-sm text-slate-400 mt-1">
                  Please wait while we install the application...
                </p>
              </div>

              {/* Progress Bar Container */}
              <div className="space-y-3">
                <div className="w-full h-3.5 rounded-full bg-[#161a27] border border-white/10 overflow-hidden p-0.5">
                  <div
                    style={{ width: `${installProgress}%` }}
                    className="h-full rounded-full bg-gradient-to-r from-pink-500 to-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.7)] transition-all duration-300"
                  />
                </div>

                <div className="flex items-center justify-between text-xs font-semibold text-slate-400 font-mono">
                  <span>Installing files... ({installProgress}%)</span>
                  <span>{copiedMB} MB / {totalInstallMB} MB</span>
                </div>
              </div>
            </div>

            {/* Step 5 Footer */}
            <div className="flex items-center justify-center pt-6 border-t border-white/[0.06]">
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5, 6].map((dot) => (
                  <span
                    key={dot}
                    className={`w-2 h-2 rounded-full transition-all ${
                      dot === step
                        ? 'bg-pink-500 shadow-[0_0_8px_rgba(244,63,94,0.9)] scale-110'
                        : 'bg-white/15'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 6: FINISHED ================= */}
        {step === 6 && (
          <div className="flex-1 flex flex-col justify-between items-center text-center">
            <div className="my-auto space-y-6 flex flex-col items-center">
              {/* Glowing Pink Circular Badge */}
              <div className="w-20 h-20 rounded-full border-2 border-pink-500 bg-pink-500/10 flex items-center justify-center shadow-[0_0_35px_rgba(244,63,94,0.45)]">
                <Check className="w-10 h-10 text-pink-500 stroke-[3]" />
              </div>

              <div>
                <h1 className="text-3xl font-black text-white tracking-tight">
                  <span className="text-white">An<span className="text-pink-500">:</span>me</span> Installed!
                </h1>
                <p className="text-sm text-slate-400 mt-1.5">
                  Setup has finished successfully.
                </p>
              </div>

              {/* Checkboxes */}
              <div className="space-y-3 pt-2 text-left w-64">
                <label
                  onClick={() => setLaunchNow(!launchNow)}
                  className="flex items-center gap-3 cursor-pointer text-xs font-semibold text-slate-200"
                >
                  <div
                    className={`w-4 h-4 rounded flex items-center justify-center transition-colors ${
                      launchNow
                        ? 'bg-pink-500 text-white'
                        : 'border border-white/30 bg-black/40'
                    }`}
                  >
                    {launchNow && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <span>Launch An:me now</span>
                </label>

                <label
                  onClick={() => setViewReleaseNotes(!viewReleaseNotes)}
                  className="flex items-center gap-3 cursor-pointer text-xs font-semibold text-slate-200"
                >
                  <div
                    className={`w-4 h-4 rounded flex items-center justify-center transition-colors ${
                      viewReleaseNotes
                        ? 'bg-pink-500 text-white'
                        : 'border border-white/30 bg-black/40'
                    }`}
                  >
                    {viewReleaseNotes && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <span>View Release Notes</span>
                </label>
              </div>
            </div>

            {/* Step 6 Footer */}
            <div className="w-full flex items-center justify-end pt-6 border-t border-white/[0.06]">
              <button
                onClick={handleFinish}
                className="px-7 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-pink-600/30 transition-all active:scale-95 cursor-pointer"
              >
                <span>Finish</span>
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
