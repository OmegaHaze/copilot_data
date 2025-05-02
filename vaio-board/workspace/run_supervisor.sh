#!/bin/bash
SUPERVISOR_CONF="/home/vaio/vaio-board/workspace/supervisor/supervisord.conf"
LOGDIR="/home/vaio/vaio-board/workspace/logs"

mkdir -p "$LOGDIR"

echo "[vaio] starting supervisord manually..."
supervisord -c "$SUPERVISOR_CONF"
