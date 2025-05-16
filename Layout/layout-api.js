// layout-api.js
// Functions for interacting with backend layout APIs

import { API_ENDPOINTS } from './layout-constants';
import { validateLayout, transformLayout } from './layout-shared';

function handleFetchError(response, context) {
  if (!response.ok) {
    throw new Error(`${context}: ${response.status} ${response.statusText}`);
  }
}

async function safeFetch(url, options = {}, context = 'API request failed') {
  try {
    const response = await fetch(url, options);
    handleFetchError(response, context);
    return await response.json();
  } catch (err) {
    console.error(`[layout-api] ${context}:`, err);
    throw err;
  }
}

/**
 * Load full session layout + active modules
 */
export async function fetchSessionData() {
  return await safeFetch(API_ENDPOINTS.SESSION_DATA, {}, 'Failed to fetch session data');
}

/**
 * Save layout structure to backend
 */
export async function updateSessionGrid(layouts) {
  if (!validateLayout(layouts)) {
    throw new Error('Invalid layouts structure provided to updateSessionGrid');
  }

  const transformed = transformLayout(layouts);
  return await safeFetch(API_ENDPOINTS.SESSION_GRID, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(transformed),
  }, 'Failed to update session grid');
}

/**
 * Save active module list to backend
 */
export async function updateSessionModules(modules) {
  if (!Array.isArray(modules)) {
    throw new Error('Invalid modules array provided to updateSessionModules');
  }

  return await safeFetch(API_ENDPOINTS.SESSION_MODULES, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(modules),
  }, 'Failed to update session modules');
}

/**
 * Save a layout template to the backend
 */
export async function saveLayoutTemplate(name, layout, modules) {
  return await safeFetch(API_ENDPOINTS.TEMPLATES, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, layout, modules }),
  }, 'Failed to save layout template');
}

/**
 * Get all available layout templates
 */
export async function getLayoutTemplates() {
  return await safeFetch(API_ENDPOINTS.TEMPLATES, {}, 'Failed to fetch layout templates');
}

/**
 * Apply a layout template by ID
 */
export async function applyLayoutTemplate(templateId) {
  return await safeFetch(`${API_ENDPOINTS.TEMPLATES}/${templateId}/apply`, {
    method: 'POST',
  }, 'Failed to apply layout template');
}
