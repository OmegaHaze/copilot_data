// layout-operations.js
// High-level operations for manipulating layout items across breakpoints

import { BREAKPOINTS, MODULE_CONSTRAINTS, DEFAULT_MODULE_SIZES } from './layout-constants';
import { createEmptyLayout } from './layout-core';
import { getOptimalPosition } from './layout-positioning';

/**
 * Updates a layout item by ID across all breakpoints
 */
export function updateItemInAllBreakpoints(layouts, updatedItem) {
  if (!layouts || !updatedItem?.i) return layouts;

  return BREAKPOINTS.reduce((acc, bp) => {
    const items = Array.isArray(layouts[bp]) ? layouts[bp] : [];
    acc[bp] = items.map(item =>
      item.i === updatedItem.i ? { ...item, ...updatedItem } : item
    );
    return acc;
  }, { ...layouts });
}

/**
 * Applies a new width and height to an item across breakpoints
 */
export function resizeItemInAllBreakpoints(layouts, paneId, newSize) {
  if (!layouts || !paneId || typeof newSize?.w !== 'number' || typeof newSize?.h !== 'number') {
    return layouts;
  }

  return updateItemInAllBreakpoints(layouts, { i: paneId, w: newSize.w, h: newSize.h });
}

/**
 * Inserts a layout item with optional size across all breakpoints
 */
export function createItemForAllBreakpoints(paneId, currentLayouts = {}, size = null) {
  if (!paneId) return currentLayouts;

  // Import DEFAULT_MODULE_SIZES to ensure proper sizing
  const baseItem = {
    i: paneId,
    minW: MODULE_CONSTRAINTS.MIN_W,
    minH: MODULE_CONSTRAINTS.MIN_H,
    // Ensure we always have a default width and height
    w: (size && typeof size.w === 'number') ? size.w : DEFAULT_MODULE_SIZES.lg.w,
    h: (size && typeof size.h === 'number') ? size.h : DEFAULT_MODULE_SIZES.lg.h
  };

  return addItemToAllBreakpoints(currentLayouts, baseItem);
}

/**
 * Inserts a layout item across all breakpoints with optimal positioning
 */
export function addItemToAllBreakpoints(layouts, item) {
  if (!layouts || !item?.i) return layouts;

  return BREAKPOINTS.reduce((acc, bp) => {
    const bpLayout = Array.isArray(acc[bp]) ? [...acc[bp]] : [];

    // Skip if item already exists
    if (bpLayout.some(existing => existing.i === item.i)) {
      acc[bp] = bpLayout;
      return acc;
    }

    // Use defaults from DEFAULT_MODULE_SIZES if item dimensions are missing
    const itemSize = {
      w: typeof item.w === 'number' ? item.w : DEFAULT_MODULE_SIZES[bp]?.w || DEFAULT_MODULE_SIZES.lg.w,
      h: typeof item.h === 'number' ? item.h : DEFAULT_MODULE_SIZES[bp]?.h || DEFAULT_MODULE_SIZES.lg.h
    };
    
    const pos = getOptimalPosition(bp, bpLayout, itemSize);
    const newItem = {
      ...item,
      x: pos.x,
      y: pos.y,
      w: itemSize.w,
      h: itemSize.h
    };

    acc[bp] = [...bpLayout, newItem];
    return acc;
  }, { ...layouts });
}

/**
 * Removes a layout item across all breakpoints
 */
export function removeItemFromAllBreakpoints(layouts, paneId) {
  if (!layouts || !paneId) return layouts;

  return BREAKPOINTS.reduce((acc, bp) => {
    const items = Array.isArray(layouts[bp]) ? layouts[bp] : [];
    acc[bp] = items.filter(item => item.i !== paneId);
    return acc;
  }, { ...layouts });
}

/**
 * Sorts layout items in each breakpoint top-to-bottom, left-to-right
 */
export function reorderLayoutsByPosition(layouts) {
  if (!layouts) return createEmptyLayout();

  return BREAKPOINTS.reduce((acc, bp) => {
    const items = Array.isArray(layouts[bp]) ? [...layouts[bp]] : [];
    acc[bp] = items.sort((a, b) => (a.y === b.y ? a.x - b.x : a.y - b.y));
    return acc;
  }, { ...layouts });
}
