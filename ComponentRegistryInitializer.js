/**
 * ComponentRegistryInitializer.js
 * Handles one-time initialization of component registry
 */

import componentRegistry from './ComponentRegistry.jsx';
import { errorHandler } from '../../../Error-Handling/utils/errorHandler';
import { ErrorType, ErrorSeverity } from '../../../Error-Handling/Diagnostics/types/errorTypes';

// Set up error handler
componentRegistry.setErrorHandler((message, type, severity, context) => {
  const errorType = ErrorType[type] || ErrorType.SYSTEM;
  const errorSeverity = ErrorSeverity[severity] || ErrorSeverity.MEDIUM;
  errorHandler.showError(message, errorType, errorSeverity, context);
});

// Error messages
const ERROR_MESSAGES = {
  NO_COMPONENTS: 'Failed to load any components. Check network connectivity and browser console.',
  PARTIAL_FAILURE: (count) => `${count} components failed to load. Check browser console for details.`
};

/**
 * Fetch modules from API
 * @param {string} type 
 * @returns {Promise<Array>}
 */
async function fetchModules(type) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(`/api/modules?module_type=${type}`, {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.error(`Failed to fetch ${type} modules: ${response.status}`);
      return [];
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error fetching ${type} modules:`, error);
    return [];
  }
}

/**
 * Initialize component registry
 * @returns {Promise<Object>}
 */
export async function initializeComponentRegistry() {
  try {
    console.log('Initializing component registry...');
    
    // Initialize registry
    await componentRegistry.initialize();
    
    // Fetch modules from API
    const [SYSTEM, SERVICE, USER] = await Promise.all([
      fetchModules('SYSTEM'),
      fetchModules('SERVICE'),
      fetchModules('USER')
    ]);
    
    // Set module data
    componentRegistry.setModuleData({
      SYSTEM,
      SERVICE,
      USER
    });
    
    // Process modules
    const allModules = [...SYSTEM, ...SERVICE, ...USER];
    const succeededComponents = [];
    const failedComponents = [];
    
    // Register logos and categories
    allModules.forEach(mod => {
      if (!mod || !mod.module) return;
      
      const key = componentRegistry.getCanonicalKey(mod.module);
      
      // Set logo URL
      if (mod.logoUrl) {
        componentRegistry.setLogoUrl(key, mod.logoUrl);
      }
      
      // Set category
      const moduleType = (mod.module_type || 'SYSTEM').toUpperCase();
      if (['SYSTEM', 'SERVICE', 'USER'].includes(moduleType)) {
        componentRegistry.setCategoryForModule(key, moduleType);
      }
    });
    
    // Load all components
    const loadPromises = allModules.map(async mod => {
      if (!mod || !mod.module) return null;
      
      const key = componentRegistry.getCanonicalKey(mod.module);
      
      try {
        // MUST have a staticIdentifier or paneComponent - no automatic derivation
        const staticIdentifier = mod.staticIdentifier || mod.paneComponent;
        
        if (!staticIdentifier) {
          console.error(`No staticIdentifier or paneComponent for module ${mod.name} (${mod.module})`);
          failedComponents.push(key);
          return null;
        }
        
        console.log(`Loading component for ${mod.name}: using explicit identifier ${staticIdentifier}`);
        
        const component = await componentRegistry.loadComponent(key, staticIdentifier);
        if (component) {
          succeededComponents.push(key);
          return component;
        } else {
          failedComponents.push(key);
          return null;
        }
      } catch (error) {
        console.error(`Failed to load component ${key}:`, error);
        failedComponents.push(key);
        return null;
      }
    });
    
    // Wait for all component loads to complete
    await Promise.all(loadPromises);
    
    // Create error message if needed
    let errorMessage = null;
    
    if (succeededComponents.length === 0) {
      errorMessage = ERROR_MESSAGES.NO_COMPONENTS;
    } else if (failedComponents.length > 0) {
      errorMessage = ERROR_MESSAGES.PARTIAL_FAILURE(failedComponents.length);
    }
    
    return {
      success: succeededComponents.length > 0,
      componentCount: succeededComponents.length,
      errors: componentRegistry.getErrors(),
      errorMessage,
      loadedComponents: succeededComponents,
      failedComponents
    };
  } catch (error) {
    console.error('Failed to initialize component registry:', error);
    
    errorHandler.showError(
      `Component registry initialization failed: ${error.message}`,
      ErrorType.SYSTEM,
      ErrorSeverity.HIGH,
      {
        componentName: 'ComponentRegistryInitializer',
        action: 'initializeComponentRegistry',
        error: error.toString()
      }
    );
    
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get pane map for ServiceGrid
 * @returns {Object}
 */
export function getPaneMap() {
  const components = {};
  
  componentRegistry.getAllComponentKeys().forEach(key => {
    components[key] = componentRegistry.getComponent(key);
  });
  
  return components;
}

/**
 * Get logo URL map
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