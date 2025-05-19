// Debug Panel Utility Functions
// Handles debug overlay functionality for diagnostic and development purposes

let showDebugMessageFn = () => console.log('Debug panel not initialized');
let hideDebugMessageFn = () => {};

/**
 * Initialize the debug panel functionality
 * @param {Function} showFn Function to show debug messages
 * @param {Function} hideFn Function to hide debug messages
 */
export const initializeDebug = (showFn, hideFn) => {
  showDebugMessageFn = showFn;
  hideDebugMessageFn = hideFn;
  
  // Register debug panel functions globally
  window.vaioDebug = {
    showDebugMessage,
    hideDebugMessage,
    logDebugMessage
  };
  
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 Debug panel initialized');
  }
};

/**
 * Show a message in the debug panel overlay
 * @param {string} message Message to display
 * @returns {string} Message ID
 */
export const showDebugMessage = (message) => {
  return showDebugMessageFn(message);
};

/**
 * Hide a message from the debug panel
 * @param {string} id Message ID to hide
 */
export const hideDebugMessage = (id) => {
  hideDebugMessageFn(id);
};

/**
 * Log a message to the debug panel
 * @param {string} message Message to log
 * @returns {string} Message ID
 */
export const logDebugMessage = (message) => {
  return showDebugMessage(message);
};
