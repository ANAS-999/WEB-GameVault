import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Star, Calendar, Bookmark, Trash2, 
  LogIn, Edit3, Loader2, ExternalLink, ChevronLeft, ChevronRight, Maximize2, History
} from 'lucide-react';
import { IGDBGame, GameStatus } from '../types';
import { getIgdbImageUrl, fetchFranchiseTimeline } from '../services/igdbApi';
import { useVault } from '../context/VaultContext';
import { useAuth } from '../context/AuthContext';

interface GameModalProps {
  game: IGDBGame | null;
  onClose: () => void;
  onOpenAuth: () => void;
  onSelectGame?: (game: IGDBGame) => void;
}

const statusOptions: { value: GameStatus; label: string }[] = [
  { value: 'want_to_play', label: 'Want to Play' },
  { value: 'playing', label: 'Playing' },
  { value: 'completed', label: 'Completed' },
  { value: 'dropped', label: 'Dropped' },
];

export const GameModal: React.FC<GameModalProps> = ({ game, onClose, onOpenAuth, onSelectGame }) => {
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
  
  // Franchise Story Timeline state
  const [timelineGames, setTimelineGames] = useState<IGDBGame[]>([]);
  const [loadingTimeline, setLoadingTimeline] = useState<boolean>(false);

  // Thumbnail elements ref for auto-scrolling
  const thumbnailRefs = useRef<(HTMLButtonElement | null)[]>([]);
  
  // Timeline container & station refs for auto-scrolling
  const timelineContainerRef = useRef<HTMLDivElement | null>(null);
  const timelineStationRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Auto-scroll selected thumbnail into center view
  useEffect(() => {
    const activeThumbnail = thumbnailRefs.current[activeMediaIndex];
    if (activeThumbnail) {
      activeThumbnail.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [activeMediaIndex]);

  // Helper to accurately match the current game by ID OR (name AND release year)
  const isMatchingCurrentGame = (a?: IGDBGame | null, b?: IGDBGame | null) => {
    if (!a || !b) return false;
    if (a.id === b.id) return true;
    const aYear = a.first_release_date ? new Date(a.first_release_date * 1000).getFullYear() : null;
    const bYear = b.first_release_date ? new Date(b.first_release_date * 1000).getFullYear() : null;
    const namesMatch = a.name.trim().toLowerCase() === b.name.trim().toLowerCase();
    if (namesMatch && aYear && bYear) {
      return aYear === bYear;
    }
    return false;
  };

  // Auto-scroll timeline to the current game in the dialog
  useEffect(() => {
    if (timelineGames.length === 0) return;
    const currentIdx = timelineGames.findIndex((item) => isMatchingCurrentGame(item, game));
    if (currentIdx !== -1) {
      const activeStation = timelineStationRefs.current[currentIdx];
      if (activeStation) {
        const timer = setTimeout(() => {
          activeStation.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'center',
          });
        }, 120);
        return () => clearTimeout(timer);
      }
    }
  }, [timelineGames, game?.id, game?.name, game?.first_release_date]);

  const handleScrollTimeline = (direction: 'left' | 'right') => {
    if (timelineContainerRef.current) {
      const scrollAmount = 260;
      timelineContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  // Prevent background page scrolling when modal is open and restore cleanly on close
  useEffect(() => {
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.removeProperty('overflow');
      document.documentElement.style.removeProperty('overflow');
    };
  }, []);

  useEffect(() => {
    if (vaultItem) {
      setStatus(vaultItem.status);
      setUserNotes(vaultItem.userNotes || '');
    } else {
      setStatus('want_to_play');
      setUserNotes('');
    }
    setActiveMediaIndex(0);

    // Fetch main line franchise timeline games only if not already loaded for this franchise
    if (game?.name) {
      const isAlreadyInTimeline = timelineGames.some(i => isMatchingCurrentGame(i, game));
      if (isAlreadyInTimeline) {
        return;
      }

      setLoadingTimeline(true);
      fetchFranchiseTimeline(game.name, game.id)
        .then((items) => {
          // Ensure current game is present in timeline array and sorted chronologically
          const hasCurrent = items.some(i => isMatchingCurrentGame(i, game));
          let finalItems = items;
          if (!hasCurrent) {
            finalItems = [...items, game].sort((a, b) => (a.first_release_date || 0) - (b.first_release_date || 0));
          }
          setTimelineGames(finalItems);
        })
        .catch((err) => {
          console.error('Failed to load timeline games:', err);
          setTimelineGames([]);
        })
        .finally(() => {
          setLoadingTimeline(false);
        });
    }
  }, [vaultItem, game?.id, game?.name, game?.first_release_date]);

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

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 lg:p-6 bg-black/80 backdrop-blur-md overflow-y-auto overscroll-contain">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-5xl bg-[#0c0c0e] border border-white/[0.08] rounded-2xl sm:rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)] my-auto max-h-[92vh] flex flex-col overflow-hidden text-zinc-100 overscroll-contain"
        >
          {/* Header Bar - Modern & Sleek */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] flex-shrink-0 bg-[#0c0c0e]/90 backdrop-blur-md">
            <div className="flex items-center gap-3 min-w-0 pr-4">
              <h2 className="font-bold text-base sm:text-xl text-white truncate tracking-tight">
                {game.name}
              </h2>
              {releaseYear !== 'N/A' && (
                <span className="flex-shrink-0 text-xs font-semibold text-zinc-400 bg-white/[0.04] border border-white/[0.08] px-2.5 py-0.5 rounded-full">
                  {releaseYear}
                </span>
              )}
            </div>

            {/* Header Actions: Store Icon Buttons & Close Button */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Steam Store Icon Button */}
              <a
                href={directSteamUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="View on Steam"
                aria-label="View on Steam"
                className="w-8 h-8 rounded-full flex items-center justify-center bg-white/[0.04] hover:bg-white/[0.12] hover:text-white border border-white/[0.06] text-zinc-400 transition-all hover:scale-105"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.03 4.524 4.524s-2.03 4.524-4.524 4.524h-.105l-4.076 2.911c.002.046.006.092.006.139 0 1.876-1.521 3.396-3.396 3.396-1.621 0-2.984-1.135-3.33-2.662L.26 15.698C1.517 20.528 5.95 24 11.979 24c6.627 0 12-5.373 12-12s-5.373-12-12-12z"/>
                </svg>
              </a>

              {/* Epic Games Store Icon Button */}
              <a
                href={directEpicUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="View on Epic Games Store"
                aria-label="View on Epic Games"
                className="w-8 h-8 rounded-full flex items-center justify-center bg-white/[0.04] hover:bg-white/[0.12] hover:text-white border border-white/[0.06] text-zinc-400 transition-all hover:scale-105"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 200 240">
                  <path d="M20 0h160c11 0 20 9 20 20v135c0 10-5 19-13 24l-60 38c-4 3-10 3-14 0l-60-38C5 174 0 165 0 155V20C0 9 9 0 20 0z" fill="currentColor" />
                  <text x="100" y="105" textAnchor="middle" fill="#0c0c0e" fontSize="76" fontFamily="Arial Black, Impact, sans-serif" fontWeight="900" letterSpacing="-2">EPIC</text>
                  <text x="100" y="165" textAnchor="middle" fill="#0c0c0e" fontSize="36" fontFamily="Arial Black, sans-serif" fontWeight="800" letterSpacing="1">GAMES</text>
                  <polygon points="65,190 135,190 100,210" fill="#0c0c0e" />
                </svg>
              </a>

              <div className="w-[1px] h-4 bg-white/10 mx-0.5" />

              {/* Close Button */}
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-white/[0.04] hover:bg-white/[0.12] border border-white/[0.06] text-zinc-400 hover:text-white transition-all flex-shrink-0"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Dialog Body */}
          <div className="p-6 overflow-y-auto flex-1 space-y-6 scrollbar-thin overscroll-contain">
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* LEFT COLUMN: Media Showcase */}
              <div className="lg:col-span-7 space-y-3">
                {/* 16:9 Cinema Frame */}
                <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden bg-black/60 border border-white/[0.08] shadow-2xl group flex items-center justify-center">
                  
                  {/* Ambient Backdrop Glow */}
                  <div 
                    className="absolute inset-0 bg-cover bg-center blur-3xl opacity-30 scale-125 transition-all duration-700 pointer-events-none"
                    style={{ backgroundImage: `url(${activeMediaUrl})` }}
                  />

                  {/* Gradient Vignette */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

                  {/* Active Media Image */}
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={activeMediaUrl}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      src={activeMediaUrl}
                      alt={game.name}
                      className={`relative z-10 max-h-full transition-all duration-300 ${
                        isCoverView
                          ? 'h-full w-auto object-contain rounded-xl py-2 drop-shadow-2xl'
                          : 'w-full h-full object-cover'
                      }`}
                    />
                  </AnimatePresence>

                  {/* Media Counter Badge */}
                  {mediaGallery.length > 1 && (
                    <div className="absolute top-3 left-3 z-20 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-[10px] font-semibold text-zinc-300 border border-white/10">
                      {isCoverView ? 'Cover Art' : `Screenshot ${activeMediaIndex} / ${mediaGallery.length - 1}`}
                    </div>
                  )}

                  {/* Carousel Controls */}
                  {mediaGallery.length > 1 && (
                    <>
                      <button
                        onClick={handlePrevMedia}
                        aria-label="Previous image"
                        className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/60 hover:bg-white hover:text-black text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center border border-white/10 hover:scale-105 shadow-lg"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>

                      <button
                        onClick={handleNextMedia}
                        aria-label="Next image"
                        className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/60 hover:bg-white hover:text-black text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center border border-white/10 hover:scale-105 shadow-lg"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </>
                  )}

                  {/* Fullscreen Trigger */}
                  <button
                    onClick={() => setIsLightboxOpen(true)}
                    title="Fullscreen view"
                    className="absolute top-3 right-3 z-20 w-8 h-8 rounded-xl bg-black/60 hover:bg-white hover:text-black text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center border border-white/10 shadow-lg"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Thumbnails Strip - Horizontal Scroll with Auto-Scroll */}
                {mediaGallery.length > 1 && (
                  <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
                    {mediaGallery.map((url, idx) => (
                      <button
                        key={idx}
                        ref={(el) => { thumbnailRefs.current[idx] = el; }}
                        onClick={() => setActiveMediaIndex(idx)}
                        className={`relative flex-shrink-0 w-24 sm:w-28 aspect-[16/9] rounded-xl overflow-hidden border transition-all duration-200 ${
                          activeMediaIndex === idx
                            ? 'border-white ring-1 ring-white/60 opacity-100 scale-[1.02] shadow-md z-10'
                            : 'border-white/[0.08] opacity-50 hover:opacity-90 hover:border-white/30'
                        }`}
                      >
                        <img src={url} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                        {idx === 0 && (
                          <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/80 text-[8px] font-bold text-zinc-300 rounded">
                            Cover
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {/* Genres Under Screenshots */}
                {game.genres && game.genres.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                      Genres
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {game.genres.map(genre => (
                        <span 
                          key={genre.id}
                          className="text-[11px] font-medium text-zinc-300 bg-white/[0.03] border border-white/[0.08] px-2.5 py-1 rounded-lg"
                        >
                          {genre.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* RIGHT COLUMN: Details & Vault Controls */}
              <div className="lg:col-span-5 flex flex-col justify-between space-y-5">
                
                <div className="space-y-4">
                  {/* Rating Score */}
                  <div className="flex flex-wrap items-center gap-2">
                    {game.rating && (
                      <span className="flex items-center gap-1.5 text-xs font-bold text-white bg-white/[0.06] border border-white/10 px-3 py-1 rounded-full shadow-sm">
                        <Star className="w-3.5 h-3.5 text-white fill-white" />
                        {Math.round(game.rating)}% Score
                      </span>
                    )}
                  </div>

                  {/* Summary / Overview */}
                  {game.summary && (
                    <div className="space-y-1">
                      <p className="text-xs text-zinc-300 leading-relaxed line-clamp-4">
                        {game.summary}
                      </p>
                    </div>
                  )}

                  {/* Platforms */}
                  {game.platforms && game.platforms.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                        Platforms
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {game.platforms.slice(0, 5).map((platform) => (
                          <span
                            key={platform.id}
                            className="px-2.5 py-0.5 bg-white/[0.03] border border-white/[0.06] text-zinc-300 text-[11px] font-medium rounded-lg"
                          >
                            {platform.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Vault Area */}
                <div className="pt-4 border-t border-white/[0.06] space-y-3.5">
                  
                  {/* Vault Actions */}
                  {!user ? (
                    <div className="p-3.5 bg-white/[0.02] border border-white/[0.06] rounded-2xl flex items-center justify-between gap-3 shadow-inner">
                      <span className="text-xs text-zinc-400">Sign in to save games to your personal vault</span>
                      <button
                        onClick={onOpenAuth}
                        className="flex items-center gap-1.5 px-4 py-2 bg-white text-black text-xs font-bold rounded-xl hover:bg-zinc-200 transition-all flex-shrink-0 shadow-sm"
                      >
                        <LogIn className="w-3.5 h-3.5" />
                        Sign In
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Status Selector */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                          Vault Status
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 p-1 bg-black/50 border border-white/[0.06] rounded-xl shadow-inner">
                          {statusOptions.map((opt) => (
                            <button
                              key={opt.value}
                              onClick={() => setStatus(opt.value)}
                              className={`py-1.5 px-2 text-[11px] font-semibold rounded-lg transition-all text-center ${
                                status === opt.value
                                  ? 'bg-white text-black font-bold shadow-sm scale-[1.02]'
                                  : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Personal Notes */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                          <Edit3 className="w-3 h-3 text-zinc-400" />
                          Personal Notes
                        </label>
                        <textarea
                          rows={2}
                          value={userNotes}
                          onChange={(e) => setUserNotes(e.target.value)}
                          placeholder="Your review, backlog thoughts..."
                          className="w-full bg-white/[0.02] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-zinc-200 placeholder-zinc-600 focus:border-white/30 focus:outline-none transition-colors resize-none"
                        />
                      </div>

                      {/* Save & Remove Bar */}
                      <div className="flex items-center justify-between pt-1">
                        <button
                          onClick={handleSaveVault}
                          disabled={isSaving}
                          className="flex items-center gap-2 px-5 py-2 bg-white hover:bg-zinc-200 disabled:opacity-50 text-black text-xs font-bold rounded-xl transition-all shadow-md active:scale-95"
                        >
                          {isSaving ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
                            </>
                          ) : (
                            <>
                              <Bookmark className="w-3.5 h-3.5" /> {vaultItem ? 'Update Vault' : 'Add to Vault'}
                            </>
                          )}
                        </button>

                        {vaultItem && (
                          <button
                            onClick={handleRemove}
                            disabled={isRemoving}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-red-400 hover:text-red-300 text-xs font-medium transition-colors disabled:opacity-50"
                          >
                            {isRemoving ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
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

            {/* FRANCHISE STORYLINE TIMELINE (Subway / Milestone Track) */}
            {loadingTimeline ? (
              <div className="pt-1 flex items-center justify-center gap-2 py-3 text-xs text-zinc-500">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-400" />
                <span>Loading storyline...</span>
              </div>
            ) : timelineGames.length > 1 && (
              <div className="pt-1 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <History className="w-3.5 h-3.5 text-zinc-400" />
                    <h3 className="text-[11px] font-bold uppercase tracking-wider text-zinc-300">
                      Storyline Order
                    </h3>
                    <span className="text-[11px] text-zinc-500 font-medium">
                      ({timelineGames.length} games)
                    </span>
                  </div>

                  {/* Timeline Left / Right Scroll Buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleScrollTimeline('left')}
                      className="w-6 h-6 rounded-lg bg-white/[0.04] hover:bg-white/[0.12] border border-white/[0.08] hover:border-white/20 text-zinc-400 hover:text-white flex items-center justify-center transition-all"
                      title="Scroll Left"
                      aria-label="Scroll timeline left"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleScrollTimeline('right')}
                      className="w-6 h-6 rounded-lg bg-white/[0.04] hover:bg-white/[0.12] border border-white/[0.08] hover:border-white/20 text-zinc-400 hover:text-white flex items-center justify-center transition-all"
                      title="Scroll Right"
                      aria-label="Scroll timeline right"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Subway Connected Milestone Line */}
                <div 
                  ref={timelineContainerRef}
                  className="overflow-x-auto no-scrollbar scroll-smooth py-0.5"
                >
                  <div className="flex items-center gap-1.5 min-w-max">
                    {timelineGames.map((item, idx) => {
                      const isCurrent = isMatchingCurrentGame(item, game);
                      const itemCover = getIgdbImageUrl(item.cover?.url, item.cover?.image_id, 't_1080p');
                      const itemYear = item.first_release_date 
                        ? new Date(item.first_release_date * 1000).getFullYear() 
                        : 'TBA';

                      return (
                        <React.Fragment key={item.id}>
                          {/* Milestone Station Pill */}
                          <button
                            key={item.id}
                            ref={(el) => { timelineStationRefs.current[idx] = el; }}
                            onClick={() => onSelectGame?.(item)}
                            className={`group relative flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl border transition-all duration-200 text-left ${
                              isCurrent
                                ? 'bg-white/[0.08] border-white ring-1 ring-white/60 shadow-md'
                                : 'bg-white/[0.02] border-white/[0.08] hover:border-white/30 hover:bg-white/[0.05]'
                            }`}
                          >
                            {/* Sequence Number Node */}
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 transition-transform group-hover:scale-105 ${
                              isCurrent
                                ? 'bg-white text-black shadow-sm'
                                : 'bg-white/10 text-zinc-300 group-hover:bg-white/20 group-hover:text-white'
                            }`}>
                              {idx + 1}
                            </div>

                            {/* Mini Thumbnail */}
                            <div className="w-7 h-9 rounded-md overflow-hidden bg-black/40 flex-shrink-0 shadow-sm">
                              <img
                                src={itemCover}
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            </div>

                            {/* Game Info */}
                            <div className="min-w-0 pr-1">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-bold text-zinc-400">
                                  {itemYear}
                                </span>
                                {isCurrent && (
                                  <span className="text-[8px] font-extrabold bg-white text-black px-1.5 py-0.2 rounded">
                                    Current
                                  </span>
                                )}
                              </div>
                              <h4 className="text-xs font-semibold text-zinc-200 truncate max-w-[140px] group-hover:text-white transition-colors">
                                {item.name}
                              </h4>
                            </div>
                          </button>

                          {/* Connector Track between stations */}
                          {idx < timelineGames.length - 1 && (
                            <div className="flex items-center justify-center px-0.5 flex-shrink-0">
                              <div className="w-4 h-[2px] bg-white/15 rounded-full" />
                            </div>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

          </div>

        </motion.div>
      </div>

      {/* Fullscreen High-Res Lightbox Modal */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 backdrop-blur-lg">
          <button
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            aria-label="Close fullscreen view"
          >
            <X className="w-5 h-5" />
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
