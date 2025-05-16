// layout-core.js
// Low-level layout primitives, fully decoupled from validation and transformation

import { BREAKPOINTS, DEFAULT_MODULE_SIZES } from './layout-constants';

/**
 * Creates an empty layout structure with all responsive breakpoints
 */
export function createEmptyLayout() {
  return BREAKPOINTS.reduce((acc, bp) => {
    acc[bp] = [];
    return acc;
  }, {});
}

/**
 * Counts the total number of items across all breakpoints
 */
export function countLayoutItems(layouts) {
  if (!layouts) return 0;

  return BREAKPOINTS.reduce((total, bp) => {
    const items = layouts[bp];
    return total + (Array.isArray(items) ? items.length : 0);
  }, 0);
}

/**
 * Finds a layout item by ID across all breakpoints
 * Returns: { item, breakpoint } or null
 */
export function findLayoutItem(layouts, id) {
  if (!layouts || !id) return null;

  for (const bp of BREAKPOINTS) {
    const items = layouts[bp];
    if (!Array.isArray(items)) continue;

    const item = items.find(entry => entry.i === id);
    if (item) return { item, breakpoint: bp };
  }

  return null;
}

/**
 * Creates a layout item with resolved defaults based on breakpoint
 */
export function createLayoutItem(id, x, y, w, h, isResizable = true, isDraggable = true, breakpoint = 'lg') {
  const fallback = DEFAULT_MODULE_SIZES[breakpoint] || DEFAULT_MODULE_SIZES.lg;

  return {
    i: id,
    x,
    y,
    w: typeof w === 'number' ? w : fallback.w,
    h: typeof h === 'number' ? h : fallback.h,
    isResizable,
    isDraggable
  };
}

/**
 * Returns true if the item exists in any breakpoint layout
 */
export function layoutItemExists(layouts, id) {
  return !!findLayoutItem(layouts, id);
}

// Note: addItemToAllBreakpoints and removeItemFromAllBreakpoints live in layout-operations.js
