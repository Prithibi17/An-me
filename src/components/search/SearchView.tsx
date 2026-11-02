import React, { useState, useEffect } from 'react';
import {
  Filter,
  Search,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';
import { Anime } from '../../types/anime';
import { searchAnime } from '../../services/anilist';
import { enrichAnimeAvailability } from '../../services/availability';
import { AnimeCard } from '../AnimeCard';
import { HiAnimeTop10 } from '../HiAnimeTop10';
import { GenresCard } from '../GenresCard';

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
  const [selectedGenre, setSelectedGenre] = useState(initialGenre);
  const [selectedSeason, setSelectedSeason] = useState('All');
  const [selectedFormat, setSelectedFormat] = useState('All');
  const [selectedSort, setSelectedSort] = useState('POPULARITY_DESC');
  const [selectedYear, setSelectedYear] = useState<number | undefined>(undefined);
  const [results, setResults] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchResults = async (page = 1) => {
    try {
      setLoading(true);
      const data = await searchAnime({
        search: query.trim() || undefined,
        genre: selectedGenre !== 'All' ? selectedGenre : undefined,
        season: selectedSeason !== 'All' ? selectedSeason : undefined,
        format: selectedFormat !== 'All' ? selectedFormat : undefined,
        sort: selectedSort,
        year: selectedYear,
        page,
        perPage: 24,
      });
      setResults(data);
      setCurrentPage(page);
      setHasMore(data.length === 24);
      enrichAnimeAvailability(data).then((enriched) => {
        setResults(enriched);
      }).catch(() => {});
    } catch (err) {
      console.error('Search query error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults(1);
  }, [query, selectedGenre, selectedSeason, selectedFormat, selectedSort, selectedYear]);

  const handleReset = () => {
    setQuery('');
    setSelectedGenre('All');
    setSelectedSeason('All');
    setSelectedFormat('All');
    setSelectedSort('POPULARITY_DESC');
    setSelectedYear(undefined);
  };

  const years = Array.from({ length: 25 }, (_, i) => new Date().getFullYear() - i);

  // Dynamic header title matching kumo-anime browse listing
  const getListingTitle = () => {
    if (query) return `Search results for "${query}"`;
    if (selectedGenre !== 'All') return `${selectedGenre} Anime`;
    if (selectedFormat !== 'All') return `${selectedFormat} Anime`;
    return 'Browse Anime';
  };

  return (
    <div className="w-full max-w-[1720px] mx-auto min-h-screen px-3 sm:px-6 lg:px-8 py-6 text-white select-none animate-fade-in pb-16">
      {/* 1. Header & Filters Box */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-white/10 gap-3">
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <span className="w-2.5 h-6 rounded-full bg-gradient-to-b from-red-500 via-pink-500 to-blue-500 inline-block"></span>
            {getListingTitle()}
          </h1>

          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#161a24] hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-colors self-start sm:self-auto"
          >
            <RotateCcw className="w-3.5 h-3.5 text-blue-400" />
            Reset Filters
          </button>
        </div>

        {/* Filter Panel */}
        <div className="bg-[#11151B] border border-white/10 rounded-xl p-4 sm:p-5 space-y-4 shadow-xl">
          {/* Genre Chips */}
          <div>
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block mb-2">Genres</label>
            <div className="flex flex-wrap gap-1.5">
              {GENRES.map((g, idx) => {
                const isSelected = selectedGenre === g;
                return (
                  <button
                    key={g}
                    onClick={() => setSelectedGenre(g)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
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
                onChange={(e) => setSelectedFormat(e.target.value)}
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
                onChange={(e) => setSelectedSeason(e.target.value)}
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
                onChange={(e) => setSelectedYear(e.target.value ? Number(e.target.value) : undefined)}
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
                onChange={(e) => setSelectedSort(e.target.value)}
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
            <div className="py-24 text-center text-xs text-slate-400">Loading catalog results...</div>
          ) : results.length === 0 ? (
            <div className="py-24 text-center bg-[#11151B] rounded-xl border border-white/10 text-sm text-slate-400">
              No anime found matching current criteria.
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

              {/* Pagination Controls matching web */}
              <div className="flex items-center justify-center gap-1.5 pt-6 pb-2">
                <button
                  onClick={() => fetchResults(1)}
                  disabled={currentPage <= 1}
                  className={`grid h-9 w-9 place-items-center rounded-lg text-xs font-bold transition-colors ${
                    currentPage <= 1
                      ? 'bg-white/5 opacity-30 cursor-not-allowed'
                      : 'bg-[#161a24] hover:bg-blue-600 cursor-pointer'
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
                      className={`grid h-9 w-9 place-items-center rounded-lg text-xs font-bold transition-colors ${
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
            onSelectGenre={(g) => setSelectedGenre(g)}
          />
        </div>
      </div>
    </div>
  );
}
