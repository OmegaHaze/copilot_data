from pynvml import (
    nvmlInit,
    nvmlShutdown,
    nvmlDeviceGetHandleByIndex,
    nvmlDeviceGetUtilizationRates,
    nvmlDeviceGetMemoryInfo,
    nvmlDeviceGetBAR1MemoryInfo,
    nvmlDeviceGetPciInfo,
    nvmlDeviceGetPowerUsage,
    nvmlDeviceGetTemperature,
    nvmlDeviceGetClockInfo,
    nvmlDeviceGetMaxClockInfo,
    nvmlSystemGetDriverVersion,
    nvmlDeviceGetVbiosVersion,
    nvmlDeviceGetEnforcedPowerLimit,
    NVML_TEMPERATURE_GPU,
    NVML_CLOCK_GRAPHICS,
    NVML_CLOCK_MEM,
    NVML_CLOCK_SM
)
import pycuda.driver as cuda
from types import SimpleNamespace

from gpu_mods.gpu_helpers import timeout, safe, to_mb, infer_architecture, infer_tensor_cores, get_cuda_version

@timeout(3)
def get_gpu_info():
    try:
        nvmlInit()
        cuda.init()
        out = []

        for i in range(cuda.Device.count()):
            dev = cuda.Device(i)
            handle = nvmlDeviceGetHandleByIndex(i)

            metrics = {
                'util': safe(nvmlDeviceGetUtilizationRates, handle, default=SimpleNamespace(gpu=0, memory=0)),
                'mem': safe(nvmlDeviceGetMemoryInfo, handle, default=SimpleNamespace(total=0, used=0, free=0)),
                'bar1': safe(nvmlDeviceGetBAR1MemoryInfo, handle, default=SimpleNamespace(bar1Total=0, bar1Used=0)),
                'pci': safe(nvmlDeviceGetPciInfo, handle, default=SimpleNamespace(busId=b'Unknown')),
                'power': safe(nvmlDeviceGetPowerUsage, handle, default=0),
                'temp': safe(nvmlDeviceGetTemperature, handle, NVML_TEMPERATURE_GPU, default=0),
                'clocks': {
                    'graphics': safe(nvmlDeviceGetClockInfo, handle, NVML_CLOCK_GRAPHICS, 0),
                    'memory': safe(nvmlDeviceGetClockInfo, handle, NVML_CLOCK_MEM, 0),
                    'sm': safe(nvmlDeviceGetClockInfo, handle, NVML_CLOCK_SM, 0)
                },
                'max_clocks': {
                    'graphics': safe(nvmlDeviceGetMaxClockInfo, handle, NVML_CLOCK_GRAPHICS, 0),
                    'memory': safe(nvmlDeviceGetMaxClockInfo, handle, NVML_CLOCK_MEM, 0)
                }
            }

            compute_cap = dev.compute_capability()
            compute_major = compute_cap[0]
            attr = dev.get_attributes()
            sm_count = attr.get(cuda.device_attribute.MULTIPROCESSOR_COUNT, 0)

            gpu = {
                "name": dev.name(),
                "driver_version": safe(nvmlSystemGetDriverVersion, default=b"N/A").decode(),
                "vbios_version": safe(nvmlDeviceGetVbiosVersion, handle, default=b"N/A").decode(),
                "temperature": metrics['temp'],
                "compute_capability": f"{compute_cap[0]}.{compute_cap[1]}",
                "architecture": infer_architecture(compute_major),
                "cuda_cores": sm_count * 128,
                "tensor_cores": infer_tensor_cores(compute_major),
                "cuda_version": get_cuda_version(),
                "utilization": {
                    "gpu": metrics['util'].gpu,
                    "memory": metrics['util'].memory
                },
                "memory": {
                    "total": to_mb(metrics['mem'].total),
                    "used": to_mb(metrics['mem'].used),
                    "free": to_mb(metrics['mem'].free)
                },
                "bar1_memory": {
                    "total": to_mb(metrics['bar1'].bar1Total),
                    "used": to_mb(metrics['bar1'].bar1Used)
                },
                "power": {
                    "draw": round(metrics['power'] / 1000, 2) if metrics['power'] is not None else 0,
                    "limit": round((safe(nvmlDeviceGetEnforcedPowerLimit, handle, 0) or 0) / 1000, 2)
                },
                "clock_speeds": {
                    "graphics": metrics['clocks']['graphics'] or 0,
                    "memory": metrics['clocks']['memory'] or 0,
                    "sm": metrics['clocks']['sm'] or 0
                },
                "max_clocks": {
                    "graphics": metrics['max_clocks']['graphics'] or 0,
                    "memory": metrics['max_clocks']['memory'] or 0
                },
                "pci_info": {
                    "bus_id": metrics['pci'].busId.decode()
                }
            }

            gpu["gpuIndex"] = i 
            
            out.append(gpu)

        return out
    finally:
        try:
            nvmlShutdown()
        except Exception:
            pass
