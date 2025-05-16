// layout-index.js
// Main layout system entrypoint – provides high-level layout API

import {
  BREAKPOINTS,
  COLS,
  DEFAULT_MODULE_SIZES,
  ROW_HEIGHTS
} from './layout-constants';

import { createEmptyLayout } from './layout-core';
import { validateLayout } from './layout-shared';

import {
  saveToLocalStorage,
  saveActiveModulesToLocalStorage,
  loadLayoutsFromLocalStorage,
  loadActiveModulesFromLocalStorage,
  clearLayoutsFromLocalStorage
} from './layout-storage';

import {
  fetchSessionData,
  updateSessionGrid,
  updateSessionModules,
  saveLayoutTemplate as api_saveLayoutTemplate,
  getLayoutTemplates as api_getLayoutTemplates,
  applyLayoutTemplate as api_applyLayoutTemplate
} from './layout-api';

import {
  removeItemFromAllBreakpoints,
  createItemForAllBreakpoints
} from './layout-operations';

/**
 * Saves layout to all persistence layers (localStorage, sessionStorage, backend)
 */
async function saveLayout(layouts, skipApi = false) {
  // Validate the layout first
  if (!validateLayout(layouts)) {
    console.error('[layout] Invalid layout object provided to saveLayout:', layouts);
    return false;
  }

  // Save to localStorage first
  const localSaveSuccess = saveToLocalStorage(layouts);
  
  // Update session data in sessionStorage
  try {
    // Import dynamically to avoid circular dependencies
    const { saveToSessionStorage, loadFromSessionStorage } = await import('../Session/session-storage');
    const { STORAGE_KEYS } = await import('../Session/session-constants');
    
    // Save layout directly
    saveToSessionStorage(STORAGE_KEYS.LAYOUTS, layouts);
    
    // Update the combined session object too
    const sessionData = loadFromSessionStorage(STORAGE_KEYS.SESSION_DATA) || {};
    sessionData.gridLayout = layouts;
    saveToSessionStorage(STORAGE_KEYS.SESSION_DATA, sessionData);
    
    console.log('[layout] Layout saved to sessionStorage successfully');
  } catch (err) {
    console.warn('[layout] Failed to sync to sessionStorage:', err);
  }
  
  if (!localSaveSuccess || skipApi) return localSaveSuccess;

  // Save to backend via API
  try {
    // Note: updateSessionGrid must use PUT method as backend expects
    await updateSessionGrid(layouts);
    console.log('[layout] Layout saved to backend successfully');
    return true;
  } catch (err) {
    console.error('[layout] Failed to save layout to API:', err);
    console.warn('[layout] Layout changes saved locally but not to backend');
    return true;
  }
}

/**
 * Saves active modules to all persistence layers (localStorage, sessionStorage, backend)
 */
async function saveActiveModules(modules, skipApi = false) {
  // Validate modules array
  if (!Array.isArray(modules)) {
    console.error('[layout] Invalid modules array provided to saveActiveModules');
    return false;
  }
  
  // Save to localStorage first
  const localSaveSuccess = saveActiveModulesToLocalStorage(modules);
  
  // Update session data in sessionStorage
  try {
    // Import dynamically to avoid circular dependencies
    const { saveToSessionStorage, loadFromSessionStorage } = await import('../Session/session-storage');
    const { STORAGE_KEYS } = await import('../Session/session-constants');
    
    // Save modules directly
    saveToSessionStorage(STORAGE_KEYS.ACTIVE_MODULES, modules);
    
    // Update the combined session object too
    const sessionData = loadFromSessionStorage(STORAGE_KEYS.SESSION_DATA) || {};
    sessionData.activeModules = modules;
    saveToSessionStorage(STORAGE_KEYS.SESSION_DATA, sessionData);
    
    console.log('[layout] Active modules saved to sessionStorage successfully');
  } catch (err) {
    console.warn('[layout] Failed to sync modules to sessionStorage:', err);
  }
  
  if (!localSaveSuccess || skipApi) return localSaveSuccess;

  // Save to backend via API
  try {
    // Note: updateSessionModules must use PUT method as backend expects
    await updateSessionModules(modules);
    console.log('[layout] Active modules saved to backend successfully');
    return true;
  } catch (err) {
    console.error('[layout] Failed to save active modules to API:', err);
    console.warn('[layout] Active modules saved locally but not to backend');
    return true;
  }
}

/**
 * Loads layout with full fallback:
 * 1. Try session DB (authoritative)
 * 2. Fallback to localStorage
 * 3. Fallback to empty default
 * 
 * Also syncs data between storage layers to ensure consistency
 */
async function loadLayout() {
  let layout = null;
  
  // Try to load from backend first
  try {
    console.log('[layout] Attempting to load layout from backend...');
    const sessionData = await fetchSessionData();
    const sessionLayout = sessionData?.grid_layout;

    if (sessionLayout && validateLayout(sessionLayout)) {
      console.log('[layout] Successfully loaded layout from backend');
      layout = sessionLayout;
      
      // Mirror to localStorage for offline use
      saveToLocalStorage(sessionLayout);
      
      // Mirror to sessionStorage for quick access
      try {
        const { saveToSessionStorage } = await import('../Session/session-storage');
        const { STORAGE_KEYS } = await import('../Session/session-constants');
        saveToSessionStorage(STORAGE_KEYS.LAYOUTS, sessionLayout);
        
        // Also update the active modules in sessionStorage
        if (Array.isArray(sessionData?.active_modules)) {
          saveToSessionStorage(STORAGE_KEYS.ACTIVE_MODULES, sessionData.active_modules);
          saveActiveModulesToLocalStorage(sessionData.active_modules);
        }
        
        // Update the combined session object
        const sessionObj = {
          gridLayout: sessionLayout,
          activeModules: sessionData?.active_modules || []
        };
        saveToSessionStorage(STORAGE_KEYS.SESSION_DATA, sessionObj);
        
      } catch (err) {
        console.warn('[layout] Failed to mirror layout to sessionStorage:', err);
      }
      
      return layout;
    }
  } catch (err) {
    console.error('[layout] Failed to load layout from session API:', err);
  }

  // If backend fails, try localStorage
  console.log('[layout] Attempting to load layout from localStorage...');
  const local = loadLayoutsFromLocalStorage();
  if (local && validateLayout(local)) {
    console.log('[layout] Successfully loaded layout from localStorage');
    layout = local;
    
    // Push localStorage data to backend to keep in sync
    try {
      await updateSessionGrid(local);
      console.log('[layout] Pushed localStorage layout to backend');
      
      // Also sync active modules
      const activeModules = loadActiveModulesFromLocalStorage();
      if (Array.isArray(activeModules)) {
        await updateSessionModules(activeModules);
      }
    } catch (err) {
      console.warn('[layout] Failed to push localStorage layout to backend:', err);
    }
    
    return layout;
  }

  // If all else fails, create empty layout
  console.log('[layout] No layout found, creating empty layout');
  return createEmptyLayout();
}

/**
 * Adds a module to layout and optionally saves
 * @param {string} paneId - Full identifier of the pane (moduleType-staticIdentifier-instanceId)
 * @param {Object} currentLayouts - Current grid layouts
 * @param {boolean} autosave - Whether to auto-save the layout
 * @returns {Object} Updated layouts
 */
function addModule(paneId, currentLayouts, autosave = false) {
  const updatedLayouts = createItemForAllBreakpoints(paneId, currentLayouts);
  if (autosave) saveLayout(updatedLayouts);
  return updatedLayouts;
}

/**
 * Removes a module from layout and optionally saves
 * @param {string} paneId - Full identifier of the pane to remove (moduleType-staticIdentifier-instanceId)
 * @param {Object} currentLayouts - Current grid layouts
 * @param {boolean} autosave - Whether to auto-save the layout
 * @returns {Object} Updated layouts
 */
function removeModule(paneId, currentLayouts, autosave = false) {
  const updatedLayouts = removeItemFromAllBreakpoints(currentLayouts, paneId);
  if (autosave) saveLayout(updatedLayouts);
  return updatedLayouts;
}

// Export unified layout API
export {
  saveLayout,
  saveActiveModules,
  loadLayout,
  loadLayout as loadSession, // ✅ Legacy alias used by LayoutDebugUtil
  addModule,
  removeModule,

  // Constants and helpers
  BREAKPOINTS,
  COLS,
  ROW_HEIGHTS,
  DEFAULT_MODULE_SIZES,
  createEmptyLayout,
  clearLayoutsFromLocalStorage,
  loadActiveModulesFromLocalStorage,

  // Template API passthrough
  api_saveLayoutTemplate as saveLayoutTemplate,
  api_getLayoutTemplates as getLayoutTemplates,
  api_applyLayoutTemplate as applyLayoutTemplate
};
