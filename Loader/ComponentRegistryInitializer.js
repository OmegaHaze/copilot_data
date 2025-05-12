// ComponentRegistryInitializer.js - Single entry point for loading all components
import { componentRegistry } from './ComponentRegistry.js';
import { errorHandler } from '../../../Error-Handling/utils/errorHandler';
import { ErrorType, ErrorSeverity } from '../../../Error-Handling/Diagnostics/types/errorTypes';

// Setup error handler once
if (componentRegistry) {
  componentRegistry.setErrorHandler((message, type, severity, context) => {
    const errorType = ErrorType[type] || ErrorType.SYSTEM;
    const errorSeverity = ErrorSeverity[severity] || ErrorSeverity.MEDIUM;
    errorHandler.showError(message, errorType, errorSeverity, context);
  });
}

// Constants for error messages
const ERROR_MESSAGES = {
  NO_COMPONENTS: 'Failed to load any components. Check network connectivity and browser console.',
  PARTIAL_FAILURE: (count) => `${count} components failed to load. Check browser console for details.`
};

// Environment detection - safer approach than relying on process.env
const DEV_MODE = window.location.hostname === 'localhost' || 
                window.location.hostname === '127.0.0.1';

/**
 * Initialize the component registry with all available modules
 * @returns {Promise<Object>} Initialization result with component data
 */
export async function initializeComponentRegistry() {
  try {
    console.log('Initializing component registry...');
    
    // Fetch all modules from the API in parallel with timeout
    const fetchModules = async (type) => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
        
        const response = await fetch(`/api/modules?module_type=${type}`, {
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          console.error(`Failed to fetch ${type} modules: ${response.status}, ${response.statusText}`);
          return [];
        }
        
        return await response.json();
      } catch (fetchErr) {
        console.error(`Network error fetching ${type} modules:`, fetchErr);
        return [];
      }
    };
    
    // Fetch all module types in parallel
    const [SYSTEM, SERVICE, USER] = await Promise.all([
      fetchModules('SYSTEM'),
      fetchModules('SERVICE'),
      fetchModules('USER')
    ]);
    
    // Combine all modules and store in registry - force uppercase for consistency
    const allModules = [...SYSTEM, ...SERVICE, ...USER];
    componentRegistry.setModuleData({
      SYSTEM: SYSTEM,
      SERVICE: SERVICE,
      USER: USER
    });
    
    console.log(`Processing ${allModules.length} modules for component loading`);
    
    if (allModules.length === 0) {
      console.warn('No modules found in API responses.');
    }
    
    // Track loading results
    const loadPromises = [];
    const loadDetails = [];
    
    // Load components from the API response
    for (const mod of allModules) {
      // Skip invalid modules
      if (!mod || !mod.module) {
        console.warn('Skipping invalid module:', mod);
        continue;
      }
    
      // Get canonical key - always UPPERCASE
      const key = componentRegistry.getCanonicalKey(mod.module || mod.name);
      
      // Store logo URL if available
      if (mod.logoUrl) {
        componentRegistry.setLogoUrl(key, mod.logoUrl);
      }
      
      // Set module category based on module_type - ensure UPPERCASE
      const moduleType = (mod.module_type || 'SYSTEM').toUpperCase();
      if (['SYSTEM', 'SERVICE', 'USER'].includes(moduleType)) {
        componentRegistry.setCategoryForModule(key, moduleType);
      }
      
      // Queue component loading
      const componentName = mod.paneComponent || componentRegistry.getComponentName(key);
      loadPromises.push(componentRegistry.loadComponent(key, componentName));
      loadDetails.push({ 
        key, 
        component: componentName, 
        source: mod.paneComponent ? 'api' : 'convention' 
      });
    }
    
    console.log('Component load queue:', loadDetails.map(d => d.key).join(', '));
    
    // Wait for all components to load with a reasonable timeout
    const results = await Promise.allSettled(loadPromises);
    
    // Count successes and failures with detailed reporting
    const succeededComponents = [];
    const failedComponents = [];
    
    results.forEach((result, index) => {
      const detail = loadDetails[index];
      if (result.status === 'fulfilled' && result.value) {
        succeededComponents.push(detail);
      } else {
        failedComponents.push({
          ...detail,
          error: result.reason?.message || 'Component loading failed'
        });
      }
    });
    
    // Log summary of results
    console.log(`Loaded ${succeededComponents.length} components successfully, ${failedComponents.length} failed`);
    
    // Initialize the registry
    await componentRegistry.initialize();
    
    // Register debug helpers in development mode only
    if (DEV_MODE) {
      registerDebugHelpers();
    }
    
    // Force load critical components if none were loaded successfully
    if (succeededComponents.length === 0) {
      console.warn('No components loaded successfully. Attempting to load critical components...');
      try {

        componentRegistry.setCategoryForModule('SYSTEM', 'SYSTEM');
        console.log('Forced loading of critical components complete.');
      } catch (err) {
        console.error('Failed to force load critical components:', err);
      }
    }
    
    // Create helpful error message if needed
    let errorMessage = null;
    if (succeededComponents.length === 0) {
      errorMessage = ERROR_MESSAGES.NO_COMPONENTS;
    } else if (failedComponents.length > 0) {
      errorMessage = ERROR_MESSAGES.PARTIAL_FAILURE(failedComponents.length);
    }
    
    return {
      success: succeededComponents.length > 0,
      componentCount: componentRegistry.getAllComponentKeys().length,
      errors: componentRegistry.getErrors(),
      errorMessage,
      paneMap: getPaneMap(),
      logoUrls: getLogoMap(),
      moduleData: componentRegistry.getModuleData(),
      loadedComponents: succeededComponents.map(c => c.key),
      failedComponents: failedComponents.map(c => c.key)
    };
  } catch (err) {
    console.error('Failed to initialize component registry:', err);
    errorHandler.showError(
      `Component registry initialization failed: ${err.message}`,
      ErrorType.SYSTEM,
      ErrorSeverity.HIGH,
      {
        componentName: 'ComponentRegistryInitializer',
        action: 'initializeComponentRegistry',
        error: err.toString(),
        stack: err.stack
      }
    );
    
    return {
      success: false,
      error: err.message
    };
  }
}

/**
 * Register essential built-in components manually
 * This ensures that critical components are always available
 * @returns {Promise<void>}
 */
async function registerBuiltInComponents() {
  try {
    console.log('Registering built-in components...');
    
    // SystemPane components
    const systemComponents = [
      { moduleType: 'SYSTEM', name: 'SupervisorPane' },
    ];
    
    // ServicePane components
    const serviceComponents = [
      { moduleType: 'SERVICE', name: 'NvidiaPane' },
      { moduleType: 'SERVICE', name: 'PostgresPane' }
    ];
    
    // Register system components
    for (const comp of systemComponents) {
      try {
        await componentRegistry.loadComponent(comp.moduleType);
        componentRegistry.setCategoryForModule(comp.moduleType, 'SYSTEM');
      } catch (err) {
        console.warn(`Failed to register system component ${comp.name}:`, err);
      }
    }
    
    // Register service components
    for (const comp of serviceComponents) {
      try {
        await componentRegistry.loadComponent(comp.moduleType);
        componentRegistry.setCategoryForModule(comp.moduleType, 'SERVICE');
      } catch (err) {
        console.warn(`Failed to register service component ${comp.name}:`, err);
      }
    }
  } catch (err) {
    console.error('Error registering built-in components:', err);
  }
}

/**
 * Get pane component map for ServiceGrid
 * @returns {Object} Map of module types to component constructors
 */
export function getPaneMap() {
  const components = {};
  
  componentRegistry.getAllComponentKeys().forEach(key => {
    components[key] = componentRegistry.getComponent(key);
  });
  
  return components;
}

/**
 * Get logo URL map for components
 * @returns {Object} Map of module types to logo URLs
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

/**
 * Register debug helpers on the window object
 * Only for development mode
 */
function registerDebugHelpers() {
  window.componentRegistry = componentRegistry;
  
  // Map legacy window methods to registry functions
  window.getPaneMap = () => {
    const enhancedMap = {};
    
    componentRegistry.getAllComponentKeys().forEach(key => {
      const comp = componentRegistry.getComponent(key);
      
      enhancedMap[key] = {
        component: comp,
        componentName: comp?.displayName || comp?.name || 'Unknown',
        type: typeof comp,
        isValid: typeof comp === 'function',
        isNull: comp === null,
        canonicalKey: key
      };
    });
    
    return enhancedMap;
  };
  
  // Function to get component loading errors
  window.getPaneMapErrors = () => {
    return Object.entries(componentRegistry.getErrors()).map(([key, errorInfo]) => ({
      key,
      error: errorInfo
    }));
  };
}