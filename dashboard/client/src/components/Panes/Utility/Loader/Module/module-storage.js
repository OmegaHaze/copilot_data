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
    
    localStorage.setItem(STORAGE_KEYS.MODULE_CACHE, JSON.stringify({
      timestamp: Date.now(),
      data
    }));
    
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
    const raw = localStorage.getItem(STORAGE_KEYS.MODULE_CACHE);
    if (!raw) return null;
    
    const parsed = JSON.parse(raw);
    
    // Check if cache is stale
    if (Date.now() - parsed.timestamp > maxAge) {
      console.log('[module-storage] Module cache is stale');
      return null;
    }
    
    if (!validateModulesCollection(parsed.data)) {
      console.warn('[module-storage] Invalid cached module data');
      return null;
    }
    
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