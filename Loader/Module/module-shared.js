// module-shared.js
// Stateless helpers reused across the module system

import { MODULE_TYPES } from './module-constants';

/**
 * Get canonical key from module identifier
 */
export function getCanonicalKey(moduleKey) {
  if (!moduleKey) return '';
  const str = String(moduleKey);
  return str.includes('-') ? str.split('-')[0].toUpperCase() : str.toUpperCase();
}

/**
 * Create a pane ID from module type, static identifier, and instance ID
 */
export function createPaneId(moduleType, staticIdentifier, instanceId) {
  return moduleType && staticIdentifier && instanceId ? `${moduleType}-${staticIdentifier}-${instanceId}` : '';
}

/**
 * Extract instance ID from a pane ID
 */
export function getInstanceId(paneId) {
  if (!paneId || !paneId.includes('-')) return null;
  const parts = paneId.split('-');
  return parts.length > 1 ? parts[parts.length - 1] : null;
}

/**
 * Merge SYSTEM, SERVICE, and USER module arrays into one
 */
export function mergeModuleItems(modules) {
  if (!modules) return [];
  return [
    ...(Array.isArray(modules.SYSTEM) ? modules.SYSTEM : []),
    ...(Array.isArray(modules.SERVICE) ? modules.SERVICE : []),
    ...(Array.isArray(modules.USER) ? modules.USER : [])
  ].filter(Boolean);
}

/**
 * Validate individual module item
 */
export function validateModule(module) {
  return typeof module === 'object' && (module.name || module.module);
}

/**
 * Validate module array
 */
export function validateModules(modules) {
  return Array.isArray(modules) && modules.every(validateModule);
}
