/**
 * LayoutDebugger.js
 * 
 * Utility functions for validating and debugging layout issues
 * This file provides diagnostic functions to help identify and fix layout format problems
 */

// Development environment detection
const isDev = window.location.hostname === 'localhost' || 
             window.location.hostname === '127.0.0.1';

/**
 * Validates grid layout format and logs warnings for any issues
 * @param {Object} gridLayout - The grid layout object to validate
 * @param {string} source - The source/component name for logging
 * @param {boolean} verbose - Whether to log detailed information
 * @returns {boolean} True if valid, false if issues were found
 */
export function validateGridFormat(gridLayout, source = 'unknown', verbose = false) {
  // Skip validation in production environments unless specifically requested
  if (!isDev && !verbose) {
    return true;
  }

  if (!gridLayout || typeof gridLayout !== 'object') {
    console.error(`[${source}] Invalid grid layout: ${gridLayout === null ? 'null' : typeof gridLayout}`);
    return false;
  }

  let isValid = true;
  const breakpoints = ['lg', 'md', 'sm', 'xs', 'xxs'];

  // Check if all expected breakpoints exist
  const missingBreakpoints = breakpoints.filter(bp => !gridLayout[bp]);
  if (missingBreakpoints.length > 0) {
    console.warn(`[${source}] Missing breakpoints in grid layout:`, missingBreakpoints);
    isValid = false;
  }

  // Check if all breakpoints are arrays
  const nonArrayBreakpoints = Object.entries(gridLayout)
    .filter(([bp, value]) => breakpoints.includes(bp) && !Array.isArray(value))
    .map(([bp]) => bp);

  if (nonArrayBreakpoints.length > 0) {
    console.error(`[${source}] The following breakpoints are not arrays:`, nonArrayBreakpoints);
    isValid = false;
  }

  // Only log details if verbose mode is enabled
  if (verbose) {
    // Log details about each breakpoint
    breakpoints.forEach(bp => {
      if (gridLayout[bp]) {
        const isArray = Array.isArray(gridLayout[bp]);
        const itemCount = isArray ? gridLayout[bp].length : 'not an array';
        
        console.log(`[${source}] Breakpoint ${bp}: ${isArray ? 'array' : typeof gridLayout[bp]}, items: ${itemCount}`);
        
        // Check for invalid items
        if (isArray && gridLayout[bp].length > 0) {
          const invalidItems = gridLayout[bp].filter(item => !item || !item.i || typeof item !== 'object');
          if (invalidItems.length > 0) {
            console.warn(`[${source}] Invalid items in breakpoint ${bp}: ${invalidItems.length} items`);
            isValid = false;
          }
        }
      }
    });
  }

  return isValid;
}

/**
 * Creates a compact string representation of a grid layout for debugging
 * @param {Object} gridLayout - The grid layout to stringify
 * @returns {string} Formatted string showing layout structure
 */
export function stringifyGridLayout(gridLayout) {
  // Early return for invalid input
  if (!gridLayout) return 'null';
  
  try {
    const result = {};
    const breakpoints = ['lg', 'md', 'sm', 'xs', 'xxs'];
    
    // Process only standard breakpoints to avoid large objects
    breakpoints.forEach(bp => {
      if (Array.isArray(gridLayout[bp])) {
        result[bp] = `Array(${gridLayout[bp].length})`;
        
        // Add sample items if available and we're in dev mode
        if (isDev && gridLayout[bp].length > 0) {
          result[`${bp}_sample`] = gridLayout[bp].slice(0, 2).map(item => 
            item && item.i ? 
              { i: item.i, size: `${item.w}x${item.h}`, pos: `(${item.x},${item.y})` } : 
              'invalid item'
          );
        }
      } else {
        result[bp] = typeof gridLayout[bp];
      }
    });
    
    return JSON.stringify(result, null, 2);
  } catch (err) {
    return `Error stringifying: ${err.message}`;
  }
}

/**
 * Attempts to fix common grid layout issues
 * @param {Object} gridLayout - The potentially invalid grid layout
 * @returns {Object} Fixed grid layout with arrays for all breakpoints
 */
export function fixGridLayout(gridLayout) {
  const fixedLayout = { lg: [], md: [], sm: [], xs: [], xxs: [] };
  
  if (!gridLayout || typeof gridLayout !== 'object') {
    return fixedLayout;
  }
  
  // Copy and fix each breakpoint
  ['lg', 'md', 'sm', 'xs', 'xxs'].forEach(bp => {
    if (!gridLayout[bp]) {
      fixedLayout[bp] = [];
    } else if (Array.isArray(gridLayout[bp])) {
      // Filter out invalid items
      fixedLayout[bp] = gridLayout[bp].filter(item => 
        item && typeof item === 'object' && typeof item.i === 'string'
      );
    } else if (typeof gridLayout[bp] === 'object') {
      // Convert object format to array
      fixedLayout[bp] = Object.values(gridLayout[bp])
        .filter(item => item && typeof item === 'object' && typeof item.i === 'string');
    } else {
      fixedLayout[bp] = [];
    }
  });
  
  return fixedLayout;
}

/**
 * Debug utility to check and report grid layout issues
 * Can be called from any component to validate its layout
 * @param {Object} gridLayout - The grid layout to check
 * @param {Object} options - Options for debugging
 * @param {string} options.source - Source component name
 * @param {boolean} options.fix - Whether to attempt fixing issues
 * @param {boolean} options.verbose - Whether to log all details
 * @returns {Object} Original or fixed grid layout
 */
export function debugGridLayout(gridLayout, options = {}) {
  // Skip detailed debugging in production unless explicitly requested
  if (!isDev && !options.verbose) {
    return gridLayout;
  }
  
  const { 
    source = 'unknown',
    fix = false,
    verbose = false
  } = options;
  
  if (verbose) {
    console.group(`Grid Layout Debug [${source}]`);
    console.log('Current layout:', stringifyGridLayout(gridLayout));
  }
  
  const isValid = validateGridFormat(gridLayout, source, verbose);
  
  if (!isValid && fix) {
    const fixedLayout = fixGridLayout(gridLayout);
    
    if (verbose) {
      console.log('Fixed layout:', stringifyGridLayout(fixedLayout));
      console.log('Layout was fixed - use this version instead');
    }
    
    if (verbose) {
      console.groupEnd();
    }
    
    return fixedLayout;
  }
  
  if (verbose) {
    console.log(isValid ? '✅ Layout format is valid' : '❌ Layout has format issues');
    console.groupEnd();
  }
  
  return gridLayout;
}

// Export a simplified version for quick checks
export const checkLayout = (gridLayout, source) => validateGridFormat(gridLayout, source, true);