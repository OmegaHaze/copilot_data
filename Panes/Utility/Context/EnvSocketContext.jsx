// filepath: /home/vaio/vaio-board/dashboard/client/src/components/Panes/Utility/EnvSocketContext.jsx
import { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import { io } from 'socket.io-client';
import { errorHandler } from '../../../Error-Handling/utils/errorHandler';
import { ErrorType, ErrorSeverity } from '../../../Error-Handling/Diagnostics/types/errorTypes';

// Create a context for environment and metrics data
const EnvSocketContext = createContext();

// Hook to access environment socket context
export function useEnvSocket() {
  return useContext(EnvSocketContext);
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
  
  /**
   * Get or create a metrics socket
   */
  const getMetricsSocket = useCallback((type) => {
    if (!METRICS_TYPES.includes(type)) {
      errorHandler.showError(
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
    if (socketRefs.current[type]) {
      return socketRefs.current[type];
    }
    
    try {
      const host = hostRef.current;
      const namespace = `/graph-${type}`;
      
      // Create socket
      const socket = io(`http://${host}:1888${namespace}`, {
        transports: ['websocket', 'polling']
      });
      
      // Store reference
      socketRefs.current[type] = socket;
      
      // Handle metrics updates
      socket.on(SOCKET_EVENTS.METRICS_UPDATE, (data) => {
        setMetricsData(prev => ({
          ...prev,
          [type]: data
        }));
      });
      
      return socket;
    } catch (error) {
      errorHandler.showError(
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
            error: error.toString(),
            stack: error.stack
          }
        }
      );
      console.error(`Error creating metrics socket for ${type}:`, error);
      return null;
    }
  }, []);
  
  // Clean up sockets on unmount
  useEffect(() => {
    return () => {
      Object.values(socketRefs.current).forEach(socket => {
        if (socket) socket.disconnect();
      });
      socketRefs.current = {};
    };
  }, []);
  
  // Context value
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