import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';

export interface MultiSelectOption {
  label: string;
  value: string;
}

interface MultiSelectDropdownProps {
  icon: React.ReactNode;
  label: string;
  options: MultiSelectOption[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  maxVisibleChips?: number;
}

export function MultiSelectDropdown({
  icon,
  label,
  options,
  selectedValues,
  onChange,
  placeholder = 'Select...',
  maxVisibleChips = 2,
}: MultiSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Auto focus search input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const q = searchQuery.toLowerCase();
    return options.filter((opt) => opt.label.toLowerCase().includes(q));
  }, [options, searchQuery]);

  const toggleOption = (val: string) => {
    if (selectedValues.includes(val)) {
      onChange(selectedValues.filter((v) => v !== val));
    } else {
      onChange([...selectedValues, val]);
    }
  };

  const handleSelectAll = () => {
    onChange(options.map((o) => o.value));
  };

  const handleClear = () => {
    onChange([]);
  };

  const removeChip = (val: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selectedValues.filter((v) => v !== val));
  };

  const visibleSelected = selectedValues.slice(0, maxVisibleChips);
  const hiddenCount = selectedValues.length - maxVisibleChips;

  return (
    <div className="relative flex flex-col gap-1 w-full" ref={containerRef}>
      {/* Top Label & Count Badge */}
      <div className="flex items-center gap-1.5 px-0.5">
        <span className="text-slate-400">{icon}</span>
        <span className="text-[11px] font-bold text-slate-300 tracking-wide">{label}</span>
        {selectedValues.length > 0 && (
          <span className="min-w-4 h-4 px-1 rounded-full bg-pink-600 text-[10px] font-black text-white flex items-center justify-center">
            {selectedValues.length}
          </span>
        )}
      </div>

      {/* Dropdown Closed Trigger Field */}
      <div
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full min-h-[38px] bg-[#11151B] border rounded-xl px-2.5 py-1.5 flex items-center justify-between gap-1.5 cursor-pointer transition-all ${
          isOpen
            ? 'border-pink-500 ring-1 ring-pink-500/30'
            : selectedValues.length > 0
            ? 'border-pink-500/40 hover:border-pink-500/70'
            : 'border-white/10 hover:border-white/20'
        }`}
      >
        {/* Selected chips or placeholder */}
        <div className="flex flex-wrap items-center gap-1 flex-1 overflow-hidden">
          {selectedValues.length === 0 ? (
            <span className="text-xs text-slate-400 font-normal pl-1">{placeholder}</span>
          ) : (
            <>
              {visibleSelected.map((val) => {
                const opt = options.find((o) => o.value === val);
                const chipLabel = opt ? opt.label : val;
                return (
                  <span
                    key={val}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-pink-500/15 text-pink-300 border border-pink-500/40 hover:border-pink-500 transition-colors shadow-sm"
                  >
                    <span className="truncate max-w-[90px]">{chipLabel}</span>
                    <button
                      type="button"
                      onClick={(e) => removeChip(val, e)}
                      className="hover:text-white hover:bg-pink-500/40 rounded p-0.2 transition-colors cursor-pointer"
                      title={`Remove ${chipLabel}`}
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                );
              })}
              {hiddenCount > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-white/10 text-slate-300">
                  +{hiddenCount}
                </span>
              )}
            </>
          )}
        </div>

        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-pink-400' : ''
          }`}
        />
      </div>

      {/* Dropdown Floating Panel */}
      {isOpen && (
        <div className="absolute top-[calc(100%+4px)] left-0 w-full min-w-[240px] max-w-[320px] bg-[#0E1217] border border-white/15 rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100">
          {/* Search Header */}
          <div className="p-2 border-b border-white/10">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search ${label.toLowerCase()}...`}
                className="w-full bg-[#161B24] border border-white/10 rounded-lg pl-8 pr-2 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500"
              />
            </div>
          </div>

          {/* Quick Action Buttons (Select All & Clear) */}
          <div className="flex items-center justify-between px-3 py-1.5 bg-[#121620] border-b border-white/[0.06] text-[10px] font-bold">
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-pink-400 hover:text-pink-300 transition-colors cursor-pointer"
            >
              Select All
            </button>
            <span className="text-slate-500">|</span>
            <button
              type="button"
              onClick={handleClear}
              className="text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Clear
            </button>
          </div>

          {/* Scrollable Options List with Checkboxes */}
          <div className="max-h-52 overflow-y-auto p-1.5 space-y-0.5 custom-scrollbar">
            {filteredOptions.length === 0 ? (
              <div className="p-3 text-center text-xs text-slate-500">No matches found</div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = selectedValues.includes(opt.value);
                return (
                  <div
                    key={opt.value}
                    onClick={() => toggleOption(opt.value)}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-pink-600/20 text-white font-semibold'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {/* Checkbox box */}
                    <div
                      className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-pink-600 border-pink-500 text-white'
                          : 'border-white/20 bg-[#161B24]'
                      }`}
                    >
                      {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </div>
                    <span className="truncate flex-1">{opt.label}</span>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Apply Button */}
          <div className="p-2 border-t border-white/10 bg-[#121620] flex items-center justify-between">
            <span className="text-[10px] text-slate-400">
              {selectedValues.length} selected
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3 py-1 rounded-lg text-[11px] font-bold bg-pink-600 hover:bg-pink-500 text-white transition-colors cursor-pointer"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
