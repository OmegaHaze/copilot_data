# filepath: /home/vaio/vaio-board/backend/sockets/env/graph_memory_stream.py
import asyncio
import psutil
import time
from datetime import datetime
from backend.services.env.metrics_history import log_metric

def register_memory_stream(sio):
    @sio.on("connect", namespace="/graph-memory")
    async def memory_connect(sid, environ):
        async def send_memory_metrics():
            try:
                while True:
                    timestamp = time.time()
                    
                    # Memory data
                    mem = psutil.virtual_memory()
                    swap = psutil.swap_memory()
                    
                    metrics = {
                        "memory_total": mem.total,
                        "memory_used": mem.used,
                        "memory_free": mem.available,
                        "memory_percent": mem.percent,
                        "swap_total": swap.total, 
                        "swap_used": swap.used,
                        "swap_free": swap.free,
                        "swap_percent": swap.percent
                    }
                    
                    # Create payload with timestamp
                    payload = {
                        "timestamp": float(timestamp),
                        "datetime": datetime.fromtimestamp(timestamp).isoformat(),
                        **metrics
                    }
                    
                    # Log metrics for history
                    log_metric("memory", metrics)
                    
                    # Emit to connected client
                    await sio.emit("metrics_update", payload, to=sid, namespace="/graph-memory")
                    
                    await asyncio.sleep(1)
            except asyncio.CancelledError:
                pass  # Socket disconnected, stop the task
            except Exception as e:
                print(f"Error in memory metrics stream: {str(e)}")

        sio.start_background_task(send_memory_metrics)
