/**
 * ComponentRegistry - Core singleton for dynamic component management
 */
import React from 'react';

class ComponentRegistry {
  constructor() {
    this.components = new Map();
    this.moduleTypes = {
      SYSTEM: new Set(),
      SERVICE: new Set(),
      USER: new Set(),
    };
    this.errors = new Map();
    this.initialized = false;
    this.errorHandler = null;
    this.moduleData = {
      SYSTEM: [],
      SERVICE: [],
      USER: []
    };
  }
  
  /**
   * Set module data received from API
   */
  setModuleData(data) {
    if (data && typeof data === 'object') {
      this.moduleData = {
        SYSTEM: Array.isArray(data.SYSTEM) ? data.SYSTEM : [],
        SERVICE: Array.isArray(data.SERVICE) ? data.SERVICE : [],
        USER: Array.isArray(data.USER) ? data.USER : []
      };
    }
  }
  
  /**
   * Set custom error handler function
   */
  setErrorHandler(handler) {
    if (typeof handler === 'function') {
      this.errorHandler = handler;
    }
  }
  
  /**
   * Initialize the registry
   */
  async initialize() {
    if (this.initialized) return true;
    this.initialized = true;
    console.log('[ComponentRegistry] Initialization complete');
    return true;
  }
  
  /**
   * Report an error
   */
  reportError(message, type = 'SYSTEM', severity = 'MEDIUM', context = {}) {
    console.error(`ComponentRegistry: ${message}`, context);
    
    // Use custom error handler if available
    if (typeof this.errorHandler === 'function') {
      this.errorHandler(message, type, severity, context);
    }
  }
  
  /**
   * Get canonical key for module type
   */
  getCanonicalKey(moduleType) {
    if (!moduleType) return '';
    
    const typeStr = String(moduleType);
    return typeStr.includes('-') 
      ? typeStr.split('-')[0].toUpperCase() 
      : typeStr.toUpperCase();
  }
  
  /**
   * Register a component
   */
  registerComponent(key, component, moduleType) {
    if (!key || !component) {
      console.warn('Invalid component registration parameters', { key });
      return false;
    }
    
    // Store the component
    this.components.set(key, component);
    
    // Store in module type collection
    const canonicalType = this.getCanonicalKey(moduleType);
    if (this.moduleTypes[canonicalType]) {
      this.moduleTypes[canonicalType].add(key);
    }
    
    return true;
  }
  
  /**
   * Get a component by key
   */
  getComponent(key) {
    return this.components.get(key) || null;
  }
  
  /**
   * Render a component based on paneId and item data
   */
  renderComponent(paneId, item) {
    // Extract component information from the ID
    if (!paneId || typeof paneId !== 'string') {
      return this.renderPlaceholder(paneId, 'Invalid pane ID');
    }

    // Get module parts from ID using the three-part format: TYPE-IDENTIFIER-INSTANCE
    const [moduleType, staticIdentifier, instanceId] = paneId.split('-');
    
    if (!moduleType || !staticIdentifier) {
      return this.renderPlaceholder(paneId, 'Invalid pane ID format');
    }
    
    // Create the component key
    const componentKey = `${moduleType}-${staticIdentifier}`;
    
    // Try to get the component
    let component = this.components.get(componentKey);
    
    // If not found, try to load it on-demand
    if (!component && !this.errors.has(componentKey)) {
      // Try to load the component
      this.loadComponent(moduleType, staticIdentifier)
        .then(() => {
          // Force a re-render by updating a state variable in the parent component
          if (item?.onComponentLoaded && typeof item.onComponentLoaded === 'function') {
            item.onComponentLoaded();
          }
        })
        .catch(() => {});
    }
    
    if (component) {
      const Component = component;
      
      // Find module data for this component
      let moduleDataItem = null;
      if (this.moduleData[moduleType]) {
        moduleDataItem = this.moduleData[moduleType].find(m => 
          m.module === staticIdentifier || 
          m.staticIdentifier === staticIdentifier || 
          m.name === staticIdentifier
        );
      }
      
      // Create props from the item data
      const componentProps = {
        id: paneId,
        moduleType,
        staticIdentifier,
        instanceId,
        name: moduleDataItem?.name || item?.name || staticIdentifier,
        ...(moduleDataItem || {}),
        ...item
      };
      
      // Render the component with props
      return <Component {...componentProps} />;
    } else {
      return this.renderPlaceholder(paneId, `Component not found: ${componentKey}`);
    }
  }

  /**
   * Render a placeholder for missing components
   */
  renderPlaceholder(paneId, message = 'Component not available') {
    return (
      <div className="p-4 bg-red-900/20 border border-red-800/50 rounded-lg h-full w-full flex flex-col items-center justify-center">
        <div className="text-red-500 text-lg font-mono mb-2">Component Error</div>
        <div className="text-red-400 text-sm">{message}</div>
        <div className="text-red-300/70 text-xs mt-4">{paneId || 'Unknown ID'}</div>
      </div>
    );
  }
  
  /**
   * Dynamically load a component by its identifier
   */
  async loadComponent(key, staticIdentifier) {
    if (!key || !staticIdentifier) {
      console.warn('[ComponentRegistry] Invalid parameters for loadComponent', { key, staticIdentifier });
      return null;
    }
    
    // Generate the proper registration key
    const registrationKey = key.includes('-') ? key : `${this.getCanonicalKey(key)}-${staticIdentifier}`;
    
    // Check if already loaded
    if (this.components.has(registrationKey)) {
      console.log(`[ComponentRegistry] Component ${registrationKey} already loaded`);
      return this.components.get(registrationKey);
    }

    try {
      // Check if this component has a custom resolver function registered
      if (typeof window.__VAIO_COMPONENT_RESOLVER__ === 'function') {
        console.log(`[ComponentRegistry] Using custom component resolver for: ${staticIdentifier}`);
        const Component = await window.__VAIO_COMPONENT_RESOLVER__(staticIdentifier, key);
        if (Component) {
          componentModule = { default: Component };
        } else {
          throw new Error(`Component resolver returned nothing for ${staticIdentifier}`);
        }
      } 
      // Legacy component loading - Note: No hardcoded paths here
      else {
        // Check modules data first
        const moduleTypeKey = this.getCanonicalKey(key);
        let moduleInfo = null;
        if (this.moduleData[moduleTypeKey]) {
          moduleInfo = this.moduleData[moduleTypeKey].find(m => 
            m.staticIdentifier === staticIdentifier || 
            m.module === staticIdentifier
          );
        }
        
        // If we have component metadata with a load method, use it
        if (moduleInfo && moduleInfo.loadComponent) {
          componentModule = await moduleInfo.loadComponent();
        } else {
          throw new Error(`No component resolver available for ${staticIdentifier}`);
        }
      }
      const Component = componentModule.default;
      
      if (!Component) {
        throw new Error(`No default export found for ${staticIdentifier}`);
      }
      
      this.registerComponent(registrationKey, Component, key);
      return Component;
      
    } catch (error) {
      console.error(`[ComponentRegistry] Failed to load component ${registrationKey}:`, error);
      
      this.errors.set(registrationKey, {
        error: error.message,
        timestamp: new Date().toISOString()
      });
      return null;
    }
  }
  
  /**
   * Get all errors from component loading
   */
  getErrors() {
    return Object.fromEntries(this.errors);
  }
  
  
  /**
   * Set category for module
   */
  setCategoryForModule(key, category) {
    if (!key || !category) return;
    
    if (['SYSTEM', 'SERVICE', 'USER'].includes(category)) {
      this.moduleTypes[category].add(key);
    }
  }
  
  /**
   * Get all component keys
   */
  getAllComponentKeys() {
    return Array.from(this.components.keys());
  }
  
  /**
   * Check if a component exists in the registry
   */
  hasComponent(key) {
    if (!key) return false;
    
    // Handle both key formats
    const lookupKey = key.includes('-') ? key : `${this.getCanonicalKey(key)}-${key}`;
    
    return this.components.has(lookupKey);
  }
  
  /**
   * Set logo URL for a module
   */
  setLogoUrl(key, url) {
    if (!key || !url) return;
    
    if (!this._logoUrls) {
      this._logoUrls = new Map();
    }
    
    this._logoUrls.set(key, url);
  }
  
  /**
   * Get logo URL for a module
   */
  getLogoUrl(key) {
    if (!key || !this._logoUrls) return null;
    
    return this._logoUrls.get(key) || null;
  }
  
  /**
   * Get module data
   */
  getModuleData() {
    return this.moduleData;
  }
  
  /**
   * Audit active modules to ensure all components are available
   * @param {Array} activeModules - Array of active module IDs
   * @returns {Object} Audit results with missing and available components
   */
  auditComponents(activeModules) {
    if (!Array.isArray(activeModules) || activeModules.length === 0) {
      return { 
        missing: [], 
        available: [],
        total: 0,
        success: true
      };
    }
    
    const missing = [];
    const available = [];
    
    // Check each active module
    for (const moduleId of activeModules) {
      if (typeof moduleId !== 'string') continue;
      
      const [moduleType, staticIdentifier] = moduleId.split('-');
      if (!moduleType || !staticIdentifier) continue;
      
      const componentKey = `${moduleType}-${staticIdentifier}`;
      if (this.components.has(componentKey)) {
        available.push({
          moduleId,
          componentKey,
          component: this.components.get(componentKey).name || 'Unknown'
        });
      } else {
        missing.push({
          moduleId,
          componentKey,
          moduleType,
          staticIdentifier
        });
      }
    }
    
    // Log the results
    if (missing.length > 0) {
      console.warn(`[ComponentRegistry] Audit found ${missing.length} missing components`, {
        missing,
        availableCount: available.length,
        totalModules: activeModules.length
      });
      // No automatic loading here - we'll let the ensureComponentsLoaded method handle it
    }
    
    return {
      missing,
      available,
      total: activeModules.length,
      success: missing.length === 0
    };
  }

  /**
   * Ensure all required components are loaded
   * This will attempt to load any missing components
   * @param {Array} activeModules - Array of active module IDs
   * @returns {Promise<Object>} Loading results
   */
  async ensureComponentsLoaded(activeModules) {
    if (!Array.isArray(activeModules) || activeModules.length === 0) {
      return { success: true, loaded: 0, failed: 0 };
    }
    
    // Audit first to get missing components
    const audit = this.auditComponents(activeModules);
    
    if (audit.success) {
      return { success: true, loaded: 0, failed: 0 };
    }
    
    // Try to load missing components
    let loaded = 0;
    let failed = 0;
    
    // Create promises for all component loads
    const loadPromises = audit.missing.map(async ({ moduleType, staticIdentifier }) => {
      try {
        await this.loadComponent(moduleType, staticIdentifier);
        loaded++;
        return true;
      } catch (err) {
        failed++;
        return false;
      }
    });
    
    // Wait for all load attempts to complete
    await Promise.all(loadPromises);
    
    return { 
      success: failed === 0,
      loaded,
      failed,
      missing: audit.missing.length
    };
  }
}

// Create singleton instance
const registry = new ComponentRegistry();

export default registry;
export const componentRegistry = registry;
