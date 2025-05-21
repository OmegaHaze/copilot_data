/**
 * shared-utilities.js
 * -----------------------------------------------
 * CONSOLIDATION PLAN: SHARED UTILITIES
 * 
 * This file serves as the canonical source for all shared utility functions
 * used across both the Module and Component systems. By centralizing these
 * utility functions, we eliminate duplication and ensure consistent behavior.
 * 
 * BACKGROUND:
 * Previously, similar or identical functions existed in:
 * 1. module-shared.js 
 * 2. component-core.jsx
 * 
 * This created confusion about which implementation to use and led to 
 * subtle behavioral differences between the systems.
 * 
 * Now, both systems will import from this single source of truth.
 * 
 * ⚠️ CIRCULAR DEPENDENCY WARNING ⚠️
 * There are potential circular dependencies between the Module and Component
 * systems that need careful handling. During the transition phase:
 * 
 * 1. Some consuming files might keep their original implementations temporarily
 * 2. Some imports might need to be dynamic or through intermediary files
 * 3. Phase 2 of consolidation will focus on restructuring the dependency graph
 *    to eliminate these circular references entirely
 */

/********************************************************************
 * MODULE/COMPONENT ID UTILITIES
 * 
 * These functions handle the creation, parsing, and validation of
 * module and component identifiers used throughout the system.
 ********************************************************************/

/**
 * Get canonical key from a module/component identifier
 * For example: "system-SupervisorPane" → "SYSTEM"
 * 
 * @param {string} key - The module or component key
 * @returns {string} - The canonical uppercase key or empty string
 */
export function getCanonicalKey(key) {
  if (!key) return '';
  const str = String(key).trim();
  return str.includes('-') ? str.split('-')[0].toUpperCase() : str.toUpperCase();
}

/**
 * Create a pane ID from module type, static identifier, and instance ID
 * For example: "SYSTEM", "SupervisorPane", "2X3YZ" → "SYSTEM-SupervisorPane-2X3YZ"
 * 
 * @param {string} moduleType - The module type (SYSTEM, SERVICE, USER)
 * @param {string} staticIdentifier - The static part of the identifier
 * @param {string} instanceId - Optional instance ID for multiple instances
 * @returns {string} - The complete pane ID
 */
export function createPaneId(moduleType, staticIdentifier, instanceId = null) {
  if (!moduleType || !staticIdentifier) return '';
  
  const canonicalType = moduleType.toUpperCase().trim();
  return instanceId 
    ? `${canonicalType}-${staticIdentifier}-${instanceId}` 
    : `${canonicalType}-${staticIdentifier}`;
}

/**
 * Extract instance ID from a pane ID
 * For example: "SYSTEM-SupervisorPane-2X3YZ" → "2X3YZ"
 * 
 * @param {string} paneId - The full pane ID
 * @returns {string|null} - The instance ID or null if invalid
 */
export function getInstanceId(paneId) {
  if (!paneId || typeof paneId !== 'string') return null;
  
  const parts = paneId.split('-');
  if (parts.length < 3) return null;
  
  // Return everything after moduleType-staticIdentifier
  return parts.slice(2).join('-');
}

/**
 * Check if a paneId is valid
 * Expected format: MODULETYPE-STATICID-INSTANCEID
 * 
 * @param {string} paneId - The pane ID to validate
 * @returns {boolean} - Whether the pane ID is valid
 */
export function isValidPaneId(paneId) {
  return typeof paneId === 'string' && paneId.split('-').length >= 3;
}

/**
 * Parse a paneId into parts: moduleType, staticIdentifier, instanceId
 * 
 * @param {string} paneId - The pane ID to parse
 * @returns {object|null} - Object with parts or null if invalid
 */
export function parsePaneId(paneId) {
  if (!isValidPaneId(paneId)) return null;

  const parts = paneId.split('-');
  const moduleType = parts[0];
  const staticIdentifier = parts[1];
  const instanceParts = parts.slice(2);
  const instanceId = instanceParts.length > 0 ? instanceParts.join('-') : null;
  
  return {
    moduleType,
    staticIdentifier,
    instanceId,
    fullId: paneId
  };
}

/**
 * Generate a unique instance ID for a module
 * Format: Short 4-5 character alphanumeric string (e.g., "1X2YZ")
 * 
 * @returns {string} - A unique instance ID
 */
export function generateInstanceId() {
  return Math.random().toString(36).substring(2, 7);
}

/********************************************************************
 * MODULE DATA PROCESSING UTILITIES
 * 
 * These functions help transform module data from different formats,
 * merge data from multiple sources, and validate module collections.
 ********************************************************************/

/**
 * Merge module data from multiple sources into a flat array
 * 
 * @param {Object} modules - Module data by type (SYSTEM, SERVICE, USER)
 * @returns {Array} - Flat array of all modules
 */
export function mergeModuleItems(modules) {
  if (!modules || typeof modules !== 'object') return [];

  return Object.values(modules).reduce((acc, list) => {
    if (Array.isArray(list)) acc.push(...list);
    return acc;
  }, []);
}

/**
 * Validate a single module item has required properties
 * 
 * @param {Object} module - Module item to validate
 * @returns {boolean} - Whether the module is valid
 */
export function validateModule(module) {
  return typeof module === 'object' && module !== null && (module.name || module.module);
}

/**
 * Validate an array of module items
 * 
 * @param {Array} modules - Array of module items
 * @returns {boolean} - Whether all modules are valid
 */
export function validateModules(modules) {
  return Array.isArray(modules) && modules.every(validateModule);
}

/**
 * Validate that a modules collection has the correct structure
 * 
 * @param {Object} modules - Module collection to validate
 * @returns {boolean} - Whether the collection is valid
 */
export function validateModulesCollection(modules) {
  if (!modules || typeof modules !== 'object') return false;

  return ['SYSTEM', 'SERVICE', 'USER'].every(type => {
    const value = modules[type];
    return Array.isArray(value) && value.every(validateModule);
  });
}

/**
 * Process module data into the expected shape
 * 
 * @param {Object} modules - Raw module data
 * @returns {Object} - Processed module data with correct structure
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

/**
 * Filter items based on active modules
 * 
 * @param {Array} items - Items to filter
 * @param {Array} activeModules - List of active modules
 * @returns {Array} - Filtered items that match active modules
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
