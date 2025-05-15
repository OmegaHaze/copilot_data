/**
 * component-index.js
 * Main interface to component system
 */

import { logExternalError } from '../logging';
import registry from './component-registry';
import { fetchAllModules } from './component-api';
import { mergeModuleData } from './component-core';
import { 
  resolvePaneComponent,
  renderComponent,
  getActiveComponents
} from './component-operations';
import { loadComponent } from './component-loader';

/**
 * Initialize the component system
 * @returns {Promise<Object>} Initialization result
 */
export async function initComponentSystem() {
  try {
    // Initialize registry
    await registry.initialize();
    
    // Fetch all modules
    const moduleData = await fetchAllModules();
    
    // Set module data in registry
    registry.setModuleData(moduleData);
    
    // Process modules for logos
    const allModules = mergeModuleData(moduleData);
    
    // Register logos
    allModules.forEach(mod => {
      if (!mod?.module) return;
      
      if (mod.logoUrl) {
        registry.setLogoUrl(mod.module, mod.logoUrl);
      }
    });
    
    return {
      success: true,
      componentCount: allModules.length,
      paneMap: getPaneMap(),
      moduleData: registry.getModuleData(),
      logoUrls: Object.fromEntries(registry.logoUrls) || {}
    };
  } catch (error) {
    logExternalError({
      message: `Component system failed to initialize: ${error.message}`,
      severity: 'high',
      source: 'ComponentSystem'
    });
    
    throw error;
  }
}

/**
 * Get map of all registered components
 * @returns {Object} Component map
 */
export function getPaneMap() {
  const paneMap = {};
  
  registry.getAllComponentKeys().forEach(key => {
    paneMap[key] = registry.getComponent(key);
  });
  
  return paneMap;
}

/**
 * Get map of all component logos
 * @returns {Object} Logo URLs by component key
 */
export function getLogoMap() {
  const logoMap = {};
  
  registry.getAllComponentKeys().forEach(key => {
    const logoUrl = registry.getLogoUrl(key);
    if (logoUrl) {
      logoMap[key] = logoUrl;
    }
  });
  
  return logoMap;
}

// Export public API
export {
  loadComponent,
  resolvePaneComponent,
  renderComponent,
  getActiveComponents
};