#!/bin/bash

echo "[+] Killing old dashboard server (if running)..."
pkill -f "server.js"

echo "[+] Building frontend..."
cd /workspace/dashboard/client && npm run build

echo "[+] Restarting dashboard server..."
cd /workspace/dashboard
nohup node server.js > server.log 2>&1 &

# Wait for port 1488 to open
echo -n "[~] Waiting for dashboard to come online"
until nc -z localhost 1488; do
  echo -n "."
  sleep 1
done
echo -e "\n[✓] Dashboard is live on http://localhost:1488"


# Optional: tail logs
echo "[📟] Latest server output:"
tail -n 20 /workspace/dashboard/server.log


