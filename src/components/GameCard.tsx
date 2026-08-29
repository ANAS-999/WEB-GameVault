import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Plus, Check, Calendar, Loader2, Monitor } from 'lucide-react';
import { IGDBGame, GameStatus } from '../types';
import { getIgdbImageUrl } from '../services/igdbApi';
import { useVault } from '../context/VaultContext';
import { useAuth } from '../context/AuthContext';

interface GameCardProps {
  game: IGDBGame;
  onSelectGame: (game: IGDBGame) => void;
  onOpenAuth: () => void;
}

const statusLabels: Record<GameStatus, { label: string; bg: string; text: string }> = {
  playing: { label: 'Playing', bg: 'bg-white text-black', text: 'text-black font-bold' },
  completed: { label: 'Completed', bg: 'bg-white text-black', text: 'text-black font-bold' },
  want_to_play: { label: 'Want to Play', bg: 'bg-white text-black', text: 'text-black font-bold' },
  dropped: { label: 'Dropped', bg: 'bg-[#27272a] text-white', text: 'text-white font-bold' },
};

/**
 * Format platform name to clean short badge (e.g. 'PC (Microsoft Windows)' -> 'PC', 'PlayStation 5' -> 'PS5')
 */
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

export const GameCard: React.FC<GameCardProps> = ({ game, onSelectGame, onOpenAuth }) => {
  const { user } = useAuth();
  const { getGameVaultItem, addOrUpdateGame } = useVault();
  const [isAdding, setIsAdding] = useState(false);

  const vaultItem = getGameVaultItem(game.id);
  const isSaved = Boolean(vaultItem);

  const coverUrl = getIgdbImageUrl(game.cover?.url, game.cover?.image_id, 't_1080p');
  const releaseYear = game.first_release_date 
    ? new Date(game.first_release_date * 1000).getFullYear() 
    : null;
  const rating = game.rating ? Math.round(game.rating) : null;

  // Short platform badges (max 3)
  const platforms = game.platforms?.map(p => formatPlatformShort(p.name)) || [];
  const uniquePlatforms = Array.from(new Set(platforms)).slice(0, 3);

  const handleQuickAdd = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      onOpenAuth();
      return;
    }
    if (!isSaved && !isAdding) {
      setIsAdding(true);
      try {
        await addOrUpdateGame(game, 'want_to_play');
      } catch (err) {
        console.error(err);
      } finally {
        setIsAdding(false);
      }
    }
  };

  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      onClick={() => onSelectGame(game)}
      className="group relative cursor-pointer flex flex-col gap-2 select-none"
    >
      {/* Poster Image Container */}
      <div className="relative aspect-[3/4] w-full bg-[#141417] rounded-xl overflow-hidden shadow-md">
        <img
          src={coverUrl}
          alt={game.name}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* Rating Score Badge */}
        {rating !== null && (
          <div className="absolute top-2 left-2 bg-[#0a0a0c]/90 border border-[#27272a] text-white text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 backdrop-blur-md">
            <Star className="w-3 h-3 text-white fill-white" />
            <span>{rating}%</span>
          </div>
        )}

        {/* Saved Vault Badge */}
        {vaultItem && (
          <div className={`absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-md shadow-md ${statusLabels[vaultItem.status].bg} ${statusLabels[vaultItem.status].text}`}>
            {statusLabels[vaultItem.status].label}
          </div>
        )}

        {/* Quick Add Button on Hover / Touch */}
        <button
          onClick={handleQuickAdd}
          disabled={isAdding}
          title={isSaved ? `In Vault (${statusLabels[vaultItem.status].label})` : 'Add to Want to Play'}
          className={`absolute bottom-2 right-2 p-1.5 sm:p-2 rounded-lg text-xs font-medium backdrop-blur-md transition-all shadow-lg ${
            isSaved
              ? 'bg-white text-black font-bold opacity-100'
              : 'bg-white text-black hover:bg-zinc-200 opacity-90 sm:opacity-0 sm:group-hover:opacity-100'
          }`}
        >
          {isAdding ? (
            <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin text-black" />
          ) : isSaved ? (
            <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-black" />
          ) : (
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-black" />
          )}
        </button>
      </div>

      {/* Clean Details Below */}
      <div className="px-0.5 space-y-0.5 sm:space-y-1">
        <h3 className="font-bold text-xs sm:text-sm text-white line-clamp-1 group-hover:text-zinc-300 transition-colors tracking-tight">
          {game.name}
        </h3>

        <div className="flex items-center justify-between text-[11px] sm:text-xs text-[#8e8e93]">
          {releaseYear ? (
            <span className="flex items-center gap-1 font-medium">
              <Calendar className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
              {releaseYear}
            </span>
          ) : (
            <span className="text-[10px] sm:text-[11px] font-medium text-[#8e8e93]">
              {game.genres?.[0]?.name || 'Game'}
            </span>
          )}

          {/* Platform Badges */}
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
};
