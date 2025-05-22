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
        // Use module data from registry
        const moduleTypeKey = getCanonicalKey(moduleType);
        const moduleData = registry.getModuleData();
        const moduleList = moduleData[moduleTypeKey] || [];

        // Use standardized property lookup
        const moduleInfo = moduleList.find(m => {
          const identifier = m.staticIdentifier || m.module || m.paneComponent;
          return identifier?.toLowerCase() === staticIdentifier.toLowerCase();
        });

        if (moduleInfo?.loadComponent) {
          componentModule = await moduleInfo.loadComponent();
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