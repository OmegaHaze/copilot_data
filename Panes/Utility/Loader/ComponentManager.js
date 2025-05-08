/**
 * ComponentManager.js
 * Responsible for managing component lifecycle and interactions
 */

import { componentRegistry } from './ComponentRegistry.js';
import { mergeModuleItems } from './ModuleFilter.js';

/**
 * Load component for a module
 * @param {string} moduleType - Type of module
 * @param {string} instanceId - Instance ID
 * @returns {Promise<Object>} - Component constructor and metadata
 */
export async function loadModuleComponent(moduleType, instanceId) {
  const component = await componentRegistry.loadComponent(moduleType);
  if (!component) {
    throw new Error(`Failed to load component for ${moduleType}`);
  }
  
  return {
    component,
    instanceId,
    moduleType
  };
}

/**
 * Register a new module instance
 * @param {string} moduleType - Type of module
 * @param {string} instanceId - Instance ID
 */
export function registerModuleInstance(moduleType, instanceId) {
  componentRegistry.registerInstance(moduleType, instanceId);
}

/**
 * Get all active components
 * @param {Object} modules - Module configuration
 * @param {Array} activeModules - List of active module IDs
 * @returns {Array} - Active components
 */
export function getActiveComponents(modules, activeModules) {
  const allItems = mergeModuleItems(modules);
  return allItems.filter(item => {
    const key = componentRegistry.getCanonicalKey(item.module || item.name);
    return activeModules.includes(key);
  });
}

/**
 * Clean up module instances
 * @param {string} moduleType - Type of module
 * @param {string} instanceId - Instance ID
 */
export function cleanupModuleInstance(moduleType, instanceId) {
  componentRegistry.unregisterInstance(moduleType, instanceId);
}

/**
 * Get component metadata
 * @param {string} moduleType - Type of module
 * @returns {Object} - Component metadata
 */
export function getComponentMetadata(moduleType) {
  return componentRegistry.getMetadata(moduleType);
}
