// ComponentRegistryInitializer.js - Single entry point for loading all components
import { componentRegistry } from './ComponentRegistry';

/**
 * Initialize the component registry with all available modules
 */
export async function initializeComponentRegistry() {
  try {
    console.log('Initializing component registry...');
    
    // Fetch all modules from the API in parallel
    const [systemRes, serviceRes, userRes] = await Promise.all([
      fetch('/api/modules?module_type=system'),
      fetch('/api/modules?module_type=service'),
      fetch('/api/modules?module_type=user')
    ]);
    
    // Parse responses
    const system = await systemRes.json();
    const service = await serviceRes.json();
    const user = await userRes.json();
    
    // Combine all modules and store in registry
    const allModules = [...system, ...service, ...user];
    componentRegistry.setModuleData({ system, service, user });
    
    console.log(`Processing ${allModules.length} modules for component loading`);
    
    // Process each module for component loading
    const loadPromises = [];
    
    for (const mod of allModules) {
      // Get canonical key
      const key = componentRegistry.getCanonicalKey(mod.module || mod.name);
      
      // Store logo URL if available
      if (mod.logoUrl) {
        componentRegistry.setLogoUrl(key, mod.logoUrl);
      }
      
      // Set module category based on module_type
      if (mod.module_type) {
        componentRegistry.setCategoryForModule(key, mod.module_type.toLowerCase());
      }
      
      // Load component if specified
      if (mod.paneComponent) {
        loadPromises.push(componentRegistry.loadComponent(key, mod.paneComponent));
      } else {
        // Try to load using conventional naming
        loadPromises.push(componentRegistry.loadComponent(key));
      }
    }
    
    // Wait for all components to load
    const results = await Promise.allSettled(loadPromises);
    
    // Count successes and failures
    const successes = results.filter(r => r.status === 'fulfilled' && r.value).length;
    const failures = results.filter(r => r.status === 'rejected' || !r.value).length;
    
    console.log(`Loaded ${successes} components successfully (${failures} failed)`);
    componentRegistry.setInitialized(true);
    
    // Register debug helpers in development mode
    if (process.env.NODE_ENV !== 'production') {
      registerDebugHelpers();
    }
    
    return {
      success: true,
      componentCount: componentRegistry.getAllComponentKeys().length,
      errors: componentRegistry.getErrors(),
      paneMap: getPaneMap(),
      logoUrls: getLogoMap(),
      moduleData: componentRegistry.getModuleData()
    };
  } catch (err) {
    console.error('Failed to initialize component registry:', err);
    return {
      success: false,
      error: err.message
    };
  }
}

/**
 * Get pane component map for ServiceGrid
 */
export function getPaneMap() {
  const components = {};
  
  componentRegistry.getAllComponentKeys().forEach(key => {
    components[key] = componentRegistry.getComponent(key);
  });
  
  return components;
}

/**
 * Get logo URL map for components
 */
export function getLogoMap() {
  const logoMap = {};
  
  componentRegistry.getAllComponentKeys().forEach(key => {
    const logoUrl = componentRegistry.getLogoUrl(key);
    if (logoUrl) {
      logoMap[key] = logoUrl;
    }
  });
  
  return logoMap;
}

/**
 * Register debug helpers on the window object
 */
function registerDebugHelpers() {
  window.componentRegistry = componentRegistry;
  
  // Map legacy window methods to registry functions
  window.getPaneMap = () => {
    const enhancedMap = {};
    
    componentRegistry.getAllComponentKeys().forEach(key => {
      const comp = componentRegistry.getComponent(key);
      const error = componentRegistry.getErrors()[key];
      
      enhancedMap[key] = {
        component: comp,
        componentName: comp?.displayName || comp?.name || 'Unknown',
        type: typeof comp,
        isValid: typeof comp === 'function',
        isNull: comp === null,
        canonicalKey: key.toLowerCase(),
        ...(error ? { error } : {})
      };
    });
    
    return enhancedMap;
  };
  
  // Function to get component loading errors
  window.getPaneMapErrors = () => {
    const errors = componentRegistry.getErrors();
    
    return Object.entries(errors).map(([key, errorInfo]) => ({
      key,
      error: errorInfo
    }));
  };
  
  // Make raw pane map available for debugging
  window.rawPaneMap = componentRegistry.components;
}