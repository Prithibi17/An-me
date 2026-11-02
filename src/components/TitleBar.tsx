import React, { useState, useEffect } from 'react';
import { Minus, Square, Copy, X, Sparkles, Tv } from 'lucide-react';

export function TitleBar() {
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

  const handleMinimize = () => {
    (window as any).electronAPI?.minimize();
  };

  const handleMaximize = () => {
    (window as any).electronAPI?.maximize();
    setIsMaximized(!isMaximized);
  };

  const handleClose = () => {
    (window as any).electronAPI?.close();
  };

  return (
    <header className="h-9 w-full bg-[#0d0f17] border-b border-white/[0.06] flex items-center justify-between px-3 select-none z-50 shrink-0">
      {/* Draggable region with Logo & Title */}
      <div className="flex items-center gap-2 app-drag-region flex-1 h-full cursor-default">
        <div className="flex items-center gap-1.5 text-purple-400 font-bold tracking-wider text-xs">
          <div className="w-5 h-5 rounded-md bg-gradient-to-tr from-purple-600 via-pink-500 to-indigo-500 flex items-center justify-center text-white shadow-sm shadow-purple-500/30">
            <Tv className="w-3 h-3" />
          </div>
          <span className="text-white font-extrabold tracking-tight">An<span className="text-purple-400">:</span>me</span>
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 ml-1">DESKTOP</span>
        </div>
      </div>

      {/* Window Controls (Electron only or demo controls) */}
      <div className="flex items-center app-no-drag">
        {isDesktop ? (
          <div className="flex items-center space-x-1">
            <button
              onClick={handleMinimize}
              title="Minimize"
              className="w-8 h-7 flex items-center justify-center rounded text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleMaximize}
              title={isMaximized ? "Restore" : "Maximize"}
              className="w-8 h-7 flex items-center justify-center rounded text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              {isMaximized ? <Copy className="w-3 h-3" /> : <Square className="w-3 h-3" />}
            </button>
            <button
              onClick={handleClose}
              title="Close"
              className="w-8 h-7 flex items-center justify-center rounded text-slate-400 hover:text-white hover:bg-red-600 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Client
            </span>
          </div>
        )}
      </div>
    </header>
  );
}
