/**
 * GridUtils.js - Utilities for React Grid Layout system
 * Provides constants and functions for grid layout generation
 */

// Default dimensions for grid items
export const DEFAULT_WIDTH = 12;
export const DEFAULT_HEIGHT = 8;

/**
 * Breakpoint definitions for responsive layouts
 * Maps breakpoint names to min-width in pixels
 */
export const breakpoints = {
  lg: 1600, // Large desktop
  md: 1200, // Desktop
  sm: 768,  // Tablet
  xs: 480,  // Mobile landscape
  xxs: 0    // Mobile portrait
};

/**
 * Column count for each breakpoint
 * Determines how many columns are available at each screen size
 */
export const cols = {
  lg: 48, // More granular layout for large screens
  md: 36, // Medium granularity for desktop
  sm: 24, // Reduced columns for tablet
  xs: 6,  // Minimal columns for mobile landscape
  xxs: 2  // Basic layout for mobile portrait
};

/**
 * Get all breakpoint names as an array
 * @returns {string[]} Array of breakpoint names
 */
export const getBreakpoints = () => Object.keys(breakpoints);

/**
 * Generate responsive layouts for all breakpoints
 * @param {Array} items - Item configurations to layout
 * @returns {Object} Layouts configuration for all breakpoints
 */
export function generateDefaultLayout(items = []) {
  if (!Array.isArray(items)) {
    console.warn('generateDefaultLayout: items is not an array');
    return { lg: [], md: [], sm: [], xs: [], xxs: [] };
  }
  
  const layouts = {};

  Object.entries(cols).forEach(([breakpoint, colCount]) => {
    layouts[breakpoint] = generateLayoutForBreakpoint(items, colCount);
  });

  return layouts;
}

/**
 * Generate layout for a single breakpoint
 * Places items in a grid following standard left-to-right, top-to-bottom placement
 * 
 * @param {Array} items - Item configurations to layout
 * @param {number} colCount - Number of columns available
 * @returns {Array} Layout configuration for the specified breakpoint
 */
export function generateLayoutForBreakpoint(items = [], colCount = 48) {
  if (!Array.isArray(items)) {
    console.warn('generateLayoutForBreakpoint: items is not an array');
    return [];
  }
  
  if (typeof colCount !== 'number' || colCount <= 0) {
    console.warn(`Invalid column count: ${colCount}, using default 48`);
    colCount = 48;
  }
  
  const result = [];
  let x = 0;
  let y = 0;

  items.forEach((item) => {
    // Skip invalid items
    if (!item || typeof item !== 'object') {
      return;
    }
    
    // Extract key from module or name property
    const key = item.module?.toLowerCase() || item.name?.toLowerCase();
    if (!key) return;

    // Get dimensions, potentially from item or use defaults
    const w = typeof item.width === 'number' ? item.width : DEFAULT_WIDTH;
    const h = typeof item.height === 'number' ? item.height : DEFAULT_HEIGHT;

    // Safety check to prevent items wider than the grid
    const itemWidth = Math.min(w, colCount);
    
    // Create the layout item
    result.push({
      i: key,         // Unique identifier
      x,              // X position
      y,              // Y position
      w: itemWidth,   // Width (constrained to grid)
      h,              // Height
      static: false,  // Allow movement/resizing
      minW: 3,        // Minimum width
      minH: 3         // Minimum height
    });

    // Calculate next position
    x += itemWidth;
    if (x + DEFAULT_WIDTH > colCount) {
      x = 0;
      y += h;
    }
  });

  return result;
}

/**
 * Merge items from different module types into a single array
 * Used to combine all possible grid items before filtering
 * 
 * @param {Array} services - Service module items 
 * @param {Object} modules - Module collections by type
 * @returns {Array} Combined array of all items
 */
export function getAllGridItems(services = [], modules = {}) {
  if (!Array.isArray(services)) {
    console.warn('getAllGridItems: services is not an array');
    services = [];
  }
  
  if (!modules || typeof modules !== 'object') {
    console.warn('getAllGridItems: modules is not an object');
    modules = {};
  }
  
  return [
    ...services,
    ...(Array.isArray(modules.SYSTEM) ? modules.SYSTEM : []),
    ...(Array.isArray(modules.SERVICE) ? modules.SERVICE : []),
    ...(Array.isArray(modules.USER) ? modules.USER : [])
  ].filter(Boolean); // Remove null/undefined items
}

/**
 * Check if a layout item is valid
 * Must have an id and position properties
 * 
 * @param {Object} item - Layout item to validate
 * @returns {boolean} True if the item is valid
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
 * Find the first available position in a layout
 * Useful for placing new items
 * 
 * @param {Array} layoutItems - Existing layout items
 * @param {number} colCount - Number of columns available
 * @param {Object} itemSize - Size of the new item to place
 * @returns {Object} {x, y} position
 */
export function findFirstAvailablePosition(layoutItems = [], colCount = 48, itemSize = { w: DEFAULT_WIDTH, h: DEFAULT_HEIGHT }) {
  // Validate inputs
  if (!Array.isArray(layoutItems)) {
    console.warn('findFirstAvailablePosition: layoutItems is not an array');
    return { x: 0, y: 0 };
  }
  
  if (typeof colCount !== 'number' || colCount <= 0) {
    console.warn(`Invalid column count: ${colCount}, using default 48`);
    colCount = 48;
  }
  
  if (!itemSize || typeof itemSize !== 'object') {
    itemSize = { w: DEFAULT_WIDTH, h: DEFAULT_HEIGHT };
  }
  
  // Ensure item size has valid dimensions
  const w = typeof itemSize.w === 'number' ? itemSize.w : DEFAULT_WIDTH;
  const h = typeof itemSize.h === 'number' ? itemSize.h : DEFAULT_HEIGHT;
  
  // Constrain width to column count
  const itemWidth = Math.min(w, colCount);
  
  // If no items, start at origin
  if (layoutItems.length === 0) {
    return { x: 0, y: 0 };
  }
  
  // Get only valid layout items
  const validItems = layoutItems.filter(isValidLayoutItem);
  
  // Find the maximum Y position used
  const maxY = validItems.length > 0 ? 
    Math.max(...validItems.map(item => item.y + item.h), 0) : 0;
  
  // First, try to find a free spot in the last row
  const lastRowItems = validItems.filter(item => item.y + item.h > maxY - h);
  
  // Sort the last row items by x position
  lastRowItems.sort((a, b) => a.x - b.x);
  
  // Check if there's enough space at the end of the last row
  if (lastRowItems.length > 0) {
    const lastItem = lastRowItems[lastRowItems.length - 1];
    const potentialX = lastItem.x + lastItem.w;
    
    if (potentialX + itemWidth <= colCount) {
      return { x: potentialX, y: lastItem.y };
    }
  }
  
  // If we can't find space in the last row, start a new row
  return { x: 0, y: maxY };
}