/**
 * Module Registry - Defines the classification for each module.
 * Uses ComponentRegistry as the single source of truth.
 */

// Import the component registry
import { componentRegistry } from './ComponentRegistry.js';

// Module type constants for semantic clarity
export const MODULE_TYPE = {
  SYSTEM: "SYSTEM",
  SERVICE: "SERVICE",
  USER: "USER"
};

// Default configurations for different module types
export const MODULE_CONFIG = {
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
 * Uses ComponentRegistry as the single source of truth
 * 
 * @param {string} moduleKey - Module identifier
 * @returns {"SYSTEM" | "SERVICE" | "USER"} - Module type
 */
export function getModuleType(moduleKey) {
  if (!moduleKey) return MODULE_TYPE.USER;
  
  // Ensure module_type is uppercase wherever applicable
  moduleKey = moduleKey.toUpperCase();

  // Get category from ComponentRegistry (single source of truth)
  const category = componentRegistry.getCategoryForModule(moduleKey);
  
  // If valid category found, use it
  if (category && ['SYSTEM', 'SERVICE', 'USER'].includes(category.toUpperCase())) {
    return category.toUpperCase();
  }
  
  // Default to user module if not categorized
  return MODULE_TYPE.USER;
}

/**
 * Check if module matches a specific type
 */
export function isModule(moduleKey, type) {
  return getModuleType(moduleKey) === type;
}

/**
 * Check if a module allows multiple instances
 */
export function allowsMultipleInstances(moduleKey) {
  const type = getModuleType(moduleKey);
  return MODULE_CONFIG[type]?.allowMultiple || false;
}

// Delegate core functions directly to ComponentRegistry
export const getBaseModuleType = componentRegistry.getCanonicalKey.bind(componentRegistry);
export const generateInstanceId = componentRegistry.generateInstanceId.bind(componentRegistry);
export const createPaneId = componentRegistry.createPaneId.bind(componentRegistry);
export const getInstanceId = (paneId) => {
  if (!paneId || !paneId.includes("-")) return null;
  return paneId.split("-")[1];
};