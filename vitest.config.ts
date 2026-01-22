import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts', 'services/**/*.test.ts'],
    exclude: ['node_modules', 'dist', 'services/frontend/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/index.ts',
      ],
    },
    testTimeout: 30000,
    hookTimeout: 30000,
  },
  resolve: {
    alias: {
      '@shared-types': path.resolve(__dirname, './packages/shared-types/src'),
      '@shared-utils': path.resolve(__dirname, './packages/shared-utils/src'),
    },
  },
});
