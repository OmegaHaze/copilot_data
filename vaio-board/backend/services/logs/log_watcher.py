import os
import asyncio
from pathlib import Path
from typing import Dict, List

LOG_DIR = Path("/home/vaio/vaio-board/workspace/logs")
WATCHED_FILES: Dict[str, float] = {}  # filename -> last read offset

LOG_KEYWORDS = [
    "error", "fail", "fatal", "warn", "critical", "exception",
    "could not", "unable to", "panic"
]

EXCLUDED_LOGS = {
    "socket-diagnostics.log", "postgres.actual.err.log"
}

async def read_log_tail(filename: str, lines: int = 50) -> List[str]:
    filepath = LOG_DIR / filename
    if not filepath.exists() or filename in EXCLUDED_LOGS:
        return []

    result = []
    with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
        for line in reversed(f.readlines()):
            if any(keyword in line.lower() for keyword in LOG_KEYWORDS):
                result.insert(0, line.strip())
                if len(result) >= lines:
                    break
    return result

async def stream_log_lines(filename: str):
    filepath = LOG_DIR / filename
    if not filepath.exists():
        return

    with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
        f.seek(0, os.SEEK_END)
        while True:
            line = f.readline()
            if not line:
                await asyncio.sleep(0.5)
                continue
            yield line.strip()