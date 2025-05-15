/**
 * component-loader.js
 * Functions for loading components dynamically
 */

import { ERROR_MESSAGES } from './component-constants';
import { getCanonicalKey, createRegistrationKey } from './component-core';
import registry from './component-registry';

/**
 * Load a component dynamically
 * @param {string} moduleType - Module type
 * @param {string} staticIdentifier - Static identifier
 * @returns {Promise<Function|null>} - Component constructor
 */
export async function loadComponent(moduleType, staticIdentifier) {
  if (!moduleType || !staticIdentifier) {
    return null;
  }
  
  const registrationKey = createRegistrationKey(moduleType, staticIdentifier);
  
  // Return if already loaded
  if (registry.hasComponent(registrationKey)) {
    return registry.getComponent(registrationKey);
  }

  try {
    let componentModule = null;
    
    // Try custom resolver if available
    if (typeof window.__VAIO_COMPONENT_RESOLVER__ === 'function') {
      const Component = await window.__VAIO_COMPONENT_RESOLVER__(staticIdentifier, moduleType);
      if (Component) {
        componentModule = { default: Component };
      } else {
        throw new Error(`${ERROR_MESSAGES.COMPONENT_LOAD_FAILED}: ${staticIdentifier}`);
      }
    } 
    // Try module data loader
    else {
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
    
    const Component = componentModule?.default;
    
    if (!Component) {
      throw new Error(`${ERROR_MESSAGES.NO_DEFAULT_EXPORT}: ${staticIdentifier}`);
    }
    
    registry.registerComponent(registrationKey, Component, moduleType);
    return Component;
    
  } catch (error) {
    registry.addError(registrationKey, error);
    return null;
  }
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