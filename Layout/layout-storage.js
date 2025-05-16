// layout-storage.js
// Pure functions for layout persistence to localStorage only

import { STORAGE_KEYS } from './layout-constants';
import { validateLayout, transformLayout } from './layout-shared';

/**
 * Save validated layout structure to localStorage
 */
export function saveToLocalStorage(layouts) {
  if (!validateLayout(layouts)) {
    console.error('[layout-storage] Invalid layout passed to saveToLocalStorage');
    return false;
  }

  try {
    localStorage.setItem(
      STORAGE_KEYS.LAYOUTS,
      JSON.stringify(transformLayout(layouts))
    );
    return true;
  } catch (err) {
    console.error('[layout-storage] Failed to write layout:', err);
    return false;
  }
}

/**
 * Save array of active module IDs to localStorage
 */
export function saveActiveModulesToLocalStorage(modules) {
  if (!Array.isArray(modules)) {
    console.error('[layout-storage] Invalid module list');
    return false;
  }

  try {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_MODULES, JSON.stringify(modules));
    return true;
  } catch (err) {
    console.error('[layout-storage] Failed to write active modules:', err);
    return false;
  }
}

/**
 * Load layout structure from localStorage
 */
export function loadLayoutsFromLocalStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LAYOUTS);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    return validateLayout(parsed) ? parsed : null;
  } catch (err) {
    console.error('[layout-storage] Failed to read layout:', err);
    return null;
  }
}

/**
 * Load active module ID array from localStorage
 */
export function loadActiveModulesFromLocalStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ACTIVE_MODULES);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch (err) {
    console.error('[layout-storage] Failed to read active modules:', err);
    return null;
  }
}

/**
 * Clear layout and module keys from localStorage
 */
export function clearLayoutsFromLocalStorage() {
  try {
    localStorage.removeItem(STORAGE_KEYS.LAYOUTS);
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_MODULES);
    return true;
  } catch (err) {
    console.error('[layout-storage] Failed to clear localStorage keys:', err);
    return false;
  }
}

/**
 * Convenience wrapper: save both layout and modules
 * Also updates sessionStorage for immediate access
 */
export function saveLayoutsToSession(layouts, activeModules = []) {
  // Save to localStorage
  const layoutOK = saveToLocalStorage(layouts);
  const modulesOK = saveActiveModulesToLocalStorage(activeModules);
  
  // Also update sessionStorage for immediate access
  (async () => {
    try {
      // We need to import these dynamically to avoid circular dependencies
      const { saveToSessionStorage } = await import('../Session/session-storage');
      const { STORAGE_KEYS } = await import('../Session/session-constants');
      
      // Update individual values
      saveToSessionStorage(STORAGE_KEYS.LAYOUTS, layouts);
      saveToSessionStorage(STORAGE_KEYS.ACTIVE_MODULES, activeModules);
      
      // Also update combined session object
      const sessionData = {
        gridLayout: layouts,
        activeModules: activeModules
      };
      
      saveToSessionStorage(STORAGE_KEYS.SESSION_DATA, sessionData);
      
    } catch (err) {
      console.warn('[layout-storage] Failed to update sessionStorage:', err);
    }
  })();
  
  return layoutOK && modulesOK;
}
