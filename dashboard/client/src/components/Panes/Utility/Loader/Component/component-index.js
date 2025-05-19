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

    const moduleData = await fetchAllModules();

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
