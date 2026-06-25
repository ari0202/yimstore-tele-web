#!/bin/bash
PORT=36005
npm run dev -- -p $PORT > next_start.log 2>&1 &
SERVER_PID=$!
echo "Waiting for Next.js DEV to start on port $PORT..."
sleep 5
while ! curl -s http://localhost:$PORT/admin/login > /dev/null; do
  if ! kill -0 $SERVER_PID 2>/dev/null; then
    echo "Next.js crashed. Logs:"
    cat next_start.log
    exit 1
  fi
  sleep 1
done

echo "Next.js DEV is up. Running Admin Inventory tests..."
NODE_ENV=development npx ts-node scripts/inject-dummy-data.ts --confirm-destroy-real-data
CYPRESS_baseUrl=http://localhost:$PORT IS_TEST_REDIS=true APP_ENV=test E2E_BYPASS_SECRET=dummy_bypass npx cypress run --spec "cypress/e2e/admin-inventory-exhaustive.cy.ts"
TEST1_CODE=$?

kill -9 $(lsof -t -i:$PORT) 2>/dev/null
pkill -P $SERVER_PID 2>/dev/null
kill -9 $SERVER_PID 2>/dev/null

if [ $TEST1_CODE -eq 0 ]; then
  exit 0
else
  exit 1
fi
