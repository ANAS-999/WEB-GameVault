import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const clientId = env.VITE_GAMES_CLIENT_ID || '';
  const authorization = env.VITE_GAMES_AUTHORIZATION || '';

  const handleProxyReq = (proxyReq: any) => {
    if (proxyReq.headersSent) return;

    if (clientId) {
      proxyReq.setHeader('Client-ID', clientId);
    }
    if (authorization) {
      const tokenHeader = authorization.startsWith('Bearer ') ? authorization : `Bearer ${authorization}`;
      proxyReq.setHeader('Authorization', tokenHeader);
    }
  };

  return {
    plugins: [react()],
    server: {
      port: 3000,
      cors: true,
      proxy: {
        '/api/igdb': {
          target: 'https://api.igdb.com/v4',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api\/igdb/, ''),
          configure: (proxy) => {
            proxy.on('proxyReq', handleProxyReq);
          }
        },
        '/api/games': {
          target: 'https://api.igdb.com/v4',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api\/games/, ''),
          configure: (proxy) => {
            proxy.on('proxyReq', handleProxyReq);
          }
        }
      }
    }
  };
});
