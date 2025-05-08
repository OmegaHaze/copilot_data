# filepath: /home/vaio/vaio-board/backend/sockets/env/graph_network_stream.py
import asyncio
import psutil
import time
from datetime import datetime
from backend.services.env.metrics_history import log_metric

def register_network_stream(sio):
    @sio.on("connect", namespace="/graph-network")
    async def network_connect(sid, environ):
        async def send_network_metrics():
            try:
                # Keep track of previous counters to calculate rates
                prev_counters = None
                prev_time = None
                
                while True:
                    current_time = time.time()
                    timestamp = current_time
                    
                    # Get network I/O counters
                    net_io = psutil.net_io_counters(pernic=False) or psutil._common.snetio(*([0] * len(psutil._common.snetio._fields)))
                    
                    # Safe extraction of bytes_sent and bytes_recv values
                    def get_network_bytes(counters, attribute):
                        if hasattr(counters, attribute):
                            # Handle namedtuple access
                            return getattr(counters, attribute)
                        elif isinstance(counters, dict) and attribute in counters:
                            # Handle dictionary access
                            return counters[attribute]
                        else:
                            # Default case
                            return 0
                    
                    bytes_sent_current = get_network_bytes(net_io, 'bytes_sent')
                    bytes_recv_current = get_network_bytes(net_io, 'bytes_recv')
                    
                    if prev_counters and prev_time:
                        # Calculate time difference
                        time_diff = current_time - prev_time
                        
                        # Get previous values safely
                        bytes_sent_prev = get_network_bytes(prev_counters, 'bytes_sent')
                        bytes_recv_prev = get_network_bytes(prev_counters, 'bytes_recv')
                        
                        # Calculate bytes per second
                        bytes_sent = (bytes_sent_current - bytes_sent_prev) / time_diff
                        bytes_recv = (bytes_recv_current - bytes_recv_prev) / time_diff
                        
                        # Convert to megabytes per second (MB/s) for user-friendly display
                        mb_sent = bytes_sent / (1024 * 1024)  # Convert to MB/s
                        mb_recv = bytes_recv / (1024 * 1024)  # Convert to MB/s
                        
                        metrics = {
                            "tx": mb_sent,  # upload speed in MB/s
                            "rx": mb_recv,  # download speed in MB/s
                            "tx_bytes": bytes_sent,  # raw value in bytes/sec for calculations
                            "rx_bytes": bytes_recv,  # raw value in bytes/sec for calculations
                            "interface": "default"  # Using combined interface data
                        }
                        
                        # Create payload with timestamp
                        payload = {
                            "timestamp": float(timestamp),
                            "datetime": datetime.fromtimestamp(timestamp).isoformat(),
                            **metrics
                        }
                        
                        # Log metrics for history
                        log_metric("network", metrics)
                        
                        # Emit to connected client
                        await sio.emit("metrics_update", payload, to=sid, namespace="/graph-network")
                    
                    # Save current values for next iteration
                    prev_counters = net_io
                    prev_time = current_time
                    
                    await asyncio.sleep(1)
            except asyncio.CancelledError:
                pass  # Socket disconnected, stop the task
            except Exception as e:
                print(f"Error in network metrics stream: {str(e)}")

        sio.start_background_task(send_network_metrics)
