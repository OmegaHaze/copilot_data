/**
 * ModuleFilter.js
 * Simple module filtering utilities
 */

import { componentRegistry } from './ComponentRegistry.js';

/**
 * Filter items based on active modules
 * @param {Array} items - All available items
 * @param {Array} activeModules - List of active module IDs
 * @returns {Array} - Filtered items
 */
export function filterByActiveModules(items, activeModules) {
  if (!Array.isArray(items) || !Array.isArray(activeModules)) {
    return [];
  }
  
  return items.filter(item => {
    if (!item) return false;
    
    const moduleKey = componentRegistry.getCanonicalKey(item.module || item.name);
    return moduleKey && activeModules.some(activeId => 
      componentRegistry.getCanonicalKey(activeId) === moduleKey
    );
  });
}

/**
 * Merge items from different module types
 * @param {Object} modules - Module collections by type
 * @returns {Array} - Combined array
 */
export function mergeModuleItems(modules) {
  if (!modules) return [];
  
  return [
    ...(Array.isArray(modules.SYSTEM) ? modules.SYSTEM : []),
    ...(Array.isArray(modules.SERVICE) ? modules.SERVICE : []),
    ...(Array.isArray(modules.USER) ? modules.USER : [])
  ].filter(Boolean);
}

/**
 * Process module data to ensure consistent format
 * @param {Object} modules - Raw module data
 * @returns {Object} - Processed module data
 */
export function processModuleData(modules) {
  const result = {
    SYSTEM: [],
    SERVICE: [],
    USER: []
  };
  
  if (modules && typeof modules === 'object') {
    // Only process uppercase keys
    if (Array.isArray(modules.SYSTEM)) result.SYSTEM = modules.SYSTEM;
    if (Array.isArray(modules.SERVICE)) result.SERVICE = modules.SERVICE;
    if (Array.isArray(modules.USER)) result.USER = modules.USER;
  }
  
  return result;
}