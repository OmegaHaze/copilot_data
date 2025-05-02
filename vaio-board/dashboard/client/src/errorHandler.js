// Global error handler for capturing uncaught exceptions
// This will provide more detailed information about errors

/**
 * Set up a global error handler to catch uncaught errors
 */
export function setupGlobalErrorHandler() {
  window.onerror = function(message, source, lineno, colno, error) {
    console.group('🚨 UNCAUGHT ERROR DETAILS');
    console.error('Error message:', message);
    console.error('Source:', source);
    console.error('Line:', lineno, 'Column:', colno);
    
    if (error && error.stack) {
      console.error('Stack trace:');
      console.error(error.stack);
    }
    
    // Check for common causes
    if (error instanceof TypeError) {
      console.error('Type error - likely accessing a property on undefined/null');
    }
    
    // If we have component registry debugging available, show component info
    if (window.getPaneMap) {
      try {
        const paneMap = window.getPaneMap();
        console.log('Component registry status:', paneMap ? 'Available' : 'Unavailable');
        if (paneMap) {
          console.log('Registered components:', Object.keys(paneMap));
        }
      } catch (e) {
        console.error('Failed to access component registry:', e);
      }
    }
    
    console.groupEnd();
    
    // Return false to allow the default browser error handler to run as well
    return false;
  };
  
  console.log('🔍 Global error handler installed');
}
