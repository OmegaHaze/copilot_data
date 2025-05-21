/**
 * component-constants.js
 * Central source of truth for all component-related constants
 */

/********************************************************************
 * 🟢 KEEP: Primary Source of MODULE_TYPES Constant
 * 
 * ASSESSMENT:
 * This should be the canonical source for MODULE_TYPES.
 * The duplicate in module-constants.js should be removed.
 * 
 * CONSOLIDATION PLAN:
 * - Keep this implementation
 * - Update all other files to import from here
 * - Remove duplicate from module-constants.js
 ********************************************************************/
// Module type constants
export const MODULE_TYPES = {
  SYSTEM: 'SYSTEM',
  SERVICE: 'SERVICE',
  USER: 'USER'
};

/********************************************************************
 * 🟢 KEEP: Primary Source of STORAGE_KEYS Constant
 * 
 * ASSESSMENT:
 * This should be the canonical source for STORAGE_KEYS.
 * The duplicate in module-constants.js should be removed.
 * 
 * CONSOLIDATION PLAN:
 * - Keep this implementation
 * - Update all other files to import from here
 * - Remove duplicate from module-constants.js
 ********************************************************************/
// API endpoints for component operations
// The frontend is configured to use the plural form 'modules' for the API endpoint.
export const API_ENDPOINTS = {
  MODULES: '/api/modules', // Frontend expects this endpoint
  COMPONENT_RESOLVER: '/api/components/resolve'
};

// Storage keys
export const STORAGE_KEYS = {
  COMPONENT_CACHE: 'vaio_component_cache',
  LAYOUT_CACHE: 'vaio_layouts',
  MODULE_CACHE: 'vaio_module_cache',
  ACTIVE_MODULES: 'vaio_active_modules',
  SESSION_DATA: 'vaio_session'
};

// Timeouts in milliseconds
export const TIMEOUTS = {
  API_REQUEST: 10000
};

// Validation constants
export const VALIDATION = {
  MIN_PANEID_PARTS: 3
};

// Error message constants
export const ERROR_MESSAGES = {
  INVALID_PANEID: 'Invalid paneId format',
  MODULE_TYPE_REQUIRED: 'moduleType is required for component loading',
  COMPONENT_LOAD_FAILED: 'Failed to load component',
  NO_DEFAULT_EXPORT: 'No default export found for component',
  NO_RESOLVER: 'No component resolver available',
  NO_VALID_COMPONENT: 'Component is not a valid function'
};