// ComponentLoader.js - Simplified component loading system
import { componentRegistry } from './ComponentRegistry.js';

/**
 * Initialize component loader - fetch modules and load components
 * @returns {Promise<Object>} Component registry
 */
export async function initComponentLoader() {
  try {
    // Fetch all module data in parallel
    const [systemRes, serviceRes, userRes] = await Promise.all([
      fetch('/api/modules?module_type=system'),
      fetch('/api/modules?module_type=service'),
      fetch('/api/modules?module_type=user')
    ]);

    // Parse JSON responses
    const moduleData = {
      system: systemRes.ok ? await systemRes.json() : [],
      service: serviceRes.ok ? await serviceRes.json() : [],
      user: userRes.ok ? await userRes.json() : []
    };
    
    // Update component registry with module data
    componentRegistry.setModuleData(moduleData);
    
    console.log(`Processing ${moduleData.system.length + moduleData.service.length + moduleData.user.length} modules for component loading`);
    
    // Create flat list of all modules
    const allModules = [
      ...moduleData.system,
      ...moduleData.service,
      ...moduleData.user
    ];
    
    // Load components in parallel
    const loadPromises = allModules
      .filter(mod => mod.paneComponent && (mod.module || mod.name))
      .map(mod => {
        const key = (mod.module || mod.name).toLowerCase();
        
        // Store logo URL if available
        if (mod.logoUrl) {
          componentRegistry.setLogoUrl(key, mod.logoUrl);
        }
        
        // Set module category based on module_type
        if (mod.module_type) {
          componentRegistry.setCategoryForModule(key, mod.module_type.toLowerCase());
        }
        
        return componentRegistry.loadComponent(key, mod.paneComponent);
      });
    
    // Wait for all components to load
    await Promise.allSettled(loadPromises);
    
    // Register debug helpers in development mode
    if (process.env.NODE_ENV !== 'production') {
      registerDebugHelpers();
    }
    
    console.log(`Loaded ${componentRegistry.getAllComponentKeys().length} components successfully`);
    componentRegistry.setInitialized(true);
    
    return {
      success: true,
      componentCount: componentRegistry.getAllComponentKeys().length,
      paneMap: getPaneMap(),
      moduleData,
      logoUrls: getLogoMap()
    };
  } catch (err) {
    console.error('Component loader failed to initialize:', err);
    throw err;
  }
}

/**
 * Get pane component map for ServiceGrid
 * @returns {Object} Map of module keys to components
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
 * @returns {Object} Map of module keys to logo URLs
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