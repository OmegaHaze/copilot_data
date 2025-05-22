import { create } from 'zustand'
// Note: ErrorType and ErrorSeverity constants are defined in '../types/errorTypes'
// But they're not directly imported here since they're only referenced in comments

/**
 * @typedef {Object} ErrorContext
 * @property {string} [componentName] - The name of the component that generated the error
 * @property {string} [location] - Where in the application the error occurred
 * @property {string} [action] - What action was being performed when the error occurred
 * @property {Object} [metadata] - Additional contextual information about the error
 */

/**
 * @typedef {Object} ErrorItem
 * @property {string} id - Unique identifier for the error
 * @property {string} message - Error message text
 * @property {string} type - Error type (e.g., 'system', 'api', 'ui')
 * @property {string} priority - Error priority (e.g., 'high', 'medium', 'low')
 * @property {number} timestamp - When the error occurred
 * @property {string} [stack] - Error stack trace if available
 * @property {ErrorContext} [context] - Additional context information about the error
 * @property {boolean} [userDismissable] - Whether user can dismiss this error
 */

export const useErrorStore = create((set, get) => ({
  errors: [],
  dismissCache: [], // Store auto-dismissed errors
  hasCachedErrors: false, // Flag to show/hide indicator
  
  addError: (error) => set((state) => {
    const id = Math.random().toString(36).substring(2)
    const timestamp = Date.now()
    
    // Prevent duplicates within last 5 seconds
    const recentDuplicate = state.errors.find(e => 
      e.message === error.message && 
      e.type === error.type &&
      (timestamp - e.timestamp) < 5000
    )
    
    if (recentDuplicate) {
      return state
    }
    
    // Limit queue size to prevent too many notifications from accumulating
    const maxErrors = 20;
    let updatedErrors = [{
      ...error,
      id,
      timestamp
    }, ...state.errors];
    
    // Trim the queue if needed
    if (updatedErrors.length > maxErrors) {
      updatedErrors = updatedErrors.slice(0, maxErrors);
    }

    return {
      errors: updatedErrors,
      dismissCache: state.dismissCache,           // Preserve cache
      hasCachedErrors: state.dismissCache.length > 0  // Preserve hasCachedErrors flag
    }
  }),

  // Modified to add auto-dismissed errors to cache
  removeError: (id, isAutoDismiss = false) => set((state) => {
    // Find the error being removed
    const errorToRemove = state.errors.find(error => error.id === id);
    
    // Debug log to see what's happening with the auto-dismiss state
    console.log(`Removing error: ${errorToRemove?.message?.substring(0, 20)}..., auto-dismissed: ${isAutoDismiss}, current cache size: ${state.dismissCache.length}`);
    
    // If auto-dismissed and it's a valid error, add to dismissCache
    if (isAutoDismiss && errorToRemove) {
      // Limit cache size
      const maxCachedErrors = 50;
      let updatedCache = [errorToRemove, ...state.dismissCache];
      
      if (updatedCache.length > maxCachedErrors) {
        updatedCache = updatedCache.slice(0, maxCachedErrors);
      }
      
      console.log(`Added to cache. New cache size: ${updatedCache.length}, Setting hasCachedErrors: ${updatedCache.length > 0}`);
      
      return {
        errors: state.errors.filter(error => error.id !== id),
        dismissCache: updatedCache,
        hasCachedErrors: updatedCache.length > 0 // Only true if we actually have cached errors
      };
    }
    
    // Regular manual removal - errors dismissed by user don't go to cache
    // But we need to preserve the hasCachedErrors state to prevent the triangle from disappearing
    return {
      errors: state.errors.filter(error => error.id !== id),
      dismissCache: state.dismissCache,
      hasCachedErrors: state.dismissCache.length > 0
    };
  }),
  
  // Restore cached errors to main error queue
  restoreCachedErrors: () => set((state) => {
    // Determine how many errors to restore (up to 5)
    const errorsToRestore = Math.min(state.dismissCache.length, 5);
    
    // Get the remaining cache after restoring
    const remainingCache = state.dismissCache.slice(errorsToRestore);
    
    // Define the update payload
    const update = {
      errors: [...state.dismissCache.slice(0, errorsToRestore), ...state.errors], // Only restore up to 5 to avoid flooding
      dismissCache: remainingCache, // Remove restored errors from cache
      hasCachedErrors: remainingCache.length > 0 // Only show triangle if there are errors left in cache
    };

    return update;
  }),
  
  // Clear cached errors only
  clearCache: () => set((state) => ({
    errors: state.errors,
    dismissCache: [],
    hasCachedErrors: false
  })),
  
  // Clear active errors only but preserve cached errors
  clearErrors: () => set((state) => ({
    errors: [],
    dismissCache: state.dismissCache,
    hasCachedErrors: state.dismissCache.length > 0
  })),
  
  // Clear all errors (both active and cached)
  clearAllErrors: () => set({ 
    errors: [], 
    dismissCache: [], 
    hasCachedErrors: false 
  })
}))
