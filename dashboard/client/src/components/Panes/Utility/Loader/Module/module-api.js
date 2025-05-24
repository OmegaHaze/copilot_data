/**
 * m// API endpoints
const API_ENDPOINTS = {
  MODULES: '/api/modules',
  MODULE_ID: '/api/modules/:type/:id',
  CREATE_MODULE: '/api/modules/:type', // ADD THIS - matches backend
  RESET_DB: '/api/modules/reset-db',
  CLEAR_DB: '/api/modules/clear-db',
  // New simplified GET endpoints
  RESET_MODULE_DB: '/api/modules/reset-module-db',
  CLEAR_ALL_DB: '/api/modules/clear-all-db',
  SYSTEM_INFO: '/api/system/system-info'  // Added properly namespaced system info endpoint
};
 * Functions for interacting with module-related APIs
 */

import { MODULE_TYPES } from './module-constants';
import { getCanonicalKey } from './module-shared';

// API endpoints
const API_ENDPOINTS = {
  MODULES: '/api/modules/registry',
  MODULE_ID: '/api/modules/:type/:id',
  CREATE_MODULE: '/api/modules/:type', // ADD THIS - matches backend
  RESET_DB: '/api/modules/reset-db',
  CLEAR_DB: '/api/modules/clear-db',
  // New simplified GET endpoints
  RESET_MODULE_DB: '/api/modules/reset-module-db',
  CLEAR_ALL_DB: '/api/modules/clear-all-db',
  SYSTEM_INFO: '/api/system/system-info'  // Added properly namespaced system info endpoint
};

// Timeouts
const TIMEOUTS = {
  API_REQUEST: 10000 // 10 seconds
};

/**
 * Fetch modules from API
 * @returns {Promise<Object>} - Module data by type
 */
export async function fetchModules() {
  try {
    console.log('[module-api] Fetching all modules...');
    
    const startTime = Date.now();
    const response = await fetch(API_ENDPOINTS.MODULES, {
      headers: {
        'Accept': 'application/json'
      }
    });
    
    const endTime = Date.now();
    
    if (!response.ok) {
      throw new Error(`Failed to fetch modules: ${response.status}`);
    }
    
    const allModules = await response.json();
    console.log('[module-api] Received modules:', allModules);
    
    // Initialize with MODULE_TYPES keys - ensure each type has an array
    const moduleData = {};
    Object.values(MODULE_TYPES).forEach(type => {
      // Explicitly create an empty array for each module type
      moduleData[type] = [];
    });
    
    // Additional safeguard - double-check that all required keys exist with arrays
    if (!moduleData.SYSTEM || !Array.isArray(moduleData.SYSTEM)) moduleData.SYSTEM = [];
    if (!moduleData.SERVICE || !Array.isArray(moduleData.SERVICE)) moduleData.SERVICE = [];
    if (!moduleData.USER || !Array.isArray(moduleData.USER)) moduleData.USER = [];
    
    if (Array.isArray(allModules)) {
      console.log('[module-api] Processing array of modules:', allModules.length);
      allModules.forEach(module => {
        // Get canonical key (normalized module type)
        const rawType = module.module_type || module.moduleType || 'SYSTEM';
        const type = getCanonicalKey(rawType);
        
        console.log(`[module-api] Processing module of type ${type}:`, module);
        
        // Make sure we're only adding to known module types
        if (!moduleData[type]) {
          console.warn(`[module-api] Skipping module with unknown type: ${type}`, module);
          return; // Skip this module
        }
        
        // Normalize module using standard property names
        const normalizedModule = {
          ...module,
          moduleType: type,
          staticIdentifier: module.staticIdentifier || module.module || module.paneComponent
        };
        
        moduleData[type].push(normalizedModule);
      });
    }
    
    // Log the structure to verify it's correct before returning
    console.log('[module-api] Processed module data structure:', {
      SYSTEM: Array.isArray(moduleData.SYSTEM) ? moduleData.SYSTEM.length : 'Not an array',
      SERVICE: Array.isArray(moduleData.SERVICE) ? moduleData.SERVICE.length : 'Not an array',
      USER: Array.isArray(moduleData.USER) ? moduleData.USER.length : 'Not an array'
    });
    
    // Add diagnostic data
    moduleData._fetchTime = new Date().toISOString();
    moduleData._responseTime = endTime - startTime;
    
    return moduleData;
  } catch (error) {
    console.error('[module-api] Failed to fetch modules:', error);
    
    // Create empty object with all required type arrays
    const emptyResult = {
      SYSTEM: [],
      SERVICE: [],
      USER: []
    };
    
    // Double check that all required types are set as arrays using MODULE_TYPES enum
    Object.values(MODULE_TYPES).forEach(type => {
      if (!emptyResult[type] || !Array.isArray(emptyResult[type])) {
        emptyResult[type] = [];
      }
    });
    
    return {
      ...emptyResult,
      _error: error.message,
      _fetchTime: new Date().toISOString(),
      _apiStatus: {
        SYSTEM: { ok: false },
        SERVICE: { ok: false },
        USER: { ok: false }
      }
    };
  }
}

/**
 * Fetch modules of a specific type
 * @param {string} type - Module type to fetch
 * @returns {Promise<Array>} - Array of modules
 */
export async function fetchModulesByType(type) {
  try {
    console.log(`[module-api] Fetching modules of type ${type}...`);
    
    const startTime = Date.now();
    const response = await fetch(`${API_ENDPOINTS.MODULES}?module_type=${type}`, {
      headers: {
        'Accept': 'application/json'
      }
    });
    
    const endTime = Date.now();
    
    if (!response.ok) {
      throw new Error(`Failed to fetch ${type} modules: ${response.status}`);
    }
    
    const modules = await response.json();
    console.log(`[module-api] Received ${modules.length} ${type} modules`);
    
    // Add diagnostic data
    modules._fetchTime = new Date().toISOString();
    modules._responseTime = endTime - startTime;
    
    return modules;
  } catch (error) {
    console.error(`[module-api] Error fetching ${type} modules:`, error);
    return [];
  }
}

/**
 * Get a module by its ID
 * @param {string} moduleType - Type of module
 * @param {string|number} moduleId - ID of the module
 * @returns {Promise<Object|null>} - Module data or null if not found
 */
export async function getModuleById(moduleType, moduleId) {
  try {
    console.log(`[module-api] Fetching module ${moduleId} of type ${moduleType}...`);
    
    const apiUrl = API_ENDPOINTS.MODULE_ID
      .replace(':type', moduleType.toLowerCase())
      .replace(':id', moduleId);
    
    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (response.status === 404) {
      console.log(`[module-api] Module ${moduleId} not found`);
      return null;
    }
    
    if (!response.ok) {
      throw new Error(`Failed to fetch module: ${response.status}`);
    }
    
    const module = await response.json();
    console.log(`[module-api] Received module:`, module);
    
    return module;
  } catch (error) {
    console.error(`[module-api] Error fetching module ${moduleId}:`, error);
    return null;
  }
}

/**
 * Reset module database - use with caution
 * @returns {Promise<Object>} - Result of the operation
 */
export async function resetModuleDatabase() {
  try {
    console.log('[module-api] Resetting module database using simple GET endpoint...');
    
    // Import the clearModuleStorage function
    const { clearModuleStorage } = await import('./module-storage');
    
    // Use the simplified GET endpoint instead
    const response = await fetch(API_ENDPOINTS.RESET_MODULE_DB, {
      method: 'GET',
      credentials: 'include' // Include cookies in the request
    });
    
    if (!response.ok) {
      throw new Error(`Failed to reset module database: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('[module-api] Module database reset successfully:', result);
    
    // Clear all localStorage data with detailed logging
    const storageResult = clearModuleStorage(true);
    console.log('[module-api] LocalStorage data cleared during reset:', storageResult);
    
    // Include storage clearing result in the API response
    return {
      ...result,
      frontendCleared: storageResult
    };
  } catch (error) {
    console.error('[module-api] Error resetting module database:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Clear module database - use with caution
 * @returns {Promise<Object>} - Result of the operation
 */
export async function clearModuleDatabase() {
  try {
    console.log('[module-api] Clearing module database using simple GET endpoint...');
    
    // Import the clearModuleStorage function
    const { clearModuleStorage } = await import('./module-storage');
    
    // Use the simplified GET endpoint instead
    const response = await fetch(API_ENDPOINTS.CLEAR_ALL_DB, {
      method: 'GET',
      credentials: 'include' // Include cookies in the request
    });
    
    if (!response.ok) {
      throw new Error(`Failed to clear module database: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('[module-api] Module database cleared successfully:', result);
    
    // Clear all localStorage data with detailed logging
    const storageResult = clearModuleStorage(true);
    console.log('[module-api] LocalStorage data cleared during database clear:', storageResult);
    
    // Include storage clearing result in the API response
    return {
      ...result,
      frontendCleared: storageResult
    };
  } catch (error) {
    console.error('[module-api] Error clearing module database:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Register a module with the backend
 * @param {string} moduleType - Type of module (SYSTEM, SERVICE, USER)
 * @param {Object} moduleData - Module data
 * @returns {Promise<Object>} - Registered module data
 */
export async function registerModule(moduleType, moduleData) {
  try {
    console.log(`[module-api] Registering ${moduleType} module:`, moduleData);
    
    const apiUrl = API_ENDPOINTS.MODULE.replace(':type', moduleType.toLowerCase());
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(moduleData)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to register module: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    console.log(`[module-api] Successfully registered module:`, result);
    
    return result;
  } catch (error) {
    console.error(`[module-api] Error registering module:`, error);
    return null;
  }
}

/**
 * Update an existing module in the backend
 * @param {string} moduleType - Type of module (SYSTEM, SERVICE, USER)
 * @param {string|number} moduleId - ID of the module
 * @param {Object} moduleData - Updated module data
 * @returns {Promise<Object|null>} - Updated module data or null if error
 */
export async function updateModule(moduleType, moduleId, moduleData) {
  try {
    console.log(`[module-api] Updating module ${moduleId} of type ${moduleType}:`, moduleData);
    
    const apiUrl = API_ENDPOINTS.MODULE_ID
      .replace(':type', moduleType.toLowerCase())
      .replace(':id', moduleId);
    
    const response = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(moduleData)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to update module: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    console.log(`[module-api] Successfully updated module:`, result);
    
    return result;
  } catch (error) {
    console.error(`[module-api] Error updating module ${moduleId}:`, error);
    return null;
  }
}

/**
 * Delete a module from the backend
 * @param {string} moduleType - Type of module (SYSTEM, SERVICE, USER)
 * @param {string|number} moduleId - ID of the module
 * @returns {Promise<boolean>} - True if successful, false otherwise
 */
export async function deleteModule(moduleType, moduleId) {
  try {
    console.log(`[module-api] Deleting module ${moduleId} of type ${moduleType}...`);
    
    const apiUrl = API_ENDPOINTS.MODULE_ID
      .replace(':type', moduleType.toLowerCase())
      .replace(':id', moduleId);
    
    const response = await fetch(apiUrl, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to delete module: ${response.status} - ${errorText}`);
    }
    
    console.log(`[module-api] Successfully deleted module ${moduleId}`);
    return true;
  } catch (error) {
    console.error(`[module-api] Error deleting module ${moduleId}:`, error);
    return false;
  }
}

/**
 * Synchronize modules with the backend based on active modules
 * @param {Array} activeModules - List of active module IDs
 * @returns {Promise<Object>} - Synchronization result
 */
export async function syncModulesToBackend(activeModules) {
  try {
    console.log('[module-api] Syncing modules to backend...');
    
    if (!Array.isArray(activeModules) || activeModules.length === 0) {
      console.warn('[module-api] No active modules to sync');
      return {
        success: false,
        message: 'No active modules provided',
        modules: [],
        errors: []
      };
    }
    
    const results = {
      modules: [],
      errors: [],
      success: false
    };
    

    //ACTUAL REGISTRY CREATION POINT
    // Process each active module
    for (const moduleId of activeModules) {
      try {
        const parts = moduleId.split('-');
        if (parts.length < 2) {
          results.errors.push({
            moduleId,
            error: 'Invalid module ID format'
          });
          continue;
        }
        
        const moduleType = parts[0];
        const identifier = parts[1];
        const instanceId = parts.length > 2 ? parts[2] : null;
        
        // Register module with backend
        const response = await fetch(`/api/modules/${moduleType.toLowerCase()}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: identifier,
            staticIdentifier: identifier,
            paneComponent: identifier,
            module_type: moduleType,
            instanceId
          })
        });
        
        if (response.ok) {
          const result = await response.json();
          results.modules.push(result);
        } else {
          results.errors.push({
            moduleId,
            error: `API returned status ${response.status}`
          });
        }
      } catch (err) {
        results.errors.push({
          moduleId,
          error: err.message
        });
      }
    }
    
    // Determine overall success
    results.success = results.modules.length > 0;
    console.log(`[module-api] Sync completed. Registered ${results.modules.length} modules with ${results.errors.length} errors`);
    
    return {
      success: results.success,
      message: results.success ? 'Modules synced successfully' : 'Some modules failed to sync',
      modules: results.modules,
      errors: results.errors
    };
  } catch (error) {
    console.error('[module-api] Error syncing modules to backend:', error);
    return {
      success: false,
      message: 'Failed to sync modules',
      error: error.message,
      modules: [],
      errors: []
    };
  }
}

// Function consolidated with later implementation

/**
 * Synchronize active modules with the backend
 * Can be called with activeModules or will retrieve them from storage if not provided
 * @param {Array} [activeModules] - Optional array of active module IDs
 * @returns {Promise<Object>} - Synchronization result
 */
export async function syncActiveModulesToBackend(activeModules) {
  try {
    console.log('[module-api] Syncing active modules to backend...');
    
    // If activeModules not provided, load from storage
    if (!activeModules) {
      // Import functions from other modules
      const { loadActiveModules } = await import('./module-storage');
      
      // Load active modules from storage
      activeModules = await loadActiveModules();
    }
    
    if (!Array.isArray(activeModules) || activeModules.length === 0) {
      console.warn('[module-api] No active modules found to sync');
      return {
        success: false,
        message: 'No active modules found',
        modules: [],
        errors: []
      };
    }
    
    // Call the regular sync function with the loaded modules
    return syncModulesToBackend(activeModules);
  } catch (error) {
    console.error('[module-api] Error syncing active modules to backend:', error);
    return {
      success: false,
      message: 'Failed to sync active modules',
      error: error.message,
      modules: [],
      errors: []
    };
  }
}
