/**
 * component-core.jsx
 * Visual and logical helpers for the component system
 */

import React from 'react';

/**
 * Create a visual placeholder for loading/error states
 * @param {string} paneId - The pane ID associated with this component
 * @param {string} message - Message to show in the placeholder
 * @returns {JSX.Element}
 */
export function createPlaceholder(paneId, message = 'Component not available') {
  return (
    <div className="p-4 bg-red-900/20 border border-red-800/50 rounded-lg h-full w-full flex flex-col items-center justify-center">
      <div className="text-red-500 text-lg font-mono mb-2">Component Error</div>
      <div className="text-red-400 text-sm">{message}</div>
      <div className="text-red-300/70 text-xs mt-4">{paneId || 'Unknown ID'}</div>
    </div>
  );
}

/********************************************************************
 * � CONSOLIDATION NOTE:
 * 
 * The following functions have been moved to shared-utilities.js:
 * - getCanonicalKey
 * - createPaneId (previously createRegistrationKey)
 * - isValidPaneId
 * - parsePaneId
 * 
 * This file now re-exports them from shared-utilities.js to maintain
 * backward compatibility during the transition.
 * 
 * TRANSITION STEPS:
 * 1. Move functions to shared-utilities.js ✅
 * 2. Import and re-export here for backward compatibility ✅
 * 3. Update imports elsewhere to point to shared-utilities.js
 * 4. Eventually remove these re-exports when references are updated
 ********************************************************************/

// Import shared utilities from central location
import {
  getCanonicalKey as sharedGetCanonicalKey,
  createPaneId,
  isValidPaneId as sharedIsValidPaneId,
  parsePaneId as sharedParsePaneId
} from '../Shared/shared-utilities';

/**
 * Normalize a module type string (e.g. 'system' → 'SYSTEM')
 * @param {string} type - Raw module type
 * @returns {string}
 */
export function getCanonicalKey(type) {
  return sharedGetCanonicalKey(type);
}

/**
 * Generate the registration key used in the component registry
 * @param {string} moduleType - SYSTEM, SERVICE, USER
 * @param {string} staticIdentifier - Unique identifier (e.g. SupervisorPane)
 * @param {string} instanceId - Optional instance identifier
 * @returns {string} Composite key like SYSTEM-SupervisorPane or SYSTEM-SupervisorPane-instanceId
 */
export function createRegistrationKey(moduleType, staticIdentifier, instanceId = null) {
  return createPaneId(moduleType, staticIdentifier, instanceId);
}

/**
 * Check if a paneId is valid
 * Expected format: MODULETYPE-STATICID-INSTANCEID
 * @param {string} paneId
 * @returns {boolean}
 */
export function isValidPaneId(paneId) {
  return sharedIsValidPaneId(paneId);
}

/**
 * Parse a paneId into parts: moduleType, staticIdentifier, instanceId
 * @param {string} paneId
 * @returns {object|null}
 */
export function parsePaneId(paneId) {
  return sharedParsePaneId(paneId);
}
/********************************************************************
 * 📝 CONSOLIDATION NOTE:
 * 
 * The following functions should eventually be replaced with imports
 * from shared-utilities.js. However, we're maintaining the original
 * implementations here temporarily to avoid circular dependencies and
 * ensure the system works correctly.
 * 
 * Phase 2 of the consolidation will address these functions by creating
 * a better dependency structure that allows direct imports without
 * circular references.
 ********************************************************************/

/**
 * Merge module data from multiple module types into a flat array
 * @param {Object} modules - Module data by type
 * @returns {Array} Flat array of all modules
 */
export function mergeModuleData(modules) {
  if (!modules || typeof modules !== 'object') return [];

  return Object.values(modules).reduce((acc, list) => {
    if (Array.isArray(list)) acc.push(...list);
    return acc;
  }, []);
}

/**
 * Validate that a module data object has the correct shape
 * @param {Object} modules - Module data to validate
 * @returns {boolean}
 */
export function validateModulesCollection(modules) {
  if (!modules || typeof modules !== 'object') return false;

  return ['SYSTEM', 'SERVICE', 'USER'].every(type => {
    const value = modules[type];
    return Array.isArray(value) && value.every(mod => typeof mod === 'object' && mod !== null);
  });
}
