/**
 * component-loader.js
 * Dynamically load components
 */

import { ERROR_MESSAGES } from './component-constants';
import { getCanonicalKey, createRegistrationKey, parsePaneId } from './component-shared';
import registry from './component-registry';

// Track in-progress loading
const componentLoadPromises = new Map();

/**
 * Load a component dynamically
 * @param {string} moduleType - Module type
 * @param {string} staticIdentifier - Static identifier
 * @param {string} paneId - Optional pane ID
 * @returns {Promise<Function|null>} Component or null
 */
export async function loadComponent(moduleType, staticIdentifier, paneId = null) {
  if (!moduleType || !staticIdentifier) return null;

  const parsed = paneId ? parsePaneId(paneId) : null;
  const instanceId = parsed?.instanceId || null;
  const registrationKey = createRegistrationKey(moduleType, staticIdentifier, instanceId);

  console.debug('[component-loader] Loading component:', { 
    moduleType, 
    staticIdentifier, 
    paneId, 
    registrationKey 
  });

  // Return if already loaded
  if (registry.hasComponent(registrationKey)) {
    return registry.getComponent(registrationKey);
  }

  // Return existing promise if already loading
  if (componentLoadPromises.has(registrationKey)) {
    return componentLoadPromises.get(registrationKey);
  }

  const loadPromise = (async () => {
    try {
      let componentModule = null;

      // Try the resolver first
      if (typeof window.__VAIO_COMPONENT_RESOLVER__ === 'function') {
        componentModule = await window.__VAIO_COMPONENT_RESOLVER__(registrationKey);

        if (!componentModule) {
          throw new Error(`${ERROR_MESSAGES.COMPONENT_LOAD_FAILED}: ${staticIdentifier}`);
        }
      } else {
        // Import moduleRegistry and use it as the ONLY source of truth
        const moduleRegistry = await import('../Module/module-registry').then(m => m.default);
        const moduleTypeKey = getCanonicalKey(moduleType);
        
        // Make sure moduleRegistry is initialized
        if (!moduleRegistry.initialized) {
          console.log('[component-loader] Initializing module registry before component lookup');
          await moduleRegistry.initialize();
        }
        
        // Get module data from module registry ONLY - no fallbacks
        const moduleInfo = moduleRegistry.findModule(moduleTypeKey, staticIdentifier);
        
        if (!moduleInfo) {
          // No fallbacks - strict crash approach
          throw new Error(`Module ${staticIdentifier} not found in module registry - NO FALLBACKS`);
        }
        
        console.log(`[component-loader] Found module ${staticIdentifier} in module registry`);
        
        // Use module info directly from module registry
        const resolvedModuleInfo = moduleInfo;
        
        if (resolvedModuleInfo?.loadComponent) {
          componentModule = await resolvedModuleInfo.loadComponent();
        } else {
          throw new Error(`${ERROR_MESSAGES.NO_RESOLVER}: ${staticIdentifier}`);
        }
      }

      // Normalize component module format
      if (typeof componentModule === 'function') {
        componentModule = { default: componentModule };
      }

      const Component = componentModule?.default;

      if (typeof Component !== 'function') {
        throw new Error(`${ERROR_MESSAGES.NO_VALID_COMPONENT}: ${staticIdentifier}`);
      }

      // Add metadata using standard properties
      Component.meta = {
        moduleType,
        staticIdentifier,
        isInstance: !!paneId,
        registeredAt: new Date().toISOString()
      };

      registry.registerComponent(registrationKey, Component, moduleType);
      return Component;
    } catch (error) {
      registry.addError(registrationKey, error);
      throw error;
    } finally {
      componentLoadPromises.delete(registrationKey);
    }
  })();

  componentLoadPromises.set(registrationKey, loadPromise);
  return loadPromise;
}

/**
 * Load component from pane ID
 * @param {string} paneId - Full 3-part pane ID
 * @returns {Promise<Object|null>}
 */
export async function loadComponentFromPaneId(paneId) {
  if (!paneId || typeof paneId !== 'string') return null;

  const parsed = parsePaneId(paneId);
  if (!parsed) return null;

  try {
    const component = await loadComponent(parsed.moduleType, parsed.staticIdentifier, paneId);
    return component ? {
      component,
      moduleType: parsed.moduleType,
      staticIdentifier: parsed.staticIdentifier,
      paneId
    } : null;
  } catch {
    return null;
  }
}