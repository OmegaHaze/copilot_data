// ComponentRegistryInitializer.js - Single entry point for loading all components
import { componentRegistry } from './ComponentRegistry';

/**
 * Initialize the component registry with all available modules
 */
export async function initializeComponentRegistry() {
  try {
    console.log('Initializing component registry...');
    
    // Fetch all modules from the API in parallel
    let systemRes, serviceRes, userRes;
    
    try {
      [systemRes, serviceRes, userRes] = await Promise.all([
        fetch('/api/modules?module_type=system'),
        fetch('/api/modules?module_type=service'),
        fetch('/api/modules?module_type=user')
      ]);
      
      // Check for HTTP errors
      if (!systemRes.ok) console.error(`Failed to fetch system modules: ${systemRes.status}`);
      if (!serviceRes.ok) console.error(`Failed to fetch service modules: ${serviceRes.status}`);
      if (!userRes.ok) console.error(`Failed to fetch user modules: ${userRes.status}`);
      
    } catch (fetchErr) {
      console.error('Network error fetching modules:', fetchErr);
      
      // Create empty responses as fallback
      systemRes = { ok: true, json: async () => [] };
      serviceRes = { ok: true, json: async () => [] };
      userRes = { ok: true, json: async () => [] };
    }
    
    // Parse responses with error handling
    let system = [], service = [], user = [];
    
    try {
      system = systemRes.ok ? await systemRes.json() : [];
    } catch (e) {
      console.error('Failed to parse system modules:', e);
    }
    
    try {
      service = serviceRes.ok ? await serviceRes.json() : [];
    } catch (e) {
      console.error('Failed to parse service modules:', e);
    }
    
    try {
      user = userRes.ok ? await userRes.json() : [];
    } catch (e) {
      console.error('Failed to parse user modules:', e);
    }
    
    // Combine all modules and store in registry
    const allModules = [...system, ...service, ...user];
    componentRegistry.setModuleData({ system, service, user });
    
    console.log(`Processing ${allModules.length} modules for component loading`);
    
    // Process each module for component loading
    const loadPromises = [];
    const loadDetails = [];
    
    if (allModules.length === 0) {
      console.warn('No modules found in API responses. Please check the backend is returning module data correctly.');
    }
    
    // Load components from the API response
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
        loadDetails.push({ key, component: mod.paneComponent, source: 'api' });
      } else {
        // Try to load using conventional naming
        const conventionalName = componentRegistry.getComponentName(key);
        loadPromises.push(componentRegistry.loadComponent(key));
        loadDetails.push({ key, component: conventionalName, source: 'convention' });
      }
    }
    
    console.log('Component load queue:', loadDetails.map(d => `${d.key} (${d.component}) [${d.source}]`).join(', '));
    
    // Wait for all components to load
    const results = await Promise.allSettled(loadPromises);
    
    // Count successes and failures with detailed reporting
    const succeededComponents = [];
    const failedComponents = [];
    
    results.forEach((result, index) => {
      const detail = loadDetails[index];
      if (result.status === 'fulfilled' && result.value) {
        succeededComponents.push(detail);
      } else {
        failedComponents.push({
          ...detail,
          error: result.reason?.message || 'Component loading failed'
        });
      }
    });
    
    // Detailed logging of results
    console.log(`Loaded ${succeededComponents.length} components successfully:`);
    if (succeededComponents.length > 0) {
      console.log(succeededComponents.map(c => `- ${c.key} (${c.component})`).join('\n'));
    }
    
    if (failedComponents.length > 0) {
      console.error(`Failed to load ${failedComponents.length} components:`);
      console.error(failedComponents.map(c => `- ${c.key} (${c.component}): ${c.error}`).join('\n'));
    }
    
    // If no components were loaded, just log a warning
    if (succeededComponents.length === 0 && componentRegistry.getAllComponentKeys().length === 0) {
      console.warn('NO COMPONENTS LOADED! Please check API responses and component imports.');
    }
    
    componentRegistry.setInitialized(true);
    
    // Register debug helpers in development mode
    if (process.env.NODE_ENV !== 'production') {
      registerDebugHelpers();
    }
    
    // Create helpful error message if needed
    let errorMessage = null;
    if (succeededComponents.length === 0) {
      errorMessage = 'Failed to load any components. Check network connectivity and browser console.';
    } else if (failedComponents.length > 0) {
      errorMessage = `${failedComponents.length} components failed to load. Check browser console for details.`;
    }
    
    return {
      success: succeededComponents.length > 0,
      componentCount: componentRegistry.getAllComponentKeys().length,
      errors: componentRegistry.getErrors(),
      errorMessage,
      paneMap: getPaneMap(),
      logoUrls: getLogoMap(),
      moduleData: componentRegistry.getModuleData(),
      loadedComponents: succeededComponents.map(c => c.key),
      failedComponents: failedComponents.map(c => c.key)
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