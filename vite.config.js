import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { createA1111DeforumProxyPlugin } from './server/a1111DeforumProxy.js';
import { createHuggingFaceDeforumProxyPlugin } from './server/hfDeforumProxy.js';

function createRenderToolsGuardPlugin() {
  return {
    name: 'render-tools-guard',
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const requestPath = decodeURIComponent((request.url ?? '').split('?')[0]).replaceAll('\\', '/');
        if (requestPath.includes('/render-tools/')) {
          response.statusCode = 404;
          response.setHeader('content-type', 'text/plain; charset=utf-8');
          response.end('The local Automatic1111 runtime is not served by the Vite frontend.');
          return;
        }

        next();
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const a1111BaseUrl = env.A1111_BASE_URL || 'http://127.0.0.1:7860';

  return {
    plugins: [react(), createRenderToolsGuardPlugin(), createA1111DeforumProxyPlugin(env), createHuggingFaceDeforumProxyPlugin(env)],
    optimizeDeps: {
      entries: ['index.html'],
      exclude: ['bufferutil', 'utf-8-validate'],
    },
    server: {
      host: '127.0.0.1',
      port: 5173,
      fs: {
        deny: ['render-tools', 'render-tools/**'],
      },
      watch: {
        ignored: ['**/render-tools/**', '**/outputs/**'],
      },
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
