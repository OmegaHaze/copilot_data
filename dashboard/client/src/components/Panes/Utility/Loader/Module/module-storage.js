/**
 * MODULE-FLOW-6.4: Module Storage - Storage Functions
 * COMPONENT: Module System - Data Persistence
 * PURPOSE: Provides localStorage-based persistence for module data
 * FLOW: Used by module-operations for caching module data
 * MERMAID-FLOW: flowchart TD; MOD6.4[Module Storage] -->|Used by| MOD6.2[Module Operations];
 *               MOD6.4 -->|Stores| MOD6.4.1[Module Cache];
 *               MOD6.4 -->|Uses| MOD6.4.2[LocalStorage]
 */

// CONSOLIDATION PLAN: STORAGE FUNCTION STANDARDIZATION
//
// This file is the canonical source for module storage operations

/********************************************************************
 * CONSOLIDATION NOTE:
 *
 * This file now imports STORAGE_KEYS directly from component-constants.js
 * which is the canonical source for all shared constants.
 * 
 * This file remains the canonical implementation of module storage
 * functions. The duplicate implementations in module-operations.js
 * have been removed, and that file now imports these functions.
 ********************************************************************/

import { STORAGE_KEYS } from '../Component/component-constants.js';

/**
 * MODULE-FLOW-6.4.1: Module Cache Management - Data Caching
 * COMPONENT: Module System - Cache Operations
 * PURPOSE: Caches module data to localStorage
 * FLOW: Used to store module data between page loads
 * @param {Object} data - Module data to cache
 * @returns {boolean} - Success status
 */
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

/**
 * MODULE-FLOW-6.4.2: Module Cache Management - Data Loading
 * COMPONENT: Module System - Cache Operations
 * PURPOSE: Loads cached module data from localStorage
 * FLOW: Used to retrieve module data on page load
 * @returns {Object|null} - Cached module data or null if not found
 */
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

/**
 * MODULE-FLOW-6.4.3: Module Cache Management - Cache Clearing
 * COMPONENT: Module System - Cache Operations
 * PURPOSE: Clears cached module data
 * FLOW: Used during reset operations
 * @returns {boolean} - Success status
 */
export function clearModuleCache() {
  try {
    localStorage.removeItem(STORAGE_KEYS.MODULE_CACHE);
    return true;
  } catch (err) {
    console.warn('[module-storage] Failed to clear module cache:', err);
    return false;
  }
}

// Export all storage functions
export default {
  cacheModuleData,
  loadCachedModuleData,
  clearModuleCache
};