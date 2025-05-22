// session-index.js
// High-level session interface for external consumers

import {
  syncSessionData,
  saveLayouts,
  saveModules,
  loadCachedSession,
  clearCachedSession,
  fetchAndSyncSessionData
} from './session-manager';

import {
  saveToSessionStorage,
  saveToLocalStorage,
  loadFromSessionStorage,
  loadFromLocalStorage
} from './session-storage';

// Default grid structure (hardcoded breakpoints to avoid layout-constants dependency)
const DEFAULT_GRID_LAYOUT = {
  lg: [],
  md: [],
  sm: [],
  xs: [],
  xxs: []
};

/**
 * Load session state from memory cache or fallback to sync
 */
export async function loadSession() {
  const cached = loadCachedSession();
  if (cached) return cached;

  return await syncSessionData();
}

/**
 * Save layouts to backend + storage
 */
export async function saveSessionLayouts(layouts) {
  await saveLayouts(layouts);
}

/**
 * Save modules to backend + storage
 */
export async function saveSessionModules(modules) {
  await saveModules(modules);
}

/**
 * Wipe all session data from storage and backend
 * @param {boolean} clearBackend - Whether to also clear backend data, defaults to true
 * @returns {Promise<boolean>} Success status
 */
export async function clearSession(clearBackend = true) {
  return await clearCachedSession(clearBackend);
}

/**
 * Load session data from all available sources with proper priority
 * 1. Try sessionStorage first (fast in-memory)
 * 2. Fall back to localStorage (persistent)
 * 
 * Returns a unified structure with gridLayout and activeModules
 */
export function loadCompleteSessionState() {
  const sessionData = loadFromSessionStorage('vaio_session');

  if (sessionData && sessionData.gridLayout && sessionData.activeModules) {
    return {
      gridLayout: sessionData.gridLayout,
      activeModules: sessionData.activeModules
    };
  }

  const localStorageLayout = loadFromLocalStorage('vaio_layouts');
  const localStorageModules = loadFromLocalStorage('vaio_active_modules');

  if (localStorageLayout && localStorageModules) {
    const sessionObject = {
      gridLayout: localStorageLayout,
      activeModules: localStorageModules
    };

    saveToSessionStorage('vaio_session', sessionObject);
    return sessionObject;
  }

  // Default empty structure
  return {
    gridLayout: { ...DEFAULT_GRID_LAYOUT },
    activeModules: []
  };
}

// Optional exports for advanced consumers
export {
  saveToSessionStorage,
  saveToLocalStorage,
  loadFromSessionStorage,
  loadFromLocalStorage,
  loadCachedSession,
  clearCachedSession,
  fetchAndSyncSessionData
};
