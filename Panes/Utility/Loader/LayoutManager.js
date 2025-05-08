// LayoutManager.js - Responsible for layout persistence and storage operations

import debounce from 'lodash/debounce';
import { errorHandler } from '../../../Error-Handling/utils/errorHandler';
import { ErrorType, ErrorSeverity } from '../../../Error-Handling/Diagnostics/types/errorTypes';
import { 
  sanitizeLayoutsForStorage, 
  hydrateLayoutsFromDB, 
  createEmptyLayouts,
  transformLayouts,
  isValidResponsiveLayout
} from './LayoutTransformer.js';

// Constants
const STORAGE_KEY = 'vaio_layouts';
export const BREAKPOINTS = ['lg', 'md', 'sm', 'xs', 'xxs'];

/**
 * Validates a layouts object to ensure it has the proper structure
 * @param {Object} layouts - The layouts object to validate
 * @returns {boolean} True if layouts is valid, false otherwise
 */
export function validateLayouts(layouts) {
  // Check if layouts is an object
  if (!layouts || typeof layouts !== 'object') {
    console.error('Invalid layouts: not an object');
    return false;
  }
  
  // Check if layouts has required breakpoints
  for (const breakpoint of BREAKPOINTS) {
    if (!layouts[breakpoint] || !Array.isArray(layouts[breakpoint])) {
      console.error(`Invalid layouts: missing or invalid breakpoint ${breakpoint}`);
      return false;
    }
  }
  
  // Validate layouts items for each breakpoint
  for (const breakpoint of BREAKPOINTS) {
    for (const item of layouts[breakpoint]) {
      // Each item must have required properties
      if (!item.i || typeof item.x !== 'number' || typeof item.y !== 'number' || 
          typeof item.w !== 'number' || typeof item.h !== 'number') {
        console.error(`Invalid layouts item in ${breakpoint}:`, item);
        return false;
      }
    }
  }
  
  return true;
}

/**
 * Retrieves layouts from localStorage
 * @returns {Object|null} The hydrated layouts object or null if not found/invalid
 */
export function getLayoutsFromStorage() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    return hydrateLayoutsFromDB(stored);
  } catch (err) {
    errorHandler.showError(
      `Failed to parse layouts from localStorage: ${err.message}`,
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
 * Saves layouts to localStorage
 * @param {Object} layouts - The layouts to save
 * @returns {boolean} Success status
 */
export function saveLayoutsToLocal(layouts) {
  try {
    // Validate layouts before saving
    if (!validateLayouts(layouts)) {
      console.error('Cannot save invalid layouts');
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
 * Saves layouts to backend session storage
 * @param {Object} layouts - The layouts to save
 * @returns {Promise<Object|null>} Response data or null on error
 */
export async function saveLayoutsToSession(layouts) {
  try {
    // Detailed validation before sending
    if (!layouts) {
      errorHandler.showError(
        'saveLayoutsToSession: Layouts is null or undefined',
        ErrorType.SYSTEM,
        ErrorSeverity.MEDIUM,
        {
          componentName: 'LayoutManager',
          action: 'saveLayoutsToSession',
          location: 'Layouts Validation'
        }
      );
      return null;
    }
    
    console.log('saveLayoutsToSession: Initial layouts state', {
      hasKeys: Object.keys(layouts).length > 0,
      hasBreakpoints: BREAKPOINTS.some(bp => layouts[bp] !== undefined),
      type: typeof layouts
    });
    
    // Normalize the layouts through our validation function
    layouts = normalizeLayouts(layouts);
    
    // Check if the normalized layouts are valid
    const isValid = isValidResponsiveLayout(layouts, false);
    
    if (!isValid) {
      errorHandler.showError(
        'saveLayoutsToSession: No valid breakpoints found in layouts',
        ErrorType.SYSTEM,
        ErrorSeverity.MEDIUM,
        {
          componentName: 'LayoutManager',
          action: 'saveLayoutsToSession',
          location: 'Breakpoint Validation',
          metadata: {
            providedKeys: layouts ? Object.keys(layouts) : [],
            layoutsType: typeof layouts,
            layoutsIsArray: Array.isArray(layouts)
          }
        }
      );
      return null;
    }
    
    // Use sanitization function from imports
    const safe = sanitizeLayoutsForStorage(layouts);
    
    // Detailed logging for troubleshooting
    console.log('Saving layouts to session - sanitized layouts:', JSON.stringify(safe));
    
    // Make API call with retry logic
    let attempt = 0;
    const maxAttempts = 3;
    
    while (attempt < maxAttempts) {
      attempt++;
      
      try {
        const res = await fetch('/api/user/session/grid', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(safe)
        });
        
        // Handle HTTP errors
        if (!res.ok) {
          const errorText = await res.text();
          console.error(`HTTP ${res.status}: ${errorText}`);
          
          if (attempt < maxAttempts) {
            console.log(`Retrying layouts save (attempt ${attempt + 1}/${maxAttempts})...`);
            await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms before retry
            continue;
          }
          
          throw new Error(`Server error: HTTP ${res.status}`);
        }
        
        // Parse response
        const data = await res.json();
        console.log('Layouts successfully synced to session:', data);
        return data;
      } catch (fetchErr) {
        if (attempt < maxAttempts) {
          console.log(`Network error, retrying (${attempt + 1}/${maxAttempts})...`);
          await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms before retry
        } else {
          throw fetchErr; // Re-throw on final attempt
        }
      }
    }
    
    throw new Error('Failed after maximum retry attempts');
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
 * Core layouts resolution logic - determines which layouts to use based on priority
 * @param {Object} options - Options object
 * @param {Object} options.sessionData - Session data from server
 * @param {Array} options.items - Available module items
 * @returns {Promise<Object>} The resolved layouts
 */
export async function resolveLayouts({ sessionData, items }) {
  if (!sessionData || !sessionData.grid_layout) {
    console.error('No valid session data or grid_layout provided to resolveLayouts');
    throw new Error('No valid session data or grid_layout provided');
  }
  
  // Transform and validate the layouts using LayoutTransformer
  return await transformLayouts({ sessionData, items });
}

/**
 * Load layouts during application initialization
 * @param {Array} items - Available module items
 * @param {Object} [providedSessionData] - Optional session data to use instead of fetching from registry
 * @returns {Promise<Object>} The resolved layouts
 */
export async function loadLayouts(items = [], providedSessionData = null) {
  console.log('Loading layouts for items:', items.length);
  
  try {
    // Use provided session data only - should come from SettingsContext
    const sessionData = providedSessionData;
    
    // Check both sessionData existence and whether it has any useful data
    if (!sessionData || (typeof sessionData === 'object' && Object.keys(sessionData).length === 0)) {
      console.warn('No session data provided to loadLayouts');
      return createEmptyLayouts();
    }
    
    console.log('Processing session data for layouts:', {
      hasGridLayout: !!sessionData.grid_layout,
      sessionKeys: Object.keys(sessionData)
    });
    
    // Transform and validate the layouts
    const layouts = await transformLayouts({ 
      sessionData, 
      items
    });
    
    if (!layouts) {
      console.warn('transformLayouts returned null or undefined');
      return createEmptyLayouts();
    }
    
    return layouts;
  } catch (error) {
    console.error('Error in loadLayouts:', error);
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
 * Ensures a layouts has all breakpoints and only contains valid items
 * @param {Object} layouts - Layouts to normalize
 * @returns {Object} Normalized layouts
 */
export function normalizeLayouts(layouts) {
  const safeLayouts = {};

  BREAKPOINTS.forEach(bp => {
    const items = layouts?.[bp];
    safeLayouts[bp] = Array.isArray(items)
      ? items.filter(item => isValidLayoutItem(item))
      : [];
  });

  return safeLayouts;
}

/**
 * Process stored layouts data
 * @param {Object|string} storedLayouts - The layouts data to process
 * @returns {Object} Normalized layouts data
 */
export function processStoredLayouts(storedLayouts) {
  try {
    // Parse JSON string if needed
    if (typeof storedLayouts === 'string') {
      try {
        storedLayouts = JSON.parse(storedLayouts);
      } catch (parseErr) {
        errorHandler.showError(
          `Failed to parse layouts JSON: ${parseErr.message}`,
          ErrorType.SYSTEM,
          ErrorSeverity.MEDIUM,
          {
            componentName: 'LayoutManager',
            action: 'processStoredLayouts',
            location: 'JSON Parsing',
            metadata: {
              stringLength: storedLayouts?.length,
              errorStack: parseErr.stack
            }
          }
        );
        return normalizeLayouts({});
      }
    }
    
    // Check if the layouts is valid
    if (!storedLayouts || typeof storedLayouts !== 'object') {
      console.warn('Invalid layouts data:', storedLayouts);
      return normalizeLayouts({});
    }
    
    // Handle different storage formats
    const convertedLayouts = {};
    BREAKPOINTS.forEach(bp => {
      // Initialize each breakpoint with an empty array
      convertedLayouts[bp] = [];
      
      // Skip if no data for this breakpoint
      if (!storedLayouts[bp]) return;
      
      // Handle array format
      if (Array.isArray(storedLayouts[bp])) {
        convertedLayouts[bp] = storedLayouts[bp];
      }
      // Handle object/dictionary format
      else if (typeof storedLayouts[bp] === 'object') {
        convertedLayouts[bp] = Object.values(storedLayouts[bp]);
      }
    });
    
    // Normalize and return the converted layouts
    return normalizeLayouts(convertedLayouts);
  } catch (err) {
    errorHandler.showError(
      `Error processing layouts data: ${err.message}`,
      'system',
      'medium'
    );
    return normalizeLayouts({});
  }
}