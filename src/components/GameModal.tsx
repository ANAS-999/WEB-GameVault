import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Star, Calendar, Gamepad2, Bookmark, Check, Trash2, 
  LogIn, Edit3, Loader2, ExternalLink, ChevronLeft, ChevronRight, Maximize2, Monitor
} from 'lucide-react';
import { IGDBGame, GameStatus } from '../types';
import { getIgdbImageUrl } from '../services/igdbApi';
import { useVault } from '../context/VaultContext';
import { useAuth } from '../context/AuthContext';

interface GameModalProps {
  game: IGDBGame | null;
  onClose: () => void;
  onOpenAuth: () => void;
}

const statusOptions: { value: GameStatus; label: string }[] = [
  { value: 'want_to_play', label: 'Want to Play' },
  { value: 'playing', label: 'Playing' },
  { value: 'completed', label: 'Completed' },
  { value: 'dropped', label: 'Dropped' },
];

export const GameModal: React.FC<GameModalProps> = ({ game, onClose, onOpenAuth }) => {
  const { user } = useAuth();
  const { getGameVaultItem, addOrUpdateGame, updateVaultItemDetails, removeFromVault } = useVault();

  if (!game) return null;

  const vaultItem = getGameVaultItem(game.id);

  const [status, setStatus] = useState<GameStatus>(vaultItem?.status || 'want_to_play');
  const [userNotes, setUserNotes] = useState<string>(vaultItem?.userNotes || '');
  const [activeMediaIndex, setActiveMediaIndex] = useState<number>(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isRemoving, setIsRemoving] = useState<boolean>(false);

  useEffect(() => {
    if (vaultItem) {
      setStatus(vaultItem.status);
      setUserNotes(vaultItem.userNotes || '');
    } else {
      setStatus('want_to_play');
      setUserNotes('');
    }
    setActiveMediaIndex(0);
  }, [vaultItem, game.id]);

  const coverUrl = getIgdbImageUrl(game.cover?.url, game.cover?.image_id, 't_1080p');
  const screenshots = game.screenshots?.map(s => getIgdbImageUrl(s.url, s.image_id, 't_1080p')) || [];
  
  // Combine cover and screenshots into a single media gallery
  const mediaGallery = [coverUrl, ...screenshots];
  const activeMediaUrl = mediaGallery[activeMediaIndex] || coverUrl;
  const isCoverView = activeMediaIndex === 0;

  const releaseYear = game.first_release_date 
    ? new Date(game.first_release_date * 1000).getFullYear() 
    : 'N/A';

  // Find direct store URLs from IGDB API websites array
  const steamWebsite = game.websites?.find(
    w => w.category === 13 || (w.url && w.url.toLowerCase().includes('steampowered.com'))
  );
  const epicWebsite = game.websites?.find(
    w => w.category === 16 || (w.url && w.url.toLowerCase().includes('epicgames.com'))
  );

  const directSteamUrl = steamWebsite?.url || `https://store.steampowered.com/search/?term=${encodeURIComponent(game.name)}`;
  const directEpicUrl = epicWebsite?.url || `https://store.epicgames.com/en-US/browse?q=${encodeURIComponent(game.name)}`;

  const handleNextMedia = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActiveMediaIndex((prev) => (prev + 1) % mediaGallery.length);
  };

  const handlePrevMedia = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActiveMediaIndex((prev) => (prev - 1 + mediaGallery.length) % mediaGallery.length);
  };

  const handleSaveVault = async () => {
    if (!user) {
      onOpenAuth();
      return;
    }
    setIsSaving(true);
    try {
      if (vaultItem) {
        await updateVaultItemDetails(game.id, {
          status,
          userNotes,
        });
      } else {
        await addOrUpdateGame(game, status, 0, userNotes);
      }
      onClose();
    } catch (err) {
      console.error('Failed to update vault item:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = async () => {
    if (!user) return;
    setIsRemoving(true);
    try {
      await removeFromVault(game.id);
      onClose();
    } catch (err) {
      console.error('Failed to remove vault item:', err);
    } finally {
      setIsRemoving(false);
    }
  };

  // Limit to max 8 thumbnails to fit perfectly on PC without page scroll
  const displayedThumbnails = mediaGallery.slice(0, 8);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 lg:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          className="relative w-full max-w-5xl bg-[#0a0a0c] border border-[#27272a] rounded-2xl shadow-2xl my-auto max-h-[88vh] flex flex-col overflow-hidden"
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#1c1c21] flex-shrink-0">
            <div className="flex items-center gap-2.5 truncate">
              <Gamepad2 className="w-5 h-5 text-white flex-shrink-0" />
              <h2 className="font-extrabold text-lg text-white truncate max-w-xl">{game.name}</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-white hover:text-zinc-400 transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Horizontal Desktop Layout: Fits Completely Inside Screen Without Scrolling */}
          <div className="p-5 overflow-y-auto lg:overflow-hidden flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* LEFT SIDE: Media Showcase & Tailored Grid (col-span-7 on PC) */}
            <div className="lg:col-span-7 flex flex-col justify-between space-y-3">
              
              {/* Main Widescreen Frame */}
              <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden bg-[#0d0d10] border border-[#27272a] shadow-xl group flex items-center justify-center">
                
                {/* Cinematic Ambient Blurred Backdrop */}
                <div 
                  className="absolute inset-0 bg-cover bg-center blur-3xl opacity-35 scale-125 transition-all duration-500 pointer-events-none"
                  style={{ backgroundImage: `url(${activeMediaUrl})` }}
                />

                {/* Ambient Dark Gradient Overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c] via-transparent to-[#0a0a0c]/40 pointer-events-none" />

                {/* Main Media Image */}
                <AnimatePresence mode="wait">
                  <motion.img
                    key={activeMediaUrl}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    src={activeMediaUrl}
                    alt={game.name}
                    className={`relative z-10 max-h-full transition-all ${
                      isCoverView
                        ? 'h-full w-auto object-contain rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] border border-[#3f3f46]/40 py-2'
                        : 'w-full h-full object-cover'
                    }`}
                  />
                </AnimatePresence>

                {/* Left/Right Carousel Controls */}
                {mediaGallery.length > 1 && (
                  <>
                    <button
                      onClick={handlePrevMedia}
                      className="absolute left-3 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/75 hover:bg-black text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all border border-[#27272a]"
                    >
                      <ChevronLeft className="w-5 h-5 text-white" />
                    </button>

                    <button
                      onClick={handleNextMedia}
                      className="absolute right-3 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/75 hover:bg-black text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all border border-[#27272a]"
                    >
                      <ChevronRight className="w-5 h-5 text-white" />
                    </button>
                  </>
                )}

                {/* Lightbox / Fullscreen Trigger */}
                <button
                  onClick={() => setIsLightboxOpen(true)}
                  title="Expand screenshot"
                  className="absolute top-3 right-3 z-20 p-2 rounded-xl bg-black/75 hover:bg-black text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all border border-[#27272a]"
                >
                  <Maximize2 className="w-4 h-4 text-white" />
                </button>
              </div>

              {/* Exact Space-Filling Screenshot Grid */}
              {mediaGallery.length > 1 && (
                <div className="space-y-1.5 flex-1 flex flex-col justify-end">
                  <div className="flex items-center justify-between text-[10px] uppercase font-extrabold text-[#8e8e93] tracking-wider px-0.5">
                    <span>Screenshots ({mediaGallery.length})</span>
                    <span className="text-[10px] font-medium text-[#71717a]">Select to view</span>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {displayedThumbnails.map((url, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveMediaIndex(idx)}
                        className={`relative aspect-[16/9] w-full rounded-xl overflow-hidden border-2 transition-all ${
                          activeMediaIndex === idx
                            ? 'border-white scale-105 shadow-md z-10'
                            : 'border-[#27272a] opacity-60 hover:opacity-100 hover:border-[#3f3f46]'
                        }`}
                      >
                        <img src={url} alt={`Screenshot ${idx}`} className="w-full h-full object-cover" />
                        {idx === 0 && (
                          <span className="absolute bottom-0.5 left-0.5 px-1 py-0.2 bg-black/85 text-[8px] font-bold text-white rounded">
                            Cover
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* RIGHT SIDE: Game Details & Actions (col-span-5 on PC) */}
            <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
              
              <div className="space-y-3.5">
                {/* Meta Badges */}
                <div className="flex flex-wrap items-center gap-2.5 text-xs">
                  <span className="flex items-center gap-1.5 text-white font-bold bg-[#141417] px-3 py-1 rounded-full border border-[#27272a]">
                    <Calendar className="w-3.5 h-3.5 text-white" />
                    {releaseYear}
                  </span>

                  {game.rating && (
                    <span className="flex items-center gap-1.5 text-white font-bold bg-[#141417] px-3 py-1 rounded-full border border-[#27272a]">
                      <Star className="w-3.5 h-3.5 text-white fill-white" />
                      {Math.round(game.rating)}% Score
                    </span>
                  )}
                </div>

                {/* Summary */}
                {game.summary && (
                  <div>
                    <h4 className="text-[10px] uppercase font-extrabold text-[#8e8e93] tracking-wider mb-1">Overview</h4>
                    <p className="text-xs text-[#e4e4e7] leading-relaxed line-clamp-4">{game.summary}</p>
                  </div>
                )}

                {/* Platforms List */}
                {game.platforms && game.platforms.length > 0 && (
                  <div>
                    <h4 className="text-[10px] uppercase font-extrabold text-[#8e8e93] tracking-wider mb-1 flex items-center gap-1">
                      <Monitor className="w-3 h-3 text-white" />
                      Platforms
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {game.platforms.slice(0, 6).map((platform) => (
                        <span
                          key={platform.id}
                          className="px-2 py-0.5 bg-[#141417] border border-[#27272a] text-white font-bold text-[10px] rounded-md"
                        >
                          {platform.name}
                        </span>
                      ))}
                      {game.platforms.length > 6 && (
                        <span className="px-1.5 py-0.5 bg-[#141417] text-[#8e8e93] font-bold text-[10px] rounded-md">
                          +{game.platforms.length - 6}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Genres List */}
                {game.genres && game.genres.length > 0 && (
                  <div>
                    <h4 className="text-[10px] uppercase font-extrabold text-[#8e8e93] tracking-wider mb-1">Genres</h4>
                    <div className="flex flex-wrap gap-1">
                      {game.genres.map((genre) => (
                        <span
                          key={genre.id}
                          className="px-2 py-0.5 bg-[#141417] border border-[#27272a] text-white font-semibold text-[10px] rounded-md"
                        >
                          {genre.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Section: Stores & Vault */}
              <div className="pt-3 border-t border-[#1c1c21] space-y-3">
                
                {/* Direct Store Action Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={directSteamUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between px-3 py-2 bg-[#141417] hover:bg-[#18181c] border border-[#27272a] hover:border-[#3f3f46] text-white text-xs font-bold rounded-xl transition-all shadow-sm group"
                  >
                    <span className="flex items-center gap-2">
                      <svg className="w-3.5 h-3.5 text-white fill-current flex-shrink-0" viewBox="0 0 24 24">
                        <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.03 4.524 4.524s-2.03 4.524-4.524 4.524h-.105l-4.076 2.911c.002.046.006.092.006.139 0 1.876-1.521 3.396-3.396 3.396-1.621 0-2.984-1.135-3.33-2.662L.26 15.698C1.517 20.528 5.95 24 11.979 24c6.627 0 12-5.373 12-12s-5.373-12-12-12z"/>
                      </svg>
                      Steam
                    </span>
                    <ExternalLink className="w-3 h-3 text-[#8e8e93] group-hover:text-white transition-colors flex-shrink-0" />
                  </a>

                  <a
                    href={directEpicUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between px-3 py-2 bg-[#141417] hover:bg-[#18181c] border border-[#27272a] hover:border-[#3f3f46] text-white text-xs font-bold rounded-xl transition-all shadow-sm group"
                  >
                    <span className="flex items-center gap-2">
                      <svg className="w-3.5 h-3.5 text-white flex-shrink-0" viewBox="0 0 200 240">
                        <path d="M20 0h160c11 0 20 9 20 20v135c0 10-5 19-13 24l-60 38c-4 3-10 3-14 0l-60-38C5 174 0 165 0 155V20C0 9 9 0 20 0z" fill="#ffffff" />
                        <text x="100" y="105" textAnchor="middle" fill="#0a0a0c" fontSize="76" fontFamily="Arial Black, Impact, sans-serif" fontWeight="900" letterSpacing="-2">EPIC</text>
                        <text x="100" y="165" textAnchor="middle" fill="#0a0a0c" fontSize="36" fontFamily="Arial Black, sans-serif" fontWeight="800" letterSpacing="1">GAMES</text>
                        <polygon points="65,190 135,190 100,210" fill="#0a0a0c" />
                      </svg>
                      Epic Games
                    </span>
                    <ExternalLink className="w-3 h-3 text-[#8e8e93] group-hover:text-white transition-colors flex-shrink-0" />
                  </a>
                </div>

                {/* Vault Controls */}
                {!user ? (
                  <div className="space-y-2">
                    <p className="text-xs text-[#8e8e93]">Sign in to add this game to your vault.</p>
                    <button
                      onClick={onOpenAuth}
                      className="w-full flex items-center justify-center gap-1.5 px-4 py-2 bg-white text-black text-xs font-extrabold rounded-xl hover:bg-[#e4e4e7] transition-colors"
                    >
                      <LogIn className="w-3.5 h-3.5 text-black" />
                      Sign In
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Status Selector Pills */}
                    <div>
                      <label className="block text-[10px] font-extrabold text-[#8e8e93] uppercase tracking-wider mb-1.5">
                        Collection Status
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {statusOptions.map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => setStatus(opt.value)}
                            className={`px-3 py-1 text-xs font-semibold rounded-full transition-all ${
                              status === opt.value
                                ? 'bg-white text-black font-extrabold shadow-sm'
                                : 'text-[#8e8e93] hover:text-white bg-[#141417]'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Personal Notes */}
                    <div>
                      <label className="block text-[10px] font-extrabold text-[#8e8e93] uppercase tracking-wider mb-1 flex items-center gap-1">
                        <Edit3 className="w-3 h-3 text-white" />
                        Personal Notes
                      </label>
                      <textarea
                        rows={2}
                        value={userNotes}
                        onChange={(e) => setUserNotes(e.target.value)}
                        placeholder="Completion thoughts, review notes..."
                        className="w-full bg-[#141417] border border-[#27272a] rounded-xl px-3 py-1.5 text-xs text-white placeholder-[#52525b] focus:border-white focus:outline-none transition-colors"
                      />
                    </div>

                    {/* Save & Remove Buttons */}
                    <div className="flex items-center justify-between pt-1">
                      <button
                        onClick={handleSaveVault}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-5 py-2 bg-white hover:bg-[#e4e4e7] disabled:opacity-60 text-black text-xs font-extrabold rounded-full transition-colors shadow-sm"
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-black" /> Saving...
                          </>
                        ) : (
                          <>
                            <Bookmark className="w-4 h-4 text-black" /> {vaultItem ? 'Update Vault' : 'Add to Vault'}
                          </>
                        )}
                      </button>

                      {vaultItem && (
                        <button
                          onClick={handleRemove}
                          disabled={isRemoving}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-red-400 hover:text-white text-xs font-bold transition-colors disabled:opacity-60"
                        >
                          {isRemoving ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-red-400" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5 text-red-400" />
                          )}
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>

        </motion.div>
      </div>

      {/* High-Res Fullscreen Lightbox Modal */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 backdrop-blur-lg">
          <button
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-4 right-4 p-2 text-white hover:text-zinc-400 transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          <img
            src={activeMediaUrl}
            alt={game.name}
            className="max-w-full max-h-[92vh] object-contain rounded-2xl shadow-2xl"
          />
        </div>
      )}
    </AnimatePresence>
  );
};
