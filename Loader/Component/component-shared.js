// component-shared.js
// Stateless helpers shared across the component system

import { MODULE_TYPES, VALIDATION } from './component-constants';

/**
 * Validate a pane ID format
 */
export function isValidPaneId(paneId) {
  if (typeof paneId !== 'string' || !paneId.includes('-')) return false;

  const parts = paneId.split('-');
  return parts.length >= VALIDATION.MIN_PANEID_PARTS &&
         parts[0].length > 0 &&
         parts[1].length > 0;
}

/**
 * Parse paneId into its parts
 */
export function parsePaneId(paneId) {
  if (!isValidPaneId(paneId)) return null;

  const parts = paneId.split('-');
  return {
    moduleType: parts[0],
    staticIdentifier: parts[1],
    instanceId: parts.length > 2 ? parts.slice(2).join('-') : null,
    fullId: paneId
  };
}

/**
 * Normalize a module type string
 */
export function getCanonicalKey(moduleType) {
  if (!moduleType) return '';
  const typeStr = String(moduleType);
  return typeStr.includes('-')
    ? typeStr.split('-')[0].toUpperCase()
    : typeStr.toUpperCase();
}

/**
 * Create a registry key from module type and identifier
 */
export function createRegistrationKey(moduleType, staticIdentifier) {
  if (!moduleType || !staticIdentifier) return '';
  return `${getCanonicalKey(moduleType)}-${staticIdentifier}`;
}

/**
 * Merge module types into one array
 */
export function mergeModuleData(modules) {
  if (!modules || typeof modules !== 'object') return [];

  const result = [];
  Object.values(MODULE_TYPES).forEach(type => {
    if (Array.isArray(modules[type])) {
      result.push(...modules[type]);
    }
  });

  return result;
}

/**
 * Validate a single module entry
 */
export function validateModuleData(module) {
  return module &&
         typeof module === 'object' &&
         typeof module.module === 'string' &&
         (typeof module.staticIdentifier === 'string' || typeof module.paneComponent === 'string');
}

/**
 * Validate a full module collection
 */
export function validateModulesCollection(modules) {
  if (!modules || typeof modules !== 'object') return false;

  for (const type of Object.values(MODULE_TYPES)) {
    if (!Array.isArray(modules[type])) return false;
    for (const module of modules[type]) {
      if (!validateModuleData(module)) return false;
    }
  }

  return true;
}
