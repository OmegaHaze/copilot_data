// module-core.js
// CONSOLIDATION PLAN: MODULE CORE REFACTORING
//
// This file will maintain module-specific functionality that isn't shared
// with the component system. Shared utilities have been moved to
// shared-utilities.js.

/********************************************************************
 * � CONSOLIDATION NOTE:
 *
 * This file has been refactored to:
 * 1. Import shared utilities from shared-utilities.js
 * 2. Remove circular imports with component registry when possible
 * 3. Remove redundant re-exports
 * 4. Standardize on component registry as source of truth for config
 ********************************************************************/

// Still need registry for allowsMultipleInstances - will be addressed in phase 2
import registry from '../Component/component-registry';

// Import shared utilities from central location
import {
  getCanonicalKey,
  filterByActiveModules,
  processModuleData
} from '../Shared/shared-utilities';

import { MODULE_TYPES } from '../Component/component-constants';

/**
 * Get type of a module by key
 * @param {string} moduleKey - Module identifier
 * @returns {string} - Module type (SYSTEM, SERVICE, USER)
 */
export function getModuleType(moduleKey) {
  if (!moduleKey) return MODULE_TYPES.USER;

  // Use registry.getCategoryForModule as the canonical source of module type
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
 * Check if a module allows multiple instances
 * @param {string} moduleKey - Module key to check
 * @returns {boolean} - Whether multiple instances are allowed
 */
export function allowsMultipleInstances(moduleKey) {
  if (!moduleKey) return false;
  
  // Component registry is now the source of truth for module configuration
  const component = registry.getComponent(moduleKey);
  if (!component) return false;
  
  return component.allowMultipleInstances === true;
}

// Export functions that are truly module-specific
export {
  // Core module functions
  getModuleType,
  isModule,
  allowsMultipleInstances,
  
  // Re-export shared utilities that this file uses
  filterByActiveModules,
  processModuleData
};
