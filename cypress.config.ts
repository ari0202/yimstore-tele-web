import { defineConfig } from "cypress";
import crypto from "crypto";
import { execSync } from "child_process";
import * as dotenv from "dotenv";

dotenv.config();

export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:3000",
    setupNodeEvents(on, config) {
      // ISOLATION GUARD: Abort if production Redis URL is used
      const redisUrl = process.env.UPSTASH_REDIS_REST_URL || '';
      // Require explicit IS_TEST_REDIS flag or URL to strictly not be the known production one
      // Since we don't know the exact prod URL, we enforce an explicit environment flag for tests.
      if (redisUrl && process.env.IS_TEST_REDIS !== 'true') {
        console.error('🚨 FATAL: Production Redis URL detected in test environment.');
        console.error('You MUST use an isolated testing Upstash Redis database and set IS_TEST_REDIS=true for Cypress to prevent quota exhaustion and IP bans.');
        process.exit(1);
      }
      // implement node event listeners here
      on('task', {
        generatePakasirSignature({ payload, secret }) {
          const bodyString = JSON.stringify(payload);
          return crypto.createHmac('sha256', secret).update(bodyString).digest('hex');
        },
        resetDatabase() {
          try {
            execSync('NODE_ENV=development npx ts-node scripts/inject-dummy-data.ts --confirm-destroy-real-data', { stdio: 'inherit' });
            return null;
          } catch (e) {
            console.error(e);
            throw e;
          }
        }
      });
    },
    supportFile: false,
    specPattern: "cypress/e2e/**/*.cy.{js,jsx,ts,tsx}",
    video: true,
  },
  env: {
    PAKASIR_TEST_SECRET: process.env.PAKASIR_HMAC_SECRET || "dummy_secret_for_local_tests"
  }
});
