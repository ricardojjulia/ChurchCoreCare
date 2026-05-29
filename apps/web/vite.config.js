import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  publicDir: false,
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    outDir: path.resolve(__dirname, 'public'),
    emptyOutDir: false,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        manualChunks(id) {
          // Use normalized separators to handle pnpm's content-addressable store paths.
          const normalizedId = id.replace(/\\/g, '/');
          if (
            normalizedId.includes('/react/') ||
            normalizedId.includes('/react-dom/') ||
            normalizedId.includes('/react-is/') ||
            normalizedId.includes('/scheduler/')
          ) {
            return 'vendor-react';
          }
          // @mantine/charts bundles recharts which uses CJS factory modules
          // that Rolldown's var-hoisting interop cannot handle in a manual chunk.
          // Leave it un-chunked so Rolldown code-splits it with the lazy
          // components (AnalyticsDashboard, ClinicalChartPage) that import it.
          if (normalizedId.includes('/@mantine/charts/')) {
            return undefined;
          }
          // Split each other Mantine package into its own chunk.
          const mantineMatch = normalizedId.match(/\/@mantine\/([^/]+)\//);
          if (mantineMatch) {
            return `vendor-mantine-${mantineMatch[1]}`;
          }
        },
      },
    },
  },
  server: {
    middlewareMode: false,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
