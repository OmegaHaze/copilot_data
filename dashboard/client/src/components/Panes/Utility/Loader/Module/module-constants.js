/**
 * module-constants.js
 * Canonical source of truth for module-related constants
 */

// Module type constants
export const MODULE_TYPES = {
  SYSTEM: 'SYSTEM',
  SERVICE: 'SERVICE',
  USER: 'USER'
};

// Module-specific storage keys
export const STORAGE_KEYS = {
  MODULE_CACHE: 'vaio_module_cache',
  LAYOUT_CACHE: 'vaio_layouts',
  ACTIVE_MODULES: 'vaio_active_modules',
  SESSION_DATA: 'vaio_session'
};

// Module statuses
export const MODULE_STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  ERROR: 'ERROR',
  LOADING: 'LOADING'
};

// Default module options
export const DEFAULT_MODULE_OPTIONS = {
  allowMultiple: false,
  hasConfig: false,
  isRequired: false
};

// Module-specific error messages
export const ERROR_MESSAGES = {
  INVALID_MODULE_KEY: 'Invalid module key provided',
  MISSING_MODULE_TYPE: 'Missing module type',
  FAILED_TOGGLE: 'Failed to toggle module'
};