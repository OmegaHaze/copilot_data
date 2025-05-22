/**
 * component-index.js
 * Main interface to the component system
 */

import registry from './component-registry';
import { ErrorType, ErrorSeverity } from '../../../../Error-Handling/Diagnostics/types/errorTypes';
import { errorHandler } from '../../../../Error-Handling/utils/errorHandler';
import { MODULE_TYPES } from '../Module/module-constants';

/**
 * Get map of all registered components
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
 */
export async function initComponentSystem() {
  try {
    await registry.initialize();

    registry.setErrorHandler((message, type, severity, context) => {
      const errorType = ErrorType[type] || ErrorType.SYSTEM;
      const errorSeverity = ErrorSeverity[severity] || ErrorSeverity.MEDIUM;
      errorHandler.showError(message, errorType, errorSeverity, context);
    });

    const moduleData = registry.getModuleData();

    return {
      success: true,
      componentCount: registry.getAllComponentKeys().length,
      paneMap: getPaneMap(),
      moduleData,
      logoUrls: Object.fromEntries(registry.logoUrls) || {}
    };
  } catch (error) {
    errorHandler.showError(
      `Component system failed to initialize: ${error.message}`,
      ErrorType.SYSTEM,
      ErrorSeverity.HIGH,
      { source: 'ComponentSystem', error: error.toString() }
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