/**
 * LayoutTransformer.js
 * Utility functions for transforming, validating, and normalizing grid layout data
 * between different formats and storage systems.
 */

import { getBreakpoints } from './GridUtils.js';

// Use breakpoints from GridUtils for consistency
const DEFAULT_BREAKPOINTS = getBreakpoints() || ['lg', 'md', 'sm', 'xs', 'xxs'];

/**
 * Validates if a layout object is properly formatted for react-grid-layout
 * Checks that the object has arrays for all required breakpoints
 * 
 * @param {Object} layout - Layout object to validate
 * @returns {boolean} True if layout is valid
 */
export function isValidResponsiveLayout(layout) {
  if (!layout || typeof layout !== 'object') return false;
  return DEFAULT_BREAKPOINTS.every(bp => Array.isArray(layout[bp] || []));
}

/**
 * Validates an individual layout item
 * Checks for required properties like id and position
 * 
 * @param {Object} item - Layout item to validate
 * @returns {boolean} True if item is valid
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
 * Ensures a layout has all breakpoints and only contains valid items
 * Creates a clean, normalized layout structure
 * 
 * @param {Object} layout - Layout to normalize
 * @returns {Object} Normalized layout
 */
export function normalizeLayout(layout) {
  const safeLayout = {};

  DEFAULT_BREAKPOINTS.forEach(bp => {
    const items = layout?.[bp];
    safeLayout[bp] = Array.isArray(items)
      ? items.filter(item => isValidLayoutItem(item))
      : [];
  });

  return safeLayout;
}

/**
 * Prepares a layout object for storage by removing invalid items
 * Ensures data integrity before saving to localStorage or backend
 * 
 * @param {Object} layout - Layout to sanitize
 * @returns {Object} Sanitized layout
 */
export function sanitizeLayoutForStorage(layout) {
  // Normalize the layout to ensure proper structure
  const normalized = normalizeLayout(layout);
  
  // Remove any internal metadata properties that shouldn't be stored
  DEFAULT_BREAKPOINTS.forEach(bp => {
    if (normalized[bp]) {
      normalized[bp] = normalized[bp].map(item => {
        // Create a clean copy of the item
        const cleanItem = {
          i: item.i,
          x: item.x,
          y: item.y,
          w: item.w,
          h: item.h,
          minW: item.minW,
          minH: item.minH
        };
        
        // Add optional properties if they exist
        if (item.moduleType) cleanItem.moduleType = item.moduleType;
        if (item.instanceId) cleanItem.instanceId = item.instanceId;
        if (item.static !== undefined) cleanItem.static = item.static;
        
        return cleanItem;
      });
    }
  });

  return normalized;
}

/**
 * Rehydrates layout data from backend/localStorage for use in React Grid Layout
 * Handles different storage formats and converts to the expected structure
 * 
 * @param {Object|string} storedLayout - Layout data from storage
 * @returns {Object} Processed layout ready for use
 */
export function hydrateLayoutFromDB(storedLayout) {
  try {
    // Parse JSON string if needed
    if (typeof storedLayout === 'string') {
      try {
        storedLayout = JSON.parse(storedLayout);
      } catch (parseErr) {
        console.warn('⚠️ Failed to parse layout JSON:', parseErr);
        return normalizeLayout({});
      }
    }
    
    // Check if the layout is valid
    if (!storedLayout || typeof storedLayout !== 'object') {
      console.warn('⚠️ Invalid layout data:', storedLayout);
      return normalizeLayout({});
    }
    
    // Handle different storage formats
    const convertedLayout = {};
    DEFAULT_BREAKPOINTS.forEach(bp => {
      // Initialize each breakpoint with an empty array
      convertedLayout[bp] = [];
      
      // Skip if no data for this breakpoint
      if (!storedLayout[bp]) return;
      
      // Handle array format
      if (Array.isArray(storedLayout[bp])) {
        convertedLayout[bp] = storedLayout[bp];
      }
      // Handle object/dictionary format
      else if (typeof storedLayout[bp] === 'object') {
        convertedLayout[bp] = Object.values(storedLayout[bp]);
      }
    });
    
    // Normalize and return the converted layout
    return normalizeLayout(convertedLayout);
  } catch (err) {
    console.warn('⚠️ Error processing layout data:', err);
    return normalizeLayout({});
  }
}

/**
 * Compare two layouts to check if they are different
 * Useful for determining if a layout needs to be saved
 * 
 * @param {Object} layout1 - First layout
 * @param {Object} layout2 - Second layout
 * @returns {boolean} True if layouts are different
 */
export function isLayoutChanged(layout1, layout2) {
  // Quick reference check
  if (layout1 === layout2) return false;
  
  // Check if either layout is null/undefined
  if (!layout1 || !layout2) return true;
  
  // Check if breakpoints match
  const breakpoints1 = Object.keys(layout1);
  const breakpoints2 = Object.keys(layout2);
  
  if (breakpoints1.length !== breakpoints2.length) return true;
  
  // Check each breakpoint
  for (const bp of breakpoints1) {
    const items1 = layout1[bp] || [];
    const items2 = layout2[bp] || [];
    
    // Different item count means layouts are different
    if (items1.length !== items2.length) return true;
    
    // Create maps for faster comparison
    const itemMap1 = {};
    items1.forEach(item => {
      itemMap1[item.i] = item;
    });
    
    // Check if any items differ
    for (const item2 of items2) {
      const item1 = itemMap1[item2.i];
      
      // Item exists in layout1 but not layout2
      if (!item1) return true;
      
      // Compare core properties
      if (
        item1.x !== item2.x ||
        item1.y !== item2.y ||
        item1.w !== item2.w ||
        item1.h !== item2.h
      ) {
        return true;
      }
    }
  }
  
  // No differences found
  return false;
}