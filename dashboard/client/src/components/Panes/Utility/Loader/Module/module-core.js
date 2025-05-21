// MODULE-FLOW-6.3: Module Core - Core Module Functions
// COMPONENT: Module System - Type and Configuration
// PURPOSE: Provides module-specific functionality separate from components
// FLOW: Used by module-operations.js for all module instance operations
// MERMAID-FLOW: flowchart TD; MOD6.3[Module Core] -->|Used by| MOD6.2[Module Operations];
//               MOD6.3 -->|Checks| MOD6.1[Component Registry];
//               MOD6.3 -->|Uses| MOD6.5[Shared Utilities]

// CONSOLIDATION PLAN: MODULE CORE REFACTORING
//
// This file will maintain module-specific functionality that isn't shared
// with the component system. Shared utilities have been moved to
// shared-utilities.js.

/********************************************************************
 * CONSOLIDATION NOTE:
 *
 * This file has been refactored to:
 * 1. Import shared utilities from shared-utilities.js
 * 2. Remove circular imports with component registry where possible 
 * 3. Remove redundant re-exports
 * 4. Standardize on component registry as source of truth for config
 ********************************************************************/

// Import the registry - this creates circular dependency but is needed for now
// In Phase 2, we'll use a more elegant solution
import registry from '../Component/component-registry';

// Import shared utilities from central location
import {
  getCanonicalKey,
  filterByActiveModules,
  processModuleData
} from '../Shared/shared-utilities';

import { MODULE_TYPES } from '../Component/component-constants';

/**
 * MODULE-FLOW-6.3.1: Module Type Management - Type Detection
 * COMPONENT: Module System - Type Classification
 * PURPOSE: Gets the type of a module from its key
 * FLOW: Used by module operations to determine type-specific behavior
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
 * MODULE-FLOW-6.3.2: Module Type Management - Type Checking
 * COMPONENT: Module System - Type Validation
 * PURPOSE: Checks if a module matches a specific type
 * FLOW: Used for type-specific operations and filtering
 * @param {string} moduleKey - Module key to check
 * @param {string} type - Type to check against
 * @returns {boolean} - Whether module matches type
 */
export function isModule(moduleKey, type) {
  return getModuleType(moduleKey) === type;
}

/**
 * MODULE-FLOW-6.3.3: Module Configuration - Instance Management
 * COMPONENT: Module System - Instance Control
 * PURPOSE: Checks if a module allows multiple instances
 * FLOW: Used when adding new module instances
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