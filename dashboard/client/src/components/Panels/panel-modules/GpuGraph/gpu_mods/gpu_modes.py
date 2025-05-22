from pynvml import *
import pycuda.driver as cuda
from types import SimpleNamespace

from gpu_mods.gpu_helpers import safe, to_mb, infer_architecture


def debug_gpu_info():
    try:
        print("Initializing NVML...")
        nvmlInit()
        print("NVML initialized successfully")

        print(f"Driver Version: {safe(nvmlSystemGetDriverVersion, default=b'Unknown').decode()}")
        deviceCount = safe(nvmlDeviceGetCount, default=0)
        print(f"Device Count: {deviceCount}")

        for i in range(deviceCount):
            try:
                print(f"\n=== GPU {i} ===")
                handle = nvmlDeviceGetHandleByIndex(i)
                print(f"Device Name: {safe(nvmlDeviceGetName, handle, default=b'Unknown').decode()}")
                print("Testing metrics individually:")

                print(f"  Temperature: {safe(nvmlDeviceGetTemperature, handle, NVML_TEMPERATURE_GPU, default='N/A')}")
                print(f"  Graphics Clock: {safe(nvmlDeviceGetClockInfo, handle, NVML_CLOCK_GRAPHICS, default='N/A')}")
                print(f"  Memory Clock: {safe(nvmlDeviceGetClockInfo, handle, NVML_CLOCK_MEM, default='N/A')}")
                print(f"  SM Clock: {safe(nvmlDeviceGetClockInfo, handle, NVML_CLOCK_SM, default='N/A')}")
                print(f"  Max Graphics Clock: {safe(nvmlDeviceGetMaxClockInfo, handle, NVML_CLOCK_GRAPHICS, default='N/A')}")
                print(f"  Max Memory Clock: {safe(nvmlDeviceGetMaxClockInfo, handle, NVML_CLOCK_MEM, default='N/A')}")

            except Exception as e:
                print(f"Error processing GPU {i}: {e}")
    except Exception as e:
        print(f"NVML initialization error: {e}")
    finally:
        try:
            nvmlShutdown()
            print("NVML shutdown successfully")
        except Exception as e:
            print(f"NVML shutdown error: {e}")

def simple_gpu_info():
    try:
        nvmlInit()
        cuda.init()
        out = []

        for i in range(cuda.Device.count()):
            dev = cuda.Device(i)
            handle = nvmlDeviceGetHandleByIndex(i)

            compute_cap = dev.compute_capability()
            compute_major = compute_cap[0]

            attr = dev.get_attributes()
            sm_count = attr.get(cuda.device_attribute.MULTIPROCESSOR_COUNT, 0)

            mem_info = safe(nvmlDeviceGetMemoryInfo, handle, default=SimpleNamespace(total=0, used=0, free=0))

            gpu = {
                "name": dev.name(),
                "driver_version": safe(nvmlSystemGetDriverVersion, default=b"N/A").decode(),
                "compute_capability": f"{compute_cap[0]}.{compute_cap[1]}",
                "architecture": infer_architecture(compute_major),
                "cuda_cores": sm_count * 128,
                "memory": {
                    "total": to_mb(mem_info.total),
                    "used": to_mb(mem_info.used),
                    "free": to_mb(mem_info.free)
                },
                "temperature": safe(nvmlDeviceGetTemperature, handle, NVML_TEMPERATURE_GPU, default=0),
            }
            out.append(gpu)
        return out
    finally:
        try: nvmlShutdown()
        except: pass
