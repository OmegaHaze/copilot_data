/**
 * component-constants.js
 * Constants specific to the component system
 */

// Import canonical constants from the module system
import { MODULE_TYPES, STORAGE_KEYS } from '../Module/module-constants';
export { MODULE_TYPES, STORAGE_KEYS };

// API endpoints
export const API_ENDPOINTS = {
  MODULES: '/api/modules',
  COMPONENT_RESOLVER: '/api/components/resolve'
};

// Request timeouts
export const TIMEOUTS = {
  API_REQUEST: 10000
};

// Validation constants
export const VALIDATION = {
  PANEID_PARTS: 3, // Exactly 3 parts required: MODULETYPE-STATICID-INSTANCEID
  VALID_MODULE_TYPES: ['SYSTEM', 'SERVICE', 'USER']
};

// Component error messages
export const ERROR_MESSAGES = {
  INVALID_PANEID: 'Invalid paneId format',
  MODULE_TYPE_REQUIRED: 'moduleType is required for component loading',
  COMPONENT_LOAD_FAILED: 'Failed to load component',
  NO_DEFAULT_EXPORT: 'No default export found for component',
  NO_RESOLVER: 'No component resolver available',
  NO_VALID_COMPONENT: 'Component is not a valid function'
};