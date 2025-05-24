/**
 * component-resolver.js
 * Component resolver for dynamically loading React components.
 * 
 * This resolver has one primary responsibility: resolving component requests
 * by looking up the corresponding JSX file for a given staticIdentifier.
 */
import { parsePaneId } from '../Loader/Component/component-shared';

// Dynamic imports using Vite's import.meta.glob for auto-discovery
const paneModules = import.meta.glob('./*.jsx');

// Simple cache for already resolved components (in-memory only)
const componentCache = {};

/**
 * Component resolver function that finds and loads components by their staticIdentifier
 * 
 * @param {string} staticIdentifier - The static identifier of the component to load
 * @returns {Promise<{ default: Function }|null>} - Module-like object or null if not found
 */
export function resolveComponent(registrationKey) {
  if (!registrationKey || typeof registrationKey !== 'string') return null;

  // Parse once if needed
  const { staticIdentifier } = parsePaneId(registrationKey) || {};
  if (!staticIdentifier) return null;

  // Use the full registration key as the cache key
  if (componentCache[registrationKey]) {
    return Promise.resolve(componentCache[registrationKey]);
  }

  const modulePath = `./${staticIdentifier}.jsx`;
  if (!paneModules[modulePath]) {
    console.warn(`Could not find component file for ${staticIdentifier}`);
    return null;
  }

  return paneModules[modulePath]().then(module => {
    const component = module.default;
    if (typeof component === 'function') {
      const wrapped = { default: component };
      componentCache[registrationKey] = wrapped;
      return wrapped;
    }
    console.warn(`Component ${staticIdentifier} has no default export`);
    return null;
  }).catch(err => {
    console.error(`Failed to load component ${staticIdentifier}:`, err);
    return null;
  });
}

/**
 * Get a list of all available component identifiers
 * This is used for system diagnostics and debugging
 * 
 * @returns {string[]} List of available component identifiers
 */
export function getAvailableComponents() {
  return Object.keys(paneModules).map(path => {
    const match = path.match(/\/([^/]+)\.jsx$/);
    return match ? match[1] : null;
  }).filter(Boolean);
}

/**
 * Discover all available components
 * This allows the component system to auto-register components
 */
export async function discoverComponents() {
  const components = getAvailableComponents();
  
  // Use existing registry cache from localStorage, never try to use anything else
  let discoveredData = {
    SYSTEM: [],
    SERVICE: [],
    USER: []
  };

  try {
    // Import the module registry and use it as the sole source of truth
    const moduleRegistry = await import('../Loader/Module/module-registry').then(m => m.default);
    
    // Make sure module registry is initialized
    if (!moduleRegistry.initialized) {
      console.log('[component-resolver] Initializing module registry');
      await moduleRegistry.initialize();
    }
    
    // Get data directly from module registry - no fallbacks
    const registryData = moduleRegistry.getAllModules();
    
    // Use module registry data as the only source of truth
    discoveredData = {
      SYSTEM: registryData.SYSTEM || [],
      SERVICE: registryData.SERVICE || [],
      USER: registryData.USER || []
    };
    
    console.log('[component-resolver] Using module registry data:', {
      SYSTEM: discoveredData.SYSTEM.length,
      SERVICE: discoveredData.SERVICE.length,
      USER: discoveredData.USER.length
    });
  } catch (err) {
    console.warn('[component-resolver] Failed to parse registry cache for component discovery:', err);
  }

  
  // Dispatch discovery event
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('vaio:components-discovered', {
      detail: { 
        components,
        discoveredData,
        timestamp: Date.now()
      }
    }));
  }
  
  return discoveredData;
}

// Attach the resolver to the window object for global access
if (typeof window !== 'undefined') {
  if (!window.__VAIO_COMPONENT_RESOLVER__) {
    window.__VAIO_COMPONENT_RESOLVER__ = resolveComponent;
    console.log('[component-resolver] Resolver initialized');
  }
  
  // Import module registry and use it to initialize the resolver
  import('../Loader/Module/module-registry').then(async m => {
    const moduleRegistry = m.default;
    
    // Make sure module registry is initialized - enforce strict approach
    if (!moduleRegistry.initialized) {
      try {
        await moduleRegistry.initialize();
        console.log('[component-resolver] Successfully initialized module registry');
      } catch (error) {
        console.error('[component-resolver] Failed to initialize module registry:', error);
        throw error; // Crash if module registry fails to initialize
      }
    }
  }).catch(err => {
    console.error('[component-resolver] Error initializing with module registry:', err);
    throw err; // Crash if there's any error
  });
}

export default resolveComponent;