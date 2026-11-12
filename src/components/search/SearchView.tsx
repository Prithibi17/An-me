import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  X,
  Sparkles,
  AlertCircle,
  HelpCircle,
  Filter,
  Check
} from 'lucide-react';
import { Anime } from '../../types/anime';
import { AnimeCard } from '../AnimeCard';
import { HiAnimeTop10 } from '../HiAnimeTop10';
import { GenresCard } from '../GenresCard';
import { executeIntelligentSearch } from '../../services/searchEngine';

interface SearchViewProps {
  initialQuery?: string;
  initialGenre?: string;
  topAnime: Anime[];
  onSelectAnime: (anime: Anime) => void;
  onPlayAnime: (anime: Anime) => void;
}

const GENRES = [
  'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror',
  'Mecha', 'Mystery', 'Psychological', 'Romance', 'Sci-Fi', 'Slice of Life',
  'Sports', 'Supernatural', 'Thriller'
];

const FORMAT_OPTIONS = [
  { label: 'TV Series', value: 'TV' },
  { label: 'Movie', value: 'MOVIE' },
  { label: 'OVA', value: 'OVA' },
  { label: 'ONA', value: 'ONA' },
  { label: 'Special', value: 'SPECIAL' },
  { label: 'TV Short', value: 'TV_SHORT' },
];

const SEASONS = [
  { label: 'All Seasons', value: 'All' },
  { label: 'Winter', value: 'WINTER' },
  { label: 'Spring', value: 'SPRING' },
  { label: 'Summer', value: 'SUMMER' },
  { label: 'Fall', value: 'FALL' },
];

const STATUS_OPTIONS = [
  { label: 'All Statuses', value: 'All' },
  { label: 'Airing', value: 'RELEASING' },
  { label: 'Finished', value: 'FINISHED' },
  { label: 'Upcoming', value: 'NOT_YET_RELEASED' },
  { label: 'Cancelled', value: 'CANCELLED' },
];

const AUDIO_OPTIONS = [
  { label: 'All Audio', value: 'all' },
  { label: 'Subbed', value: 'sub' },
  { label: 'English Dubbed', value: 'dub' },
];

const COUNTRY_OPTIONS = [
  { label: 'All Countries', value: 'All' },
  { label: 'Japan (JP)', value: 'JP' },
  { label: 'South Korea (KR)', value: 'KR' },
  { label: 'China (CN)', value: 'CN' },
];

const MIN_SCORE_OPTIONS = [
  { label: 'Any Score', value: 0 },
  { label: '⭐ 80%+ (Masterpiece)', value: 80 },
  { label: '⭐ 75%+ (Great)', value: 75 },
  { label: '⭐ 70%+ (Good)', value: 70 },
  { label: '⭐ 60%+ (Average)', value: 60 },
];

const SORTS = [
  { label: 'Popularity', value: 'POPULARITY_DESC' },
  { label: 'Trending', value: 'TRENDING_DESC' },
  { label: 'Top Rated', value: 'SCORE_DESC' },
  { label: 'Release Date', value: 'START_DATE_DESC' },
  { label: 'Recently Updated', value: 'UPDATED_AT_DESC' },
  { label: 'Relevance', value: 'SEARCH_MATCH' },
];

export function SearchView({
  initialQuery = '',
  initialGenre = 'All',
  topAnime,
  onSelectAnime,
  onPlayAnime,
}: SearchViewProps) {
  const [query, setQuery] = useState(initialQuery);
  const [inputValue, setInputValue] = useState(initialQuery);

  // Multi-selection states
  const [selectedGenres, setSelectedGenres] = useState<string[]>(
    initialGenre && initialGenre !== 'All' ? [initialGenre] : []
  );
  const [selectedFormats, setSelectedFormats] = useState<string[]>([]);

  // Dropdown filter states
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedAudio, setSelectedAudio] = useState<'all' | 'sub' | 'dub'>('all');
  const [selectedCountry, setSelectedCountry] = useState('All');
  const [selectedMinScore, setSelectedMinScore] = useState<number>(0);
  const [selectedSeason, setSelectedSeason] = useState('All');
  const [selectedSort, setSelectedSort] = useState(initialQuery ? 'SEARCH_MATCH' : 'POPULARITY_DESC');
  const [selectedYear, setSelectedYear] = useState<number | undefined>(undefined);

  const [results, setResults] = useState<Anime[]>([]);
  const [relatedItems, setRelatedItems] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [correctedQuery, setCorrectedQuery] = useState<string | undefined>(undefined);
  const [isTypoCorrected, setIsTypoCorrected] = useState(false);
  const [forceExactQuery, setForceExactQuery] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Sync initial query if passed or changed from outside
  useEffect(() => {
    if (initialQuery !== query) {
      setQuery(initialQuery);
      setInputValue(initialQuery);
      setCurrentPage(1);
    }
  }, [initialQuery]);

  useEffect(() => {
    if (initialGenre && initialGenre !== 'All') {
      setSelectedGenres([initialGenre]);
      setCurrentPage(1);
    }
  }, [initialGenre]);

  const toggleGenre = (genre: string) => {
    if (genre === 'All') {
      setSelectedGenres([]);
    } else {
      setSelectedGenres((prev) =>
        prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
      );
    }
    setCurrentPage(1);
  };

  const toggleFormat = (format: string) => {
    if (format === 'All') {
      setSelectedFormats([]);
    } else {
      setSelectedFormats((prev) =>
        prev.includes(format) ? prev.filter((f) => f !== format) : [...prev, format]
      );
    }
    setCurrentPage(1);
  };

  const fetchResults = async (page = 1) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      setLoading(true);
      setErrorMessage(null);

      const effectiveQuery = forceExactQuery ? query : query;
      const res = await executeIntelligentSearch({
        query: effectiveQuery.trim(),
        genre: selectedGenres.length === 1 ? selectedGenres[0] : undefined,
        genres: selectedGenres.length > 0 ? selectedGenres : undefined,
        season: selectedSeason !== 'All' ? selectedSeason : undefined,
        format: selectedFormats.length === 1 ? selectedFormats[0] : undefined,
        formats: selectedFormats.length > 0 ? selectedFormats : undefined,
        status: selectedStatus !== 'All' ? selectedStatus : undefined,
        country: selectedCountry !== 'All' ? selectedCountry : undefined,
        audio: selectedAudio,
        minScore: selectedMinScore > 0 ? selectedMinScore : undefined,
        sort: selectedSort === 'SEARCH_MATCH' && !effectiveQuery.trim() ? 'POPULARITY_DESC' : selectedSort,
        year: selectedYear,
        page,
        perPage: 24,
        signal: controller.signal,
      });

      if (!controller.signal.aborted) {
        setResults(res.items);
        setCurrentPage(page);
        setHasMore(res.hasMore);
        setIsTypoCorrected(forceExactQuery ? false : res.isTypoCorrected);
        setCorrectedQuery(forceExactQuery ? undefined : res.correctedQuery);
        setRelatedItems(res.relatedItems || []);
      }
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        console.error('Search query error:', err);
        setErrorMessage('Search service encountered a temporary error. Please try again.');
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchResults(1);
  }, [
    query,
    selectedGenres,
    selectedFormats,
    selectedStatus,
    selectedAudio,
    selectedCountry,
    selectedMinScore,
    selectedSeason,
    selectedSort,
    selectedYear,
    forceExactQuery
  ]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setForceExactQuery(false);
    setQuery(inputValue.trim());
    setCurrentPage(1);
  };

  const handleReset = () => {
    setInputValue('');
    setQuery('');
    setSelectedGenres([]);
    setSelectedFormats([]);
    setSelectedStatus('All');
    setSelectedAudio('all');
    setSelectedCountry('All');
    setSelectedMinScore(0);
    setSelectedSeason('All');
    setSelectedSort('POPULARITY_DESC');
    setSelectedYear(undefined);
    setForceExactQuery(false);
    setCurrentPage(1);
  };

  const years = Array.from({ length: 26 }, (_, i) => new Date().getFullYear() - i);

  // Dynamic header title
  const getListingTitle = () => {
    if (query) return `Search: "${query}"`;
    if (selectedGenres.length > 0) return `${selectedGenres.join(' + ')} Anime`;
    if (selectedFormats.length > 0) {
      const names = selectedFormats.map((f) => FORMAT_OPTIONS.find((o) => o.value === f)?.label || f);
      return `${names.join(', ')} Anime`;
    }
    if (selectedAudio === 'dub') return 'English Dubbed Anime';
    return 'Browse Anime Catalog';
  };

  // Build active filter tags list
  interface ActiveFilterChip {
    id: string;
    label: string;
    onRemove: () => void;
  }

  const activeChips: ActiveFilterChip[] = [];

  if (query.trim()) {
    activeChips.push({
      id: 'query',
      label: `"${query.trim()}"`,
      onRemove: () => {
        setQuery('');
        setInputValue('');
      },
    });
  }

  selectedGenres.forEach((g) => {
    activeChips.push({
      id: `genre-${g}`,
      label: `Genre: ${g}`,
      onRemove: () => toggleGenre(g),
    });
  });

  selectedFormats.forEach((f) => {
    const opt = FORMAT_OPTIONS.find((o) => o.value === f);
    activeChips.push({
      id: `format-${f}`,
      label: `Format: ${opt?.label || f}`,
      onRemove: () => toggleFormat(f),
    });
  });

  if (selectedStatus !== 'All') {
    const opt = STATUS_OPTIONS.find((o) => o.value === selectedStatus);
    activeChips.push({
      id: 'status',
      label: `Status: ${opt?.label || selectedStatus}`,
      onRemove: () => setSelectedStatus('All'),
    });
  }

  if (selectedAudio !== 'all') {
    activeChips.push({
      id: 'audio',
      label: selectedAudio === 'dub' ? 'Audio: Dubbed' : 'Audio: Subbed',
      onRemove: () => setSelectedAudio('all'),
    });
  }

  if (selectedCountry !== 'All') {
    const opt = COUNTRY_OPTIONS.find((o) => o.value === selectedCountry);
    activeChips.push({
      id: 'country',
      label: `Country: ${opt?.label || selectedCountry}`,
      onRemove: () => setSelectedCountry('All'),
    });
  }

  if (selectedMinScore > 0) {
    activeChips.push({
      id: 'minScore',
      label: `Rating: ≥${selectedMinScore}%`,
      onRemove: () => setSelectedMinScore(0),
    });
  }

  if (selectedSeason !== 'All') {
    const opt = SEASONS.find((o) => o.value === selectedSeason);
    activeChips.push({
      id: 'season',
      label: `Season: ${opt?.label || selectedSeason}`,
      onRemove: () => setSelectedSeason('All'),
    });
  }

  if (selectedYear) {
    activeChips.push({
      id: 'year',
      label: `Year: ${selectedYear}`,
      onRemove: () => setSelectedYear(undefined),
    });
  }

  return (
    <div className="w-full max-w-[1720px] mx-auto min-h-screen px-3 sm:px-6 lg:px-8 py-6 text-white select-none animate-fade-in pb-16">
      {/* 1. Dedicated Search Input & Header */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-3 border-b border-white/10 gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-6 rounded-full bg-gradient-to-b from-red-500 via-pink-500 to-blue-500 inline-block"></span>
            <h1 className="text-xl sm:text-2xl font-black text-white">
              {getListingTitle()}
            </h1>
            {!loading && results.length > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-slate-300 font-bold ml-2">
                {results.length} item{results.length === 1 ? '' : 's'}
              </span>
            )}
          </div>

          {/* Search bar inside Search View */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 max-w-md w-full">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Search anime title, romaji, abbreviation..."
                className="w-full bg-[#141824] border border-white/10 rounded-xl pl-10 pr-9 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all"
              />
              {inputValue && (
                <button
                  type="button"
                  onClick={() => {
                    setInputValue('');
                    setQuery('');
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white p-0.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-bold bg-pink-600 hover:bg-pink-500 text-white transition-colors cursor-pointer"
            >
              Search
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="p-2 rounded-xl text-xs font-semibold bg-[#161a24] hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-colors cursor-pointer"
              title="Reset all filters"
            >
              <RotateCcw className="w-4 h-4 text-blue-400" />
            </button>
          </form>
        </div>

        {/* Typo Correction Banner */}
        {isTypoCorrected && correctedQuery && (
          <div className="bg-pink-950/30 border border-pink-500/30 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-pink-200">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-pink-400 shrink-0" />
              <span>
                Showing results for <strong className="text-white underline">{correctedQuery}</strong>
              </span>
            </div>
            <button
              onClick={() => {
                setForceExactQuery(true);
              }}
              className="text-[11px] text-pink-400 hover:text-pink-300 underline font-semibold self-start sm:self-auto cursor-pointer"
            >
              Search instead for "{query}"
            </button>
          </div>
        )}

        {/* Filter Panel */}
        <div className="bg-[#11151B] border border-white/10 rounded-xl p-4 sm:p-5 space-y-4 shadow-xl">
          {/* Multi-Selection Genre Chips */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <span>Genres</span>
                <span className="text-[10px] text-slate-500 font-normal lowercase">(multi-select)</span>
              </label>
              {selectedGenres.length > 0 && (
                <button
                  onClick={() => toggleGenre('All')}
                  className="text-[10px] text-pink-400 hover:text-pink-300 cursor-pointer font-bold"
                >
                  Reset Genres
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => toggleGenre('All')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  selectedGenres.length === 0
                    ? 'bg-gradient-to-r from-red-600 via-pink-600 to-blue-600 text-white shadow-md shadow-pink-600/30 font-bold'
                    : 'bg-[#181c24] text-slate-300 hover:text-white hover:bg-[#202738] border border-white/5'
                }`}
              >
                All
              </button>
              {GENRES.map((g) => {
                const isSelected = selectedGenres.includes(g);
                return (
                  <button
                    key={g}
                    onClick={() => toggleGenre(g)}
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-r from-red-600 via-pink-600 to-blue-600 text-white shadow-md shadow-pink-600/30 font-bold ring-1 ring-pink-400'
                        : 'bg-[#181c24] text-slate-300 hover:text-white hover:bg-[#202738] border border-white/5'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 text-white shrink-0" />}
                    <span>{g}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Multi-Selection Format Chips */}
          <div className="pt-2 border-t border-white/[0.06]">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <span>Format</span>
                <span className="text-[10px] text-slate-500 font-normal lowercase">(multi-select)</span>
              </label>
              {selectedFormats.length > 0 && (
                <button
                  onClick={() => toggleFormat('All')}
                  className="text-[10px] text-pink-400 hover:text-pink-300 cursor-pointer font-bold"
                >
                  Reset Format
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => toggleFormat('All')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  selectedFormats.length === 0
                    ? 'bg-gradient-to-r from-red-600 via-pink-600 to-blue-600 text-white shadow-md shadow-pink-600/30 font-bold'
                    : 'bg-[#181c24] text-slate-300 hover:text-white hover:bg-[#202738] border border-white/5'
                }`}
              >
                All Formats
              </button>
              {FORMAT_OPTIONS.map((f) => {
                const isSelected = selectedFormats.includes(f.value);
                return (
                  <button
                    key={f.value}
                    onClick={() => toggleFormat(f.value)}
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-r from-red-600 via-pink-600 to-blue-600 text-white shadow-md shadow-pink-600/30 font-bold ring-1 ring-pink-400'
                        : 'bg-[#181c24] text-slate-300 hover:text-white hover:bg-[#202738] border border-white/5'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 text-white shrink-0" />}
                    <span>{f.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dropdown Filters Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-3 border-t border-white/[0.06]">
            {/* Status Dropdown */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-[#181c24] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-pink-500 cursor-pointer"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            {/* Audio Dropdown */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Audio</label>
              <select
                value={selectedAudio}
                onChange={(e) => {
                  setSelectedAudio(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="w-full bg-[#181c24] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-pink-500 cursor-pointer"
              >
                {AUDIO_OPTIONS.map((a) => (
                  <option key={a.value} value={a.value}>{a.label}</option>
                ))}
              </select>
            </div>

            {/* Country Dropdown */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Country</label>
              <select
                value={selectedCountry}
                onChange={(e) => {
                  setSelectedCountry(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-[#181c24] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-pink-500 cursor-pointer"
              >
                {COUNTRY_OPTIONS.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            {/* Min Rating Dropdown */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Min Score</label>
              <select
                value={selectedMinScore}
                onChange={(e) => {
                  setSelectedMinScore(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="w-full bg-[#181c24] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-pink-500 cursor-pointer"
              >
                {MIN_SCORE_OPTIONS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>

            {/* Season Dropdown */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Season</label>
              <select
                value={selectedSeason}
                onChange={(e) => {
                  setSelectedSeason(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-[#181c24] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-pink-500 cursor-pointer"
              >
                {SEASONS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            {/* Year Dropdown */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Year</label>
              <select
                value={selectedYear || ''}
                onChange={(e) => {
                  setSelectedYear(e.target.value ? Number(e.target.value) : undefined);
                  setCurrentPage(1);
                }}
                className="w-full bg-[#181c24] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-pink-500 cursor-pointer"
              >
                <option value="">All Years</option>
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Sort By Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-white/[0.06]">
            <div className="flex items-center gap-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sort By:</label>
              <div className="flex flex-wrap gap-1.5">
                {SORTS.map((s) => {
                  const isSelected = selectedSort === s.value;
                  return (
                    <button
                      key={s.value}
                      onClick={() => {
                        setSelectedSort(s.value);
                        setCurrentPage(1);
                      }}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-pink-600 text-white font-bold shadow-sm'
                          : 'bg-[#181c24] text-slate-400 hover:text-white hover:bg-[#202738]'
                      }`}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Active Selected Tags Bar ("What I Selected Will Show") */}
          {activeChips.length > 0 && (
            <div className="pt-3 border-t border-white/[0.06] flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-400 mr-1 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-pink-500" />
                Active Filters ({activeChips.length}):
              </span>
              {activeChips.map((chip) => (
                <span
                  key={chip.id}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-pink-500/15 text-pink-300 border border-pink-500/30 hover:border-pink-500/60 transition-colors shadow-sm"
                >
                  <span>{chip.label}</span>
                  <button
                    onClick={chip.onRemove}
                    className="hover:text-white hover:bg-pink-500/40 rounded-full p-0.5 transition-colors cursor-pointer"
                    title={`Remove ${chip.label}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <button
                onClick={handleReset}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors cursor-pointer ml-1"
                title="Reset all filters"
              >
                <RotateCcw className="w-3 h-3 text-pink-400" />
                <span>Clear All</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. Main Two-Column Section (Main Results + Sidebar) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Results Grid (left, 70% / 8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {loading ? (
            <div className="py-24 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-3 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
              <span>Searching real anime catalog...</span>
            </div>
          ) : errorMessage ? (
            <div className="py-16 text-center bg-[#11151B] rounded-xl border border-red-500/30 p-6 space-y-3">
              <AlertCircle className="w-8 h-8 text-red-400 mx-auto" />
              <p className="text-sm font-bold text-white">{errorMessage}</p>
              <button
                onClick={() => fetchResults(currentPage)}
                className="px-4 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Retry
              </button>
            </div>
          ) : results.length === 0 ? (
            <div className="space-y-6">
              <div className="py-12 px-6 text-center bg-[#11151B] rounded-xl border border-white/10 space-y-4">
                <HelpCircle className="w-8 h-8 text-pink-400 mx-auto" />
                <h3 className="text-sm font-bold text-white">
                  No matching anime found for "{query || 'selected filters'}"
                </h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Try checking your spelling, using alternative titles or abbreviations (e.g. <em>DBZ</em>, <em>AoT</em>, <em>Naruto</em>), or clearing specific filters.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                  <button
                    onClick={handleReset}
                    className="px-4 py-1.5 rounded-lg text-xs font-bold bg-pink-600 hover:bg-pink-500 text-white transition-colors cursor-pointer"
                  >
                    Clear All Filters
                  </button>
                  <button
                    onClick={() => {
                      setInputValue('');
                      setQuery('');
                      setSelectedGenres(['Action']);
                    }}
                    className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-[#181c24] hover:bg-white/10 text-slate-200 border border-white/10 cursor-pointer"
                  >
                    Browse Action Anime
                  </button>
                </div>
              </div>

              {/* Graceful Recommendation Fallback ("You Might Like") */}
              {relatedItems.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-pink-400" />
                    <span>Popular Suggestions You Might Like</span>
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                    {relatedItems.map((anime) => (
                      <AnimeCard
                        key={anime.id}
                        anime={anime}
                        onSelect={onSelectAnime}
                        onPlay={onPlayAnime}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                {results.map((anime) => (
                  <AnimeCard
                    key={anime.id}
                    anime={anime}
                    onSelect={onSelectAnime}
                    onPlay={onPlayAnime}
                  />
                ))}
              </div>

              {/* Dynamic Pagination Controls */}
              <div className="flex items-center justify-center gap-1.5 pt-6 pb-2">
                <button
                  onClick={() => fetchResults(1)}
                  disabled={currentPage <= 1}
                  className={`grid h-9 w-9 place-items-center rounded-lg text-xs font-bold transition-colors ${
                    currentPage <= 1
                      ? 'bg-white/5 opacity-30 cursor-not-allowed'
                      : 'bg-[#161a24] hover:bg-pink-600 cursor-pointer'
                  }`}
                  title="First Page"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>

                <button
                  onClick={() => fetchResults(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className={`grid h-9 w-9 place-items-center rounded-lg text-xs font-bold transition-colors ${
                    currentPage <= 1
                      ? 'bg-white/5 opacity-30 cursor-not-allowed'
                      : 'bg-[#161a24] hover:bg-pink-600 cursor-pointer'
                  }`}
                  title="Previous Page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {/* Page numbers around current */}
                {Array.from({ length: 5 }, (_, i) => Math.max(1, currentPage - 2) + i).map((num) => {
                  const isActive = num === currentPage;
                  return (
                    <button
                      key={num}
                      onClick={() => fetchResults(num)}
                      className={`grid h-9 w-9 place-items-center rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-gradient-to-r from-red-600 via-pink-600 to-blue-600 text-white shadow-md'
                          : 'bg-[#161a24] hover:bg-[#202738] text-slate-300 hover:text-white'
                      }`}
                    >
                      {num}
                    </button>
                  );
                })}

                <button
                  onClick={() => fetchResults(currentPage + 1)}
                  disabled={!hasMore}
                  className={`grid h-9 w-9 place-items-center rounded-lg text-xs font-bold transition-colors ${
                    !hasMore
                      ? 'bg-white/5 opacity-30 cursor-not-allowed'
                      : 'bg-[#161a24] hover:bg-pink-600 cursor-pointer'
                  }`}
                  title="Next Page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>

        {/* Sidebar (right, 30% / 4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <HiAnimeTop10
            topAnime={topAnime}
            onSelectAnime={onSelectAnime}
          />

          <GenresCard
            onSelectGenre={(g) => {
              toggleGenre(g);
            }}
          />
        </div>
      </div>
    </div>
  );
}
