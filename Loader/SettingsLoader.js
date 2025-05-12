// File: SettingsLoader.js
// Simply loads session data from backend and provides it to SettingsContext

import { errorHandler } from '../../../Error-Handling/utils/errorHandler';
import { ErrorType, ErrorSeverity } from '../../../Error-Handling/Diagnostics/types/errorTypes';

// API endpoints
const ENDPOINTS = {
  SESSION: '/api/user/session'
};

/**
 * Load settings from session API
 * @param {Function} setGridLayout - Grid layout setter
 * @param {Function} setActiveModules - Active modules setter
 * @returns {Promise<Object>} Result object with loaded settings
 */
export async function loadSettingsFromSession(setGridLayout, setActiveModules) {
  let result = {
    activeModules: [],
    gridLayout: null,
    success: false
  };
  
  try {
    // Load session data
    const sessionRes = await fetch(ENDPOINTS.SESSION, { credentials: 'include' });

    if (!sessionRes.ok) {
      throw new Error(`Failed to load session: HTTP ${sessionRes.status}`);
    }

    const sessionData = await sessionRes.json();

    if (!sessionData) {
      throw new Error('Empty session data received');
    }

    // Extract session data fields - direct from server
    const { grid_layout, active_modules } = sessionData;

    // Update grid layout - directly use what the server provides
    if (grid_layout) {
      result.gridLayout = grid_layout;
      setGridLayout(grid_layout);
    }

    // Set active modules - directly use what the server provides
    if (Array.isArray(active_modules)) {
      setActiveModules(active_modules);
      result.activeModules = active_modules;
    } else {
      // If no active modules, use defaults
      const defaultModules = ['SYSTEM-Status-default'];
      setActiveModules(defaultModules);
      result.activeModules = defaultModules;
    }
    
    result.success = true;
    return result;
  } catch (err) {
    // Report the error and use defaults
    errorHandler.showError(
      `Settings load failure: ${err.message}`,
      ErrorType.SYSTEM,
      ErrorSeverity.HIGH,
      { componentName: 'SettingsLoader', action: 'loadSettingsFromSession' }
    );
    
    // Use minimal defaults on error
    const defaultModules = ['SYSTEM-Status-default'];
    setActiveModules(defaultModules);
    result.activeModules = defaultModules;
    
    return result;
  }
}