// session-manager.js
// Centralized runtime session synchronization

import {
  fetchSessionData,
  updateSessionGrid,
  updateSessionModules
} from './session-api';

import {
  saveToSessionStorage,
  loadFromSessionStorage,
  saveToLocalStorage,
  loadFromLocalStorage,
  clearSessionStorage
} from './session-storage';

import {
  validateSessionData,
  assertValidLayout
} from './session-shared';

import { STORAGE_KEYS } from './session-constants';
import { MODULE_TYPES } from '../Component/component-constants';
/**
 * Fetch session data and persist it in memory/sessionStorage
 * @returns {Promise<object>} valid session object
 */
export async function syncSessionData() {
  try {
    const raw = await fetchSessionData();
    validateSessionData(raw);
    assertValidLayout(raw.gridLayout || raw.grid_layout);

    const session = {
      gridLayout: raw.gridLayout || raw.grid_layout,
      activeModules: raw.activeModules || raw.active_modules
    };

    saveToSessionStorage(STORAGE_KEYS.SESSION_DATA, session);
    return session;
  } catch (err) {
    console.error('[session-manager] Failed to sync session data:', err);
    throw err;
  }
}

/**
 * Save updated layout to API and persist it to sessionStorage and localStorage
 */
export async function saveLayouts(layouts) {
  try {
    saveToSessionStorage(STORAGE_KEYS.LAYOUTS, layouts);
    saveToLocalStorage(STORAGE_KEYS.LAYOUTS, layouts);
    await updateSessionGrid(layouts);
  } catch (err) {
    console.error('[session-manager] Failed to save layouts:', err);
    throw err;
  }
}

/**
 * Save updated modules list to API and all storage layers
 */
export async function saveModules(modules) {
  try {
    saveToSessionStorage(STORAGE_KEYS.ACTIVE_MODULES, modules);
    saveToLocalStorage(STORAGE_KEYS.ACTIVE_MODULES, modules);
    await updateSessionModules(modules);
  } catch (err) {
    console.error('[session-manager] Failed to save modules:', err);
    throw err;
  }
}

/**
 * Load full session from sessionStorage if available and valid
 */
export function loadCachedSession() {
  const sessionData = loadFromSessionStorage(STORAGE_KEYS.SESSION_DATA);
  if (!sessionData) return null;

  try {
    validateSessionData(sessionData);
    assertValidLayout(sessionData.gridLayout || sessionData.grid_layout);

    return {
      gridLayout: sessionData.gridLayout || sessionData.grid_layout,
      activeModules: sessionData.activeModules || sessionData.active_modules
    };
  } catch (err) {
    console.error('[session-manager] Cached session is malformed:', err);
    return null;
  }
}

/**
 * Clear all session-related storage and optionally backend data
 */
export async function clearCachedSession(clearBackend = true) {
  const sessionCleared = clearSessionStorage();

  try {
    const { clearLayoutsFromLocalStorage } = await import('../Layout/layout-storage');
    clearLayoutsFromLocalStorage();
  } catch (err) {
    console.error('[session-manager] Failed to clear local storage:', err);
  }

  if (clearBackend) {
    try {
      const { cleanSessionAPI } = await import('./session-api-clear');
      await cleanSessionAPI();
    } catch (err) {
      console.error('[session-manager] Failed to clear backend session:', err);
    }
  }

  return sessionCleared;
}

/**
 * Synchronize layout + module data from localStorage to backend API
 */
export async function syncLocalStorageToBackend() {
  try {
    const layouts = loadFromLocalStorage(STORAGE_KEYS.LAYOUTS);
    const modules = loadFromLocalStorage(STORAGE_KEYS.ACTIVE_MODULES);

    if (layouts) {
      saveToSessionStorage(STORAGE_KEYS.LAYOUTS, layouts);
      await updateSessionGrid(layouts);
    }

    if (modules) {
      const validModules = modules.filter(moduleId => {
        const parts = moduleId.split('-');
        return parts.length === 3 && Object.values(MODULE_TYPES).includes(parts[0]);
      });
      saveToSessionStorage(STORAGE_KEYS.ACTIVE_MODULES, validModules);
      await updateSessionModules(validModules);
    }

    return true;
  } catch (err) {
    console.error('[session-manager] Failed to sync localStorage to backend:', err);
    return false;
  }
}

/**
 * Frontend boot sync from backend only (no fallbacks)
 */
export async function fetchAndSyncSessionData(setGridLayout, setActiveModules, setError = null, context = 'sync') {
  try {
    const backendData = await syncSessionData();
    
    if (setGridLayout && backendData.gridLayout) setGridLayout(backendData.gridLayout);
    if (setActiveModules && Array.isArray(backendData.activeModules)) setActiveModules(backendData.activeModules);

    saveToLocalStorage(STORAGE_KEYS.LAYOUTS, backendData.gridLayout);
    saveToLocalStorage(STORAGE_KEYS.ACTIVE_MODULES, backendData.activeModules);
    
    // Notify registry about active modules
    try {
      // Set session data first - consolidated in one place
      const sessionData = {
        gridLayout: backendData.gridLayout,
        activeModules: backendData.activeModules
      };
      saveToSessionStorage(STORAGE_KEYS.SESSION_DATA, sessionData);
      
      // First import and initialize module registry - the source of truth
      const moduleRegistry = await import('../Module/module-registry').then(m => m.default);
      
      // Ensure module registry is initialized - no fallbacks
      if (!moduleRegistry.initialized) {
        console.info('[session-manager] Initializing module registry');
        await moduleRegistry.initialize(true); // Force refresh to ensure data is current
      }
      
      // Get the module data directly from module registry
      const moduleData = moduleRegistry.getAllModules();
      console.info('[session-manager] Retrieved module data from module registry');
      
      // Now import component registry and update it with module data
      const componentRegistry = await import('../Component/component-registry').then(m => m.default);
      if (componentRegistry && Array.isArray(backendData.activeModules)) {
        // Initialize component registry if needed
        if (!componentRegistry.initialized) {
          await componentRegistry.initialize();
        }
        
        // First log existing event listeners
        const existingListeners = componentRegistry.eventListeners?.moduleStateChanged || [];
        console.info(`[session-manager] Registry has ${existingListeners.length} moduleStateChanged listeners`);
        
        // Notify listeners about module state change
        componentRegistry.notifyListeners('moduleStateChanged', { 
          activeModules: backendData.activeModules 
        });
        
        console.info(`[session-manager] Notified registry about ${backendData.activeModules.length} active modules`);
        
        // Set module data from module registry to component registry - strict approach
        componentRegistry.setModuleData(moduleData);
        console.info('[session-manager] Updated component registry with module registry data');
      }
    } catch (err) {
      console.error('[session-manager] Failed to notify registry:', err);
      throw err;
    }

    return true;
  } catch (err) {
    console.error(`[session-manager] ${context} - Failed to sync session data:`, err);
    if (setError) setError(err);
    return false;
  }
}

/**
 * Save pane state to backend and memory cache
 */
export async function savePaneState(paneId, state) {
  if (!paneId || typeof paneId !== 'string') {
    console.error('[session-manager] Invalid pane ID');
    return false;
  }

  try {
    const { updatePaneState } = await import('./session-api');
    await updatePaneState(paneId, state);

    const sessionData = loadFromSessionStorage(STORAGE_KEYS.SESSION_DATA) || {};
    sessionData.pane_states = sessionData.pane_states || {};
    sessionData.pane_states[paneId] = state;
    saveToSessionStorage(STORAGE_KEYS.SESSION_DATA, sessionData);

    return true;
  } catch (err) {
    console.error(`[session-manager] Failed to save pane state: ${paneId}`, err);
    return false;
  }
}

/**
 * Delete pane state from backend and memory cache
 */
export async function deletePaneState(paneId) {
  if (!paneId || typeof paneId !== 'string') {
    console.error('[session-manager] Invalid pane ID');
    return false;
  }

  try {
    const { deletePaneState: deleteFromBackend } = await import('./session-api');
    await deleteFromBackend(paneId);

    const sessionData = loadFromSessionStorage(STORAGE_KEYS.SESSION_DATA) || {};
    if (sessionData.pane_states) {
      delete sessionData.pane_states[paneId];
      saveToSessionStorage(STORAGE_KEYS.SESSION_DATA, sessionData);
    }

    return true;
  } catch (err) {
    console.error(`[session-manager] Failed to delete pane state: ${paneId}`, err);
    return false;
  }
}
