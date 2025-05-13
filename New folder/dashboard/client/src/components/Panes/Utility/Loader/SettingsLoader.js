// [SL-001] SettingsLoader - Loads and processes user session settings
// File: SettingsLoader.js
// Simply loads session data from backend and provides it to SettingsContext

import { errorHandler } from '../../../Error-Handling/utils/errorHandler';
import { ErrorType, ErrorSeverity } from '../../../Error-Handling/Diagnostics/types/errorTypes';

// [SL-002] API Endpoints - Backend API urls for data access
// API endpoints
const ENDPOINTS = {
  SESSION: '/api/user/session'
};

// [SL-003] Session Data Loader - Main function to fetch and apply session data
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
    // [SL-004] Session API Call - Fetches complete user session from backend
    // Load session data
    const sessionRes = await fetch(ENDPOINTS.SESSION, { credentials: 'include' });

    if (!sessionRes.ok) {
      throw new Error(`Failed to load session: HTTP ${sessionRes.status}`);
    }

    const sessionData = await sessionRes.json();

    if (!sessionData) {
      throw new Error('Empty session data received');
    }

    // [SL-005] Data Extraction - Pulls layout and module data from response
    // Extract session data fields - direct from server
    const { grid_layout, active_modules } = sessionData;

    // [SL-006] Grid Layout Update - Updates UI state with layout data
    // Update grid layout - directly use what the server provides
    if (grid_layout) {
      result.gridLayout = grid_layout;
      setGridLayout(grid_layout);
    }

    // [SL-007] Active Modules Update - Sets which modules are currently displayed
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
    // [SL-008] Error Handling - Reports errors and tries fallbacks
    console.warn('API session load failed, trying localStorage/sessionStorage fallback');
    
    // Try to load from localStorage or sessionStorage as a fallback
    try {
      const STORAGE_KEY = 'vaio_layouts';
      let layouts = null;
      let source = '';
      
      // Try localStorage first
      if (window.localStorage) {
        const localData = localStorage.getItem(STORAGE_KEY);
        if (localData) {
          layouts = JSON.parse(localData);
          source = 'localStorage';
        }
      }
      
      // If not in localStorage, try sessionStorage
      if (!layouts && window.sessionStorage) {
        const sessionData = sessionStorage.getItem(STORAGE_KEY);
        if (sessionData) {
          layouts = JSON.parse(sessionData);
          source = 'sessionStorage';
        }
      }
      
      // If found in either storage, use it
      if (layouts) {
        console.log(`Recovered layout data from ${source}`);
        setGridLayout(layouts);
        result.gridLayout = layouts;
        
        // Still use default modules since we don't store the active modules list in local storage
        const defaultModules = ['SYSTEM-Status-default'];
        setActiveModules(defaultModules);
        result.activeModules = defaultModules;
        
        return result;
      }
    } catch (storageErr) {
      console.error('Failed to load from storage fallback:', storageErr);
    }
    
    // If all fallbacks failed, report the original error and use defaults
    errorHandler.showError(
      `Settings load failure: ${err.message}`,
      ErrorType.SYSTEM,
      ErrorSeverity.HIGH,
      { componentName: 'SettingsLoader', action: 'loadSettingsFromSession' }
    );
    
    // Use minimal defaults when everything fails
    const defaultModules = ['SYSTEM-Status-default'];
    setActiveModules(defaultModules);
    result.activeModules = defaultModules;
    
    return result;
  }
}