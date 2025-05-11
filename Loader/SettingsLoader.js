// File: SettingsLoader.js
// Loads layouts + module state from backend and initializes SettingsContext

import { errorHandler } from '../../../Error-Handling/utils/errorHandler';
import { ErrorType, ErrorSeverity } from '../../../Error-Handling/Diagnostics/types/errorTypes';

export async function loadSettingsFromSession(setGridLayout, setActiveModules) {
  console.log('SettingsLoader: Loading settings from session');
  
  let result = {
    activeModules: [],
    gridLayout: null,
    success: false
  };
  
  try {
    // First, try to fetch available modules
    let availableModules = [];
    
    try {
      // Try loading modules from different API endpoints
      let modulesRes = null;
      let endpointUsed = '';
      
      console.log('SettingsLoader: Attempting to fetch modules...');
      
      // Try first endpoint
      try {
        modulesRes = await fetch('/api/modules', { credentials: 'include' });
        endpointUsed = '/api/modules';
        console.log(`SettingsLoader: First endpoint response ${modulesRes.status}`);
      } catch (e) {
        console.warn('SettingsLoader: Error fetching from /api/modules:', e);
        modulesRes = null;
      }
      
      // If first failed, try alternate endpoint
      if (!modulesRes || !modulesRes.ok) {
        try {
          console.log('SettingsLoader: First modules endpoint failed, trying registry endpoint');
          modulesRes = await fetch('/api/module/registry', { credentials: 'include' });
          endpointUsed = '/api/module/registry';
          console.log(`SettingsLoader: Second endpoint response ${modulesRes.status}`);
        } catch (e) {
          console.warn('SettingsLoader: Error fetching from /api/module/registry:', e);
          modulesRes = null;
        }
      }
      
      // Process response if any of the attempts succeeded
      if (modulesRes && modulesRes.ok) {
        const modulesData = await modulesRes.json();
        if (Array.isArray(modulesData)) {
          availableModules = modulesData;
          console.log(`Loaded ${modulesData.length} modules from API (${endpointUsed})`);
          
          // Log the first few items to help debugging
          if (modulesData.length > 0) {
            console.log('Sample module:', modulesData[0]);
          }
        } else {
          console.warn('API returned non-array modules data:', modulesData);
        }
      } else {
        console.error('Failed to load modules from all API endpoints');
        
        // Trigger debug overlay by dispatching an event
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('vaio:toggle-debug-overlay', { 
            detail: { forced: true } 
          }));
        }
      }
    } catch (moduleErr) {
      console.warn('Failed to load modules list:', moduleErr);
      // Continue with session loading despite module loading failure
    }
    
    // Now fetch session data
    const sessionRes = await fetch('/api/user/session', { credentials: 'include' });

    if (!sessionRes.ok) {
      throw new Error(`Failed to load session: HTTP ${sessionRes.status}`);
    }

    const sessionData = await sessionRes.json();

    if (!sessionData || typeof sessionData !== 'object') {
      throw new Error('Empty or invalid session data received');
    }

    // Extract the data fields (note: grid_layout contains multiple layouts despite the singular name)
    const { grid_layout, active_modules } = sessionData;

    // Process layout data - directly use what's provided by the API
    // Store the layout in our result
    result.gridLayout = grid_layout;
    
    // Pass it directly to the state setter
    setGridLayout(grid_layout);

    // Load active modules
    if (Array.isArray(active_modules)) {
      console.log(`SettingsLoader: Found ${active_modules.length} active modules:`, active_modules);
      setActiveModules(active_modules);
      result.activeModules = active_modules;
    } else {
      console.error('SettingsLoader: No active_modules array in session');
      errorHandler.showError(
        'No active_modules array in session; leaving module state empty',
        ErrorType.SYSTEM,
        ErrorSeverity.LOW,
        {
          componentName: 'SettingsLoader',
          action: 'loadSettingsFromSession',
          location: 'Active Modules Processing',
          metadata: {
            availableKeys: sessionData ? Object.keys(sessionData) : []
          }
        }
      );

      // Use default if no active modules found
      const defaultModules = ['status', 'system'];
      console.log(`SettingsLoader: Using default modules: ${defaultModules.join(', ')}`);
      setActiveModules(defaultModules);
      result.activeModules = defaultModules;
    }
    
    // We've already set result.gridLayout above
    result.success = true;
    return result;
  } catch (err) {
    // Log the error
    console.error('Settings load failure:', err);
    
    // Report the error
    errorHandler.showError(
      `Settings load failure: ${err.message}`,
      ErrorType.SYSTEM,
      ErrorSeverity.HIGH,
      {
        componentName: 'SettingsLoader',
        action: 'loadSettingsFromSession',
        location: 'API Request',
        metadata: {
          endpoint: '/api/user/session',
          errorStack: err.stack,
          timestamp: new Date().toISOString()
        }
      }
    );
    
    setGridLayout(result.gridLayout);
    setActiveModules(result.activeModules);
    
    result.success = false;
    return result;
  }
}
