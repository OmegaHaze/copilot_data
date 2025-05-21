// module-constants.js
// CONSOLIDATION PLAN: IMPORT SHARED CONSTANTS
// 
// ⚠️ TRANSITION FILE ⚠️
// This file now imports constants from component-constants.js
// rather than declaring its own duplicates.
// 
// Eventually, we should update all imports to point directly to
// component-constants.js and remove this file entirely.

/********************************************************************
 * � CONSOLIDATION NOTE:
 * 
 * All shared constants now come from component-constants.js, which
 * is the canonical source of truth. This file re-exports those
 * constants to maintain backward compatibility while the transition
 * is in progress.
 * 
 * TRANSITION STEPS:
 * 1. Update imports here to component-constants.js ✅
 * 2. Gradually update imports elsewhere to point directly to
 *    component-constants.js
 * 3. Eventually remove this file when all references are updated
 ********************************************************************/

import { MODULE_TYPES, STORAGE_KEYS } from '../Component/component-constants';

// Re-export shared constants for backward compatibility
export { MODULE_TYPES, STORAGE_KEYS };

// Module-specific error messages remain here as they're not shared
export const ERROR_MESSAGES = {
  INVALID_MODULE_KEY: 'Invalid module key provided',
  MISSING_MODULE_TYPE: 'Missing module type',
  FAILED_TOGGLE: 'Failed to toggle module'
};

// MODULE_CONFIG has been removed as component registry is now
// the source of truth for module configuration

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