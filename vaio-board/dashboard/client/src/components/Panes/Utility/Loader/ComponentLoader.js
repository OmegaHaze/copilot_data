// ComponentLoader.js - Simplified component loading system

// Component registry - a simple map of module keys to React components
const componentRegistry = {};

/**
 * Load a component by module key and component name
 * @param {string} key - Module key (lowercase)
 * @param {string} componentName - Component file name 
 * @returns {Promise<Function|null>} - React component or null if loading failed
 */
async function loadComponent(key, componentName) {
  try {
    console.log(`Loading component: ${componentName} for ${key}`);
    
    // Standard import path - all components in Pane directory
    const importPath = `../Pane/${componentName}.jsx`;
    
    // Dynamic import with consistent path pattern
    const module = await import(importPath);
    
    // Check for default export
    if (!module.default) {
      throw new Error(`No default export found for ${componentName}`);
    }
    
    // Store in registry and return
    componentRegistry[key] = module.default;
    return module.default;
  } catch (err) {
    console.error(`Failed to load component: ${componentName} for ${key}:`, err);
    return null;
  }
}

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
    const modules = [
      ...(systemRes.ok ? await systemRes.json() : []),
      ...(serviceRes.ok ? await serviceRes.json() : []),
      ...(userRes.ok ? await userRes.json() : [])
    ];
    
    console.log(`Processing ${modules.length} modules for component loading`);
    
    // Load components in parallel
    const loadPromises = modules
      .filter(mod => mod.paneComponent && (mod.module || mod.name))
      .map(mod => {
        const key = (mod.module || mod.name).toLowerCase();
        return loadComponent(key, mod.paneComponent);
      });
    
    // Wait for all components to load
    await Promise.allSettled(loadPromises);
    
    console.log(`Loaded ${Object.keys(componentRegistry).length} components successfully`);
    
    return componentRegistry;
  } catch (err) {
    console.error('Component loader failed to initialize:', err);
    throw err;
  }
}

/**
 * Get a component by key
 * @param {string} key - Module key
 * @returns {Function|null} React component or null
 */
export function getComponent(key) {
  if (!key) return null;
  return componentRegistry[key.toLowerCase()] || null;
}

/**
 * Get all loaded components
 * @returns {Object} Map of keys to components
 */
export function getAllComponents() {
  return { ...componentRegistry };
}

/**
 * Check if a component exists
 * @param {string} key - Module key
 * @returns {boolean} Whether component exists
 */
export function hasComponent(key) {
  if (!key) return false;
  return !!componentRegistry[key.toLowerCase()];
}