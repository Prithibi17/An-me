import React from 'react';
import { ChevronDown } from 'lucide-react';

export interface SingleSelectOption {
  label: string;
  value: string | number;
}

interface SingleSelectDropdownProps {
  icon: React.ReactNode;
  label: string;
  options: SingleSelectOption[];
  selectedValue: string | number;
  onChange: (value: any) => void;
}

export function SingleSelectDropdown({
  icon,
  label,
  options,
  selectedValue,
  onChange,
}: SingleSelectDropdownProps) {
  const isFiltered = selectedValue !== 'All' && selectedValue !== 'all' && selectedValue !== 0 && selectedValue !== '';

  return (
    <div className="flex flex-col gap-1 w-full">
      {/* Label with icon */}
      <div className="flex items-center gap-1.5 px-0.5">
        <span className="text-slate-400">{icon}</span>
        <span className="text-[11px] font-bold text-slate-300 tracking-wide">{label}</span>
      </div>

      {/* Styled native select */}
      <div className="relative w-full">
        <select
          value={selectedValue}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full h-[38px] appearance-none bg-[#11151B] border rounded-xl pl-3 pr-8 text-xs font-medium cursor-pointer transition-all focus:outline-none focus:ring-1 focus:ring-pink-500/40 ${
            isFiltered
              ? 'border-pink-500/50 text-pink-300 font-semibold'
              : 'border-white/10 text-slate-300 hover:border-white/20'
          }`}
        >
          {options.map((opt) => (
            <option
              key={opt.value}
              value={opt.value}
              className="bg-[#0E1217] text-slate-200 py-1"
            >
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>
    </div>
  );
}
