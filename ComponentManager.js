/**
 * ComponentManager.js
 * Responsible for managing component lifecycle and interactions
 */

import { componentRegistry } from './ComponentRegistry.jsx';
import { mergeModuleItems } from './ModuleFilter.js';

/**
 * Load component for a module
 * @param {string} moduleType - Type of module (SYSTEM, SERVICE, USER)
 * @param {string} instanceId - Instance ID or full paneId
 * @returns {Promise<Object>} - Component constructor and metadata object or error
 */
export async function loadModuleComponent(moduleType, instanceId) {
  if (!moduleType) {
    throw new Error('moduleType is required for component loading');
  }
  
  try {
    let staticIdentifier = moduleType; // Default
    
    // Handle case where instanceId is actually a full paneId
    if (instanceId && instanceId.includes('-')) {
      const parts = instanceId.split('-');
      if (parts.length >= 3) { // Format: moduleType-staticIdentifier-instanceId
        moduleType = parts[0];
        staticIdentifier = parts[1];
      } else if (parts.length === 2) { // Old format or incomplete
        moduleType = parts[0];
      }
    }
    
    // Pass both moduleType and staticIdentifier to loadComponent
    const component = await componentRegistry.loadComponent(moduleType, staticIdentifier);
    if (!component) {
      throw new Error(`Failed to load component for ${moduleType}`);
    }
    
    return {
      component,
      instanceId,
      moduleType,
      staticIdentifier
    };
  } catch (error) {
    console.error(`Error loading module component ${moduleType}:`, error);
    throw error; // Re-throw for proper error handling upstream
  }
}

/**
 * Register a new module instance
 * @param {string} moduleType - Type of module (SYSTEM, SERVICE, USER)
 * @param {string} instanceId - Instance ID
 * @returns {string|null} - The full pane ID or null if registration failed
 */
export function registerModuleInstance(moduleType, instanceId) {
  if (!moduleType || !instanceId) {
    console.error('Both moduleType and instanceId are required for registration');
    return null;
  }
  
  try {
    return componentRegistry.registerInstance(moduleType, instanceId);
  } catch (error) {
    console.error(`Failed to register module instance ${moduleType}-${instanceId}:`, error);
    return null;
  }
}

/**
 * Get all active components
 * @param {Object} modules - Module configuration object {SYSTEM: [], SERVICE: [], USER: []}
 * @param {Array<string>} activeModules - List of active module IDs
 * @returns {Array} - Active components
 */
export function getActiveComponents(modules, activeModules) {
  // Input validation
  if (!modules || typeof modules !== 'object') {
    console.warn('Invalid modules object provided to getActiveComponents');
    return [];
  }
  
  if (!Array.isArray(activeModules)) {
    console.warn('Invalid activeModules array provided to getActiveComponents');
    return [];
  }
  
  try {
    const allItems = mergeModuleItems(modules);
    return allItems.filter(item => {
      if (!item) return false;
      
      const key = componentRegistry.getCanonicalKey(item.module || item.name);
      return key && activeModules.includes(key);
    });
  } catch (error) {
    console.error('Error getting active components:', error);
    return [];
  }
}

/**
 * Clean up module instances
 * @param {string} moduleType - Type of module
 * @param {string} instanceId - Instance ID
 * @returns {boolean} Success status
 */
export function cleanupModuleInstance(moduleType, instanceId) {
  if (!moduleType || !instanceId) {
    console.warn('Both moduleType and instanceId are required for cleanup');
    return false;
  }
  
  try {
    return componentRegistry.unregisterInstance(moduleType, instanceId);
  } catch (error) {
    console.error(`Failed to cleanup module instance ${moduleType}-${instanceId}:`, error);
    return false;
  }
}

/**
 * Get component metadata
 * @param {string} moduleType - Type of module
 * @returns {Object|null} - Component metadata or null if not found
 */
export function getComponentMetadata(moduleType) {
  if (!moduleType) {
    console.warn('moduleType is required to get component metadata');
    return null;
  }
  
  try {
    return componentRegistry.getMetadata(moduleType);
  } catch (error) {
    console.error(`Failed to get metadata for ${moduleType}:`, error);
    return null;
  }
}