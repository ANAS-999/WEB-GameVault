import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Bookmark, Search, LogIn, Gamepad2, 
  CheckCircle2, PlayCircle, Clock, XCircle, ArrowUpDown, Trash2, Loader2, Calendar, Monitor, X
} from 'lucide-react';
import { useVault } from '../context/VaultContext';
import { useAuth } from '../context/AuthContext';
import { GameStatus, VaultItem, IGDBGame } from '../types';
import { getIgdbImageUrl } from '../services/igdbApi';

interface VaultViewProps {
  onSelectGame: (game: IGDBGame) => void;
  onOpenAuth: () => void;
}

const statusTabs: { id: GameStatus | 'all'; label: string; icon: any }[] = [
  { id: 'all', label: 'All Games', icon: Bookmark },
  { id: 'playing', label: 'Playing', icon: PlayCircle },
  { id: 'completed', label: 'Completed', icon: CheckCircle2 },
  { id: 'want_to_play', label: 'Want to Play', icon: Clock },
  { id: 'dropped', label: 'Dropped', icon: XCircle },
];

const statusLabels: Record<GameStatus, { label: string; bg: string; text: string }> = {
  playing: { label: 'Playing', bg: 'bg-white text-black', text: 'text-black font-bold' },
  completed: { label: 'Completed', bg: 'bg-white text-black', text: 'text-black font-bold' },
  want_to_play: { label: 'Want to Play', bg: 'bg-white text-black', text: 'text-black font-bold' },
  dropped: { label: 'Dropped', bg: 'bg-[#27272a] text-white', text: 'text-white font-bold' },
};

const formatPlatformShort = (name: string): string => {
  if (name.includes('PC') || name.includes('Windows')) return 'PC';
  if (name.includes('PlayStation 5') || name.includes('PS5')) return 'PS5';
  if (name.includes('PlayStation 4') || name.includes('PS4')) return 'PS4';
  if (name.includes('PlayStation 3') || name.includes('PS3')) return 'PS3';
  if (name.includes('PlayStation 2') || name.includes('PS2')) return 'PS2';
  if (name.includes('PlayStation')) return 'PlayStation';
  if (name.includes('Xbox Series')) return 'Xbox Series';
  if (name.includes('Xbox One')) return 'Xbox One';
  if (name.includes('Xbox 360')) return 'Xbox 360';
  if (name.includes('Xbox')) return 'Xbox';
  if (name.includes('Nintendo Switch') || name.includes('Switch')) return 'Switch';
  return name.split(' ')[0];
};

export const VaultView: React.FC<VaultViewProps> = ({ onSelectGame, onOpenAuth }) => {
  const { user } = useAuth();
  const { vaultItems, loading, removeFromVault } = useVault();

  const [activeTab, setActiveTab] = useState<GameStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'addedAt' | 'title'>('addedAt');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Counts summary
  const counts = useMemo(() => {
    return {
      all: vaultItems.length,
      playing: vaultItems.filter(i => i.status === 'playing').length,
      completed: vaultItems.filter(i => i.status === 'completed').length,
      want_to_play: vaultItems.filter(i => i.status === 'want_to_play').length,
      dropped: vaultItems.filter(i => i.status === 'dropped').length,
    };
  }, [vaultItems]);

  // Filtered & Sorted items
  const filteredItems = useMemo(() => {
    return vaultItems
      .filter((item) => {
        const matchesTab = activeTab === 'all' || item.status === activeTab;
        const matchesSearch = !searchQuery.trim() || 
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.genres.some(g => g.toLowerCase().includes(searchQuery.toLowerCase())) ||
          item.platforms.some(p => p.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesTab && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'title') return a.title.localeCompare(b.title);
        return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
      });
  }, [vaultItems, activeTab, searchQuery, sortBy]);

  const handleOpenModal = (item: VaultItem) => {
    const game: IGDBGame = {
      id: item.gameId,
      name: item.title,
      cover: { id: 0, url: item.coverUrl },
      rating: item.ratingScore,
      first_release_date: item.releaseYear ? Math.floor(new Date(item.releaseYear, 0, 1).getTime() / 1000) : undefined,
      genres: item.genres.map((g, i) => ({ id: i, name: g })),
      platforms: item.platforms.map((p, i) => ({ id: i, name: p })),
    };
    onSelectGame(game);
  };

  const handleRemove = async (e: React.MouseEvent, gameId: number) => {
    e.stopPropagation();
    setDeletingId(gameId);
    try {
      await removeFromVault(gameId);
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  if (!user) {
    return (
      <div className="min-h-[55vh] flex items-center justify-center py-10">
        <div className="w-full max-w-xl p-8 bg-[#0c0c0e] border border-white/[0.08] rounded-3xl shadow-2xl flex flex-col items-center text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-zinc-300">
            <Bookmark className="w-6 h-6 text-zinc-300" />
          </div>

          <div className="space-y-1.5 max-w-md">
            <h3 className="text-base font-bold text-white tracking-tight">
              Your Vault is Locked
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Sign in to save games, track your playing backlog, and sync your personalized library across devices.
            </p>
          </div>

          <button
            onClick={onOpenAuth}
            className="flex items-center gap-2 px-5 py-2 bg-white hover:bg-zinc-200 text-black text-xs font-bold rounded-full transition-all shadow-sm hover:scale-105"
          >
            <LogIn className="w-3.5 h-3.5 text-black" />
            <span>Sign In to Access Vault</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 pt-1 sm:pt-2">
      
      {/* Top Filter Bar & Controls */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 sm:gap-4">
        
        {/* Status Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar justify-start px-1">
          {statusTabs.map((tab) => {
            const Icon = tab.icon;
            const count = counts[tab.id];
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                  activeTab === tab.id
                    ? 'bg-white text-black font-extrabold shadow-sm'
                    : 'text-[#8e8e93] hover:text-white hover:bg-[#18181c]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${activeTab === tab.id ? 'text-black' : 'text-white'}`} />
                <span>{tab.label}</span>
                <span className="opacity-80 text-[10px]">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Search & Sort Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative flex-1 sm:w-48">
            <Search className="w-3.5 h-3.5 text-white absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter vault..."
              className="w-full bg-[#141417] border border-[#27272a] rounded-xl pl-8 pr-8 py-1.5 text-xs text-white placeholder-[#71717a] focus:border-white focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-[#71717a] hover:text-white transition-colors"
              >
                <X className="w-3.5 h-3.5 text-white" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 bg-[#141417] border border-[#27272a] rounded-xl px-2.5 sm:px-3 py-1.5 flex-shrink-0">
            <ArrowUpDown className="w-3.5 h-3.5 text-white" />
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="bg-transparent text-xs text-white focus:outline-none cursor-pointer font-bold"
            >
              <option value="addedAt" className="bg-[#141417]">Recent</option>
              <option value="title" className="bg-[#141417]">Title</option>
            </select>
          </div>
        </div>

      </div>

      {/* Poster Grid Layout for Vault Items */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-6">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div key={idx} className="space-y-2 animate-pulse">
              <div className="w-full aspect-[3/4] bg-[#141417] rounded-xl" />
              <div className="h-4 bg-[#141417] rounded w-3/4" />
              <div className="h-3 bg-[#141417] rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-16 sm:py-20 text-[#8e8e93] space-y-2">
          <Gamepad2 className="w-8 h-8 sm:w-10 sm:h-10 text-white mx-auto" />
          <p className="text-white font-bold text-sm">No games in this section.</p>
          <p className="text-xs">Browse the Explore tab to add games to your vault!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-6">
          {filteredItems.map((item) => {
            const shortPlatforms = item.platforms?.map(formatPlatformShort) || [];
            const uniquePlatforms = Array.from(new Set(shortPlatforms)).slice(0, 3);

            return (
              <motion.div
                key={item.id}
                whileHover={{ y: -5 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                onClick={() => handleOpenModal(item)}
                className="group relative cursor-pointer flex flex-col gap-2 select-none"
              >
                {/* Poster Image Container */}
                <div className="relative aspect-[3/4] w-full bg-[#141417] rounded-xl overflow-hidden shadow-md">
                  <img
                    src={getIgdbImageUrl(item.coverUrl, undefined, 't_1080p')}
                    alt={item.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />

                  {/* Rating Score Badge */}
                  {item.ratingScore && (
                    <div className="absolute top-2 left-2 bg-[#0a0a0c]/90 border border-[#27272a] text-white text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 backdrop-blur-md">
                      <Star className="w-3 h-3 text-white fill-white" />
                      <span>{Math.round(item.ratingScore)}%</span>
                    </div>
                  )}

                  {/* Status Badge */}
                  <div className={`absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-md shadow-md ${statusLabels[item.status].bg} ${statusLabels[item.status].text}`}>
                    {statusLabels[item.status].label}
                  </div>

                  {/* Delete Button on Hover / Touch */}
                  <button
                    onClick={(e) => handleRemove(e, item.gameId)}
                    disabled={deletingId === item.gameId}
                    title="Remove from vault"
                    className="absolute bottom-2 right-2 p-1.5 sm:p-2 rounded-lg bg-black/80 text-white hover:text-red-400 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-all backdrop-blur-md disabled:opacity-100"
                  >
                    {deletingId === item.gameId ? (
                      <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin text-white" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white hover:text-red-400" />
                    )}
                  </button>
                </div>

                {/* Poster Details Below */}
                <div className="px-0.5 space-y-0.5 sm:space-y-1">
                  <h3 className="font-bold text-xs sm:text-sm text-white line-clamp-1 group-hover:text-zinc-300 transition-colors tracking-tight">
                    {item.title}
                  </h3>

                  <div className="flex items-center justify-between text-[11px] sm:text-xs text-[#8e8e93]">
                    {item.releaseYear ? (
                      <span className="flex items-center gap-1 font-medium">
                        <Calendar className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                        {item.releaseYear}
                      </span>
                    ) : (
                      <span className="text-[10px] sm:text-[11px] font-medium text-[#8e8e93]">
                        {item.genres[0] || 'Game'}
                      </span>
                    )}

                    {uniquePlatforms.length > 0 && (
                      <div className="flex items-center gap-1">
                        <Monitor className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#71717a]" />
                        <span className="text-[9px] sm:text-[10px] font-bold text-zinc-300 truncate max-w-[65px] sm:max-w-[80px]">
                          {uniquePlatforms.join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

    </div>
  );
};
