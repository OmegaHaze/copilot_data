import { useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import { Terminal } from 'xterm'
import 'xterm/css/xterm.css'

export default function TerminalPane() {
  const terminalRef = useRef(null)
  const socketRef = useRef(null)

  useEffect(() => {
    const term = new Terminal({
      cols: 80,
      rows: 24,
      theme: {
        background: '#000000',
        foreground: '#00ff00'
      }
    })

    term.open(terminalRef.current)

    // Connect to the /pty namespace
    const socket = io('/pty')
    socketRef.current = socket

    // Stream backend output to terminal
    socket.on('output', data => term.write(data))

    // Send user input to backend
    term.onData(data => socket.emit('input', data))

    // Handle resize
    term.onResize(({ cols, rows }) => {
      socket.emit('resize', { cols, rows })
    })

    return () => {
      socket.disconnect()
      term.dispose()
    }
  }, [])

  return (
    <div className="h-full w-full bg-black border border-green-600 rounded shadow-inner">
      <div ref={terminalRef} className="w-full h-full" />
    </div>
  )
}
