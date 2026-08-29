import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, RefreshCw, AlertTriangle, X, Loader2 } from 'lucide-react';
import { IGDBGame } from '../types';
import { fetchPopularGames, searchGames, fetchGamesByGenre } from '../services/igdbApi';
import { GameCard } from '../components/GameCard';

interface ExploreViewProps {
  onSelectGame: (game: IGDBGame) => void;
  onOpenAuth: () => void;
}

const genresList = [
  { id: 0, name: 'All Games' },
  { id: 12, name: 'RPG' },
  { id: 31, name: 'Adventure' },
  { id: 5, name: 'Shooter' },
  { id: 15, name: 'Strategy' },
  { id: 10, name: 'Racing' },
  { id: 14, name: 'Sports' },
  { id: 32, name: 'Indie' },
];

const PAGE_SIZE = 24;

export const ExploreView: React.FC<ExploreViewProps> = ({ onSelectGame, onOpenAuth }) => {
  const [games, setGames] = useState<IGDBGame[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeGenre, setActiveGenre] = useState<number>(0);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Initial Load
  const loadInitial = async () => {
    setLoading(true);
    setError(null);
    setHasMore(true);
    try {
      let results: IGDBGame[] = [];
      if (searchQuery.trim()) {
        results = await searchGames(searchQuery, PAGE_SIZE, 0);
      } else if (activeGenre !== 0) {
        results = await fetchGamesByGenre(activeGenre, PAGE_SIZE, 0);
      } else {
        results = await fetchPopularGames(PAGE_SIZE, 0);
      }
      setGames(results);
      setHasMore(results.length >= PAGE_SIZE);
      setError(null);
    } catch (err: any) {
      console.error('Failed to load initial games:', err);
      setError(err.message || 'Unable to connect to IGDB API.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitial();
  }, []);

  // Infinite Scroll Load More
  const loadMoreGames = useCallback(async () => {
    if (loading || loadingMore || !hasMore) return;

    setLoadingMore(true);
    try {
      const nextOffset = games.length;
      let newGames: IGDBGame[] = [];

      if (searchQuery.trim()) {
        newGames = await searchGames(searchQuery, PAGE_SIZE, nextOffset);
      } else if (activeGenre !== 0) {
        newGames = await fetchGamesByGenre(activeGenre, PAGE_SIZE, nextOffset);
      } else {
        newGames = await fetchPopularGames(PAGE_SIZE, nextOffset);
      }

      if (newGames.length === 0) {
        setHasMore(false);
      } else {
        setGames((prev) => {
          const existingIds = new Set(prev.map(g => g.id));
          const uniqueNew = newGames.filter(g => !existingIds.has(g.id));
          return [...prev, ...uniqueNew];
        });
        setHasMore(newGames.length >= PAGE_SIZE);
      }
    } catch (err) {
      console.error('Failed to load more games:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [games.length, loading, loadingMore, hasMore, searchQuery, activeGenre]);

  // Setup IntersectionObserver for Sentinel Element
  useEffect(() => {
    if (loading) return;

    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadMoreGames();
        }
      },
      { threshold: 0.2, rootMargin: '300px' }
    );

    if (sentinelRef.current) {
      observerRef.current.observe(sentinelRef.current);
    }

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [loadMoreGames, loading, hasMore, loadingMore]);

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActiveGenre(0);
    loadInitial();
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setActiveGenre(0);
    setTimeout(loadInitial, 0);
  };

  const handleGenreClick = async (genreId: number) => {
    setActiveGenre(genreId);
    setSearchQuery('');
    setLoading(true);
    setError(null);
    setHasMore(true);
    try {
      let results: IGDBGame[] = [];
      if (genreId === 0) {
        results = await fetchPopularGames(PAGE_SIZE, 0);
      } else {
        results = await fetchGamesByGenre(genreId, PAGE_SIZE, 0);
      }
      setGames(results);
      setHasMore(results.length >= PAGE_SIZE);
      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch by genre:', err);
      setError(err.message || 'Failed to fetch games for selected genre.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      
      {/* Sleek Search & Filter Bar */}
      <div className="space-y-4 max-w-4xl mx-auto pt-2">
        
        <form onSubmit={handleSearchSubmit} className="relative flex items-center">
          <Search className="w-5 h-5 text-white absolute left-4" />
          
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search thousands of video games..."
            className="w-full bg-[#141417] border border-[#27272a] rounded-2xl pl-12 pr-32 py-3.5 text-sm text-white placeholder-[#71717a] focus:border-white focus:outline-none transition-colors shadow-sm"
          />

          {/* Clear Search Button */}
          {searchQuery && (
            <button
              type="button"
              onClick={handleClearSearch}
              title="Clear search"
              className="absolute right-24 p-1.5 text-[#71717a] hover:text-white transition-colors"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          )}

          <button
            type="submit"
            className="absolute right-2 px-5 py-2 bg-white hover:bg-[#e4e4e7] text-black text-xs font-extrabold rounded-xl transition-colors"
          >
            Search
          </button>
        </form>

        {/* Minimal Category Navigation */}
        <div className="flex items-center justify-center gap-1 overflow-x-auto pb-1 scrollbar-none">
          {genresList.map((genre) => (
            <button
              key={genre.id}
              onClick={() => handleGenreClick(genre.id)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                activeGenre === genre.id
                  ? 'bg-white text-black font-extrabold shadow-sm'
                  : 'text-[#8e8e93] hover:text-white hover:bg-[#18181c]'
              }`}
            >
              {genre.name}
            </button>
          ))}
        </div>

      </div>

      {/* Error Alert - Sleek Modern Design */}
      {error && games.length === 0 && (
        <div className="max-w-xl mx-auto my-6 p-6 bg-[#0c0c0e] border border-white/[0.08] rounded-2xl sm:rounded-3xl shadow-xl flex flex-col items-center text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-zinc-300">
            <AlertTriangle className="w-6 h-6 text-zinc-300" />
          </div>

          <div className="space-y-1.5 max-w-md">
            <h3 className="text-base font-bold text-white tracking-tight">
              Unable to load games
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              {error}
            </p>
          </div>

          <button
            onClick={loadInitial}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2 bg-white hover:bg-zinc-200 text-black text-xs font-bold rounded-full transition-all shadow-sm hover:scale-105 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-black ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Reconnecting...' : 'Try Again'}</span>
          </button>
        </div>
      )}

      {/* Poster Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {Array.from({ length: 10 }).map((_, idx) => (
            <div key={idx} className="space-y-2 animate-pulse">
              <div className="w-full aspect-[3/4] bg-[#141417] rounded-xl" />
              <div className="h-4 bg-[#141417] rounded w-3/4" />
              <div className="h-3 bg-[#141417] rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : games.length === 0 ? (
        <div className="text-center py-20 text-[#8e8e93]">
          <p className="text-sm font-medium">No games found matching your search query.</p>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {games.map((game) => (
              <GameCard
                key={game.id}
                game={game}
                onSelectGame={onSelectGame}
                onOpenAuth={onOpenAuth}
              />
            ))}
          </div>

          {/* Infinite Scroll Sentinel & Loader */}
          <div ref={sentinelRef} className="py-6 text-center flex items-center justify-center">
            {loadingMore && (
              <div className="flex items-center gap-2 text-xs font-bold text-[#8e8e93] bg-[#141417] border border-[#27272a] px-4 py-2 rounded-full">
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Loading more games...</span>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
