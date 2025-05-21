// module-shared.js
// CONSOLIDATION PLAN: MIGRATE TO SHARED UTILITIES
//
// ⚠️ TRANSITION FILE ⚠️
// This file is being phased out in favor of shared-utilities.js
// It now re-exports functions from shared-utilities.js to
// maintain backward compatibility during the transition.

/********************************************************************
 * � CONSOLIDATION NOTE:
 * 
 * All utility functions have been moved to shared-utilities.js to
 * eliminate duplication with component-core.jsx and standardize
 * behavior across both systems.
 * 
 * TRANSITION STEPS:
 * 1. Move functions to shared-utilities.js ✅
 * 2. Re-export from there to maintain backward compatibility ✅
 * 3. Update imports elsewhere to point to shared-utilities.js
 * 4. Eventually remove this file when all references are updated
 ********************************************************************/

import { MODULE_TYPES } from '../Component/component-constants';
import {
  getCanonicalKey,
  createPaneId,
  getInstanceId,
  mergeModuleItems,
  validateModule,
  validateModules
} from '../Shared/shared-utilities';

// Re-export for backward compatibility
export {
  getCanonicalKey,
  createPaneId,
  getInstanceId,
  mergeModuleItems,
  validateModule,
  validateModules
};
