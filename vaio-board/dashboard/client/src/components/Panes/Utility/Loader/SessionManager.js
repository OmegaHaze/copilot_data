/**
 * SessionManager.js
 * Responsible for managing session state and synchronization
 */

import { loadSettingsFromSession } from './SettingsLoader.js';

// API endpoints
const ENDPOINTS = {
  SESSION: '/api/user/session',
  GRID: '/api/user/session/grid',
  MODULES: '/api/user/session/modules'
};

/**
 * Fetch and synchronize session data
 * @param {Function} setGridLayout - Grid layout setter
 * @param {Function} setActiveModules - Active modules setter
 * @param {Function} setSessionData - Session data setter
 * @param {string} reason - Reason for refresh
 * @returns {Promise<Object|null>} Session data or null
 */
export async function fetchAndSyncSessionData(setGridLayout, setActiveModules, setSessionData, reason = 'default') {
  try {
    // Load initial settings
    const success = await loadSettingsFromSession(setGridLayout, setActiveModules);
    
    if (success) {
      const res = await fetch(ENDPOINTS.SESSION, {
        credentials: 'include'
      });
      
      if (!res.ok) {
        throw new Error(`Failed to load session: ${res.status}`);
      }
      
      const data = await res.json();
      
      // Only set if we got valid data
      if (data && typeof data === 'object') {
        setSessionData(data);
        return data;
      }
    }
    
    return null;
  } catch (err) {
    console.error('Session sync failed:', err);
    throw err;
  }
}

/**
 * Refresh session data with logging
 * @param {Object} params - Parameters object
 * @param {Function} params.setSessionData - Session data setter
 * @param {Function} params.setActiveModules - Active modules setter
 * @param {Function} params.setGridLayout - Grid layout setter
 * @param {Function} params.setLayouts - Layouts setter
 * @param {Object} params.componentRegistry - Component registry instance
 * @param {string} params.reason - Reason for refresh
 * @returns {Promise<Object|null>} Updated session data or null
 */
export async function refreshSessionData({ 
  setSessionData, 
  setActiveModules, 
  setGridLayout, 
  setLayouts,
  componentRegistry,
  reason = 'default' 
}) {
  try {
    console.log(`Refreshing session data - reason: ${reason}`);
    const res = await fetch(ENDPOINTS.SESSION, {
      credentials: 'include'
    });
    
    if (!res.ok) {
      throw new Error(`Failed to load session: ${res.status}`);
    }
    
    const data = await res.json();
    
    // Validate data before using
    if (!data || typeof data !== 'object') {
      console.error('Invalid session data returned from API');
      return null;
    }
    
    setSessionData(data);
    
    // Synchronize component registry if available
    if (componentRegistry) {
      componentRegistry.synchronizeWithSessionData(data);
    }
    
    // Update active modules if provided
    if (Array.isArray(data.active_modules)) {
      setActiveModules(data.active_modules);
    }
    
    // Update layouts if provided
    if (data.grid_layout && typeof data.grid_layout === 'object') {
      setGridLayout(data.grid_layout);
      
      // Only update layouts state if setter is provided
      if (setLayouts) {
        setLayouts(data.grid_layout);
      }
    }

    return data;
  } catch (err) {
    console.error('Failed to refresh session:', err);
    throw err;
  }
}

/**
 * Reset session and layouts data
 * @returns {Promise<void>}
 */
export async function resetSessionData() {
  try {
    // Clear local storage
    localStorage.removeItem('vaio_layouts');
    
    // Clear session data
    await Promise.all([
      fetch(ENDPOINTS.GRID, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      }),
      fetch(ENDPOINTS.MODULES, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify([])
      })
    ]);
    
    // Reload page to apply changes
    window.location.reload();
  } catch (err) {
    console.error('Failed to reset session:', err);
    throw err;
  }
}

/**
 * Update active modules in session
 * @param {Array} modules - Updated list of active modules 
 * @returns {Promise<Object>} API response
 */
export async function updateModulesSession(modules) {
  try {
    // Validate input
    if (!Array.isArray(modules)) {
      modules = [];
    }
    
    const res = await fetch(ENDPOINTS.MODULES, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(modules)
    });

    if (!res.ok) {
      throw new Error(`Failed to update modules: ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    console.error('Failed to update modules:', err);
    throw err;
  }
}