from fastapi import APIRouter
import psutil
import platform
import time
import subprocess
from datetime import datetime
import re

router = APIRouter()

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

def parse_gpu_info(output):
    """Parse nvidia-smi output and return GPU information as JSON"""
    if not output:
        return None
        
    # Extract basic information using regex patterns
    gpu_info = {}
    
    # Get GPU name
    name_match = re.search(r"(?:NVIDIA\s*)(.*?)(?:\s*\(UUID:|$)", output)
    if name_match:
        gpu_info["name"] = name_match.group(1).strip()
    else:
        gpu_info["name"] = "Unknown NVIDIA GPU"
    
    # Get driver version
    driver_match = re.search(r"Driver Version: (\S+)", output)
    if driver_match:
        gpu_info["driver"] = driver_match.group(1)
    
    # Get memory usage
    memory_match = re.search(r"(\d+)MiB\s*/\s*(\d+)MiB", output)
    if memory_match:
        used = int(memory_match.group(1))
        total = int(memory_match.group(2))
        gpu_info["memory"] = {
            "used": used,
            "total": total,
            "free": total - used,
            "unit": "MiB"
        }
    
    # Get utilization
    util_match = re.search(r"Gpu\s*:\s*(\d+)\s*%", output)
    if util_match:
        gpu_info["utilization"] = int(util_match.group(1))
    
    # Get temperature
    temp_match = re.search(r"(\d+)C", output)
    if temp_match:
        gpu_info["temperature"] = int(temp_match.group(1))
    
    return gpu_info

@router.get("/info")
def get_system_info():
    """Get full system information: CPU, memory, disk, OS."""
    try:
        # CPU information
        cpu_count = psutil.cpu_count(logical=False)
        cpu_count_logical = psutil.cpu_count(logical=True)

        # CPU model
        cpu_model = "Unknown CPU"
        try:
            with open("/proc/cpuinfo", "r") as f:
                for line in f:
                    if "model name" in line:
                        # More accurate regex that handles both "model name:" and "model name\t:" formats
                        cpu_model = re.sub(r"model name\s*:\s*", "", line.strip())
                        break
        except Exception as e:
            print(f"Error reading CPU model: {e}")

        # Memory information
        memory = psutil.virtual_memory()
        swap = psutil.swap_memory()

        # Disk information
        disk = psutil.disk_usage('/')

        # Boot time
        boot_time = datetime.fromtimestamp(psutil.boot_time()).isoformat()

        # OS information
        os_info = None
        try:
            with open("/etc/os-release", "r") as f:
                for line in f:
                    if line.startswith("PRETTY_NAME="):
                        os_info = line.split("=")[1].strip().strip('"')
                        break
        except Exception as e:
            print(f"Error reading OS info: {e}")
            os_info = platform.platform()

        # Architecture
        arch = platform.machine()

        # Uptime
        uptime_seconds = int(time.time() - psutil.boot_time())

        # GPU information
        gpu_info = parse_gpu_info(run_nvidia_smi())

        return {
            "version": 1,
            "data": {
                "cpu": {
                    "physical_cores": cpu_count,
                    "logical_cores": cpu_count_logical,
                    "model": cpu_model,
                    "architecture": arch
                },
                "os": {
                    "name": os_info,
                    "uptime_seconds": uptime_seconds
                },
                "memory": {
                    "total": memory.total,
                    "available": memory.available,
                    "percent": memory.percent,
                    "swap_total": swap.total,
                    "swap_free": swap.free
                },
                "disk": {
                    "total": disk.total,
                    "free": disk.free,
                    "percent": disk.percent
                },
                "boot_time": boot_time,
                "gpu": gpu_info
            }
        }
    except Exception as e:
        return {"version": 1, "error": str(e)}

@router.get("/nvidia/info")
def get_nvidia_info():
    """Get NVIDIA GPU information - compatibility endpoint"""
    try:
        output = run_nvidia_smi()
        if output:
            gpu_info = parse_gpu_info(output)
            return {
                "available": True,
                "info": gpu_info,
                "timestamp": datetime.now().isoformat()
            }
        else:
            return {
                "available": False,
                "error": "NVIDIA GPU not available or nvidia-smi failed",
                "timestamp": datetime.now().isoformat()
            }
    except Exception as e:
        return {
            "available": False,
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }

@router.get("/system-info")
def get_simplified_system_info():
    """Get simplified system information including CPU details (for backward compatibility)"""
    try:
        # Use the main system info function but reformat the output
        full_info = get_system_info()
        
        if "error" in full_info:
            return {"error": full_info["error"]}
            
        # Extract the data from the full info
        data = full_info.get("data", {})
        
        # Format in the legacy structure 
        return {
            "system": {
                "hostname": platform.node(),
                "platform": platform.system(),
                "release": platform.release(),
                "version": platform.version(),
                "machine": platform.machine(),
                "cpu": {
                    "model": data.get("cpu", {}).get("model", "Unknown CPU"),
                    "physical_cores": data.get("cpu", {}).get("physical_cores", 0),
                    "logical_cores": data.get("cpu", {}).get("logical_cores", 0),
                    "cores": data.get("cpu", {}).get("logical_cores", 0)  # For backward compatibility
                },
                "memory": {
                    "total": data.get("memory", {}).get("total", 0),
                    "available": data.get("memory", {}).get("available", 0),
                    "percent": data.get("memory", {}).get("percent", 0)
                }
            }
        }
    except Exception as e:
        return {"error": str(e)}

