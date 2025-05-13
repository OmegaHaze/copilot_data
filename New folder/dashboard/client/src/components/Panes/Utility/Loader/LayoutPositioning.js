// [LP-001] Layout Positioning - Advanced utilities for placing panes in grid layouts
/**
 * Layout positioning utilities for optimal pane placement
 * Provides advanced positioning algorithms for grid layouts
 */

import { cols, findFirstAvailablePosition, DEFAULT_WIDTH, DEFAULT_HEIGHT } from './GridUtils.js';

// [LP-002] Module Size Configuration - Default sizes for different module types
const MODULE_SIZE_MAP = {
  'SYSTEM': { w: 12, h: 8 },     // Supervisor modules
  'SERVICE': { w: 12, h: 8 },    // Service modules like NVIDIA
  'CPU': { w: 12, h: 6 },
  'MEMORY': { w: 12, h: 6 },
  'DISK': { w: 12, h: 8 },
  'NETWORK': { w: 12, h: 8 },
  'USER': { w: 12, h: 8 },
  'default': { w: 12, h: 8 }
};

// Default minimum sizes for all module types
const DEFAULT_MIN_SIZE = { w: 3, h: 3 };

// [LP-003] Module Size Retrieval - Gets default size based on module type
/**
 * Get default size for a specific module type
 * 
 * @param {string} moduleType - Type of module (SYSTEM, SERVICE, USER, etc.)
 * @returns {Object} Width and height configuration {w, h}
 */
export function getModuleDefaultSize(moduleType) {
  if (!moduleType) {
    return MODULE_SIZE_MAP.default;
  }
  
  // Ensure moduleType is uppercase to match our MODULE_SIZE_MAP keys
  const type = moduleType.toUpperCase();
  return MODULE_SIZE_MAP[type] || MODULE_SIZE_MAP.default;
}

// [LP-004] Optimal Position Calculation - Smart placement algorithm
/**
 * Get optimal position for a new pane based on existing layout
 * Analyzes the current layout to find the best placement for a new item
 * 
 * @param {string} breakpoint - The breakpoint name (lg, md, sm, xs, xxs)
 * @param {Array} existingItems - The existing layout items for this breakpoint
 * @param {Object} newItemSize - Width and height for the new item
 * @returns {Object} - { x, y } coordinates for optimal placement
 */
export function getOptimalPosition(breakpoint, existingItems = [], newItemSize = { w: 12, h: 8 }) {
  try {
    // Validate breakpoint
    if (!breakpoint || !cols[breakpoint]) {
      console.warn(`Invalid breakpoint: ${breakpoint}, using lg`);
      breakpoint = 'lg';
    }
    
    // Get column count for this breakpoint
    const colCount = cols[breakpoint] || cols.lg;
    
    // If no existing items, start at the origin
    if (!existingItems || !Array.isArray(existingItems) || existingItems.length === 0) {
      return { x: 0, y: 0 };
    }
    
    // Validate newItemSize
    if (!newItemSize || typeof newItemSize !== 'object') {
      newItemSize = { w: DEFAULT_WIDTH, h: DEFAULT_HEIGHT };
    }
    
    // Use the utility function from GridUtils to find the best position
    return findFirstAvailablePosition(existingItems, colCount, newItemSize);
  } catch (error) {
    console.error('Error in getOptimalPosition:', error);
    return { x: 0, y: 0 }; // Safe fallback
  }
}

/**
 * Create a new layout item with proper positioning across all breakpoints
 * 
 * @param {string} moduleType - Type of module (SYSTEM, SERVICE, USER)
 * @param {string} staticIdentifier - Static component identifier (e.g., SupervisorPane)
 * @param {Object} currentLayouts - Current grid layouts for all breakpoints
 * @returns {Object} - New layout item suitable for all breakpoints
 */
export function createLayoutItemForAllBreakpoints(moduleType, staticIdentifier, currentLayouts) {
  try {
    // Input validation
    if (!moduleType || !staticIdentifier) {
      console.error('moduleType and staticIdentifier are required');
      return {};
    }
    
    if (!currentLayouts || typeof currentLayouts !== 'object') {
      console.warn('Invalid currentLayouts, using empty layouts');
      currentLayouts = { lg: [], md: [], sm: [], xs: [], xxs: [] };
    }
    
    // Ensure moduleType is uppercase for consistency
    const type = moduleType.toUpperCase();
    
    // Get all breakpoints from the current layouts or use defaults
    const breakpoints = Object.keys(currentLayouts).length > 0 ? 
                       Object.keys(currentLayouts) : 
                       ['lg', 'md', 'sm', 'xs', 'xxs'];
    
    // Get default size based on module type
    const defaultSize = getModuleDefaultSize(type);
    
    // Create layout items for each breakpoint
    const result = {};
    
    breakpoints.forEach(bp => {
      // Get existing items for this breakpoint (with validation)
      const existingItems = Array.isArray(currentLayouts[bp]) ? 
                          currentLayouts[bp] : 
                          [];
      
      // Find optimal position
      const position = getOptimalPosition(bp, existingItems, defaultSize);
      
      // Create layout item for this breakpoint
      result[bp] = {
        // Don't set 'i' property here - it will be set by the caller
        moduleType: type,                 // Uppercase module type
        staticIdentifier,                 // Static component identifier
        x: position.x,
        y: position.y,
        w: defaultSize.w,
        h: defaultSize.h,
        minW: DEFAULT_MIN_SIZE.w,
        minH: DEFAULT_MIN_SIZE.h
      };
    });
    
    return result;
  } catch (error) {
    console.error('Error in createLayoutItemForAllBreakpoints:', error);
    return {}; // Return empty object as fallback
  }
}

/**
 * Update a layout item's size across all breakpoints
 * 
 * @param {string} paneId - The ID of the pane to update
 * @param {Object} currentLayouts - Current grid layouts
 * @param {Object} newSize - New width and height
 * @returns {Object} - Updated layouts
 */
export function updateLayoutItemSize(paneId, currentLayouts, newSize) {
  try {
    // Input validation
    if (!paneId || !currentLayouts || !newSize) {
      console.warn('Missing required parameters for updateLayoutItemSize');
      return currentLayouts;
    }
    
    if (typeof newSize !== 'object' || (typeof newSize.w !== 'number' && typeof newSize.h !== 'number')) {
      console.warn('Invalid newSize object');
      return currentLayouts;
    }
    
    // Create a new layouts object to avoid mutating the original
    const result = { ...currentLayouts };
    
    // Get list of breakpoints to update
    const breakpoints = Object.keys(result);
    
    // Update each breakpoint
    breakpoints.forEach(bp => {
      if (!Array.isArray(result[bp])) {
        result[bp] = [];
        return;
      }
      
      // Map to new array to avoid mutating original
      result[bp] = result[bp].map(item => {
        if (item.i === paneId) {
          return {
            ...item,
            w: typeof newSize.w === 'number' ? newSize.w : item.w,
            h: typeof newSize.h === 'number' ? newSize.h : item.h
          };
        }
        return item;
      });
    });
    
    return result;
  } catch (error) {
    console.error('Error in updateLayoutItemSize:', error);
    return currentLayouts; // Return original layouts as fallback
  }
}

/**
 * Find a layout item by ID across all breakpoints
 * 
 * @param {string} paneId - The ID of the pane to find
 * @param {Object} layouts - Current grid layouts
 * @returns {Object|null} - Found layout item or null
 */
export function findLayoutItem(paneId, layouts) {
  try {
    // Input validation
    if (!paneId || !layouts || typeof layouts !== 'object') {
      return null;
    }
    
    // Get list of breakpoints
    const breakpoints = Object.keys(layouts);
    
    // Check each breakpoint for the item
    for (const bp of breakpoints) {
      const items = Array.isArray(layouts[bp]) ? layouts[bp] : [];
      
      // Find item with matching ID
      const found = items.find(item => item && item.i === paneId);
      if (found) return found;
    }
    
    return null; // Not found in any breakpoint
  } catch (error) {
    console.error('Error in findLayoutItem:', error);
    return null;
  }
}