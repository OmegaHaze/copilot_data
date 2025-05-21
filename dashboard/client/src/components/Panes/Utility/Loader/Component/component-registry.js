/**
 * MODULE-FLOW-6.1: Component Registry - Core Component Management
 * COMPONENT: Component System - Component Repository
 * PURPOSE: Central registry for all React components in the dashboard
 * FLOW: Manages component instances, registration, and lookup
 * MERMAID-FLOW: flowchart TD; MOD6.1[Component Registry] -->|Registers| MOD6.1.1[Components];
 *               MOD6.1 -->|Referenced by| MOD6.2[Component Loader];
 *               MOD6.1 -->|Referenced by| MOD6.3[Module Core];
 *               MOD6.1 -->|Stores| MOD6.1.2[Module Data]
 */

import { MODULE_TYPES, STORAGE_KEYS } from './component-constants.js';

/********************************************************************
 * 📊 COMPONENT REGISTRY ARCHITECTURE 📊
 * 
 * The ComponentRegistry is a singleton that serves as the central
 * repository for all React components in the dashboard. It handles:
 * 
 * 1. Dynamic component loading/registration
 * 2. Component categorization (SYSTEM, SERVICE, USER)
 * 3. Component tracking and caching
 * 4. Event notifications for component lifecycle events
 * 
 * The registry works alongside the module system:
 * - The module system handles what modules are active in the UI
 * - The component registry handles the actual React components
 * - Components are referenced by their paneId: "TYPE-IDENTIFIER-INSTANCEID"
 ********************************************************************/

/**
 * MODULE-FLOW-6.1.1: Component Registry - Core Registry Class
 * COMPONENT: Component System - Central Registry Implementation
 * PURPOSE: Provides centralized component management
 * FLOW: Instantiated as a singleton and used throughout the system
 */
class ComponentRegistry {
  constructor() {
    // MODULE-FLOW-6.1.1.1: Registry Data Structures - Component Storage
    // COMPONENT: Component System - Internal Storage
    // PURPOSE: Stores components, types, errors, and metadata
    // FLOW: Updated during component registration and lookup
    this.components = new Map();
    this.moduleTypes = {
      [MODULE_TYPES.SYSTEM]: new Set(),
      [MODULE_TYPES.SERVICE]: new Set(),
      [MODULE_TYPES.USER]: new Set(),
    };
    this.errors = new Map();
    this.logoUrls = new Map();
    this.initialized = false;
    this.errorHandler = null;
    this.moduleData = {
      [MODULE_TYPES.SYSTEM]: [],
      [MODULE_TYPES.SERVICE]: [],
      [MODULE_TYPES.USER]: []
    };
    this.eventListeners = {
      componentLoaded: [],
      componentUnloaded: [],
      registryChanged: []
    };
  }

  /**
   * MODULE-FLOW-6.1.2: Event Management - Event Listener Registration
   * COMPONENT: Component System - Event Notification
   * PURPOSE: Adds event listeners for registry events
   * FLOW: Called by consumers to be notified of component changes
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   * @returns {boolean} - Success status
   */
  addEventListener(event, callback) {
    if (this.eventListeners[event] && typeof callback === 'function') {
      this.eventListeners[event].push(callback);
      return true;
    }
    return false;
  }

  /**
   * MODULE-FLOW-6.1.3: Event Management - Event Listener Removal
   * COMPONENT: Component System - Event Notification
   * PURPOSE: Removes event listeners
   * FLOW: Called during cleanup to prevent memory leaks
   * @param {string} event - Event name
   * @param {Function} callback - Callback to remove
   * @returns {boolean} - Success status
   */
  removeEventListener(event, callback) {
    if (this.eventListeners[event]) {
      this.eventListeners[event] = this.eventListeners[event].filter(cb => cb !== callback);
      return true;
    }
    return false;
  }

  /**
   * MODULE-FLOW-6.1.4: Event Management - Event Notification
   * COMPONENT: Component System - Event Notification
   * PURPOSE: Notifies listeners of registry events
   * FLOW: Called when components are loaded/unloaded
   * @param {string} event - Event name
   * @param {any} data - Event data
   */
  notifyListeners(event, data) {
    if (event === 'componentLoaded') {
      console.log(`[ComponentRegistry] Component loaded: ${data.key}`);
      // Trigger grid update or other listeners
    }
    if (this.eventListeners[event]) {
      this.eventListeners[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${event} listener:`, error);
        }
      });
    }
  }

  /**
   * MODULE-FLOW-6.1.5: Module Data Management - Data Setting
   * COMPONENT: Component System - Module Data Storage
   * PURPOSE: Stores module data retrieved from API
   * FLOW: Called during system initialization
   * @param {Object} data - Module data
   */
  setModuleData(data) {
    if (!data || typeof data !== 'object') {
      console.warn('[component-registry] Invalid module data provided to setModuleData:', data);
      return;
    }
    
    console.log('[component-registry] Setting module data:', data);
    
    /********************************************************************
     * 🔄 MODULE-COMPONENT INTEGRATION POINT 🔄
     * 
     * Here the registry stores the module definitions from the backend.
     * This data includes:
     * - Module names and identifiers
     * - Component path information
     * - Module types (SYSTEM, SERVICE, USER)
     * 
     * The registry uses this data to correctly categorize and map
     * module keys to their components. This forms the bridge between
     * the backend module definitions and the frontend components.
     ********************************************************************/
    this.moduleData = {
      [MODULE_TYPES.SYSTEM]: Array.isArray(data[MODULE_TYPES.SYSTEM]) ? [...data[MODULE_TYPES.SYSTEM]] : [],
      [MODULE_TYPES.SERVICE]: Array.isArray(data[MODULE_TYPES.SERVICE]) ? [...data[MODULE_TYPES.SERVICE]] : [],
      [MODULE_TYPES.USER]: Array.isArray(data[MODULE_TYPES.USER]) ? [...data[MODULE_TYPES.USER]] : []
    };
    
    console.log('[component-registry] Module data after setting:', this.moduleData);
    
    // Dispatch custom event that the debug overlay can listen for
    try {
      window.dispatchEvent(new CustomEvent('vaio:module-data-updated', { 
        detail: { moduleData: this.moduleData, timestamp: Date.now() } 
      }));
    } catch (e) {
      console.warn('[component-registry] Failed to dispatch module-data-updated event:', e);
    }
    
    this.notifyListeners('registryChanged', { 
      type: 'moduleDataUpdated',
      moduleData: this.moduleData
    });
    
    // Cache module data
    this.cacheModuleData();
  }

  /**
   * MODULE-FLOW-6.1.6: Data Persistence - Module Data Caching
   * COMPONENT: Component System - Data Persistence
   * PURPOSE: Caches module data to localStorage
   * FLOW: Called after module data is set
   * @returns {boolean} - Success status
   */
  cacheModuleData() {
    try {
      localStorage.setItem(STORAGE_KEYS.COMPONENT_CACHE, JSON.stringify({
        timestamp: Date.now(),
        data: this.moduleData
      }));
      return true;
    } catch (error) {
      console.warn('Failed to cache module data:', error);
      return false;
    }
  }

  /**
   * MODULE-FLOW-6.1.7: Data Persistence - Cached Data Loading
   * COMPONENT: Component System - Data Persistence
   * PURPOSE: Loads cached module data from localStorage
   * FLOW: Called during initialization if API fetch fails
   * @returns {Object|null} - Cached module data or null
   */
  loadCachedModuleData() {
    try {
      const cached = localStorage.getItem(STORAGE_KEYS.COMPONENT_CACHE);
      if (!cached) return null;
      
      const parsed = JSON.parse(cached);
      
      // Cache expires after 24 hours
      if (Date.now() - parsed.timestamp > 24 * 60 * 60 * 1000) {
        return null;
      }
      
      return parsed.data;
    } catch (error) {
      console.warn('Failed to load cached module data:', error);
      return null;
    }
  }

  /**
   * MODULE-FLOW-6.1.8: Error Handling - Error Handler Setting
   * COMPONENT: Component System - Error Management
   * PURPOSE: Sets the error handler function
   * FLOW: Called during initialization to configure error handling
   * @param {Function} handler - Error handler
   */
  setErrorHandler(handler) {
    if (typeof handler === 'function') {
      this.errorHandler = handler;
    }
  }

  /**
   * MODULE-FLOW-6.1.9: Initialization - Registry Initialization
   * COMPONENT: Component System - Startup
   * PURPOSE: Initializes the registry
   * FLOW: Called during system startup
   * @returns {Promise<boolean>} - Success status
   */
  async initialize() {
    if (this.initialized) return true;
    
    // Try loading from cache
    const cachedData = this.loadCachedModuleData();
    if (cachedData) {
      this.setModuleData(cachedData);
    }
    
    this.initialized = true;
    this.notifyListeners('registryChanged', { type: 'initialized' });
    return true;
  }

  /**
   * MODULE-FLOW-6.1.10: Error Handling - Error Reporting
   * COMPONENT: Component System - Error Management
   * PURPOSE: Reports errors to the configured handler
   * FLOW: Called when errors occur in registry operations
   * @param {string} message - Error message
   * @param {string} type - Error type
   * @param {string} severity - Error severity
   * @param {Object} context - Error context
   */
  reportError(message, type = 'SYSTEM', severity = 'MEDIUM', context = {}) {
    console.error(`ComponentRegistry: ${message}`, context);
    
    if (typeof this.errorHandler === 'function') {
      this.errorHandler(message, type, severity, context);
    }
  }

  /**
   * MODULE-FLOW-6.1.11: Component Management - Component Registration
   * COMPONENT: Component System - Component Lifecycle
   * PURPOSE: Registers a new component in the registry
   * FLOW: Called by component-loader when a component is loaded
   * @param {string} key - Component key
   * @param {Function} component - Component constructor
   * @param {string} moduleType - Module type
   * @returns {boolean} - Success status
   */
  registerComponent(key, component, moduleType) {
    if (this.components.has(key)) {
      console.warn(`[ComponentRegistry] Component ${key} is already registered.`);
      return false;
    }

    this.components.set(key, component);
    if (this.moduleTypes[moduleType]) {
      this.moduleTypes[moduleType].add(key);
    }

    this.notifyListeners('componentLoaded', { key, moduleType });
    console.log(`[ComponentRegistry] Registered component ${key} (${moduleType})`);
    return true;
  }

  /**
   * MODULE-FLOW-6.1.12: Component Management - Component Retrieval
   * COMPONENT: Component System - Component Lookup
   * PURPOSE: Gets a component by key
   * FLOW: Called when rendering components
   * @param {string} key - Component key
   * @returns {Function|null} - Component constructor
   */
  getComponent(key) {
    return this.components.get(key) || null;
  }

  /**
   * MODULE-FLOW-6.1.13: Component Management - Component Existence Check
   * COMPONENT: Component System - Component Lookup
   * PURPOSE: Checks if a component exists
   * FLOW: Called before attempting to render a component
   * @param {string} key - Component key
   * @returns {boolean} - Whether component exists
   */
  hasComponent(key) {
    return this.components.has(key);
  }

  /**
   * MODULE-FLOW-6.1.14: Component Management - All Components Listing
   * COMPONENT: Component System - Component Enumeration
   * PURPOSE: Gets all component keys
   * FLOW: Called for diagnostic and admin purposes
   * @returns {Array<string>} - All component keys
   */
  getAllComponentKeys() {
    return Array.from(this.components.keys());
  }

  /**
   * MODULE-FLOW-6.1.15: Component Management - Registered Components Listing
   * COMPONENT: Component System - Component Enumeration
   * PURPOSE: Gets all registered component keys
   * FLOW: Called when listing available components
   * @returns {Array} - Array of all registered component keys
   */
  getAllRegisteredKeys() {
    // Filter out base components which aren't truly registered
    return Array.from(this.components.keys()).filter(key => {
      const parts = key.split('-');
      return parts.length > 2; // Only return instance components
    });
  }

  /**
   * MODULE-FLOW-6.1.16: Component Management - Component Instances
   * COMPONENT: Component System - Instance Management
   * PURPOSE: Gets instances of a component
   * FLOW: Called when working with component instances
   * @param {string} key - Component key
   * @returns {Array|null} - Array of instances or null
   */
  getInstances(key) {
    const component = this.getComponent(key);
    if (!component || !Array.isArray(component.instances)) {
      return null;
    }
    return component.instances;
  }

  /**
   * MODULE-FLOW-6.1.17: Component Metadata - Logo URL Setting
   * COMPONENT: Component System - Metadata Management
   * PURPOSE: Sets logo URL for a module
   * FLOW: Called during initialization from module data
   * @param {string} key - Module key
   * @param {string} url - Logo URL
   */
  setLogoUrl(key, url) {
    if (key && url) {
      this.logoUrls.set(key, url);
    }
  }

  /**
   * MODULE-FLOW-6.1.18: Component Metadata - Logo URL Retrieval
   * COMPONENT: Component System - Metadata Management
   * PURPOSE: Gets logo URL for a module
   * FLOW: Called when rendering components with logos
   * @param {string} key - Module key
   * @returns {string|null} - Logo URL
   */
  getLogoUrl(key) {
    return key ? this.logoUrls.get(key) || null : null;
  }

  /**
   * MODULE-FLOW-6.1.19: Module Type Management - Category Determination
   * COMPONENT: Component System - Module Type Management
   * PURPOSE: Gets the module type/category for a key
   * FLOW: Called when determining module type
   * @param {string} key - Module key
   * @returns {string} - Module category (SYSTEM, SERVICE, USER)
   */
  getCategoryForModule(key) {
    if (!key) return MODULE_TYPES.USER;
    
    const moduleType = key.split('-')[0]?.toUpperCase();
    
    if (Object.values(MODULE_TYPES).includes(moduleType)) {
      return moduleType;
    }
    
    // Check if module is in any of the category sets
    for (const [category, modules] of Object.entries(this.moduleTypes)) {
      if (modules.has(key)) {
        return category;
      }
    }
    
    return MODULE_TYPES.USER;
  }

  /**
   * MODULE-FLOW-6.1.20: Module Data Management - Data Retrieval
   * COMPONENT: Component System - Module Data Access
   * PURPOSE: Gets all module data
   * FLOW: Called when accessing module definitions
   * @returns {Object} - All module data
   */
  getModuleData() {
    console.log('[component-registry] Getting module data:', this.moduleData);
    return this.moduleData;
  }

  /**
   * MODULE-FLOW-6.1.21: Error Management - Error Storage
   * COMPONENT: Component System - Error Tracking
   * PURPOSE: Stores an error for a component
   * FLOW: Called when component loading or rendering fails
   * @param {string} key - Component key
   * @param {Error} error - Error object
   */
  addError(key, error) {
    this.errors.set(key, {
      error: error.message || String(error),
      timestamp: new Date().toISOString()
    });
    
    this.notifyListeners('registryChanged', { 
      type: 'error', 
      key, 
      error: error.message 
    });
  }

  /**
   * MODULE-FLOW-6.1.22: Error Management - Error Retrieval
   * COMPONENT: Component System - Error Tracking
   * PURPOSE: Gets all errors
   * FLOW: Called for diagnostics and debugging
   * @returns {Object} - All errors
   */
  getErrors() {
    return Object.fromEntries(this.errors);
  }
  
  /**
   * MODULE-FLOW-6.1.23: Component Management - Component Unregistration
   * COMPONENT: Component System - Component Lifecycle
   * PURPOSE: Unregisters a component
   * FLOW: Called when removing components
   * @param {string} key - Component key
   * @returns {boolean} - Success status
   */
  unregisterComponent(key) {
    if (!this.components.has(key)) {
      console.warn(`[ComponentRegistry] Attempted to unregister component ${key} but it doesn't exist`);
      return false;
    }
    
    /********************************************************************
     * 🔄 COMPONENT LIFECYCLE MANAGEMENT 🔄
     * 
     * This is how components are removed from the registry when:
     * 1. A user removes a module from their dashboard
     * 2. A pane is closed or replaced
     * 3. The application is cleaning up resources
     * 
     * The module system calls this method (through module-operations.js)
     * to ensure React components are properly unloaded when modules
     * are removed.
     ********************************************************************/
    
    // Don't unregister base components
    const parts = key.split('-');
    const isBaseComponent = parts.length <= 2;
    
    if (isBaseComponent) {
      console.log(`[ComponentRegistry] Skipping unregistration of base component ${key}`);
      return false;
    }
    
    // Get the module type before removing the component
    const moduleType = this.getCategoryForModule(key);
    
    // Important: Actually remove from components map
    const success = this.components.delete(key);
    
    if (!success) {
      console.error(`[ComponentRegistry] Failed to remove component ${key} from registry`);
      return false;
    }
    
    // Also remove from module type tracking
    if (this.moduleTypes[moduleType]) {
      this.moduleTypes[moduleType].delete(key);
    }
    
    console.log(`[ComponentRegistry] Unregistered component ${key} (${moduleType})`);
    this.notifyListeners('componentUnloaded', { key, moduleType });
    this.notifyListeners('registryChanged', { type: 'componentRemoved', key });
    
    return true;
  }

  /**
   * MODULE-FLOW-6.1.24: Module Configuration - Multiple Instances Check
   * COMPONENT: Component System - Module Configuration
   * PURPOSE: Checks if a module allows multiple instances
   * FLOW: Called when determining if another instance can be created
   * @param {string} key - Module key
   * @returns {boolean} - Whether multiple instances are allowed
   */
  getAllowsMultipleInstances(key) {
    const component = this.getComponent(key);
    return component && component.allowMultipleInstances === true;
  }
}

// MODULE-FLOW-6.1.25: Registry Instantiation - Singleton Creation
// COMPONENT: Component System - Registry Creation
// PURPOSE: Creates singleton instance of the registry
// FLOW: Ensures a single registry instance exists for the application
const registry = new ComponentRegistry();

export default registry;