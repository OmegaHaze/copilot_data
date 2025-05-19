import time
import threading
from collections import deque
from typing import Dict, List, Any

# Store 5 minutes of 1s snapshots = 300 entries
HISTORY_LENGTH = 300  # Reduced from 600 to 300 for 5-minute history
RESET_INTERVAL = 300  # Reset history every 5 minutes

cpu_history = deque(maxlen=HISTORY_LENGTH)
memory_history = deque(maxlen=HISTORY_LENGTH)
disk_history = deque(maxlen=HISTORY_LENGTH)
network_history = deque(maxlen=HISTORY_LENGTH)
gpu_history = deque(maxlen=HISTORY_LENGTH)

history_map: Dict[str, deque] = {
    "cpu": cpu_history,
    "memory": memory_history,
    "disk": disk_history,
    "network": network_history,
    "gpu": gpu_history
}


def log_metric(metric_type: str, data: Dict[str, Any]):
    """Log a metric to the history deque with safeguards against overflows"""
    if metric_type not in history_map:
        return
        
    try:
        # Get current timestamp
        current_time = time.time()
        
        # Create entry with consistent format for all metrics
        if metric_type == "gpu":
            # For GPU metrics, maintain same format as other metrics for consistency
            entry = {
                "timestamp": current_time,
                "data": {  # Use nested data like other metrics
                    "gpu_utilization": float(data.get("gpu_utilization", data.get("gpu_usage", 0))),
                    "mem_utilization": float(data.get("mem_utilization", data.get("gpu_mem", 0))),
                    "temperature": float(data.get("temperature", data.get("gpu_temp", 0))),
                    "gpu_type": data.get("gpu_type", "NVIDIA GPU"),
                    "gpu_mem_total": float(data.get("gpu_mem_total", 1))
                }
            }
        else:
            # For other metrics, use the standard format
            entry = {
                "timestamp": current_time,
                "data": data
            }
        
        # Use try/finally with a lock to safely append
        history_map[metric_type].append(entry)
    except Exception as e:
        # Log the error
        print(f"Error logging metric {metric_type}: {e}")
        pass


def get_metric_history(metric_type: str) -> List[Dict[str, Any]]:
    if metric_type not in history_map:
        return []

    return list(history_map[metric_type])
    
    
def reset_all_history():
    """Clear all metric history data"""
    for history_queue in history_map.values():
        history_queue.clear()
    print("[Metrics] History reset completed")
    

# Initialize periodic history reset
def start_periodic_reset():
    """Start a background thread that resets history every RESET_INTERVAL seconds"""
    def reset_timer():
        while True:
            time.sleep(RESET_INTERVAL)
            reset_all_history()
    
    reset_thread = threading.Thread(target=reset_timer, daemon=True)
    reset_thread.start()
    print(f"[Metrics] Periodic history reset initialized (every {RESET_INTERVAL} seconds)")
