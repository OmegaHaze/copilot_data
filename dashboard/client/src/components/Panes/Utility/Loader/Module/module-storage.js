/**
 * module-storage.js
 * Storage functions for the module system
 */

import { STORAGE_KEYS } from './module-constants';
import { validateModulesCollection } from './module-core';

/**
 * Cache module data to localStorage
 * @param {Object} data - Module data to cache
 * @returns {boolean} Success status
 */
export function cacheModuleData(data) {
  try {
    if (!validateModulesCollection(data)) {
      console.warn('[module-storage] Invalid module data, not caching');
      return false;
    }
    
    const timestamp = Date.now();
    const cachedData = {
      timestamp,
      data
    };
    
    // Keep both storages in sync
    localStorage.setItem(STORAGE_KEYS.MODULE_REGISTRY, JSON.stringify(cachedData));
    localStorage.setItem(STORAGE_KEYS.MODULE_CACHE, JSON.stringify(cachedData));
    
    return true;
  } catch (err) {
    console.warn('[module-storage] Failed to cache module data:', err);
    return false;
  }
}

/**
 * Load cached module data from localStorage
 * @param {number} maxAge - Max age in milliseconds, default 24h
 * @returns {Object|null} Cached data or null
 */
export function loadCachedModuleData(maxAge = 24 * 60 * 60 * 1000) {
  try {
    // First try the registry (primary source)
    const registryRaw = localStorage.getItem(STORAGE_KEYS.MODULE_REGISTRY);
    if (registryRaw) {
      try {
        const registryParsed = JSON.parse(registryRaw);
        
        // Check if registry data is stale
        if (Date.now() - registryParsed.timestamp <= maxAge) {
          if (validateModulesCollection(registryParsed.data)) {
            console.log('[module-storage] Using module data from registry');
            return registryParsed.data;
          }
        }
      } catch (registryErr) {
        console.warn('[module-storage] Failed to parse registry data:', registryErr);
      }
    }
    
    // Fall back to cache if registry didn't work
    const cacheRaw = localStorage.getItem(STORAGE_KEYS.MODULE_CACHE);
    if (!cacheRaw) return null;
    
    const cacheParsed = JSON.parse(cacheRaw);
    
    // Check if cache is stale
    if (Date.now() - cacheParsed.timestamp > maxAge) {
      console.log('[module-storage] Module cache is stale');
      return null;
    }
    
    if (!validateModulesCollection(cacheParsed.data)) {
      console.warn('[module-storage] Invalid cached module data');
      return null;
    }
    
    // If we're using cache data, sync it back to the registry
    localStorage.setItem(STORAGE_KEYS.MODULE_REGISTRY, JSON.stringify({
      timestamp: Date.now(),
      data: cacheParsed.data
    }));
    
    return parsed.data;
  } catch (err) {
    console.warn('[module-storage] Failed to load cached module data:', err);
    return null;
  }
}

/**
 * Save active modules to storage
 * @param {Array} activeModules - List of active module IDs
 * @returns {boolean} Success status
 */
export function saveActiveModules(activeModules) {
  try {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_MODULES, JSON.stringify({
      timestamp: Date.now(),
      data: activeModules
    }));
    
    return true;
  } catch (err) {
    console.warn('[module-storage] Failed to save active modules:', err);
    return false;
  }
}

/**
 * Load active modules from storage
 * @returns {Array|null} Active modules or null
 */
export function loadActiveModules() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ACTIVE_MODULES);
    if (!raw) return null;
    
    const parsed = JSON.parse(raw);
    return parsed.data;
  } catch (err) {
    console.warn('[module-storage] Failed to load active modules:', err);
    return null;
  }
}

/**
 * Save layout configuration to storage
 * @param {Object} layouts - Layout configuration
 * @returns {boolean} Success status
 */
export function saveLayouts(layouts) {
  try {
    localStorage.setItem(STORAGE_KEYS.LAYOUT_CACHE, JSON.stringify({
      timestamp: Date.now(),
      data: layouts
    }));
    
    return true;
  } catch (err) {
    console.warn('[module-storage] Failed to save layouts:', err);
    return false;
  }
}

/**
 * Load layouts from storage
 * @returns {Object|null} Layout configuration or null
 */
export function loadLayouts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LAYOUT_CACHE);
    if (!raw) return null;
    
    const parsed = JSON.parse(raw);
    return parsed.data;
  } catch (err) {
    console.warn('[module-storage] Failed to load layouts:', err);
    return null;
  }
}

/**
 * Clear all module-related caches
 */
export function clearModuleCaches() {
  try {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    return true;
  } catch (err) {
    console.warn('[module-storage] Failed to clear caches:', err);
    return false;
  }
}

/**
 * Clear all module-related localStorage data
 * This removes all cached modules, registry, active modules, and layout data
 * @param {boolean} verbose - Whether to log detailed information about what's being cleared
 * @returns {Object} Result with success status and details of what was cleared
 */
export function clearModuleStorage(verbose = false) {
  try {
    console.log('[module-storage] Clearing all module-related localStorage data');
    
    // Create a list of keys to clear
    const keysToRemove = [
      // Module specific keys
      STORAGE_KEYS.MODULE_CACHE,
      STORAGE_KEYS.MODULE_REGISTRY,
      STORAGE_KEYS.ACTIVE_MODULES,
      STORAGE_KEYS.LAYOUT_CACHE,
      STORAGE_KEYS.SESSION_DATA,
      
      // Legacy keys that might still exist
      'vaio_module_cache',
      'vaio_module_registry',
      'vaio_layouts',
      'vaio_active_modules',
      'vaio_session',
      
      // Any other related caches
      'vaio_ui_state',
      'vaio_user_preferences'
    ];
    
    // Track what was removed
    const removed = [];
    const failed = [];
    
    // Remove each key
    keysToRemove.forEach(key => {
      try {
        // Check if it exists first
        if (localStorage.getItem(key)) {
          localStorage.removeItem(key);
          removed.push(key);
          if (verbose) console.log(`[module-storage] Removed localStorage key: ${key}`);
        }
      } catch (keyError) {
        failed.push({ key, error: keyError.message });
        if (verbose) console.warn(`[module-storage] Failed to remove key ${key}:`, keyError);
      }
    });
    
    console.log(`[module-storage] Successfully cleared ${removed.length} localStorage keys`);
    
    // Return detailed information
    return {
      success: true,
      keysRemoved: removed,
      keysFailed: failed
    };
  } catch (err) {
    console.error('[module-storage] Failed to clear module storage:', err);
    return {
      success: false,
      error: err.message
    };
  }
}