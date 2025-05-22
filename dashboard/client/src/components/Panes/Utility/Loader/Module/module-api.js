/**
 * module-api.js
 * Functions for interacting with module-related APIs
 */

import { MODULE_TYPES } from './module-constants';
import { getCanonicalKey } from './module-shared';

// API endpoints
const API_ENDPOINTS = {
  MODULES: '/api/modules',
  MODULE: '/api/modules/:type',
  MODULE_ID: '/api/modules/:type/:id',
  SESSION: '/api/session'
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
    
    // Initialize with MODULE_TYPES keys - make sure to use the actual keys from MODULE_TYPES
    const moduleData = {};
    Object.keys(MODULE_TYPES).forEach(key => {
      moduleData[MODULE_TYPES[key]] = [];
    });
    
    if (Array.isArray(allModules)) {
      allModules.forEach(module => {
        // Get canonical key (normalized module type)
        const rawType = module.module_type || module.moduleType || 'SYSTEM';
        const type = getCanonicalKey(rawType);
        
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
    
    // Add diagnostic data
    moduleData._fetchTime = new Date().toISOString();
    moduleData._responseTime = endTime - startTime;
    
    return moduleData;
  } catch (error) {
    console.error('[module-api] Failed to fetch modules:', error);
    
    // Create empty object with all required type arrays
    const emptyResult = {};
    Object.keys(MODULE_TYPES).forEach(key => {
      emptyResult[MODULE_TYPES[key]] = [];
    });
    
    return {
      ...emptyResult,
      _error: error.message,
      _fetchTime: new Date().toISOString()
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
    console.log('[module-api] Resetting module database...');
    
    const response = await fetch(`${API_ENDPOINTS.MODULES}/reset-db`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to reset module database: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('[module-api] Module database reset successfully:', result);
    
    return result;
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
    console.log('[module-api] Clearing module database...');
    
    const response = await fetch(`${API_ENDPOINTS.MODULES}/clear-db`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to clear module database: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('[module-api] Module database cleared successfully:', result);
    
    return result;
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
    
    // Import parsePaneId directly to avoid circular dependency
    const { parsePaneId } = await import('../Component/component-shared');
    
    // Process each active module
    for (const moduleId of activeModules) {
      try {
        // Parse the module ID to extract type, identifier and instance
        if (!moduleId) {
          console.error('[module-api] Invalid module ID');
          continue;
        }
        
        const { moduleType, staticIdentifier, instanceId } = parsePaneId(moduleId);
        
        if (!moduleType || !staticIdentifier) {
          console.error(`[module-api] Invalid module ID format: ${moduleId}`);
          continue;
        }
        
        // Generate a clean name from the static identifier
        const name = staticIdentifier.replace(/Pane$/, '');
        
        // Check if module already exists
        const existingModule = await getModuleById(moduleType, staticIdentifier);
        
        if (existingModule) {
          console.log(`[module-api] Module ${staticIdentifier} already registered, skipping`);
          results.modules.push({
            id: moduleId,
            result: existingModule
          });
          continue;
        }
        
        // Register new module
        const moduleData = {
          name: name,
          paneComponent: staticIdentifier,
          staticIdentifier: staticIdentifier,
          visible: true,
          supportsStatus: true,
          socketNamespace: `/${name.toLowerCase()}`
        };
        
        const result = await registerModule(moduleType, moduleData);
        
        if (result) {
          console.log(`[module-api] Successfully registered module ${name} from ID ${moduleId}`, result);
          results.modules.push({
            id: moduleId,
            result
          });
        } else {
          console.error(`[module-api] Failed to register module from ID ${moduleId}`);
          results.errors.push({ 
            moduleId, 
            error: 'Registration failed' 
          });
        }
      } catch (error) {
        console.error(`[module-api] Failed to register module ${moduleId}:`, error);
        results.errors.push({ 
          moduleId, 
          error: error.message 
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
