import { errorHandler } from '../../../Error-Handling/utils/errorHandler'
import { ErrorType, ErrorSeverity } from '../../../Error-Handling/Diagnostics/types/errorTypes'

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
    
    console.log('Initializing ComponentRegistry...');
    
    // Create and store initialization promise
    this.initializationPromise = Promise.resolve()
      .then(() => {
        // Set initialized flag
        this.initialized = true;
        console.log('ComponentRegistry initialized successfully');
        return true;
      })
      .catch(error => {
        console.error('Failed to initialize ComponentRegistry:', error);
        
        // Report error to notification system
        errorHandler.showError(
          `Component registry initialization failed: ${error.message}`,
          ErrorType.SYSTEM,
          ErrorSeverity.HIGH,
          {
            componentName: 'ComponentRegistry',
            action: 'initialize',
            location: 'Registry Initialization',
            metadata: {
              error: error.toString(),
              stack: error.stack
            }
          }
        );
        
        // Even on error, mark as initialized to prevent repeated attempts
        this.initialized = true;
        return false;
      })
      .finally(() => {
        // Clear initialization promise reference
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
   * Load a component dynamically with proper error handling
   * @param {string} moduleType - The module type to load
   * @param {string} [componentName=null] - Optional component name
   * @returns {Promise<Function|null>} - The component constructor or null if failed
   */
  async loadComponent(moduleType, componentName = null) {
    // Handle empty or invalid moduleType gracefully
    if (!moduleType) {
      console.warn('loadComponent called with empty moduleType');
      return null;
    }

    const key = this.getCanonicalKey(moduleType);

    // Return from cache if available
    if (this.components.has(key)) {
      return this.components.get(key);
    }

    // Return in-progress loading promise if exists
    if (this.loadPromises.has(key)) {
      return this.loadPromises.get(key);
    }

    // If this component previously had an error, clear it before retrying
    if (this.errors.has(key)) {
      this.errors.delete(key);
    }

    const compName = componentName || this.getComponentName(key);

    // Create and store the loading promise
    const loadPromise = (async () => {
      try {
        console.log(`Loading component for ${compName}`);

        // Try to dynamically import the component - try multiple possible paths
        let module;
        try {
          // First try original path
          module = await import(`../Pane/${compName}Pane.jsx`);
        } catch (pathError) {
          console.log(`Failed to load from ../Pane/${compName}Pane.jsx, trying alternatives...`);
          
          try {
            // Try without Pane suffix
            module = await import(`../Pane/${compName}.jsx`);
          } catch (alternativeError) {
            // Try parent directory
            console.log(`Failed to load from ../Pane/${compName}.jsx, trying parent...`);
            module = await import(`../../${compName}/${compName}Pane.jsx`);
          }
        }
        
        const Component = module.default || module;

        // Verify the component is valid
        if (!Component || typeof Component !== 'function') {
          throw new Error(`Invalid component format for "${compName}"`);
        }

        // Register the successfully loaded component
        this.register(key, Component);

        return Component;
      } catch (err) {
        // Record error details
        const errorDetails = {
          error: err.message,
          timestamp: new Date().toISOString(),
          component: compName,
        };
        this.errors.set(key, errorDetails);

        // Show error information
        errorHandler.showError(
          `Component registration failed: ${compName} → ${err.message}`,
          ErrorType.UI,
          ErrorSeverity.MEDIUM,
          {
            componentName: 'ComponentRegistry',
            action: 'loadComponent',
            location: 'Module Loading',
            metadata: {
              moduleType,
              componentName: compName,
              key,
              error: err.toString(),
              stack: err.stack
            },
          }
        );

        return null;
      }
    })()
    .finally(() => {
      // Clean up promise map after resolution (success or failure)
      this.loadPromises.delete(key);
    });

    this.loadPromises.set(key, loadPromise);
    return loadPromise;
  }
  
  /**
   * Get a component by module type
   * @param {string} moduleType - The module type
   * @returns {Function|null} The component constructor or null
   */
  getComponent(moduleType) {
    return this.components.get(this.getCanonicalKey(moduleType)) || null;
  }

  /**
   * Check if a component is registered
   * @param {string} moduleType - The module type
   * @returns {boolean} True if the component is registered
   */
  hasComponent(moduleType) {
    return this.components.has(this.getCanonicalKey(moduleType));
  }

  /**
   * Register an instance of a module
   * @param {string} moduleType - The module type
   * @param {string} instanceId - The instance ID
   * @returns {string} The full pane ID
   */
  registerInstance(moduleType, instanceId) {
    const key = this.getCanonicalKey(moduleType);
    if (!this.instances.has(key)) {
      this.instances.set(key, new Set());
    }
    this.instances.get(key).add(instanceId);
    return `${key}-${instanceId}`;
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
    const type = this.getCanonicalKey(moduleType);
    const instance = instanceId || this.generateInstanceId();
    return `${type}-${staticIdentifier}-${instance}`;
  }

  /**
   * Generate a random instance ID
   * @returns {string} A random instance ID
   */
  generateInstanceId() {
    return Math.random().toString(36).substring(2, 8);
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
    const key = this.getCanonicalKey(moduleType);
    // Make sure category is uppercase
    const upperCategory = category.toUpperCase();
    if (!['SYSTEM', 'SERVICE', 'USER'].includes(upperCategory)) {
      errorHandler.showError(
        `Invalid module category: ${upperCategory}`,
        ErrorType.SYSTEM,
        ErrorSeverity.MEDIUM,
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
   * Set module data for all categories
   * @param {Object} data - Module data organized by category
   */
  setModuleData(data) {
    if (!data) return;
    
    // Update module data for each category
    ['SYSTEM', 'SERVICE', 'USER'].forEach(upperCat => {
      // Only use uppercase keys
      if (data[upperCat]) {
        this.moduleData[upperCat] = data[upperCat];
      }
    });

    // Register module types from data
    ['SYSTEM', 'SERVICE', 'USER'].forEach(upperCat => {
      // Only look for uppercase keys
      const categoryData = data[upperCat] || [];
      categoryData.forEach(mod => {
        if (!mod) return;
        
        const key = this.getCanonicalKey(mod.module || mod.name);
        if (key) this.moduleTypes[upperCat].add(key);
      });
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
      console.warn('Cannot synchronize with invalid session data');
      return false;
    }

    try {
      console.log('Synchronizing component registry with session data', {
        hasActiveModules: !!sessionData.active_modules,
        hasGridLayout: !!sessionData.grid_layout,
        keys: Object.keys(sessionData)
      });
      
      // Process active modules if available
      if (sessionData.active_modules && Array.isArray(sessionData.active_modules)) {
        console.log(`Found ${sessionData.active_modules.length} active modules in session`);
        
        // Filter valid modules (must use three-part ID format)
        const validModules = sessionData.active_modules.filter(moduleId => {
          // Basic validation
          if (!moduleId || typeof moduleId !== 'string') {
            console.error(`Invalid module ID: ${moduleId}. Must be a non-empty string.`);
            return false;
          }
          
          // Format validation
          const parts = moduleId.split('-');
          if (parts.length !== 3) {
            console.error(`Invalid module ID format: ${moduleId}. Expected MODULETYPE-STATICID-INSTANCEID`);
            return false;
          }
          
          // Module type validation
          const moduleType = parts[0].toUpperCase();
          if (!['SYSTEM', 'SERVICE', 'USER'].includes(moduleType)) {
            console.error(`Invalid module type in ID: ${moduleId}. Type must be SYSTEM, SERVICE, or USER`);
            return false;
          }
          
          return true;
        });
        
        console.log(`Found ${validModules.length} valid modules out of ${sessionData.active_modules.length} total`);
        
        // Extract module types from valid module IDs (always using uppercase)
        const extractedModuleTypes = validModules
          .map(id => id.split('-')[0].toUpperCase())
          .filter(Boolean);
          
        // Add to appropriate module type collections
        extractedModuleTypes.forEach(type => {
          if (type === 'SYSTEM') this.moduleTypes.SYSTEM.add(type);
          else if (type === 'SERVICE') this.moduleTypes.SERVICE.add(type);
          else if (type === 'USER') this.moduleTypes.USER.add(type);
        });
        
        // Queue loading of components for valid modules
        validModules.forEach(moduleId => {
          const parts = moduleId.split('-');
          const moduleType = parts[0].toUpperCase();
          
          if (!this.hasComponent(moduleType)) {
            // Queue loading this component
            this.loadComponent(moduleType);
          }
        });
      } else {
        console.warn('No active modules in session data');
      }
      
      return true;
    } catch (error) {
      console.error('Error synchronizing with session data:', error);
      errorHandler.showError(
        `Failed to synchronize registry with session data: ${error.message}`,
        ErrorType.SYSTEM,
        ErrorSeverity.MEDIUM,
        {
          componentName: 'ComponentRegistry',
          action: 'synchronizeWithSessionData',
          metadata: {
            error: error.toString(),
            stack: error.stack
          }
        }
      );
      return false;
    }
  }
  
  /**
   * Check if the component registry is initialized
   * @returns {boolean} True if the registry is initialized
   */
  isInitialized() {
    return this.initialized;
  }
  
  /**
   * Unregister an instance of a module
   * @param {string} moduleType - The module type
   * @param {string} instanceId - The instance ID
   * @returns {boolean} True if the instance was unregistered
   */
  unregisterInstance(moduleType, instanceId) {
    const key = this.getCanonicalKey(moduleType);
    if (this.instances.has(key)) {
      return this.instances.get(key).delete(instanceId);
    }
    return false;
  }
  
  /**
   * Get metadata for a component
   * @param {string} moduleType - The module type
   * @returns {Object|null} Component metadata or null
   */
  getMetadata(moduleType) {
    const key = this.getCanonicalKey(moduleType);
    const category = this.getCategoryForModule(key);
    
    // Find the module in the corresponding category data
    const module = this.moduleData[category]?.find(m => 
      this.getCanonicalKey(m.module || m.name) === key
    );
    
    return module || null;
  }
}

// Create and export a singleton instance
export const componentRegistry = new ComponentRegistry();