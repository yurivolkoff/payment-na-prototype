import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  // For GitHub Pages — set via env BASE
  base: process.env.BASE ?? (command === 'build' ? '/payment-na-prototype/' : '/'),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5173,
    host: '127.0.0.1',
  },
}));
