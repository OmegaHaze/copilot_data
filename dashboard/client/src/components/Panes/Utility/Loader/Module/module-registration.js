/**
 * module-registration.js
 * Functions for syncing active modules with the backend API
 */

import { MODULE_TYPES } from './module-constants';
import { loadActiveModules } from './module-storage';
import { registerModule, getModuleById } from './module-api';
import { parsePaneId } from '../Component/component-shared';

/**
 * MODULE-FLOW-6.9: Module Registration - Backend Module Sync
 * COMPONENT: Module System - Backend Registration
 * PURPOSE: Syncs existing active modules with the backend
 */

/**
 * Register a module with the backend API
 * Uses the dynamic module information
 * 
 * @param {string} moduleId - Full module ID (e.g., "SYSTEM-SupervisorPane-abc123")
 * @returns {Promise<Object>} - Registered module data
 */
export async function registerModuleFromId(moduleId) {
  if (!moduleId) {
    console.error('[module-registration] Invalid module ID');
    return null;
  }
  
  // Parse the module ID to extract type, identifier and instance
  const { moduleType, staticIdentifier, instanceId } = parsePaneId(moduleId);
  
  if (!moduleType || !staticIdentifier) {
    console.error(`[module-registration] Invalid module ID format: ${moduleId}`);
    return null;
  }
  
  // Generate a clean name from the static identifier
  const name = staticIdentifier.replace(/Pane$/, '');
  
  try {
    // Check if module already exists
    const existingModule = await getModuleById(moduleType, staticIdentifier);
    
    if (existingModule) {
      console.log(`[module-registration] Module ${staticIdentifier} already registered, skipping`);
      return existingModule;
    }
    
    // Use the centralized registerModule function from module-api.js
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
      console.log(`[module-registration] Successfully registered module ${name} from ID ${moduleId}`, result);
    } else {
      console.error(`[module-registration] Failed to register module from ID ${moduleId}`);
    }
    
    return result;
  } catch (error) {
    console.error(`[module-registration] Error registering module ${moduleId}:`, error);
    return null;
  }
}

/**
 * Sync active modules from local storage to backend
 * Uses existing module structure without hardcoding
 * 
 * @returns {Promise<Object>} - Results of the sync operation
 */
export async function syncActiveModulesToBackend() {
  console.log('[module-registration] Syncing active modules to backend...');
  
  // Load active modules from local storage
  const activeModules = loadActiveModules();
  
  if (!Array.isArray(activeModules) || activeModules.length === 0) {
    console.log('[module-registration] No active modules to sync');
    return { 
      success: false, 
      message: 'No active modules found',
      modules: [],
      errors: []
    };
  }
  
  // Use the syncModulesToBackend function from module-api
  const { syncModulesToBackend } = await import('./module-api');
  const results = await syncModulesToBackend(activeModules);
  
  console.log(`[module-registration] Sync completed. Registered ${results.modules.length} modules with ${results.errors.length} errors`);
  
  return results;
}

/**
 * Get all registered modules from the backend
 * 
 * @returns {Promise<Array>} - Array of registered modules
 */
export async function getRegisteredModules() {
  try {
    const { fetchModules } = await import('./module-api');
    const moduleData = await fetchModules();
    
    // Flatten all module types into a single array
    const allModules = [];
    for (const type of Object.values(MODULE_TYPES)) {
      if (Array.isArray(moduleData[type])) {
        allModules.push(...moduleData[type]);
      }
    }
    
    return allModules;
  } catch (error) {
    console.error('[module-registration] Failed to get registered modules:', error);
    return [];
  }
}
