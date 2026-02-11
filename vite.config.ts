
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/golden-buddy/', // GitHub Pages base path for repository
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  }
});
