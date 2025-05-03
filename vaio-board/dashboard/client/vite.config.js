import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  root: path.resolve(__dirname),
  plugins: [react()],
  base: './',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@components': path.resolve(__dirname, 'src/components'),
      'Pane': path.resolve(__dirname, 'src/components/Panes/Utility/Pane')
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('scheduler')) return 'react-vendor';
            if (id.includes('react-grid-layout') || id.includes('react-resizable')) return 'grid-vendor';
            if (id.includes('socket.io') || id.includes('engine.io') || id.includes('xterm')) return 'ui-vendor';
            if (id.includes('syntax-highlighter') || id.includes('highlight.js') || id.includes('refractor')) return 'highlight-vendor';
            if (id.includes('recharts')) return 'recharts-vendor';
            return 'vendor';
          }
        }
      }
    }
  },
  server: {
    proxy: {
      '/api': 'http://localhost:1888'
    },
    force: true,
    hmr: {
      overlay: true
    },
  },
  optimizeDeps: {
    force: true
  },
});
