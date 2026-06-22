import { defineConfig } from "cypress";
import crypto from "crypto";

export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:3000",
    setupNodeEvents(on, config) {
      // implement node event listeners here
      on('task', {
        generatePakasirSignature({ payload, secret }) {
          const bodyString = JSON.stringify(payload);
          return crypto.createHmac('sha256', secret).update(bodyString).digest('hex');
        }
      });
    },
    supportFile: false,
    specPattern: "cypress/e2e/**/*.cy.{js,jsx,ts,tsx}",
  },
  env: {
    PAKASIR_TEST_SECRET: process.env.PAKASIR_API_KEY || "dummy_secret_for_local_tests"
  }
});
