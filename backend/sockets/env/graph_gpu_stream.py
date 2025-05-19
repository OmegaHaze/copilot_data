"""NVIDIA GPU metrics socket stream handler using NVML for direct hardware access"""
import asyncio
import time
import logging
from datetime import datetime
from pynvml import (
    nvmlInit, nvmlDeviceGetHandleByIndex, nvmlDeviceGetUtilizationRates,
    nvmlDeviceGetMemoryInfo, nvmlDeviceGetTemperature, nvmlShutdown,
    NVML_TEMPERATURE_GPU, NVMLError
)
from backend.services.env.metrics_history import log_metric

# Setup logger
logger = logging.getLogger(__name__)

def get_gpu_metrics():
    """Get GPU metrics using NVML for direct hardware access"""
    timestamp = time.time()
    
    # Default metrics structure
    metrics = {
        "gpu_usage": 0,
        "gpu_mem": 0, 
        "gpu_temp": 0,
        "gpu_mem_total": 1,  # Default to 1 to avoid division by zero
        "timestamp": timestamp
    }
    
    try:
        # Initialize NVML
        nvmlInit()
        
        try:
            # Get the first GPU (index 0)
            handle = nvmlDeviceGetHandleByIndex(0)
            
            # Get utilization rates (includes GPU usage percentage)
            utilization = nvmlDeviceGetUtilizationRates(handle)
            metrics["gpu_usage"] = utilization.gpu
            
            # Get memory information
            memory = nvmlDeviceGetMemoryInfo(handle)
            metrics["gpu_mem_total"] = memory.total // (1024 * 1024)  # Convert to MB
            metrics["gpu_mem"] = round((memory.used / memory.total) * 100.0, 1) if memory.total > 0 else 0
            
            # Get GPU temperature
            metrics["gpu_temp"] = nvmlDeviceGetTemperature(handle, NVML_TEMPERATURE_GPU)
        finally:
            # Ensure we always shutdown NVML even if there's an error
            nvmlShutdown()
            
    except NVMLError as e:
        logger.warning(f"NVML error when getting GPU metrics: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected error getting GPU metrics: {str(e)}")
    
    return metrics

def register_gpu_stream(sio):
    """Register GPU metrics socket.io handlers"""
    logger.info("Registering GPU metrics stream...")
    
    @sio.on("connect", namespace="/graph-gpu")
    async def gpu_connect(sid, environ):  # pylint: disable=unused-variable # type: ignore # noqa
        """Socket.IO connect handler called by the framework when clients connect"""
        logger.info(f"Client connected to GPU metrics stream: {sid}")
        
        # Immediately send a basic metrics payload to confirm connection
        await sio.emit("metrics_update", {
            "timestamp": time.time(),
            "datetime": datetime.fromtimestamp(time.time()).isoformat(),
            "gpu_utilization": 0,
            "mem_utilization": 0,
            "temperature": 0,
            "gpu_type": "GPU Initializing",
            "gpu_mem_total": 1
        }, room=sid, namespace="/graph-gpu")
        
        async def send_gpu_metrics():
            log_count = 0
            
            # Check if GPU is available
            gpu_available = False
            try:
                nvmlInit()
                try:
                    nvmlDeviceGetHandleByIndex(0)
                    gpu_available = True
                    logger.info("NVIDIA GPU detected and available for metrics")
                except NVMLError as nvml_err:
                    gpu_available = False
                    logger.warning(f"No NVIDIA GPU available: {str(nvml_err)}")
                finally:
                    nvmlShutdown()
            except Exception as e:
                logger.error(f"Error initializing NVML: {str(e)}")
                gpu_available = False
            
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
                            "gpu_type": "NVIDIA GPU" if gpu_available else "No NVIDIA GPU detected",
                            "gpu_mem_total": metrics["gpu_mem_total"]
                        }
                        
                        # Send update in a simplified way - use room= instead of to= for better compatibility
                        await sio.emit("metrics_update", payload, room=sid, namespace="/graph-gpu")
                        
                        # Wait before next update
                        await asyncio.sleep(1)
                    except Exception as inner_e:
                        logger.error(f"Error processing GPU metrics: {str(inner_e)}")
                        # Send a simple error payload rather than using a different event
                        try:
                            await sio.emit("metrics_update", {
                                "timestamp": time.time(),
                                "datetime": datetime.fromtimestamp(time.time()).isoformat(),
                                "gpu_utilization": 0,
                                "mem_utilization": 0,
                                "temperature": 0,
                                "gpu_type": "GPU Error",
                                "gpu_mem_total": 0,
                                "error": str(inner_e)
                            }, room=sid, namespace="/graph-gpu")
                        except:
                            pass
                        
                        await asyncio.sleep(5)  # Back off on errors
                        
            except asyncio.CancelledError:
                logger.info(f"GPU metrics stream cancelled for client {sid}")
            except Exception as e:
                logger.error(f"Error in NVIDIA metrics stream for client {sid}: {str(e)}")
                # Send a connection error payload
                try:
                    await sio.emit("metrics_update", {
                        "timestamp": time.time(),
                        "datetime": datetime.fromtimestamp(time.time()).isoformat(),
                        "gpu_utilization": 0,
                        "mem_utilization": 0,
                        "temperature": 0,
                        "gpu_type": "Socket Error",
                        "gpu_mem_total": 0,
                        "error": "Socket stream error"
                    }, room=sid, namespace="/graph-gpu")
                except:
                    pass

        # Start the background task
        sio.start_background_task(send_gpu_metrics)
    
    @sio.on("disconnect", namespace="/graph-gpu")
    async def nvidia_disconnect(sid):  # pylint: disable=unused-variable # type: ignore # noqa
        """Socket.IO disconnect handler called by the framework when clients disconnect"""
        logger.info(f"Client disconnected from GPU metrics stream: {sid}")
    
    # Server-side errors are handled with try/except in the handlers above
    # Client-side errors should be caught in the frontend
    
    logger.info("GPU metrics stream registered successfully")
    return True
