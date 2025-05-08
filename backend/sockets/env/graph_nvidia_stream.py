"""NVIDIA GPU metrics socket stream handler"""
import asyncio
import re
import subprocess
import time
from datetime import datetime
from backend.services.env.metrics_history import log_metric

def run_nvidia_smi(args=None):
    """Run nvidia-smi command with given arguments and return the output"""
    cmd = ["nvidia-smi"]
    if args:
        cmd.extend(args)
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=5)
        if result.returncode != 0:
            return None
        return result.stdout
    except (subprocess.TimeoutExpired, FileNotFoundError):
        return None

def get_gpu_metrics():
    """Get GPU metrics using nvidia-smi parsing"""
    timestamp = time.time()
    
    # Default metrics structure
    metrics = {
        "gpu_usage": 0,
        "gpu_mem": 0, 
        "gpu_temp": 0,
        "gpu_mem_total": 1,  # Default to 1 to avoid division by zero
        "timestamp": timestamp
    }
    
    # Get nvidia-smi output
    output = run_nvidia_smi()
    if not output:
        return metrics
    
    # Get memory usage
    memory_match = re.search(r"(\d+)MiB\s*/\s*(\d+)MiB", output)
    if memory_match:
        used = int(memory_match.group(1))
        total = int(memory_match.group(2))
        mem_percent = round((used / total) * 100, 1) if total > 0 else 0
        
        metrics["gpu_mem"] = float(mem_percent)
        metrics["gpu_mem_total"] = int(total)
    
    # Get utilization
    util_match = re.search(r"Gpu\s*:\s*(\d+)\s*%", output)
    if util_match:
        metrics["gpu_usage"] = int(util_match.group(1))
    
    # Get temperature
    temp_match = re.search(r"(\d+)C", output)
    if temp_match:
        metrics["gpu_temp"] = int(temp_match.group(1))
    
    return metrics

def register_nvidia_stream(sio):
    """Register NVIDIA GPU metrics socket.io handlers"""
    print("Registering NVIDIA GPU metrics stream...")
    
    @sio.on("connect", namespace="/graph-nvidia")
    async def nvidia_connect(sid, environ):
        print(f"Client connected to GPU metrics stream: {sid}")
        
        async def send_nvidia_metrics():
            emit_count = 0
            log_count = 0
            
            try:
                while True:
                    try:
                        # Get GPU metrics
                        metrics = get_gpu_metrics()
                        
                        # Log metrics to history service less frequently (every 5 seconds) for historical data retrieval
                        if log_count % 5 == 0:
                            log_metric("gpu", metrics)
                        log_count += 1
                        
                        # Add additional info to payload with consistent field naming (matching CPU)
                        payload = {
                            "timestamp": float(metrics["timestamp"]),
                            "datetime": datetime.fromtimestamp(metrics["timestamp"]).isoformat(),
                            "gpu_utilization": metrics["gpu_usage"],  # Rename to match CPU style
                            "mem_utilization": metrics["gpu_mem"],    # Consistent field naming
                            "temperature": metrics["gpu_temp"],       # Match CPU naming
                            "gpu_type": "NVIDIA GPU",                 # Add consistency with CPU
                            "gpu_mem_total": metrics["gpu_mem_total"]
                        }
                        
                        # Only emit updates every second to avoid overwhelming clients
                        if emit_count % 1 == 0:
                            await sio.emit("metrics_update", payload, to=sid, namespace="/graph-nvidia")
                        emit_count += 1
                        
                        # Wait before next update
                        await asyncio.sleep(1)
                    except Exception as inner_e:
                        print(f"Error processing GPU metrics: {str(inner_e)}")
                        await asyncio.sleep(5)  # Back off on errors
                        
            except asyncio.CancelledError:
                print(f"GPU metrics stream cancelled for client {sid}")
            except Exception as e:
                print(f"Error in NVIDIA metrics stream for client {sid}: {str(e)}")

        # Start the background task
        sio.start_background_task(send_nvidia_metrics)
    
    @sio.on("disconnect", namespace="/graph-nvidia")
    async def nvidia_disconnect(sid):
        print(f"Client disconnected from GPU metrics stream: {sid}")
        
    print("NVIDIA GPU metrics stream registered successfully")
    return True
