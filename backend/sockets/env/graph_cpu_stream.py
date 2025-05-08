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
                    temperature = 0.0
                    try:
                        temps = psutil.sensors_temperatures()
                        if temps and 'coretemp' in temps['coretemp']:
                            temp_values = [float(t.current) for t in temps['coretemp'] if hasattr(t, 'current')]
                            if temp_values:
                                temperature = sum(temp_values) / len(temp_values)
                    except Exception:
                        pass  # Temperature is optional
                    
                    # Metrics to log for history
                    metrics = {
                        "cpu_usage": cpu_usage,
                        "memory_usage": memory_usage,
                        "cpu_temperature": temperature
                    }
                    
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
