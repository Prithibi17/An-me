import React, { useState, useEffect } from 'react';
import {
  Trash2,
  Folder,
  Check,
  X,
  Minus,
  Square,
  AlertTriangle,
  HardDrive
} from 'lucide-react';
import anmeIcon from '../../../public/anme-icon.png';
import anmeWatermark from '../../../public/anme-logo-dark.png';

export function UninstallWizard() {
  const [step, setStep] = useState<number>(1);
  const [installPath, setInstallPath] = useState<string>('D:\\Apps\\Anime');
  const [removeAppData, setRemoveAppData] = useState<boolean>(true);
  const [uninstallProgress, setUninstallProgress] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>('Preparing uninstallation...');

  useEffect(() => {
    const api = (window as any).electronAPI?.installer;
    if (api?.getInstallInfo) {
      api.getInstallInfo().then((info: any) => {
        if (info?.installPath) {
          setInstallPath(info.installPath);
        }
      }).catch(console.error);
    }
  }, []);

  const handleStartUninstall = async () => {
    setStep(2);
    setUninstallProgress(15);
    setStatusMessage('Removing desktop and Start Menu shortcuts...');

    const api = (window as any).electronAPI?.installer;
    if (api?.performUninstall) {
      try {
        await new Promise((r) => setTimeout(r, 600));
        setUninstallProgress(45);
        setStatusMessage('Unregistering An:me from Windows Installed Apps...');

        await new Promise((r) => setTimeout(r, 700));
        setUninstallProgress(75);
        setStatusMessage('Cleaning up application files and cache...');

        await api.performUninstall({
          installPath,
          removeAppData,
        });

        setUninstallProgress(100);
        setStatusMessage('Uninstallation complete.');
        setTimeout(() => setStep(3), 600);
      } catch (err) {
        console.error('Uninstall failed:', err);
        setUninstallProgress(100);
        setTimeout(() => setStep(3), 800);
      }
    } else {
      // Browser fallback simulation
      setTimeout(() => {
        setUninstallProgress(50);
        setStatusMessage('Unregistering An:me from Windows...');
      }, 700);
      setTimeout(() => {
        setUninstallProgress(100);
        setStatusMessage('Complete.');
        setStep(3);
      }, 1500);
    }
  };

  const handleFinish = () => {
    const api = (window as any).electronAPI?.installer;
    if (api?.close) {
      api.close();
    } else {
      window.close();
    }
  };

  const handleMinimize = () => (window as any).electronAPI?.minimize?.();
  const handleClose = () => (window as any).electronAPI?.close?.() || window.close();

  return (
    <div className="w-screen h-screen flex flex-col bg-[#090A0E] text-slate-100 select-none overflow-hidden font-sans border border-rose-500/30 rounded-2xl shadow-2xl">
      {/* Frameless Window Header */}
      <div className="h-10 bg-[#0C0E14] border-b border-white/[0.08] px-3.5 flex items-center justify-between app-drag-region">
        <div className="flex items-center gap-2 app-no-drag">
          <img src={anmeIcon} alt="" className="w-4 h-4 rounded-md object-contain" />
          <span className="text-xs font-bold text-slate-200">An:me Uninstall</span>
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
        {/* ================= STEP 1: CONFIRM UNINSTALL ================= */}
        {step === 1 && (
          <div className="flex-1 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center shrink-0 shadow-lg shadow-rose-500/20">
                  <Trash2 className="w-6 h-6 text-rose-500" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    Uninstall <span className="text-white">An<span className="text-pink-500">:</span>me</span>
                  </h1>
                  <p className="text-sm text-slate-400 mt-1">
                    Are you sure you want to completely remove An:me from your computer?
                  </p>
                </div>
              </div>

              {/* Install Details Box */}
              <div className="bg-[#121520] border border-white/10 rounded-2xl p-5 space-y-3.5 shadow-lg">
                <div className="flex items-start gap-3">
                  <Folder className="w-4 h-4 text-pink-400 mt-0.5 shrink-0" />
                  <div className="text-xs">
                    <span className="text-slate-400 mr-2">Installed location:</span>
                    <span className="text-white font-mono font-semibold">{installPath}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <HardDrive className="w-4 h-4 text-pink-400 mt-0.5 shrink-0" />
                  <div className="text-xs">
                    <span className="text-slate-400 mr-2">Disk space to be freed:</span>
                    <span className="text-white font-mono font-semibold">~ 253 MB</span>
                  </div>
                </div>
              </div>

              {/* Options */}
              <div className="space-y-2.5 pt-1">
                <label
                  onClick={() => setRemoveAppData(!removeAppData)}
                  className="flex items-center justify-between p-3 px-4 rounded-xl bg-[#11141e] border border-white/[0.08] hover:border-pink-500/30 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center transition-colors ${
                        removeAppData
                          ? 'bg-pink-500 text-white'
                          : 'border border-white/30 bg-black/40'
                      }`}
                    >
                      {removeAppData && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span className="text-xs sm:text-sm font-semibold text-white">
                      Also remove application cache and local watch history
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Step 1 Footer */}
            <div className="flex items-center justify-between pt-6 border-t border-white/[0.06]">
              <button
                onClick={handleClose}
                className="px-5 py-2 rounded-xl bg-transparent hover:bg-white/5 border border-white/10 text-xs font-bold text-slate-300 transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                onClick={handleStartUninstall}
                className="px-6 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-rose-600/30 transition-all active:scale-95 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Uninstall</span>
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 2: UNINSTALLING ================= */}
        {step === 2 && (
          <div className="flex-1 flex flex-col justify-between">
            <div className="space-y-8 my-auto">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Uninstalling <span className="text-white">An<span className="text-pink-500">:</span>me</span>
                </h1>
                <p className="text-sm text-slate-400 mt-1">
                  Please wait while An:me is removed from your computer...
                </p>
              </div>

              {/* Progress Bar Container */}
              <div className="space-y-3">
                <div className="w-full h-3.5 rounded-full bg-[#161a27] border border-white/10 overflow-hidden p-0.5">
                  <div
                    style={{ width: `${uninstallProgress}%` }}
                    className="h-full rounded-full bg-gradient-to-r from-rose-500 to-pink-500 shadow-[0_0_12px_rgba(244,63,94,0.7)] transition-all duration-300"
                  />
                </div>

                <div className="flex items-center justify-between text-xs font-semibold text-slate-400 font-mono">
                  <span>{statusMessage}</span>
                  <span>{uninstallProgress}%</span>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-white/[0.06]" />
          </div>
        )}

        {/* ================= STEP 3: FINISHED ================= */}
        {step === 3 && (
          <div className="flex-1 flex flex-col justify-between items-center text-center">
            <div className="my-auto space-y-6 flex flex-col items-center">
              {/* Glowing Pink Circular Badge */}
              <div className="w-20 h-20 rounded-full border-2 border-pink-500 bg-pink-500/10 flex items-center justify-center shadow-[0_0_35px_rgba(244,63,94,0.45)]">
                <Check className="w-10 h-10 text-pink-500 stroke-[3]" />
              </div>

              <div>
                <h1 className="text-3xl font-black text-white tracking-tight">
                  <span className="text-white">An<span className="text-pink-500">:</span>me</span> Uninstalled!
                </h1>
                <p className="text-sm text-slate-400 mt-1.5">
                  An:me has been completely removed from your computer.
                </p>
              </div>
            </div>

            {/* Step 3 Footer */}
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
