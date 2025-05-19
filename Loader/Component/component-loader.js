/**
 * component-loader.js - Updated to prevent double registration
 * Functions for loading components dynamically
 */

import { ERROR_MESSAGES } from './component-constants';
import { getCanonicalKey, createRegistrationKey } from './component-core';
import registry from './component-registry';

// Map to track in-progress component loading
const componentLoadPromises = new Map();

// Set to track base components we've already seen
const processedBaseComponents = new Set();

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
  const isBaseComponent = !paneId;
  
  // For base components (non-instances), we want to track but not register them
  if (isBaseComponent) {
    // If we've already processed this base component before, just return it
    if (processedBaseComponents.has(registrationKey)) {
      console.log(`[component-loader] Base component ${registrationKey} already processed, returning from cache`);
      return registry.getComponent(registrationKey);
    }
    
    // Mark this base component as processed
    processedBaseComponents.add(registrationKey);
  } else {
    // Return paneId component if already loaded
    if (registry.hasComponent(paneId)) {
      return registry.getComponent(paneId);
    }
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

        const moduleInfo = moduleData[moduleTypeKey]?.find(m =>
          m.staticIdentifier === staticIdentifier || m.module === staticIdentifier
        );

        if (moduleInfo?.loadComponent) {
          componentModule = await moduleInfo.loadComponent();
        } else {
          throw new Error(`${ERROR_MESSAGES.NO_RESOLVER}: ${staticIdentifier}`);
        }
      }

      // Normalize to expected module shape if a raw function was returned
      if (typeof componentModule === 'function') {
        componentModule = { default: componentModule };
      }

      const Component = componentModule?.default;

      if (typeof Component !== 'function') {
        throw new Error(`${ERROR_MESSAGES.NO_VALID_COMPONENT}: ${staticIdentifier} -> ${typeof Component}`);
      }

      // Add component meta information
      Component.meta = {
        moduleType,
        staticIdentifier,
        isInstance: !!paneId,
        registeredAt: new Date().toISOString()
      };
      
      // Only register instance components (with paneId) - skip base components
      if (paneId) {
        console.log(`[component-loader] Registering instance component ${componentKey}`);
        registry.registerComponent(componentKey, Component, moduleType);
      } else {
        console.log(`[component-loader] Not registering base component ${componentKey}`);
        // Store in registry's private component map without official registration
        registry.components.set(componentKey, Component);
      }
      
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
    const component = await loadComponent(moduleType, staticIdentifier, paneId);
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