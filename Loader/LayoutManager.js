// LayoutManager.js - Responsible for layout persistence and storage operations
import debounce from 'lodash/debounce';
import { errorHandler } from '../../../Error-Handling/utils/errorHandler';
import { ErrorType, ErrorSeverity } from '../../../Error-Handling/Diagnostics/types/errorTypes';

// Constants
const STORAGE_KEY = 'vaio_layouts';
export const BREAKPOINTS = ['lg', 'md', 'sm', 'xs', 'xxs'];

// Development environment detection
const isDev = window.location.hostname === 'localhost' || 
             window.location.hostname === '127.0.0.1';

/**
 * Validates a layouts object to ensure it has the proper structure
 * @param {Object} layouts - The layouts object to validate
 * @returns {boolean} True if layouts is valid, false otherwise
 */
export function validateLayouts(layouts) {
  // Check if layouts is an object
  if (!layouts || typeof layouts !== 'object') {
    if (isDev) console.error('Invalid layouts: not an object');
    return false;
  }
  
  // Check if layouts has required breakpoints
  for (const breakpoint of BREAKPOINTS) {
    if (!layouts[breakpoint] || !Array.isArray(layouts[breakpoint])) {
      if (isDev) console.error(`Invalid layouts: missing or invalid breakpoint ${breakpoint}`);
      return false;
    }
  }
  
  // Validate layouts items for each breakpoint
  for (const breakpoint of BREAKPOINTS) {
    for (const item of layouts[breakpoint]) {
      // Each item must have required properties
      if (!item.i || typeof item.x !== 'number' || typeof item.y !== 'number' || 
          typeof item.w !== 'number' || typeof item.h !== 'number') {
        if (isDev) console.error(`Invalid layouts item in ${breakpoint}:`, item);
        return false;
      }
    }
  }
  
  return true;
}

/**
 * Creates empty layouts with all breakpoints initialized
 * @returns {Object} Empty layouts object
 */
export function createEmptyLayouts() {
  const emptyLayouts = {};
  BREAKPOINTS.forEach(bp => {
    emptyLayouts[bp] = [];
  });
  return emptyLayouts;
}

/**
 * Retrieves layouts from localStorage
 * @returns {Object|null} The hydrated layouts object or null if not found/invalid
 */
export function getLayoutsFromStorage() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    
    try {
      // Parse stored data
      const parsedLayouts = JSON.parse(stored);
      
      // Ensure proper structure
      const result = createEmptyLayouts();
      
      // Copy valid arrays for each breakpoint
      BREAKPOINTS.forEach(bp => {
        if (Array.isArray(parsedLayouts[bp])) {
          result[bp] = parsedLayouts[bp];
        }
      });
      
      return result;
    } catch (parseError) {
      errorHandler.showError(
        `Failed to parse layouts from localStorage: ${parseError.message}`,
        ErrorType.SYSTEM,
        ErrorSeverity.MEDIUM,
        {
          componentName: 'LayoutManager',
          action: 'getLayoutsFromStorage',
          location: 'Layouts Loading',
          metadata: {
            errorStack: parseError.stack
          }
        }
      );
      return null;
    }
  } catch (err) {
    errorHandler.showError(
      `Failed to access localStorage: ${err.message}`,
      ErrorType.SYSTEM,
      ErrorSeverity.MEDIUM,
      {
        componentName: 'LayoutManager',
        action: 'getLayoutsFromStorage',
        location: 'Layouts Loading',
        metadata: {
          errorStack: err.stack
        }
      }
    );
    return null;
  }
}

/**
 * Validates an individual layout item
 * @param {Object} item - Layout item to validate
 * @returns {boolean} True if item is valid
 */
export function isValidLayoutItem(item) {
  return (
    item && 
    typeof item === 'object' &&
    typeof item.i === 'string' && 
    item.i.length > 0 &&
    typeof item.x === 'number' &&
    typeof item.y === 'number' &&
    typeof item.w === 'number' &&
    typeof item.h === 'number'
  );
}

/**
 * Prepares layouts for storage by cleaning and removing invalid items
 * @param {Object} layouts - The layouts to sanitize
 * @returns {Object} Sanitized layouts for storage
 */
export function sanitizeLayoutsForStorage(layouts) {
  // Ensure we have valid layouts
  if (!layouts || typeof layouts !== 'object') {
    return createEmptyLayouts();
  }
  
  const sanitized = {};
  
  // Process each breakpoint
  BREAKPOINTS.forEach(bp => {
    const items = layouts[bp];
    
    // Ensure breakpoint is an array
    if (!Array.isArray(items)) {
      sanitized[bp] = [];
      return;
    }
    
    // Filter valid items only
    sanitized[bp] = items.filter(item => isValidLayoutItem(item));
  });
  
  return sanitized;
}

/**
 * Saves layouts to localStorage
 * @param {Object} layouts - The layouts to save
 * @returns {boolean} Success status
 */
export function saveLayoutsToLocal(layouts) {
  try {
    // Validate layouts before saving
    if (!validateLayouts(layouts)) {
      if (isDev) console.error('Cannot save invalid layouts');
      return false;
    }
    
    const safe = sanitizeLayoutsForStorage(layouts);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(safe));
    return true;
  } catch (err) {
    errorHandler.showError(
      `Failed to save layouts to localStorage: ${err.message}`,
      ErrorType.SYSTEM,
      ErrorSeverity.MEDIUM,
      {
        componentName: 'LayoutManager',
        action: 'saveLayoutsToLocal',
        location: 'Layouts Persistence',
        metadata: {
          layoutsKeys: layouts ? Object.keys(layouts) : [],
          errorStack: err.stack
        }
      }
    );
    return false;
  }
}
/**
 * Saves layouts and active modules to backend session storage
 * @param {Object} layouts - The layouts to save
 * @param {Array} activeModules - Array of active module IDs in the three-part format
 * @returns {Promise<Object|null>} Response data or null on error
 */
export async function saveLayoutsToSession(layouts, activeModules = []) {
  try {
    // Create default layouts if not provided
    if (!layouts) {
      layouts = createEmptyLayouts();
    }
    
    // Validate layouts instead of normalizing
    if (!validateLayouts(layouts)) {
      throw new Error('Invalid grid layout structure');
    }

    // Filter invalid active modules
    activeModules = Array.isArray(activeModules) ? 
      activeModules.filter(id => id && typeof id === 'string' && id.split('-').length === 3) : 
      [];
    
    // Prepare payload with proper format
    const payload = {
      grid_layout: layouts,
      active_modules: activeModules
    };
    
    console.log('Saving layouts to session:', {
      layoutsCount: countLayoutsItems(layouts),
      activeModulesCount: activeModules.length
    });
    
    // Make API call with retry
    const response = await fetchWithRetry('/api/user/session/grid', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload)
    }, 3); // 3 retry attempts
    
    if (!response.ok) {
      throw new Error(`Server error: HTTP ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (err) {
    errorHandler.showError(
      `Failed to sync layouts to session: ${err.message}`,
      ErrorType.SYSTEM,
      ErrorSeverity.HIGH,
      {
        componentName: 'LayoutManager',
        action: 'saveLayoutsToSession',
        location: 'Session Sync',
        metadata: {
          errorStack: err.stack
        }
      }
    );
    
    return null;
  }
}

/**
 * Helper function for fetch with retry logic
 * @param {string} url - The URL to fetch
 * @param {Object} options - Fetch options
 * @param {number} maxAttempts - Maximum retry attempts
 * @returns {Promise<Response>} Fetch response
 */
async function fetchWithRetry(url, options, maxAttempts = 3) {
  let lastError;
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fetch(url, options);
    } catch (err) {
      lastError = err;
      if (attempt < maxAttempts - 1) {
        // Wait with exponential backoff before retry
        await new Promise(resolve => setTimeout(resolve, 500 * Math.pow(2, attempt)));
      }
    }
  }
  
  throw lastError || new Error('Failed after maximum retry attempts');
}

// Debounced version to prevent excessive saves during drag operations
export const debouncedSaveToSession = debounce(saveLayoutsToSession, 800);

/**
 * Counts total layouts items across all breakpoints
 * @param {Object} layouts - The layouts object
 * @returns {number} Count of layouts items
 */
export function countLayoutsItems(layouts) {
  if (!layouts) return 0;
  
  return Object.values(layouts).reduce(
    (count, breakpoint) => count + (Array.isArray(breakpoint) ? breakpoint.length : 0),
    0
  );
}

/**
 * Load layouts during application initialization
 * @param {Array} items - Available module items
 * @param {Object} [providedSessionData] - Optional session data to use instead of fetching
 * @returns {Promise<Object>} The resolved layouts
 */
export async function loadLayouts(items = [], providedSessionData = null) {
  try {
    // Use provided session data
    const sessionData = providedSessionData;
    
    // No session data - return empty layouts
    if (!sessionData || Object.keys(sessionData).length === 0) {
      return createEmptyLayouts();
    }
    
    // Get layouts from session data - use as-is, no normalization
    const gridLayout = sessionData.grid_layout;
    
    // If we have valid grid layout, use it directly without normalization
    if (gridLayout && typeof gridLayout === 'object') {
      // Verify all required breakpoints exist
      const safeLayout = { ...gridLayout };
      
      // Add any missing breakpoints (but don't modify existing ones)
      BREAKPOINTS.forEach(bp => {
        if (!Array.isArray(safeLayout[bp])) {
          safeLayout[bp] = [];
        }
      });
      
      return safeLayout;
    }
    
    // No valid layouts found - create empty layouts
    return createEmptyLayouts();
  } catch (error) {
    errorHandler.showError(
      `Failed to load layouts: ${error.message}`,
      ErrorType.SYSTEM,
      ErrorSeverity.MEDIUM,
      {
        componentName: 'LayoutManager',
        action: 'loadLayouts',
        location: 'Layout Processing',
        metadata: {
          itemsCount: items?.length || 0,
          hasSessionData: !!providedSessionData,
          errorStack: error.stack
        }
      }
    );
    
    return createEmptyLayouts();
  }
}

/**
 * List all saved layouts for the current user
 * @returns {Promise<Array>} Array of saved layouts
 */
export async function listSavedLayouts() {
  try {
    const res = await fetch(`/api/user/layouts`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    });
    
    if (!res.ok) {
      throw new Error(`Server error: HTTP ${res.status}`);
    }
    
    return await res.json();
  } catch (err) {
    errorHandler.showError(
      `Failed to list saved layouts: ${err.message}`,
      ErrorType.SYSTEM,
      ErrorSeverity.MEDIUM,
      {
        componentName: 'LayoutManager',
        action: 'listSavedLayouts',
        errorStack: err.stack
      }
    );
    return [];
  }
}

/**
 * Apply a saved layout to the current session
 * @param {number} layoutId - ID of the layout to apply
 * @returns {Promise<Object>} Response from the server
 */
export async function applyLayout(layoutId) {
  if (!layoutId || typeof layoutId !== 'number') {
    errorHandler.showError(
      'Layout ID must be a valid number',
      ErrorType.SYSTEM,
      ErrorSeverity.MEDIUM,
      {
        componentName: 'LayoutManager',
        action: 'applyLayout',
        location: 'Input Validation'
      }
    );
    return null;
  }
  
  try {
    const res = await fetch(`/api/user/layouts/${layoutId}/apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    });
    
    if (!res.ok) {
      throw new Error(`Server error: HTTP ${res.status}`);
    }
    
    return await res.json();
  } catch (err) {
    errorHandler.showError(
      `Failed to apply layout: ${err.message}`,
      ErrorType.SYSTEM,
      ErrorSeverity.MEDIUM,
      {
        componentName: 'LayoutManager',
        action: 'applyLayout',
        location: 'Layout Application',
        layoutId,
        errorStack: err.stack
      }
    );
    return null;
  }
}