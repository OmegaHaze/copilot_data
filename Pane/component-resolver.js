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

// Store module data for sharing with the registry
let moduleDataCache = null;

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
        console.warn(`[component-resolver] No valid default export in ${componentName}`);
        return;
      }

      // Extract moduleType from component's default props or parameters
      let moduleType = MODULE_TYPES.SYSTEM; // Default

      // Determine module type based on component name or defaultProps
      if (component.defaultProps && component.defaultProps.moduleType) {
        moduleType = component.defaultProps.moduleType;
      } else if (componentName === 'SupervisorPane') {
        moduleType = MODULE_TYPES.SYSTEM;
      } else if (componentName.includes('Nvidia')) {
        moduleType = MODULE_TYPES.SERVICE;
      }

      // Wrap and cache without registering
      const wrapped = { default: component };
      COMPONENT_MAP[componentName] = wrapped;

      // Create proper module entry with the needed fields
      const moduleEntry = {
        module: `${moduleType}-${componentName}`,
        staticIdentifier: componentName,
        name: componentName,
        // Add loadComponent function that component-loader.js uses
        loadComponent: async () => {
          return wrapped;
        }
      };

      // Add component to appropriate module type array
      const existingIndex = moduleData[moduleType].findIndex(
        m => m.staticIdentifier === componentName
      );
      
      if (existingIndex === -1) {
        moduleData[moduleType].push(moduleEntry);
      }

      console.log(`[component-resolver] Mapped ${componentName} as ${moduleType} (without registration)`);
    } catch (err) {
      console.error(`[component-resolver] Failed to analyze ${componentName}:`, err);
    }
  });

  // Wait for all components to be processed
  await Promise.all(componentLoadPromises);

  // Store for sharing with other components
  moduleDataCache = moduleData;

  console.log('[component-resolver] Component map built:', {
    SYSTEM: moduleData[MODULE_TYPES.SYSTEM].length,
    SERVICE: moduleData[MODULE_TYPES.SERVICE].length,
    USER: moduleData[MODULE_TYPES.USER].length,
    totalMapped: Object.keys(COMPONENT_MAP).length
  });

  return { moduleData, componentMap: COMPONENT_MAP };
}

/**
 * Get module data for all available component types
 * This can be imported and used by fetchAllModules() as a fallback
 * @returns {Object} Module data by type
 */
export function getModuleData() {
  if (!moduleDataCache) {
    console.warn('[component-resolver] getModuleData called before moduleDataCache was initialized');
    return {
      [MODULE_TYPES.SYSTEM]: [],
      [MODULE_TYPES.SERVICE]: [],
      [MODULE_TYPES.USER]: []
    };
  }
  return moduleDataCache;
}

// Only initialize the resolver once
if (typeof window !== 'undefined' && !window.__VAIO_COMPONENT_RESOLVER__) {
  window.__VAIO_COMPONENT_RESOLVER__ = resolveComponent;

  // Initialize the component map without registering components
  buildComponentMap().then(({ moduleData, componentMap }) => {
    console.log('[component-resolver] Component map built with:', {
      available: Object.keys(componentMap).length,
      SYSTEM: moduleData[MODULE_TYPES.SYSTEM].length,
      SERVICE: moduleData[MODULE_TYPES.SERVICE].length,
      USER: moduleData[MODULE_TYPES.USER].length
    });

    // Handle registration with registry 
    try {
      // Import dynamically to avoid circular dependencies
      import('../Loader/Component/component-registry').then(({ default: registry }) => {
        if (registry && registry.setModuleData && moduleDataCache) {
          console.log('[component-resolver] Providing module data to registry');
          registry.setModuleData(moduleDataCache);
        }
      }).catch(err => {
        console.warn('[component-resolver] Failed to import registry:', err);
      });
    } catch (err) {
      console.warn('[component-resolver] Failed to set module data in registry:', err);
    }

    console.log('✅ Component resolver initialized and ready');
  });
}

export default resolveComponent;
export { buildComponentMap };