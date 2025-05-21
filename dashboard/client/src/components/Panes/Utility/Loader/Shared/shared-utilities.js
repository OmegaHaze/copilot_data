/**
 * MODULE-FLOW-6.5: Shared Utilities - Core Utility Functions
 * COMPONENT: Shared Layer - Common Functionality
 * PURPOSE: Provides shared utility functions for Module and Component systems
 * FLOW: Imported by both Module and Component systems
 * MERMAID-FLOW: flowchart TD; MOD6.5[Shared Utilities] -->|Used by| MOD6.4[Module Shared];
 *               MOD6.5 -->|Used by| COMP6.5[Component Core];
 *               MOD6.5 -->|Central| MOD6.5.1[Utility Functions]
 */

/********************************************************************
 * MODULE/COMPONENT ID UTILITIES
 * 
 * These functions handle the creation, parsing, and validation of
 * module and component identifiers used throughout the system.
 ********************************************************************/

/**
 * MODULE-FLOW-6.5.1: Module ID Utilities - Canonical Key Generation
 * COMPONENT: Shared Layer - ID Management
 * PURPOSE: Normalizes module type strings to canonical format
 * FLOW: Used for module type comparison and identification
 * @param {string} key - The module or component key
 * @returns {string} - The canonical uppercase key or empty string
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
 * MODULE-FLOW-6.5.12: Module Data Processing - Active Module Filtering
 * COMPONENT: Shared Layer - Data Processing
 * PURPOSE: Filters items based on active modules
 * FLOW: Used to filter available modules to show only active ones
 * @param {Array} items - Items to filter
 * @param {Array} activeModules - List of active modules
 * @returns {Array} - Filtered items that match active modules
 */
export function getCanonicalKey(key) {
  if (!key) return '';
  const str = String(key).trim();
  return str.includes('-') ? str.split('-')[0].toUpperCase() : str.toUpperCase();
}

/**
 * MODULE-FLOW-6.5.2: Module ID Utilities - Pane ID Creation
 * COMPONENT: Shared Layer - ID Management
 * PURPOSE: Creates pane IDs from module type, identifier, and instance ID
 * FLOW: Used when creating new module instances
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
 * MODULE-FLOW-6.5.3: Module ID Utilities - Instance ID Extraction
 * COMPONENT: Shared Layer - ID Management
 * PURPOSE: Extracts instance ID from a pane ID
 * FLOW: Used to identify specific instances from pane IDs
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
 * MODULE-FLOW-6.5.4: Module ID Utilities - Pane ID Validation
 * COMPONENT: Shared Layer - ID Management
 * PURPOSE: Validates pane ID format
 * FLOW: Used to verify IDs before operations
 * @param {string} paneId - The pane ID to validate
 * @returns {boolean} - Whether the pane ID is valid
 */
export function isValidPaneId(paneId) {
  return typeof paneId === 'string' && paneId.split('-').length >= 3;
}

/**
 * MODULE-FLOW-6.5.5: Module ID Utilities - Pane ID Parsing
 * COMPONENT: Shared Layer - ID Management
 * PURPOSE: Parses a pane ID into components
 * FLOW: Used to extract information from pane IDs
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
 * MODULE-FLOW-6.5.6: Module ID Utilities - Instance ID Generation
 * COMPONENT: Shared Layer - ID Management
 * PURPOSE: Generates a unique instance ID for a new module
 * FLOW: Used when creating new module instances
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
 * MODULE-FLOW-6.5.7: Module Data Processing - Module Merging
 * COMPONENT: Shared Layer - Data Processing
 * PURPOSE: Merges module data from multiple sources
 * FLOW: Used when combining modules from different sources
 * @param {Object} modules - Module data by type
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
 * MODULE-FLOW-6.5.8: Module Data Processing - Module Validation
 * COMPONENT: Shared Layer - Data Validation
 * PURPOSE: Validates a single module item
 * FLOW: Used to verify module data integrity
 * @param {Object} module - Module item to validate
 * @returns {boolean} - Whether the module is valid
 */
export function validateModule(module) {
  return typeof module === 'object' && module !== null && (module.name || module.module);
}

/**
 * MODULE-FLOW-6.5.9: Module Data Processing - Module Collection Validation
 * COMPONENT: Shared Layer - Data Validation
 * PURPOSE: Validates an array of module items
 * FLOW: Used to verify module array integrity
 * @param {Array} modules - Array of module items
 * @returns {boolean} - Whether all modules are valid
 */
export function validateModules(modules) {
  return Array.isArray(modules) && modules.every(validateModule);
}

/**
 * MODULE-FLOW-6.5.10: Module Data Processing - Module Collection Structure Validation
 * COMPONENT: Shared Layer - Data Validation
 * PURPOSE: Validates that a modules collection has the correct structure
 * FLOW: Used to verify module data from API
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
 * MODULE-FLOW-6.5.11: Module Data Processing - Module Data Normalization
 * COMPONENT: Shared Layer - Data Processing
 * PURPOSE: Processes module data into the expected shape
 * FLOW: Used to normalize data from different sources
 * @param {Object} modules - Raw module data
 * @returns {Object} - Processed module data with correct structure
 */
// Note: Function implementation already exists in the actual file
// This is just documentation for the existing function

/**
 * MODULE-FLOW-6.5.12: Module Data Processing - Active Module Filtering
 * COMPONENT: Shared Layer - Data Processing
 * PURPOSE: Filters items based on active modules
 * FLOW: Used to filter available modules to show only active ones
 * @param {Array} items - Items to filter
 * @param {Array} activeModules - List of active modules
 * @returns {Array} - Filtered items that match active modules
 */