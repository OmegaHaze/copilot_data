/**
 * Layout positioning utilities for optimal pane placement
 * Provides advanced positioning algorithms for grid layouts
 */

import { cols, getBreakpoints, findFirstAvailablePosition } from './GridUtils.js';

// Module-specific default sizes
const MODULE_SIZE_MAP = {
  'supervisor': { w: 6, h: 4 },
  'nvidia': { w: 6, h: 4 },
  'cpu': { w: 6, h: 3 },
  'memory': { w: 6, h: 3 },
  'disk': { w: 6, h: 4 },
  'network': { w: 6, h: 4 },
  'default': { w: 6, h: 4 }
};

/**
 * Get default size for a specific module type
 * 
 * @param {string} moduleType - Type of module
 * @returns {Object} Width and height configuration
 */
export function getModuleDefaultSize(moduleType) {
  return MODULE_SIZE_MAP[moduleType] || MODULE_SIZE_MAP.default;
}

/**
 * Get optimal position for a new pane based on existing layout
 * Analyzes the current layout to find the best placement for a new item
 * 
 * @param {string} breakpoint - The breakpoint name (lg, md, sm, xs, xxs)
 * @param {Array} existingItems - The existing layout items for this breakpoint
 * @param {Object} newItemSize - Optional width and height for the new item
 * @returns {Object} - { x, y } coordinates for optimal placement
 */
export function getOptimalPosition(breakpoint, existingItems = [], newItemSize = { w: 6, h: 4 }) {
  // Get column count for this breakpoint
  const colCount = cols[breakpoint] || 12;
  
  // If no existing items, start at the origin
  if (!existingItems.length) {
    return { x: 0, y: 0 };
  }
  
  // Normalize existing items to ensure valid properties
  const normalizedItems = existingItems.map(item => ({
    i: item.i,
    x: item.x ?? 0,
    y: item.y ?? 0,
    w: item.w ?? 4,
    h: item.h ?? 4
  }));
  
  // First strategy: Find position below existing items
  // Find maximum Y coordinate + height
  const maxY = Math.max(
    ...normalizedItems.map(item => item.y + item.h),
    0 // Ensure non-empty array
  );
  
  // Try to place at start of the next row
  const belowPosition = { x: 0, y: maxY };
  
  // Second strategy: Find gaps in the layout
  // Use the utility function from GridUtils to find a position
  const gapPosition = findFirstAvailablePosition(normalizedItems, colCount, newItemSize);
  
  // Return the best position found
  return gapPosition || belowPosition;
}

/**
 * Create a new layout item with proper positioning across all breakpoints
 * 
 * @param {string} moduleType - Type of module (supervisor, nvidia, etc)
 * @param {string} instanceId - Unique instance ID
 * @param {Object} currentLayout - Current grid layout for all breakpoints
 * @returns {Object} - New layout item suitable for all breakpoints
 */
export function createLayoutItemForAllBreakpoints(moduleType, instanceId, currentLayout) {
  const paneId = `${moduleType}-${instanceId}`;
  const result = {};
  
  // Get default size based on module type
  const defaultSize = getModuleDefaultSize(moduleType);
  
  // Create layout for each breakpoint
  getBreakpoints().forEach(bp => {
    const existingItems = currentLayout[bp] || [];
    const position = getOptimalPosition(bp, existingItems, defaultSize);
    
    result[bp] = {
      i: paneId,
      moduleType,
      instanceId,
      x: position.x,
      y: position.y,
      w: defaultSize.w,
      h: defaultSize.h,
      minW: 2,
      minH: 3
    };
  });
  
  return result;
}

/**
 * Update a layout item's size across all breakpoints
 * 
 * @param {string} paneId - The ID of the pane to update
 * @param {Object} currentLayout - Current grid layout
 * @param {Object} newSize - New width and height
 * @returns {Object} - Updated layout
 */
export function updateLayoutItemSize(paneId, currentLayout, newSize) {
  const result = { ...currentLayout };
  
  // Update each breakpoint
  getBreakpoints().forEach(bp => {
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
 * @param {Object} layout - Current grid layout
 * @returns {Object|null} - Found layout item or null
 */
export function findLayoutItem(paneId, layout) {
  for (const bp of getBreakpoints()) {
    const items = layout[bp] || [];
    const found = items.find(item => item.i === paneId);
    if (found) return found;
  }
  return null;
}