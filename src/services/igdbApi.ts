import { IGDBGame } from '../types';

const API_URL = import.meta.env.VITE_GAMES_API_URL || '/api/games/';
const CLIENT_ID = import.meta.env.VITE_GAMES_CLIENT_ID || 'lrh6dcf697l3kymiqcmtxxdlwnrs3d';
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

  try {
    const response = await fetch(primaryUrl, {
      method: 'POST',
      headers: getHeaders(),
      body: apicalypseQuery,
    });

    if (response.ok) {
      return await response.json();
    }
  } catch (primaryErr) {
    // fallback
  }

  const fallbackResponse = await fetch(secondaryUrl, {
    method: 'POST',
    headers: getHeaders(),
    body: apicalypseQuery,
  });

  if (!fallbackResponse.ok) {
    const errorText = await fallbackResponse.text();
    throw new Error(`IGDB API Error (${fallbackResponse.status}): ${errorText}`);
  }

  return await fallbackResponse.json();
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

  // If offset > 0, use wildcard match to maintain consistent pagination order
  if (offset > 0) {
    const wildcardBody = `fields name, summary, rating, total_rating, total_rating_count, first_release_date, cover.url, cover.image_id, genres.name, platforms.name, screenshots.url, screenshots.image_id, websites.category, websites.url;
where (name ~ *"${safeQuery}"* | search "${safeQuery}") & cover != null;
sort total_rating_count desc;
offset ${offset};
limit ${limit};`;

    const results = await queryIgdb('games', wildcardBody);
    return Array.isArray(results) ? results : [];
  }

  // Initial search page
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
