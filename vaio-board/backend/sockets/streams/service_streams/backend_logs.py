# # # backend/sockets/streams/service_streams/backend_logs.py
# # from backend.services.logs.log_watcher import stream_log_lines

# # async def stream_backend_logs(sio):
# #     """
# #     Stream the backend log files and emit updates through Socket.IO.
# #     """
# #     main_log = "/home/vaio/vaio-board/workspace/logs/vaio-backend.log"
# #     error_log = "/home/vaio/vaio-board/workspace/logs/vaio-backend-error.log"
    
# #     print(f"Starting backend log streaming from: {main_log} and {error_log}")
    
# #     # Stream main logs
# #     async for line in stream_log_lines(main_log):
# #         await sio.emit("backendLogStream", line)
# #         await sio.emit("logStream", {"filename": "vaio-backend.log", "line": line})
# #         await sio.emit("backendLogStream", line, namespace="/logs")
# #         await sio.emit("logStream", {"filename": "vaio-backend.log", "line": line}, namespace="/logs")

# #     # Stream error logs
# #     async for line in stream_log_lines(error_log):
# #         await sio.emit("backendErrorStream", line)
# #         await sio.emit("logStream", {"filename": "vaio-backend-error.log", "line": line})
# #         await sio.emit("backendErrorStream", line, namespace="/logs")
# #         await sio.emit("logStream", {"filename": "vaio-backend-error.log", "line": line}, namespace="/logs")


# THIS HAS BEEN REPLACED