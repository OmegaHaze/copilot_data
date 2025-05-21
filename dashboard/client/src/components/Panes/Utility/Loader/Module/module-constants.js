/**
 * MODULE-FLOW-6.6: Module Constants - Constants & Error Messages
 * COMPONENT: Module System - Configuration
 * PURPOSE: Provides constants and error messages for module system
 * FLOW: Transition file that re-exports from canonical sources
 * MERMAID-FLOW: flowchart TD; MOD6.6[Module Constants] -->|Imports| MOD6.6.1[Component Constants];
 *               MOD6.6 -->|Provides| MOD6.6.2[Error Messages];
 *               MOD6.6 -->|Used by| MOD6.2[Module Operations]
 */

// CONSOLIDATION PLAN: IMPORT SHARED CONSTANTS
// 
// ⚠️ TRANSITION FILE ⚠️
// This file now imports constants from component-constants.js
// rather than declaring its own duplicates.
// 
// Eventually, we should update all imports to point directly to
// component-constants.js and remove this file entirely.

/********************************************************************
 * CONSOLIDATION NOTE:
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

/**
 * MODULE-FLOW-6.6.1: Error Messages - Module System Errors
 * COMPONENT: Module System - Error Handling
 * PURPOSE: Defines standard error messages for module operations
 * FLOW: Used for consistent error messages across the system
 */
export const ERROR_MESSAGES = {
  INVALID_MODULE_KEY: 'Invalid module key provided',
  MISSING_MODULE_TYPE: 'Missing module type',
  FAILED_TOGGLE: 'Failed to toggle module'
};

// MODULE_CONFIG has been removed as component registry is now
// the source of truth for module configuration

// The following commented-out constants have been removed as part
// of the consolidation effort since they're no longer needed:
// - MODULE_STATUSES
// - MODULE_ACTIONS
// - MODULE_ACTION_TYPES 
// - MODULE_ACTIONS_MAP
// - MODULE_ACTIONS_REVERSED