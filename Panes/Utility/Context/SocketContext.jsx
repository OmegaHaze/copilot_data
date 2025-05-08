/**
 * Socket Context and Provider
 * Manages all WebSocket connections and related state for the application.
 * Handles service status, log streams, error tracking, and module connections.
 */

import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useEnvSocket } from './EnvSocketContext.jsx';
import { useLog } from './LogContext.jsx';
import { errorHandler } from '../../../Error-Handling/utils/errorHandler';
import { ErrorType, ErrorSeverity } from '../../../Error-Handling/Diagnostics/types/errorTypes';

// ============================================================================
// Context Setup
// ============================================================================

const SocketContext = createContext();

export function useSocket() {
  return useContext(SocketContext);
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
  
  // Get metrics data from EnvSocketContext
  const { metricsData, getMetricsSocket } = useEnvSocket();
  
  // Get log handling from LogContext
  const { updateLogStream, handleUnifiedLog } = useLog();
  
  // Core socket state
  const hostRef = useRef(typeof window !== 'undefined' ? window.location.hostname : 'localhost');
  const [mainSocket, setMainSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  
  // Service tracking
  const [services, setServices] = useState([]);
  
  // Reference storage
  const socketRefs = useRef({ main: null, namespaces: {} });

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
    if (!moduleType) return null;
    
    const namespace = `/modules/${moduleType}`;
    const host = hostRef.current;
    
    if (socketRefs.current.namespaces[namespace]) {
      return socketRefs.current.namespaces[namespace];
    }
    
    try {
      const socket = io(`http://${host}:1888${namespace}`, {
        transports: ['websocket', 'polling']
      });
      
      socketRefs.current.namespaces[namespace] = socket;
      return socket;
    } catch (error) {
      errorHandler.showError(
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
            error: error.toString(),
            stack: error.stack
          }
        }
      );
      console.error(`Error connecting to module ${moduleType}:`, error);
      return null;
    }
  }, []);

  // ================================
  // Socket Lifecycle Management
  // ================================
  
  useEffect(() => {
    const host = hostRef.current;
    
    const mainSocket = io(`http://${host}:1888`, {
      path: '/socket.io',
      reconnectionAttempts: Infinity, // Keep trying to reconnect indefinitely
      reconnectionDelay: 1000,
      timeout: 20000,
      transports: ['websocket', 'polling'],
      forceNew: true,
      reconnection: true,
    });
    
    socketRefs.current.main = mainSocket;
    setMainSocket(mainSocket);
    
    const eventHandlers = {
      [SOCKET_EVENTS.CONNECT]: () => {
        console.log('Socket connected');
        setConnected(true);
        // Clear any previous error state and request fresh service status
        mainSocket.emit(SOCKET_EVENTS.SERVICE_STATUS);
      },
      
      [SOCKET_EVENTS.DISCONNECT]: (reason) => {
        console.log('Socket disconnected:', reason);
        setConnected(false);
        // Clear service state on disconnect to prevent stale data
        setServices([]);
        
        // Only show error for unexpected disconnects
        const unexpectedDisconnects = ['transport close', 'transport error', 'server namespace disconnect'];
        if (unexpectedDisconnects.includes(reason)) {
          errorHandler.showError(
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
      },
      
      [SOCKET_EVENTS.CONNECT_ERROR]: (error) => {
        // Use standardized error handler
        errorHandler.showError(
          `Socket connection error: ${error.message || 'Failed to connect to server'}`,
          ErrorType.SOCKET,
          ErrorSeverity.MEDIUM,
          {
            componentName: 'SocketProvider',
            action: 'socketConnect',
            location: 'WebSocket',
            metadata: {
              error: error.toString(),
              stack: error.stack
            }
          }
        );
        console.error('Socket error:', error);
        setConnected(false);
      },
      
      // Log handling events
      [SOCKET_EVENTS.LOG_STREAM]: (data) => {
        if (data?.filename && data?.line) {
          updateLogStream(data.filename.replace('.log', ''), data.line);
        }
      },
      [SOCKET_EVENTS.UNIFIED_LOG]: handleUnifiedLog,
      
      // Service events
      [SOCKET_EVENTS.SERVICE_STATUS]: handleServiceStatusUpdate
    };
    
    // Register all event handlers
    Object.entries(eventHandlers).forEach(([event, handler]) => {
      mainSocket.on(event, handler);
    });
    
    /**
     * Initial services request
     */
    mainSocket.emit('request:services');
    
    /**
     * Cleanup function
     */
    return () => {
      // Remove all event handlers
      Object.entries(eventHandlers).forEach(([event]) => {
        mainSocket.off(event);
      });
      
      // Disconnect all sockets
      if (socketRefs.current.main) {
        socketRefs.current.main.disconnect();
      }
      Object.values(socketRefs.current.namespaces).forEach(socket => {
        if (socket) socket.disconnect();
      });
      
      // Reset socket refs
      socketRefs.current = { main: null, namespaces: {} };
    };
  }, [updateLogStream, handleServiceStatusUpdate, handleUnifiedLog]);

  const contextValue = {
    // Socket instances
    socket: mainSocket,
    
    // Service state
    services,
    connected,
    
    // Metrics integration
    metricsData,
    getMetricsSocket,
    
    // Public methods
    connectToModule
  };

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
}

export { SocketContext };
export default SocketProvider;