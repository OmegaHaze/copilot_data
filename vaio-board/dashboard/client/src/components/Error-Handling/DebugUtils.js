// Helper functions for debug panel

// Export debug methods to be accessible globally
let showDebugFn = (message) => console.log('Debug not initialized:', message);
let hideDebugFn = () => {};

// Store the original console methods
const originalConsole = {
  error: console.error,
  warn: console.warn
};

export const initializeDebug = (showFn, hideFn) => {
  showDebugFn = showFn;
  hideDebugFn = hideFn;
  window.vaioDebug = {
    show: showGlobalDebug,
    hide: hideGlobalDebug,
    log: logDebug,
    error: errorDebug,
    warn: warnDebug,
    success: successDebug
  };
  
  // Override console.error to display errors in the notification UI
  console.error = (...args) => {
    // Call the original console.error first
    originalConsole.error.apply(console, args);
    
    try {
      // Skip error notifications from our own notification system to avoid loops
      const isErrorSystem = args.some(arg => 
        typeof arg === 'string' && (arg.includes('[ERROR]:') || arg.includes('Error in console.error override'))
      );
      
      if (isErrorSystem) return;
      
      // Format the error message properly
      const errorMessage = args.map(arg => {
        if (arg === null) return 'null';
        if (arg === undefined) return 'undefined';
        if (typeof arg === 'object') {
          try {
            if (arg instanceof Error) {
              return arg.message || String(arg);
            }
            return JSON.stringify(arg, null, 2).substring(0, 150) + (JSON.stringify(arg).length > 150 ? '...' : '');
          } catch (e) {
            return String(arg);
          }
        }
        return String(arg);
      }).join(' ');
      
      // Label it as a console error and use a longer duration
      const formattedMessage = `[CONSOLE ERROR] ${errorMessage}`;
      showDebugFn(formattedMessage, 'error', 12000);
    } catch (e) {
      // If anything goes wrong in our error handling, don't break the console
      originalConsole.error("Error in console.error override:", e);
    }
  };
  
  // Also override console.warn
  console.warn = (...args) => {
    // Call the original console.warn first
    originalConsole.warn.apply(console, args);
    
    try {
      // Skip warnings from our own notification system to avoid loops
      const isWarningSystem = args.some(arg => 
        typeof arg === 'string' && arg.includes('[WARNING]:')
      );
      
      if (isWarningSystem) return;
      
      // Format the warning message properly
      const warningMessage = args.map(arg => {
        if (arg === null) return 'null';
        if (arg === undefined) return 'undefined';
        if (typeof arg === 'object') {
          try {
            if (arg instanceof Error) {
              return arg.message || String(arg);
            }
            return JSON.stringify(arg, null, 2).substring(0, 150) + (JSON.stringify(arg).length > 150 ? '...' : '');
          } catch (e) {
            return String(arg);
          }
        }
        return String(arg);
      }).join(' ');
      
      // Show warnings as well but with shorter duration
      showDebugFn(`[CONSOLE WARNING] ${warningMessage}`, 'warning', 10000);
    } catch (e) {
      // Fallback
      originalConsole.error("Error in console.warn override:", e);
    }
  };
  
  console.log('🖥️ vAIO Debug initialized - window.vaioDebug available');
};

// Global debug methods
export const showGlobalDebug = (message, type = 'info', duration = 5000) => {
  return showDebugFn(message, type, duration);
};

export const hideGlobalDebug = (id) => {
  hideDebugFn(id);
};

// Convenience methods
export const logDebug = (message, duration = 5000) => {
  return showGlobalDebug(message, 'info', duration);
};

export const errorDebug = (message, duration = 7000) => {
  // Prefix console errors with a label to make them more noticeable
  const formattedMessage = message.startsWith('[CONSOLE ERROR]') ? message : `[CONSOLE ERROR] ${message}`;
  return showGlobalDebug(formattedMessage, 'error', duration);
};

export const warnDebug = (message, duration = 6000) => {
  return showGlobalDebug(message, 'warning', duration);
};

export const successDebug = (message, duration = 4000) => {
  return showGlobalDebug(message, 'success', duration);
};
