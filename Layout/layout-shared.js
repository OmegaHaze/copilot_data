// layout-shared.js
// Stateless helper functions reused across layout system

import { BREAKPOINTS } from './layout-constants.js';

/**
 * Validates a layout object:
 * - Must be an object
 * - All breakpoints (if present) must contain arrays
 */
export function validateLayout(layouts) {
  if (typeof layouts !== 'object' || layouts === null) return false;

  return BREAKPOINTS.every(bp => {
    const val = layouts[bp];
    return val === undefined || Array.isArray(val);
  });
}

/**
 * Normalizes a layout object:
 * - Includes only known breakpoints
 * - Filters out falsey items from arrays
 * - Returns a full breakpoint-aligned structure
 */
export function transformLayout(layouts) {
  return BREAKPOINTS.reduce((acc, bp) => {
    const items = layouts?.[bp];
    acc[bp] = Array.isArray(items) ? items.filter(Boolean) : [];
    return acc;
  }, {});
}
