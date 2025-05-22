/**
 * Socket Context and Provider
 * Manages all WebSocket connections and related state for the application.
 * Handles service status, log streams, error tracking, and module connections.
 */

import { createContext, useContext, useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { io } from 'socket.io-client';
import { useError } from '../../../Error-Handling/Diagnostics/ErrorNotificationSystem.jsx';
import { ErrorType, ErrorSeverity } from '../../../Error-Handling/Diagnostics/types/errorTypes';

// ============================================================================
// Context Setup
// ============================================================================

const SocketContext = createContext(null);

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}

// ============================================================================
// Socket Events Configuration
// ============================================================================

/**
 * Constants for all socket events used in the application
 * Centralizes event name management to prevent typos and enable easier updates
 */
const SOCKET_EVENTS = {
  // Core socket events
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  CONNECT_ERROR: 'connect_error',
  
  // Service related events
  SERVICE_STATUS: 'service_status',
  PANE_LAUNCHED: 'pane:launched',
  CONNECT_MODULE: 'connect:module',
  
  // Logging events
  LOG_STREAM: 'logStream',
  UNIFIED_LOG: 'unified_log'
};

/**
 * Main Socket Provider Component
 * Manages WebSocket connections and provides socket functionality to the app
 */
export function SocketProvider({ children }) {
  // ================================
  // State & Refs
  // ================================
  
  const hostRef = useRef(typeof window !== 'undefined' ? window.location.hostname : 'localhost');
  const [mainSocket, setMainSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [services, setServices] = useState([]);
  const [logStreams, setLogStreams] = useState({});
  const [errorLogs, setErrorLogs] = useState({});
  const socketRefs = useRef({ main: null, namespaces: {} });
  const mountedRef = useRef(false);
  
  // Get error handling from ErrorContext
  const { showError } = useError();

  // ================================
  // Service Management
  // ================================
  
  /**
   * Updates the list of available services
   * @param {Array} services - List of service objects
   */
  const handleServiceStatusUpdate = useCallback((services) => {
    if (Array.isArray(services)) {
      setServices(services);
    }
  }, []);

  // ================================
  // Module Connection Management
  // ================================
  
  /**
   * Creates or retrieves a socket connection for a specific module
   * @param {string} moduleType - The type of module to connect to
   * @returns {Socket|null} The socket instance or null if connection fails
   */
  const connectToModule = useCallback((moduleType) => {
    if (!moduleType || !mountedRef.current) return null;
    
    const namespace = `/modules/${moduleType}`;
    const host = hostRef.current;
    
    // Return existing socket if available
    if (socketRefs.current.namespaces[namespace]) {
      return socketRefs.current.namespaces[namespace];
    }
    
    try {
      const socket = io(`http://${host}:1888${namespace}`, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });
      
      // Store in ref for cleanup
      socketRefs.current.namespaces[namespace] = socket;
      
      // Log connection for debugging
      console.log(`Connected to module ${moduleType} on namespace ${namespace}`);
      
      return socket;
    } catch (error) {
      // Use error notification system
      showError(
        `Failed to connect to ${moduleType} module`,
        ErrorType.SOCKET,
        ErrorSeverity.MEDIUM,
        {
          componentName: 'SocketProvider',
          action: 'connectToModule',
          location: 'WebSocket',
          metadata: {
            moduleType,
            namespace,
            host,
            error: error.toString()
          }
        }
      );
      console.error(`Error connecting to module ${moduleType}:`, error);
      return null;
    }
  }, [showError]);

  /**
   * Process unified log events from the server
   */
  const handleUnifiedLog = useCallback((data) => {
    if (!data || !data.service || !data.message || !mountedRef.current) return;
    
    // Process log data
    const service = data.service.replace('.log', '');
    
    // Update log streams
    setLogStreams(prev => {
      const currentLogs = prev[service] || '';
      const formattedLine = `[${data.level || 'INFO'}] ${data.message}\n`;
      return {
        ...prev,
        [service]: currentLogs + formattedLine
      };
    });
    
    // Update error logs if it's an error
    if (data.level === 'error') {
      setErrorLogs(prev => {
        const currentErrors = prev[service] || [];
        return {
          ...prev,
          [service]: [...currentErrors, data.message]
        };
      });
    }
  }, []);

  /**
   * Process regular log stream events
   */
  const handleLogStream = useCallback((data) => {
    if (!data || !data.filename || !data.line || !mountedRef.current) return;
    
    const service = data.filename.replace('.log', '');
    
    setLogStreams(prev => {
      const currentLogs = prev[service] || '';
      return {
        ...prev,
        [service]: currentLogs + data.line
      };
    });
    
    // Check for error keywords
    const errorKeywords = ['error', 'exception', 'fail', 'critical'];
    const isError = errorKeywords.some(keyword => 
      data.line.toLowerCase().includes(keyword)
    );
    
    if (isError) {
      setErrorLogs(prev => {
        const currentErrors = prev[service] || [];
        return {
          ...prev,
          [service]: [...currentErrors, data.line]
        };
      });
    }
  }, []);

  // ================================
  // Socket Lifecycle Management
  // ================================
  
  useEffect(() => {
    // Mark as mounted for cleanup checks
    mountedRef.current = true;
    const host = hostRef.current;
    
    // Define socket creation with proper options
    const createMainSocket = () => {
      const socket = io(`http://${host}:1888`, {
        path: '/socket.io',
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        timeout: 20000,
        transports: ['websocket', 'polling'],
        forceNew: true,
        reconnection: true,
      });
      
      return socket;
    };
    
    // Create the main socket connection
    const mainSocket = createMainSocket();
    socketRefs.current.main = mainSocket;
    setMainSocket(mainSocket);
    
    // Setup event handlers
    const setupEventHandlers = () => {
      // Connection events
      mainSocket.on(SOCKET_EVENTS.CONNECT, () => {
        console.log('Socket connected');
        setConnected(true);
        // Request fresh service status
        mainSocket.emit(SOCKET_EVENTS.SERVICE_STATUS);
      });
      
      mainSocket.on(SOCKET_EVENTS.DISCONNECT, (reason) => {
        console.log('Socket disconnected:', reason);
        setConnected(false);
        // Clear service state on disconnect to prevent stale data
        setServices([]);
        
        // Only show error for unexpected disconnects
        const unexpectedDisconnects = ['transport close', 'transport error', 'server namespace disconnect'];
        if (unexpectedDisconnects.includes(reason) && mountedRef.current) {
          showError(
            `Socket disconnected: ${reason}`,
            ErrorType.SOCKET,
            ErrorSeverity.MEDIUM,
            {
              componentName: 'SocketProvider',
              action: 'socketDisconnect',
              location: 'WebSocket',
              metadata: {
                reason,
                wasConnected: connected
              }
            }
          );
        }
      });
      
      mainSocket.on(SOCKET_EVENTS.CONNECT_ERROR, (error) => {
        // Only show error if component is still mounted
        if (mountedRef.current) {
          showError(
            `Socket connection error: ${error.message || 'Failed to connect to server'}`,
            ErrorType.SOCKET,
            ErrorSeverity.MEDIUM,
            {
              componentName: 'SocketProvider',
              action: 'socketConnect',
              location: 'WebSocket',
              metadata: {
                error: error.toString()
              }
            }
          );
        }
        console.error('Socket error:', error);
        setConnected(false);
      });
      
      // Service events
      mainSocket.on(SOCKET_EVENTS.SERVICE_STATUS, handleServiceStatusUpdate);
      
      // Log handling
      mainSocket.on(SOCKET_EVENTS.LOG_STREAM, handleLogStream);
      mainSocket.on(SOCKET_EVENTS.UNIFIED_LOG, handleUnifiedLog);
    };
    
    // Set up the event handlers
    setupEventHandlers();
    
    // Initial services request
    mainSocket.emit('request:services');
    
    // Return cleanup function
    return () => {
      // Mark as unmounted to prevent state updates
      mountedRef.current = false;
      
      // Remove all event handlers
      if (mainSocket) {
        mainSocket.off(SOCKET_EVENTS.CONNECT);
        mainSocket.off(SOCKET_EVENTS.DISCONNECT);
        mainSocket.off(SOCKET_EVENTS.CONNECT_ERROR);
        mainSocket.off(SOCKET_EVENTS.SERVICE_STATUS);
        mainSocket.off(SOCKET_EVENTS.LOG_STREAM);
        mainSocket.off(SOCKET_EVENTS.UNIFIED_LOG);
        mainSocket.disconnect();
      }
      
      // Clean up namespace sockets
      Object.values(socketRefs.current.namespaces).forEach(socket => {
        if (socket) {
          socket.disconnect();
        }
      });
      
      // Reset socket refs
      socketRefs.current = { main: null, namespaces: {} };
    };
  }, [handleServiceStatusUpdate, handleLogStream, handleUnifiedLog, connected, showError]);

  // Context value with all socket functionality
  const contextValue = useMemo(() => ({
    // Socket instances
    socket: mainSocket,
    
    // State
    services,
    connected,
    logStreams,
    errorLogs,
    
    // Methods
    connectToModule,
    
    // Log handling methods
    handleUnifiedLog,
    handleLogStream
  }), [
    mainSocket, 
    services, 
    connected, 
    logStreams, 
    errorLogs, 
    connectToModule, 
    handleUnifiedLog, 
    handleLogStream
  ]);

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
}

export { SocketContext };
export default SocketProvider;