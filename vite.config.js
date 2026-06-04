import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const apiProxyTarget = process.env.VITE_API_PROXY?.trim();

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: apiProxyTarget
    ? {
        proxy: {
          '/api': {
            target: apiProxyTarget,
            changeOrigin: true,
            secure: true,
          },
        },
      }
    : undefined,
});
