/**
 * ComponentLoader.js
 * Handles component resolution and configuration
 */

import { logExternalError } from '../logging';
import componentRegistry from './ComponentRegistry';

/**
 * Validate a pane ID format
 * @param {string} paneId 
 * @returns {boolean}
 */
function isValidPaneId(paneId) {
  if (typeof paneId !== 'string' || !paneId.includes('-')) {
    return false;
  }
  
  const parts = paneId.split('-');
  return parts.length >= 3 && parts[0].length > 0 && parts[1].length > 0;
}

/**
 * Initialize component registry
 * @returns {Promise<Object>}
 */
export async function initComponentLoader() {
  try {
    // Import initializer dynamically to avoid circular dependency
    const { initializeComponentRegistry, getPaneMap } = await import('./ComponentRegistryInitializer');
    const result = await initializeComponentRegistry();
    
    return {
      success: result.success,
      componentCount: result.componentCount,
      paneMap: getPaneMap(),
      moduleData: componentRegistry.getModuleData(),
      logoUrls: Object.fromEntries(componentRegistry.logoUrls) || {}
    };
  } catch (error) {
    logExternalError({
      message: `Component loader failed to initialize: ${error.message}`,
      severity: 'high',
      source: 'ComponentLoader'
    });
    
    throw error;
  }
}

/**
 * Resolves a paneId into configuration for rendering a component.
 * @param {string} paneId - Format: moduleType-staticIdentifier-instanceId
 * @param {Object} moduleData - All available module metadata
 * @returns {Promise<Object|null>} Component config for rendering (or fallback)
 */
export async function resolvePaneComponent(paneId, moduleData = {}) {
  if (!isValidPaneId(paneId)) {
    logExternalError({
      message: `Invalid paneId format: ${paneId}`,
      source: 'ComponentLoader'
    });
    
    return null;
  }

  // Extract moduleType and staticIdentifier from paneId
  const parts = paneId.split('-');
  const moduleType = parts[0];
  const staticIdentifier = parts.length > 1 ? parts[1] : moduleType;

  try {
    // Dynamic import using import() instead of require()
    const ComponentManager = await import('./ComponentManager.js');
    const { 
      component: ResolvedPane, 
      staticIdentifier: moduleStaticId 
    } = await ComponentManager.loadModuleComponent(moduleType, paneId);
    
    if (!ResolvedPane) {
      throw new Error(`No component found for moduleType "${moduleType}"`);
    }

    // Use staticIdentifier from component manager if available, otherwise use from paneId
    const finalStaticId = moduleStaticId || staticIdentifier;

    // Return config object instead of JSX
    return {
      Component: ResolvedPane,
      props: {
        key: paneId,
        slug: paneId,
        moduleType: moduleType,
        staticIdentifier: finalStaticId,
        moduleData: {
          ...moduleData,
          staticIdentifier: finalStaticId
        }
      }
    };
  } catch (err) {
    logExternalError({
      message: err.message,
      source: 'ComponentLoader'
    });
    
    return null;
  }
}

/**
 * Get pane map
 * @returns {Object}
 */
export function getPaneMap() {
  const paneMap = {};
  
  componentRegistry.getAllComponentKeys().forEach(key => {
    paneMap[key] = componentRegistry.getComponent(key);
  });
  
  return paneMap;
}

/**
 * Get logo map
 * @returns {Object}
 */
export function getLogoMap() {
  const logoMap = {};
  
  componentRegistry.getAllComponentKeys().forEach(key => {
    const logoUrl = componentRegistry.getLogoUrl(key);
    if (logoUrl) {
      logoMap[key] = logoUrl;
    }
  });
  
  return logoMap;
}