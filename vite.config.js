import { defineConfig } from 'vite';

export default defineConfig({
  base: '/friendshapes/', // Ensure correct paths on GitHub Pages
  optimizeDeps: {
    include: ['three', 'lil-gui'],
  },
  build: {
    rollupOptions: {
      external: [], // Ensure everything is bundled
    },
    commonjsOptions: {
      transformMixedEsModules: true, // Fixes issues with some modules like Three.js
    },
  },
});
