// filepath: /home/vaio/vaio-board/dashboard/client/src/components/Panes/Utility/Pane/SupervisorPane.jsx
import PaneHeader from '../PaneHeader'
import { useEffect, useState, useRef, useCallback } from 'react'
import { useSocket } from '../SocketContext'

export default function SupervisorPane({
  slug,
  name,
  status,
  logo,
  moduleData
}) {
  const [logs, setLogs] = useState('')
  const [localStatus, setLocalStatus] = useState(status || 'UNKNOWN')
  const terminalRef = useRef(null)
  // Reference to track if logs are currently being fetched to avoid race conditions
  const fetchingRef = useRef(false)
  
  // Use safe default values to prevent errors if context is missing
  const socketContext = useSocket() || {}
  const socket = socketContext.socket
  const logStreams = socketContext.logStreams || {}
  const socketFetchLogs = socketContext.fetchSupervisorLogs
  
  // Create a fallback fetcher in case the socket context doesn't provide one
  const fetchSupervisorLogs = useCallback(async () => {
    try {
      // Try the socket context method first if available
      if (socketFetchLogs && typeof socketFetchLogs === 'function') {
        return await socketFetchLogs()
      }
      
      // Fall back to direct HTTP request
      console.log('[SupervisorPane] Using fallback HTTP request for supervisor logs')
      
      // Add timestamp to prevent caching issues
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/logs/file?filename=supervisord.log&_t=${timestamp}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch logs: ${response.status} ${response.statusText}`)
      }
      
      const logContent = await response.text()
      console.log(`[SupervisorPane] Fetched ${logContent.length} bytes of logs via HTTP`)
      
      // Update state directly
      setLogs(logContent)
      return logContent
    } catch (error) {
      console.error('[SupervisorPane] Error in fetchSupervisorLogs:', error)
      
      // Set error message in logs state
      const errorMessage = 
        `Failed to fetch supervisor logs: ${error.message}\n` +
        `Please check that the backend server is running and that supervisord.log exists in one of these locations:\n` +
        `- /home/vaio/vaio-board/workspace/logs/\n` +
        `- /home/vaio/vaio-board/workspace/supervisor/\n\n` +
        `You may need to restart the supervisor service.`;
      
      setLogs(errorMessage);
      throw error;
    }
  }, [socketFetchLogs, setLogs])
  
  // Log component rendering for debugging
  useEffect(() => {
    console.log('SupervisorPane component mounted:', { slug, name, status, moduleData })
    
    // Register with window for debugging
    if (typeof window !== 'undefined') {
      if (!window.SupervisorPane) {
        window.SupervisorPane = { renderCount: 1, lastProps: { slug, name, status, moduleData } }
      } else {
        window.SupervisorPane.renderCount += 1
        window.SupervisorPane.lastProps = { slug, name, status, moduleData }
      }
    }
  }, [slug, name, status, moduleData])

  // Use moduleType from moduleData (previously unused 'type' variable)
  const moduleType = moduleData?.module_type || 'system' // fallback if not explicitly set

  // Force supervisor connection on mount and fetch logs if needed
  useEffect(() => {
    // Define async function to load logs safely
    const loadLogs = async () => {
      if (fetchingRef.current) return;
      fetchingRef.current = true;
      
      console.log('[SupervisorPane] Fetching supervisor logs on mount');
      try {
        await fetchSupervisorLogs();
      } catch (error) {
        console.error('[SupervisorPane] Error fetching supervisor logs:', error);
        setLogs('Unable to fetch supervisor logs. Please check if the supervisor service is running.');
      } finally {
        fetchingRef.current = false;
      }
    };
    
    if (socket && typeof socket.emit === 'function') {
      console.log('[SupervisorPane] Requesting supervisor status on mount');
      socket.emit('getStatus', { name: 'supervisor', moduleType: 'supervisor' });
      
      // Only fetch logs once on mount, then rely on socket updates
      if (fetchSupervisorLogs && !fetchingRef.current) {
        loadLogs();
      }
    }
    
    // Cleanup function that runs when component unmounts
    return () => {
      console.log('[SupervisorPane] Unmounting and cleaning up');
      // Set the fetchingRef to false to prevent any stale references
      fetchingRef.current = false;
    };
  }, [socket, fetchSupervisorLogs, setLogs])

  // Handle status updates from socket
  useEffect(() => {
    if (!socket) return
    
    const handleStatusUpdate = (data) => {
      if (data.name === 'supervisor') {
        console.log('[SupervisorPane] Received status update:', data)
        setLocalStatus(data.status)
      }
    }
    
    socket.on('statusUpdate', handleStatusUpdate)
    
    return () => {
      socket.off('statusUpdate', handleStatusUpdate)
    }
  }, [socket])

  // Subscribe to log updates from the context's logStreams
  useEffect(() => {
    // Debug the current log streams
    console.debug('[SupervisorPane] Available log streams:', 
      Object.keys(logStreams || {}), 
      'Looking for supervisord.log')
    
    // Only update when the log content changes and is different from what we have
    const supervisorLog = logStreams?.['supervisord.log']
    if (supervisorLog && supervisorLog !== logs) {
      console.log('[SupervisorPane] Updating logs with length:', supervisorLog.length)
      setLogs(supervisorLog)
    }
  }, [logStreams])

  useEffect(() => {
    const el = terminalRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [logs])

  return (
    <div className="bg-black rounded border border-green-600 shadow-inner overflow-hidden w-full h-full flex flex-col">
      <PaneHeader name={name} status={localStatus} logo={logo} moduleType={moduleType} />
      <div
        ref={terminalRef}
        className="flex-grow overflow-y-auto mt-1 text-green-200 bg-black border-t border-green-700 p-2 scroll-panel text-[10px] leading-tight font-mono whitespace-pre-wrap shadow-inner"
      >
        {!logs ? (
          <div className="text-center p-4 text-yellow-300">
            Loading supervisor logs...
          </div>
        ) : typeof logs === 'string' && logs.length > 0 ? (
          logs.includes('Log file not available') ? (
            // Display the log file not found message in a user-friendly way
            <div className="text-amber-300 p-4">
              <div className="font-bold mb-2">⚠️ Supervisor Log Not Available</div>
              <div className="text-amber-200/80 whitespace-pre-wrap">{logs}</div>
              <div className="mt-4 text-green-300 text-xs">
                Check if supervisor is running or create the log file in one of the expected locations.
              </div>
            </div>
          ) : (
            // Process logs with additional guards against duplicate content
            logs
              .split('\n')
              .filter(line => line.trim() !== '')
              // Deduplicate the repeated "supervisor" entries by filtering consecutive duplicates
              .reduce((unique, item, index, array) => {
                // Only add this line if it's not the same as several previous consecutive lines
                if (index === 0 || item !== array[index - 1] || 
                    (index > 5 && array.slice(index-5, index).every(l => l !== item))) {
                  unique.push(item)
                }
                return unique
              }, [])
              // Limit to 500 lines to prevent excessive DOM nodes
              .slice(-500)
              .map((line, i) => {
                // Create a more unique key based on content hash and index
                const key = `${i}-${line.slice(0, 20).replace(/\s/g, '')}`
                return (
                  <div key={key} className="opacity-80 hover:opacity-100">
                    {line}
                  </div>
                )
              })
          )
        ) : (
          <div className="text-center opacity-50 mt-4">
            <div>░░░ Awaiting supervisor logs ░░░</div>
            <div className="mt-2 text-green-400">{localStatus === 'UNKNOWN' ? 'Connecting...' : `Status: ${localStatus}`}</div>
          </div>
        )}
      </div>
    </div>
  )
}
