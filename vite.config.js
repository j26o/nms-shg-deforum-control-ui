import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { createHuggingFaceDeforumProxyPlugin } from './server/hfDeforumProxy.js';

export default defineConfig({
  plugins: [react(), createHuggingFaceDeforumProxyPlugin()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    proxy: {
      '/a1111': {
        target: 'http://127.0.0.1:7860',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/a1111/, ''),
      },
    },
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{js,jsx,ts,tsx}', 'server/**/*.test.{js,jsx,ts,tsx}'],
  },
});
