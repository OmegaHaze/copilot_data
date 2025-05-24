/**
 * module-loader.js
 * Loads modules from registry and provides them to endpoints
 * 
 * MODULE-FLOW-4.1: Module Loader
 * COMPONENT: Frontend - Module Loading
 * PURPOSE: Manages loading module data from registry to endpoints
 */

import registry from './module-registry';
import { getCanonicalKey, createRegistrationKey } from './module-shared';
import { MODULE_TYPES } from './module-constants';

// Track module load promises
const moduleLoadPromises = new Map();

/**
 * Load a module from the registry
 * @param {string} moduleType - Module type (SYSTEM, SERVICE, USER)
 * @param {string} identifier - Module identifier
 * @returns {Promise<Object|null>} - Module data or null
 */
export async function loadModule(moduleType, identifier) {
  if (!moduleType || !identifier) return null;
  
  const canonicalType = getCanonicalKey(moduleType);
  const registrationKey = createRegistrationKey(moduleType, identifier);
  
  console.debug('[module-loader] Loading module:', { 
    moduleType: canonicalType, 
    identifier,
    registrationKey
  });
  
  // Check if module is already cached in memory
  const cachedModule = registry.findModule(canonicalType, identifier);
  if (cachedModule) {
    return cachedModule;
  }
  
  // Return existing promise if already loading
  if (moduleLoadPromises.has(registrationKey)) {
    return moduleLoadPromises.get(registrationKey);
  }
  
  // Load from registry/API
  const loadPromise = (async () => {
    try {
      // Make sure registry is initialized
      if (!registry.initialized) {
        await registry.initialize();
      }
      
      // Try to find the module again after initialization
      const module = registry.findModule(canonicalType, identifier);
      
      if (module) {
        console.debug(`[module-loader] Found module ${identifier}:`, module);
        return module;
      }
      
      // If not found, refresh from backend
      await registry.refreshFromBackend();
      
      // Try one more time after refresh
      const refreshedModule = registry.findModule(canonicalType, identifier);
      
      if (refreshedModule) {
        console.debug(`[module-loader] Found module ${identifier} after refresh:`, refreshedModule);
        return refreshedModule;
      }
      
      console.warn(`[module-loader] Module not found: ${canonicalType}/${identifier}`);
      return null;
    } catch (error) {
      console.error(`[module-loader] Failed to load module ${canonicalType}/${identifier}:`, error);
      return null;
    } finally {
      moduleLoadPromises.delete(registrationKey);
    }
  })();
  
  // Store the promise
  moduleLoadPromises.set(registrationKey, loadPromise);
  return loadPromise;
}

/**
 * Load modules for an endpoint
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Load options
 * @returns {Promise<Object>} - Module data for endpoint
 */
export async function loadModulesForEndpoint(endpoint, options = {}) {
  const { type, filter } = options;
  
  // Ensure registry is initialized
  if (!registry.initialized) {
    await registry.initialize(options.forceRefresh);
  }
  
  // Handle different endpoints
  switch (endpoint) {
    case 'registry':
      // For registry endpoint, return all modules
      return registry.getAllModules();
      
    case 'modules':
      // For modules endpoint, return modules filtered by type
      if (type && MODULE_TYPES[type]) {
        return { 
          [MODULE_TYPES[type]]: registry.getModulesByType(type)
        };
      }
      return registry.getAllModules();
      
    default:
      console.warn(`[module-loader] Unknown endpoint: ${endpoint}`);
      return {};
  }
}

/**
 * Load a specific module for an endpoint
 * @param {string} endpoint - API endpoint
 * @param {string} moduleType - Module type
 * @param {string} identifier - Module identifier
 * @returns {Promise<Object|null>} - Module data or null
 */
export async function loadModuleForEndpoint(endpoint, moduleType, identifier) {
  // For a specific module, load it directly
  const module = await loadModule(moduleType, identifier);
  
  switch (endpoint) {
    case 'registry':
    case 'modules':
      return module;
      
    default:
      console.warn(`[module-loader] Unknown endpoint: ${endpoint}`);
      return null;
  }
}

/**
 * Get all available modules
 * @param {Object} options - Options for loading
 * @returns {Promise<Object>} - All modules by type
 */
export async function getAllModules(options = {}) {
  // Ensure registry is initialized
  if (!registry.initialized) {
    await registry.initialize(options.forceRefresh);
  }
  
  return registry.getAllModules();
}

/**
 * Get modules by type
 * @param {string} moduleType - Module type
 * @param {Object} options - Options for loading
 * @returns {Promise<Array>} - Modules of specified type
 */
export async function getModulesByType(moduleType, options = {}) {
  // Ensure registry is initialized
  if (!registry.initialized) {
    await registry.initialize(options.forceRefresh);
  }
  
  return registry.getModulesByType(moduleType);
}

/**
 * Force refresh modules
 * @returns {Promise<Object>} - Refresh result
 */
export async function refreshModules() {
  return registry.refreshFromBackend();
}
