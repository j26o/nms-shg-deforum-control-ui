import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { createA1111DeforumProxyPlugin } from './server/a1111DeforumProxy.js';
import { createHuggingFaceDeforumProxyPlugin } from './server/hfDeforumProxy.js';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const a1111BaseUrl = env.A1111_BASE_URL || 'http://127.0.0.1:7860';

  return {
    plugins: [react(), createA1111DeforumProxyPlugin(env), createHuggingFaceDeforumProxyPlugin(env)],
    server: {
      host: '127.0.0.1',
      port: 5173,
      proxy: {
        '/a1111': {
          target: a1111BaseUrl,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/a1111/, ''),
        },
      },
    },
    test: {
      environment: 'jsdom',
      include: ['src/**/*.test.{js,jsx,ts,tsx}', 'server/**/*.test.{js,jsx,ts,tsx}'],
    },
  };
});
