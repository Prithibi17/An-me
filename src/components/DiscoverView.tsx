import React, { useState, useEffect } from 'react';
import { Filter, Search, RotateCcw } from 'lucide-react';
import { Anime } from '../types/anime';
import { searchAnime } from '../services/anilist';
import { AnimeCard } from './AnimeCard';

interface DiscoverViewProps {
  onSelectAnime: (anime: Anime) => void;
  onPlayAnime: (anime: Anime) => void;
}

const GENRES = [
  'All',
  'Action',
  'Adventure',
  'Comedy',
  'Drama',
  'Fantasy',
  'Horror',
  'Mecha',
  'Mystery',
  'Psychological',
  'Romance',
  'Sci-Fi',
  'Slice of Life',
  'Sports',
  'Supernatural',
  'Thriller',
];

const SEASONS = ['All', 'WINTER', 'SPRING', 'SUMMER', 'FALL'];
const FORMATS = ['All', 'TV', 'TV_SHORT', 'MOVIE', 'SPECIAL', 'OVA', 'ONA'];
const SORTS = [
  { label: 'Popularity', value: 'POPULARITY_DESC' },
  { label: 'Trending', value: 'TRENDING_DESC' },
  { label: 'Highest Rated', value: 'SCORE_DESC' },
  { label: 'Recently Updated', value: 'UPDATED_AT_DESC' },
  { label: 'Release Date', value: 'START_DATE_DESC' },
];

export function DiscoverView({ onSelectAnime, onPlayAnime }: DiscoverViewProps) {
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [selectedSeason, setSelectedSeason] = useState('All');
  const [selectedFormat, setSelectedFormat] = useState('All');
  const [selectedSort, setSelectedSort] = useState('POPULARITY_DESC');
  const [selectedYear, setSelectedYear] = useState<number | undefined>(undefined);
  const [results, setResults] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const data = await searchAnime({
        genre: selectedGenre,
        season: selectedSeason,
        format: selectedFormat,
        sort: selectedSort,
        year: selectedYear,
        perPage: 24,
      });
      setResults(data);
    } catch (err) {
      console.error('Discover query error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, [selectedGenre, selectedSeason, selectedFormat, selectedSort, selectedYear]);

  const handleReset = () => {
    setSelectedGenre('All');
    setSelectedSeason('All');
    setSelectedFormat('All');
    setSelectedSort('POPULARITY_DESC');
    setSelectedYear(undefined);
  };

  const years = Array.from({ length: 25 }, (_, i) => new Date().getFullYear() - i);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/[0.06] gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Filter className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white tracking-tight">Discover Anime</h1>
            <p className="text-xs text-slate-400">Filter by genres, seasons, release year and formats</p>
          </div>
        </div>

        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/[0.06] transition-all self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset Filters
        </button>
      </div>

      {/* Filter Options Bar */}
      <div className="bg-[#141724] border border-white/[0.06] rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl">
        {/* Genre Pill Tags */}
        <div>
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Genres</label>
          <div className="flex flex-wrap gap-1.5">
            {GENRES.map((genre) => (
              <button
                key={genre}
                onClick={() => setSelectedGenre(genre)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  selectedGenre === genre
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                    : 'bg-[#1b1f30] text-slate-400 hover:text-white hover:bg-[#23283e]'
                }`}
              >
                {genre}
              </button>
            ))}
          </div>
        </div>

        {/* Dropdown Selectors */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-white/[0.04]">
          {/* Season */}
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Season</label>
            <select
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(e.target.value)}
              className="w-full bg-[#1b1f30] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
            >
              {SEASONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Year */}
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Year</label>
            <select
              value={selectedYear || ''}
              onChange={(e) => setSelectedYear(e.target.value ? Number(e.target.value) : undefined)}
              className="w-full bg-[#1b1f30] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
            >
              <option value="">All Years</option>
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          {/* Format */}
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Format</label>
            <select
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value)}
              className="w-full bg-[#1b1f30] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
            >
              {FORMATS.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Sort By</label>
            <select
              value={selectedSort}
              onChange={(e) => setSelectedSort(e.target.value)}
              className="w-full bg-[#1b1f30] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
            >
              {SORTS.map((sort) => (
                <option key={sort.value} value={sort.value}>{sort.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results Count & Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs text-slate-400">
            Showing <span className="text-white font-bold">{results.length}</span> titles
          </p>
        </div>

        {loading ? (
          <div className="py-24 text-center text-slate-400 text-sm">Searching titles...</div>
        ) : results.length === 0 ? (
          <div className="py-24 text-center text-slate-400 text-sm bg-[#141724] rounded-2xl border border-white/[0.06]">
            No anime matched the selected filters. Try broadening your criteria.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
            {results.map((anime) => (
              <AnimeCard
                key={anime.id}
                anime={anime}
                onSelect={onSelectAnime}
                onPlay={onPlayAnime}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
