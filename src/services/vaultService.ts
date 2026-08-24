import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { VaultItem, GameStatus } from '../types';

/**
 * Realtime listener for user's game vault in Firestore
 */
export function subscribeToUserVault(
  userId: string, 
  onUpdate: (items: VaultItem[]) => void,
  onError?: (err: Error) => void
) {
  if (!userId) {
    onUpdate([]);
    return () => {};
  }

  const userVaultRef = collection(db, 'users', userId, 'vault');
  const q = query(userVaultRef);

  return onSnapshot(
    q, 
    (snapshot) => {
      const items: VaultItem[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          gameId: data.gameId,
          title: data.title,
          coverUrl: data.coverUrl,
          ratingScore: data.ratingScore,
          releaseYear: data.releaseYear,
          genres: data.genres || [],
          platforms: data.platforms || [],
          status: data.status || 'want_to_play',
          userRating: data.userRating || 0,
          userNotes: data.userNotes || '',
          addedAt: data.addedAt?.toDate?.() ? data.addedAt.toDate().toISOString() : new Date().toISOString(),
          updatedAt: data.updatedAt?.toDate?.() ? data.updatedAt.toDate().toISOString() : new Date().toISOString(),
        } as VaultItem;
      });

      onUpdate(items);
    },
    (err) => {
      console.error('Firestore Vault sync error:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Save or update a game in the user's Firestore vault
 */
export async function saveVaultItem(userId: string, itemData: Partial<VaultItem> & { gameId: number; title: string }) {
  if (!userId) throw new Error('User must be logged in to save games.');

  const docId = String(itemData.gameId);
  const docRef = doc(db, 'users', userId, 'vault', docId);

  const payload = {
    ...itemData,
    gameId: itemData.gameId,
    title: itemData.title,
    coverUrl: itemData.coverUrl || '',
    ratingScore: itemData.ratingScore || 0,
    releaseYear: itemData.releaseYear || 0,
    genres: itemData.genres || [],
    platforms: itemData.platforms || [],
    status: itemData.status || 'want_to_play',
    userRating: itemData.userRating || 0,
    userNotes: itemData.userNotes || '',
    updatedAt: new Date().toISOString(),
  };

  await setDoc(docRef, payload, { merge: true });
}

/**
 * Delete a game from user's Firestore vault
 */
export async function deleteVaultItem(userId: string, gameId: number) {
  if (!userId) throw new Error('User must be logged in to delete games.');
  const docRef = doc(db, 'users', userId, 'vault', String(gameId));
  await deleteDoc(docRef);
}
