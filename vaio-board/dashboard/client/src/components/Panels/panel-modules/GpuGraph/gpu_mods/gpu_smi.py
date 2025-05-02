import subprocess

def get_clock_speeds_from_nvidia_smi():
    try:
        try:
            result = subprocess.run(
                ["nvidia-smi", "--query-gpu=index,clocks.gr,clocks.mem,clocks.sm,clocks.max.gr,clocks.max.mem", 
                 "--format=csv,noheader,nounits"],
                capture_output=True, text=True, check=True, timeout=3
            )
        except Exception:
            result = subprocess.run(
                ["nvidia-smi", "--query-gpu=index,clocks.current.graphics,clocks.current.memory,clocks.current.sm,clocks.max.graphics,clocks.max.memory", 
                 "--format=csv,noheader,nounits"],
                capture_output=True, text=True, check=True, timeout=3
            )

        clock_data = []
        for line in result.stdout.strip().split('\n'):
            parts = [part.strip() for part in line.split(',')]
            if len(parts) >= 6:
                index = -1  # Default value for index
                try:
                    index = int(parts[0])
                    graphics = int(parts[1]) if parts[1] not in ['[N/A]', 'N/A', ''] else 0
                    memory = int(parts[2]) if parts[2] not in ['[N/A]', 'N/A', ''] else 0
                    sm = int(parts[3]) if parts[3] not in ['[N/A]', 'N/A', ''] else 0
                    max_graphics = int(parts[4]) if parts[4] not in ['[N/A]', 'N/A', ''] else 0
                    max_memory = int(parts[5]) if parts[5] not in ['[N/A]', 'N/A', ''] else 0
                except (ValueError, IndexError):
                    graphics = memory = sm = max_graphics = max_memory = 0
                
                clock_data.append({
                    "index": index,
                    "clocks": {
                        "graphics": graphics,
                        "memory": memory,
                        "sm": sm
                    },
                    "max_clocks": {
                        "graphics": max_graphics,
                        "memory": max_memory
                    }
                })
        return clock_data
    except Exception as e:
        print(f"Error getting clock speeds from nvidia-smi: {str(e)}")
        return []