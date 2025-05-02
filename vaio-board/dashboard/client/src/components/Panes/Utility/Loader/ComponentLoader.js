// ComponentLoader.js - Dynamic component loading system
import { 
  debugComponentRegistry, 
  diagnoseComponentRegistration,
  registerDebugHelpers,
  getModuleData,
  setModuleData, 
  setLogoMap, 
  setSessionData
} from './ComponentRegistry.js';

// Import critical components directly to ensure they're available
import SupervisorPane from '../Pane/SupervisorPane.jsx';

// Module state
let paneMap = {};
let paneErrors = {}; // Track detailed error information for each component
let initialized = false;

/**
 * Load a single component by key and component name
 * @param {string} key - Module key
 * @param {string} componentName - Component file name
 * @returns {Component|null} - React component or null if loading failed
 */
async function loadComponent(key, componentName) {
  try {
    console.log(`🔍 Attempting to load component: ${componentName} for module ${key}`);
    
    // Standard import path - all components should be in the Pane directory
    const importPath = `../Pane/${componentName}.jsx`;
    
    // Dynamic import
    const module = await import(importPath);
    const Comp = module.default;
    
    // Validate component
    if (!Comp) {
      throw new Error(`❌ No default export found for ${componentName}`);
    }
    
    // Check if it's a valid React component (function or class)
    const isValidReactComponent = 
      typeof Comp === 'function' &&
      (Comp.prototype?.isReactComponent || // Class component
       !Comp.prototype || // Function component might not have a prototype
       Object.keys(Comp.prototype || {}).length === 0); // Or empty prototype
    
    if (!isValidReactComponent) {
      throw new Error(`❌ Export is not a valid React component (got ${typeof Comp})`);
    }
    
    console.log(`✅ Successfully loaded component for module ${key}`);
    return Comp;
  } catch (err) {
    console.error(`🛑 Failed to load component: ${componentName} for ${key}`, err);
    
    // Track error details
    paneErrors[key] = {
      component: componentName,
      error: err.message || 'Unknown error',
      timestamp: new Date().toISOString(),
      // Track stack trace in development
      ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {})
    };
    
    // Show error in notification system if available
    if (window.errorSystem && typeof window.errorSystem.showError === 'function') {
      window.errorSystem.showError(
        `Failed to load component: ${componentName} for ${key} - ${err.message}`, 
        'error',
        10000
      );
    }
    
    return null;
  }
}

/**
 * Initialize component loader - fetch modules and dynamically load components
 * @returns {Object} Object containing loaded components, logos, and module data
 */
export async function initComponentLoader() {
  // Return cached data if already initialized
  if (initialized) {
    console.log('🔄 Component loader already initialized, returning cached data');
    return { 
      paneMap, 
      paneErrors,
      moduleData: getModuleData() // Include moduleData in the return value
    };
  }

  try {
    console.log('⏳ Initializing component loader...');
    
    // Register the essential SupervisorPane component directly
    paneMap['supervisor'] = SupervisorPane;
    console.log('✅ Supervisor component registered directly');
    
    // Fetch all module data in parallel
    const [systemRes, serviceRes, userRes, sessionRes] = await Promise.all([
      fetch('/api/modules?module_type=system'),
      fetch('/api/modules?module_type=service'),
      fetch('/api/modules?module_type=user'),
      fetch('/api/user/session')
    ]);

    // Parse JSON responses in parallel
    const [system, service, user, session] = await Promise.all([
      systemRes.ok ? systemRes.json() : [],
      serviceRes.ok ? serviceRes.json() : [],
      userRes.ok ? userRes.json() : [],
      sessionRes.ok ? sessionRes.json() : {}
    ]);

    // Store module data
    setModuleData({ system, service, user });
    setSessionData(session);
    
    const logoMap = {};
    
    console.log(`📦 Loaded module data: ${system.length + service.length + user.length} total modules`);
    
    // Process each module
    const loadPromises = [];
    const modules = [...system, ...service, ...user];
    
    console.log(`📦 Processing modules: ${modules.length} total modules found`);
    
    // Debug all modules received
    modules.forEach(mod => {
      console.log(`📦 Module data:`, {
        name: mod.name,
        module: mod.module,
        paneComponent: mod.paneComponent,
        lowercaseKey: (mod.module || mod.name || '').toLowerCase()
      });
    });
    
    for (const mod of modules) {
      // Get the base key from the module data - make sure to use the module field
      const key = (mod.module || mod.name || '').toLowerCase();
      if (!key) {
        console.warn(`⚠️ Skipping module with no key:`, mod);
        continue;
      }
      
      console.log(`🔍 Processing module: ${mod.name} (key: ${key}, component: ${mod.paneComponent})`);
      
      // Store logo URL if available
      if (mod.logoUrl) {
        logoMap[key] = mod.logoUrl;
      }

      // Load component if specified
      if (mod.paneComponent) {
        // Add to loading queue - we'll load components in parallel
        loadPromises.push(
          loadComponent(key, mod.paneComponent)
            .then(component => {
              if (component) {
                paneMap[key] = component;
                console.log(`✅ Added ${key} to paneMap, current keys:`, Object.keys(paneMap));
              }
            })
            .catch(err => {
              console.error(`🛑 Error in component loading promise for ${key}:`, err);
              paneMap[key] = null;
              
              // Show error in notification system if available
              if (window.errorSystem && typeof window.errorSystem.showError === 'function') {
                window.errorSystem.showError(
                  `Failed to load module: ${key} - ${err.message}`, 
                  'error',
                  0  // Don't auto-dismiss serious errors
                );
              }
            })
        );
      } else {
        // Even if there's no component, add a placeholder to indicate this module exists
        console.log(`ℹ️ Module ${key} has no component specified, adding placeholder`);
        paneMap[key] = null;
      }
    }
    
    // Update logo map
    setLogoMap(logoMap);
    
    // Wait for all components to load
    await Promise.allSettled(loadPromises);
    
    console.log(`🎉 Finished loading initial components. Loaded ${Object.keys(paneMap).filter(k => paneMap[k]).length} components successfully.`);
    
    // Mark as initialized
    initialized = true;
    
    // Register debug helpers
    registerDebugHelpers(paneMap, paneErrors);
    
    // Run debug diagnostics
    const diagnostics = debugComponentRegistry(paneMap);
    
    // Diagnose component loading status
    const componentDiagnosis = diagnoseComponentRegistration(paneMap);
    
    // Initialize debug helpers for the UI
    if (window.vaioDebug) {
      // Make paneMap available for debug tools
      window._paneMap = paneMap;
      window.vaioDebug.log(`🔍 Component loader initialized with ${Object.keys(paneMap).length} components`);
      
      // Log missing components if any
      if (componentDiagnosis.missingComponents && componentDiagnosis.missingComponents.length > 0) {
        window.vaioDebug.warn(`Missing ${componentDiagnosis.missingComponents.length} components: ${componentDiagnosis.missingComponents.join(', ')}`);
      }
      
      // Store diagnosis in debug system
      window.vaioDebug.componentDiagnosis = componentDiagnosis;
    }
    
    // Show success message in notification system
    if (window.errorSystem && typeof window.errorSystem.showDebug === 'function') {
      window.errorSystem.showDebug(
        `Component loader initialized with ${diagnostics.loaded.length} components`,
        'success',
        5000
      );
    }
    
    return { 
      paneMap, 
      paneErrors,
      moduleData: getModuleData() // Include moduleData in the return value
    };
  } catch (err) {
    console.error('🛑 Component loader failed to initialize:', err);
    
    // Show error in notification system
    if (window.errorSystem && typeof window.errorSystem.showError === 'function') {
      window.errorSystem.showError(
        `Component loader failed to initialize: ${err.message}`,
        'error',
        0  // Don't auto-dismiss critical errors
      );
    }
    
    throw err;
  }
}

/**
 * Get the map of loaded components
 * @returns {Object} Map of module keys to React components
 */
export const getPaneMap = () => {
  if (process.env.NODE_ENV !== 'production') {
    console.log('🔍 getPaneMap called, current pane map:', {
      keys: Object.keys(paneMap),
      initialized: initialized,
      mapSize: Object.keys(paneMap).length
    });
  }
  return paneMap;
};

/**
 * Get enhanced pane map with component metadata
 * Useful for debugging
 * @returns {Object} Enhanced map with component metadata
 */
export const getEnhancedPaneMap = () => {
  const enhancedMap = {};
  
  Object.entries(paneMap).forEach(([key, comp]) => {
    enhancedMap[key] = {
      component: comp,
      type: typeof comp,
      isValid: typeof comp === 'function',
      isNull: comp === null,
      ...(paneErrors[key] ? { error: paneErrors[key] } : {})
    };
  });
  
  return enhancedMap;
};

/**
 * Get information about component load errors
 * @returns {Object} Object containing error information by component key
 */
export const getPaneErrorInfo = () => {
  return { ...paneErrors };
};

/**
 * Check if the component loader has been initialized
 * @returns {boolean} Initialization status
 */
export const isInitialized = () => initialized;