/**
 * positioning.js
 * Smart placement algorithms for layout items
 */

import { COLS, MODULE_SIZE_MAP, DEFAULT_MODULE_SIZE } from './layout-constants';
import { createLayoutItem } from './layout-core';

/**
 * Gets the default size for a module type
 * @param {string} moduleType - Type of module (SYSTEM, SERVICE, USER, etc.)
 * @returns {Object} Width and height configuration {w, h}
 */
export function getModuleDefaultSize(moduleType) {
  if (!moduleType) {
    return DEFAULT_MODULE_SIZE;
  }
  
  // Ensure moduleType is uppercase to match our MODULE_SIZE_MAP keys
  const type = moduleType.toUpperCase();
  return MODULE_SIZE_MAP[type] || MODULE_SIZE_MAP.default;
}

/**
 * Checks if a position would cause a collision in the grid
 * @param {Array} layout - Current layout items
 * @param {Object} itemToCheck - Item to check for collisions (x, y, w, h)
 * @returns {boolean} True if collision would occur
 */
export function collisionExists(layout, itemToCheck) {
  if (!layout || !Array.isArray(layout)) return false;
  
  return layout.some(item => {
    // Check if item is different
    if (item.i === itemToCheck.i) return false;
    
    // Check for overlap
    return !(
      itemToCheck.x + itemToCheck.w <= item.x ||
      itemToCheck.x >= item.x + item.w ||
      itemToCheck.y + itemToCheck.h <= item.y ||
      itemToCheck.y >= item.y + item.h
    );
  });
}

/**
 * Find first available position for a new item
 * @param {Array} layout - Current layout items
 * @param {number} cols - Number of columns in grid
 * @param {Object} itemSize - Width and height of new item {w, h}
 * @returns {Object} Coordinates {x, y} for optimal position
 */
export function findFirstAvailablePosition(layout, cols, itemSize) {
  // Use provided size or default
  const size = {
    w: itemSize?.w || DEFAULT_MODULE_SIZE.w,
    h: itemSize?.h || DEFAULT_MODULE_SIZE.h
  };
  
  // Maximum column constraint
  const maxCol = Math.max(1, cols - size.w + 1);
  
  // Start with position 0,0
  let y = 0;
  let allPositionsChecked = false;
  
  // Keep searching until we find a position or check everything
  while (!allPositionsChecked) {
    for (let x = 0; x < maxCol; x++) {
      // Create a test item
      const testItem = { x, y, w: size.w, h: size.h };
      
      // Check if this position works
      if (!collisionExists(layout, testItem)) {
        return { x, y };
      }
    }
    
    // Move to next row
    y++;
    
    // Simple safety check to avoid infinite loop
    // A reasonable max rows is 1000
    if (y > 1000) {
      allPositionsChecked = true;
    }
  }
  
  // If we've checked all positions, return a position at the bottom
  return { x: 0, y: getBottomRow(layout) };
}

/**
 * Get the bottom row of the current layout
 * @param {Array} layout - Current layout items
 * @returns {number} Y-coordinate after the last item
 */
export function getBottomRow(layout) {
  if (!layout || !Array.isArray(layout) || layout.length === 0) {
    return 0;
  }
  
  // Find the maximum y + h value
  return Math.max(...layout.map(item => item.y + item.h));
}

/**
 * Get optimal position for a new pane in a specific breakpoint
 * @param {string} breakpoint - The breakpoint name (lg, md, sm, xs, xxs)
 * @param {Array} existingItems - The existing layout items for this breakpoint
 * @param {Object} newItemSize - Width and height for the new item
 * @returns {Object} - { x, y } coordinates for optimal placement
 */
export function getOptimalPosition(breakpoint, existingItems = [], newItemSize) {
  // Validate breakpoint
  if (!breakpoint || !COLS[breakpoint]) {
    breakpoint = 'lg';
  }
  
  // Get column count for this breakpoint
  const colCount = COLS[breakpoint];
  
  // If no existing items, start at the origin
  if (!existingItems || !Array.isArray(existingItems) || existingItems.length === 0) {
    return { x: 0, y: 0 };
  }
  
  // Find the best position
  return findFirstAvailablePosition(existingItems, colCount, newItemSize);
}

/**
 * Creates layout items for all breakpoints
 * @param {string} itemId - ID of the new item
 * @param {Object} currentLayouts - Current grid layouts for all breakpoints
 * @param {Object} size - Optional size (w, h) for the item
 * @returns {Object} - New layouts with the item added to all breakpoints
 */
export function createItemForAllBreakpoints(itemId, currentLayouts, size) {
  // Ensure valid layouts object
  const layouts = { ...currentLayouts };
  COLS.forEach(bp => {
    if (!layouts[bp]) layouts[bp] = [];
  });
  
  // Create item for each breakpoint
  const result = { ...layouts };
  COLS.forEach(bp => {
    const position = getOptimalPosition(bp, layouts[bp], size);
    
    // Create the layout item
    const newItem = createLayoutItem(
      itemId,
      position.x,
      position.y,
      size?.w || DEFAULT_MODULE_SIZE.w,
      size?.h || DEFAULT_MODULE_SIZE.h
    );
    
    // Add to layout
    result[bp] = [...(result[bp] || []), newItem];
  });
  
  return result;
}

/**
 * Updates a layout item's size across all breakpoints
 * @param {Object} layouts - Current layouts
 * @param {string} itemId - ID of item to update
 * @param {Object} newSize - New size {w, h}
 * @returns {Object} Updated layouts
 */
export function updateItemSize(layouts, itemId, newSize) {
  if (!layouts || !itemId || !newSize) return layouts;
  
  const result = { ...layouts };
  
  // Update size in each breakpoint
  COLS.forEach(bp => {
    if (!Array.isArray(result[bp])) return;
    
    result[bp] = result[bp].map(item => {
      if (item.i === itemId) {
        return { 
          ...item, 
          w: newSize.w !== undefined ? newSize.w : item.w,
          h: newSize.h !== undefined ? newSize.h : item.h 
        };
      }
      return item;
    });
  });
  
  return result;
}
