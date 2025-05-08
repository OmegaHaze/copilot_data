/**
 * LayoutTransformer.js
 * Responsible for all layout data transformations and validation
 */

import { breakpoints, cols } from './GridUtils.js';
import { getModuleDefaultSize, createLayoutItemForAllBreakpoints } from './LayoutPositioning.js';

// Use consistent breakpoints
const DEFAULT_BREAKPOINTS = Object.keys(breakpoints);

/**
 * Validates if a layouts object is properly formatted for react-grid-layout
 * Checks that the object has arrays for at least one valid breakpoint
 * 
 * @param {Object} layouts - Layouts object to validate
 * @returns {boolean} True if layouts is valid
 */
export function isValidResponsiveLayout(layouts) {
  // First check if layouts is a valid object
  if (!layouts || typeof layouts !== 'object') {
    console.warn('isValidResponsiveLayout: Layouts is not a valid object', layouts);
    return false;
  }
  
  // Debug log for inspecting layouts structure
  console.log('Validating layouts structure:', {
    hasBreakpoints: DEFAULT_BREAKPOINTS.some(bp => layouts[bp] !== undefined),
    availableKeys: Object.keys(layouts),
    firstBp: DEFAULT_BREAKPOINTS[0],
    hasBpArrays: DEFAULT_BREAKPOINTS.map(bp => layouts[bp] ? Array.isArray(layouts[bp]) : false)
  });
  
  // We require at least one valid breakpoint with an array
  const validBreakpoints = DEFAULT_BREAKPOINTS.filter(bp => 
    layouts[bp] && Array.isArray(layouts[bp])
  );
  
  if (validBreakpoints.length === 0) {
    console.warn('isValidResponsiveLayout: No valid breakpoints found');
    return false;
  }
  
  // Log missing breakpoints as a warning but don't fail validation
  const missingBreakpoints = DEFAULT_BREAKPOINTS.filter(bp => 
    !layouts[bp] || !Array.isArray(layouts[bp])
  );
  
  if (missingBreakpoints.length > 0) {
    console.warn('isValidResponsiveLayout: Some breakpoints are missing or invalid:', missingBreakpoints);
  }
  
  return true;
}

/**
 * Validates an individual layout item
 * Checks for required properties like id and position
 * 
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
 * Creates a clean, normalized layout structure
 * 
 * @param {Object} layouts - Layouts to normalize
 * @returns {Object} Normalized layouts
 */
export function normalizeLayouts(layouts) {
  const safeLayouts = {};

  DEFAULT_BREAKPOINTS.forEach(bp => {
    const items = layouts?.[bp];
    safeLayouts[bp] = Array.isArray(items)
      ? items.filter(item => isValidLayoutItem(item))
      : [];
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
      i: item.i || `default-${Date.now()}`,
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
    // Handle no session data
    if (!sessionData || typeof sessionData !== 'object') {
      console.warn('No session data provided or invalid format');
      return createEmptyLayouts();
    }

    // Extra debug information
    console.log('Transform layouts - session data available:', {
      hasGridLayout: !!sessionData.grid_layout,
      activeModulesCount: sessionData?.active_modules?.length || 0,
      sessionDataType: typeof sessionData,
      sessionKeys: Object.keys(sessionData)
    });

    // If we don't have grid_layout, log the issue but continue with empty layouts
    if (!sessionData.grid_layout) {
      console.warn('No grid_layout found in session data');
      return createEmptyLayouts();
    }

    // Transform session layouts data
    let fromSession;
    try {
      fromSession = hydrateLayoutsFromDB(sessionData.grid_layout);
    } catch (hydrateError) {
      console.error('Error hydrating layouts from DB:', hydrateError);
      return createEmptyLayouts();
    }
    
    // Validate the hydrated layouts
    const isValidLayout = isValidResponsiveLayout(fromSession);
    if (!isValidLayout) {
      console.warn('Invalid layouts after hydration');
      return createEmptyLayouts();
    }
    
    // Simply return the validated layouts
    return fromSession;
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
 * Create an empty layouts with all breakpoints
 * @returns {Object} Empty layouts object
 */
export function createEmptyLayouts() {
  const emptyLayouts = {};
  DEFAULT_BREAKPOINTS.forEach(bp => {
    emptyLayouts[bp] = [];
  });
  return emptyLayouts;
}

/**
 * Rehydrate layouts data from storage format
 * @param {Object|string} storedLayouts - Layouts data from storage
 * @returns {Object} Processed layouts ready for use
 * @throws {Error} If the layouts data is invalid
 */
export function hydrateLayoutsFromDB(storedLayouts) {
  // Parse JSON string if needed
  if (typeof storedLayouts === 'string') {
    try {
      storedLayouts = JSON.parse(storedLayouts);
    } catch (parseErr) {
      console.error('Failed to parse layouts JSON:', parseErr);
      throw new Error('Failed to parse layouts JSON');
    }
  }

  // Validate basic structure
  if (!storedLayouts || typeof storedLayouts !== 'object') {
    console.error('Invalid layouts format:', storedLayouts);
    throw new Error('Invalid layouts format');
  }

  // Handle backend API format where response may be wrapped in an object
  // This is a common pattern for API responses that include metadata
  if (storedLayouts.grid_layout && typeof storedLayouts.grid_layout === 'object') {
    storedLayouts = storedLayouts.grid_layout;
  }

  // Convert different storage formats
  const convertedLayouts = {};
  // First initialize all breakpoints with empty arrays
  DEFAULT_BREAKPOINTS.forEach(bp => {
    convertedLayouts[bp] = [];
  });

  // Then process available breakpoints from the stored data
  Object.keys(storedLayouts).forEach(bp => {
    if (DEFAULT_BREAKPOINTS.includes(bp)) {
      convertedLayouts[bp] = Array.isArray(storedLayouts[bp])
        ? storedLayouts[bp]
        : Object.values(storedLayouts[bp] || {});
      
      if (!Array.isArray(convertedLayouts[bp])) {
        console.error(`Invalid breakpoint data for ${bp}:`, convertedLayouts[bp]);
        convertedLayouts[bp] = []; // Use empty array instead of throwing
      }
    }
  });

  // Check that we have at least one valid breakpoint
  const hasAnyBreakpoint = DEFAULT_BREAKPOINTS.some(bp => 
    Array.isArray(convertedLayouts[bp]) && convertedLayouts[bp].length > 0
  );

  if (!hasAnyBreakpoint) {
    console.warn('No valid breakpoints found in layout data, using empty layouts');
    // Instead of throwing an error, return empty layouts
    return createEmptyLayouts();
  }

  return normalizeLayouts(convertedLayouts);
}

/**
 * Prepare layouts for storage by cleaning and validating
 * @param {Object} layouts - Layouts to sanitize
 * @returns {Object} Sanitized layouts
 */
export function sanitizeLayoutsForStorage(layouts) {
  const normalized = normalizeLayouts(layouts);

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
        .filter(Boolean);
    }
  });

  return normalized;
}
