/**
 * Module Registry - Defines the classification for each known module.
 * System, service, and user module types determine pane logic and display.
 */

// Module type constants
export const MODULE_TYPE = {
  SYSTEM: "system",
  SERVICE: "service",
  USER: "user"
};

// Known module classifications by type
export const MODULE_TYPES = {
  // Core system modules
  supervisor: MODULE_TYPE.SYSTEM,
  dashboard: MODULE_TYPE.SYSTEM,
  settings: MODULE_TYPE.SYSTEM,

  // Service modules (toggleable backends)
  nvidia: MODULE_TYPE.SERVICE,
  cpu: MODULE_TYPE.SERVICE,
  memory: MODULE_TYPE.SERVICE,
  disk: MODULE_TYPE.SERVICE,
  network: MODULE_TYPE.SERVICE,
  processes: MODULE_TYPE.SERVICE,

  // User modules: all others default to USER
};

// Default configurations for different module types
export const MODULE_CONFIG = {
  [MODULE_TYPE.SYSTEM]: {
    isPersistent: true,    // System modules remain loaded
    isEssential: true,     // Cannot be removed
    allowMultiple: false,  // Only one instance allowed
  },
  [MODULE_TYPE.SERVICE]: {
    isPersistent: false,   // Can be toggled
    isEssential: false,    // Can be removed
    allowMultiple: true,   // Multiple instances allowed
  },
  [MODULE_TYPE.USER]: {
    isPersistent: false,   // Can be toggled
    isEssential: false,    // Can be removed
    allowMultiple: true,   // Multiple instances allowed
  }
};

/**
 * Get type of a module by key
 * @param {string} moduleKey - Module identifier
 * @returns {"system" | "service" | "user"} - Module type
 */
export function getModuleType(moduleKey) {
  if (!moduleKey) return MODULE_TYPE.USER;
  return MODULE_TYPES[moduleKey.toLowerCase()] || MODULE_TYPE.USER;
}

/**
 * Check if module matches a specific type
 * @param {string} moduleKey - Module identifier
 * @param {"system" | "service" | "user"} type - Type to check against
 * @returns {boolean} - True if module matches the type
 */
export function isModule(moduleKey, type) {
  return getModuleType(moduleKey) === type;
}

/**
 * Check if a module allows multiple instances
 * @param {string} moduleKey - Module identifier
 * @returns {boolean} - True if multiple instances are allowed
 */
export function allowsMultipleInstances(moduleKey) {
  const type = getModuleType(moduleKey);
  return MODULE_CONFIG[type]?.allowMultiple || false;
}

/**
 * Check if a module is essential (cannot be removed)
 * @param {string} moduleKey - Module identifier
 * @returns {boolean} - True if module is essential
 */
export function isEssentialModule(moduleKey) {
  const type = getModuleType(moduleKey);
  return MODULE_CONFIG[type]?.isEssential || false;
}

/**
 * Extract base module type from pane ID (e.g., "nvidia-123abc" → "nvidia")
 * Note: This function is kept for backward compatibility, but new code
 * should use componentRegistry.getCanonicalKey() instead
 * 
 * @param {string} paneId - Full pane identifier
 * @returns {string|null} - Base module type or null
 */
export function getBaseModuleType(paneId) {
  if (!paneId) return null;
  return paneId.includes("-") ? paneId.split("-")[0] : paneId;
}

/**
 * Extract instance ID from pane ID (e.g., "nvidia-123abc" → "123abc")
 * @param {string} paneId - Full pane identifier
 * @returns {string|null} - Instance ID or null
 */
export function getInstanceId(paneId) {
  if (!paneId || !paneId.includes("-")) return null;
  return paneId.split("-")[1];
}

/**
 * Parse a pane ID into its components
 * @param {string} paneId - Full pane identifier
 * @returns {{moduleType: string|null, instanceId: string|null}} - Parsed components
 */
export function parsePaneId(paneId) {
  return {
    moduleType: getBaseModuleType(paneId),
    instanceId: getInstanceId(paneId)
  };
}

/**
 * Generate a unique module instance ID
 * Note: This function is kept for backward compatibility, but new code
 * should use componentRegistry.generateInstanceId() instead
 * 
 * @returns {string} - Random alphanumeric instance ID
 */
export function generateInstanceId() {
  return Math.random().toString(36).substring(2, 8);
}

/**
 * Create a full pane ID by combining module type and instance ID
 * Note: This function is kept for backward compatibility, but new code
 * should use componentRegistry.createPaneId() instead
 * 
 * @param {string} moduleType - Module type identifier
 * @param {string} [instanceId] - Optional instance ID (generated if not provided)
 * @returns {string} - Full pane ID
 */
export function createPaneId(moduleType, instanceId) {
  const id = instanceId || generateInstanceId();
  return `${moduleType}-${id}`;
}