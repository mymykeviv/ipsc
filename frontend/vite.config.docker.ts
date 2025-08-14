import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://backend:8000',
        changeOrigin: true,
        rewrite: (path) => path,
      },
    },
    // Force clear cache and use TypeScript files
    force: true,
    hmr: {
      overlay: true,
    },
  },
  // Ensure TypeScript files are always used
  esbuild: {
    loader: 'tsx',
  },
  // Clear cache on startup
  clearScreen: false,
  test: {
    environment: 'jsdom',
    setupFiles: './vitest.setup.ts',
    globals: true,
  },
})
