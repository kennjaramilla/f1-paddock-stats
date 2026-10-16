import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: process.env.CYPRESS_BASE_URL ?? 'http://localhost:3105',
    viewportWidth: 1280,
    viewportHeight: 900,
    video: false,
    screenshotOnRunFailure: true,
    retries: { runMode: 1, openMode: 0 },
    setupNodeEvents(on) {
      on('task', {
        log(message: string) {
          console.log(message);
          return null;
        },
      });
    },
  },
});
