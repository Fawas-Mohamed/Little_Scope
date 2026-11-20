import { defineConfig } from '@playwright/test';

const dev = process.env.QA_MODE === 'dev';
const port = dev ? 4174 : 4173;

export default defineConfig({
  testDir: './qa',
  testMatch: '**/*.spec.js',
  timeout: 600_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    headless: true,
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
    { name: 'firefox', use: { browserName: 'firefox' } },
    { name: 'webkit', use: { browserName: 'webkit' } },
  ],
  webServer: {
    command: dev ? `npm run dev -- --host 127.0.0.1 --port ${port} --strictPort` : `npm run preview -- --host 127.0.0.1 --port ${port} --strictPort`,
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
