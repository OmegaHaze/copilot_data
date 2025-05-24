/**
 * module-core.js
 * Core functionality for the module system
 */

import { MODULE_TYPES, STORAGE_KEYS } from './module-constants';

// The module map is the central reference for all modules in the system
let moduleMap = {};
let isInitialized = false;

/**
 * Initialize the module map
 * @param {Object} initialData - Initial module data
 * @returns {Object} The initialized module map
 */
export function initializeModuleMap(initialData = null) {
  if (isInitialized) {
    console.warn('[module-core] Module map already initialized');
    return moduleMap;
  }

  // Create structure using MODULE_TYPES
  moduleMap = initialData || Object.values(MODULE_TYPES).reduce((acc, type) => {
    acc[type] = [];
    return acc;
  }, {});

  isInitialized = true;
  return moduleMap;
}

/**
 * Get the current module map
 * @returns {Object} The current module map
 */
export function getModuleMap() {
  if (!isInitialized) {
    console.warn('[module-core] Getting module map before initialization');
  }
  return { ...moduleMap };
}

/**
 * Set the module map
 * @param {Object} newMap - New module map data
 */
export function setModuleMap(newMap) {
  if (!newMap) {
    console.error('[module-core] Attempted to set null module map');
    return;
  }
  
  moduleMap = { ...newMap };
  isInitialized = true;
  
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('vaio:module-map-updated', {
      detail: { moduleMap }
    }));
  }
}

/**
 * Update a specific module type in the map
 * @param {string} moduleType - Type of module to update
 * @param {Array} modules - Modules of this type
 */
export function updateModuleType(moduleType, modules) {
  if (!Object.values(MODULE_TYPES).includes(moduleType)) {
    console.error(`[module-core] Invalid module type: ${moduleType}`);
    return;
  }
  
  moduleMap = {
    ...moduleMap,
    [moduleType]: [...modules]
  };
  
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('vaio:module-type-updated', {
      detail: { moduleType, modules }
    }));
  }
}

/**
 * Find a module by ID across all types
 * @param {string} moduleId - Module ID to find
 * @returns {Object|null} Found module or null
 */
export function findModuleById(moduleId) {
  if (!moduleId) return null;
  
  for (const type of Object.values(MODULE_TYPES)) {
    const modules = moduleMap[type] || [];
    const found = modules.find(m => 
      m.id === moduleId || 
      m.module === moduleId || 
      m.staticIdentifier === moduleId
    );
    
    if (found) return found;
  }
  
  return null;
}

/**
 * Get all modules of a specific type
 * @param {string} moduleType - Type of modules to get
 * @returns {Array} Modules of the specified type
 */
export function getModulesByType(moduleType) {
  if (!Object.values(MODULE_TYPES).includes(moduleType)) {
    console.error(`[module-core] Invalid module type: ${moduleType}`);
    return [];
  }
  
  return [...(moduleMap[moduleType] || [])];
}

/**
 * Get type of a module by ID
 * @param {string} moduleId - Module ID to check
 * @returns {string|null} Module type or null if not found
 */
export function getModuleType(moduleId) {
  for (const type of Object.values(MODULE_TYPES)) {
    const modules = moduleMap[type] || [];
    const exists = modules.some(m => 
      m.id === moduleId || 
      m.module === moduleId || 
      m.staticIdentifier === moduleId
    );
    
    if (exists) return type;
  }
  
  return null;
}

/**
 * Check if a module exists in the map
 * @param {string} moduleId - Module ID to check
 * @returns {boolean} True if module exists
 */
export function moduleExists(moduleId) {
  return getModuleType(moduleId) !== null;
}

/**
 * Get all module IDs
 * @returns {Array<string>} Array of all module IDs
 */
export function getAllModuleIds() {
  const ids = [];
  
  for (const type of Object.values(MODULE_TYPES)) {
    const modules = moduleMap[type] || [];
    modules.forEach(m => {
      if (m.id || m.module || m.staticIdentifier) {
        ids.push(m.id || m.module || m.staticIdentifier);
      }
    });
  }
  
  return ids;
}

/**
 * Merge module data from different sources
 * @param {Object} moduleData - Module data object
 * @returns {Array} Flattened array of all modules
 */
export function mergeModuleData(moduleData) {
  if (!moduleData) return [];
  
  const allModules = [];
  
  for (const type of Object.values(MODULE_TYPES)) {
    if (Array.isArray(moduleData[type])) {
      allModules.push(...moduleData[type]);
    }
  }
  
  return allModules;
}

/**
 * Validate a module collection
 * @param {Object} moduleData - Module data to validate
 * @returns {boolean} True if valid
 */
export function validateModulesCollection(moduleData) {
  if (!moduleData) return false;
  
  // Must have keys for all module types from MODULE_TYPES
  for (const type of Object.values(MODULE_TYPES)) {
    if (!moduleData[type] || !Array.isArray(moduleData[type])) {
      return false;
    }
  }
  
  return true;
}

/**
 * Check if module data is empty
 * @param {Object} moduleData - Module data to check
 * @returns {boolean} True if empty
 */
export function isModuleDataEmpty(moduleData) {
  if (!moduleData) return true;
  
  return Object.values(MODULE_TYPES).every(type => {
    const modules = moduleData[type];
    return !Array.isArray(modules) || modules.length === 0;
  });
}

/**
 * Save module data to local storage
 * @param {Object} moduleData - Module data to save
 * @returns {boolean} Success status
 */
export function cacheModuleData(moduleData) {
  try {
    if (!validateModulesCollection(moduleData)) {
      console.warn('[module-core] Invalid module data, not caching');
      return false;
    }
    
    // Update the MODULE_REGISTRY which is the authoritative source
    localStorage.setItem(STORAGE_KEYS.MODULE_REGISTRY, JSON.stringify({
      timestamp: Date.now(),
      data: moduleData
    }));
    
    // Also update the MODULE_CACHE as a literal copy
    localStorage.setItem(STORAGE_KEYS.MODULE_CACHE, JSON.stringify({
      timestamp: Date.now(),
      data: moduleData
    }));
    
    console.log('[module-core] Module data cached to registry and cache:', {
      SYSTEM: moduleData.SYSTEM.length,
      SERVICE: moduleData.SERVICE.length,
      USER: moduleData.USER.length
    });
    
    return true;
  } catch (err) {
    console.error('[module-core] Failed to cache module data:', err);
    return false;
  }
}

/**
 * Load module data from local storage
 * @param {number} maxAge - Maximum age in milliseconds (default 24h)
 * @returns {Object|null} Module data or null
 */
export function loadCachedModuleData(maxAge = 24 * 60 * 60 * 1000) {
  try {
    // First try the registry (primary source)
    const rawRegistry = localStorage.getItem(STORAGE_KEYS.MODULE_REGISTRY);
    
    if (rawRegistry) {
      const parsedRegistry = JSON.parse(rawRegistry);
      
      // Check if registry data is stale
      if (Date.now() - parsedRegistry.timestamp <= maxAge) {
        if (validateModulesCollection(parsedRegistry.data)) {
          console.log('[module-core] Using module data from registry:', {
            SYSTEM: Array.isArray(parsedRegistry.data.SYSTEM) ? parsedRegistry.data.SYSTEM.length : 0,
            SERVICE: Array.isArray(parsedRegistry.data.SERVICE) ? parsedRegistry.data.SERVICE.length : 0,
            USER: Array.isArray(parsedRegistry.data.USER) ? parsedRegistry.data.USER.length : 0
          });
          return parsedRegistry.data;
        }
      }
    }
    
    // If registry failed or was invalid, try cache as a backup
    const rawCache = localStorage.getItem(STORAGE_KEYS.MODULE_CACHE);
    
    if (rawCache) {
      const parsedCache = JSON.parse(rawCache);
      
      // Check if cache data is stale
      if (Date.now() - parsedCache.timestamp <= maxAge) {
        if (validateModulesCollection(parsedCache.data)) {
          console.log('[module-core] Using module data from cache (registry unavailable):', {
            SYSTEM: Array.isArray(parsedCache.data.SYSTEM) ? parsedCache.data.SYSTEM.length : 0,
            SERVICE: Array.isArray(parsedCache.data.SERVICE) ? parsedCache.data.SERVICE.length : 0,
            USER: Array.isArray(parsedCache.data.USER) ? parsedCache.data.USER.length : 0
          });
          
          // Sync back to registry since we're using cache data
          localStorage.setItem(STORAGE_KEYS.MODULE_REGISTRY, JSON.stringify({
            timestamp: Date.now(),
            data: parsedCache.data
          }));
          
          return parsedCache.data;
        }
      }
    }
    
    console.log('[module-core] No valid module data found in registry or cache');
    return null;
  } catch (err) {
    console.warn('[module-core] Failed to load module data:', err);
    return null;
  }
}