// module-constants.js
// Central source of truth for all module-related constants

export const MODULE_TYPES = {
  SYSTEM: 'SYSTEM',
  SERVICE: 'SERVICE',
  USER: 'USER'
};

// All modules are persistent and allow multiple instances
export const MODULE_CONFIG = {
  [MODULE_TYPES.SYSTEM]: {
    isPersistent: true,
    allowMultiple: true,
  },
  [MODULE_TYPES.SERVICE]: {
    isPersistent: true,
    allowMultiple: true,
  },
  [MODULE_TYPES.USER]: {
    isPersistent: true,
    allowMultiple: true,
  }
};

export const ERROR_MESSAGES = {
  INVALID_MODULE_KEY: 'Invalid module key provided',
  MISSING_MODULE_TYPE: 'Missing module type',
  FAILED_TOGGLE: 'Failed to toggle module'
};

export const STORAGE_KEYS = {
  MODULE_CACHE: 'vaio_module_cache'
};


// export const MODULE_STATUSES = {
//   LOADING: 'LOADING',
//   ERROR: 'ERROR',
//   READY: 'READY'
// };
// export const MODULE_ACTIONS = {
//   LOAD: 'LOAD',
//   UNLOAD: 'UNLOAD',
//   TOGGLE: 'TOGGLE'
// };
// export const MODULE_ACTION_TYPES = {
//   LOAD: 'LOAD_MODULE',
//   UNLOAD: 'UNLOAD_MODULE',
//   TOGGLE: 'TOGGLE_MODULE'
// };
// export const MODULE_ACTIONS_MAP = {
//   [MODULE_ACTIONS.LOAD]: MODULE_ACTION_TYPES.LOAD,
//   [MODULE_ACTIONS.UNLOAD]: MODULE_ACTION_TYPES.UNLOAD,
//   [MODULE_ACTIONS.TOGGLE]: MODULE_ACTION_TYPES.TOGGLE
// };
// export const MODULE_ACTIONS_REVERSED = {
//   [MODULE_ACTION_TYPES.LOAD]: MODULE_ACTIONS.LOAD,
//   [MODULE_ACTION_TYPES.UNLOAD]: MODULE_ACTIONS.UNLOAD,
//   [MODULE_ACTION_TYPES.TOGGLE]: MODULE_ACTIONS.TOGGLE
// };