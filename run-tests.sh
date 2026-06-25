#!/bin/bash
export NODE_ENV=development
npx ts-node scripts/inject-dummy-data.ts --confirm-destroy-real-data

unset NODE_ENV
export APP_ENV=test
npx next build
npx start-server-and-test "npx next start -p 3001" http://localhost:3001 "CYPRESS_baseUrl=http://localhost:3001 npx cypress run --spec cypress/e2e/prd-v1-exhaustive-verification.cy.ts"
