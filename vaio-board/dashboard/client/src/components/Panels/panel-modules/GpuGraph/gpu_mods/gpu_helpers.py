import signal
from functools import wraps

class TimeoutError(Exception):
    pass

def timeout(seconds=3):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            def handler(signum, frame):
                raise TimeoutError("Function timed out")

            signal.signal(signal.SIGALRM, handler)
            signal.alarm(seconds)
            try:
                result = func(*args, **kwargs)
            finally:
                signal.alarm(0)
            return result
        return wrapper
    return decorator

def safe(fn, *args, default=None):
    try: return fn(*args)
    except Exception: return default

def to_mb(val): 
    return val // 1048576 if val else 0

def infer_architecture(compute_major):
    architectures = {
        9: 'Ada Lovelace',
        8: 'Ampere',
        7: 'Volta/Turing',
        6: 'Pascal',
        5: 'Maxwell'
    }
    return architectures.get(compute_major, 'Unknown')

def infer_tensor_cores(compute_major):
    return {
        8: 512,
        7: 640,
        6: 0
    }.get(compute_major, 'N/A')

def get_cuda_version():
    try:
        import pycuda.driver as cuda
        return f"{cuda.VERSION // 1000}.{cuda.VERSION % 1000 // 10}"
    except:
        return "Unknown"
