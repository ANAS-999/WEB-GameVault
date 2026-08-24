import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { VaultItem, GameStatus, IGDBGame } from '../types';
import { useAuth } from './AuthContext';
import { subscribeToUserVault, saveVaultItem, deleteVaultItem } from '../services/vaultService';
import { getIgdbImageUrl } from '../services/igdbApi';

interface VaultContextType {
  vaultItems: VaultItem[];
  vaultMap: Map<number, VaultItem>;
  loading: boolean;
  addOrUpdateGame: (
    game: IGDBGame, 
    status: GameStatus, 
    userRating?: number, 
    userNotes?: string
  ) => Promise<void>;
  updateVaultItemDetails: (
    gameId: number,
    updates: Partial<Pick<VaultItem, 'status' | 'userRating' | 'userNotes'>>
  ) => Promise<void>;
  removeFromVault: (gameId: number) => Promise<void>;
  getGameVaultItem: (gameId: number) => VaultItem | undefined;
}

const VaultContext = createContext<VaultContextType | undefined>(undefined);

export const VaultProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [vaultItems, setVaultItems] = useState<VaultItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Subscribe to real-time Firestore updates when logged in
  useEffect(() => {
    if (!user) {
      setVaultItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToUserVault(
      user.uid,
      (items) => {
        setVaultItems(items);
        setLoading(false);
      },
      (_err) => {
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Fast lookup map by IGDB game ID
  const vaultMap = useMemo(() => {
    const map = new Map<number, VaultItem>();
    vaultItems.forEach((item) => map.set(item.gameId, item));
    return map;
  }, [vaultItems]);

  const getGameVaultItem = (gameId: number) => vaultMap.get(gameId);

  const addOrUpdateGame = async (
    game: IGDBGame, 
    status: GameStatus, 
    userRating: number = 0, 
    userNotes: string = ''
  ) => {
    if (!user) {
      throw new Error('Please sign in to add games to your personal Vault.');
    }

    const existing = vaultMap.get(game.id);
    const releaseYear = game.first_release_date 
      ? new Date(game.first_release_date * 1000).getFullYear() 
      : undefined;

    const coverUrl = getIgdbImageUrl(game.cover?.url, game.cover?.image_id, 't_cover_big');

    await saveVaultItem(user.uid, {
      gameId: game.id,
      title: game.name,
      coverUrl,
      ratingScore: game.rating ? Math.round(game.rating) : 0,
      releaseYear,
      genres: game.genres?.map(g => g.name) || [],
      platforms: game.platforms?.map(p => p.name) || [],
      status,
      userRating: userRating || existing?.userRating || 0,
      userNotes: userNotes !== undefined ? userNotes : (existing?.userNotes || ''),
    });
  };

  const updateVaultItemDetails = async (
    gameId: number,
    updates: Partial<Pick<VaultItem, 'status' | 'userRating' | 'userNotes'>>
  ) => {
    if (!user) throw new Error('User not logged in');
    const existing = vaultMap.get(gameId);
    if (!existing) return;

    await saveVaultItem(user.uid, {
      ...existing,
      ...updates,
      gameId,
    });
  };

  const removeFromVault = async (gameId: number) => {
    if (!user) throw new Error('User not logged in');
    await deleteVaultItem(user.uid, gameId);
  };

  return (
    <VaultContext.Provider value={{
      vaultItems,
      vaultMap,
      loading,
      addOrUpdateGame,
      updateVaultItemDetails,
      removeFromVault,
      getGameVaultItem,
    }}>
      {children}
    </VaultContext.Provider>
  );
};

export const useVault = () => {
  const context = useContext(VaultContext);
  if (!context) throw new Error('useVault must be used within a VaultProvider');
  return context;
};
