/**
 * SessionManager.js
 * Responsible for managing session state and synchronization
 */

import { loadSettingsFromSession } from './SettingsLoader.js';

/**
 * Fetch and synchronize session data
 * @param {Function} setGridLayout - Grid layout setter
 * @param {Function} setActiveModules - Active modules setter
 * @param {Function} setSessionData - Session data setter
 * @param {string} reason - Reason for refresh
 */
export async function fetchAndSyncSessionData(setGridLayout, setActiveModules, setSessionData, reason = 'default') {
  try {
    // Load initial settings
    const success = await loadSettingsFromSession(setGridLayout, setActiveModules);
    
    if (success) {
      const res = await fetch('/api/user/session', {
        credentials: 'include'
      });
      
      if (!res.ok) {
        throw new Error(`Failed to load session: ${res.status}`);
      }
      
      const data = await res.json();
      setSessionData(data);
      
      return data;
    }
  } catch (err) {
    console.error('Session sync failed:', err);
    throw err;
  }
}

/**
 * Refresh session data with logging
 * @param {Function} setSessionData - Session data setter
 * @param {Function} setActiveModules - Active modules setter
 * @param {Function} setGridLayout - Grid layout setter
 * @param {Function} setLayouts - Layouts setter
 * @param {Object} componentRegistry - Component registry instance
 * @param {string} reason - Reason for refresh
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
    const res = await fetch('/api/user/session', {
      credentials: 'include'
    });
    
    if (!res.ok) {
      throw new Error(`Failed to load session: ${res.status}`);
    }
    
    const data = await res.json();
    console.log('Session data refreshed', {
      reason,
      hasGridLayouts: !!data.grid_layout,
      activeModules: data.active_modules?.length || 0
    });
    
    setSessionData(data);
    componentRegistry.synchronizeWithSessionData(data);
    
    if (data.active_modules && Array.isArray(data.active_modules)) {
      setActiveModules(data.active_modules);
    }
    
    // grid_layout is the API field name, but it refers to layouts (plural)
    if (data.grid_layout) {
      setGridLayout(data.grid_layout);
      setLayouts(data.grid_layout);
    }

    return data;
  } catch (err) {
    console.error('Failed to refresh session:', err);
    throw err;
  }
}

/**
 * Reset session and layouts data
 */
export async function resetSessionData() {
  try {
    // Clear local storage
    localStorage.removeItem('vaio_layouts');
    
    // Clear session data
    await Promise.all([
      fetch('/api/user/session/grid', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      }),
      fetch('/api/user/session/modules', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify([])
      })
    ]);
    
    // Reload page to apply changes(we shouldnt have to reload the page. i want hot loading and unloading.)
    window.location.reload();
  } catch (err) {
    console.error('Failed to reset session:', err);
    throw err;
  }
}

/**
 * Update active modules in session
 * @param {Array} modules - Updated list of active modules 
 */
export async function updateModulesSession(modules) {
  try {
    const res = await fetch("/api/user/session/modules", {
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
    throw err;
  }
}
