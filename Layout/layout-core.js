/**
 * core.js
 * Core layout primitives and utilities
 */

import { BREAKPOINTS, DEFAULT_MODULE_SIZE, VALIDATION } from './layout-constants';

/**
 * Creates an empty layout structure with all responsive breakpoints
 * @returns {Object} Empty layouts object with all breakpoints initialized
 */
export function createEmptyLayout() {
  const layouts = {};
  BREAKPOINTS.forEach(bp => {
    layouts[bp] = [];
  });
  return layouts;
}

/**
 * Validates that a layout item has all required properties
 * @param {Object} item - Layout item to validate
 * @returns {boolean} True if item has all required properties
 */
export function validateLayoutItem(item) {
  if (!item || typeof item !== 'object') {
    return false;
  }
  
  return VALIDATION.REQUIRED_ITEM_PROPS.every(prop => {
    if (prop === 'i') {
      return typeof item[prop] === 'string' && item[prop].length > 0;
    }
    return typeof item[prop] === 'number';
  });
}

/**
 * Validates the entire layout structure has all required breakpoints
 * @param {Object} layouts - Layout object to validate
 * @returns {boolean} True if layout is valid
 */
export function validateLayout(layouts) {
  // Check if layouts is an object
  if (!layouts || typeof layouts !== 'object') {
    return false;
  }
  
  // Check if layouts has all required breakpoints
  for (const breakpoint of BREAKPOINTS) {
    if (!layouts[breakpoint] || !Array.isArray(layouts[breakpoint])) {
      return false;
    }
    
    // Validate each layout item
    for (const item of layouts[breakpoint]) {
      if (!validateLayoutItem(item)) {
        return false;
      }
    }
  }
  
  return true;
}

/**
 * Transforms layouts into a format suitable for storage or API transmission
 * @param {Object} layouts - Layouts to transform
 * @returns {Object} Transformed layouts
 */
export function transformLayout(layouts) {
  // Start with an empty layout structure
  const result = createEmptyLayout();
  
  // If layouts is null or invalid, return empty structure
  if (!layouts || typeof layouts !== 'object') {
    return result;
  }
  
  // Copy valid arrays for each breakpoint
  BREAKPOINTS.forEach(bp => {
    if (Array.isArray(layouts[bp])) {
      // Only include valid items
      result[bp] = layouts[bp].filter(validateLayoutItem);
    }
  });
  
  return result;
}

/**
 * Counts the total number of items across all breakpoints
 * @param {Object} layouts - Layouts to count items in
 * @returns {number} Total number of items
 */
export function countLayoutItems(layouts) {
  if (!layouts) return 0;
  
  let count = 0;
  BREAKPOINTS.forEach(bp => {
    if (Array.isArray(layouts[bp])) {
      count += layouts[bp].length;
    }
  });
  return count;
}

/**
 * Finds a layout item by ID across all breakpoints
 * @param {Object} layouts - Layouts to search in
 * @param {string} id - ID of the item to find
 * @returns {Object|null} Found item and its breakpoint, or null if not found
 */
export function findLayoutItem(layouts, id) {
  if (!layouts || !id) return null;
  
  for (const bp of BREAKPOINTS) {
    if (!Array.isArray(layouts[bp])) continue;
    
    const item = layouts[bp].find(item => item.i === id);
    if (item) {
      return { 
        item,
        breakpoint: bp
      };
    }
  }
  
  return null;
}

/**
 * Creates a layout item with specified properties
 * @param {string} id - Item ID
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {number} w - Width
 * @param {number} h - Height
 * @param {boolean} isResizable - Whether the item is resizable
 * @param {boolean} isDraggable - Whether the item is draggable
 * @returns {Object} Layout item
 */
export function createLayoutItem(id, x, y, w, h, isResizable = true, isDraggable = true) {
  return {
    i: id,
    x,
    y,
    w: w || DEFAULT_MODULE_SIZE.w,
    h: h || DEFAULT_MODULE_SIZE.h,
    isResizable,
    isDraggable
  };
}

/**
 * Checks if a layout item exists in any breakpoint
 * @param {Object} layouts - Layouts to check
 * @param {string} id - ID to check for
 * @returns {boolean} True if item exists
 */
export function layoutItemExists(layouts, id) {
  return Boolean(findLayoutItem(layouts, id));
}

/**
 * Adds a layout item to all breakpoints
 * @param {Object} layouts - Layouts to add to
 * @param {Object} item - Item to add (must have `i` property)
 * @returns {Object} Updated layouts
 */
export function addItemToAllBreakpoints(layouts, item) {
  if (!layouts || !item || !item.i) {
    return layouts;
  }
  
  const updatedLayouts = { ...layouts };
  
  BREAKPOINTS.forEach(bp => {
    if (!Array.isArray(updatedLayouts[bp])) {
      updatedLayouts[bp] = [];
    }
    
    // Don't add if already exists in this breakpoint
    if (!updatedLayouts[bp].find(i => i.i === item.i)) {
      updatedLayouts[bp] = [...updatedLayouts[bp], { ...item }];
    }
  });
  
  return updatedLayouts;
}

/**
 * Removes a layout item from all breakpoints
 * @param {Object} layouts - Layouts to remove from
 * @param {string} id - ID of item to remove
 * @returns {Object} Updated layouts
 */
export function removeItemFromAllBreakpoints(layouts, id) {
  if (!layouts || !id) {
    return layouts;
  }
  
  const updatedLayouts = { ...layouts };
  
  BREAKPOINTS.forEach(bp => {
    if (Array.isArray(updatedLayouts[bp])) {
      updatedLayouts[bp] = updatedLayouts[bp].filter(item => item.i !== id);
    }
  });
  
  return updatedLayouts;
}
