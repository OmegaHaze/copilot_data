// filepath: /home/vaio/vaio-board/dashboard/client/src/components/Panes/Utility/EnvSocketContext.jsx
import { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import { io } from 'socket.io-client';
import { useError } from '../../../Error-Handling/Diagnostics/ErrorNotificationSystem.jsx';
import { ErrorType, ErrorSeverity } from '../../../Error-Handling/Diagnostics/types/errorTypes';

// Create a context for environment and metrics data
const EnvSocketContext = createContext();

// Hook to access environment socket context
export function useEnvSocket() {
  const context = useContext(EnvSocketContext);
  if (!context) {
    throw new Error("useEnvSocket must be used within an EnvSocketProvider");
  }
  return context;
}

// Socket event constants
const SOCKET_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  CONNECT_ERROR: 'connect_error',
  METRICS_UPDATE: 'metrics_update'
};

// Metrics namespaces - simple mapping
const METRICS_TYPES = ['cpu', 'memory', 'gpu', 'disk', 'network'];

/**
 * Environment Socket Provider Component
 */
export function EnvSocketProvider({ children }) {
  // Metrics data state
  const [metricsData, setMetricsData] = useState({
    cpu: null,
    memory: null,
    gpu: null,
    disk: null,
    network: null
  });
  
  // Socket references
  const socketRefs = useRef({});
  const hostRef = useRef(typeof window !== 'undefined' ? window.location.hostname : 'localhost');
  const mountedRef = useRef(false);
  
  // Get error handler
  const { showError } = useError();
  
  /**
   * Get or create a metrics socket
   */
  const getMetricsSocket = useCallback((type) => {
    if (!METRICS_TYPES.includes(type)) {
      showError(
        `Unknown metrics type: ${type}`,
        ErrorType.SOCKET,
        ErrorSeverity.LOW,
        {
          componentName: 'EnvSocketProvider',
          action: 'getMetricsSocket',
          location: 'MetricsSocket',
          metadata: {
            requestedType: type,
            validTypes: METRICS_TYPES
          }
        }
      );
      console.error(`Unknown metrics type: ${type}`);
      return null;
    }
    
    // Return existing socket if available
    if (socketRefs.current[type] && socketRefs.current[type].connected) {
      return socketRefs.current[type];
    }
    
    // Clean up any existing socket for this type
    if (socketRefs.current[type]) {
      try {
        socketRefs.current[type].disconnect();
        socketRefs.current[type] = null;
      } catch (e) {
        console.warn(`Error cleaning up existing socket for ${type}:`, e);
      }
    }
    
    try {
      const host = hostRef.current;
      const namespace = `/graph-${type}`;
      
      // Create socket with proper options
      const socket = io(`http://${host}:1888${namespace}`, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 10000
      });
      
      // Store reference
      socketRefs.current[type] = socket;
      
      // Set up event handlers
      socket.on(SOCKET_EVENTS.CONNECT, () => {
        console.log(`${type} metrics socket connected`);
      });
      
      socket.on(SOCKET_EVENTS.DISCONNECT, (reason) => {
        console.log(`${type} metrics socket disconnected:`, reason);
      });
      
      socket.on(SOCKET_EVENTS.CONNECT_ERROR, (error) => {
        console.error(`${type} metrics socket connect error:`, error);
        if (mountedRef.current) {
          showError(
            `Failed to connect to ${type} metrics socket: ${error.message}`,
            ErrorType.SOCKET,
            ErrorSeverity.LOW,
            {
              componentName: 'EnvSocketProvider',
              action: 'connectMetricsSocket',
              location: 'MetricsSocket',
              metadata: {
                metricsType: type,
                namespace,
                error: error.toString()
              }
            }
          );
        }
      });
      
      // Handle metrics updates
      socket.on(SOCKET_EVENTS.METRICS_UPDATE, (data) => {
        if (mountedRef.current) {
          setMetricsData(prev => ({
            ...prev,
            [type]: data
          }));
        }
      });
      
      return socket;
    } catch (error) {
      if (mountedRef.current) {
        showError(
          `Failed to create metrics socket for ${type}`,
          ErrorType.SOCKET,
          ErrorSeverity.LOW,
          {
            componentName: 'EnvSocketProvider',
            action: 'createMetricsSocket',
            location: 'MetricsSocket',
            metadata: {
              metricsType: type,
              namespace: `/graph-${type}`,
              host: hostRef.current,
              error: error.toString()
            }
          }
        );
      }
      console.error(`Error creating metrics socket for ${type}:`, error);
      return null;
    }
  }, [showError]);
  
  // Mark component as mounted and set up cleanup
  useEffect(() => {
    mountedRef.current = true;
    
    // Clean up sockets on unmount
    return () => {
      mountedRef.current = false;
      
      // Properly disconnect and clean up all sockets
      Object.entries(socketRefs.current).forEach(([type, socket]) => {
        if (socket) {
          console.log(`Disconnecting ${type} metrics socket`);
          socket.off(SOCKET_EVENTS.CONNECT);
          socket.off(SOCKET_EVENTS.DISCONNECT);
          socket.off(SOCKET_EVENTS.CONNECT_ERROR);
          socket.off(SOCKET_EVENTS.METRICS_UPDATE);
          socket.disconnect();
        }
      });
      
      // Clear the references
      socketRefs.current = {};
    };
  }, []);
  
  // Pre-create sockets for common metrics on first mount
  useEffect(() => {
    // Only create CPU and GPU sockets by default
    // Others will be created on demand
    getMetricsSocket('cpu');
    getMetricsSocket('gpu');
    getMetricsSocket('network');
    // No cleanup needed here - handled by the main useEffect
  }, [getMetricsSocket]);
  
  // Memoize context value to prevent unnecessary re-renders
  const contextValue = {
    metricsData,
    getMetricsSocket
  };
  
  return (
    <EnvSocketContext.Provider value={contextValue}>
      {children}
    </EnvSocketContext.Provider>
  );
}

export { EnvSocketContext };
export default EnvSocketProvider;