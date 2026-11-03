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
  HelpCircle
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
  'All', 'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror',
  'Mecha', 'Mystery', 'Psychological', 'Romance', 'Sci-Fi', 'Slice of Life',
  'Sports', 'Supernatural', 'Thriller'
];

const SEASONS = ['All', 'WINTER', 'SPRING', 'SUMMER', 'FALL'];
const FORMATS = ['All', 'TV', 'TV_SHORT', 'MOVIE', 'SPECIAL', 'OVA', 'ONA'];
const SORTS = [
  { label: 'Relevance', value: 'SEARCH_MATCH' },
  { label: 'Popularity', value: 'POPULARITY_DESC' },
  { label: 'Trending', value: 'TRENDING_DESC' },
  { label: 'Top Rated', value: 'SCORE_DESC' },
  { label: 'Recently Updated', value: 'UPDATED_AT_DESC' },
  { label: 'Release Date', value: 'START_DATE_DESC' },
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
  const [selectedGenre, setSelectedGenre] = useState(initialGenre);
  const [selectedSeason, setSelectedSeason] = useState('All');
  const [selectedFormat, setSelectedFormat] = useState('All');
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
    if (initialGenre !== selectedGenre) {
      setSelectedGenre(initialGenre);
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
        genre: selectedGenre,
        season: selectedSeason,
        format: selectedFormat,
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
  }, [query, selectedGenre, selectedSeason, selectedFormat, selectedSort, selectedYear, forceExactQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setForceExactQuery(false);
    setQuery(inputValue.trim());
    setCurrentPage(1);
  };

  const handleReset = () => {
    setInputValue('');
    setQuery('');
    setSelectedGenre('All');
    setSelectedSeason('All');
    setSelectedFormat('All');
    setSelectedSort('POPULARITY_DESC');
    setSelectedYear(undefined);
    setForceExactQuery(false);
    setCurrentPage(1);
  };

  const years = Array.from({ length: 25 }, (_, i) => new Date().getFullYear() - i);

  // Dynamic header title
  const getListingTitle = () => {
    if (query) return `Search: "${query}"`;
    if (selectedGenre !== 'All') return `${selectedGenre} Anime`;
    if (selectedFormat !== 'All') return `${selectedFormat} Anime`;
    return 'Browse Anime Catalog';
  };

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
          {/* Genre Chips */}
          <div>
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block mb-2">Genres</label>
            <div className="flex flex-wrap gap-1.5">
              {GENRES.map((g) => {
                const isSelected = selectedGenre === g;
                return (
                  <button
                    key={g}
                    onClick={() => {
                      setSelectedGenre(g);
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-r from-red-600 via-pink-600 to-blue-600 text-white shadow-md shadow-pink-600/30 font-bold'
                        : 'bg-[#181c24] text-slate-300 hover:text-white hover:bg-[#202738] border border-white/5'
                    }`}
                  >
                    {g}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dropdown Filters Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-white/[0.06]">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Format</label>
              <select
                value={selectedFormat}
                onChange={(e) => {
                  setSelectedFormat(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-[#181c24] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-pink-500"
              >
                {FORMATS.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Season</label>
              <select
                value={selectedSeason}
                onChange={(e) => {
                  setSelectedSeason(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-[#181c24] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-pink-500"
              >
                {SEASONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Year</label>
              <select
                value={selectedYear || ''}
                onChange={(e) => {
                  setSelectedYear(e.target.value ? Number(e.target.value) : undefined);
                  setCurrentPage(1);
                }}
                className="w-full bg-[#181c24] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-pink-500"
              >
                <option value="">All Years</option>
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Sort By</label>
              <select
                value={selectedSort}
                onChange={(e) => {
                  setSelectedSort(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-[#181c24] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-pink-500"
              >
                {SORTS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>
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
                      setSelectedGenre('Action');
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
              setSelectedGenre(g);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>
    </div>
  );
}
