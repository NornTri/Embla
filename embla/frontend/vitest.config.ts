import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import reactSwc from '@vitejs/plugin-react-swc'

export default defineConfig({
  plugins: [
    // Use SWC for faster transformations in tests
    reactSwc(),
    // Fallback to Babel-based plugin if SWC has issues
    react(),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/__tests__/setup.ts'],
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/__tests__/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/*.test.*',
        '**/*.spec.*',
      ],
    },
    // Match test files
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    // Mock environment variables for testing
    env: {
      VITE_API_URL: 'http://test-api.local',
      NODE_ENV: 'test',
    },
  },
  resolve: {
    // Match Vite's resolve configuration
    alias: {
      '@': '/src',
    },
  },
})