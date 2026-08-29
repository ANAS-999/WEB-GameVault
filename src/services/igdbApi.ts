import { IGDBGame } from '../types';

const API_URL = import.meta.env.VITE_GAMES_API_URL || '/api/games/';
const CLIENT_ID = import.meta.env.VITE_GAMES_CLIENT_ID || '';
const AUTHORIZATION = import.meta.env.VITE_GAMES_AUTHORIZATION || '';

const getHeaders = () => {
  const headers: Record<string, string> = {
    'Content-Type': 'text/plain',
  };

  if (CLIENT_ID) {
    headers['Client-ID'] = CLIENT_ID;
  }
  if (AUTHORIZATION) {
    headers['Authorization'] = AUTHORIZATION.startsWith('Bearer ') ? AUTHORIZATION : `Bearer ${AUTHORIZATION}`;
  }

  return headers;
};

/**
 * Format IGDB image URL to ultra high resolution 1080p
 */
export const getIgdbImageUrl = (
  rawUrl?: string, 
  imageId?: string, 
  size: 't_1080p' | 't_720p' | 't_cover_big' | 't_screenshot_big' = 't_1080p'
): string => {
  if (imageId) {
    return `https://images.igdb.com/igdb/image/upload/${size}/${imageId}.jpg`;
  }
  if (!rawUrl) {
    return 'https://via.placeholder.com/600x800/18181b/a1a1aa?text=No+Cover';
  }
  let url = rawUrl;
  if (url.startsWith('//')) {
    url = `https:${url}`;
  }
  return url.replace(/t_thumb|t_micro|t_cover_big|t_720p/g, size);
};

/**
 * Send POST request directly to IGDB endpoint via proxy
 */
async function queryIgdb(endpoint: string, apicalypseQuery: string): Promise<any> {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  
  const primaryUrl = `/api/games/${cleanEndpoint}`;
  const secondaryUrl = `/api/igdb/${cleanEndpoint}`;

  let lastStatus = 0;
  let lastError = '';

  try {
    const response = await fetch(primaryUrl, {
      method: 'POST',
      headers: getHeaders(),
      body: apicalypseQuery,
    });

    if (response.ok) {
      return await response.json();
    }
    lastStatus = response.status;
  } catch (primaryErr: any) {
    lastError = primaryErr?.message || '';
  }

  try {
    const fallbackResponse = await fetch(secondaryUrl, {
      method: 'POST',
      headers: getHeaders(),
      body: apicalypseQuery,
    });

    if (fallbackResponse.ok) {
      return await fallbackResponse.json();
    }
    lastStatus = fallbackResponse.status;
    const rawError = await fallbackResponse.text();
    if (rawError && !rawError.includes('<!DOCTYPE') && !rawError.includes('NOT_FOUND')) {
      try {
        const json = JSON.parse(rawError);
        lastError = json.message || json.error || (Array.isArray(json) && json[0]?.title) || rawError;
      } catch {
        lastError = rawError;
      }
    }
  } catch (fallbackErr: any) {
    lastError = fallbackErr?.message || '';
  }

  // Format clean user-facing error message
  if (lastStatus === 404) {
    throw new Error('Game database service is temporarily unavailable. If you just deployed, please ensure Vercel API routes are enabled.');
  }
  if (lastStatus === 401 || lastStatus === 403) {
    throw new Error('IGDB authorization expired or invalid. Please check your API credentials.');
  }
  if (lastStatus === 429) {
    throw new Error('Too many requests to the game database. Please wait a few seconds and retry.');
  }

  throw new Error(lastError || 'Unable to connect to the game database. Please check your connection and try again.');
}

/**
 * Extract series base name for franchise timeline search
 */
function getSeriesBaseName(gameName: string): string {
  if (gameName.toLowerCase().includes('witcher')) return 'The Witcher';
  if (gameName.toLowerCase().includes('grand theft auto') || gameName.toLowerCase().includes('gta')) return 'Grand Theft Auto';

  const knownFranchises = [
    'God of War', 'The Witcher', 'Baldur\'s Gate', 'Grand Theft Auto',
    'Red Dead', 'Portal', 'Cyberpunk', 'Elden Ring', 'Hollow Knight',
    'Zelda', 'Mario', 'Spider-Man', 'Call of Duty', 'Assassin\'s Creed',
    'Final Fantasy', 'Resident Evil', 'Halo', 'Mass Effect', 'Dark Souls',
    'Fallout', 'Elder Scrolls', 'Monster Hunter', 'Street Fighter', 'Tekken',
    'Uncharted', 'Tomb Raider', 'Far Cry', 'Batman', 'Bioshock', 'Persona'
  ];

  for (const franchise of knownFranchises) {
    if (gameName.toLowerCase().includes(franchise.toLowerCase())) {
      return franchise;
    }
  }

  let base = gameName.split(/[:\-]/)[0];
  base = base.replace(/\b(I|II|III|IV|V|VI|VII|VIII|IX|X|\d+)\b/gi, '').trim();
  return base.length >= 3 ? base : gameName;
}

// Spinoff and non-main keywords
const SPINOFF_KEYWORDS = [
  'adventure game', 'battle arena', 'card game', 'board game', 'monster slayer',
  'reigns', 'rogue mage', 'gwent', 'thronebreaker', 'crimson trail', 'versus',
  'roach race', 'pinball', 'tactics', 'puzzle', 'chess', 'trivia',
  'datapad', 'infiltrator', 'mobile', 'lockdown', 'underworld',
  'blackgate', 'valhalla', 'blood and wine', 'hearts of stone', 'songs of the past',
  'heists', 'story mode', 'friends of jimbo', 'side effects', 'the price of neutrality',
  'rise of the white wolf', 'a call from the wilds', 'betrayal', 'rivals', 'fight for fortune',
  'fortune hunter', 'vr', 'arcade', 'companion', 'kart',
  'tales from', 'new tales', 'shadows', 'shadow', 'galaxy', 'contract', 'scavenger hunt',
  'lost and damned', 'ballad of gay tony'
];

function isMainlineGame(name: string): boolean {
  const lower = name.toLowerCase();
  for (const kw of SPINOFF_KEYWORDS) {
    const regex = new RegExp(`\\b${kw.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
    if (regex.test(lower) || lower.includes(`: ${kw}`) || lower.includes(` - ${kw}`)) {
      return false;
    }
  }
  return true;
}

/**
 * Fetch franchise timeline games ordered chronologically by release date (strictly standalone main games)
 */
export async function fetchFranchiseTimeline(gameName: string, gameId?: number): Promise<IGDBGame[]> {
  let candidates: IGDBGame[] = [];

  // 1. If gameId is available, try fetching the franchise collection from IGDB
  if (gameId) {
    try {
      const seedRes = await queryIgdb('games', `
        fields name, collections.id, collections.name;
        where id = ${gameId};
      `);
      const collId = seedRes?.[0]?.collections?.[0]?.id;

      if (collId) {
        const collGames = await queryIgdb('games', `
          fields name, summary, rating, total_rating, total_rating_count, first_release_date, 
                 cover.url, cover.image_id, genres.name, platforms.name, screenshots.url, 
                 screenshots.image_id, websites.category, websites.url, parent_game, version_parent, category, game_type;
          where collections = (${collId}) & cover != null;
          sort first_release_date asc;
          limit 50;
        `);
        if (Array.isArray(collGames) && collGames.length > 0) {
          candidates = collGames;
        }
      }
    } catch (err) {
      console.warn('Failed to query IGDB collection for timeline, falling back to name match:', err);
    }
  }

  // 2. Fallback to name search if no collection was found
  if (candidates.length === 0 && gameName) {
    const baseName = getSeriesBaseName(gameName);
    const safeName = baseName.replace(/"/g, '\\"').trim();

    try {
      const searchRes = await queryIgdb('games', `
        fields name, summary, rating, total_rating, total_rating_count, first_release_date, 
               cover.url, cover.image_id, genres.name, platforms.name, screenshots.url, 
               screenshots.image_id, websites.category, websites.url, parent_game, version_parent, category, game_type;
        where name ~ *"${safeName}"* & cover != null;
        sort first_release_date asc;
        limit 50;
      `);
      if (Array.isArray(searchRes)) {
        candidates = searchRes;
      }
    } catch (err) {
      console.error('Failed to query IGDB games by name for timeline:', err);
    }
  }

  const nowSec = Math.floor(Date.now() / 1000) + 86400 * 180; // allow games releasing in next ~6 months

  // Filter candidates strictly for main standalone games
  const filtered = candidates.filter((g) => {
    // Exclude DLCs, expansions, remakes with parent_game, editions with version_parent
    if (g.parent_game || g.version_parent) return false;

    // Check game_type / category: 0 = main_game
    const type = g.game_type ?? g.category;
    if (type !== undefined && type !== 0) return false;

    // Must have cover and release date
    if (!g.cover || !g.first_release_date) return false;

    // Skip far-future placeholder dates with no community ratings
    if (g.first_release_date > nowSec && (g.total_rating_count || 0) < 5) return false;

    // Exclude spin-offs / non-mainline keywords (unless it's the exact game the user opened)
    if (g.id !== gameId && !isMainlineGame(g.name)) return false;

    return true;
  });

  // Deduplicate entries that are identical or re-releases without parent_game tagged
  const result: IGDBGame[] = [];
  for (const g of filtered) {
    const gYear = g.first_release_date ? new Date(g.first_release_date * 1000).getFullYear() : 0;
    const cleanTitle = g.name.toLowerCase().replace(/[^a-z0-9]/g, '');

    // Check if we already have a game with the exact same name in the same release window (<3 years)
    const duplicate = result.find(r => {
      const rYear = r.first_release_date ? new Date(r.first_release_date * 1000).getFullYear() : 0;
      const rClean = r.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      return rClean === cleanTitle && Math.abs(rYear - gYear) < 3;
    });

    if (!duplicate) {
      result.push(g);
    }
  }

  return result.sort((a, b) => (a.first_release_date || 0) - (b.first_release_date || 0));
}

/**
 * Fetch most popular games sorted strictly by total_rating_count desc with offset pagination
 */
export async function fetchPopularGames(limit: number = 24, offset: number = 0): Promise<IGDBGame[]> {
  const body = `fields name, summary, rating, total_rating, total_rating_count, first_release_date, cover.url, cover.image_id, genres.name, platforms.name, screenshots.url, screenshots.image_id, websites.category, websites.url;
where cover != null;
sort total_rating_count desc;
offset ${offset};
limit ${limit};`;

  return await queryIgdb('games', body);
}

/**
 * Search games by title with fallback wildcard matching and offset pagination
 */
export async function searchGames(query: string, limit: number = 24, offset: number = 0): Promise<IGDBGame[]> {
  const safeQuery = query.replace(/"/g, '\\"').trim();
  if (!safeQuery) return fetchPopularGames(limit, offset);

  if (offset > 0) {
    const wildcardBody = `fields name, summary, rating, total_rating, total_rating_count, first_release_date, cover.url, cover.image_id, genres.name, platforms.name, screenshots.url, screenshots.image_id, websites.category, websites.url;
where (name ~ *"${safeQuery}"* | search "${safeQuery}") & cover != null;
sort total_rating_count desc;
offset ${offset};
limit ${limit};`;

    const results = await queryIgdb('games', wildcardBody);
    return Array.isArray(results) ? results : [];
  }

  const searchBody = `search "${safeQuery}";
fields name, summary, rating, total_rating, total_rating_count, first_release_date, cover.url, cover.image_id, genres.name, platforms.name, screenshots.url, screenshots.image_id, websites.category, websites.url;
limit ${limit};`;

  try {
    const results = await queryIgdb('games', searchBody);
    if (Array.isArray(results) && results.length > 0) {
      return results.sort((a: any, b: any) => (b.total_rating_count || 0) - (a.total_rating_count || 0));
    }
  } catch (err) {
    // ignore
  }

  const wildcardBody = `fields name, summary, rating, total_rating, total_rating_count, first_release_date, cover.url, cover.image_id, genres.name, platforms.name, screenshots.url, screenshots.image_id, websites.category, websites.url;
where name ~ *"${safeQuery}"* & cover != null;
sort total_rating_count desc;
limit ${limit};`;

  const fallbackResults = await queryIgdb('games', wildcardBody);
  if (Array.isArray(fallbackResults)) {
    return fallbackResults.sort((a: any, b: any) => (b.total_rating_count || 0) - (a.total_rating_count || 0));
  }

  return fallbackResults || [];
}

/**
 * Fetch games filtered by genre sorted by total_rating_count desc with offset pagination
 */
export async function fetchGamesByGenre(genreId: number, limit: number = 24, offset: number = 0): Promise<IGDBGame[]> {
  if (genreId === 0) return fetchPopularGames(limit, offset);

  const body = `fields name, summary, rating, total_rating, total_rating_count, first_release_date, cover.url, cover.image_id, genres.name, platforms.name, screenshots.url, screenshots.image_id, websites.category, websites.url;
where genres = (${genreId}) & cover != null;
sort total_rating_count desc;
offset ${offset};
limit ${limit};`;

  return await queryIgdb('games', body);
}

/**
 * Fetch detailed game data by ID directly from IGDB API
 */
export async function fetchGameDetails(gameId: number): Promise<IGDBGame | null> {
  const body = `fields name, summary, storyline, rating, total_rating, total_rating_count, first_release_date, cover.url, cover.image_id, genres.name, platforms.name, screenshots.url, screenshots.image_id, websites.category, websites.url;
where id = ${gameId};`;

  const results = await queryIgdb('games', body);
  return Array.isArray(results) && results.length > 0 ? results[0] : null;
}
