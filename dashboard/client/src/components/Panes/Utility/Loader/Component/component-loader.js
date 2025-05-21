/**
 * component-loader.js
 * Functions for loading components dynamically
 */

import { ERROR_MESSAGES } from './component-constants';
import { getCanonicalKey, createRegistrationKey } from './component-core';
import registry from './component-registry';

/********************************************************************
 * 🔄 DYNAMIC COMPONENT LOADING SYSTEM 🔄
 * 
 * This file contains the core logic for dynamically loading React components.
 * It implements a lazy-loading mechanism that:
 * 
 * 1. Takes a module type and identifier
 * 2. Resolves the component using one of several methods:
 *    - Custom resolver (window.__VAIO_COMPONENT_RESOLVER__)
 *    - Registry module data
 * 3. Registers the component in the ComponentRegistry
 * 4. Returns the loaded component for rendering
 * 
 * This is how the dashboard can dynamically add components without
 * having to import them all upfront.
 ********************************************************************/

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

  /********************************************************************
   * 🔍 COMPONENT RESOLUTION PROCESS 🔍
   * 
   * This function handles the actual dynamic imports. The process is:
   * 1. Try to resolve using the window.__VAIO_COMPONENT_RESOLVER__ 
   *    - This is implemented in component-resolver.js
   *    - Uses import.meta.glob to discover components
   * 2. If that fails, try module data from registry
   * 3. Register the loaded component in the registry
   * 4. Return the component for rendering
   ********************************************************************/
  // Create loading promise
  const loadPromise = (async () => {
    const componentKey = paneId || registrationKey;
    try {
      let componentModule = null;

      // Try custom resolver if available
      if (typeof window.__VAIO_COMPONENT_RESOLVER__ === 'function') {
        console.log(`[component-loader] Resolving ${staticIdentifier} using window resolver...`);
        const Component = await window.__VAIO_COMPONENT_RESOLVER__(staticIdentifier, moduleType);
        if (Component) {
          componentModule = Component;
          console.log(`[component-loader] Successfully resolved ${staticIdentifier}`);
        } else {
          console.warn(`[component-loader] Failed to resolve ${staticIdentifier} using resolver`);
          throw new Error(`${ERROR_MESSAGES.COMPONENT_LOAD_FAILED}: ${staticIdentifier}`);
        }
      } else {
        // Try module data loader
        const moduleTypeKey = getCanonicalKey(moduleType);
        const moduleData = registry.getModuleData();

        // Modified to use case-insensitive comparison
        const moduleInfo = moduleData[moduleTypeKey]?.find(m =>
          m.staticIdentifier?.toLowerCase() === staticIdentifier.toLowerCase() || 
          m.module?.toLowerCase() === staticIdentifier.toLowerCase() ||
          m.paneComponent?.toLowerCase() === staticIdentifier.toLowerCase()
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

      const Component = componentModule?.default;

      if (typeof Component !== 'function') {
        throw new Error(`${ERROR_MESSAGES.NO_VALID_COMPONENT}: ${staticIdentifier} -> ${typeof Component}`);
      }

      console.log(`[component-loader] Registering component ${componentKey} (from ${paneId ? 'paneId' : 'registration key'})`);
      
      // Add component meta information
      Component.meta = {
        moduleType,
        staticIdentifier,
        isInstance: !!paneId,
        registeredAt: new Date().toISOString()
      };

      registry.registerComponent(componentKey, Component, moduleType, paneId ? true : false);
      console.log(`[component-loader] Successfully registered ${componentKey}`);
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

  /********************************************************************
   * 🔄 PANE ID PARSING 🔄
   * 
   * PaneIDs follow the format: "TYPE-IDENTIFIER-INSTANCEID"
   * 
   * This function extracts the module type and identifier from the paneId,
   * then loads the corresponding component. This is how the rendering
   * system knows which React component to show for each pane.
   ********************************************************************/
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
