from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse, JSONResponse
import subprocess
import shlex

router = APIRouter()

def run_command_stream(cmd: str):
    def generate():
        process = subprocess.Popen(
            shlex.split(cmd), stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True
        )
        if process.stdout:
            for line in iter(process.stdout.readline, ''):
                yield line
        if process.stdout:
            process.stdout.close()
        process.wait()
    return StreamingResponse(generate(), media_type="text/plain")


@router.post("/run-command")
async def run_custom_command(request: Request):
    data = await request.json()
    cmd = data.get("cmd")
    if not cmd:
        return JSONResponse(status_code=400, content={"error": "Missing 'cmd'"})
    return run_command_stream(cmd)