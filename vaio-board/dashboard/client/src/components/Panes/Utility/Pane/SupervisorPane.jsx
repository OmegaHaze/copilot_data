// SupervisorPane.jsx - Moved to standard component loading approach
import React, { useEffect, useState, useRef, useCallback } from 'react';
import PaneHeader from '../PaneHeader';
import { useSocket } from '../SocketContext';

export default function SupervisorPane({
  slug,
  name,
  status,
  logo,
  moduleData
}) {
  const [logs, setLogs] = useState('');
  const [localStatus, setLocalStatus] = useState(status || 'UNKNOWN');
  const terminalRef = useRef(null);
  const fetchingRef = useRef(false); // Prevent multiple simultaneous fetches
  const mountedRef = useRef(false); // Track if component is mounted
  const errorShownRef = useRef(false); // Track if we've shown an error message
  
  // Use safe default values to prevent errors if context is missing
  const socketContext = useSocket() || {};
  const socket = socketContext.socket;
  const logStreams = socketContext.logStreams || {};
  const socketFetchLogs = socketContext.fetchSupervisorLogs;
  
  // Create a fallback fetcher in case the socket context doesn't provide one
  const fetchSupervisorLogs = useCallback(async () => {
    if (fetchingRef.current || !mountedRef.current) return null;
    
    fetchingRef.current = true;
    
    try {
      // Try the socket context method first if available
      if (socketFetchLogs && typeof socketFetchLogs === 'function') {
        const result = await socketFetchLogs();
        if (mountedRef.current) {
          return result;
        }
        return null;
      }
      
      // Fall back to direct HTTP request
      console.log('[SupervisorPane] Using fallback HTTP request for supervisor logs');
      
      // Add timestamp to prevent caching issues
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/logs/file?filename=supervisord.log&_t=${timestamp}`);
      
      // Only update state if component is still mounted
      if (!mountedRef.current) return null;
      
      if (!response.ok) {
        // For 404 specifically, show a more helpful message
        if (response.status === 404) {
          const message = "The supervisord.log file could not be found. Please verify that supervisor is running and writing logs to the expected location.";
          setLogs(message);
          return message;
        }
        
        throw new Error(`Failed to fetch logs: ${response.status} ${response.statusText}`);
      }
      
      const logContent = await response.text();
      
      // Only update state if component is still mounted
      if (mountedRef.current) {
        console.log(`[SupervisorPane] Fetched ${logContent.length} bytes of logs via HTTP`);
        setLogs(logContent);
        return logContent;
      }
      
      return null;
    } catch (error) {
      // Only update state if component is still mounted
      if (!mountedRef.current) return null;
      
      console.error('[SupervisorPane] Error in fetchSupervisorLogs:', error);
      
      // Only show error once to avoid endless retries
      if (!errorShownRef.current) {
        errorShownRef.current = true;
        
        const errorMessage = 
          `Failed to fetch supervisor logs: ${error.message}\n` +
          `Please check that the backend server is running and that supervisord.log exists.`;
        
        setLogs(errorMessage);
      }
      
      return null;
    } finally {
      fetchingRef.current = false;
    }
  }, [socketFetchLogs]);
  
  // Mark component as mounted/unmounted to prevent state updates after unmounting
  useEffect(() => {
    console.log('SupervisorPane component mounted:', { slug, name, status, moduleData });
    mountedRef.current = true;
    
    return () => {
      console.log('[SupervisorPane] Unmounting and cleaning up');
      mountedRef.current = false;
      fetchingRef.current = false;
    };
  }, [slug, name, status, moduleData]);

  // Use moduleType from moduleData
  const moduleType = moduleData?.module_type || 'system'; // fallback if not explicitly set

  // Fetch logs only ONCE on mount
  useEffect(() => {
    if (!mountedRef.current) return;
    
    // Define async function to load logs safely
    const loadLogs = async () => {
      if (fetchingRef.current) return;
      
      console.log('[SupervisorPane] Fetching supervisor logs on mount');
      try {
        await fetchSupervisorLogs();
      } catch (error) {
        console.error('[SupervisorPane] Error fetching supervisor logs:', error);
        if (mountedRef.current) {
          setLogs('Unable to fetch supervisor logs. Please check if the supervisor service is running.');
        }
      }
    };
    
    if (socket && typeof socket.emit === 'function') {
      console.log('[SupervisorPane] Requesting supervisor status on mount');
      socket.emit('getStatus', { name: 'supervisor', moduleType: 'supervisor' });
    }
    
    // Load logs once on mount
    loadLogs();
    
    // No cleanup needed - we use mountedRef
  }, [socket, fetchSupervisorLogs]);

  // Handle status updates from socket
  useEffect(() => {
    if (!socket || !mountedRef.current) return;
    
    const handleStatusUpdate = (data) => {
      if (!mountedRef.current) return;
      
      if (data.name === 'supervisor') {
        console.log('[SupervisorPane] Received status update:', data);
        setLocalStatus(data.status);
      }
    };
    
    socket.on('statusUpdate', handleStatusUpdate);
    
    return () => {
      socket.off('statusUpdate', handleStatusUpdate);
    };
  }, [socket]);

  // Subscribe to log updates from the context's logStreams - only update once per render cycle
  useEffect(() => {
    if (!mountedRef.current) return;
    
    // Debug the current log streams
    console.debug('[SupervisorPane] Available log streams:', 
      Object.keys(logStreams || {}), 
      'Looking for supervisord.log');
    
    // Only update when the log content changes and is different from what we have
    const supervisorLog = logStreams?.['supervisord.log'];
    if (supervisorLog && supervisorLog !== logs) {
      console.log('[SupervisorPane] Updating logs with length:', supervisorLog.length);
      setLogs(supervisorLog);
    }
  }, [logStreams, logs]);

  // Auto-scroll the terminal to the bottom when logs update
  useEffect(() => {
    if (!mountedRef.current) return;
    
    const el = terminalRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [logs]);

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
          logs.includes('Failed to fetch supervisor logs') ? (
            // Display the error message in a user-friendly way
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
              // Deduplicate the repeated entries
              .reduce((unique, item, index, array) => {
                // Only add if it's not the same as the previous line
                if (index === 0 || item !== array[index - 1]) {
                  unique.push(item);
                }
                return unique;
              }, [])
              // Limit to 500 lines to prevent excessive DOM nodes
              .slice(-500)
              .map((line, i) => (
                <div key={`log-${i}`} className="opacity-80 hover:opacity-100">
                  {line}
                </div>
              ))
          )
        ) : (
          <div className="text-center opacity-50 mt-4">
            <div>░░░ Awaiting supervisor logs ░░░</div>
            <div className="mt-2 text-green-400">{localStatus === 'UNKNOWN' ? 'Connecting...' : `Status: ${localStatus}`}</div>
          </div>
        )}
      </div>
    </div>
  );
}