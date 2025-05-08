// filepath: /workspace/dashboard/client/src/components/Panes/Utility/TerminalPane.jsx
import { useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import { Terminal } from 'xterm'
import 'xterm/css/xterm.css'

export default function TerminalPane() {
  const terminalRef = useRef(null)
  const socketRef = useRef(null)
  const termRef = useRef(null)

  useEffect(() => {
    // Initialize terminal only once
    if (!termRef.current) {
      termRef.current = new Terminal({
        cols: 80,
        rows: 24,
        fontSize: 11,
        fontFamily: 'monospace',
        theme: {
          background: '', //terminal background color
          foreground: '#22c55e' //terminal font color
        }
      })
      termRef.current.open(terminalRef.current)
    }

    // Initialize socket connection only once
    if (!socketRef.current) {
      // Connect to the /pty namespace
      socketRef.current = io('/pty')

      // Stream backend output to terminal
      socketRef.current.on('output', data => {
        if (termRef.current) {
          termRef.current.write(data)
        }
      })

      // Send user input to backend
      if (termRef.current) {
        termRef.current.onData(data => {
          if (socketRef.current) {
            socketRef.current.emit('input', data)
          }
        })

        // Handle resize
        termRef.current.onResize(({ cols, rows }) => {
          if (socketRef.current) {
            socketRef.current.emit('resize', { cols, rows })
          }
        })
      }
    }

    // Clean up on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
      }
      if (termRef.current) {
        termRef.current.dispose()
        termRef.current = null
      }
    }
  }, []) // Empty dependency array ensures this runs only once

  return (
    <div className="h-full w-full rounded shadow-inner">
      <div ref={terminalRef} className=" w-full h-auto" />
    </div>
  )
}