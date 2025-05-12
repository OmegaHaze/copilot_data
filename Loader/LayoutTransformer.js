/**
 * LayoutTransformer.js
 * Essential layout transformation functions
 */

// Standard breakpoints
const BREAKPOINTS = ['lg', 'md', 'sm', 'xs', 'xxs'];

/**
 * Creates empty layouts with all breakpoints
 * @returns {Object} Empty layouts
 */
export function createEmptyLayouts() {
  const layouts = {};
  BREAKPOINTS.forEach(bp => {
    layouts[bp] = [];
  });
  return layouts;
}

/**
 * Validates an individual layout item
 * @param {Object} item - Layout item to validate
 * @returns {boolean} True if valid
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
 * Validates layouts structure
 * @param {Object} layouts - Layouts to validate
 * @returns {boolean} True if valid
 */
export function isValidResponsiveLayout(layouts) {
  if (!layouts || typeof layouts !== 'object') {
    return false;
  }
  
  return BREAKPOINTS.some(bp => 
    layouts[bp] && Array.isArray(layouts[bp])
  );
}

/**
 * Parses and transforms layouts from database/storage
 * @param {Object|string} storedLayouts - Raw layouts data
 * @returns {Object} Processed layouts
 */
export function hydrateLayoutsFromDB(storedLayouts) {
  if (!storedLayouts) {
    return createEmptyLayouts();
  }
  
  try {
    // Parse JSON string if needed
    if (typeof storedLayouts === 'string') {
      storedLayouts = JSON.parse(storedLayouts);
    }
    
    // Handle API response format
    if (storedLayouts.grid_layout) {
      storedLayouts = storedLayouts.grid_layout;
    }
    
    // Initialize result with empty arrays
    const result = createEmptyLayouts();
    
    // Copy valid arrays for each breakpoint
    BREAKPOINTS.forEach(bp => {
      if (Array.isArray(storedLayouts[bp])) {
        result[bp] = storedLayouts[bp];
      }
    });
    
    return result;
  } catch (err) {
    console.warn('Error processing layouts:', err);
    return createEmptyLayouts();
  }
}

/**
 * Prepare layouts for storage by ensuring correct format
 * @param {Object} layouts - Layouts to sanitize
 * @returns {Object} Storage-ready layouts
 */
export function sanitizeLayoutsForStorage(layouts) {
  const result = createEmptyLayouts();
  
  if (layouts && typeof layouts === 'object') {
    BREAKPOINTS.forEach(bp => {
      if (Array.isArray(layouts[bp])) {
        result[bp] = layouts[bp].filter(isValidLayoutItem);
      }
    });
  }
  
  return result;
}

/**
 * Count total layouts items
 * @param {Object} layouts - Layouts object
 * @returns {number} Item count
 */
export function countLayoutsItems(layouts) {
  if (!layouts) return 0;
  
  return Object.values(layouts).reduce(
    (count, breakpoint) => count + (Array.isArray(breakpoint) ? breakpoint.length : 0),
    0
  );
}

/**
 * Transform layouts from session data
 * @param {Object} options - Options
 * @param {Object} options.sessionData - Session data
 * @returns {Object} Transformed layouts
 */
export async function transformLayouts({ sessionData }) {
  if (!sessionData) return createEmptyLayouts();
  
  try {
    // Use grid_layout from session if available
    if (sessionData.grid_layout) {
      return hydrateLayoutsFromDB(sessionData.grid_layout);
    }
  } catch (err) {
    console.error('Error transforming layouts:', err);
  }
  
  return createEmptyLayouts();
}