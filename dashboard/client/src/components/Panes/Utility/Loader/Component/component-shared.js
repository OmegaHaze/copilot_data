/**
 * component-shared.js
 * Utility functions shared across the component system
 */

import { MODULE_TYPES, VALIDATION } from './component-constants';

/**
 * Validate a pane ID format
 * @param {string} paneId - Pane ID to validate
 * @returns {boolean} True if valid
 */
export function isValidPaneId(paneId) {
  if (typeof paneId !== 'string' || !paneId.includes('-')) return false;

  const parts = paneId.split('-');
  
  // Must have exactly three parts according to backend validation
  // Format: MODULETYPE-STATICID-INSTANCEID
  if (parts.length !== VALIDATION.PANEID_PARTS) {
    console.warn(`Invalid pane ID format: ${paneId}. Expected MODULETYPE-STATICID-INSTANCEID`);
    return false;
  }
  
  // Validate each part
  const [moduleType, staticId, instanceId] = parts;
  if (!moduleType || !staticId || !instanceId) return false;
  
  // Module type must be one of the allowed types (from MODULE_TYPES)
  if (!Object.values(MODULE_TYPES).includes(moduleType.toUpperCase())) {
    console.warn(`Invalid module type in pane ID: ${paneId}`);
    return false;
  }
  
  return true;
}

/**
 * Parse paneId into its parts
 * @param {string} paneId - Pane ID to parse
 * @returns {Object|null} Parsed parts or null
 */
export function parsePaneId(paneId) {
  if (!isValidPaneId(paneId)) return null;

  const parts = paneId.split('-');
  // We expect exactly three parts based on our validation
  const [moduleType, staticIdentifier, instanceId] = parts;
  
  return {
    moduleType,
    staticIdentifier,
    instanceId,
    fullId: paneId
  };
}

/**
 * Normalize a module type string
 * @param {string} moduleType - Module type to normalize
 * @returns {string} Normalized module type
 */
export function getCanonicalKey(moduleType) {
  if (!moduleType) return '';
  const typeStr = String(moduleType);
  return typeStr.includes('-')
    ? typeStr.split('-')[0].toUpperCase()
    : typeStr.toUpperCase();
}

/**
 * Create a pane ID from parts
 * @param {string} moduleType - Module type
 * @param {string} staticIdentifier - Static identifier
 * @param {string} instanceId - Instance ID
 * @returns {string} Pane ID
 */
export function createPaneId(moduleType, staticIdentifier, instanceId = null) {
  if (!moduleType || !staticIdentifier) return null;
  
  return instanceId
    ? `${moduleType}-${staticIdentifier}-${instanceId}`
    : `${moduleType}-${staticIdentifier}`;
}

/**
 * Create a registration key
 * @param {string} moduleType - Module type
 * @param {string} staticIdentifier - Static identifier
 * @param {string} instanceId - Instance ID
 * @returns {string} Registration key
 */
export function createRegistrationKey(moduleType, staticIdentifier, instanceId = null) {
  return createPaneId(moduleType, staticIdentifier, instanceId);
}

/**
 * Validate a single module entry
 * @param {Object} module - Module to validate
 * @returns {boolean} True if valid
 */
export function validateModuleData(module) {
  return module &&
         typeof module === 'object' &&
         typeof module.module === 'string' &&
         (typeof module.staticIdentifier === 'string' || typeof module.paneComponent === 'string');
}

/**
 * Validate a full module collection
 * @param {Object} modules - Module collection
 * @returns {boolean} True if valid
 */
export function validateModulesCollection(modules) {
  if (!modules || typeof modules !== 'object') return false;

  for (const type of Object.values(MODULE_TYPES)) {
    if (!Array.isArray(modules[type])) return false;
    for (const module of modules[type]) {
      if (!validateModuleData(module)) return false;
    }
  }

  return true;
}