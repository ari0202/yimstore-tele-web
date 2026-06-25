#!/bin/bash
export APP_ENV=test
npx start-server-and-test "npx next start -p 3001" http://localhost:3001 "CYPRESS_baseUrl=http://localhost:3001 npx cypress run --spec cypress/e2e/admin-management-exhaustive.cy.ts"
