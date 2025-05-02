// LayoutManager.js - Responsible for layout operations and persistence

import { componentRegistry } from './ComponentRegistry.js';
import { createLayoutItemForAllBreakpoints } from './LayoutPositioning.js';
import debounce from 'lodash/debounce';

// Constants
const STORAGE_KEY = 'vaio_layout';
export const BREAKPOINTS = ['lg', 'md', 'sm', 'xs', 'xxs'];

/**
 * Creates an empty layout with all breakpoints initialized
 * @returns {Object} Empty layout object with all breakpoints
 */
export function createEmptyLayout() {
  const emptyLayout = {};
  BREAKPOINTS.forEach(bp => {
    emptyLayout[bp] = [];
  });
  return emptyLayout;
}

/**
 * Retrieves layout from localStorage
 * @returns {Object|null} The hydrated layout object or null if not found/invalid
 */
export function getLayoutFromStorage() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? hydrateLayoutFromDB(stored) : null;
  } catch (err) {
    console.warn('Failed to parse layout from localStorage:', err);
    return null;
  }
}

/**
 * Saves layout to localStorage
 * @param {Object} layout - The layout to save
 * @returns {boolean} Success status
 */
export function saveLayoutToLocal(layout) {
  try {
    const safe = sanitizeLayoutForStorage(layout);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(safe));
    return true;
  } catch (err) {
    console.error('Failed to save layout to localStorage:', err);
    return false;
  }
}

/**
 * Saves layout to backend session storage
 * @param {Object} layout - The layout to save
 * @returns {Object|null} Response data or null on error
 */
export async function saveLayoutToSession(layout) {
  try {
    const safe = sanitizeLayoutForStorage(layout);
    const res = await fetch('/api/user/session/grid', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(safe)
    });
    
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    
    const data = await res.json();
    console.log('Synced layout to session');
    return data;
  } catch (err) {
    console.error('Failed to sync layout to session:', err);
    return null;
  }
}

// Debounced version to prevent excessive saves during drag operations
export const debouncedSaveToSession = debounce(saveLayoutToSession, 800);

/**
 * Counts total layout items across all breakpoints
 * @param {Object} layout - The layout object
 * @returns {number} Count of layout items
 */
function countLayoutItems(layout) {
  if (!layout) return 0;
  
  return Object.values(layout).reduce(
    (count, breakpoint) => count + (Array.isArray(breakpoint) ? breakpoint.length : 0),
    0
  );
}

/**
 * Core layout resolution logic - determines which layout to use based on priority
 * @param {Object} options - Options object
 * @param {Object} options.sessionData - Session data from server
 * @param {Array} options.items - Available module items
 * @returns {Object} The resolved layout
 */
export async function resolveLayout({ sessionData, items }) {
  // First try to get layout from session data (database)
  const fromSession = hydrateLayoutFromDB(sessionData?.grid_layout);
  
  // Check if we need to create layout items for active modules
  if (sessionData?.active_modules?.length > 0) {
    // We have active modules but need to check if they have layout items
    const hasLayoutItems = countLayoutItems(fromSession) > 0;
    
    // If we have active modules but no layout items, create them
    if (!hasLayoutItems) {
      console.log('Found active modules without layout items, creating layout items for them');
      const newLayout = createEmptyLayout();
      
      // Create layout items for each active module
      for (const moduleId of sessionData.active_modules) {
        // Parse the moduleId to get moduleType and instanceId
        if (moduleId.includes('-')) {
          const [moduleType, instanceId] = moduleId.split('-');
          console.log(`Creating layout items for module: ${moduleType} with instance ID: ${instanceId}`);
          
          // Create layout items for this module
          const newLayoutItems = createLayoutItemForAllBreakpoints(moduleType, instanceId, newLayout);
          
          // Add to the layout
          BREAKPOINTS.forEach(bp => {
            if (newLayoutItems[bp]) {
              // Ensure the layout item has the correct ID
              const layoutItem = newLayoutItems[bp];
              if (layoutItem.i !== moduleId) {
                layoutItem.i = moduleId;
              }
              
              // Explicitly set moduleType to ensure consistency
              layoutItem.moduleType = moduleType;
              
              newLayout[bp].push(layoutItem);
            }
          });
        } else {
          console.log(`Skipping invalid module ID: ${moduleId} - no hyphen separator`);
        }
      }
      
      console.log('Created layout items for active modules:', newLayout);
      
      // Save the new layout
      saveLayoutToLocal(newLayout);
      await saveLayoutToSession(newLayout);
      
      return newLayout;
    }
  }
  
  // Check if we have a valid layout from the session
  if (fromSession && Object.keys(fromSession).length > 0) {
    console.log('Using layout from database session');
    return fromSession;
  }
  
  // No valid layout found - create an empty layout structure
  console.log('Creating empty layout structure - following explicit launch model');
  
  // Create empty layout structure for all breakpoints
  const emptyLayout = createEmptyLayout();
  
  // Save this empty layout to the database
  await saveLayoutToSession(emptyLayout);
  
  return emptyLayout;
}

/**
 * Load layout during application initialization
 * @param {Array} items - Available module items
 * @returns {Object} The resolved layout
 */
export const loadLayout = async (items = []) => {
  console.log('Loading layout for items:', items.length);
  
  // Get session data from the component registry
  const sessionData = componentRegistry.getModuleData();
  console.log('Session data loaded:', {
    hasGridLayout: !!sessionData?.grid_layout,
    itemCount: items.length
  });
  
  // Create a layout based on available data
  const layout = await resolveLayout({ 
    sessionData, 
    items
  });
  
  console.log('Resolved layout:', {
    breakpoints: Object.keys(layout),
    itemCount: layout.lg ? layout.lg.length : 0
  });
  
  return layout;
};

/**
 * Rehydrates layout data from backend/localStorage for use in React Grid Layout
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
        console.warn('Failed to parse layout JSON:', parseErr);
        return normalizeLayout({});
      }
    }
    
    // Check if the layout is valid
    if (!storedLayout || typeof storedLayout !== 'object') {
      console.warn('Invalid layout data:', storedLayout);
      return normalizeLayout({});
    }
    
    // Handle different storage formats
    const convertedLayout = {};
    BREAKPOINTS.forEach(bp => {
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
    console.warn('Error processing layout data:', err);
    return normalizeLayout({});
  }
}

/**
 * Ensures a layout has all breakpoints and only contains valid items
 * @param {Object} layout - Layout to normalize
 * @returns {Object} Normalized layout
 */
export function normalizeLayout(layout) {
  const safeLayout = {};

  BREAKPOINTS.forEach(bp => {
    const items = layout?.[bp];
    safeLayout[bp] = Array.isArray(items)
      ? items.filter(item => isValidLayoutItem(item))
      : [];
  });

  return safeLayout;
}

/**
 * Validates an individual layout item
 * @param {Object} item - Layout item to validate
 * @returns {boolean} True if item is valid
 */
function isValidLayoutItem(item) {
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
 * Prepares a layout object for storage by removing invalid items
 * @param {Object} layout - Layout to sanitize
 * @returns {Object} Sanitized layout
 */
export function sanitizeLayoutForStorage(layout) {
  // Normalize the layout to ensure proper structure
  const normalized = normalizeLayout(layout);
  
  // Remove any internal metadata properties that shouldn't be stored
  BREAKPOINTS.forEach(bp => {
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