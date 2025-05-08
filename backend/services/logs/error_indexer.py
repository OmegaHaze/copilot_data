from pathlib import Path
from datetime import datetime
from sqlmodel import Session
from backend.db.session import engine
from backend.db.models import ServiceError

# Use the consistent workspace logs directory
LOG_DIR = Path("/home/vaio/vaio-board/workspace/logs")

KEYWORDS = ["error", "fail", "fatal", "warn", "critical", "exception", "could not", "unable to", "panic"]
EXCLUDED = {"supervisord.log", "socket-diagnostics.log", "postgres.actual.err.log"}

def extract_errors_from_log(file_path: Path):
    errors = []
    try:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            for i, line in enumerate(f, 1):
                if any(k in line.lower() for k in KEYWORDS):
                    errors.append({
                        "line": i,
                        "message": line.strip(),
                        "timestamp": datetime.now()
                    })
    except Exception:
        pass
    return errors

def index_errors():
    print("[🧠] Indexing service logs...")
    log_files = [f for f in LOG_DIR.glob("*.log") if f.name not in EXCLUDED]

    with Session(engine) as session:
        for file in log_files:
            service_name = file.stem.replace(".err", "").lower()
            entries = extract_errors_from_log(file)

            for err in entries:
                error = ServiceError(
                    service=service_name,
                    message=err["message"],
                    timestamp=err["timestamp"],
                    log_file=file.name,
                    line_number=err["line"]
                )
                session.add(error)
        session.commit()
