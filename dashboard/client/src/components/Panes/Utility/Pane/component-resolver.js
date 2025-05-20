/**
 * component-resolver.js
 * Component resolver for mapping and looking up components.
 * This version only provides component mapping without pre-registration
 * to avoid the double registration issue with the on-demand system.
 */

import { MODULE_TYPES } from '../Loader/Component/component-constants';

// Dynamic imports using Vite's import.meta.glob for auto-discovery
// Scan all subdirectories of the Panes folder to find components
const paneModules = import.meta.glob('./*.jsx');

// This map will be populated when components are requested
const COMPONENT_MAP = {};

// Export the discovered module data for use in component-index.js
export let discoveredModuleData = {
  [MODULE_TYPES.SYSTEM]: [],
  [MODULE_TYPES.SERVICE]: [],
  [MODULE_TYPES.USER]: []
};

/**
 * Component resolver function that will be attached to window
 * This allows the component loader to dynamically resolve components by their staticIdentifier
 * @param {string} staticIdentifier - The static identifier of the component to load
 * @param {string} moduleType - The module type (SYSTEM, SERVICE, USER)
 * @returns {Promise<{ default: Function }|null>} - Module-like object or null if not found
 */
export function resolveComponent(staticIdentifier, moduleType) {
  if (!staticIdentifier) return null;

  // Check if we have this component in our map
  if (COMPONENT_MAP[staticIdentifier]) {
    console.log(`[component-resolver] Found ${staticIdentifier} in cache`);
    return Promise.resolve(COMPONENT_MAP[staticIdentifier]);
  }

  // Look for a file that exports this component
  const modulePath = `./${staticIdentifier}.jsx`;

  if (paneModules[modulePath]) {
    console.log(`[component-resolver] Loading ${staticIdentifier} from ${modulePath}`);

    // Dynamically load the component
    return paneModules[modulePath]().then(module => {
      const component = module.default;
      if (typeof component === 'function') {
        // Wrap and cache
        const wrapped = { default: component };
        COMPONENT_MAP[staticIdentifier] = wrapped;

        console.log(`[component-resolver] Mapped ${staticIdentifier} (${moduleType}) to component - NO PRE-REGISTRATION`);
        return wrapped;
      }

      console.warn(`[component-resolver] Component ${staticIdentifier} has no default export`);
      return null;
    }).catch(err => {
      console.error(`[component-resolver] Failed to load ${staticIdentifier}:`, err);
      return null;
    });
  }

  console.warn(`[component-resolver] Failed to resolve ${staticIdentifier} (${moduleType}), no matching file`);
  return null;
}

/**
 * Extracts component information from file paths
 * @param {Object} modules - Module object from import.meta.glob
 * @returns {Array<string>} - Array of component static identifiers
 */
function extractComponentIdentifiers(modules) {
  return Object.keys(modules).map(path => {
    // Extract the filename without extension
    const match = path.match(/\/([^/]+)\.jsx$/);
    return match ? match[1] : null;
  }).filter(Boolean);
}

/**
 * Builds a component map without registering components
 * This function replaces the old scanAndRegisterComponents
 * @returns {Promise<Object>} - Component mapping info
 */
async function buildComponentMap() {
  console.log('[component-resolver] Building component map...');

  // Initialize module data
  const moduleData = {
    [MODULE_TYPES.SYSTEM]: [],
    [MODULE_TYPES.SERVICE]: [],
    [MODULE_TYPES.USER]: []
  };

  // Scan pane components and extract their moduleType
  const componentNames = extractComponentIdentifiers(paneModules);
  console.log(`[component-resolver] Found ${componentNames.length} potential components`);

  // Add components to the map but don't register them
  const componentLoadPromises = componentNames.map(async (componentName) => {
    try {
      const modulePath = `./${componentName}.jsx`;
      if (!paneModules[modulePath]) {
        console.warn(`[component-resolver] Module not found: ${modulePath}`);
        return;
      }

      const module = await paneModules[modulePath]();
      const component = module.default;

      if (typeof component !== 'function') {
        console.error(`[component-resolver] Invalid default export in ${componentName}`);
        return;
      }

      // Default to SYSTEM module type
      let moduleType = MODULE_TYPES.SYSTEM;

      // Wrap and cache without registering
      const wrapped = { default: component };
      COMPONENT_MAP[componentName] = wrapped;

      // Add component to appropriate module type array
      if (!moduleData[moduleType].includes(componentName)) {
        moduleData[moduleType].push(componentName);
      }

      console.log(`[component-resolver] Mapped ${componentName} as ${moduleType} (without registration)`);
    } catch (err) {
      console.error(`[component-resolver] Failed to analyze ${componentName}:`, err);
    }
  });

  // Wait for all components to be processed
  await Promise.all(componentLoadPromises);

  console.log('[component-resolver] Component map built:', {
    SYSTEM: moduleData[MODULE_TYPES.SYSTEM].length,
    SERVICE: moduleData[MODULE_TYPES.SERVICE].length,
    USER: moduleData[MODULE_TYPES.USER].length,
    totalMapped: Object.keys(COMPONENT_MAP).length
  });

  return { moduleData, componentMap: COMPONENT_MAP };
}

// Ensure resolver is attached to window only once
if (typeof window !== 'undefined' && !window.__VAIO_COMPONENT_RESOLVER__) {
  window.__VAIO_COMPONENT_RESOLVER__ = resolveComponent;

  // Initialize the component map without registering components
  buildComponentMap().then(({ moduleData, componentMap }) => {
    // Store discovered modules in the exported variable for others to use
    discoveredModuleData = moduleData;
    
    console.log('[component-resolver] Component map built with:', {
      available: Object.keys(componentMap).length,
      SYSTEM: moduleData[MODULE_TYPES.SYSTEM].length,
      SERVICE: moduleData[MODULE_TYPES.SERVICE].length,
      USER: moduleData[MODULE_TYPES.USER].length
    });

    console.log('✅ Component resolver initialized and ready');
    
    // Dispatch an event that component-index.js can listen for
    try {
      window.dispatchEvent(new CustomEvent('vaio:components-discovered', {
        detail: { moduleData, timestamp: Date.now() }
      }));
    } catch (e) {
      console.warn('[component-resolver] Failed to dispatch discovery event:', e);
    }
  });
}

export default resolveComponent;
export { buildComponentMap };