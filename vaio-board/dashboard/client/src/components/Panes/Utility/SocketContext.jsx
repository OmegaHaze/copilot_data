// filepath: /home/vaio/vaio-board/dashboard/client/src/components/Panes/Utility/SocketContext.jsx
import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

// Create a context for the socket and status updates
const SocketContext = createContext();

// Configuration options
const CONFIG = {
  DEBUG_LOG_STREAMS: false,
  DEBUG_SOCKET: false,
  MAX_LOG_SIZE: 2000,
  SERVICE_REFRESH_INTERVAL: 30000, // 30 seconds
  LOG_UPDATE_INTERVAL: 500,
  METRICS_NAMESPACES: {
    cpu: '/graph-cpu',
    memory: '/graph-memory',
    gpu: '/graph-nvidia',
    disk: '/graph-disk',
    network: '/graph-network'
  },
  SERVICE_NAME_MAPPING: {
    'dashboard-server': 'vite',
    'vaio-backend': 'python'
  }
};

/**
 * Hook to access socket context
 */
export function useSocket() {
  return useContext(SocketContext);
}

/**
 * Strip HTML tags from log streams
 * @param {string} html - Text that may contain HTML tags
 * @returns {string} - Cleaned text
 */
function stripHtml(html) {
  if (typeof html !== 'string') return String(html || '');
  return html.replace(/<\/?[^>]+(>|$)/g, "");
}

/**
 * Create a throttled function
 * @param {Function} func - Function to throttle
 * @param {number} limit - Throttle time in ms
 * @returns {Function} - Throttled function
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
  // Get the hostname dynamically from the browser - using a ref for stability
  const hostRef = useRef(typeof window !== 'undefined' ? window.location.hostname : 'localhost');
  
  // State for socket connections and data
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
   * Fetch service status from REST API (backup method)
   */
  const fetchServiceStatus = useCallback(async () => {
    try {
      console.log('Fetching service status via REST API...');
      const response = await fetch(`/api/service/status?t=${Date.now()}`);
      
      if (!response.ok) {
        const text = await response.text();
        console.error(`Service status API error (${response.status}):`, text);
        return null;
      }
      
      const data = await response.json();
      if (CONFIG.DEBUG_SOCKET) console.log('API service status response:', data);
      
      if (data && Array.isArray(data)) {
        setServices(data);
        return data;
      }
      return null;
    } catch (error) {
      console.error('Error fetching service status:', error);
      return null;
    }
  }, []);
  
  /**
   * Fetch supervisor logs from backend (for initial loading)
   */
  const fetchSupervisorLogs = useCallback(async () => {
    try {
      console.log('Fetching supervisor logs via REST API...');
      
      // Add cache-busting timestamp for fresh results
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/logs/file?filename=supervisord.log&_t=${timestamp}`);
      
      if (!response.ok) {
        console.error(`Failed to fetch supervisor logs (${response.status})`);
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }
      
      const logContent = await response.text();
      if (logContent) {
        console.log(`Got ${logContent.length} bytes of supervisor logs`);
        
        // Update log streams directly
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
          const newLog = current.length > CONFIG.MAX_LOG_SIZE 
            ? current.substring(current.length - CONFIG.MAX_LOG_SIZE / 2) + data 
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
   * Update log stream for a specific service with improved efficiency
   */
  const updateLogStream = useCallback((serviceName, data) => {
    if (!data || !serviceName) return;
    
    // Clean and normalize the data
    const cleanData = stripHtml(data);
    
    // Only add to buffer if data actually has content
    if (cleanData.trim()) {
      // Add a line break if it doesn't already end with one
      const formattedData = cleanData.endsWith('\n') ? cleanData : cleanData + '\n';
      
      // Check if this is a supervisor log and needs special handling
      if (serviceName === 'supervisord.log' && formattedData.includes('supervisor')) {
        // For supervisor logs, check for repeated lines to avoid spamming
        const currentBuffer = logBufferRef.current[serviceName] || '';
        const lastLine = currentBuffer.split('\n').pop() || '';
        
        // Skip if this is just repeating the same content
        if (lastLine.trim() === formattedData.trim()) {
          return;
        }
      }
      
      // Add to buffer
      logBufferRef.current[serviceName] = (logBufferRef.current[serviceName] || '') + formattedData;
      applyLogUpdates();
      
      if (CONFIG.DEBUG_LOG_STREAMS) {
        console.log(`Log stream update for ${serviceName}:`, 
          formattedData.length > 50 ? formattedData.substring(0, 50) + '...' : formattedData);
      }
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
    
    if (CONFIG.DEBUG_LOG_STREAMS) {
      console.log(`Error detected in service ${serviceName}:`, errorEntry);
    }
    
    setServicesWithErrors(prev => ({
      ...prev,
      [serviceName]: true
    }));
  }, [applyLogUpdates]);
  
  /**
   * Handle service status updates from socket events
   */
  const handleServiceStatusUpdate = useCallback((services, eventName) => {
    if (!Array.isArray(services)) return;
    
    if (CONFIG.DEBUG_SOCKET) {
      console.log(`Received ${eventName}:`, services);
    }
    
    setServices(prevServices => {
      // Ensure all services have a module_type property
      const enhancedServices = services.map(service => {
        // If module_type is already provided from backend, use it
        if (service.module_type) {
          return service;
        }
        
        // Otherwise, try to determine it from the service name
        // This is for backward compatibility with older backend responses
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
      
      // Don't trigger unnecessary state updates
      if (JSON.stringify(enhancedServices) === JSON.stringify(prevServices)) {
        if (CONFIG.DEBUG_SOCKET) console.log('Services unchanged, skipping update');
        return prevServices;
      }
      
      // IMPORTANT: We're updating service PROPS only, not adding new services
      // to the grid just because they appear in socket data
      if (CONFIG.DEBUG_SOCKET) {
        console.log('Updating service properties only - no layout changes');
      }
      
      return enhancedServices;
    });
  }, []);
  
  /**
   * Handle unified log events
   */
  const handleUnifiedLog = useCallback((data) => {
    if (!data || !data.service || !data.message) return;
    
    if (CONFIG.DEBUG_LOG_STREAMS) {
      console.log(`Received unified_log event from ${data.service}`);
    }
    
    // Map service names if needed
    let serviceName = data.service;
    if (CONFIG.SERVICE_NAME_MAPPING[serviceName]) {
      serviceName = CONFIG.SERVICE_NAME_MAPPING[serviceName];
    }
    
    // Format the timestamp
    const timestamp = new Date(data.timestamp || Date.now()).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
    
    // Determine log level
    const level = (data.level || 'info').toUpperCase();
    
    // Create a formatted line
    const formattedLine = `[${timestamp}] [${serviceName.toUpperCase()}] [${level}] ${data.message}`;
    
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
    // Initial API call to get services
    fetchServiceStatus();
    
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
      console.log('🔌 Main socket connected');
      setConnected(true);
    });
    
    mainSocket.on('connect_error', (error) => {
      console.error('Main socket connection error:', error);
      fetchServiceStatus(); // Fallback to REST API
    });
    
    mainSocket.on('disconnect', (reason) => {
      console.log(`🔌 Main socket disconnected. Reason: ${reason}`);
      setConnected(false);
    });
    
    // Log stream handlers
    mainSocket.on('logStream', (data) => {
      if (data && data.filename && data.line) {
        if (CONFIG.DEBUG_LOG_STREAMS) {
          console.log(`Received logStream event for ${data.filename}`);
        }
        updateLogStream(data.filename.replace('.log', ''), data.line);
      }
    });
    
    // Unified log handler
    mainSocket.on('unified_log', handleUnifiedLog);
    
    // Supervisor log handler with deduplication
    let lastSupervisorLine = '';
    let duplicateCount = 0;
    mainSocket.on('supervisorLogStream', (line) => {
      if (CONFIG.DEBUG_LOG_STREAMS) {
        console.log('Received supervisorLogStream event');
      }
      
      // Skip duplicate consecutive lines
      if (line === lastSupervisorLine) {
        duplicateCount++;
        // Only log every 10th duplicate to avoid spamming
        if (duplicateCount % 10 === 0) {
          updateLogStream('supervisord.log', `[Repeated message x${duplicateCount}]`);
        }
        return;
      }
      
      // Reset duplicate counter if line changes
      if (duplicateCount > 0) {
        updateLogStream('supervisord.log', `[End of repeated messages]`);
        duplicateCount = 0;
      }
      
      // Remember this line for deduplication
      lastSupervisorLine = line;
      
      // Only update one log stream to avoid duplicates
      updateLogStream('supervisord.log', line);
    });
    
    // Service status handlers
    mainSocket.on('service_status_update', services => 
      handleServiceStatusUpdate(services, 'service_status_update'));
    
    mainSocket.on('service_status', services => 
      handleServiceStatusUpdate(services, 'service_status (traditional)'));
    
    // Fetch services once
    fetch('/api/service/services')
      .then(response => response.json())
      .then(services => {
        if (CONFIG.DEBUG_SOCKET) console.log('Fetched services:', services);
        setServices(services);
      })
      .catch(error => console.error('Failed to fetch services:', error));
    
    // Set up refresh intervals
    const statusInterval = setInterval(fetchServiceStatus, CONFIG.SERVICE_REFRESH_INTERVAL);
    const updateInterval = setInterval(applyLogUpdates, CONFIG.LOG_UPDATE_INTERVAL);
    
    // Cleanup function
    return () => {
      console.log('Cleaning up socket connections');
      clearInterval(updateInterval);
      clearInterval(statusInterval);
      
      // Clean up main socket
      if (socketRefs.current.main) {
        socketRefs.current.main.disconnect();
      }
      
      // Clean up namespace sockets
      Object.values(socketRefs.current.namespaces).forEach(socket => {
        if (socket) {
          if (CONFIG.DEBUG_SOCKET) {
            console.log(`Disconnecting socket namespace: ${socket.nsp}`);
          }
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
    updateErrorLogStream, 
    fetchServiceStatus, 
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
    
    const namespace = CONFIG.METRICS_NAMESPACES[type];
    if (!namespace) {
      console.error(`Unknown metrics type: ${type}`);
      return null;
    }
    
    // Check if we already have a connection
    if (socketRefs.current.namespaces[namespace]) {
      if (CONFIG.DEBUG_SOCKET) {
        console.log(`Reusing existing ${type} metrics socket`);
      }
      return socketRefs.current.namespaces[namespace];
    }
    
    try {
      if (CONFIG.DEBUG_SOCKET) {
        console.log(`Creating new ${type} metrics socket at namespace ${namespace}`);
      }
      
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
        if (CONFIG.DEBUG_SOCKET) {
          console.log(`${type} metrics socket connected`);
        }
      });
      
      metricsSocket.on('connect_error', (error) => {
        console.error(`${type} metrics socket connection error:`, error);
      });
      
      metricsSocket.on('disconnect', (reason) => {
        if (CONFIG.DEBUG_SOCKET) {
          console.log(`${type} metrics socket disconnected. Reason: ${reason}`);
        }
      });
      
      // Handle metrics updates
      metricsSocket.on('metrics_update', (data) => {
        if (CONFIG.DEBUG_SOCKET && data) {
          console.log(`Received ${type} metrics update:`, data);
        }
        
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
    fetchSupervisorLogs  // Add the function to fetch supervisor logs to the context
  };
  
  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
}

export { SocketContext };
export default SocketProvider;