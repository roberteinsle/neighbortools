import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
    strictPort: true,
    hmr: {
      clientPort: 443,
    },
    proxy: {
      '/api': {
        target: process.env.VITE_PROXY_TARGET || 'http://neighbortools-gateway:3000',
        changeOrigin: true,
      },
    },
    allowedHosts: ['localhost', '.app.github.dev'],
  },
});
