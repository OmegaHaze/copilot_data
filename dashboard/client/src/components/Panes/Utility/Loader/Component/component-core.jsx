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

/**
 * Normalize a module type string (e.g. 'system' → 'SYSTEM')
 * @param {string} type - Raw module type
 * @returns {string}
 */
export function getCanonicalKey(type) {
  return typeof type === 'string' ? type.trim().toUpperCase() : '';
}

/**
 * Generate the registration key used in the component registry
 * @param {string} moduleType - SYSTEM, SERVICE, USER
 * @param {string} staticIdentifier - Unique identifier (e.g. SupervisorPane)
 * @param {string} instanceId - Optional instance identifier
 * @returns {string} Composite key like SYSTEM-SupervisorPane or SYSTEM-SupervisorPane-instanceId
 */
export function createRegistrationKey(moduleType, staticIdentifier, instanceId = null) {
  const type = getCanonicalKey(moduleType);
  return instanceId 
    ? `${type}-${staticIdentifier}-${instanceId}`
    : `${type}-${staticIdentifier}`;
}

/**
 * Check if a paneId is valid
 * Expected format: MODULETYPE-STATICID-INSTANCEID
 * @param {string} paneId
 * @returns {boolean}
 */
export function isValidPaneId(paneId) {
  return typeof paneId === 'string' && paneId.split('-').length >= 3;
}

/**
 * Parse a paneId into parts: moduleType, staticIdentifier, instanceId
 * @param {string} paneId
 * @returns {object|null}
 */
export function parsePaneId(paneId) {
  if (!isValidPaneId(paneId)) return null;

  const parts = paneId.split('-');
  const moduleType = parts[0];
  const staticIdentifier = parts[1];
  const instanceParts = parts.slice(2);
  const instanceId = instanceParts.length > 0 ? instanceParts.join('-') : null;
  
  return {
    moduleType,
    staticIdentifier,
    instanceId,
    fullId: paneId
  };
}
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
