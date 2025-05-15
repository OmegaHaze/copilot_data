/**
 * api.js
 * Functions for interacting with backend layout APIs
 */

import { API_ENDPOINTS } from './layout-constants';
import { validateLayout, transformLayout } from './layout-core';

/**
 * Fetches session data from the backend API
 * @returns {Promise<Object>} Session data
 * @throws {Error} If API call fails
 */
export async function fetchSessionData() {
  const response = await fetch(API_ENDPOINTS.SESSION_DATA);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch session data: ${response.status} ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * Updates grid layout in the backend session
 * @param {Object} layouts - Layouts to save
 * @returns {Promise<Object>} API response
 * @throws {Error} If API call fails
 */
export async function updateSessionGrid(layouts) {
  if (!validateLayout(layouts)) {
    throw new Error('Invalid layouts structure provided to updateSessionGrid');
  }
  
  const transformedLayouts = transformLayout(layouts);
  
  const response = await fetch(API_ENDPOINTS.SESSION_GRID, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(transformedLayouts),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to update session grid: ${response.status} ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * Updates active modules in the backend session
 * @param {Array} modules - Active module IDs
 * @returns {Promise<Object>} API response
 * @throws {Error} If API call fails
 */
export async function updateSessionModules(modules) {
  if (!Array.isArray(modules)) {
    throw new Error('Invalid modules array provided to updateSessionModules');
  }
  
  const response = await fetch(API_ENDPOINTS.SESSION_MODULES, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(modules),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to update session modules: ${response.status} ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * Saves current layout as a named template
 * @param {string} name - Template name
 * @param {Object} layouts - Layouts to save
 * @param {Array} modules - Active module IDs
 * @returns {Promise<Object>} API response with saved layout
 * @throws {Error} If API call fails
 */
export async function saveLayoutTemplate(name, layouts, modules) {
  if (!name || typeof name !== 'string') {
    throw new Error('Layout template name is required');
  }
  
  if (!validateLayout(layouts)) {
    throw new Error('Invalid layouts structure provided to saveLayoutTemplate');
  }
  
  if (!Array.isArray(modules)) {
    throw new Error('Invalid modules array provided to saveLayoutTemplate');
  }
  
  const transformedLayouts = transformLayout(layouts);
  
  const response = await fetch(API_ENDPOINTS.LAYOUTS, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name,
      grid: transformedLayouts,
      modules
    }),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to save layout template: ${response.status} ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * Fetches all saved layout templates
 * @returns {Promise<Array>} List of layout templates
 * @throws {Error} If API call fails
 */
export async function getLayoutTemplates() {
  const response = await fetch(API_ENDPOINTS.LAYOUTS);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch layout templates: ${response.status} ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * Fetches a specific layout template by ID
 * @param {number} id - Template ID
 * @returns {Promise<Object>} Layout template
 * @throws {Error} If API call fails
 */
export async function getLayoutTemplate(id) {
  const response = await fetch(`${API_ENDPOINTS.LAYOUTS}/${id}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch layout template: ${response.status} ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * Applies a layout template to the current session
 * @param {number} id - Template ID to apply
 * @returns {Promise<Object>} API response
 * @throws {Error} If API call fails
 */
export async function applyLayoutTemplate(id) {
  const response = await fetch(`${API_ENDPOINTS.LAYOUTS}/${id}/apply`, {
    method: 'POST',
  });
  
  if (!response.ok) {
    throw new Error(`Failed to apply layout template: ${response.status} ${response.statusText}`);
  }
  
  return await response.json();
}
