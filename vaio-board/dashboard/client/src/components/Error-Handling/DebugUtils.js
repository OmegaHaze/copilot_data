// filepath: /home/vaio/vaio-board/dashboard/client/src/components/Error-Handling/DebugUtils.js
// Helper functions for debug panel

// Export debug methods to be accessible globally
let showDebugFn = (message) => console.log('Debug not initialized:', message);
let hideDebugFn = () => {};

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
  return showGlobalDebug(message, 'error', duration);
};

export const warnDebug = (message, duration = 6000) => {
  return showGlobalDebug(message, 'warning', duration);
};

export const successDebug = (message, duration = 4000) => {
  return showGlobalDebug(message, 'success', duration);
};
