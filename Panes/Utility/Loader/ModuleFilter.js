/**
 * ModuleFilter.js
 * Responsible for filtering and managing module lists
 */

import { componentRegistry } from './ComponentRegistry.js';

/**
 * Filter items based on active modules using the component registry
 * @param {Array} items - All available items
 * @param {Array} activeModules - List of active module IDs
 * @returns {Array} - Filtered items that match active modules
 */
export function filterByActiveModules(items, activeModules) {
  if (!Array.isArray(activeModules) || activeModules.length === 0) {
    return [];
  }
  
  return items.filter(item => {
    if (!item) return false;
    
    // Get the module key using the registry
    const moduleKey = componentRegistry.getCanonicalKey(item.module || item.name);
    if (!moduleKey) return false;
    
    // Check for module instances using canonical keys
    return activeModules.some(activeId => {
      return componentRegistry.getCanonicalKey(activeId) === moduleKey;
    });
  });
}

/**
 * Merge items from different module types into a single array
 * @param {Object} modules - Object containing arrays of different module types
 * @returns {Array} - Combined array of all modules
 */
export function mergeModuleItems(modules) {
  return [
    ...(modules.system || []),
    ...(modules.service || []),
    ...(modules.user || [])
  ].filter(Boolean);
}

/**
 * Process and validate module data
 * @param {Object} modules - Raw module data
 * @returns {Object} - Processed and validated module data
 */
export function processModuleData(modules) {
  return {
    system: Array.isArray(modules.system) ? modules.system : [],
    service: Array.isArray(modules.service) ? modules.service : [],
    user: Array.isArray(modules.user) ? modules.user : []
  };
}
