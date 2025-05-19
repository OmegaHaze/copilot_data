import asyncio
import psutil
import time
from datetime import datetime
from backend.services.env.metrics_history import log_metric

def register_cpu_stream(sio):
    @sio.on("connect", namespace="/graph-cpu")
    async def cpu_connect(sid, environ):  # pylint: disable=unused-function
        """Socket.IO event handler for CPU stream connections"""
        async def send_cpu_metrics():
            try:
                while True:
                    timestamp = time.time()
                    
                    # CPU usage (%)
                    cpu_usage = psutil.cpu_percent(interval=None)

                    # Memory usage (%)
                    memory = psutil.virtual_memory()
                    memory_usage = memory.percent

                    # CPU temperature (°C)
                    # This system doesn't have temperature sensors psutil can access
                    temperature = None
                    
                    # Get CPU model information
                    cpu_model = ""
                    try:
                        # Try to get CPU model from /proc/cpuinfo (Linux)
                        with open("/proc/cpuinfo", "r") as f:
                            for line in f:
                                if "model name" in line:
                                    cpu_model = line.split(":", 1)[1].strip()
                                    break
                    except Exception:
                        pass

                    # Metrics to log for history
                    metrics = {
                        "cpu_usage": cpu_usage,
                        "memory_usage": memory_usage,
                        "cpu_model": cpu_model,
                        "cpu_cores": psutil.cpu_count(logical=True) or 0,
                        "total_memory_gb": round(memory.total / (1024**3), 1)
                    }
                    
                    # Only add temperature if we actually have a reading
                    if temperature is not None:
                        metrics["cpu_temperature"] = temperature
                    
                    # Log metrics to history service
                    log_metric("cpu", metrics)
                    
                    payload = {
                        "timestamp": float(timestamp),
                        "datetime": datetime.fromtimestamp(timestamp).isoformat(),
                        **metrics
                    }
                    
                    await sio.emit("metrics_update", payload, to=sid, namespace="/graph-cpu")  # << corrected
                    
                    await asyncio.sleep(1)
            except asyncio.CancelledError:
                pass

        sio.start_background_task(send_cpu_metrics)
