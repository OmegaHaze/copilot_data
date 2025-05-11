/**
 * LayoutTransformer.js
 * Responsible for all layout data transformations and validation
 */

import { breakpoints, cols } from './GridUtils.js';
import { getModuleDefaultSize } from './LayoutPositioning.js';

// Use consistent breakpoints
const DEFAULT_BREAKPOINTS = Object.keys(breakpoints);

/**
 * Validates if a layouts object is properly formatted for react-grid-layout
 * Checks that the object has arrays for at least one valid breakpoint
 * 
 * @param {Object} layouts - Layouts object to validate
 * @param {boolean} autoFix - Attempt to fix invalid layouts
 * @returns {boolean} True if layouts is valid
 */
export function isValidResponsiveLayout(layouts, autoFix = false) {
  // First check if layouts is a valid object
  if (!layouts || typeof layouts !== 'object') {
    console.warn('isValidResponsiveLayout: Layouts is not a valid object', layouts);
    return false;
  }
  
  // Check if any breakpoint has valid layout items
  const validBreakpoints = DEFAULT_BREAKPOINTS.filter(bp => 
    layouts[bp] && Array.isArray(layouts[bp])
  );
  
  if (validBreakpoints.length === 0) {
    console.warn('isValidResponsiveLayout: No valid breakpoints found');
    
    // Attempt to fix if requested
    if (autoFix) {
      DEFAULT_BREAKPOINTS.forEach(bp => {
        layouts[bp] = [];
      });
      return true;
    }
    
    return false;
  }
  
  // Log missing breakpoints as a warning but don't fail validation
  const missingBreakpoints = DEFAULT_BREAKPOINTS.filter(bp => 
    !layouts[bp] || !Array.isArray(layouts[bp])
  );
  
  if (missingBreakpoints.length > 0) {
    console.warn('isValidResponsiveLayout: Some breakpoints are missing or invalid:', missingBreakpoints);
    
    // Attempt to fix if requested
    if (autoFix) {
      missingBreakpoints.forEach(bp => {
        // Use the first valid breakpoint's data as a template
        const validBp = validBreakpoints[0];
        layouts[bp] = Array.isArray(layouts[validBp]) ? [...layouts[validBp]] : [];
      });
    }
  }
  
  return true;
}

/**
 * Validates an individual layout item
 * Checks for required properties like id and position
 * 
 * @param {Object} item - Layout item to validate
 * @param {boolean} autoFix - Attempt to fix invalid properties with defaults
 * @returns {boolean} True if item is valid or was fixed
 */
export function isValidLayoutItem(item, autoFix = false) {
  const isValid = (
    item && 
    typeof item === 'object' &&
    typeof item.i === 'string' && 
    item.i.length > 0 &&
    typeof item.x === 'number' &&
    typeof item.y === 'number' &&
    typeof item.w === 'number' &&
    typeof item.h === 'number'
  );
  
  if (!isValid && autoFix && item && typeof item === 'object') {
    // Try to fix the item
    if (!item.i || typeof item.i !== 'string') {
      item.i = `item-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    }
    
    if (typeof item.x !== 'number') item.x = 0;
    if (typeof item.y !== 'number') item.y = 0;
    
    const defaultSize = getModuleDefaultSize('default');
    if (typeof item.w !== 'number') item.w = defaultSize.w;
    if (typeof item.h !== 'number') item.h = defaultSize.h;
    
    // Check if all required properties are now valid
    return isValidLayoutItem(item, false);
  }
  
  return isValid;
}

/**
 * Ensures a layouts object has all breakpoints and only contains valid items
 * Creates a clean, normalized layout structure
 * 
 * @param {Object} layouts - Layouts to normalize
 * @param {boolean} autoFix - Attempt to fix invalid items
 * @returns {Object} Normalized layouts
 */
export function normalizeLayouts(layouts, autoFix = false) {
  const safeLayouts = {};

  DEFAULT_BREAKPOINTS.forEach(bp => {
    const items = layouts?.[bp];
    
    if (Array.isArray(items)) {
      // Filter out invalid items or fix them if autoFix is true
      safeLayouts[bp] = items
        .map(item => {
          const isValid = isValidLayoutItem(item, autoFix);
          return isValid ? item : null;
        })
        .filter(Boolean); // Remove null items
    } else {
      console.warn(`normalizeLayouts: ${bp} is not an array, creating empty array`);
      safeLayouts[bp] = [];
    }
  });

  // Final validation to absolutely ensure all breakpoints are arrays
  // This is the last line of defense against the "t.lg.find is not a function" error
  DEFAULT_BREAKPOINTS.forEach(bp => {
    if (!Array.isArray(safeLayouts[bp])) {
      console.error(`Final validation failed: ${bp} is not an array, forcibly converting`);
      safeLayouts[bp] = [];
    }
  });

  return safeLayouts;
}

/**
 * Transform raw layouts data into react-grid-layout format
 * @param {Object} rawLayouts - Raw layouts data from storage
 * @returns {Object} - Transformed layouts ready for react-grid-layout
 */
export function transformLayoutsForGrid(rawLayouts) {
  if (!rawLayouts || typeof rawLayouts !== 'object') {
    return createEmptyLayouts();
  }

  const transformed = {};
  DEFAULT_BREAKPOINTS.forEach(bp => {
    transformed[bp] = Array.isArray(rawLayouts[bp]) 
      ? rawLayouts[bp].map(item => transformLayoutItem(item))
      : [];
  });

  return transformed;
}

/**
 * Transform a single layout item
 * @param {Object} item - Layout item to transform
 * @returns {Object} - Transformed item
 */
export function transformLayoutItem(item) {
  if (!isValidLayoutItem(item)) {
    const defaultSize = getModuleDefaultSize('default');
    return {
      i: item?.i || `default-${Date.now()}`,
      x: 0,
      y: 0,
      w: defaultSize.w,
      h: defaultSize.h,
      minW: 3,
      minH: 3
    };
  }
  
  return {
    ...item,
    minW: item.minW || 3,
    minH: item.minH || 3
  };
}

/**
 * Transform layouts data based on session data and items
 * @param {Object} options - Options object
 * @param {Object} options.sessionData - Session data from server
 * @param {Array} options.items - Available module items
 * @returns {Object} The transformed layouts
 */
export async function transformLayouts({ sessionData, items }) {
  try {
    // Handle no session data with more detailed logging
    if (!sessionData || typeof sessionData !== 'object') {
      console.warn('No session data provided or invalid format, returning empty layouts', { 
        sessionDataType: typeof sessionData,
        sessionDataValue: sessionData
      });
      return createEmptyLayouts();
    }

    // Transform session layouts data with extra safety
    let fromSession;
    try {
      fromSession = hydrateLayoutsFromDB(sessionData?.grid_layout);
      console.log('Layouts hydrated successfully:', {
        success: !!fromSession,
        hasBreakpoints: fromSession ? Object.keys(fromSession).length > 0 : false
      });
    } catch (hydrateError) {
      console.error('Error hydrating layouts from DB:', hydrateError);
      fromSession = createEmptyLayouts();
    }
    
    // Validate and auto-fix the hydrated layouts
    const isValidLayout = isValidResponsiveLayout(fromSession, true);
    if (!isValidLayout) {
      console.warn('Invalid layouts after hydration and auto-fix, forcing empty layouts');
      return createEmptyLayouts();
    }
    
    // Check for active modules that need layouts items
    const hasActiveModules = Array.isArray(sessionData?.active_modules) && sessionData.active_modules.length > 0;
    if (hasActiveModules) {
      const hasLayoutsItems = countLayoutsItems(fromSession) > 0;
      
      // Create layouts items for active modules if none exist
      if (!hasLayoutsItems) {
        console.log('Creating layouts items for active modules');
        const newLayouts = createEmptyLayouts();

        for (const moduleId of sessionData.active_modules) {
          if (moduleId && typeof moduleId === 'string' && moduleId.includes('-')) {
            const parts = moduleId.split('-');
            
            // Only process three-part IDs: MODULETYPE-STATICID-INSTANCEID
            if (parts.length === 3) {
              const moduleType = parts[0].toUpperCase(); // Ensure uppercase for Python enum compatibility
              const staticIdentifier = parts[1];
              const instanceId = parts[2];
              
              try {
                // Use dynamic import to avoid circular dependencies
                const LayoutPositioning = await import('./LayoutPositioning');
                const { createLayoutItemForAllBreakpoints } = LayoutPositioning;
                
                const layoutsItems = createLayoutItemForAllBreakpoints(moduleType, staticIdentifier, newLayouts);
                
                // Add items to each breakpoint
                Object.entries(layoutsItems).forEach(([bp, item]) => {
                  if (item) {
                    item.i = moduleId;
                    item.moduleType = moduleType;
                    newLayouts[bp].push(item);
                  }
                });
              } catch (itemError) {
                console.error(`Error creating layout item for module ${moduleId}:`, itemError);
                // Continue with the next module
              }
            } else {
              console.warn(`Skipping invalid module ID format: ${moduleId}. Expected MODULETYPE-STATICID-INSTANCEID format.`);
            }
          }
        }

        return newLayouts;
      }
    }

    // Use existing layouts or create empty one
    return fromSession && Object.keys(fromSession).length > 0
      ? fromSession
      : createEmptyLayouts();
  } catch (error) {
    console.error('Error in transformLayouts:', error);
    return createEmptyLayouts();
  }
}

/**
 * Count total layouts items across all breakpoints
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
 * Create an empty layouts with all breakpoints initialized as arrays
 * @returns {Object} Empty layouts object with arrays for each breakpoint
 */
export function createEmptyLayouts() {
  const emptyLayouts = {};
  DEFAULT_BREAKPOINTS.forEach(bp => {
    // Always initialize as arrays for react-grid-layout
    emptyLayouts[bp] = [];
  });
  return emptyLayouts;
}

/**
 * Rehydrate layouts data from storage format
 * @param {Object|string} storedLayouts - Layouts data from storage
 * @returns {Object} Processed layouts ready for use
 * @throws {Error} If the layouts data is invalid and cannot be fixed
 */
export function hydrateLayoutsFromDB(storedLayouts) {
  try {
    // Handle completely undefined or null input
    if (!storedLayouts) {
      console.warn('hydrateLayoutsFromDB: No stored layouts data provided - creating empty layouts');
      const emptyLayouts = createEmptyLayouts();
      console.log('Created empty layouts with array breakpoints:', 
        Object.keys(emptyLayouts).map(bp => `${bp}: []`).join(', '));
      return emptyLayouts;
    }
    
    // Parse JSON string if needed
    if (typeof storedLayouts === 'string') {
      try {
        console.log('Parsing JSON string layout data:', {
          preview: storedLayouts.slice(0, 100) + (storedLayouts.length > 100 ? '...' : ''),
          length: storedLayouts.length
        });
        storedLayouts = JSON.parse(storedLayouts);
      } catch (parseErr) {
        console.warn('hydrateLayoutsFromDB: Failed to parse layouts JSON:', {
          error: parseErr.message,
          previewData: typeof storedLayouts === 'string' ? 
            storedLayouts.slice(0, 100) + (storedLayouts.length > 100 ? '...' : '') : 
            'Not a string'
        });
        return createEmptyLayouts();
      }
    }

    // Validate basic structure
    if (typeof storedLayouts !== 'object') {
      console.warn(`hydrateLayoutsFromDB: Invalid layouts type: ${typeof storedLayouts}`);
      return createEmptyLayouts();
    }
    
    // Handle backend API format where response may be wrapped in an object
    if (storedLayouts.grid_layout && typeof storedLayouts.grid_layout === 'object') {
      storedLayouts = storedLayouts.grid_layout;
    }

    // We now expect array format from the backend
    const convertedLayouts = {};
    // First initialize all breakpoints with empty arrays
    DEFAULT_BREAKPOINTS.forEach(bp => {
      convertedLayouts[bp] = [];
    });

    // Log what we're processing for debugging
    console.log('hydrateLayoutsFromDB: Processing storage formats', {
      breakpointsReceived: Object.keys(storedLayouts),
      formatSample: Object.keys(storedLayouts).length > 0 ? 
        (Array.isArray(storedLayouts[Object.keys(storedLayouts)[0]]) ? 'array' : 
         typeof storedLayouts[Object.keys(storedLayouts)[0]]) : 'unknown'
    });

    // Process available breakpoints from the stored data
    Object.keys(storedLayouts).forEach(bp => {
      if (DEFAULT_BREAKPOINTS.includes(bp)) {
        // Backend now always provides array format
        if (Array.isArray(storedLayouts[bp])) {
          // Array format as expected
          convertedLayouts[bp] = storedLayouts[bp];
        } else {
          // Handle unexpected format (legacy data or error)
          console.warn(`Unexpected data format for breakpoint ${bp}: expected array but got ${typeof storedLayouts[bp]}`);
          convertedLayouts[bp] = [];
        }
        
        // Always ensure items array is valid and each item has required properties
        if (!Array.isArray(convertedLayouts[bp])) {
          console.warn(`Invalid breakpoint data for ${bp}:`, convertedLayouts[bp]);
          convertedLayouts[bp] = [];
        } else {
          // Filter out any invalid items
          convertedLayouts[bp] = convertedLayouts[bp].filter(item => {
            if (!item || typeof item !== 'object' || !item.i) {
              console.warn(`Filtering invalid layout item in ${bp}:`, item);
              return false;
            }
            return true;
          });
        }
        
        // Extra protection against 't.lg.find is not a function' error
        if (!Array.isArray(convertedLayouts[bp])) {
          console.error(`Critical error: ${bp} is still not an array after processing, forcing empty array`);
          convertedLayouts[bp] = [];
        }
      }
    });

    // Check that we have at least one valid breakpoint
    const hasAnyBreakpoint = DEFAULT_BREAKPOINTS.some(bp => 
      Array.isArray(convertedLayouts[bp]) && convertedLayouts[bp].length > 0
    );

    // Log final layout structure for debugging
    console.log('Final layout structure after processing:', {
      breakpoints: DEFAULT_BREAKPOINTS.map(bp => 
        `${bp}: ${Array.isArray(convertedLayouts[bp]) ? 
          `Array(${convertedLayouts[bp].length})` : typeof convertedLayouts[bp]}`
      ),
      hasItems: hasAnyBreakpoint
    });

    if (!hasAnyBreakpoint) {
      // Enhanced debugging to show what we received
      console.warn('No valid breakpoints found in layout data, using empty layouts', {
        originalData: storedLayouts, 
        convertedData: convertedLayouts,
        breakpoints: DEFAULT_BREAKPOINTS
      });
      return createEmptyLayouts();
    }

    // Normalize and validate the layouts
    return normalizeLayouts(convertedLayouts, true);
  } catch (err) {
    console.warn('hydrateLayoutsFromDB: Error processing layouts data:', err);
    return createEmptyLayouts();
  }
}

/**
 * Prepare layouts for storage by cleaning and validating
 * @param {Object} layouts - Layouts to sanitize
 * @returns {Object} Sanitized layouts
 */
export function sanitizeLayoutsForStorage(layouts) {
  // First normalize to ensure valid layout structure
  const normalized = normalizeLayouts(layouts, true);

  // Remove internal properties and ensure required ones
  DEFAULT_BREAKPOINTS.forEach(bp => {
    if (normalized[bp]) {
      normalized[bp] = normalized[bp]
        .map(item => {
          if (!item || typeof item !== 'object') return null;

          const cleanItem = {
            i: item.i || `unknown-${Date.now()}`,
            x: typeof item.x === 'number' ? item.x : 0,
            y: typeof item.y === 'number' ? item.y : 0,
            w: typeof item.w === 'number' ? item.w : 12,
            h: typeof item.h === 'number' ? item.h : 8,
            minW: typeof item.minW === 'number' ? item.minW : 3,
            minH: typeof item.minH === 'number' ? item.minH : 3
          };

          // Preserve optional properties
          if (item.moduleType) cleanItem.moduleType = item.moduleType;
          if (item.instanceId) cleanItem.instanceId = item.instanceId;
          if (item.static !== undefined) cleanItem.static = item.static;

          return cleanItem;
        })
        .filter(Boolean); // Remove null items
    }
  });

  return normalized;
}