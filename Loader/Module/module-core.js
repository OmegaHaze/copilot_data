// module-core.js
// Core module utilities (non-duplicated)

import registry from '../Component/component-registry';
import {
  getCanonicalKey,
  createPaneId,
  getInstanceId,
  mergeModuleItems,
  validateModule,
  validateModules
} from './module-shared';
import { MODULE_TYPES } from './module-constants';

/**
 * Get type of a module by key
 * @param {string} moduleKey - Module identifier
 * @returns {string} - Module type (SYSTEM, SERVICE, USER)
 */
export function getModuleType(moduleKey) {
  if (!moduleKey) return MODULE_TYPES.USER;

  const category = registry.getCategoryForModule(moduleKey);
  return Object.values(MODULE_TYPES).includes(category)
    ? category
    : MODULE_TYPES.USER;
}

/**
 * Check if module matches a specific type
 */
export function isModule(moduleKey, type) {
  return getModuleType(moduleKey) === type;
}

/**
 * Generate a unique instance ID for a module
 * Format: Short 4-5 character alphanumeric string (e.g., "1X2YZ")
 */
export function generateInstanceId(moduleType) {
  // Create a shorter random ID in the format of 4-5 characters
  return Math.random().toString(36).substring(2, 7);
}

/**
 * Filter items based on active modules
 */
export function filterByActiveModules(items, activeModules) {
  if (!Array.isArray(items) || !Array.isArray(activeModules)) return [];

  return items.filter(item => {
    if (!item) return false;
    const moduleKey = getCanonicalKey(item.module || item.name);
    return activeModules.some(mod => 
      getCanonicalKey(mod.module || mod.name) === moduleKey
    );
  });
}

/**
 * Check if a module allows multiple instances
 * @param {string} moduleKey - Module key to check
 * @returns {boolean} - Whether multiple instances are allowed
 */
export function allowsMultipleInstances(moduleKey) {
  if (!moduleKey) return false;
  
  const component = registry.getComponent(moduleKey);
  if (!component) return false;
  
  return component.allowMultipleInstances === true;
}

/**
 * Process module data into expected shape
 */
export function processModuleData(modules) {
  const result = {
    SYSTEM: [],
    SERVICE: [],
    USER: []
  };

  if (modules && typeof modules === 'object') {
    if (Array.isArray(modules.SYSTEM)) result.SYSTEM = modules.SYSTEM;
    if (Array.isArray(modules.SERVICE)) result.SERVICE = modules.SERVICE;
    if (Array.isArray(modules.USER)) result.USER = modules.USER;
  }

  return result;
}

// Re-export shared logic for use in other modules
export {
  getCanonicalKey,
  createPaneId,
  getInstanceId,
  mergeModuleItems,
  validateModule,
  validateModules
};
