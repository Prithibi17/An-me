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
  Layers,
  Tv,
  Flag,
  Headphones,
  Globe,
  Star,
  Calendar,
  Flame,
  TrendingUp,
  RefreshCw,
  Crosshair,
  ArrowDownAZ,
  ArrowUpZA,
  ListOrdered,
  Clock,
  ArrowUpDown
} from 'lucide-react';
import { Anime } from '../../types/anime';
import { AnimeCard } from '../AnimeCard';
import { HiAnimeTop10 } from '../HiAnimeTop10';
import { GenresCard } from '../GenresCard';
import { executeIntelligentSearch } from '../../services/searchEngine';
import { MultiSelectDropdown, MultiSelectOption } from './MultiSelectDropdown';
import { SingleSelectDropdown, SingleSelectOption } from './SingleSelectDropdown';

interface SearchViewProps {
  initialQuery?: string;
  initialGenre?: string;
  topAnime: Anime[];
  onSelectAnime: (anime: Anime) => void;
  onPlayAnime: (anime: Anime) => void;
}

// 33 complete catalog genres
const GENRE_OPTIONS: MultiSelectOption[] = [
  'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror',
  'Mecha', 'Mystery', 'Psychological', 'Romance', 'Sci-Fi', 'Slice of Life',
  'Sports', 'Supernatural', 'Thriller', 'Ecchi', 'Harem', 'Isekai',
  'Martial Arts', 'Music', 'School', 'Seinen', 'Shoujo', 'Shounen',
  'Josei', 'Historical', 'Military', 'Parody', 'Demons', 'Vampire',
  'Game', 'Gourmet', 'Kids'
].map((g) => ({ label: g, value: g }));

// Format options
const FORMAT_OPTIONS: MultiSelectOption[] = [
  { label: 'TV Series', value: 'TV' },
  { label: 'Movie', value: 'MOVIE' },
  { label: 'OVA', value: 'OVA' },
  { label: 'ONA', value: 'ONA' },
  { label: 'Special', value: 'SPECIAL' },
  { label: 'TV Short', value: 'TV_SHORT' },
];

const STATUS_OPTIONS: SingleSelectOption[] = [
  { label: 'All Statuses', value: 'All' },
  { label: 'Currently Airing', value: 'RELEASING' },
  { label: 'Finished Airing', value: 'FINISHED' },
  { label: 'Not Yet Aired', value: 'NOT_YET_RELEASED' },
  { label: 'Upcoming', value: 'NOT_YET_RELEASED' },
];

const AUDIO_OPTIONS: SingleSelectOption[] = [
  { label: 'All Audio', value: 'all' },
  { label: 'Japanese', value: 'sub' },
  { label: 'English Dub', value: 'dub' },
  { label: 'Multi-Audio', value: 'all' },
];

const COUNTRY_OPTIONS: SingleSelectOption[] = [
  { label: 'All Countries', value: 'All' },
  { label: 'Japan', value: 'JP' },
  { label: 'China', value: 'CN' },
  { label: 'South Korea', value: 'KR' },
  { label: 'Other', value: 'TW' },
];

const MIN_SCORE_OPTIONS: SingleSelectOption[] = [
  { label: 'Any Score', value: 0 },
  { label: '5+', value: 50 },
  { label: '6+', value: 60 },
  { label: '7+', value: 70 },
  { label: '8+', value: 80 },
  { label: '9+', value: 90 },
];

const SEASON_OPTIONS: SingleSelectOption[] = [
  { label: 'All Seasons', value: 'All' },
  { label: 'Winter', value: 'WINTER' },
  { label: 'Spring', value: 'SPRING' },
  { label: 'Summer', value: 'SUMMER' },
  { label: 'Fall', value: 'FALL' },
];

// All 10 sorting options
const SORT_OPTIONS = [
  { label: 'Popularity', value: 'POPULARITY_DESC', icon: Flame },
  { label: 'Trending', value: 'TRENDING_DESC', icon: TrendingUp },
  { label: 'Top Rated', value: 'SCORE_DESC', icon: Star },
  { label: 'Release Date', value: 'START_DATE_DESC', icon: Calendar },
  { label: 'Recently Updated', value: 'UPDATED_AT_DESC', icon: RefreshCw },
  { label: 'Relevance', value: 'SEARCH_MATCH', icon: Crosshair },
  { label: 'Title A–Z', value: 'TITLE_ROMAJI', icon: ArrowDownAZ },
  { label: 'Title Z–A', value: 'TITLE_ROMAJI_DESC', icon: ArrowUpZA },
  { label: 'Most Episodes', value: 'EPISODES_DESC', icon: ListOrdered },
  { label: 'Recently Added', value: 'ID_DESC', icon: Clock },
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

  // Single-selection states
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedAudio, setSelectedAudio] = useState<'all' | 'sub' | 'dub'>('all');
  const [selectedCountry, setSelectedCountry] = useState('All');
  const [selectedMinScore, setSelectedMinScore] = useState<number>(0);
  const [selectedSeason, setSelectedSeason] = useState('All');
  const [selectedYear, setSelectedYear] = useState<number | undefined>(undefined);
  const [selectedSort, setSelectedSort] = useState(initialQuery ? 'SEARCH_MATCH' : 'POPULARITY_DESC');

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

  // Generate dynamic years from current year down to 1980
  const currentYear = new Date().getFullYear();
  const yearOptions: SingleSelectOption[] = [
    { label: 'All Years', value: '' },
    ...Array.from({ length: currentYear - 1980 + 1 }, (_, i) => {
      const yr = currentYear - i;
      return { label: String(yr), value: yr };
    }),
  ];

  // Dynamic header title
  const getListingTitle = () => {
    if (query) return `Search: "${query}"`;
    if (selectedGenres.length > 0) return `${selectedGenres.join(', ')} Anime`;
    if (selectedFormats.length > 0) {
      const names = selectedFormats.map((f) => FORMAT_OPTIONS.find((o) => o.value === f)?.label || f);
      return `${names.join(', ')} Anime`;
    }
    if (selectedAudio === 'dub') return 'English Dubbed Anime';
    return 'Browse Anime Catalog';
  };

  // Build active filter summary chips
  interface FilterSummaryItem {
    key: string;
    category: string;
    label: string;
    onRemove: () => void;
  }

  const activeFiltersSummary: FilterSummaryItem[] = [];

  if (query.trim()) {
    activeFiltersSummary.push({
      key: 'query',
      category: 'Search',
      label: `"${query.trim()}"`,
      onRemove: () => {
        setQuery('');
        setInputValue('');
      },
    });
  }

  selectedGenres.forEach((g) => {
    activeFiltersSummary.push({
      key: `genre-${g}`,
      category: 'Genre',
      label: g,
      onRemove: () => setSelectedGenres((prev) => prev.filter((item) => item !== g)),
    });
  });

  selectedFormats.forEach((f) => {
    const opt = FORMAT_OPTIONS.find((o) => o.value === f);
    activeFiltersSummary.push({
      key: `format-${f}`,
      category: 'Format',
      label: opt?.label || f,
      onRemove: () => setSelectedFormats((prev) => prev.filter((item) => item !== f)),
    });
  });

  if (selectedStatus !== 'All') {
    const opt = STATUS_OPTIONS.find((o) => o.value === selectedStatus);
    activeFiltersSummary.push({
      key: 'status',
      category: 'Status',
      label: opt?.label || selectedStatus,
      onRemove: () => setSelectedStatus('All'),
    });
  }

  if (selectedAudio !== 'all') {
    const opt = AUDIO_OPTIONS.find((o) => o.value === selectedAudio);
    activeFiltersSummary.push({
      key: 'audio',
      category: 'Audio',
      label: opt?.label || selectedAudio,
      onRemove: () => setSelectedAudio('all'),
    });
  }

  if (selectedCountry !== 'All') {
    const opt = COUNTRY_OPTIONS.find((o) => o.value === selectedCountry);
    activeFiltersSummary.push({
      key: 'country',
      category: 'Country',
      label: opt?.label || selectedCountry,
      onRemove: () => setSelectedCountry('All'),
    });
  }

  if (selectedMinScore > 0) {
    const opt = MIN_SCORE_OPTIONS.find((o) => o.value === selectedMinScore);
    activeFiltersSummary.push({
      key: 'minScore',
      category: 'Score',
      label: opt?.label || `${selectedMinScore / 10}+`,
      onRemove: () => setSelectedMinScore(0),
    });
  }

  if (selectedSeason !== 'All') {
    const opt = SEASON_OPTIONS.find((o) => o.value === selectedSeason);
    activeFiltersSummary.push({
      key: 'season',
      category: 'Season',
      label: opt?.label || selectedSeason,
      onRemove: () => setSelectedSeason('All'),
    });
  }

  if (selectedYear) {
    activeFiltersSummary.push({
      key: 'year',
      category: 'Year',
      label: String(selectedYear),
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
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/10 text-slate-300 font-bold ml-2">
                {results.length} items
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

        {/* 2. Redesigned Advanced Filter Panel (Row 1 & Row 2) */}
        <div className="bg-[#0D1117] border border-white/10 rounded-2xl p-4 sm:p-5 space-y-4 shadow-2xl">
          {/* ROW 1: Genre, Format, Status, Audio, Country, Min Score */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4 items-start">
            <MultiSelectDropdown
              icon={<Layers className="w-3.5 h-3.5" />}
              label="Genre"
              options={GENRE_OPTIONS}
              selectedValues={selectedGenres}
              onChange={(vals) => {
                setSelectedGenres(vals);
                setCurrentPage(1);
              }}
              placeholder="All Genres"
            />

            <MultiSelectDropdown
              icon={<Tv className="w-3.5 h-3.5" />}
              label="Format"
              options={FORMAT_OPTIONS}
              selectedValues={selectedFormats}
              onChange={(vals) => {
                setSelectedFormats(vals);
                setCurrentPage(1);
              }}
              placeholder="All Formats"
            />

            <SingleSelectDropdown
              icon={<Flag className="w-3.5 h-3.5" />}
              label="Status"
              options={STATUS_OPTIONS}
              selectedValue={selectedStatus}
              onChange={(v) => {
                setSelectedStatus(v);
                setCurrentPage(1);
              }}
            />

            <SingleSelectDropdown
              icon={<Headphones className="w-3.5 h-3.5" />}
              label="Audio"
              options={AUDIO_OPTIONS}
              selectedValue={selectedAudio}
              onChange={(v) => {
                setSelectedAudio(v);
                setCurrentPage(1);
              }}
            />

            <SingleSelectDropdown
              icon={<Globe className="w-3.5 h-3.5" />}
              label="Country"
              options={COUNTRY_OPTIONS}
              selectedValue={selectedCountry}
              onChange={(v) => {
                setSelectedCountry(v);
                setCurrentPage(1);
              }}
            />

            <SingleSelectDropdown
              icon={<Star className="w-3.5 h-3.5" />}
              label="Min Score"
              options={MIN_SCORE_OPTIONS}
              selectedValue={selectedMinScore}
              onChange={(v) => {
                setSelectedMinScore(Number(v));
                setCurrentPage(1);
              }}
            />
          </div>

          {/* ROW 2: Season, Year, Sorting */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-3 border-t border-white/[0.06]">
            {/* Season & Year Controls */}
            <div className="grid grid-cols-2 gap-3 max-w-sm w-full">
              <SingleSelectDropdown
                icon={<Layers className="w-3.5 h-3.5" />}
                label="Season"
                options={SEASON_OPTIONS}
                selectedValue={selectedSeason}
                onChange={(v) => {
                  setSelectedSeason(v);
                  setCurrentPage(1);
                }}
              />

              <SingleSelectDropdown
                icon={<Calendar className="w-3.5 h-3.5" />}
                label="Year"
                options={yearOptions}
                selectedValue={selectedYear || ''}
                onChange={(v) => {
                  setSelectedYear(v ? Number(v) : undefined);
                  setCurrentPage(1);
                }}
              />
            </div>

            {/* Sorting Button Group (Horizontal Pill Bar matching image) */}
            <div className="flex flex-col gap-1 flex-1 lg:max-w-3xl">
              <div className="flex items-center gap-1.5 px-0.5">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[11px] font-bold text-slate-300 tracking-wide">Sort By:</span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {SORT_OPTIONS.map((s) => {
                  const isActive = selectedSort === s.value;
                  const Icon = s.icon;
                  return (
                    <button
                      key={s.value}
                      onClick={() => {
                        setSelectedSort(s.value);
                        setCurrentPage(1);
                      }}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-gradient-to-r from-red-600 via-pink-600 to-blue-600 text-white shadow-md shadow-pink-600/30 ring-1 ring-pink-400'
                          : 'bg-[#141824] hover:bg-[#1C2230] text-slate-300 hover:text-white border border-white/5'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{s.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Active Filter Summary Bar */}
          {activeFiltersSummary.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-white/[0.06] text-xs">
              <span className="text-slate-400 font-bold text-[11px]">
                Active Filters ({activeFiltersSummary.length}):
              </span>
              <div className="flex flex-wrap items-center gap-1.5 flex-1">
                {activeFiltersSummary.map((item, idx) => (
                  <React.Fragment key={item.key}>
                    {idx > 0 && <span className="text-white/20 select-none">|</span>}
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-pink-500/15 text-pink-300 border border-pink-500/40">
                      <span className="text-slate-400 font-normal">{item.category}:</span>
                      <span>{item.label}</span>
                      <button
                        type="button"
                        onClick={item.onRemove}
                        className="hover:text-white hover:bg-pink-500/40 rounded p-0.5 ml-0.5 transition-colors cursor-pointer"
                        title={`Remove ${item.label}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  </React.Fragment>
                ))}
              </div>
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors cursor-pointer"
                title="Reset all filters"
              >
                <RotateCcw className="w-3 h-3 text-pink-400" />
                <span>Clear All</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 3. Main Two-Column Section (Main Results + Sidebar) */}
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
              setSelectedGenres((prev) =>
                prev.includes(g) ? prev.filter((item) => item !== g) : [...prev, g]
              );
              setCurrentPage(1);
            }}
          />
        </div>
      </div>
    </div>
  );
}

