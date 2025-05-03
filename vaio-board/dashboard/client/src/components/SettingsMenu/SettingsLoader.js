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
    
    // Validate session data
    if (!sessionData) {
      throw new Error('Empty session data received');
    }
    
    // Update grid layout if available
    if (sessionData.grid_layout && Object.keys(sessionData.grid_layout).length > 0) {
      setGridLayout(sessionData.grid_layout);
    } else {
      console.warn('SettingsLoader: No grid layout found in session data');
      // Could initialize with empty layout if needed
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
      
      // Try to save these default modules to the session
      try {
        const saveRes = await fetch('/api/user/session/modules', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(defaultActiveModules)
        });
        
        if (saveRes.ok) {
          console.log('SettingsLoader: Default modules saved to session');
        } else {
          console.warn('SettingsLoader: Failed to save default modules to session:', saveRes.status);
        }
      } catch (saveErr) {
        console.error('SettingsLoader: Error saving default modules to session:', saveErr);
      }
    }
    
    return true;
  } catch (err) {
    console.error('SettingsLoader: Failed to load settings from session', err);
    
    // Show error in notification system if available
    if (window.errorSystem && typeof window.errorSystem.showError === 'function') {
      window.errorSystem.showError(
        `Failed to load settings: ${err.message}`, 
        'error',
        10000
      );
    }
    
    // Initialize with empty/default values
    const defaultActiveModules = ['supervisor', 'nvidia'];
    setActiveModules(defaultActiveModules);
    
    return false;
  }
}
