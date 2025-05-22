// session-api.js
// Functions for interacting with backend session APIs

import { validateSessionData } from './session-shared';
import { API_ENDPOINTS } from './session-constants';

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
    console.error(`[session-api] ${context}:`, err);
    throw err;
  }
}

export async function fetchSessionData() {
  const data = await safeFetch(API_ENDPOINTS.SESSION_DATA, {}, 'Failed to fetch session data');
  validateSessionData(data);
  return data;
}

export async function updateSessionGrid(layouts) {
  return await safeFetch(API_ENDPOINTS.SESSION_GRID, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(layouts),
  }, 'Failed to update session grid');
}

export async function updateSessionModules(modules) {
  return await safeFetch(API_ENDPOINTS.SESSION_MODULES, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(modules),
  }, 'Failed to update session modules');
}

/**
 * Get state for a specific pane
 */
export async function getPaneState(paneId) {
  return await safeFetch(`${API_ENDPOINTS.SESSION_DATA}/pane/${paneId}`, {}, 
    `Failed to fetch pane state for ${paneId}`);
}

/**
 * Update state for a specific pane
 */
export async function updatePaneState(paneId, state) {
  return await safeFetch(`${API_ENDPOINTS.SESSION_DATA}/pane/${paneId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(state),
  }, `Failed to update pane state for ${paneId}`);
}

/**
 * Delete state for a specific pane
 * 
 * Uses the DELETE /session/pane/{pane_id} endpoint to completely remove
 * the pane state from the backend.
 */
export async function deletePaneState(paneId) {
  return await safeFetch(`${API_ENDPOINTS.SESSION_DATA}/pane/${paneId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  }, `Failed to delete pane state for ${paneId}`);
}


export async function removeModule(moduleId) {
  return await safeFetch(`${API_ENDPOINTS.SESSION_MODULES}/${moduleId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  }, `Failed to remove module ${moduleId}`);
}
