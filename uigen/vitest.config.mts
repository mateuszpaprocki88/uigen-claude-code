import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    projects: [
      {
        plugins: [tsconfigPaths(), react()],
        test: {
          name: 'jsdom',
          environment: 'jsdom',
          exclude: ['src/lib/__tests__/auth.test.ts', 'node_modules/**'],
        },
      },
      {
        plugins: [tsconfigPaths()],
        test: {
          name: 'node',
          environment: 'node',
          include: ['src/lib/__tests__/auth.test.ts'],
        },
      },
    ],
  },
})
