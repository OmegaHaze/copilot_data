#!/bin/bash
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

SUPERVISOR_RUN="./workspace/run_supervisor.sh"
SUPERVISOR_STOP="./workspace/stop_supervisor.sh"

echo -e "${CYAN}=== Starting Vaio Board Dev (Python + Supervisor + Frontend Live) ===${NC}"

# Activate virtual environment
if [ ! -f ".venv/bin/activate" ]; then
    echo -e "${RED}Virtual environment not found. Please create it first with: python3 -m venv .venv${NC}"
    exit 1
fi

echo -e "${BLUE}Activating virtual environment...${NC}"
source .venv/bin/activate

# Cleanup on Ctrl+C
cleanup() {
  echo -e "\n${YELLOW}Shutting down services...${NC}"
  kill "$BACKEND_PID" 2>/dev/null
  kill "$FRONTEND_PID" 2>/dev/null

  echo -e "${BLUE}Stopping Supervisor...${NC}"
  $SUPERVISOR_STOP

  echo -e "${BLUE}Stopping Postgres...${NC}"
  /usr/lib/postgresql/14/bin/pg_ctl \
    -D /var/lib/postgresql/14/main \
    -o "-k /home/vaio/vaio-board/workspace/postgres/socket" \
    stop 2>/dev/null

  exit 0
}
trap cleanup SIGINT

# Clear Python cache
echo -e "${BLUE}Clearing Python cache...${NC}"
find ./backend -name "__pycache__" -type d -exec rm -rf {} + 
find ./backend -name "*.pyc" -delete

# Flush Vite cache (optional, good for weird frontend bugs)
echo -e "${GREEN}Flushing Vite cache...${NC}"
rm -rf dashboard/client/node_modules/.vite

# Kill rogue Postgres
echo -e "${YELLOW}Checking for rogue Postgres on port 5432...${NC}"
PG_PID=$(lsof -ti tcp:5432)
if [[ -n "$PG_PID" ]]; then
  echo -e "${RED}Port 5432 in use by PID $PG_PID. Killing...${NC}"
  kill -9 "$PG_PID"
  sleep 1
else
  echo -e "${GREEN}Port 5432 is clear.${NC}"
fi

# Start Postgres manually
echo -e "${BLUE}Starting Postgres with socket override...${NC}"
mkdir -p /home/vaio/vaio-board/workspace/postgres/socket
/usr/lib/postgresql/14/bin/pg_ctl \
  -D /var/lib/postgresql/14/main \
  -o "-c listen_addresses='' -k /home/vaio/vaio-board/workspace/postgres/socket" \
  start

# Wait for Postgres socket
echo -e "${YELLOW}Waiting for Postgres socket...${NC}"
for i in {1..10}; do
  if [[ -S /home/vaio/vaio-board/workspace/postgres/socket/.s.PGSQL.5432 ]]; then
    echo -e "${GREEN}Postgres socket is ready.${NC}"
    break
  fi
  sleep 1
done

# Restart supervisor
echo -e "${BLUE}Stopping Supervisor (if running)...${NC}"
$SUPERVISOR_STOP

echo -e "${BLUE}Starting Supervisor...${NC}"
$SUPERVISOR_RUN

# Kill rogue backend (port 1888)
echo -e "${YELLOW}Checking for process on port 1888...${NC}"
BK_PID=$(lsof -ti tcp:1888)
if [[ -n "$BK_PID" ]]; then
  echo -e "${RED}Port 1888 in use by PID $BK_PID. Killing...${NC}"
  kill -9 "$BK_PID"
  sleep 1
else
  echo -e "${GREEN}Port 1888 is clear.${NC}"
fi

# Launch backend with standard logging
echo -e "${GREEN}Starting Python Backend on port 1888...${NC}"
LOG_DIR="/home/vaio/vaio-board/workspace/logs"
mkdir -p "$LOG_DIR"
uvicorn backend.main:app --host 0.0.0.0 --port 1888 --reload --log-level info &
BACKEND_PID=$!
echo -e "${GREEN}Backend PID:${NC} $BACKEND_PID"

# Launch Vite frontend dev server
echo -e "${GREEN}Starting Vite Frontend Dev Server...${NC}"
cd dashboard/client || exit 1
npm run dev &
FRONTEND_PID=$!
cd ../..

echo -e "${MAGENTA}=== Dev environment is LIVE ===${NC}"
echo -e "${YELLOW}Frontend at:${NC} http://localhost:5173"
echo -e "${YELLOW}Backend API at:${NC} http://localhost:1888"
echo -e "${GREEN}Ctrl+C to shut everything down cleanly${NC}"

# Wait for both processes
wait "$BACKEND_PID" "$FRONTEND_PID"
