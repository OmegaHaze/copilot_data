/**
 * module-shared.js
 * Shared utilities for the module system
 */

import { MODULE_TYPES } from './module-constants';

/**
 * Normalize a module type string
 * @param {string} moduleType - Module type to normalize
 * @returns {string} Normalized module type
 */
export function getCanonicalKey(moduleType) {
  if (!moduleType) return '';
  const typeStr = String(moduleType);
  return typeStr.includes('-')
    ? typeStr.split('-')[0].toUpperCase()
    : typeStr.toUpperCase();
}

/**
 * Create a pane ID from parts
 * @param {string} moduleType - Module type
 * @param {string} staticIdentifier - Static identifier
 * @param {string} instanceId - Instance ID
 * @returns {string} Pane ID
 */
export function createPaneId(moduleType, staticIdentifier, instanceId = null) {
  if (!moduleType || !staticIdentifier) return null;
  
  return instanceId
    ? `${moduleType}-${staticIdentifier}-${instanceId}`
    : `${moduleType}-${staticIdentifier}`;
}

/**
 * Generate a unique instance ID
 * @param {string} prefix - Optional prefix (ignored, kept for compatibility)
 * @returns {string} Simple, short alphanumeric ID (4 chars)
 */
export function getInstanceId(prefix = '') {
  // Generate a simple 4-character random alphanumeric string
  return Math.random().toString(36).substring(2, 6);
}

/**
 * Merge module items
 * @param {Array} existingItems - Existing items
 * @param {Array} newItems - New items
 * @returns {Array} Merged items
 */
export function mergeModuleItems(existingItems = [], newItems = []) {
  if (!Array.isArray(existingItems)) existingItems = [];
  if (!Array.isArray(newItems)) return [...existingItems];
  
  const merged = [...existingItems];
  const existingKeys = new Set(existingItems.map(item => item.staticIdentifier));
  
  for (const item of newItems) {
    if (!item.staticIdentifier) continue;
    if (!existingKeys.has(item.staticIdentifier)) {
      merged.push(item);
    }
  }
  
  return merged;
}

/**
 * Validate a single module entry
 * @param {Object} module - Module to validate
 * @returns {boolean} True if valid
 */
export function validateModule(module) {
  return module &&
         typeof module === 'object' &&
         typeof module.module === 'string' &&
         (typeof module.staticIdentifier === 'string' || typeof module.paneComponent === 'string');
}

/**
 * Validate a full module collection
 * @param {Object} modules - Module collection
 * @returns {boolean} True if valid
 */
export function validateModules(modules) {
  if (!modules || typeof modules !== 'object') return false;

  for (const type of Object.values(MODULE_TYPES)) {
    if (!Array.isArray(modules[type])) return false;
    for (const module of modules[type]) {
      if (!validateModule(module)) return false;
    }
  }

  return true;
}