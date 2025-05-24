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
  syncModulesToBackend,
  syncActiveModulesToBackend
} from './module-api';

import { MODULE_TYPES, STORAGE_KEYS } from './module-constants';

import {
  getModuleMap,
  setModuleMap,
  getModulesByType,
  mergeModuleData,
  isModuleDataEmpty
} from './module-core';

import {
  saveActiveModules,
  loadActiveModules,
  saveLayouts,
  loadLayouts
} from './module-storage';

import {
  findActiveInstances,
  hasActiveInstances,
  addModule,
  removeModule,
  toggleModule,
  saveModuleState
} from './module-operations';

import moduleRegistry from './module-registry';
import {
  loadModule,
  loadModulesForEndpoint,
  loadModuleForEndpoint,
  getAllModules as getLoaderModules,
  getModulesByType as getLoaderModulesByType,
  refreshModules as refreshLoaderModules
} from './module-loader';

/**
 * Initialize the module system
 * @param {boolean} forceRefresh - Force refresh
 * @returns {Promise<Object>} Initialization result
 */
export async function initModuleSystem(forceRefresh = false) {
  try {
    console.log('[module-index] Initializing module system');
    
    // Direct fix for registry - copy data from cache to registry if registry is empty
    try {
      const cache = localStorage.getItem(STORAGE_KEYS.MODULE_CACHE);
      const registry = localStorage.getItem(STORAGE_KEYS.MODULE_REGISTRY);
      
      if (cache && (!registry || registry.includes('"SYSTEM":[]') && registry.includes('"SERVICE":[]'))) {
        console.log('[module-index] Registry empty but cache has data, copying to registry');
        localStorage.setItem(STORAGE_KEYS.MODULE_REGISTRY, cache);
      }
    } catch (e) {
      console.error('[module-index] Error fixing registry:', e);
    }
    
    // Initialize the module registry first - this does the discovery
    // In strict mode, this will throw an error if initialization fails
    try {
      await moduleRegistry.initialize(forceRefresh);
      console.log('[module-index] Module registry successfully initialized');
    } catch (registryError) {
      console.error('[module-index] Critical failure in module registry initialization:', registryError);
      throw new Error(`Module system initialization failed: ${registryError.message}`);
    }
    
    // Get discovered modules from registry
    const moduleData = moduleRegistry.getAllModules();
    if (!moduleData || Object.values(MODULE_TYPES).some(type => !Array.isArray(moduleData[type]))) {
      throw new Error('Module registry did not provide valid module data');
    }
    
    // Set module map with the registry data
    setModuleMap(moduleData);
    console.log('[module-index] Module map updated with registry data');
    
    // Make sure registry is properly populated - directly update localStorage
    try {
      if (mergeModuleData(moduleData).length === 0) {
        // Registry data is empty, try to use cache data
        const cache = localStorage.getItem(STORAGE_KEYS.MODULE_CACHE);
        if (cache) {
          try {
            const cacheData = JSON.parse(cache);
            if (cacheData.data && mergeModuleData(cacheData.data).length > 0) {
              console.log('[module-index] Registry is empty but cache has data - copying to registry');
              localStorage.setItem(STORAGE_KEYS.MODULE_REGISTRY, cache);
              
              // Update module registry and module map with the cache data
              moduleRegistry.setModuleData(cacheData.data);
              setModuleMap(cacheData.data);
            }
          } catch (e) {
            console.error('[module-index] Failed to parse cache data:', e);
          }
        }
      } else {
        // Registry has data, update both storage locations
        localStorage.setItem(STORAGE_KEYS.MODULE_REGISTRY, JSON.stringify({
          timestamp: Date.now(),
          data: moduleData
        }));
        localStorage.setItem(STORAGE_KEYS.MODULE_CACHE, JSON.stringify({
          timestamp: Date.now(),
          data: moduleData
        }));
        console.log('[module-index] Updated both registry and cache storage');
      }
    } catch (storageError) {
      console.error('[module-index] Failed to update storage:', storageError);
    }
 
    // Load active modules and layouts
    const activeModules = loadActiveModules() || [];
    const layouts = loadLayouts() || {};
    console.log(`[module-index] Loaded ${activeModules.length} active modules and ${Object.keys(layouts).length} layouts`);
    
    return {
      success: true,
      moduleMap: getModuleMap(),
      moduleCount: mergeModuleData(moduleData).length,
      activeModules,
      layouts,
      timestamp: Date.now()
    };
  } catch (error) {
    console.error('[module-index] Failed to initialize module system:', error);
    throw error; // In strict mode, propagate errors upward
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
      
      // Discover and register pane modules
      try {
        console.log('[module-index] Auto-discovering pane modules during refresh...');
        const discoveryResult = await moduleRegistry.discoverPaneModules();
        console.log(`[module-index] Pane module discovery ${discoveryResult ? 'successful' : 'failed'}`);
        
        if (discoveryResult) {
          // If discovery was successful, sync our local module data with the registry
          const updatedModuleData = moduleRegistry.getAllModules();
          setModuleMap(updatedModuleData);
          
          // No need to update the cache again - the discovery process already does that
          console.log('[module-index] Module map updated with discovered modules');
        }
      } catch (discoveryError) {
        console.error('[module-index] Failed to discover pane modules during refresh:', discoveryError);
        // Continue with the refresh
      }
      
      return {
        success: true,
        moduleMap: getModuleMap(),
        moduleCount: mergeModuleData(moduleData).length,
        synchronized: syncModules,
        discoveredModules: true
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

/**
 * DEBUG FUNCTION: Force synchronize modules
 * @returns {Promise<Object>} Debug result
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

/**
 * DEBUG FUNCTION: Force reset of module registry
 * @returns {Promise<Object>} Debug result
 */
export async function resetModuleRegistry() {
  try {
    console.log('[module-index] Clearing module registry...');
    
    // Clear the registry but keep the structure
    moduleRegistry.modules = {
      SYSTEM: [],
      SERVICE: [],
      USER: []
    };
    
    // Update the cache
    moduleRegistry.updateCache();
    
    // Reset initialized state to force rediscovery
    moduleRegistry.initialized = false;
    
    // Re-initialize and discover panes
    await moduleRegistry.initialize(true);
    const discoveryResult = await moduleRegistry.discoverPaneModules();
    
    // Refresh our module map with the registry data
    const moduleData = moduleRegistry.getAllModules();
    setModuleMap(moduleData);
    
    return {
      success: true,
      discoverySuccess: discoveryResult,
      moduleCount: moduleRegistry.countModules(),
      modules: moduleData
    };
  } catch (error) {
    console.error('[module-index] Failed to reset module registry:', error);
    return {
      success: false,
      error: error.message,
      stack: error.stack
    };
  }
}

// Export public API - organized by category
export {
  // Constants
  MODULE_TYPES,
  
  // Core module map functions
  getModuleMap,
  getModulesByType,
  
  // Storage functions
  saveActiveModules,
  loadActiveModules,
  saveLayouts,
  loadLayouts,
  
  // Module operations
  findActiveInstances,
  hasActiveInstances,
  addModule,
  removeModule,
  toggleModule,
  saveModuleState,
  
  // API functions
  fetchModules,
  fetchModulesByType,
  getModuleById,
  updateModule,
  deleteModule,
  syncModulesToBackend,
  syncActiveModulesToBackend,
  
  // Loader functions
  loadModule,
  loadModulesForEndpoint,
  loadModuleForEndpoint,
  getLoaderModules,
  getLoaderModulesByType,
  refreshLoaderModules,
  
  // Registry utilities
  moduleRegistry
};