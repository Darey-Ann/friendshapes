import { defineConfig } from 'vite';

export default defineConfig({
  base: '/friendshapes/', // Ensure correct paths on GitHub Pages
  build: {
    rollupOptions: {
      external: [], // Ensure nothing is treated as external
      output: {
        manualChunks: undefined, // Ensures everything is bundled together
      },
    },
  },
  optimizeDeps: {
    include: ['three', 'lil-gui'], // Ensure Vite pre-bundles these dependencies
  }
});
