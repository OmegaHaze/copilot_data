// filepath: /home/vaio/vaio-board/dashboard/client/src/components/Panes/Utility/SocketContext.jsx
import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

// Create a context for socket connections and data
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

/**
 * Socket Provider Component
 * Manages WebSocket connections and related state
 */
export function SocketProvider({ children }) {
  // Get hostname from browser
  const hostRef = useRef(typeof window !== 'undefined' ? window.location.hostname : 'localhost');
  
  // Socket connection state
  const [mainSocket, setMainSocket] = useState(null);
  const [services, setServices] = useState([]);
  const [connected, setConnected] = useState(false);
  const [logStreams, setLogStreams] = useState({});
  const [errorLogs, setErrorLogs] = useState({});
  const [servicesWithErrors, setServicesWithErrors] = useState({});
  const [metricsData, setMetricsData] = useState({
    cpu: null,
    memory: null,
    gpu: null,
    disk: null,
    network: null
  });
  
  // Refs for tracking resources
  const socketRefs = useRef({
    main: null,
    namespaces: {}
  });
  
  // Buffers for batching updates
  const logBufferRef = useRef({});
  const errorLogBufferRef = useRef({});

  /**
   * Fetch supervisor logs from backend
   */
  const fetchSupervisorLogs = useCallback(async () => {
    try {
      // Add cache-busting timestamp
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/logs/file?filename=supervisord.log&_t=${timestamp}`);
      
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }
      
      const logContent = await response.text();
      if (logContent) {
        // Update log streams
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
   * Apply buffered log updates in a throttled manner
   */
  const applyLogUpdates = useCallback(throttle(() => {
    // Process regular logs
    const logBuffer = logBufferRef.current;
    if (Object.keys(logBuffer).length > 0) {
      setLogStreams(prev => {
        const newState = { ...prev };
        
        for (const [service, data] of Object.entries(logBuffer)) {
          const current = newState[service] || '';
          
          // Truncate log if it gets too long
          const MAX_LOG_SIZE = 100000;
          const newLog = current.length > MAX_LOG_SIZE 
            ? current.substring(current.length - MAX_LOG_SIZE / 2) + data 
            : current + data;
          
          newState[service] = newLog;
        }
        
        return newState;
      });
      
      // Clear the buffer after processing
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
      
      // Clear the buffer after processing
      errorLogBufferRef.current = {};
    }
  }, 300), []);
  
  /**
   * Update log stream for a specific service
   */
  const updateLogStream = useCallback((serviceName, data) => {
    if (!data || !serviceName) return;
    
    // Clean and normalize the data
    const cleanData = stripHtml(data);
    
    // Only add to buffer if data actually has content
    if (cleanData.trim()) {
      // Add a line break if it doesn't already end with one
      const formattedData = cleanData.endsWith('\n') ? cleanData : cleanData + '\n';
      
      // Add to buffer
      logBufferRef.current[serviceName] = (logBufferRef.current[serviceName] || '') + formattedData;
      applyLogUpdates();
    }
  }, [applyLogUpdates]);
  
  /**
   * Update error log stream for a specific service
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
   * Handle service status updates from socket events
   */
  const handleServiceStatusUpdate = useCallback((services) => {
    if (!Array.isArray(services)) return;
    
    setServices(prevServices => {
      // Ensure all services have a module_type property
      const enhancedServices = services.map(service => {
        // If module_type is already provided from backend, use it
        if (service.module_type) {
          return service;
        }
        
        // Otherwise, try to determine it from the service name
        let moduleType = "service"; // Default type
        
        // Check for known system modules
        if (service.name.toLowerCase() === "supervisor" || 
            service.name.toLowerCase() === "system") {
          moduleType = "system";
        } 
        // Check for user modules (custom logic if needed)
        else if (service._isUserPane) {
          moduleType = "user";
        }
        
        return {
          ...service,
          module_type: moduleType
        };
      });
      
      // Skip update if nothing changed
      if (JSON.stringify(enhancedServices) === JSON.stringify(prevServices)) {
        return prevServices;
      }
      
      return enhancedServices;
    });
  }, []);
  
  /**
   * Handle unified log events
   */
  const handleUnifiedLog = useCallback((data) => {
    if (!data || !data.service || !data.message) return;
    
    // Format the timestamp
    const timestamp = new Date(data.timestamp || Date.now()).toLocaleTimeString();
    
    // Determine log level
    const level = (data.level || 'info').toUpperCase();
    
    // Create a formatted line
    const formattedLine = `[${timestamp}] [${data.service.toUpperCase()}] [${level}] ${data.message}`;
    
    // Track errors for UI indicators
    if (data.level === 'error') {
      setServicesWithErrors(prev => ({
        ...prev,
        [data.service]: true
      }));
    }
    
    // Add to the log stream
    updateLogStream(data.service, formattedLine);
  }, [updateLogStream]);
  
  /**
   * Main effect for socket initialization and management
   */
  useEffect(() => {
    const host = hostRef.current;
    
    // Create main socket
    const mainSocket = io(`http://${host}:1888`, {
      path: '/socket.io',
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 20000,
      transports: ['websocket', 'polling'],
      forceNew: true,
      reconnection: true,
    });
    
    // Store socket reference
    socketRefs.current.main = mainSocket;
    setMainSocket(mainSocket);
    
    // Set up event listeners
    mainSocket.on('connect', () => {
      console.log('Main socket connected');
      setConnected(true);
    });
    
    mainSocket.on('connect_error', (error) => {
      console.error('Main socket connection error:', error);
    });
    
    mainSocket.on('disconnect', (reason) => {
      console.log(`Main socket disconnected. Reason: ${reason}`);
      setConnected(false);
    });
    
    // Log stream handlers
    mainSocket.on('logStream', (data) => {
      if (data && data.filename && data.line) {
        updateLogStream(data.filename.replace('.log', ''), data.line);
      }
    });
    
    // Unified log handler
    mainSocket.on('unified_log', handleUnifiedLog);
    
    // Supervisor log handler
    mainSocket.on('supervisorLogStream', (line) => {
      // Update log streams directly
      updateLogStream('supervisord.log', line);
    });
    
    // Service status handlers
    mainSocket.on('service_status_update', handleServiceStatusUpdate);
    mainSocket.on('service_status', handleServiceStatusUpdate);
    
    // Fetch services once via REST API
    fetch('/api/service/services')
      .then(response => response.json())
      .then(services => {
        setServices(services);
      })
      .catch(error => console.error('Failed to fetch services:', error));
    
    // Refresh supervisor logs periodically
    const refreshInterval = setInterval(() => {
      fetchSupervisorLogs().catch(() => {});
    }, 30000);
    
    // Update logs display periodically
    const updateInterval = setInterval(applyLogUpdates, 500);
    
    // Cleanup function
    return () => {
      clearInterval(refreshInterval);
      clearInterval(updateInterval);
      
      // Clean up main socket
      if (socketRefs.current.main) {
        socketRefs.current.main.disconnect();
      }
      
      // Clean up namespace sockets
      Object.values(socketRefs.current.namespaces).forEach(socket => {
        if (socket) {
          socket.disconnect();
        }
      });
      
      // Clear references
      socketRefs.current = {
        main: null,
        namespaces: {}
      };
    };
  }, [
    applyLogUpdates, 
    updateLogStream, 
    fetchSupervisorLogs, 
    handleServiceStatusUpdate,
    handleUnifiedLog
  ]);
  
  /**
   * Get or create a metrics socket for a specific type
   */
  const getMetricsSocket = useCallback((type) => {
    if (!type) {
      console.error('getMetricsSocket called without a type parameter');
      return null;
    }
    
    const METRICS_NAMESPACES = {
      cpu: '/graph-cpu',
      memory: '/graph-memory',
      gpu: '/graph-nvidia',
      disk: '/graph-disk',
      network: '/graph-network'
    };
    
    const namespace = METRICS_NAMESPACES[type];
    if (!namespace) {
      console.error(`Unknown metrics type: ${type}`);
      return null;
    }
    
    // Check if we already have a connection
    if (socketRefs.current.namespaces[namespace]) {
      return socketRefs.current.namespaces[namespace];
    }
    
    try {
      // Create a new socket connection
      const metricsSocket = io(namespace, {
        transports: ['websocket', 'polling'],
        forceNew: false,
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000
      });
      
      // Store reference
      socketRefs.current.namespaces[namespace] = metricsSocket;
      
      // Set up event handlers
      metricsSocket.on('connect', () => {
        console.log(`${type} metrics socket connected`);
      });
      
      metricsSocket.on('connect_error', (error) => {
        console.error(`${type} metrics socket connection error:`, error);
      });
      
      // Handle metrics updates
      metricsSocket.on('metrics_update', (data) => {
        setMetricsData(prev => ({
          ...prev,
          [type]: data
        }));
      });
      
      return metricsSocket;
    } catch (error) {
      console.error(`Error creating ${type} metrics socket:`, error);
      return null;
    }
  }, []);
  
  // Context value to provide
  const contextValue = {
    socket: mainSocket,
    services,
    connected,
    logStreams,
    errorLogs,
    servicesWithErrors,
    metricsData,
    getMetricsSocket,
    fetchSupervisorLogs
  };
  
  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
}

export { SocketContext };
export default SocketProvider;