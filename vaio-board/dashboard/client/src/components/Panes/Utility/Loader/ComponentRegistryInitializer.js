// ComponentRegistryInitializer.js
import { componentRegistry } from './ComponentRegistry';

/**
 * Initialize the component registry with all available modules
 */
export async function initializeComponentRegistry() {
  try {
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
    
    // Combine all modules
    const allModules = [...system, ...service, ...user];
    
    // Process each module for component loading
    const loadPromises = [];
    
    for (const mod of allModules) {
      // Get canonical key
      const key = componentRegistry.getCanonicalKey(mod.module || mod.name);
      
      // Store logo URL if available
      if (mod.logoUrl) {
        componentRegistry.setLogoUrl(key, mod.logoUrl);
      }
      
      // Load component if specified
      if (mod.paneComponent) {
        loadPromises.push(componentRegistry.loadComponent(key, mod.paneComponent));
      }
    }
    
    // Wait for all components to load
    await Promise.allSettled(loadPromises);
    
    return {
      success: true,
      componentCount: componentRegistry.getAllComponentKeys().length,
      errors: componentRegistry.getErrors()
    };
  } catch (err) {
    console.error('Failed to initialize component registry:', err);
    return {
      success: false,
      error: err.message
    };
  }
}

// Debug helper function
export function getComponentRegistryStatus() {
  return {
    componentCount: componentRegistry.getAllComponentKeys().length,
    componentKeys: componentRegistry.getAllComponentKeys(),
    errors: componentRegistry.getErrors()
  };
}