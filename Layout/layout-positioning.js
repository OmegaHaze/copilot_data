// layout-positioning.js
// Smart placement algorithms for layout items

import { COLS, DEFAULT_MODULE_SIZES, BREAKPOINTS } from './layout-constants';

/**
 * Checks if a proposed item would collide with existing items
 * @param {Array} layout - Array of layout items for a specific breakpoint
 * @param {Object} itemToCheck - Item with x, y, w, h properties to check for collision
 * @returns {boolean} True if collision exists, false otherwise
 */
export function collisionExists(layout, itemToCheck) {
  if (!Array.isArray(layout)) return false;

  return layout.some(item => {
    if (item.i === itemToCheck.i) return false;
    return !(
      itemToCheck.x + itemToCheck.w <= item.x ||
      itemToCheck.x >= item.x + item.w ||
      itemToCheck.y + itemToCheck.h <= item.y ||
      itemToCheck.y >= item.y + item.h
    );
  });
}

/**
 * Finds the first open space in the layout for a new item
 * @param {Array} layout - Layout items at a specific breakpoint
 * @param {number} cols - Number of columns at that breakpoint
 * @param {Object} itemSize - Expected shape: { w, h }
 * @returns {Object} Position: { x, y }
 */
export function findFirstAvailablePosition(layout, cols, itemSize) {
  const { w, h } = {
    w: itemSize?.w ?? DEFAULT_MODULE_SIZES.lg.w,
    h: itemSize?.h ?? DEFAULT_MODULE_SIZES.lg.h
  };

  const maxCol = Math.max(1, cols - w + 1);
  let y = 0;

  while (y <= 1000) {
    for (let x = 0; x < maxCol; x++) {
      if (!collisionExists(layout, { x, y, w, h })) {
        return { x, y };
      }
    }
    y++;
  }

  return { x: 0, y: getBottomRow(layout) };
}

/**
 * Calculates the bottom-most row in the current layout
 */
export function getBottomRow(layout) {
  if (!Array.isArray(layout) || layout.length === 0) return 0;
  return Math.max(...layout.map(item => item.y + item.h));
}

/**
 * Finds the best open space for a new item in a breakpoint-aware grid
 * @param {string} breakpoint - Breakpoint name
 * @param {Array} existingItems - Current layout items
 * @param {Object} newItemSize - { w, h } of the item to place
 */
export function getOptimalPosition(breakpoint, existingItems = [], newItemSize) {
  const colCount = COLS[breakpoint] ?? COLS.lg;
  if (!Array.isArray(existingItems) || existingItems.length === 0) {
    return { x: 0, y: 0 };
  }

  return findFirstAvailablePosition(existingItems, colCount, newItemSize);
}

/**
 * Updates an item's size across all breakpoints
 * @param {Object} layouts - Full layout map
 * @param {string} paneId - Target item ID
 * @param {Object} newSize - { w, h }
 * @returns {Object} Updated layouts
 */
export function updateItemSize(layouts, paneId, newSize) {
  if (!layouts || !paneId || typeof newSize !== 'object') return layouts;

  return BREAKPOINTS.reduce((acc, bp) => {
    const items = Array.isArray(layouts[bp]) ? layouts[bp] : [];
    acc[bp] = items.map(item =>
      item.i === paneId
        ? {
            ...item,
            w: newSize.w ?? item.w,
            h: newSize.h ?? item.h
          }
        : item
    );
    return acc;
  }, { ...layouts });
}
