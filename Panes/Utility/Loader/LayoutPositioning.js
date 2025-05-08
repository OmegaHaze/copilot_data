/**
 * Layout positioning utilities for optimal pane placement
 * Provides advanced positioning algorithms for grid layouts
 */

import { cols, findFirstAvailablePosition, DEFAULT_WIDTH, DEFAULT_HEIGHT } from './GridUtils.js';

// Module-specific default sizes - using GridUtils defaults
const MODULE_SIZE_MAP = {
  'supervisor': { w: 12, h: 8 },
  'nvidia': { w: 12, h: 8 },
  'cpu': { w: 12, h: 6 },
  'memory': { w: 12, h: 6 },
  'disk': { w: 12, h: 8 },
  'network': { w: 12, h: 8 },
  'default': { w: 12, h: 8 }
};

/**
 * Get default size for a specific module type
 * 
 * @param {string} moduleType - Type of module
 * @returns {Object} Width and height configuration
 */
export function getModuleDefaultSize(moduleType) {
  return MODULE_SIZE_MAP[moduleType.toLowerCase()] || MODULE_SIZE_MAP.default;
}

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
  // Get column count for this breakpoint
  const colCount = cols[breakpoint] || 12;
  
  // If no existing items, start at the origin
  if (!existingItems || !existingItems.length) {
    return { x: 0, y: 0 };
  }
  
  // Use the utility function from GridUtils to find the best position
  return findFirstAvailablePosition(existingItems, colCount, newItemSize);
}

/**
 * Create a new layout item with proper positioning across all breakpoints
 * 
 * @param {string} moduleType - Type of module (supervisor, nvidia, etc)
 * @param {string} instanceId - Unique instance ID
 * @param {Object} currentLayouts - Current grid layouts for all breakpoints
 * @returns {Object} - New layout item suitable for all breakpoints
 */
export function createLayoutItemForAllBreakpoints(moduleType, instanceId, currentLayouts) {
  const paneId = `${moduleType}-${instanceId}`;
  const result = {};
  
  // Get default size based on module type
  const defaultSize = getModuleDefaultSize(moduleType);
  
  // Get all breakpoints from the current layouts or use defaults
  const breakpoints = currentLayouts ? Object.keys(currentLayouts) : ['lg', 'md', 'sm', 'xs', 'xxs'];
  
  // Create layout for each breakpoint
  breakpoints.forEach(bp => {
    const existingItems = currentLayouts && currentLayouts[bp] ? currentLayouts[bp] : [];
    const position = getOptimalPosition(bp, existingItems, defaultSize);
    
    result[bp] = {
      i: paneId,
      moduleType,
      instanceId,
      x: position.x,
      y: position.y,
      w: defaultSize.w,
      h: defaultSize.h,
      minW: 3,
      minH: 3
    };
  });
  
  return result;
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
  if (!currentLayouts || !paneId) return currentLayouts;
  
  const result = { ...currentLayouts };
  
  // Update each breakpoint
  Object.keys(result).forEach(bp => {
    if (!result[bp]) return;
    
    result[bp] = result[bp].map(item => {
      if (item.i === paneId) {
        return {
          ...item,
          w: newSize.w ?? item.w,
          h: newSize.h ?? item.h
        };
      }
      return item;
    });
  });
  
  return result;
}

/**
 * Find a layout item by ID across all breakpoints
 * 
 * @param {string} paneId - The ID of the pane to find
 * @param {Object} layouts - Current grid layouts
 * @returns {Object|null} - Found layout item or null
 */
export function findLayoutItem(paneId, layouts) {
  if (!layouts || !paneId) return null;
  
  for (const bp of Object.keys(layouts)) {
    const items = layouts[bp] || [];
    const found = items.find(item => item.i === paneId);
    if (found) return found;
  }
  return null;
}