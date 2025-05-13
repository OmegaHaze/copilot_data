/**
 * Module Registry - Module classification utilities
 * Uses ComponentRegistry for consistent module type handling
 */

import { componentRegistry } from './ComponentRegistry.jsx';

// Module type constants
export const MODULE_TYPE = {
  SYSTEM: "SYSTEM",
  SERVICE: "SERVICE",
  USER: "USER"
};

// Module configuration map
const MODULE_CONFIG = {
  [MODULE_TYPE.SYSTEM]: {
    isPersistent: true,    // System modules remain loaded
    allowMultiple: false,  // Only one instance allowed
  },
  [MODULE_TYPE.SERVICE]: {
    isPersistent: false,   // Can be toggled
    allowMultiple: true,   // Multiple instances allowed
  },
  [MODULE_TYPE.USER]: {
    isPersistent: false,   // Can be toggled
    allowMultiple: true,   // Multiple instances allowed
  }
};

/**
 * Get type of a module by key
 * @param {string} moduleKey - Module identifier
 * @returns {string} - Module type (SYSTEM, SERVICE, USER)
 */
export function getModuleType(moduleKey) {
  if (!moduleKey) return MODULE_TYPE.USER;
  
  // Get category from registry (single source of truth)
  const category = componentRegistry.getCategoryForModule(moduleKey);
  
  // Return valid category or default to USER
  if (category && Object.values(MODULE_TYPE).includes(category)) {
    return category;
  }
  
  return MODULE_TYPE.USER;
}

/**
 * Check if module matches a specific type
 * @param {string} moduleKey - Module identifier
 * @param {string} type - Type to check
 * @returns {boolean} True if module matches type
 */
export function isModule(moduleKey, type) {
  return getModuleType(moduleKey) === type;
}

/**
 * Check if a module allows multiple instances
 * @param {string} moduleKey - Module identifier
 * @returns {boolean} True if multiple instances allowed
 */
export function allowsMultipleInstances(moduleKey) {
  const type = getModuleType(moduleKey);
  return MODULE_CONFIG[type]?.allowMultiple || false;
}

// Direct pass-through to ComponentRegistry for core functions
export const getCanonicalKey = componentRegistry.getCanonicalKey.bind(componentRegistry);
export const generateInstanceId = componentRegistry.generateInstanceId.bind(componentRegistry);
export const createPaneId = componentRegistry.createPaneId.bind(componentRegistry);

/**
 * Extract instance ID from pane ID
 * @param {string} paneId - Full pane ID
 * @returns {string|null} Instance ID or null
 */
export function getInstanceId(paneId) {
  if (!paneId || !paneId.includes("-")) return null;
  
  const parts = paneId.split("-");
  return parts.length > 1 ? parts[parts.length - 1] : null;
}