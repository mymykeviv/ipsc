import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-utils.tsx'],
    globals: true,
    css: true,
    testTimeout: 10000, // Increase timeout to 10 seconds
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
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test-utils.tsx',
        '**/*.d.ts',
        '**/*.config.*',
        '**/coverage/**',
        'tests/e2e/**/*'
      ]
    }
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  }
})
