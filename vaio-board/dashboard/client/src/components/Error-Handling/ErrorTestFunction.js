/**
 * Test functions to verify error notification interception
 * This provides a simple way to test error notification system
 */

/**
 * Generates a test console error
 * @param {string} message - Optional custom message for the error
 */
export const generateTestConsoleError = (message = "This is a test console error") => {
  console.error(message);
};

/**
 * Generates a test console warning
 * @param {string} message - Optional custom message for the warning
 */
export const generateTestConsoleWarning = (message = "This is a test console warning") => {
  console.warn(message);
};

/**
 * Simulates a JavaScript runtime error 
 * This will be caught by the ErrorBoundary
 */
export const simulateRuntimeError = () => {
  // This will cause a runtime error
  const nonExistentObject = null;
  nonExistentObject.someProperty = true; // Will throw TypeError
};

// Export a function to test all notification types
export const testNotificationSystem = (errorSystem) => {
  if (!errorSystem) {
    console.error("Error system not available for testing");
    return;
  }
  
  // Direct notification API tests
  errorSystem.showDebug("Test info notification", "info", 5000);
  errorSystem.showDebug("Test success notification", "success", 5000);
  errorSystem.showDebug("Test warning notification", "warning", 5000);
  errorSystem.showError("Test error notification", "error", 5000);
  
  // Console interception tests (delayed to avoid overlap)
  setTimeout(() => {
    console.log("Testing console error interception...");
    console.error("This is a test console error that should appear as notification");
  }, 1000);
  
  setTimeout(() => {
    console.log("Testing console warning interception...");
    console.warn("This is a test console warning that should appear as notification");
  }, 2000);
};

export default {
  generateTestConsoleError,
  generateTestConsoleWarning,
  simulateRuntimeError,
  testNotificationSystem
};
