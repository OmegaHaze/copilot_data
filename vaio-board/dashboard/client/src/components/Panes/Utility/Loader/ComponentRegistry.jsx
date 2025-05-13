// [CR-001] ComponentRegistry - Core singleton for dynamic component management
/**
 * ComponentRegistry.jsx
 * Core singleton registry for component management
 */

// Need to import React for JSX rendering
import React from 'react';

// Simple error logging function
const logError = (message, context = {}) => {
  console.error(`ComponentRegistry: ${message}`, context);
};

// [CR-002] Registry Class - Central manager for all dynamically loaded components
class ComponentRegistry {
  constructor() {
    this.components = new Map();
    this.instances = new Map();
    this.logoUrls = new Map();
    this.errors = new Map();
    this.errorHandler = null;
    
    // [CR-003] Module Categorization - Organizes modules by type
    // Module categorization 
    this.moduleTypes = {
      SYSTEM: new Set(),
      SERVICE: new Set(),
      USER: new Set(),
    };
    
    // [CR-004] Module Data Storage - Metadata for all registered components
    // Module data
    this.moduleData = {
      SYSTEM: [],
      SERVICE: [],
      USER: [],
    };
    
    this.initialized = false;
  }
  
  // [CR-005] Registry Initialization - Setup and initial loading
  /**
   * Initialize the registry
   * @returns {Promise<boolean>}
   */
  async initialize() {
    if (this.initialized) {
      return true;
    }
    
    try {
      // Simple initialization - more setup will be done by the initializer
      this.initialized = true;
      return true;
    } catch (error) {
      logError(`Initialization failed: ${error.message}`);
      // Set initialized even on error to prevent repeated attempts
      this.initialized = true;
      return false;
    }
  }
  
  // [CR-006] Error Handler Registration - Sets up error reporting
  /**
   * Register error handler
   * @param {Function} handler 
   */
  setErrorHandler(handler) {
    if (typeof handler === 'function') {
      this.errorHandler = handler;
    }
  }
  
  // [CR-007] Error Reporting - Standardized error handling
  /**
   * Report an error
   * @param {string} message 
   * @param {string} type 
   * @param {string} severity 
   * @param {Object} context 
   */
  reportError(message, type = 'SYSTEM', severity = 'MEDIUM', context = {}) {
    logError(message, context);
    
    if (this.errorHandler) {
      try {
        this.errorHandler(message, type, severity, context);
      } catch (err) {
        logError(`Error handler failed: ${err.message}`);
      }
    }
  }
  
  // [CR-008] Module Type Normalization - Standardizes module type keys
  /**
   * Get canonical key for module type
   * @param {string} moduleType 
   * @returns {string}
   */
  getCanonicalKey(moduleType) {
    if (!moduleType) return '';
    
    const typeStr = String(moduleType);
    return typeStr.includes('-') 
      ? typeStr.split('-')[0].toUpperCase() 
      : typeStr.toUpperCase();
  }
  
  // [CR-009] Component Registration - Adds component to registry
  /**
   * Register a component
   * @param {string} key - Component key
   * @param {Function|Object} component - React component
   * @param {string} moduleType - Module type (SYSTEM, SERVICE, USER)
   * @param {Object} metadata - Additional component metadata
   * @returns {boolean} Success status
   */
  registerComponent(key, component, moduleType = 'SYSTEM', metadata = {}) {
    if (!key || !component) {
      this.reportError('Invalid component registration parameters', 'SYSTEM', 'MEDIUM', { key });
      return false;
    }
    
    try {
      // Store the component
      this.components.set(key, component);
      
      // Store in module type collection
      const canonicalType = this.getCanonicalKey(moduleType);
      if (this.moduleTypes[canonicalType]) {
        this.moduleTypes[canonicalType].add(key);
      }
      
      // Add to module data
      if (this.moduleData[canonicalType]) {
        this.moduleData[canonicalType].push({
          key,
          ...metadata,
          moduleType: canonicalType
        });
      }
      
      return true;
    } catch (error) {
      this.reportError(`Failed to register component: ${error.message}`, 'SYSTEM', 'MEDIUM', {
        key,
        moduleType,
        error
      });
      return false;
    }
  }
  
  // [CR-010] Component Retrieval - Gets component by key
  /**
   * Get a component by key
   * @param {string} key - Component key
   * @returns {Function|Object|null} Component or null
   */
  getComponent(key) {
    return this.components.get(key) || null;
  }
  
  // [CR-011] Component Rendering - Renders components by ID in the grid
  /**
   * Render a component based on paneId and item data
   * @param {string} paneId - The ID of the pane to render
   * @param {Object} item - Layout item data containing component details
   * @returns {React.Element|null} Rendered component or error placeholder
   */
  renderComponent(paneId, item) {
    try {
      // Extract component information from the ID
      if (!paneId || typeof paneId !== 'string') {
        this.reportError('Invalid paneId for rendering', 'SYSTEM', 'MEDIUM', { paneId });
        return this.renderPlaceholder(paneId, 'Invalid pane ID');
      }

      // Get module parts from ID using the three-part format: TYPE-IDENTIFIER-INSTANCE
      const [moduleType, staticIdentifier, instanceId] = paneId.split('-');
      
      if (!moduleType || !staticIdentifier) {
        this.reportError('Invalid paneId format', 'SYSTEM', 'MEDIUM', { paneId });
        return this.renderPlaceholder(paneId, 'Invalid pane ID format');
      }
      
      // Get component using the exact key format: TYPE-IDENTIFIER
      const lookupKey = `${moduleType}-${staticIdentifier}`;
      const component = this.components.get(lookupKey);
      
      if (component) {
        const Component = component;
        // Create props from the item data
        const componentProps = {
          id: paneId,
          moduleType,
          staticIdentifier,
          instanceId,
          ...item
        };
        
        // Render the component with props
        return <Component {...componentProps} />;
      } else {
        console.warn(`Component not found for ${paneId} with key ${lookupKey}`);
        return this.renderPlaceholder(paneId, `Component not found: ${lookupKey}`);
      }
    } catch (error) {
      this.reportError(`Failed to render component: ${error.message}`, 'SYSTEM', 'MEDIUM', { 
        paneId, item, error 
      });
      return this.renderPlaceholder(paneId, `Rendering error: ${error.message}`);
    }
  }

  /**
   * Render a placeholder for missing components
   * @param {string} paneId - The ID of the pane
   * @param {string} message - Error message to display
   * @returns {React.Element} Placeholder element
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
   * @param {string} key - Registry key for the component 
   * @param {string} staticIdentifier - Static identifier that maps to the component
   * @returns {Promise<Function|Object|null>} Loaded component
   */
  async loadComponent(key, staticIdentifier) {
    if (!key || !staticIdentifier) {
      this.reportError('Invalid parameters for loadComponent', 'SYSTEM', 'MEDIUM', { key, staticIdentifier });
      return null;
    }

    console.log(`Loading component: ${key} (${staticIdentifier})`);
    
    // Generate the proper registration key in TYPE-IDENTIFIER format
    const registrationKey = key.includes('-') ? key : `${this.getCanonicalKey(key)}-${staticIdentifier}`;
    const canonicalType = this.getCanonicalKey(key);
    
    // Check if already loaded
    if (this.components.has(registrationKey)) {
      console.log(`Component ${registrationKey} already loaded, reusing`);
      return this.components.get(registrationKey);
    }
    
    try {
      // Standard import path for components
      const importPath = `../../${canonicalType}/${staticIdentifier}/${staticIdentifier}.jsx`;
      console.log(`Importing component from: ${importPath}`);
      
      const componentModule = await import(importPath);
      const Component = componentModule.default;
      
      if (!Component) {
        this.storeComponentError(registrationKey, 'No default export found in component module', {
          key, staticIdentifier, importPath
        });
        return null;
      }
      
      this.registerComponent(registrationKey, Component, canonicalType);
      return Component;
    } catch (error) {
      this.storeComponentError(registrationKey, error.message, {
        key, 
        staticIdentifier, 
        error: error.toString(),
        importPath: `../../${canonicalType}/${staticIdentifier}/${staticIdentifier}.jsx`
      });
      return null;
    }
  }
  
  /**
   * Store component error with standardized format
   * @private
   * @param {string} key - Component key
   * @param {string} message - Error message
   * @param {Object} context - Additional error context
   */
  storeComponentError(key, message, context = {}) {
    this.reportError(`Component error for ${key}: ${message}`, 'SYSTEM', 'MEDIUM', context);
    
    // Store error for later inspection
    this.errors.set(key, {
      message,
      timestamp: Date.now(),
      context
    });
  }
  
  /**
   * Get all errors from component loading
   * @returns {Object} Map of errors
   */
  getErrors() {
    return Object.fromEntries(this.errors);
  }
  
  /**
   * Set logo URL for a component
   * @param {string} key - Component key
   * @param {string} url - Logo URL
   */
  setLogoUrl(key, url) {
    if (key && url) {
      this.logoUrls.set(key, url);
    }
  }
  
  /**
   * Get logo URL for a component
   * @param {string} key - Component key
   * @returns {string|null} Logo URL
   */
  getLogoUrl(key) {
    return this.logoUrls.get(key) || null;
  }
  
  /**
   * Set module data
   * @param {Object} data - Module data
   */
  setModuleData(data) {
    if (!data || typeof data !== 'object') return;
    
    if (Array.isArray(data.SYSTEM)) {
      this.moduleData.SYSTEM = data.SYSTEM;
    }
    
    if (Array.isArray(data.SERVICE)) {
      this.moduleData.SERVICE = data.SERVICE;
    }
    
    if (Array.isArray(data.USER)) {
      this.moduleData.USER = data.USER;
    }
  }
  
  /**
   * Set category for module
   * @param {string} key - Module key
   * @param {string} category - Category (SYSTEM, SERVICE, USER)
   */
  setCategoryForModule(key, category) {
    if (!key || !category) return;
    
    if (['SYSTEM', 'SERVICE', 'USER'].includes(category)) {
      this.moduleTypes[category].add(key);
    }
  }
  
  /**
   * Get all component keys
   * @returns {Array<string>} Component keys
   */
  getAllComponentKeys() {
    return Array.from(this.components.keys());
  }
  
  /**
   * Check if a component exists in the registry
   * @param {string} key - Component key or identifier
   * @returns {boolean} True if component exists
   */
  hasComponent(key) {
    if (!key) return false;
    
    // Handle both key formats
    const lookupKey = key.includes('-') ? key : `${this.getCanonicalKey(key)}-${key}`;
    
    return this.components.has(lookupKey);
  }
}

// Create singleton instance
const registry = new ComponentRegistry();

export default registry;
export const componentRegistry = registry;