import path from 'path';
import { defineConfig, type ViteDevServer } from 'vite';
import react from '@vitejs/plugin-react';
import { registerApiRoutes } from './server/index';

export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  plugins: [
    react(),
    {
      name: 'api-server',
      configureServer(server: ViteDevServer) {
        registerApiRoutes(server);
      },
    },
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
});
