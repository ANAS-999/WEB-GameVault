interface VercelRequest {
  method?: string;
  query: Record<string, string | string[]>;
  body: any;
  url?: string;
  headers: Record<string, string | string[] | undefined>;
}

interface VercelResponse {
  setHeader(name: string, value: string): this;
  status(code: number): this;
  send(body: any): void;
  json(body: any): void;
  end(): void;
}

const CLIENT_ID = process.env.VITE_GAMES_CLIENT_ID || process.env.GAMES_CLIENT_ID || '';
const AUTHORIZATION = process.env.VITE_GAMES_AUTHORIZATION || process.env.GAMES_AUTHORIZATION || '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Client-ID, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Determine endpoint from query or path
  let endpoint = (req.query.endpoint as string) || '';
  if (!endpoint && req.url) {
    const cleanUrl = req.url.split('?')[0];
    endpoint = cleanUrl.replace(/^\/api\/(games|igdb)\/?/, '');
  }

  if (!endpoint) {
    endpoint = 'games';
  }

  // Extract raw body
  let body = req.body;
  if (typeof body === 'object' && body !== null) {
    // If parsed as JSON/object by bodyParser, but was a raw string query
    body = Object.keys(body).length === 0 ? '' : JSON.stringify(body);
  }

  const targetUrl = `https://api.igdb.com/v4/${endpoint.replace(/^\/+/, '')}`;

  const tokenHeader = AUTHORIZATION.startsWith('Bearer ') ? AUTHORIZATION : `Bearer ${AUTHORIZATION}`;

  try {
    const igdbResponse = await fetch(targetUrl, {
      method: req.method === 'POST' ? 'POST' : 'GET',
      headers: {
        'Client-ID': CLIENT_ID,
        'Authorization': tokenHeader,
        'Content-Type': 'text/plain',
        'Accept': 'application/json',
      },
      body: req.method === 'POST' ? (typeof body === 'string' ? body : '') : undefined,
    });

    const data = await igdbResponse.text();

    // Forward status and headers
    res.setHeader('Content-Type', 'application/json');
    return res.status(igdbResponse.status).send(data);
  } catch (error: any) {
    console.error('Error forwarding to IGDB:', error);
    return res.status(500).json({
      error: 'Failed to communicate with IGDB API',
      details: error.message || String(error),
    });
  }
}
