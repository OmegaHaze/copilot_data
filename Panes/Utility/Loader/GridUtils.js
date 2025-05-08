/**
 * GridUtils.js - Utilities for React Grid Layout system
 * Provides constants and functions for grid layout generation
 */

// Default dimensions for grid items (doubled from original)
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
 */
export const getBreakpoints = () => Object.keys(breakpoints);

/**
 * Generate responsive layouts for all breakpoints
 * @param {Array} items - Item configurations to layout
 * @returns {Object} Layouts configuration for all breakpoints
 */
export function generateDefaultLayout(items = []) {
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
  const result = [];
  let x = 0;
  let y = 0;

  items.forEach((item) => {
    // Extract key from module or name property
    const key = item.module?.toLowerCase() || item.name?.toLowerCase();
    if (!key) return;

    // Get dimensions, potentially from item or use defaults
    const w = item.width || DEFAULT_WIDTH;
    const h = item.height || DEFAULT_HEIGHT;

    // Create the layout item
    result.push({
      i: key,         // Unique identifier
      x,              // X position
      y,              // Y position
      w,              // Width
      h,              // Height
      static: false,  // Allow movement/resizing
      minW: 3,        // Minimum width (increased)
      minH: 3         // Minimum height (increased)
    });

    // Calculate next position
    x += w;
    if (x + w > colCount) {
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
  return [
    ...services,
    ...(modules.system || []),
    ...(modules.service || []),
    ...(modules.user || [])
  ];
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
    item.i && 
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
  // If no items, start at origin
  if (!layoutItems.length) return { x: 0, y: 0 };
  
  // Find the maximum Y position used
  const maxY = Math.max(...layoutItems.map(item => item.y + item.h), 0);
  
  // First, try to find a free spot in the last row
  const lastRowItems = layoutItems.filter(item => item.y + item.h > maxY - itemSize.h);
  
  // Sort the last row items by x position
  lastRowItems.sort((a, b) => a.x - b.x);
  
  // Check if there's enough space at the end of the last row
  if (lastRowItems.length > 0) {
    const lastItem = lastRowItems[lastRowItems.length - 1];
    const potentialX = lastItem.x + lastItem.w;
    
    if (potentialX + itemSize.w <= colCount) {
      return { x: potentialX, y: lastItem.y };
    }
  }
  
  // If we can't find space in the last row, start a new row
  return { x: 0, y: maxY };
}