/**
 * GridUtils.js - Utilities for React Grid Layout system
 * Provides constants and functions for grid layout generation
 */

// Default dimensions for grid items
export const DEFAULT_WIDTH = 6;
export const DEFAULT_HEIGHT = 4;

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
 * Generate responsive layout for all breakpoints
 * @param {Array} items - Item configurations to layout
 * @returns {Object} Layout configuration for all breakpoints
 */
export function generateDefaultLayout(items = []) {
  const layout = {};

  Object.entries(cols).forEach(([breakpoint, colCount]) => {
    layout[breakpoint] = generateLayoutForBreakpoint(items, colCount);
  });

  return layout;
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
      minW: 2,        // Minimum width
      minH: 2         // Minimum height
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
 * @returns {Object} {x, y} position
 */
export function findFirstAvailablePosition(layoutItems = [], colCount = 48) {
  // If no items, start at origin
  if (layoutItems.length === 0) return { x: 0, y: 0 };
  
  // Find the maximum Y position used
  const maxY = Math.max(...layoutItems.map(item => item.y + item.h));
  
  // Start a new row
  return { x: 0, y: maxY };
}