import { defineConfig } from 'vite';

export default defineConfig({
  base: '/friendshapes/', // Ensures correct paths for GitHub Pages
  build: {
    rollupOptions: {
      external: ['three'] // Ensures everything (including three.js) is bundled properly
    }
  }
});
