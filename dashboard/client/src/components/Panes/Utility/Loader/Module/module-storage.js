// module-storage.js
// CONSOLIDATION PLAN: STORAGE FUNCTION STANDARDIZATION
//
// This file is the canonical source for module storage operations

/********************************************************************
 * 📝 CONSOLIDATION NOTE:
 *
 * This file now imports STORAGE_KEYS directly from component-constants.js
 * which is the canonical source for all shared constants.
 * 
 * This file remains the canonical implementation of module storage
 * functions. The duplicate implementations in module-operations.js
 * have been removed, and that file now imports these functions.
 ********************************************************************/

import { STORAGE_KEYS } from '../Component/component-constants.js';

/********************************************************************
 * 🟢 KEEP: These functions should be the canonical implementations
 * 
 * ASSESSMENT:
 * Between module-operations.js and module-storage.js, these implementations
 * should be kept as the canonical versions since this file is dedicated
 * to storage operations.
 * 
 * CONSOLIDATION PLAN:
 * - Keep these functions here
 * - Remove duplicate implementations from module-operations.js
 * - Update all imports to reference these functions
 ********************************************************************/
export function cacheModuleData(data) {
  try {
    localStorage.setItem(STORAGE_KEYS.MODULE_CACHE, JSON.stringify({
      timestamp: Date.now(),
      data
    }));
    return true;
  } catch (err) {
    console.warn('[module-storage] Failed to cache module data:', err);
    return false;
  }
}

export function loadCachedModuleData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MODULE_CACHE);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    const maxAge = 24 * 60 * 60 * 1000;
    if (Date.now() - parsed.timestamp > maxAge) return null;

    return parsed.data;
  } catch (err) {
    console.warn('[module-storage] Failed to read module cache:', err);
    return null;
  }
}
