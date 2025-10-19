import { defineConfig } from '@playwright/test';
import path from 'node:path';

export default defineConfig({
  testDir: './specs',
  fullyParallel: false,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'pnpm --filter @app/web dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    cwd: path.resolve(__dirname, '..'),
  },
});
