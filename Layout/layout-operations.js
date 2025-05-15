/**
 * layout-operations.js
 * High-level operations for manipulating layouts (add, remove, resize items)
 */

import { BREAKPOINTS } from './layout-constants';
import { validateLayoutItem, createEmptyLayout } from './layout-core';
import { getModuleDefaultSize, getOptimalPosition } from './layout-positioning';

/**
 * Finds a layout item by ID in a specific breakpoint
 * @param {Object} layouts - Current layouts
 * @param {string} itemId - ID of item to find
 * @param {string} breakpoint - Breakpoint to search in (optional)
 * @returns {Object|null} Found layout item or null
 */
export function findLayoutItem(layouts, itemId, breakpoint) {
  if (!layouts || !itemId) {
    return null;
  }
  
  // If breakpoint specified, only search in that breakpoint
  if (breakpoint && layouts[breakpoint]) {
    return layouts[breakpoint].find(item => item.i === itemId) || null;
  }
  
  // Otherwise search in all breakpoints and return first match
  for (const bp of BREAKPOINTS) {
    if (layouts[bp]) {
      const found = layouts[bp].find(item => item.i === itemId);
      if (found) {
        return found;
      }
    }
  }
  
  return null;
}

/**
 * Adds a layout item to all breakpoints with optimal positioning
 * @param {Object} layouts - Current layouts
 * @param {Object} item - Item to add (must have i property at minimum)
 * @returns {Object} Updated layouts
 */
export function addItemToAllBreakpoints(layouts, item) {
  if (!layouts || !item || !item.i) {
    return layouts;
  }
  
  // Get size props from item or use defaults
  const size = {
    w: item.w || 12,
    h: item.h || 8
  };
  
  // Create new layouts object to avoid mutating the input
  const newLayouts = { ...layouts };
  
  // Add to each breakpoint with appropriate positioning
  BREAKPOINTS.forEach(bp => {
    // Ensure breakpoint exists
    if (!Array.isArray(newLayouts[bp])) {
      newLayouts[bp] = [];
    }
    
    // Skip if item already exists in this breakpoint
    if (newLayouts[bp].some(existingItem => existingItem.i === item.i)) {
      return;
    }
    
    // Find optimal position
    const position = getOptimalPosition(bp, newLayouts[bp], size);
    
    // Create new item for this breakpoint
    const newItem = {
      i: item.i,
      x: position.x,
      y: position.y,
      w: size.w,
      h: size.h,
      // Pass through other properties from the original item
      ...item
    };
    
    // Add to this breakpoint
    newLayouts[bp].push(newItem);
  });
  
  return newLayouts;
}

/**
 * Removes an item from all breakpoints
 * @param {Object} layouts - Current layouts
 * @param {string} itemId - ID of item to remove
 * @returns {Object} Updated layouts
 */
export function removeItemFromAllBreakpoints(layouts, itemId) {
  if (!layouts || !itemId) {
    return layouts;
  }
  
  // Create new layouts object to avoid mutating the input
  const newLayouts = { ...layouts };
  
  // Remove from each breakpoint
  BREAKPOINTS.forEach(bp => {
    if (Array.isArray(newLayouts[bp])) {
      newLayouts[bp] = newLayouts[bp].filter(item => item.i !== itemId);
    }
  });
  
  return newLayouts;
}

/**
 * Updates an existing item in all breakpoints
 * @param {Object} layouts - Current layouts
 * @param {Object} updatedItem - Item with updated properties
 * @returns {Object} Updated layouts
 */
export function updateItemInAllBreakpoints(layouts, updatedItem) {
  if (!layouts || !updatedItem || !updatedItem.i) {
    return layouts;
  }
  
  // Create new layouts object to avoid mutating the input
  const newLayouts = { ...layouts };
  
  // Update in each breakpoint
  BREAKPOINTS.forEach(bp => {
    if (Array.isArray(newLayouts[bp])) {
      newLayouts[bp] = newLayouts[bp].map(item => {
        if (item.i === updatedItem.i) {
          return { ...item, ...updatedItem };
        }
        return item;
      });
    }
  });
  
  return newLayouts;
}

/**
 * Updates the size of an item in all breakpoints
 * @param {Object} layouts - Current layouts
 * @param {string} itemId - ID of item to resize
 * @param {Object} newSize - New size {w, h}
 * @returns {Object} Updated layouts
 */
export function resizeItemInAllBreakpoints(layouts, itemId, newSize) {
  if (!layouts || !itemId || !newSize) {
    return layouts;
  }
  
  const { w, h } = newSize;
  
  if (typeof w !== 'number' || typeof h !== 'number') {
    return layouts;
  }
  
  // Create new layouts object to avoid mutating the input
  const newLayouts = { ...layouts };
  
  // Resize in each breakpoint
  BREAKPOINTS.forEach(bp => {
    if (Array.isArray(newLayouts[bp])) {
      newLayouts[bp] = newLayouts[bp].map(item => {
        if (item.i === itemId) {
          return { ...item, w, h };
        }
        return item;
      });
    }
  });
  
  return newLayouts;
}

/**
 * Creates a complete layout item for a module to be placed in all breakpoints
 * @param {string} moduleId - Module ID
 * @param {Object} currentLayouts - Current layouts structure
 * @param {Object} size - Size for the item {w, h}
 * @returns {Object} Updated layouts with the new item
 */
export function createItemForAllBreakpoints(moduleId, currentLayouts = {}, size = { w: 12, h: 8 }) {
  if (!moduleId) {
    return currentLayouts;
  }
  
  // Ensure we have valid layouts to work with
  const layouts = currentLayouts && typeof currentLayouts === 'object' ? 
    currentLayouts : createEmptyLayout();
  
  // Create base item
  const baseItem = {
    i: moduleId,
    w: size.w,
    h: size.h,
    // Default props for react-grid-layout
    minW: 2,
    minH: 2
  };
  
  return addItemToAllBreakpoints(layouts, baseItem);
}

/**
 * Reorders all items in a layout by y-position (top to bottom)
 * @param {Object} layouts - Current layouts
 * @returns {Object} Updated layouts with items reordered
 */
export function reorderLayoutsByPosition(layouts) {
  if (!layouts) {
    return createEmptyLayout();
  }
  
  const newLayouts = { ...layouts };
  
  BREAKPOINTS.forEach(bp => {
    if (Array.isArray(newLayouts[bp])) {
      // Sort items by y then x position
      newLayouts[bp].sort((a, b) => {
        if (a.y === b.y) {
          return a.x - b.x;
        }
        return a.y - b.y;
      });
    }
  });
  
  return newLayouts;
}

/**
 * Compacts a layout to remove empty spaces
 * Note: This is a simplified version. For production use,
 * consider using react-grid-layout's built-in compaction.
 * 
 * @param {Object} layouts - Current layouts
 * @param {string} breakpoint - Specific breakpoint to compact
 * @returns {Object} Compacted layouts
 */
export function compactLayout(layouts, breakpoint) {
  // Simple implementation - for a full implementation,
  // this would recreate the positioning algorithm from react-grid-layout
  // which is complex and outside the scope here
  
  if (!layouts || !breakpoint || !Array.isArray(layouts[breakpoint])) {
    return layouts;
  }
  
  // For now, just return the layouts as-is with a note
  console.warn('Layout compaction is delegated to react-grid-layout');
  return layouts;
}
