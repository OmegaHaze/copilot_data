import { errorHandler } from '../../../Error-Handling/utils/errorHandler'
import { ErrorType, ErrorSeverity } from '../../../Error-Handling/Diagnostics/types/errorTypes'

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

  register(moduleType, componentConstructor) {
    const key = this.getCanonicalKey(moduleType);
    this.components.set(key, componentConstructor);
    return this;
  }

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
        // Removed all dummy/fallback creation logic
        throw new Error(`No real component found for: ${compName}`);
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
  


  getComponent(moduleType) {
    return this.components.get(this.getCanonicalKey(moduleType));
  }

  hasComponent(moduleType) {
    return this.components.has(this.getCanonicalKey(moduleType));
  }

  registerInstance(moduleType, instanceId) {
    const key = this.getCanonicalKey(moduleType);
    if (!this.instances.has(key)) {
      this.instances.set(key, new Set());
    }
    this.instances.get(key).add(instanceId);
    return `${key}-${instanceId}`;
  }

  getInstances(moduleType) {
    return Array.from(this.instances.get(this.getCanonicalKey(moduleType)) || []);
  }

  setLogoUrl(moduleType, url) {
    this.logoUrls.set(this.getCanonicalKey(moduleType), url);
    return this;
  }

  getLogoUrl(moduleType) {
    return this.logoUrls.get(this.getCanonicalKey(moduleType));
  }

  getComponentName(moduleType) {
    // Get canonical key without assuming specific naming conventions
    return this.getCanonicalKey(moduleType);
  }

  getCanonicalKey(moduleType) {
    if (!moduleType) return '';
    const typeStr = String(moduleType);
    return typeStr.includes('-') ? typeStr.split('-')[0].toLowerCase() : typeStr.toLowerCase();
  }

  createPaneId(moduleType, instanceId) {
    return `${this.getCanonicalKey(moduleType)}-${instanceId || this.generateInstanceId()}`;
  }

  generateInstanceId() {
    return Math.random().toString(36).substring(2, 8);
  }

  getAllComponentKeys() {
    return Array.from(this.components.keys());
  }

  getErrors() {
    return Object.fromEntries(this.errors);
  }

  clearError(moduleType) {
    this.errors.delete(this.getCanonicalKey(moduleType));
  }

  setCategoryForModule(moduleType, category) {
    const key = this.getCanonicalKey(moduleType);
    // Make sure category is uppercase
    const upperCategory = category.toUpperCase();
    if (!['SYSTEM', 'SERVICE', 'USER'].includes(upperCategory)) {
      errorHandler.showError(`Invalid module category: ${upperCategory}`, ErrorType.SYSTEM, ErrorSeverity.MEDIUM);
      return;
    }
    // Clear the key from all category sets
    Object.values(this.moduleTypes).forEach(set => set.delete(key));
    // Add to the appropriate category
    this.moduleTypes[upperCategory].add(key);
  }

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
      }
    }
    
    // Clear any existing loading promise
    this.loadPromises.delete(key);
    
    // Log the reload attempt
    console.log(`Attempting to reload component: ${moduleType}`);
    
    // Try loading the component again
    return this.loadComponent(moduleType);
  }

  setModuleData(data) {
    if (!data) return;
    ['SYSTEM', 'SERVICE', 'USER'].forEach(upperCat => {
      // Only use uppercase keys
      if (data[upperCat]) {
        this.moduleData[upperCat] = data[upperCat];
      }
    });


    ['SYSTEM', 'SERVICE', 'USER'].forEach(upperCat => {
      // Only look for uppercase keys - no backward compatibility
      const categoryData = data[upperCat] || [];
      categoryData.forEach(mod => {
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
      // Only using uppercase keys for module types - no backward compatibility
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
        
        // Extract module types from active module IDs
        const extractedModuleTypes = sessionData.active_modules
          .filter(id => id && typeof id === 'string' && id.includes('-'))
          .map(id => id.split('-')[0].toLowerCase())
          .filter(Boolean);
          
        console.log(`Extracted ${extractedModuleTypes.length} unique module types`);
        
        // Add to system module types (will be categorized properly later when module data is loaded)
        extractedModuleTypes.forEach(type => {
          if (type) {
            this.moduleTypes.SYSTEM.add(type);
          }
        });
        
        // Queue loading of components for active modules
        sessionData.active_modules.forEach(moduleId => {
          if (moduleId && typeof moduleId === 'string' && moduleId.includes('-')) {
            const [moduleType] = moduleId.split('-');
            if (!this.hasComponent(moduleType)) {
              // Queue loading this component
              this.loadComponent(moduleType);
            }
          }
        });
      } else {
        console.warn('No active modules in session data');
      }
      
      return true;
    } catch (error) {
      console.error('Error synchronizing with session data:', error);
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
}

// Create and export a singleton instance
export const componentRegistry = new ComponentRegistry();
