// ComponentRegistry.js - Registry for component mapping and lookup

// Module registration data
let logoMap = {};
let moduleData = {
  all: [],
  system: [],
  service: [],
  user: []
};
let sessionData = {};

// Track registry state
let paneMapRef = null;
let paneErrorsRef = null;

// No static registry - all components are loaded dynamically

/**
 * Get the canonical component key for lookups.
 * Extracts the base module type from pane IDs and normalizes to lowercase.
 * 
 * @param {string} key - The module type or identifier
 * @returns {string} - The canonical key for component lookup
 */
export const getCanonicalComponentKey = (key) => {
  if (!key) return '';
  
  // Convert to string in case we got something else
  const typeStr = String(key);
  
  // Extract base module type if this is a pane ID (e.g., "supervisor-abc123" -> "supervisor")
  const baseType = typeStr.includes('-') ? typeStr.split('-')[0] : typeStr;
  
  // Return lowercase version for consistent lookup
  return baseType.toLowerCase();
};

/**
 * Get component name based on module key using naming convention
 * @param {string} moduleKey - Module key to look up
 * @returns {string} - Component name to load
 */
export const getComponentName = (moduleKey) => {
  // Simple naming convention - capitalize first letter and add "Pane"
  return `${moduleKey.charAt(0).toUpperCase()}${moduleKey.slice(1)}Pane`;
};

/**
 * Debug method to log the state of all loaded components
 */
export function debugComponentRegistry(paneMap) {
  // Safety check - ensure paneMap is defined
  if (!paneMap) {
    console.warn('❌ debugComponentRegistry called with undefined paneMap');
    return {
      loaded: [],
      missing: [],
      missingComponents: [],
      total: 0
    };
  }
  
  console.group('🔍 Component Registry Debug');
  
  // Log all loaded components
  Object.entries(paneMap).forEach(([key, component]) => {
    console.log(
      `${component ? '✅' : '❌'} ${key}: ${component ? 'Loaded' : 'Missing'}`
    );
  });
  
  console.groupEnd();
  
  const loaded = Object.keys(paneMap).filter(k => !!paneMap[k]);
  const missing = Object.keys(paneMap).filter(k => !paneMap[k]);
  
  return {
    loaded,
    missing,
    missingComponents: missing, // Add for backward compatibility
    total: Object.keys(paneMap).length
  };
}

/**
 * Simple component loading status diagnostic
 */
export function diagnoseComponentRegistration(paneMap) {
  // Safety check - ensure paneMap is defined
  if (!paneMap) {
    console.warn('❌ diagnoseComponentRegistration called with undefined paneMap');
    return {
      totalComponents: 0,
      loadedComponents: [],
      nullComponents: [],
      availableComponents: [],
      missingComponents: [],
      timestamp: new Date().toISOString()
    };
  }
  
  // Just report on loaded components
  const loadedComponents = Object.keys(paneMap).filter(k => !!paneMap[k]);
  const nullComponents = Object.keys(paneMap).filter(k => paneMap[k] === null);
  
  // Create diagnosis report
  const diagnosis = {
    totalComponents: Object.keys(paneMap).length,
    loadedComponents,
    nullComponents,
    // Add for backward compatibility with existing code
    availableComponents: loadedComponents,
    missingComponents: nullComponents,
    timestamp: new Date().toISOString()
  };
  
  // Log results
  console.group('Component Loading Status');
  console.log(`Loaded Components (${loadedComponents.length}):`, loadedComponents.join(', '));
  if (nullComponents.length > 0) {
    console.log(`Failed to Load (${nullComponents.length}):`, nullComponents.join(', '));
  }
  console.groupEnd();
  
  // Return diagnosis for use by other systems
  return diagnosis;
}

/**
 * Force reload a component by module key
 * @param {string} moduleKey - The module key to reload
 * @param {Object|null} paneMap - Optional paneMap reference, uses stored reference if not provided
 * @param {Object|null} paneErrors - Optional paneErrors reference, uses stored reference if not provided
 * @returns {Promise<boolean>} - Success status
 */
export async function forceReloadComponent(moduleKey, paneMap = null, paneErrors = null) {
  // Use passed references or stored references
  const targetPaneMap = paneMap || paneMapRef;
  const targetPaneErrors = paneErrors || paneErrorsRef || {};
  
  // Validate inputs
  if (!moduleKey) {
    console.error('❌ Cannot reload component: No module key provided');
    return false;
  }
  
  if (!targetPaneMap) {
    console.error('❌ Cannot reload component: No pane map available');
    return false;
  }
  
  try {
    const canonicalKey = getCanonicalComponentKey(moduleKey);
    console.log(`🔄 Attempting to reload component: ${canonicalKey} (from ${moduleKey})`);
    
    // Create component name using convention
    const componentName = getComponentName(canonicalKey);
    
    // Standard import path
    const importPath = `../Pane/${componentName}.jsx`;
    
    // Remove any cached errors
    if (targetPaneErrors && targetPaneErrors[canonicalKey]) {
      delete targetPaneErrors[canonicalKey];
    }
    
    // Attempt to dynamically import the component
    const module = await import(importPath);
    const Comp = module.default;
    
    if (!Comp) {
      throw new Error(`No default export found for ${componentName}`);
    }
    
    // Update the pane map with the new component
    targetPaneMap[canonicalKey] = Comp;
    
    // Log success message
    console.log(`✅ Successfully reloaded component: ${canonicalKey}`);
    
    // Add success message to UI
    if (window.vaioDebug && window.vaioDebug.success) {
      window.vaioDebug.success(`Reloaded component: ${canonicalKey}`);
    }
    
    return true;
  } catch (err) {
    console.error(`🛑 Failed to reload component ${moduleKey}:`, err);
    
    // Track error if we have error tracking
    if (targetPaneErrors) {
      targetPaneErrors[getCanonicalComponentKey(moduleKey)] = {
        component: getComponentName(moduleKey),
        error: err.message || 'Unknown error',
        timestamp: new Date().toISOString(),
        stack: err.stack
      };
    }
    
    // Add error message to UI
    if (window.vaioDebug && window.vaioDebug.error) {
      window.vaioDebug.error(`Failed to reload ${moduleKey}: ${err.message}`);
    }
    
    return false;
  }
}

/**
 * Register debugging helpers on the window object
 * Only used in development mode
 */
export function registerDebugHelpers(paneMap, paneErrors) {
  // Store references for later use (with safety checks)
  paneMapRef = paneMap || {};
  paneErrorsRef = paneErrors || {};
  
  // Only expose in non-production environments
  if (process.env.NODE_ENV === 'production') return;
  
  // Return a copy of the map with additional information about component validity
  window.getPaneMap = () => {
    const enhancedMap = {};
    const safeErrorMap = paneErrorsRef || paneErrors || {};
    const safePaneMap = paneMapRef || paneMap || {};
    
    Object.entries(safePaneMap).forEach(([key, comp]) => {
      enhancedMap[key] = {
        component: comp,
        componentName: comp?.displayName || comp?.name || 'Unknown',
        type: typeof comp,
        isValid: typeof comp === 'function',
        isNull: comp === null,
        // We use lowercase key directly instead of calling getCanonicalComponentKey
        canonicalKey: key.toLowerCase(),
        // Add details from error tracking if available
        ...(safeErrorMap[key] ? { error: safeErrorMap[key] } : {})
      };
    });
    
      // No special treatment for any components
    
    return enhancedMap;
  };
  
  // Find any pane components that failed to load or aren't valid React components
  window.getPaneMapErrors = () => {
    const safeErrorMap = paneErrorsRef || paneErrors || {};
    const safePaneMap = paneMapRef || paneMap || {};
    return Object.entries(safePaneMap)
      .filter(([_, Comp]) => Comp === null || typeof Comp !== 'function')
      .map(([key]) => ({
        key,
        error: safeErrorMap[key] || { error: 'Unknown error' }
      }));
  };
  
  // Expose detailed error information
  window.getPaneErrors = () => {
    const safeErrorMap = paneErrorsRef || paneErrors || {};
    return { ...safeErrorMap };
  };
  
  // Expose moduleData for the DebugOverlay
  window.getModuleData = () => {
    return moduleData;
  };
  
  // Make the raw paneMap directly accessible for the debug tools
  // Use a getter to ensure we always have the latest reference
  Object.defineProperty(window, 'rawPaneMap', {
    get: () => paneMapRef || paneMap || {}
  });
  
  // Add direct helper to check if a component has errors
  window.hasComponentError = (key) => {
    const safeErrorMap = paneErrorsRef || paneErrors || {};
    return !!safeErrorMap[key];
  };
  
  // Add utility to clear all pane errors (for testing/debugging)
  window.clearPaneErrors = () => {
    const safeErrorMap = paneErrorsRef || paneErrors;
    if (safeErrorMap) {
      Object.keys(safeErrorMap).forEach(key => delete safeErrorMap[key]);
      console.log('Cleared all pane errors');
      return true;
    }
    console.warn('No pane errors map available to clear');
    return false;
  };
  
  // Add the debug component registry function to window for easy access
  window.debugComponentRegistry = () => {
    try {
      // Ensure we have a valid paneMap to work with
      const safePaneMap = paneMapRef || paneMap || {}; 
      return debugComponentRegistry(safePaneMap);
    } catch (err) {
      console.error('Error in debugComponentRegistry:', err);
      return {loaded: [], missing: [], missingComponents: [], total: 0};
    }
  };
  
  // Add key utility functions for debugging
  window.getCanonicalComponentKey = (key) => {
    try {
      return getCanonicalComponentKey(key);
    } catch (err) {
      console.error('Error in getCanonicalComponentKey:', err);
      return String(key || '').toLowerCase();
    }
  };
  
  // Set up componentRegistry on window.vaioDebug for the forceReload functionality
  // This is referenced in ServiceGrid.jsx
  if (window.vaioDebug) {
    window.vaioDebug.componentRegistry = {
      // Function to force reload a component with error handling
      forceReload: (moduleKey) => {
        try {
          const safePaneMap = paneMapRef || paneMap || {};
          const safeErrorMap = paneErrorsRef || paneErrors || {};
          return forceReloadComponent(moduleKey, safePaneMap, safeErrorMap);
        } catch(err) {
          console.error('Error in forceReloadComponent:', err);
          return Promise.resolve(false);
        }
      },
      // Return component diagnosis with error handling
      getDiagnosis: () => {
        try {
          const safePaneMap = paneMapRef || paneMap || {};
          return diagnoseComponentRegistration(safePaneMap);
        } catch(err) {
          console.error('Error in diagnoseComponentRegistration:', err);
          return {totalComponents: 0, loadedComponents: [], nullComponents: [], missingComponents: []};
        }
      },
      // Get debug data about component registry with error handling
      getDebugData: () => {
        try {
          const safePaneMap = paneMapRef || paneMap || {};
          const safeErrorMap = paneErrorsRef || paneErrors || {};
          return {
            componentCount: Object.keys(safePaneMap || {}).length,
            loadedCount: Object.keys(safePaneMap || {}).filter(k => !!safePaneMap[k]).length,
            errorCount: Object.keys(safeErrorMap || {}).length,
            moduleTypes: Object.keys(safePaneMap),
            hasErrors: Object.keys(safeErrorMap).length > 0
          };
        } catch(err) {
          console.error('Error in getDebugData:', err);
          return {
            componentCount: 0,
            loadedCount: 0,
            errorCount: 0,
            moduleTypes: [],
            hasErrors: false
          };
        }
      }
    };
  }
}

// Data accessors
export const getModuleData = () => moduleData;
export const getLogoMap = () => logoMap;
export const getSessionData = () => sessionData;

// No special loading for any components

// Export module data setters
export const setModuleData = (data) => {
  if (!data) return;
  
  if (data.system) moduleData.system = data.system;
  if (data.service) moduleData.service = data.service;
  if (data.user) moduleData.user = data.user;
  
  // Update the combined list
  moduleData.all = [
    ...(moduleData.system || []), 
    ...(moduleData.service || []), 
    ...(moduleData.user || [])
  ];
  
  console.log('Module data updated:', {
    system: moduleData.system?.length || 0,
    service: moduleData.service?.length || 0,
    user: moduleData.user?.length || 0,
    all: moduleData.all.length
  });
};

export const setLogoMap = (map) => {
  logoMap = map || {};
};

export const setSessionData = (data) => {
  sessionData = data || {};
};