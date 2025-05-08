# # backend/sockets/streams/service_streams/supervisor_logs.py
# from backend.services.logs.log_watcher import stream_log_lines

# # Supervisor log streaming implementation
# async def stream_supervisor_logs(sio):
#     """
#     Stream the supervisor log file and emit updates through Socket.IO.
#     """
#     log_path = "/home/vaio/vaio-board/workspace/logs/supervisord.log"
    
#     # Log to the console when this function starts
#     print(f"Starting supervisor log streaming from: {log_path}")
    
#     # Check if the log file exists
#     import os
#     if not os.path.exists(log_path):
#         print(f"WARNING: Supervisor log file not found at {log_path}")
#         # Try to create an empty file if it doesn't exist
#         try:
#             with open(log_path, 'a') as f:
#                 pass
#             print(f"Created empty log file at {log_path}")
#         except Exception as e:
#             print(f"Error creating log file: {str(e)}")
    
#     async for line in stream_log_lines(log_path):
#         # Emit to both the specific namespace and the default namespace
#         # Add debug logs to confirm emission
#         print(f"Emitting supervisor log line to default namespace: {line}")
#         await sio.emit("supervisorLogStream", line)
#         await sio.emit("logStream", {"filename": "supervisord.log", "line": line})

#         print(f"Emitting supervisor log line to /logs namespace: {line}")
#         await sio.emit("supervisorLogStream", line, namespace="/logs")
#         await sio.emit("logStream", {"filename": "supervisord.log", "line": line}, namespace="/logs")




# # THIS HAS BEEN REPLACED