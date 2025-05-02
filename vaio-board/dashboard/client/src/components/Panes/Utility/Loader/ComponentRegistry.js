// ComponentRegistry.js (new unified version)
class ComponentRegistry {
  constructor() {
    // Core component storage
    this.components = new Map();    // Maps moduleType -> Component
    this.instances = new Map();     // Maps moduleType -> Set of instanceIds
    this.logoUrls = new Map();      // Maps moduleType -> logo URL
    this.errors = new Map();        // Maps moduleType -> error info
    this.loadPromises = new Map();  // Maps moduleType -> loading Promise

    // Module type categorization - all modules treated equally
    this.moduleTypes = {
      system: new Set(),
      service: new Set(), 
      user: new Set()
    };
    
    // A single place to store module data (previously duplicated)
    this.moduleData = {
      all: [],
      system: [],
      service: [],
      user: []
    };
    
    // Track initialization state
    this.initialized = false;
  }

  // Register a component
  register(moduleType, componentConstructor) {
    const key = this.getCanonicalKey(moduleType);
    this.components.set(key, componentConstructor);
    return this;
  }

  // Asynchronously load a component
  async loadComponent(moduleType, componentName = null) {
    const key = this.getCanonicalKey(moduleType);
    
    // Return immediately if already loaded
    if (this.components.has(key)) {
      return this.components.get(key);
    }
    
    // Return promise if already loading
    if (this.loadPromises.has(key)) {
      return this.loadPromises.get(key);
    }
    
    try {
      // Create component name using convention if not provided
      const compName = componentName || this.getComponentName(key);
      const importPath = `../Pane/${compName}.jsx`;
      
      // Create and store loading promise - one consistent path for all components
      const loadPromise = import(importPath)
        .then(module => {
          if (module.default) {
            this.components.set(key, module.default);
            return module.default;
          }
          throw new Error(`No default export in ${importPath}`);
        })
        .catch(err => {
          // Record error but don't attempt to load special fallbacks
          this.errors.set(key, {
            error: err.message,
            timestamp: new Date().toISOString(),
            component: compName
          });
          
          console.warn(`❌ Failed to import component ${compName} for ${key}:`, err.message);
          return null;
        })
        .finally(() => {
          // Clean up promise reference after loading completes
          this.loadPromises.delete(key);
        });
      
      this.loadPromises.set(key, loadPromise);
      return loadPromise;
    } catch (err) {
      this.errors.set(key, {
        error: err.message,
        timestamp: new Date().toISOString()
      });
      return null;
    }
  }

  // Get a component by its canonical key
  getComponent(moduleType) {
    const key = this.getCanonicalKey(moduleType);
    return this.components.get(key);
  }

  // Check if a component exists
  hasComponent(moduleType) {
    const key = this.getCanonicalKey(moduleType);
    return this.components.has(key);
  }
  
  // Register an instance
  registerInstance(moduleType, instanceId) {
    const key = this.getCanonicalKey(moduleType);
    if (!this.instances.has(key)) {
      this.instances.set(key, new Set());
    }
    this.instances.get(key).add(instanceId);
    return `${key}-${instanceId}`;
  }
  
  // Get active instances for a module type
  getInstances(moduleType) {
    const key = this.getCanonicalKey(moduleType);
    return Array.from(this.instances.get(key) || []);
  }
  
  // Set logo URL
  setLogoUrl(moduleType, url) {
    const key = this.getCanonicalKey(moduleType);
    this.logoUrls.set(key, url);
    return this;
  }
  
  // Get logo URL
  getLogoUrl(moduleType) {
    const key = this.getCanonicalKey(moduleType);
    return this.logoUrls.get(key);
  }
  
  // Get component name from module key
  getComponentName(moduleType) {
    const key = this.getCanonicalKey(moduleType);
    return `${key.charAt(0).toUpperCase()}${key.slice(1)}Pane`;
  }
  
  // Canonical key calculation in ONE place
  getCanonicalKey(moduleType) {
    if (!moduleType) return '';
    const typeStr = String(moduleType);
    // Extract base module type if this is a pane ID (e.g., "nvidia-123abc" -> "nvidia")
    const baseType = typeStr.includes('-') ? typeStr.split('-')[0] : typeStr;
    return baseType.toLowerCase();
  }
  
  // Create full pane ID
  createPaneId(moduleType, instanceId) {
    const key = this.getCanonicalKey(moduleType);
    return `${key}-${instanceId || this.generateInstanceId()}`;
  }
  
  // Generate instance ID
  generateInstanceId() {
    return Math.random().toString(36).substring(2, 8);
  }
  
  // Get all registered component keys
  getAllComponentKeys() {
    return Array.from(this.components.keys());
  }
  
  // Get error information
  getErrors() {
    return Object.fromEntries(this.errors);
  }
  
  // Clear error
  clearError(moduleType) {
    const key = this.getCanonicalKey(moduleType);
    this.errors.delete(key);
  }

  /**
   * Set the category for a module type (system, service, user)
   * @param {string} moduleType - The module type identifier
   * @param {string} category - Category (system, service, user)
   */
  setCategoryForModule(moduleType, category) {
    const key = this.getCanonicalKey(moduleType);
    
    if (!['system', 'service', 'user'].includes(category)) {
      console.warn(`Invalid category: ${category}. Must be 'system', 'service', or 'user'`);
      return;
    }
    
    // Remove from all categories first
    Object.keys(this.moduleTypes).forEach(cat => {
      this.moduleTypes[cat].delete(key);
    });
    
    // Add to specified category
    this.moduleTypes[category].add(key);
  }

  /**
   * Get the category for a module type
   * @param {string} moduleType - The module type identifier
   * @returns {string} - Category (system, service, user) or 'unknown'
   */
  getCategoryForModule(moduleType) {
    const key = this.getCanonicalKey(moduleType);
    
    for (const [category, modules] of Object.entries(this.moduleTypes)) {
      if (modules.has(key)) {
        return category;
      }
    }
    
    return 'unknown';
  }
  
  /**
   * Store module data and automatically categorize modules
   */
  setModuleData(data) {
    if (!data) return;
    
    // Store the raw data
    if (data.system) this.moduleData.system = data.system;
    if (data.service) this.moduleData.service = data.service;
    if (data.user) this.moduleData.user = data.user;
    
    // Update the combined list
    this.moduleData.all = [
      ...(this.moduleData.system || []), 
      ...(this.moduleData.service || []), 
      ...(this.moduleData.user || [])
    ];
    
    // Automatically categorize modules by type
    if (data.system) {
      data.system.forEach(module => {
        const key = this.getCanonicalKey(module.module || module.name);
        if (key) this.moduleTypes.system.add(key);
      });
    }
    
    if (data.service) {
      data.service.forEach(module => {
        const key = this.getCanonicalKey(module.module || module.name);
        if (key) this.moduleTypes.service.add(key);
      });
    }
    
    if (data.user) {
      data.user.forEach(module => {
        const key = this.getCanonicalKey(module.module || module.name);
        if (key) this.moduleTypes.user.add(key);
      });
    }
  }
  
  getModuleData() {
    return this.moduleData;
  }
  
  /**
   * Set initialization state
   * @param {boolean} state - Whether the registry is initialized
   */
  setInitialized(state) {
    this.initialized = state;
  }
  
  /**
   * Check if the registry is initialized
   * @returns {boolean} - Initialization state
   */
  isInitialized() {
    return this.initialized;
  }
}

// Export singleton
export const componentRegistry = new ComponentRegistry();

// Export commonly used functions directly for convenience and backward compatibility
export const getCanonicalComponentKey = (key) => componentRegistry.getCanonicalKey(key);
export const getComponentName = (key) => componentRegistry.getComponentName(key);
export const getModuleData = () => componentRegistry.getModuleData();
export const setModuleData = (data) => componentRegistry.setModuleData(data);

/**
 * Get the base module type from a pane ID
 * @param {string} paneId - Full pane identifier (e.g., "nvidia-123abc")
 * @returns {string|null} - Base module type or null
 */
export function getBaseModuleType(paneId) {
  return componentRegistry.getCanonicalKey(paneId);
}

/**
 * Create a full pane ID
 * @param {string} moduleType - Module type
 * @param {string} [instanceId] - Optional instance ID
 * @returns {string} - Full pane ID
 */
export function createPaneId(moduleType, instanceId) {
  return componentRegistry.createPaneId(moduleType, instanceId);
}

/**
 * Debug method to log the state of all loaded components
 */
export function debugComponentRegistry() {
  const components = componentRegistry.getAllComponentKeys();
  const errors = componentRegistry.getErrors();
  
  console.group('🔍 Component Registry Debug');
  console.log(`Loaded Components (${components.length}):`, components.join(', '));
  
  const errorKeys = Object.keys(errors);
  if (errorKeys.length > 0) {
    console.log(`Failed Components (${errorKeys.length}):`, errorKeys.join(', '));
  }
  
  console.groupEnd();
  
  return {
    loaded: components,
    missing: errorKeys,
    missingComponents: errorKeys, // For backward compatibility
    total: components.length + errorKeys.length
  };
}

/**
 * Simple component loading status diagnostic
 */
export function diagnoseComponentRegistration() {
  const loadedComponents = componentRegistry.getAllComponentKeys();
  const errors = componentRegistry.getErrors();
  const nullComponents = Object.keys(errors);
  
  // Create diagnosis report
  const diagnosis = {
    totalComponents: loadedComponents.length + nullComponents.length,
    loadedComponents,
    nullComponents,
    // Add for backward compatibility with existing code
    availableComponents: loadedComponents,
    missingComponents: nullComponents,
    timestamp: new Date().toISOString()
  };
  
  return diagnosis;
}

/**
 * Register debugging helpers on the window object
 * Only used in development mode
 */
export function registerDebugHelpers() {
  // Only expose in non-production environments
  if (process.env.NODE_ENV === 'production') return;
  
  // Return a copy of the map with additional information about component validity
  window.getPaneMap = () => {
    const enhancedMap = {};
    
    componentRegistry.getAllComponentKeys().forEach(key => {
      const comp = componentRegistry.getComponent(key);
      const error = componentRegistry.getErrors()[key];
      
      enhancedMap[key] = {
        component: comp,
        componentName: comp?.displayName || comp?.name || 'Unknown',
        type: typeof comp,
        isValid: typeof comp === 'function',
        isNull: comp === null,
        canonicalKey: key.toLowerCase(),
        ...(error ? { error } : {})
      };
    });
    
    return enhancedMap;
  };
  
  // Find any pane components that failed to load or aren't valid React components
  window.getPaneMapErrors = () => {
    const errors = componentRegistry.getErrors();
    
    return Object.entries(errors).map(([key, errorInfo]) => ({
      key,
      error: errorInfo
    }));
  };
  
  // Set up componentRegistry on window.vaioDebug for the forceReload functionality
  if (window.vaioDebug) {
    window.vaioDebug.componentRegistry = {
      // Function to force reload a component with error handling
      forceReload: async (moduleKey) => {
        try {
          if (!moduleKey) {
            window.vaioDebug.warn("Please specify a moduleType to reload");
            return false;
          }
          
          const key = componentRegistry.getCanonicalKey(moduleKey);
          console.log(`🔄 Reloading component: ${key}`);
          
          // Clear any existing errors
          componentRegistry.clearError(key);
          
          // Get the component name
          const componentName = componentRegistry.getComponentName(key);
          
          // Try to load the component
          const component = await componentRegistry.loadComponent(key, componentName);
          
          if (component) {
            window.vaioDebug.success(`Reloaded component: ${key}`);
            return true;
          } else {
            window.vaioDebug.error(`Failed to reload component: ${key}`);
            return false;
          }
        } catch(err) {
          console.error('Error in forceReloadComponent:', err);
          window.vaioDebug.error(`Error reloading component: ${err.message}`);
          return false;
        }
      },
      
      // Get debug data about component registry
      getDebugData: () => {
        try {
          const components = componentRegistry.getAllComponentKeys();
          const errors = componentRegistry.getErrors();
          
          return {
            componentCount: components.length,
            loadedCount: components.length,
            errorCount: Object.keys(errors).length,
            moduleTypes: components,
            hasErrors: Object.keys(errors).length > 0
          };
        } catch(err) {
          console.error('Error in getDebugData:', err);
          return {
            componentCount: 0,
            loadedCount: 0,
            errorCount: 0,
            moduleTypes: [],
            hasErrors: false
          };
        }
      }
    };
  }
}