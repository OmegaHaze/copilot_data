import { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';

// ============================================================================
// Context Setup
// ============================================================================

const LogContext = createContext();

export function useLog() {
  return useContext(LogContext);
}

// ============================================================================
// Utility Functions 
// ============================================================================

/**
 * Removes HTML tags from log stream data for clean display
 * @param {string} html - The text that may contain HTML tags
 * @returns {string} Clean text without HTML tags
 */
function stripHtml(html) {
  if (typeof html !== 'string') return String(html || '');
  return html.replace(/<\/?[^>]+(>|$)/g, "");
}

/**
 * Creates a throttled function to prevent excessive updates
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
 * Log Provider Component
 * Manages all log streams and error tracking
 */
export function LogProvider({ children }) {
  // ================================
  // State & Refs
  // ================================
  
  // Logging state
  const [logStreams, setLogStreams] = useState({});
  const [errorLogs, setErrorLogs] = useState({});
  const [servicesWithErrors, setServicesWithErrors] = useState({});
  
  // Buffers for batching updates
  const logBufferRef = useRef({});
  const errorLogBufferRef = useRef({});

  // ================================
  // Log Management
  // ================================
  
  /**
   * Applies buffered log updates to state in a throttled manner
   * Prevents excessive rerenders while maintaining log accuracy
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
   * Updates the log stream for a specific service
   * Handles cleaning and formatting of log data
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
   * Handles error log updates for services
   * Adds timestamps and tracks services with errors
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
   * Processes unified log events from all services
   * Handles different log levels and formats
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

  // Set up update interval for log processing
  useEffect(() => {
    const updateInterval = setInterval(applyLogUpdates, 500);
    return () => clearInterval(updateInterval);
  }, [applyLogUpdates]);

  const contextValue = {
    // Log state
    logStreams,
    errorLogs,
    servicesWithErrors,
    
    // Log methods
    updateLogStream,
    updateErrorLogStream,
    handleUnifiedLog
  };

  return (
    <LogContext.Provider value={contextValue}>
      {children}
    </LogContext.Provider>
  );
}

export default LogProvider;