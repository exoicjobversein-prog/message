import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Dev server proxies API + webhook calls to the standalone SMS service (default :4000).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:4000', changeOrigin: true },
      '/webhooks': { target: 'http://localhost:4000', changeOrigin: true },
    },
  },
});
