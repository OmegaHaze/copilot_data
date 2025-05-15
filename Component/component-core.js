/**
 * component-core.js
 * Core component primitives and utilities
 */

import { MODULE_TYPES, VALIDATION } from './component-constants';
import React from 'react';

/**
 * Validate a pane ID format
 * @param {string} paneId - ID to validate 
 * @returns {boolean} - Whether ID is valid
 */
export function isValidPaneId(paneId) {
  if (typeof paneId !== 'string' || !paneId.includes('-')) {
    return false;
  }
  
  const parts = paneId.split('-');
  return parts.length >= VALIDATION.MIN_PANEID_PARTS && 
         parts[0].length > 0 && 
         parts[1].length > 0;
}

/**
 * Parse paneId into component parts
 * @param {string} paneId - ID to parse
 * @returns {Object|null} - Parsed components or null if invalid
 */
export function parsePaneId(paneId) {
  if (!isValidPaneId(paneId)) {
    return null;
  }

  const parts = paneId.split('-');
  return {
    moduleType: parts[0],
    staticIdentifier: parts[1],
    instanceId: parts.length > 2 ? parts[2] : null,
    fullId: paneId
  };
}

/**
 * Get canonical key for module type
 * @param {string} moduleType - Module type to normalize
 * @returns {string} - Normalized module type
 */
export function getCanonicalKey(moduleType) {
  if (!moduleType) return '';
  
  const typeStr = String(moduleType);
  return typeStr.includes('-') 
    ? typeStr.split('-')[0].toUpperCase() 
    : typeStr.toUpperCase();
}

/**
 * Create a component placeholder for errors/loading
 * @param {string} paneId - ID for the placeholder
 * @param {string} message - Message to display
 * @returns {JSX.Element} - Placeholder component
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
 * Merge module data into a single array
 * @param {Object} modules - Module data by type
 * @returns {Array} - Combined array of all modules
 */
export function mergeModuleData(modules) {
  if (!modules || typeof modules !== 'object') {
    return [];
  }
  
  const result = [];
  
  Object.values(MODULE_TYPES).forEach(type => {
    if (Array.isArray(modules[type])) {
      result.push(...modules[type]);
    }
  });
  
  return result;
}

/**
 * Create registration key for components
 * @param {string} moduleType - Module type
 * @param {string} staticIdentifier - Static identifier
 * @returns {string} - Registration key
 */
export function createRegistrationKey(moduleType, staticIdentifier) {
  if (!moduleType || !staticIdentifier) {
    return '';
  }
  
  return `${getCanonicalKey(moduleType)}-${staticIdentifier}`;
}