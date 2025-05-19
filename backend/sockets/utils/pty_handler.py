# backend/sockets/utils/pty_handler.py
import asyncio
import os
import pty
import fcntl
import termios
import struct
from socketio import AsyncServer
from typing import Dict, Any, Optional
from asyncio import Task
from asyncio.subprocess import Process

NAMESPACE = "/pty"

def set_controlling_tty(tty_fd: int) -> None:
    """Set up the PTY as a controlling terminal"""
    try:
        # Try to make process the session leader
        os.setsid()
    except OSError:
        pass
        
    try:
        # Make the PTY our controlling terminal
        fcntl.ioctl(tty_fd, termios.TIOCSCTTY, 0)
    except OSError:
        pass

class PTYState:
    """Class to manage PTY state and validate file descriptors"""
    def __init__(self):
        self.process: Optional[Process] = None
        self.master_fd: int = -1
        self.slave_fd: int = -1
        self.read_task: Optional[Task] = None
        self._is_valid = False

    def is_valid(self) -> bool:
        """Check if the PTY is still valid"""
        if not self._is_valid or self.master_fd < 0:
            return False
        try:
            # Try to get the terminal attributes to check if fd is valid
            termios.tcgetattr(self.master_fd)
            return True
        except (OSError, termios.error):
            self._is_valid = False
            return False

    async def cleanup(self, sio: AsyncServer, sid: str) -> None:
        """Clean up PTY resources and notify client"""
        self._is_valid = False  # Mark as invalid first to stop any new operations
        
        # Cancel read task first
        if self.read_task and not self.read_task.cancelled():
            self.read_task.cancel()
            try:
                await self.read_task
            except asyncio.CancelledError:
                pass
            self.read_task = None

        # Kill process
        if self.process and self.process.returncode is None:
            try:
                self.process.kill()
                await self.process.wait()
            except ProcessLookupError:
                pass
            self.process = None

        # Close file descriptors
        for fd in [self.slave_fd, self.master_fd]:  # Close slave before master
            if fd >= 0:
                try:
                    os.close(fd)
                except OSError:
                    pass

        self.master_fd = -1
        self.slave_fd = -1
        
        # Notify client that terminal needs to be restarted
        await sio.emit("pty_error", {"message": "Terminal session ended"}, to=sid, namespace=NAMESPACE)

def register_pty_handlers(sio: AsyncServer) -> None:
    """Register PTY socket handlers with the Socket.IO server."""
    if not isinstance(sio, AsyncServer):
        raise ValueError("Invalid Socket.IO server instance")

    # Store PTY state per client
    client_ptys: Dict[str, PTYState] = {}

    async def connect_pty(sid: str, environ: Dict[str, Any]) -> None:
        print(f"[PTY] Client connected: {sid}")
        
        # Cleanup any existing PTY for this client
        if sid in client_ptys:
            await client_ptys[sid].cleanup(sio, sid)
        
        pty_state = PTYState()
        client_ptys[sid] = pty_state

        try:
            # Create new PTY
            master_fd, slave_fd = pty.openpty()
            if master_fd < 0 or slave_fd < 0:
                raise OSError("Failed to create PTY")

            # Get slave PTY name and open it again to handle job control properly
            slave_name = os.ttyname(slave_fd)
            os.close(slave_fd)  # Close the original slave
            slave_fd = os.open(slave_name, os.O_RDWR | os.O_NOCTTY)
            
            # Set terminal attributes
            attr = termios.tcgetattr(master_fd)
            # Keep default terminal attributes for proper handling of all special keys
            # We want to maintain the terminal's default behavior rather than going to raw mode
            # This ensures arrow keys, history navigation, and other special keys work properly
            termios.tcsetattr(master_fd, termios.TCSANOW, attr)
            
            # Store file descriptors
            pty_state.master_fd = master_fd
            pty_state.slave_fd = slave_fd
            pty_state._is_valid = True

            # Use bash with login for proper initialization
            shell = os.environ.get("SHELL") or "/bin/bash"
            
            # Create process with proper job control
            # Use -i flag for interactive shell with proper prompt
            process = await asyncio.create_subprocess_exec(
                shell,  # No -i flag as it can cause issues on some systems
                stdin=slave_fd,
                stdout=slave_fd,
                stderr=slave_fd,
                env={
                    **os.environ,
                    'TERM': 'xterm-256color',
                    'SHELL': shell,
                    'PS1': 'vaio@\\h:\\w$ ',  # Simple prompt that works everywhere
                    'PROMPT_COMMAND': '',   # Don't modify the prompt
                    'CLICOLOR': '1',        # Enable colors
                    'HISTCONTROL': 'ignoreboth',  # Better handling of history
                    'HISTSIZE': '5000',     # Large history size
                    'HISTFILESIZE': '5000', # Large history file
                    # Keep other environment variables
                    'LS_COLORS': 'rs=0:di=01;34:ln=01;36:mh=00:pi=40;33:so=01;35:do=01;35:bd=40;33;01:cd=40;33;01:or=40;31;01:mi=00:su=37;41:sg=30;43:ca=00:tw=30;42:ow=34;42:st=37;44:ex=01;32:*.tar=01;31:*.tgz=01;31:*.arc=01;31:*.arj=01;31:*.taz=01;31:*.lha=01;31:*.lz4=01;31:*.lzh=01;31:*.lzma=01;31:*.tlz=01;31:*.txz=01;31:*.tzo=01;31:*.t7z=01;31:*.zip=01;31:*.z=01;31:*.dz=01;31:*.gz=01;31:*.lrz=01;31:*.lz=01;31:*.lzo=01;31:*.xz=01;31:*.zst=01;31:*.tzst=01;31:*.bz2=01;31:*.bz=01;31:*.tbz=01;31:*.tbz2=01;31:*.tz=01;31:*.deb=01;31:*.rpm=01;31:*.jar=01;31:*.war=01;31:*.ear=01;31:*.sar=01;31:*.rar=01;31:*.alz=01;31:*.ace=01;31:*.zoo=01;31:*.cpio=01;31:*.7z=01;31:*.rz=01;31:*.cab=01;31:*.wim=01;31:*.swm=01;31:*.dwm=01;31:*.esd=01;31:*.avif=01;35:*.jpg=01;35:*.jpeg=01;35:*.mjpg=01;35:*.mjpeg=01;35:*.gif=01;35:*.bmp=01;35:*.pbm=01;35:*.pgm=01;35:*.ppm=01;35:*.tga=01;35:*.xbm=01;35:*.xpm=01;35:*.tif=01;35:*.tiff=01;35:*.png=01;35:*.svg=01;35:*.svgz=01;35:*.mng=01;35:*.pcx=01;35:*.mov=01;35:*.mpg=01;35:*.mpeg=01;35:*.m2v=01;35:*.mkv=01;35:*.webm=01;35:*.webp=01;35:*.ogm=01;35:*.mp4=01;35:*.m4v=01;35:*.mp4v=01;35:*.vob=01;35:*.qt=01;35:*.nuv=01;35:*.wmv=01;35:*.asf=01;35:*.rm=01;35:*.rmvb=01;35:*.flc=01;35:*.avi=01;35:*.fli=01;35:*.flv=01;35:*.gl=01;35:*.dl=01;35:*.xcf=01;35:*.xwd=01;35:*.yuv=01;35:*.cgm=01;35:*.emf=01;35:*.ogv=01;35:*.ogx=01;35:*.aac=00;36:*.au=00;36:*.flac=00;36:*.m4a=00;36:*.mid=00;36:*.midi=00;36:*.mka=00;36:*.mp3=00;36:*.mpc=00;36:*.ogg=00;36:*.ra=00;36:*.wav=00;36:*.oga=00;36:*.opus=00;36:*.spx=00;36:*.xspf=00;36:',  # Colorful ls output
                },
                preexec_fn=lambda: set_controlling_tty(slave_fd)
            )
            
            if not process:
                raise RuntimeError("Failed to create subprocess")
            
            pty_state.process = process

            async def read_from_pty() -> None:
                loop = asyncio.get_event_loop()
                
                while pty_state.is_valid():
                    try:
                        # Simpler read approach - just read and send
                        data = await loop.run_in_executor(None, os.read, pty_state.master_fd, 1024)
                        
                        if not data:
                            break
                            
                        if pty_state.is_valid():  # Check again after potentially long read
                            # Just send data directly without buffering
                            await sio.emit("output", data.decode(errors="ignore"), to=sid, namespace=NAMESPACE)
                    except (OSError, IOError) as e:
                        print(f"[PTY] Read error: {e}")
                        break
                    except Exception as e:
                        print(f"[PTY] Unexpected error in read loop: {e}")
                        break
                
                print(f"[PTY] Read loop ended for client: {sid}")
                if sid in client_ptys:
                    await pty_state.cleanup(sio, sid)

            pty_state.read_task = asyncio.create_task(read_from_pty())

        except Exception as e:
            print(f"[PTY] Setup error: {e}")
            if pty_state.is_valid():
                await pty_state.cleanup(sio, sid)
            client_ptys.pop(sid, None)
            await sio.emit("pty_error", {"message": str(e)}, to=sid, namespace=NAMESPACE)
            return

    async def pty_input(sid: str, data: str) -> None:
        pty_state = client_ptys.get(sid)
        if not pty_state or not pty_state.is_valid():
            await sio.emit("pty_error", {"message": "Terminal not connected"}, to=sid, namespace=NAMESPACE)
            return
            
        try:
            os.write(pty_state.master_fd, data.encode())
        except OSError as e:
            print(f"[PTY] Error writing to terminal: {e}")
            await pty_state.cleanup(sio, sid)

    async def pty_resize(sid: str, size: Dict[str, int]) -> None:
        pty_state = client_ptys.get(sid)
        if not pty_state or not pty_state.is_valid():
            return
            
        try:
            cols = size.get("cols", 80)
            rows = size.get("rows", 24)
            fcntl.ioctl(pty_state.master_fd, termios.TIOCSWINSZ, 
                       struct.pack("hhhh", rows, cols, 0, 0))
        except (OSError, IOError) as e:
            print(f"[PTY] Error resizing terminal: {e}")
            await pty_state.cleanup(sio, sid)

    async def pty_disconnect(sid: str) -> None:
        print(f"[PTY] Client disconnected: {sid}")
        if sid in client_ptys:
            await client_ptys[sid].cleanup(sio, sid)
            del client_ptys[sid]

    # Register event handlers directly without the handler variable
    @sio.event(namespace=NAMESPACE)
    async def connect(sid, environ):
        await connect_pty(sid, environ)
        
    @sio.event(namespace=NAMESPACE)
    async def input(sid, data):
        await pty_input(sid, data)
        
    @sio.event(namespace=NAMESPACE)
    async def resize(sid, size):
        await pty_resize(sid, size)
        
    @sio.event(namespace=NAMESPACE)
    async def disconnect(sid):
        await pty_disconnect(sid)
