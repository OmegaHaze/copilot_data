// File: SettingsLoader.js
// Helper to initialize Settings context data from backend

/**
 * Loads settings data from the backend session
 * and initializes the SettingsContext with it
 */
export async function loadSettingsFromSession(setGridLayout, setActiveModules) {
  try {
    // Fetch session data from backend
    const sessionRes = await fetch('/api/user/session', {
      credentials: 'include'
    });
    
    if (!sessionRes.ok) {
      throw new Error(`Failed to load session: ${sessionRes.status}`);
    }
    
    const sessionData = await sessionRes.json();
    console.log('SettingsLoader: Loaded session data', { 
      gridLayout: sessionData.grid_layout ? Object.keys(sessionData.grid_layout) : 'empty',
      activeModules: sessionData.active_modules || []
    });
    
    // Update grid layout if available
    if (sessionData.grid_layout && Object.keys(sessionData.grid_layout).length > 0) {
      setGridLayout(sessionData.grid_layout);
    }
    
    // Update active modules if available
    if (sessionData.active_modules && Array.isArray(sessionData.active_modules)) {
      setActiveModules(sessionData.active_modules);
    } else {
      // Fallback to default modules list if none in session
      // Including supervisor and nvidia as essential modules
      const defaultActiveModules = ['supervisor', 'nvidia'];
      setActiveModules(defaultActiveModules);
      console.log('SettingsLoader: Using default active modules', defaultActiveModules);
    }
    
    return true;
  } catch (err) {
    console.error('SettingsLoader: Failed to load settings from session', err);
    return false;
  }
}
