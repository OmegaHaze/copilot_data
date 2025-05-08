from fastapi import APIRouter
import platform
import subprocess

router = APIRouter()
_cached_env = None  # Simple in-memory cache

@router.get("/ml/environment")
def get_ml_environment():
    global _cached_env
    if _cached_env is not None:
        return _cached_env

    env = {
        "python_version": platform.python_version(),
        "os": platform.system(),
        "cuda_available": False,
        "pytorch_version": None,
        "cudnn_version": None
    }

    try:
        import torch
        env["pytorch_version"] = torch.__version__
        env["cuda_available"] = torch.cuda.is_available()
        env["cudnn_version"] = torch.backends.cudnn.version()
    except ImportError:
        env["pytorch_installed"] = False
    except Exception as e:
        env["error"] = str(e)

    try:
        result = subprocess.run(
            ["nvidia-smi", "--query-gpu=driver_version", "--format=csv,noheader"],
            capture_output=True, text=True, check=True
        )
        env["nvidia_driver_version"] = result.stdout.strip()
    except Exception:
        env["nvidia_driver_version"] = "Unavailable"

    _cached_env = env
    return env