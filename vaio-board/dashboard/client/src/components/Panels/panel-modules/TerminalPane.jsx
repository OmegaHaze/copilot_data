import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import { io } from 'socket.io-client'
import { Terminal } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import 'xterm/css/xterm.css'


// Using forwardRef to expose methods to parent component
const TerminalPane = forwardRef(({ 
  initialFontSize = 11,
  theme = {
    background: '', 
    foreground: '#85EFAC'
  },
  options = {}
}, ref) => {
  const terminalRef = useRef(null)
  const socketRef = useRef(null)
  const termRef = useRef(null)
  const fitAddonRef = useRef(null)
  const fontSizeRef = useRef(initialFontSize)

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    increaseFontSize: () => {
      if (termRef.current) {
        const newSize = Math.min(24, fontSizeRef.current + 1)
        fontSizeRef.current = newSize
        termRef.current.options.fontSize = newSize
        if (fitAddonRef.current) {
          fitAddonRef.current.fit()
        }
      }
    },
    decreaseFontSize: () => {
      if (termRef.current) {
        const newSize = Math.max(8, fontSizeRef.current - 1)
        fontSizeRef.current = newSize
        termRef.current.options.fontSize = newSize
        if (fitAddonRef.current) {
          fitAddonRef.current.fit()
        }
      }
    },
    getFontSize: () => fontSizeRef.current,
    // Add focus method to programmatically focus the terminal
    focus: () => {
      if (termRef.current) {
        termRef.current.focus();
      }
    }
  }))

  const handleResize = () => {
    if (termRef.current && fitAddonRef.current) {
      fitAddonRef.current.fit()
    }
  }

  useEffect(() => {
    // Only create terminal and socket once
    if (!termRef.current && !socketRef.current) {
      // Initialize terminal first
      fitAddonRef.current = new FitAddon()
      termRef.current = new Terminal({
        fontSize: fontSizeRef.current,
        fontFamily: 'JetBrains Mono, Source Code Pro, Menlo, Monaco, Consolas, monospace',
        allowTransparency: true,  // Allow transparency for cool effects
        scrollback: 5000,         // Large scrollback for convenience
        disableStdin: false,      // Enable input
        cursorBlink: true,        // Blinking cursor
        cursorStyle: 'block',     // Block cursor for better visibility
        cursorWidth: 2,           // Slightly thicker cursor
        convertEol: true,         // Convert end of line characters
        screenReaderMode: false,  // Disable screen reader mode
        rendererType: 'canvas',   // Canvas renderer for better performance
        rightClickSelectsWord: true, // Right click selects words
        fastScrollModifier: 'alt', // Fast scrolling with Alt key
        fastScrollSensitivity: 5,  // Faster scrolling
        macOptionIsMeta: true,     // Make Option key work as Meta on Mac
        
        // Awesome theme with high contrast and vivid colors
        theme: {
          background: '',  // Slightly transparent background
          foreground: '#85EFAC',              // Bright green text
          cursor: '#85EFAC',                  // Matching cursor
          cursorAccent: '#000000',            // Black cursor accent
          selection: 'rgba(82, 255, 123, 0.3)', // Subtle selection
          black: '#000000',
          red: '#ff5555',
          green: '#50fa7b',
          yellow: '#f1fa8c',
          blue: '#42a5f5',
          magenta: '#ff79c6',
          cyan: '#8be9fd',
          white: '#f8f8f2',
          brightBlack: '#555555',
          brightRed: '#ff6e6e',
          brightGreen: '#69ff94',
          brightYellow: '#ffffa5',
          brightBlue: '#6fc1ff',
          brightMagenta: '#ff92df',
          brightCyan: '#a4ffff',
          brightWhite: '#ffffff',
        },
        ...options
      })
      
      
      termRef.current.loadAddon(fitAddonRef.current)
      termRef.current.open(terminalRef.current)
      
      // Explicitly attach the terminal to the DOM and make sure it's focusable
      const terminalElement = document.querySelector('.xterm-helper-textarea');
      if (terminalElement) {
        terminalElement.setAttribute('tabindex', '0');
      }
      
      // Configure socket with reconnection settings
      // Get the hostname dynamically from the browser
      const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost'
      
      // Create socket with proper URL including host and port - use both transports for maximum compatibility
      // Create socket with proper URL including host and port - use simpler config
      socketRef.current = io(`http://${host}:1888/pty`, {
        transports: ['polling', 'websocket'], // Try polling first as it's more reliable
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 500,
        timeout: 5000,
        autoConnect: false
      })

      // Setup socket event handlers with status messages
      socketRef.current.on('connect', () => {
        console.log('Terminal socket connected')
        // Show connection success message but don't clear - let the shell prompt appear naturally
        if (termRef.current) {
          // Just focus without adding text that might interfere with the prompt
          termRef.current.focus();
          
          // Send a CTRL-L to refresh the screen after a short delay
          setTimeout(() => {
            if (socketRef.current && socketRef.current.connected) {
              socketRef.current.emit('input', '\x0C'); // Form feed (clear screen)
            }
          }, 500);
          
          // Make sure DOM events are properly set up for the terminal
          try {
            const xtermElement = document.querySelector('.xterm');
            if (xtermElement) {
              // Listen for all keyboard events directly on the xterm element
              xtermElement.addEventListener('keydown', (e) => {
                console.log('Terminal keydown captured directly');
                // Don't stop propagation here - xterm needs to handle the event
              });
            }
          } catch (e) {
            console.error('Error setting up terminal event handlers:', e);
          }
        }
      })

      socketRef.current.on('connect_error', (error) => {
        console.error('Terminal socket connect error:', error)
        if (termRef.current) {
          termRef.current.write(`\r\n\x1b[31mConnection error: ${error.message}\x1b[0m\r\n`)
          termRef.current.write('Trying to reconnect...\r\n')
        }
        
        // Simple reconnect - socket.io will handle retry logic
        setTimeout(() => {
          if (socketRef.current) {
            console.log('Attempting to reconnect terminal...');
            socketRef.current.connect();
          }
        }, 1000);
      })

      socketRef.current.on('disconnect', (reason) => {
        console.log('Terminal socket disconnected:', reason)
        if (termRef.current) {
          termRef.current.write(`\r\n\x1b[33mDisconnected: ${reason}\x1b[0m\r\n`)
        }
      })

      socketRef.current.on('error', (error) => {
        console.error('Terminal socket error:', error)
        if (termRef.current) {
          termRef.current.write(`\r\n\x1b[31mError: ${error.message || 'Unknown error'}\x1b[0m\r\n`)
        }
      })
      
      // Listen for pty_error events
      socketRef.current.on('pty_error', (data) => {
        console.error('PTY error:', data)
        if (termRef.current) {
          termRef.current.write(`\r\n\x1b[31mPTY Error: ${data.message || 'Terminal session ended'}\x1b[0m\r\n`)
          termRef.current.write('Reconnecting terminal session...\r\n')
          
          // Attempt to reconnect
          setTimeout(() => {
            if (socketRef.current) {
              socketRef.current.disconnect()
              socketRef.current.connect()
            }
          }, 1000)
        }
      })

      socketRef.current.on('output', (data) => {
        if (termRef.current) {
          termRef.current.write(data)
        }
      })

      // Enhanced input handler with error handling and input buffering
      const inputBuffer = [];
      const flushBuffer = () => {
        if (socketRef.current && socketRef.current.connected && inputBuffer.length > 0) {
          const data = inputBuffer.join('');
          socketRef.current.emit('input', data);
          inputBuffer.length = 0; // Clear buffer
        }
      };
      
      termRef.current.onData((data) => {
        if (socketRef.current && socketRef.current.connected) {
          try {
            // Send input to server immediately
            socketRef.current.emit('input', data);
          } catch (error) {
            console.error('Error sending input to server:', error);
            // Show error in terminal
            termRef.current.write(`\r\n\x1b[31mInput error: ${error.message}\x1b[0m\r\n`);
            
            // Buffer this input for retry
            inputBuffer.push(data);
            
            // Attempt to reconnect if there's an issue
            socketRef.current.disconnect();
            setTimeout(() => {
              socketRef.current.connect();
              // Try to flush buffer after reconnect
              setTimeout(flushBuffer, 500);
            }, 1000);
          }
        } else if (socketRef.current) {
          // If socket exists but not connected, buffer the input
          inputBuffer.push(data);
          
          // Connect and then flush buffer
          socketRef.current.connect();
          setTimeout(flushBuffer, 1000);
        }
      })

      // Enhanced terminal resize handler
      termRef.current.onResize(({ cols, rows }) => {
        if (socketRef.current && socketRef.current.connected) {
          // Only emit if we have reasonable dimensions
          if (cols > 0 && rows > 0) {
            socketRef.current.emit('resize', { cols, rows })
            console.log(`Terminal resized to ${cols}x${rows}`)
          }
        }
      })
      
      // Also trigger resize on connection for proper initial sizing
      socketRef.current.on('connect', () => {
        // Short delay to allow terminal to initialize
        setTimeout(() => {
          if (termRef.current && termRef.current.initialDimensions && fitAddonRef.current) {
            fitAddonRef.current.fit()
            const dims = termRef.current.initialDimensions
            if (socketRef.current && socketRef.current.connected) {
              socketRef.current.emit('resize', { cols: dims.cols, rows: dims.rows })
              
              // Send a shell reset command after resize
              // This helps ensure we get a fresh prompt
              setTimeout(() => {
                if (socketRef.current && socketRef.current.connected) {
                  socketRef.current.emit('input', '\x0C'); // Send form feed (clear)
                }
              }, 200);
            }
          }
        }, 100)
      })
      
      // Set up resize handling
      window.addEventListener('resize', handleResize)
      const resizeObserver = new ResizeObserver(handleResize)
      resizeObserver.observe(terminalRef.current)

      // Initial fit and connect with better timing
      setTimeout(() => {
        // Fit the terminal first
        fitAddonRef.current.fit()
        
        // Get the terminal size for initial setup
        const dims = fitAddonRef.current.proposeDimensions()
        const initialDimensions = {
          cols: dims ? dims.cols : 80,
          rows: dims ? dims.rows : 24
        }
        
        // Store initial dimensions for resize event after connection
        termRef.current.initialDimensions = initialDimensions
        
        // Connect to socket
        socketRef.current.connect()
        
        // Don't show initial message here - will be handled by the connect event
      }, 200)
    }

    // Cleanup function
    return () => {
      window.removeEventListener('resize', handleResize)
      
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
      }
      if (termRef.current) {
        termRef.current.dispose()
        termRef.current = null
      }
    }
  }, []) // Empty dependency array - only run once

  return (
    <div 
      className="h-full rounded shadow-inner overflow-hidden" 
      onClick={(e) => {
        // Prevent propagation and ensure terminal gets focus
        e.stopPropagation();
        e.preventDefault();
        if (termRef.current) {
          termRef.current.focus();
          console.log('Terminal focused via click');
        }
      }}
      onMouseDown={(e) => {
        // Stop propagation to prevent any interference with terminal input
        e.stopPropagation();
      }}
      tabIndex={-1} // Make the container focusable
      onFocus={() => {
        // When container gets focus, pass it to the terminal
        if (termRef.current) {
          termRef.current.focus();
          console.log('Terminal focused via tab');
        }
      }}
    >
      <div ref={terminalRef} className="h-full overflow-hidden" />
    </div>
  )
})

// Set display name for React DevTools
TerminalPane.displayName = 'TerminalPane'

export default TerminalPane
