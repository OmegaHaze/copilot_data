/**
 * component-index.js
 * Main interface to component system
 */

import registry from './component-registry';
import { fetchAllModules } from './component-api';
import { mergeModuleData, validateModulesCollection } from './component-core';
import { ErrorType, ErrorSeverity } from '../../../../Error-Handling/Diagnostics/types/errorTypes';
import { errorHandler } from '../../../../Error-Handling/utils/errorHandler';
import { MODULE_TYPES } from './component-constants';
import { discoveredModuleData } from '../../Pane/component-resolver';

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

/**
 * Initialize the component system
 * @returns {Promise<Object>} Initialization result
 */
export async function initComponentSystem() {
  try {
    await registry.initialize();

    registry.setErrorHandler((message, type, severity, context) => {
      const errorType = ErrorType[type] || ErrorType.SYSTEM;
      const errorSeverity = ErrorSeverity[severity] || ErrorSeverity.MEDIUM;
      errorHandler.showError(message, errorType, errorSeverity, context);
    });

    // Try to fetch from API
    let moduleData = await fetchAllModules();

    // Check if backend returned empty modules but we have discovered components
    const backendEmpty = 
      (!moduleData[MODULE_TYPES.SYSTEM].length && 
       !moduleData[MODULE_TYPES.SERVICE].length && 
       !moduleData[MODULE_TYPES.USER].length);
    
    const hasDiscoveredModules = 
      (discoveredModuleData[MODULE_TYPES.SYSTEM].length > 0 || 
       discoveredModuleData[MODULE_TYPES.SERVICE].length > 0 || 
       discoveredModuleData[MODULE_TYPES.USER].length > 0);

    // Populate the database with discovered components if backend is empty
    if (backendEmpty && hasDiscoveredModules) {
      console.log("[component-index] Backend returned empty modules but components were discovered - creating modules");
      
      // Create modules in backend for each discovered component
      for (const type in discoveredModuleData) {
        for (const componentName of discoveredModuleData[type]) {
          try {
            const response = await fetch(`/api/modules/${type}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                name: componentName,
                staticIdentifier: componentName,
                paneComponent: componentName,
                visible: true,
                module: componentName,
                module_type: type,
                description: `${componentName} component`,
                supportsStatus: type === MODULE_TYPES.SERVICE
              })
            });
            
            if (response.ok) {
              console.log(`[component-index] Created module for ${componentName}`);
            } else {
              console.warn(`[component-index] Failed to create module for ${componentName}: ${response.status}`);
            }
          } catch (err) {
            console.error(`[component-index] Error creating module for ${componentName}:`, err);
          }
        }
      }
      
      // Refetch modules after creation
      moduleData = await fetchAllModules();
    }

    if (!validateModulesCollection(moduleData)) {
      throw new Error('Invalid module data received from API');
    }

    registry.setModuleData(moduleData);

    const allModules = mergeModuleData(moduleData);

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
    errorHandler.showError(
      `Component system failed to initialize: ${error.message}`,
      ErrorType.SYSTEM,
      ErrorSeverity.HIGH,
      {
        source: 'ComponentSystem',
        stack: error.stack,
        error: error.toString()
      }
    );

    throw error;
  }
}

// Listen for component discovery events from resolver
if (typeof window !== 'undefined') {
  window.addEventListener('vaio:components-discovered', (event) => {
    console.log('[component-index] Received component discovery event:', event.detail);
    // This could trigger initComponentSystem automatically if needed
  });
}

// Import after declaration to prevent circular deps
import {
  resolvePaneComponent,
  renderComponent,
  getActiveComponents
} from './component-operations';

import { loadComponent } from './component-loader';

// Export public API
export {
  loadComponent,
  resolvePaneComponent,
  renderComponent,
  getActiveComponents,
  MODULE_TYPES
};