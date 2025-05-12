/**
 * Manages the registration, loading, and lifecycle of all components in the dashboard.
 * Provides centralized component access while avoiding circular dependencies.
 */
class ComponentRegistry {
  constructor() {
    this.components = new Map();
    this.instances = new Map();
    this.logoUrls = new Map();
    this.errors = new Map();
    this.loadPromises = new Map();
    this.errorListener = null;

    this.moduleTypes = {
      SYSTEM: new Set(),
      SERVICE: new Set(),
      USER: new Set(),
    };

    this.moduleData = {
      ALL: [],
      SYSTEM: [],
      SERVICE: [],
      USER: [],
    };

    this.initialized = false;
    this.initializationPromise = null;
  }
  
  /**
   * Set error handling function to break circular dependency
   * @param {Function} handlerFn - Error handler function
   */
  setErrorHandler(handlerFn) {
    if (typeof handlerFn === 'function') {
      this.errorListener = handlerFn;
    }
  }
  
  /**
   * Internal method to report errors without direct dependency
   * @param {string} message - Error message
   * @param {string} errorType - Type of error
   * @param {string} severity - Error severity 
   * @param {Object} context - Error context
   * @private
   */
  _reportError(message, errorType = 'SYSTEM', severity = 'MEDIUM', context = {}) {
    // Log to console always
    console.error(`ComponentRegistry: ${message}`, context);
    
    // If we have an error handler registered, use it
    if (typeof this.errorListener === 'function') {
      try {
        this.errorListener(message, errorType, severity, context);
      } catch (err) {
        // Prevent error handler errors from breaking the registry
        console.error('Error in registry error handler:', err);
      }
    }
  }
  
  /**
   * Initialize the component registry
   * This method ensures the registry is properly set up and only initialized once
   * @returns {Promise<boolean>} True if initialization succeeds
   */
  initialize() {
    // Return existing initialization if in progress
    if (this.initializationPromise) {
      return this.initializationPromise;
    }
    
    // If already initialized, just return a resolved promise
    if (this.initialized) {
      return Promise.resolve(true);
    }
    
    // Simple initialization without complex promise chains
    this.initializationPromise = Promise.resolve()
      .then(() => {
        this.initialized = true;
        return true;
      })
      .catch(error => {
        this._reportError(
          `Initialization failed: ${error.message}`,
          'SYSTEM', 
          'HIGH',
          {
            action: 'initialize',
            error
          }
        );
        this.initialized = true; // Mark as initialized even on error
        return false;
      })
      .finally(() => {
        this.initializationPromise = null;
      });
    
    return this.initializationPromise;
  }

  /**
   * Register a component constructor for a module type
   * @param {string} moduleType - The module type identifier
   * @param {Function} componentConstructor - The component constructor
   * @returns {ComponentRegistry} - Returns this for chaining
   */
  register(moduleType, componentConstructor) {
    if (!moduleType) {
      console.warn('Attempted to register component with empty module type');
      return this;
    }
    
    const key = this.getCanonicalKey(moduleType);
    
    // Validate component constructor
    if (typeof componentConstructor !== 'function') {
      console.warn(`Invalid component constructor for ${key}:`, componentConstructor);
      return this;
    }
    
    this.components.set(key, componentConstructor);
    console.log(`Registered component for ${key}`);
    return this;
  }

  /**
   * Register an instance of a module
   * @param {string} moduleType - The module type
   * @param {string} instanceId - The instance ID
   * @returns {string} The full pane ID
   */
  registerInstance(moduleType, instanceId) {
    // Fix: Add input validation
    if (!moduleType || !instanceId) {
      console.warn('Invalid moduleType or instanceId for registerInstance');
      return '';
    }
    
    const key = this.getCanonicalKey(moduleType);
    if (!this.instances.has(key)) {
      this.instances.set(key, new Set());
    }
    this.instances.get(key).add(instanceId);
    return `${key}-${instanceId}`;
  }

  /**
   * Get a component by module type
   * @param {string} moduleType - The module type
   * @returns {Function|null} The component constructor or null
   */
  getComponent(moduleType) {
    // Fix: Add null check for moduleType
    if (!moduleType) return null;
    return this.components.get(this.getCanonicalKey(moduleType)) || null;
  }

  /**
   * Check if a component is registered
   * @param {string} moduleType - The module type
   * @returns {boolean} True if the component is registered
   */
  hasComponent(moduleType) {
    // Fix: Add null check for moduleType
    if (!moduleType) return false;
    return this.components.has(this.getCanonicalKey(moduleType));
  }

  /**
   * Get all instances of a module type
   * @param {string} moduleType - The module type
   * @returns {Array<string>} Instance IDs
   */
  getInstances(moduleType) {
    return Array.from(this.instances.get(this.getCanonicalKey(moduleType)) || []);
  }

  /**
   * Set the logo URL for a module type
   * @param {string} moduleType - The module type
   * @param {string} url - The logo URL
   * @returns {ComponentRegistry} - Returns this for chaining
   */
  setLogoUrl(moduleType, url) {
    this.logoUrls.set(this.getCanonicalKey(moduleType), url);
    return this;
  }

  /**
   * Get the logo URL for a module type
   * @param {string} moduleType - The module type
   * @returns {string|null} The logo URL or null
   */
  getLogoUrl(moduleType) {
    return this.logoUrls.get(this.getCanonicalKey(moduleType)) || null;
  }

  /**
   * Get the component name for a module type
   * @param {string} moduleType - The module type
   * @returns {string} The component name
   */
  getComponentName(moduleType) {
    // Fix: Add null check for moduleType
    if (!moduleType) return '';
    
    // Get canonical key without assuming specific naming conventions
    const key = this.getCanonicalKey(moduleType);
    
    // Convert to title case for component name
    return key.charAt(0).toUpperCase() + key.slice(1);
  }

  /**
   * Get the canonical key for a module type
   * @param {string} moduleType - The module type
   * @returns {string} The canonical key
   */
  getCanonicalKey(moduleType) {
    // Fix: Improved null/undefined handling
    if (!moduleType) return '';
    
    // Handle non-string input safely
    const typeStr = String(moduleType);
    
    // Extract module type from ID format (type-staticId-instance or type-instance)
    // Always return uppercase to match Python enum values
    return typeStr.includes('-') ? typeStr.split('-')[0].toUpperCase() : typeStr.toUpperCase();
  }

  /**
   * Create a pane ID from module type, static identifier, and instance ID
   * @param {string} moduleType - The module type (SYSTEM, SERVICE, USER)
   * @param {string} staticIdentifier - Static component identifier (e.g., SupervisorPane)
   * @param {string} [instanceId] - Optional instance ID for multiple instances
   * @returns {string} The pane ID in format: MODULETYPE-STATICID-INSTANCEID
   */
  createPaneId(moduleType, staticIdentifier, instanceId) {
    // Fix: Add input validation
    if (!moduleType || !staticIdentifier) {
      console.warn('Both moduleType and staticIdentifier are required for createPaneId');
      return '';
    }
    
    const type = this.getCanonicalKey(moduleType);
    const instance = instanceId || this.generateInstanceId();
    return `${type}-${staticIdentifier}-${instance}`;
  }

  /**
   * Generate a random instance ID
   * @returns {string} A random instance ID
   */
  generateInstanceId() {
    // Fix: More reliable ID generation than Math.random().toString(36).substring(2, 8)
    return Date.now().toString(36) + Math.floor(Math.random() * 10000).toString(36);
  }

  /**
   * Get all registered component keys
   * @returns {Array<string>} Component keys
   */
  getAllComponentKeys() {
    return Array.from(this.components.keys());
  }

  /**
   * Get all registration errors
   * @returns {Object} Error details by component key
   */
  getErrors() {
    return Object.fromEntries(this.errors);
  }

  /**
   * Clear an error for a module type
   * @param {string} moduleType - The module type
   */
  clearError(moduleType) {
    this.errors.delete(this.getCanonicalKey(moduleType));
  }

  /**
   * Set the category for a module
   * @param {string} moduleType - The module type
   * @param {string} category - The category (SYSTEM, SERVICE, USER)
   */
  setCategoryForModule(moduleType, category) {
    // Fix: Add null check for moduleType
    if (!moduleType || !category) return;
    
    const key = this.getCanonicalKey(moduleType);
    // Make sure category is uppercase
    const upperCategory = category.toUpperCase();
    if (!['SYSTEM', 'SERVICE', 'USER'].includes(upperCategory)) {
      this._reportError(
        `Invalid module category: ${upperCategory}`,
        'SYSTEM',
        'MEDIUM',
        {
          componentName: 'ComponentRegistry',
          action: 'setCategoryForModule',
          metadata: {
            moduleType,
            category,
            validCategories: ['SYSTEM', 'SERVICE', 'USER']
          }
        }
      );
      return;
    }
    
    // Clear the key from all category sets
    Object.values(this.moduleTypes).forEach(set => set.delete(key));
    
    // Add to the appropriate category
    this.moduleTypes[upperCategory].add(key);
  }

  /**
   * Get the category for a module
   * @param {string} moduleType - The module type
   * @returns {string} The category (SYSTEM, SERVICE, USER) or 'unknown'
   */
  getCategoryForModule(moduleType) {
    // Fix: Add null check for moduleType
    if (!moduleType) return 'unknown';
    
    const key = this.getCanonicalKey(moduleType);
    for (const [category, modules] of Object.entries(this.moduleTypes)) {
      if (modules.has(key)) return category;
    }
    return 'unknown';
  }
  
  /**
   * Force reload a component by name, clearing any cached instances
   * This is useful for retry operations and error recovery
   * @param {string} moduleType - The module type or name to reload
   * @returns {Promise<Function|null>} - The reloaded component or null on failure
   */
  async reloadComponent(moduleType) {
    if (!moduleType) return null;
    
    const key = this.getCanonicalKey(moduleType);
    
    // Clear any existing component and error from cache
    this.components.delete(key);
    this.errors.delete(key);
    
    // If there's an ongoing load, wait for it to complete first
    if (this.loadPromises.has(key)) {
      try {
        await this.loadPromises.get(key);
      } catch (e) {
        // Ignore errors from the existing promise
        console.warn(`Ignored error from previous load promise for ${key}:`, e);
      }
    }
    
    // Clear any existing loading promise
    this.loadPromises.delete(key);
    
    // Log the reload attempt
    console.log(`Attempting to reload component: ${moduleType}`);
    
    // Try loading the component again
    return this.loadComponent(moduleType);
  }

  /**
   * Load a component dynamically by module type
   * @param {string} moduleType - The module type or name
   * @param {string} [componentName] - Optional custom component name, default derived from moduleType
   * @param {boolean} [forceReload=false] - Whether to force reload even if already loaded
   * @returns {Promise<Function|null>} - The loaded component or null on failure
   */
  async loadComponent(moduleType, componentName, forceReload = false) {
    if (!moduleType) {
      this._reportError('Cannot load component: moduleType is required', 'SYSTEM', 'MEDIUM');
      return null;
    }
    
    const key = this.getCanonicalKey(moduleType);
    
    // If already loaded and not forcing reload, return cached component
    if (!forceReload && this.components.has(key)) {
      return this.components.get(key);
    }
    
    // If there's an ongoing load, return that promise
    if (this.loadPromises.has(key) && !forceReload) {
      return this.loadPromises.get(key);
    }
    
    // Determine which component name to load (explicit or derived from moduleType)
    const finalComponentName = componentName || this.getComponentName(key);
    
    // Create a promise to load the component
    const loadPromise = (async () => {
      try {
        console.log(`Loading component: ${key} (${finalComponentName})`);
        
        // First try loading from correct module type directory
        let component = null;
        const category = this.getCategoryForModule(key) || 'SYSTEM';
        
        try {
          // Primary path: look in the Pane directory first since that's where our components are
          const path = `./Pane/${finalComponentName}.jsx`;
          console.log(`Attempting to import from: ${path}`);
          const module = await import(/* @vite-ignore */ path);
          component = module.default;
        } catch (moduleErr) {
          console.error(`Failed to load component ${finalComponentName}:`, moduleErr);
          throw new Error(`Component ${finalComponentName} not found in primary location`);
        }
        
        if (!component || typeof component !== 'function') {
          throw new Error(`Loaded module for ${finalComponentName} is not a valid component`);
        }
        
        // Store the component in the registry
        this.components.set(key, component);
        this.clearError(key);
        
        console.log(`Successfully loaded component: ${key}`);
        return component;
      } catch (err) {
        // Store error for diagnostics
        this.errors.set(key, {
          error: err.message,
          timestamp: new Date().toISOString(),
          componentName: finalComponentName
        });
        
        // Report error through handler
        this._reportError(`Failed to load component ${finalComponentName}: ${err.message}`, 'SYSTEM', 'MEDIUM', {
          moduleType: key,
          componentName: finalComponentName,
          error: err
        });
        
        throw err;
      } finally {
        // Clean up the promise regardless of outcome
        this.loadPromises.delete(key);
      }
    })();
    
    // Store the promise for future reference
    this.loadPromises.set(key, loadPromise);
    
    return loadPromise;
  }

  /**
   * Load multiple modules from their IDs
   * @param {Array<string>} moduleIds - Array of module IDs (e.g., ["SYSTEM-SupervisorPane-123"])
   * @returns {Promise<Array>} - Array of results
   */
  async loadModulesFromIds(moduleIds) {
    if (!Array.isArray(moduleIds) || moduleIds.length === 0) {
      return [];
    }
    
    console.log(`Loading ${moduleIds.length} modules from IDs:`, moduleIds);
    
    const loadPromises = moduleIds.map(id => {
      // Extract module type from ID
      const parts = id.split('-');
      if (parts.length < 1) return Promise.resolve(null);
      
      const moduleType = parts[0];
      const staticIdentifier = parts.length > 1 ? parts[1] : null;
      
      // Queue loading the component
      return this.loadComponent(moduleType)
        .catch(err => {
          console.warn(`Failed to load module ${id}:`, err);
          return null;
        });
    });
    
    return Promise.all(loadPromises);
  }

  /**
   * Set module data for all categories
   * @param {Object} data - Module data organized by category
   */
  setModuleData(data) {
    // Fix: Add stronger validation for data
    if (!data || typeof data !== 'object') return;
    
    // Update module data for each category
    ['SYSTEM', 'SERVICE', 'USER'].forEach(upperCat => {
      // Only use uppercase keys
      if (data[upperCat] && Array.isArray(data[upperCat])) {
        this.moduleData[upperCat] = data[upperCat];
      }
    });

    // Register module types from data
    ['SYSTEM', 'SERVICE', 'USER'].forEach(upperCat => {
      // Only look for uppercase keys
      const categoryData = data[upperCat] || [];
      if (Array.isArray(categoryData)) {
        categoryData.forEach(mod => {
          if (!mod) return;
          
          const key = this.getCanonicalKey(mod.module || mod.name);
          if (key) this.moduleTypes[upperCat].add(key);
        });
      }
    });
  }
  
  /**
   * Get all module data stored in the registry
   * @returns {Object} Object containing all module data categorized by type
   */
  getModuleData() {
    return {
      all: this.moduleData.ALL,
      // Only using uppercase keys for module types
      SYSTEM: this.moduleData.SYSTEM,
      SERVICE: this.moduleData.SERVICE,
      USER: this.moduleData.USER,
      count: {
        all: this.moduleData.ALL.length,
        SYSTEM: this.moduleData.SYSTEM.length,
        SERVICE: this.moduleData.SERVICE.length,
        USER: this.moduleData.USER.length
      },
      registeredComponents: this.getAllComponentKeys()
    };
  }
  
  /**
   * Synchronize registry with session data
   * This method updates the component registry with data from the session
   * @param {Object} sessionData - Session data from server
   * @returns {boolean} Success status
   */
  synchronizeWithSessionData(sessionData) {
    if (!sessionData || typeof sessionData !== 'object') {
      this.logError('Cannot synchronize with invalid session data', {action: 'synchronizeWithSessionData'});
      return false;
    }

    try {
      // Extract active modules from session data
      const activeModules = sessionData.active_modules;
      if (!Array.isArray(activeModules) || activeModules.length === 0) {
        return true; // No modules to process is valid state
      }
      
      // Filter and process valid modules
      const validModules = this.extractValidModuleIds(activeModules);
      if (validModules.length === 0) {
        return true; // No valid modules to process
      }
      
      // Process valid modules
      this.loadModulesFromIds(validModules);
      
      // Check if grid_layout is present and has valid data
      if (sessionData.grid_layout && typeof sessionData.grid_layout === 'object') {
        const breakpoints = ['lg', 'md', 'sm', 'xs', 'xxs'];
        let hasLayoutItems = false;
        
        // Check if any breakpoint has layout items
        breakpoints.forEach(bp => {
          if (Array.isArray(sessionData.grid_layout[bp]) && 
              sessionData.grid_layout[bp].length > 0) {
            hasLayoutItems = true;
          }
        });
        
        if (hasLayoutItems) {
          // Track all module types from grid layout items
          breakpoints.forEach(bp => {
            if (Array.isArray(sessionData.grid_layout[bp])) {
              sessionData.grid_layout[bp].forEach(item => {
                if (item && item.i) {
                  const parts = item.i.split('-');
                  if (parts.length === 3) {
                    const moduleType = parts[0].toUpperCase();
                    if (['SYSTEM', 'SERVICE', 'USER'].includes(moduleType)) {
                      this.moduleTypes[moduleType].add(moduleType);
                    }
                  }
                }
              });
            }
          });
        }
      }
      
      return true;
    } catch (error) {
      this.logError(`Failed to synchronize registry with session data: ${error.message}`, {
        action: 'synchronizeWithSessionData',
        error
      });
      return false;
    }
  }
  
  /**
   * Extract valid module IDs from a list of potential module IDs
   * @param {Array<string>} moduleIds - List of module IDs to process
   * @returns {Array<string>} List of valid module IDs
   */
  extractValidModuleIds(moduleIds) {
    if (!Array.isArray(moduleIds)) {
      return [];
    }
    
    return moduleIds.filter(id => {
      // Must be string and have the right format
      if (typeof id !== 'string' || !id.includes('-')) {
        return false;
      }
      
      const parts = id.split('-');
      // Must have at least module type and identifier
      if (parts.length < 2) {
        return false;
      }
      
      const moduleType = parts[0].toUpperCase();
      // Must be a valid module type
      return ['SYSTEM', 'SERVICE', 'USER'].includes(moduleType);
    });
  }
  
  /**
   * Log an error through the error handler
   * @param {string} message - Error message
   * @param {Object} context - Error context
   */
  logError(message, context = {}) {
    // Use the internal _reportError method with default parameters
    this._reportError(message, 'SYSTEM', 'MEDIUM', context);
  }
}

// Singleton pattern - create only one instance
let instance = null;

export const componentRegistry = instance || (instance = new ComponentRegistry());

// Hook up error handling in ComponentRegistryInitializer.js, not here
// This breaks the circular dependency

export default componentRegistry;