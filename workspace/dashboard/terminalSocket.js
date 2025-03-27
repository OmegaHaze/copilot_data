import { Server } from 'socket.io'
import pty from 'node-pty'

export function setupTerminalSocket(io) {
  io.on('connection', socket => {
    console.log('[+] Terminal client connected')

    const shell = pty.spawn('/bin/bash', [], {
      name: 'xterm-color',
      cols: 80,
      rows: 30,
      cwd: process.env.HOME,
      env: process.env
    })

    // Stream shell output to client
    shell.onData(data => socket.emit('terminalOutput', data))

    // Listen for client commands
    socket.on('terminalInput', input => shell.write(input))

    // Resize terminal
    socket.on('resize', ({ cols, rows }) => shell.resize(cols, rows))

    socket.on('disconnect', () => {
      shell.kill()
      console.log('[-] Terminal disconnected')
    })
  })
}
