import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['tests/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/scratch/**'],
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './'),
      'server-only': path.resolve(import.meta.dirname, './tests/mocks/server-only.ts'),
    },
  },
});
