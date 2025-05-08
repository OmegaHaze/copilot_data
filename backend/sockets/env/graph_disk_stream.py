# filepath: /home/vaio/vaio-board/backend/sockets/env/graph_disk_stream.py
import asyncio
import psutil
import time
from datetime import datetime
from backend.services.env.metrics_history import log_metric

def register_disk_stream(sio):
    @sio.on("connect", namespace="/graph-disk")
    async def disk_connect(sid, environ):
        async def send_disk_metrics():
            try:
                while True:
                    timestamp = time.time()
                    
                    # Get disk usage for root partition
                    disk = psutil.disk_usage('/')
                    
                    metrics = {
                        "disk_total": disk.total,
                        "disk_used": disk.used,
                        "disk_free": disk.free,
                        "disk_percent": disk.percent
                    }
                    
                    # Add I/O stats if available
                    try:
                        io_counters = psutil.disk_io_counters()
                        if io_counters:
                            metrics["read_count"] = getattr(io_counters, "read_count", 0)
                            metrics["write_count"] = getattr(io_counters, "write_count", 0) 
                            metrics["read_bytes"] = getattr(io_counters, "read_bytes", 0)
                            metrics["write_bytes"] = getattr(io_counters, "write_bytes", 0)
                    except Exception as e:
                        # If disk IO stats fail, continue with just disk usage metrics
                        print(f"Warning: Could not get disk IO stats: {e}")
                    
                    # Create payload with timestamp
                    payload = {
                        "timestamp": float(timestamp),
                        "datetime": datetime.fromtimestamp(timestamp).isoformat(),
                        **metrics
                    }
                    
                    # Log metrics for history
                    log_metric("disk", metrics)
                    
                    # Emit to connected client
                    await sio.emit("metrics_update", payload, to=sid, namespace="/graph-disk")
                    
                    # Disk metrics don't need to update as frequently as CPU/memory
                    await asyncio.sleep(5)
            except asyncio.CancelledError:
                pass  # Socket disconnected, stop the task
            except Exception as e:
                print(f"Error in disk metrics stream: {str(e)}")

        sio.start_background_task(send_disk_metrics)
