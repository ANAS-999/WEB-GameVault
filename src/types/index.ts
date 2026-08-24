export type GameStatus = 'want_to_play' | 'playing' | 'completed' | 'dropped';

export interface IGDBGenre {
  id: number;
  name: string;
}

export interface IGDBPlatform {
  id: number;
  name: string;
}

export interface IGDBWebsite {
  id: number;
  category?: number;
  url: string;
}

export interface IGDBGame {
  id: number;
  name: string;
  summary?: string;
  rating?: number;
  total_rating?: number;
  total_rating_count?: number;
  first_release_date?: number;
  cover?: {
    id: number;
    url?: string;
    image_id?: string;
  };
  genres?: IGDBGenre[];
  platforms?: IGDBPlatform[];
  screenshots?: {
    id: number;
    url?: string;
    image_id?: string;
  }[];
  websites?: IGDBWebsite[];
}

export interface VaultItem {
  id: string;
  gameId: number;
  title: string;
  coverUrl: string;
  ratingScore?: number;
  releaseYear?: number;
  genres: string[];
  platforms: string[];
  status: GameStatus;
  userNotes?: string;
  addedAt: string;
  updatedAt: string;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}
