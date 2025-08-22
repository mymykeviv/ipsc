import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-utils.tsx'],
    globals: true,
    css: true,
    testTimeout: 30000, // Increase timeout to 30 seconds
    hookTimeout: 30000, // Increase hook timeout
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: [
      'node_modules/',
      'src/test-utils.tsx',
      '**/*.d.ts',
      '**/*.config.*',
      '**/coverage/**',
      'tests/e2e/**/*', // Exclude E2E tests
      '**/*.e2e.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}' // Exclude E2E test files
    ],
    // Optimize memory usage
    pool: 'forks', // Use forks instead of threads
    poolOptions: {
      forks: {
        singleFork: true, // Run tests sequentially to reduce memory pressure
        maxForks: 1
      }
    },
    // Disable coverage temporarily to reduce memory usage
    coverage: {
      enabled: false
    }
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  }
})
