/**
 * component-loader.js
 * Functions for loading components dynamically
 */

import { ERROR_MESSAGES } from './component-constants';
import { getCanonicalKey, createRegistrationKey } from './component-core';
import registry from './component-registry';

// Map to track in-progress component loading
const componentLoadPromises = new Map();

/**
 * Load a component dynamically
 * @param {string} moduleType - Module type
 * @param {string} staticIdentifier - Static identifier
 * @returns {Promise<Function|null>} - Component constructor
 */
export async function loadComponent(moduleType, staticIdentifier, paneId = null) {
  if (!moduleType || !staticIdentifier) {
    return null;
  }

  const registrationKey = paneId || createRegistrationKey(moduleType, staticIdentifier);


// Return if already loaded - check both for paneId (instance) and component type
if (paneId && registry.hasComponent(paneId)) {
  return registry.getComponent(paneId);
} else if (!paneId && registry.hasComponent(registrationKey)) {
  return registry.getComponent(registrationKey);
}

  // If already loading, return existing promise
const promiseKey = paneId || registrationKey;
if (componentLoadPromises.has(promiseKey)) {
  return componentLoadPromises.get(promiseKey);
}

  // Create loading promise
const loadPromise = (async () => {
  const componentKey = paneId || registrationKey;
    try {
      let componentModule = null;

      // Try custom resolver if available
      if (typeof window.__VAIO_COMPONENT_RESOLVER__ === 'function') {
        const Component = await window.__VAIO_COMPONENT_RESOLVER__(staticIdentifier, moduleType);
        if (Component) {
          componentModule = Component;
        } else {
          throw new Error(`${ERROR_MESSAGES.COMPONENT_LOAD_FAILED}: ${staticIdentifier}`);
        }
      } else {
        // Try module data loader
        const moduleTypeKey = getCanonicalKey(moduleType);
        const moduleData = registry.getModuleData();

        const moduleInfo = moduleData[moduleTypeKey]?.find(m =>
          m.staticIdentifier === staticIdentifier || m.module === staticIdentifier
        );

        if (moduleInfo?.loadComponent) {
          componentModule = await moduleInfo.loadComponent();
        } else {
          throw new Error(`${ERROR_MESSAGES.NO_RESOLVER}: ${staticIdentifier}`);
        }
      }

      // 🔒 Normalize to expected module shape if a raw function was returned
      if (typeof componentModule === 'function') {
        componentModule = { default: componentModule };
      }

      console.warn('[TRACE componentModule]', {
        staticIdentifier,
        moduleType,
        returned: componentModule,
        defaultExport: componentModule?.default,
        defaultType: typeof componentModule?.default
      });

      const Component = componentModule?.default;

      if (typeof Component !== 'function') {
        throw new Error(`${ERROR_MESSAGES.NO_VALID_COMPONENT}: ${staticIdentifier} -> ${typeof Component}`);
      }

      registry.registerComponent(componentKey, Component, moduleType, paneId ? true : false);
      return Component;
    } catch (error) {
      registry.addError(registrationKey, error);
      throw error;
    } finally {
      componentLoadPromises.delete(promiseKey);
    }
  })();

  componentLoadPromises.set(promiseKey, loadPromise);
  return loadPromise;
}

/**
 * Parse a paneId and load the relevant component
 * @param {string} paneId - Pane ID
 * @returns {Promise<Object|null>} - Component data
 */
export async function loadComponentFromPaneId(paneId) {
  if (!paneId || typeof paneId !== 'string') {
    return null;
  }

  const parts = paneId.split('-');
  if (parts.length < 2) {
    return null;
  }

  const moduleType = parts[0];
  const staticIdentifier = parts[1];

  try {
    const component = await loadComponent(moduleType, staticIdentifier);
    return component ? {
      component,
      moduleType,
      staticIdentifier,
      paneId
    } : null;
  } catch (error) {
    return null;
  }
}
