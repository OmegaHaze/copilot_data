/**
 * module-index.js
 * Main interface to the module system
 */

import { 
  fetchModules, 
  fetchModulesByType,
  getModuleById,
  updateModule,
  deleteModule,
  syncModulesToBackend 
} from './module-api';

import { MODULE_TYPES } from './module-constants';

import {
  initializeModuleMap,
  getModuleMap,
  setModuleMap,
  getModulesByType,
  mergeModuleData,
  isModuleDataEmpty,
  cacheModuleData,
  loadCachedModuleData
} from './module-core';

import {
  saveActiveModules,
  loadActiveModules,
  saveLayouts,
  loadLayouts
} from './module-storage';

// Import module registration functions
import { syncActiveModulesToBackend } from './module-registration';

/**
 * Initialize the module system
 * @returns {Promise<Object>} Initialization result
 */
export async function initModuleSystem() {
  try {
    console.log('[module-index] Initializing module system');
    
    // Try to load from cache first
    let moduleData = loadCachedModuleData();
    let fromCache = false;
    
    if (moduleData && !isModuleDataEmpty(moduleData)) {
      console.log('[module-index] Using module data from cache');
      fromCache = true;
    } else {
      // Load from API if cache is empty/invalid
      console.log('[module-index] Fetching module data from API');
      moduleData = await fetchModules();
      
      // If API returned valid data, cache it
      if (moduleData && !isModuleDataEmpty(moduleData)) {
        console.log('[module-index] Caching module data from API');
        cacheModuleData(moduleData);
      } else {
        console.error('[module-index] API returned empty or invalid module data');
        throw new Error('API returned empty or invalid module data');
      }
    }
    
    // Initialize the module map with our data
    initializeModuleMap(moduleData);
    
    // Load active modules if available
    const activeModules = loadActiveModules() || [];
    
    // Load layouts if available
    const layouts = loadLayouts() || {};
    
    // Synchronize active modules with the backend
    console.log('[module-index] Synchronizing active modules with backend...');
    try {
      // Make sure we actually have active modules to sync
      if (activeModules.length > 0) {
        const syncResult = await syncModulesToBackend(activeModules);
        console.log('[module-index] Module synchronization result:', syncResult);
        
        // Always refresh module data after sync to ensure we have the latest modules
        console.log('[module-index] Refreshing module data after sync');
        await refreshModuleData();
      } else {
        console.log('[module-index] No active modules to synchronize');
      }
    } catch (syncError) {
      console.error('[module-index] Failed to synchronize modules with backend:', syncError);
      // Don't fail initialization if sync fails
    }
    
    return {
      success: true,
      fromCache,
      moduleMap: getModuleMap(),
      moduleCount: mergeModuleData(moduleData).length,
      activeModules,
      layouts
    };
  } catch (error) {
    console.error('[module-index] Failed to initialize module system:', error);
    throw error; // Don't silently recover, let the error propagate
  }
}

/**
 * Refresh module data from the server
 * @param {boolean} syncModules - Whether to sync modules with backend before refreshing
 * @returns {Promise<Object>} Refresh result
 */
export async function refreshModuleData(syncModules = false) {
  try {
    console.log('[module-index] Refreshing module data from server');
    
    // Optionally sync active modules with backend first
    if (syncModules) {
      try {
        console.log('[module-index] Synchronizing modules with backend before refresh');
        const syncResult = await syncActiveModulesToBackend();
        console.log('[module-index] Module synchronization result:', syncResult);
      } catch (syncError) {
        console.error('[module-index] Failed to synchronize modules with backend:', syncError);
        // Continue with refresh even if sync fails
      }
    }
    
    const moduleData = await fetchModules();
    
    if (moduleData && !isModuleDataEmpty(moduleData)) {
      // Update the module map
      setModuleMap(moduleData);
      
      // Cache the fresh data
      cacheModuleData(moduleData);
      
      return {
        success: true,
        moduleMap: getModuleMap(),
        moduleCount: mergeModuleData(moduleData).length,
        synchronized: syncModules
      };
    } else {
      console.warn('[module-index] Server returned empty or invalid module data');
      return {
        success: false,
        error: 'Server returned invalid data',
        moduleMap: getModuleMap(),
        synchronized: syncModules
      };
    }
  } catch (error) {
    console.error('[module-index] Failed to refresh module data:', error);
    return {
      success: false,
      error: error.message,
      moduleMap: getModuleMap(),
      synchronized: false
    };
  }
}

// Export public API
export {
  // Constants from module-constants
  MODULE_TYPES,
  
  // Core module map functions from module-core
  getModuleMap,
  getModulesByType,
  
  // Storage functions from module-storage
  saveActiveModules,
  loadActiveModules,
  saveLayouts,
  loadLayouts,
  
  // Module registration functions
  syncActiveModulesToBackend,
  
  // API functions from module-api
  fetchModules,
  fetchModulesByType,
  getModuleById,
  updateModule,
  deleteModule,
  syncModulesToBackend
};

// Import additional module operations after declaration to prevent circular deps
import {
  findActiveInstances,
  hasActiveInstances,
  addModule,
  removeModule,
  toggleModule,
  saveModuleState
} from './module-operations';

// Export operations functions
export {
  findActiveInstances,
  hasActiveInstances,
  addModule,
  removeModule,
  toggleModule,
  saveModuleState
};

/**
 * Debug function to force module synchronization
 * Exposed globally for browser console testing
 * @returns {Promise<Object>} Debug results
 */
export async function debugSyncModules() {
  try {
    console.log('[module-index] DEBUG: Forcing module synchronization...');
    const activeModules = loadActiveModules() || [];
    
    if (activeModules.length === 0) {
      console.warn('[module-index] DEBUG: No active modules found to synchronize');
      return {
        success: false,
        message: 'No active modules found',
        activeModules: []
      };
    }
    
    console.log('[module-index] DEBUG: Active modules to sync:', activeModules);
    
    // Use direct API function for sync
    const syncResult = await syncModulesToBackend(activeModules);
    
    // Refresh module data
    const refreshResult = await refreshModuleData();
    
    return {
      success: syncResult.success,
      syncResult,
      refreshResult,
      activeModules
    };
  } catch (error) {
    console.error('[module-index] DEBUG: Error in debug sync:', error);
    return {
      success: false,
      error: error.message,
      stack: error.stack
    };
  }
}