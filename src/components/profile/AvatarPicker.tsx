import React, { useState, useEffect, useRef } from 'react';
import { X, Check } from 'lucide-react';
import { DEFAULT_AVATARS, AvatarInfo, getAvatarInfo } from '../../services/avatarRegistry';

interface AvatarPickerProps {
  isOpen: boolean;
  currentAvatarId?: string;
  onSelect: (avatarId: string) => void;
  onClose: () => void;
}

export function AvatarPicker({
  isOpen,
  currentAvatarId,
  onSelect,
  onClose,
}: AvatarPickerProps) {
  const [selectedId, setSelectedId] = useState<string>(
    currentAvatarId || DEFAULT_AVATARS[0].id
  );
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedId(currentAvatarId || DEFAULT_AVATARS[0].id);
    }
  }, [isOpen, currentAvatarId]);

  // Keyboard navigation & accessibility
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        onSelect(selectedId);
      } else if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        e.preventDefault();
        const currentIndex = DEFAULT_AVATARS.findIndex((av) => av.id === selectedId);
        if (currentIndex === -1) return;

        // 6 columns on desktop layout
        const cols = 6;
        let nextIndex = currentIndex;

        if (e.key === 'ArrowRight') {
          nextIndex = (currentIndex + 1) % DEFAULT_AVATARS.length;
        } else if (e.key === 'ArrowLeft') {
          nextIndex = (currentIndex - 1 + DEFAULT_AVATARS.length) % DEFAULT_AVATARS.length;
        } else if (e.key === 'ArrowDown') {
          nextIndex = Math.min(currentIndex + cols, DEFAULT_AVATARS.length - 1);
        } else if (e.key === 'ArrowUp') {
          nextIndex = Math.max(currentIndex - cols, 0);
        }

        setSelectedId(DEFAULT_AVATARS[nextIndex].id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedId, onSelect, onClose]);

  if (!isOpen) return null;

  const currentInfo = getAvatarInfo(selectedId);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Choose Profile Avatar"
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        ref={containerRef}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-[#0F1218] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/[0.08] flex items-center justify-between bg-[#141722]">
          <div>
            <h3 className="text-sm font-extrabold text-white tracking-wide">
              Choose Avatar
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Select one of the 30 anime profile avatars
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close avatar picker"
            className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Selected preview bar */}
        <div className="px-5 py-2.5 bg-[#141722]/60 border-b border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full overflow-hidden bg-black/40 ring-1 ring-pink-500/50 shrink-0">
              <img
                src={currentInfo.src}
                alt={currentInfo.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <p className="text-xs font-bold text-white leading-tight">
                {currentInfo.name}
              </p>
              <p className="text-[10px] text-pink-400 font-mono font-medium">
                {currentInfo.id}
              </p>
            </div>
          </div>
          <span className="text-[10px] font-semibold text-slate-400 bg-white/5 px-2.5 py-1 rounded-full border border-white/5">
            30 Avatars Available
          </span>
        </div>

        {/* 30 Avatars Grid */}
        <div className="p-5 max-h-[50vh] overflow-y-auto">
          <div
            role="radiogroup"
            aria-label="Avatar options"
            className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3 justify-items-center"
          >
            {DEFAULT_AVATARS.map((av) => {
              const isSelected = selectedId === av.id;
              return (
                <button
                  key={av.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  aria-label={av.name}
                  onClick={() => setSelectedId(av.id)}
                  onDoubleClick={() => {
                    setSelectedId(av.id);
                    onSelect(av.id);
                  }}
                  title={av.name}
                  className={`group relative w-14 h-14 rounded-full p-0.5 transition-all duration-150 cursor-pointer focus:outline-none flex items-center justify-center ${
                    isSelected
                      ? 'ring-2 ring-pink-500 scale-105 shadow-md shadow-pink-500/30'
                      : 'hover:scale-105 hover:ring-2 hover:ring-white/30'
                  }`}
                >
                  <img
                    src={av.src}
                    alt={av.name}
                    loading="lazy"
                    className="w-full h-full rounded-full object-cover select-none pointer-events-none"
                  />
                  {isSelected && (
                    <div
                      aria-hidden="true"
                      className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-pink-500 text-white flex items-center justify-center shadow-md ring-2 ring-[#0F1218]"
                    >
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Buttons Footer */}
        <div className="px-5 py-3.5 border-t border-white/[0.08] bg-[#141722] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSelect(selectedId)}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-red-500 via-pink-500 to-blue-600 hover:from-red-600 hover:via-pink-600 hover:to-blue-700 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-md shadow-pink-600/30 transition-all cursor-pointer"
          >
            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Select Avatar</span>
          </button>
        </div>
      </div>
    </div>
  );
}
