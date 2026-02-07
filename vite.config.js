import { defineConfig } from 'vite';

export default defineConfig({
  base: '/ART-APP/',
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true
  },
  server: {
    port: 3000,
    host: true,
    open: true
  }
});
