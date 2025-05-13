import sys
import os
import json
from gpu_mods.gpu_info_core import get_gpu_info
from gpu_mods.gpu_modes import debug_gpu_info, simple_gpu_info
from gpu_mods.gpu_smi import get_clock_speeds_from_nvidia_smi
from gpu_mods.gpu_helpers import TimeoutError

# Log only errors
sys.stderr = open("/workspace/logs/nvidia.err.log", "a")

# Flags
is_quiet = "--quiet" in sys.argv
is_simple = "--simple" in sys.argv
is_debug = "--debug" in sys.argv

# Silence stdout in all modes except --quiet, --simple, or --debug
if not (is_quiet or is_simple or is_debug):
    sys.stdout = open(os.devnull, "w")

# Ensure proper path resolution
current_dir = os.path.dirname(__file__)
sys.path.insert(0, current_dir)

def output_temp_file(data):
    import tempfile
    with tempfile.NamedTemporaryFile(mode='w', delete=False) as f:
        f.write(json.dumps(data))
        return f.name

if __name__ == "__main__":
    try:
        if is_debug:
            debug_gpu_info()
            sys.exit(0)

        if is_simple:
            try:
                print(json.dumps(simple_gpu_info()))
            except Exception as e:
                print(json.dumps([{"error": f"Failed to collect simple GPU info: {str(e)}"}]))
            sys.exit(0)

        if is_quiet:
            try:
                data = get_gpu_info()
                smi_clocks = get_clock_speeds_from_nvidia_smi()
                for gpu_index, clock_info in enumerate(smi_clocks):
                    if gpu_index < len(data):
                        data[gpu_index]["clock_speeds"] = clock_info["clocks"]
                        data[gpu_index]["max_clocks"] = clock_info["max_clocks"]
            except TimeoutError:
                data = [{"error": "GPU query timeout"}]
            except Exception as e:
                data = [{"error": f"Failed to collect GPU info: {str(e)}"}]

            try:
                tmp_path = output_temp_file(data)
                os.write(1, (tmp_path + '\n').encode())  # raw stdout
            except Exception:
                pass

            sys.exit(0)

        # Silent fallback (if no flag, run quietly with no output)
        try:
            _ = get_gpu_info()
        except Exception:
            try:
                _ = simple_gpu_info()
            except Exception:
                pass

    except Exception as outer:
        print(json.dumps([{"error": f"Unhandled exception: {str(outer)}"}]), file=sys.stderr)
