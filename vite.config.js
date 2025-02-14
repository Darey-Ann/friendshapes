import { defineConfig } from 'vite';

export default defineConfig({
  base: '/friendshapes/', // Ensure correct paths on GitHub Pages
  build: {
    rollupOptions: {
      external: [], // Force everything to bundle
    },
    commonjsOptions: {
      transformMixedEsModules: true, // Fixes issues with Three.js
    },
  },
  optimizeDeps: {
    include: ['three'], // Force Vite to pre-bundle Three.js
  },
});
