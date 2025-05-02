#!/bin/bash
SUPERVISOR_CONF="/home/vaio/vaio-board/workspace/supervisor/supervisord.conf"

echo "[vaio] Stopping supervisord..."
supervisorctl -c "$SUPERVISOR_CONF" shutdown
