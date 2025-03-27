import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    chunkSizeWarningLimit: 1000, // Adjust chunk size warning limit as needed
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Define manual chunks to optimize chunking
          if (id.includes('node_modules')) {
            return 'vendor'; // Example: Separate vendor modules into a separate chunk
          }
        },
      },
    },
  },
  server: {
    proxy: {
      '/api': 'http://localhost:1488',
    },
  },
  optimizeDeps: {
    entries: ['src/components/Panes/user/*.jsx'],
  },
  resolve: {
    alias: {
      '@userPanes': path.resolve(__dirname, 'src/components/Panes/user'),
    },
  },
});
