// filepath: /home/vaio/vaio-board/dashboard/client/src/components/Panes/Utility/SocketContext.jsx
import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useEnvSocket } from './EnvSocketContext.jsx';

// Create socket context
const SocketContext = createContext();

// Hook to access socket context
export function useSocket() {
  return useContext(SocketContext);
}

/**
 * Strip HTML tags from log streams
 */
function stripHtml(html) {
  if (typeof html !== 'string') return String(html || '');
  return html.replace(/<\/?[^>]+(>|$)/g, "");
}

/**
 * Create a throttled function
 */
function throttle(func, limit) {
  let inThrottle = false;
  let lastArgs = null;
  
  return function(...args) {
    lastArgs = args;
    
    if (!inThrottle) {
      inThrottle = true;
      func.apply(this, args);
      
      setTimeout(() => {
        inThrottle = false;
        if (lastArgs !== args) {
          func.apply(this, lastArgs);
        }
      }, limit);
    }
  };
}

// Socket event constants
const SOCKET_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  CONNECT_ERROR: 'connect_error',
  SERVICE_STATUS: 'service_status',
  LOG_STREAM: 'logStream',
  UNIFIED_LOG: 'unified_log',
  SUPERVISOR_LOG: 'supervisorLogStream',
  PANE_LAUNCHED: 'pane:launched',
  CONNECT_MODULE: 'connect:module'
};

/**
 * Socket Provider Component
 * Manages WebSocket connections and related state
 */
export function SocketProvider({ children }) {
  // Get metrics data from EnvSocketContext
  const { metricsData, getMetricsSocket } = useEnvSocket();
  
  // Socket state
  const hostRef = useRef(typeof window !== 'undefined' ? window.location.hostname : 'localhost');
  const [mainSocket, setMainSocket] = useState(null);
  const [services, setServices] = useState([]);
  const [connected, setConnected] = useState(false);
  const [logStreams, setLogStreams] = useState({});
  const [errorLogs, setErrorLogs] = useState({});
  const [servicesWithErrors, setServicesWithErrors] = useState({});
  
  // Refs
  const socketRefs = useRef({ main: null, namespaces: {} });
  const logBufferRef = useRef({});
  const errorLogBufferRef = useRef({});

  /**
   * Fetch supervisor logs
   */
  const fetchSupervisorLogs = useCallback(async () => {
    try {
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/logs/file?filename=supervisord.log&_t=${timestamp}`);
      
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }
      
      const logContent = await response.text();
      if (logContent) {
        setLogStreams(prev => ({
          ...prev,
          'supervisord.log': logContent
        }));
        
        return logContent;
      }
    } catch (error) {
      console.error('Error fetching supervisor logs:', error);
      throw error;
    }
  }, []);
  
  /**
   * Apply log updates
   */
  const applyLogUpdates = useCallback(throttle(() => {
    // Process logs
    const logBuffer = logBufferRef.current;
    if (Object.keys(logBuffer).length > 0) {
      setLogStreams(prev => {
        const newState = { ...prev };
        
        for (const [service, data] of Object.entries(logBuffer)) {
          const current = newState[service] || '';
          
          // Truncate if too long
          const MAX_LOG_SIZE = 100000;
          const newLog = current.length > MAX_LOG_SIZE 
            ? current.substring(current.length - MAX_LOG_SIZE / 2) + data 
            : current + data;
          
          newState[service] = newLog;
        }
        
        return newState;
      });
      
      logBufferRef.current = {};
    }
    
    // Process error logs
    const errorBuffer = errorLogBufferRef.current;
    if (Object.keys(errorBuffer).length > 0) {
      setErrorLogs(prev => {
        const newState = { ...prev };
        
        for (const [service, logs] of Object.entries(errorBuffer)) {
          if (typeof logs === 'string') {
            const logLines = logs.split('\n').filter(line => line.trim());
            newState[service] = logLines;
          }
        }
        
        return newState;
      });
      
      errorLogBufferRef.current = {};
    }
  }, 300), []);
  
  /**
   * Update log stream
   */
  const updateLogStream = useCallback((serviceName, data) => {
    if (!data || !serviceName) return;
    
    const cleanData = stripHtml(data);
    
    if (cleanData.trim()) {
      const formattedData = cleanData.endsWith('\n') ? cleanData : cleanData + '\n';
      logBufferRef.current[serviceName] = (logBufferRef.current[serviceName] || '') + formattedData;
      applyLogUpdates();
    }
  }, [applyLogUpdates]);
  
  /**
   * Update error log
   */
  const updateErrorLogStream = useCallback((serviceName, data) => {
    if (!data) return;
    
    const cleanData = stripHtml(data);
    const timestamp = new Date().toLocaleTimeString();
    const errorEntry = `[${timestamp}] ${cleanData.trim()}\n`;
    
    logBufferRef.current[serviceName] = (logBufferRef.current[serviceName] || '') + errorEntry;
    applyLogUpdates();
    
    setServicesWithErrors(prev => ({
      ...prev,
      [serviceName]: true
    }));
  }, [applyLogUpdates]);
  
  /**
   * Handle service status updates
   */
  const handleServiceStatusUpdate = useCallback((services) => {
    if (Array.isArray(services)) {
      setServices(services);
    }
  }, []);
  
  /**
   * Handle unified log events
   */
  const handleUnifiedLog = useCallback((data) => {
    if (!data || !data.service || !data.message) return;
    
    const timestamp = new Date(data.timestamp || Date.now()).toLocaleTimeString();
    const level = (data.level || 'info').toUpperCase();
    const formattedLine = `[${timestamp}] [${data.service.toUpperCase()}] [${level}] ${data.message}`;
    
    if (data.level === 'error') {
      setServicesWithErrors(prev => ({
        ...prev,
        [data.service]: true
      }));
    }
    
    updateLogStream(data.service, formattedLine);
  }, [updateLogStream]);
  
  /**
   * Connect to a module namespace
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
      console.error(`Error connecting to module ${moduleType}:`, error);
      return null;
    }
  }, []);
  
  /**
   * Initialize and manage socket
   */
  useEffect(() => {
    const host = hostRef.current;
    
    // Create socket
    const mainSocket = io(`http://${host}:1888`, {
      path: '/socket.io',
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 20000,
      transports: ['websocket', 'polling'],
      forceNew: true,
      reconnection: true,
    });
    
    socketRefs.current.main = mainSocket;
    setMainSocket(mainSocket);
    
    // Event handlers
    const eventHandlers = {
      [SOCKET_EVENTS.CONNECT]: () => {
        console.log('Socket connected');
        setConnected(true);
      },
      
      [SOCKET_EVENTS.DISCONNECT]: () => {
        console.log('Socket disconnected');
        setConnected(false);
      },
      
      [SOCKET_EVENTS.CONNECT_ERROR]: (error) => {
        console.error('Socket error:', error);
      },
      
      [SOCKET_EVENTS.LOG_STREAM]: (data) => {
        if (data?.filename && data?.line) {
          updateLogStream(data.filename.replace('.log', ''), data.line);
        }
      },
      
      [SOCKET_EVENTS.UNIFIED_LOG]: handleUnifiedLog,
      
      [SOCKET_EVENTS.SUPERVISOR_LOG]: (line) => {
        updateLogStream('supervisord.log', line);
      },
      
      [SOCKET_EVENTS.SERVICE_STATUS]: handleServiceStatusUpdate
    };
    
    // Register handlers
    Object.entries(eventHandlers).forEach(([event, handler]) => {
      mainSocket.on(event, handler);
    });
    
    // Fetch services
    fetch('/api/service/services')
      .then(response => response.json())
      .then(services => {
        setServices(services);
      })
      .catch(error => console.error('Failed to fetch services:', error));
    
    // Intervals
    const refreshInterval = setInterval(() => {
      fetchSupervisorLogs().catch(() => {});
    }, 30000);
    
    const updateInterval = setInterval(applyLogUpdates, 500);
    
    // Cleanup
    return () => {
      clearInterval(refreshInterval);
      clearInterval(updateInterval);
      
      Object.entries(eventHandlers).forEach(([event]) => {
        mainSocket.off(event);
      });
      
      if (socketRefs.current.main) {
        socketRefs.current.main.disconnect();
      }
      
      Object.values(socketRefs.current.namespaces).forEach(socket => {
        if (socket) socket.disconnect();
      });
      
      socketRefs.current = { main: null, namespaces: {} };
    };
  }, [
    applyLogUpdates, 
    updateLogStream, 
    fetchSupervisorLogs, 
    handleServiceStatusUpdate,
    handleUnifiedLog
  ]);
  
  // Context value
  const contextValue = {
    socket: mainSocket,
    services,
    connected,
    logStreams,
    errorLogs,
    servicesWithErrors,
    metricsData,
    getMetricsSocket,
    fetchSupervisorLogs,
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