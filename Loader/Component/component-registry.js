/**
 * component-registry.js
 * Core registry for managing component references
 */

import { MODULE_TYPES, STORAGE_KEYS } from './component-constants';

class ComponentRegistry {
  constructor() {
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
   * Add event listener
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
   * Remove event listener
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
   * Notify event listeners
   * @param {string} event - Event name
   * @param {any} data - Event data
   */
  notifyListeners(event, data) {
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
   * Set module data received from API
   * @param {Object} data - Module data
   */
  setModuleData(data) {
    if (!data || typeof data !== 'object') {
      console.warn('[component-registry] Invalid module data provided to setModuleData:', data);
      return;
    }
    
    console.log('[component-registry] Setting module data:', data);
    
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
    
    this.notifyListeners('registryChanged', { type: 'moduleDataUpdated' });
    
    // Cache module data
    this.cacheModuleData();
  }

  /**
   * Cache module data to localStorage
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
   * Load cached module data from localStorage
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
   * Set error handler function
   * @param {Function} handler - Error handler
   */
  setErrorHandler(handler) {
    if (typeof handler === 'function') {
      this.errorHandler = handler;
    }
  }

  /**
   * Initialize the registry
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
   * Report an error
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
   * Register a component
   * @param {string} key - Component key
   * @param {Function} component - Component constructor
   * @param {string} moduleType - Module type
   * @returns {boolean} - Success status
   */
  registerComponent(key, component, moduleType) {
    if (!key || !component) return false;

    // Check if this is a base component (MODULETYPE-STATICID format with no instance ID)
    const parts = key.split('-');
    const isBaseComponent = parts.length <= 2;
    
    if (isBaseComponent) {
      console.log(`[ComponentRegistry] Skipping registration of base component ${key}`);
      
      // Track in moduleTypes but don't register
      if (this.moduleTypes[moduleType]) {
        this.moduleTypes[moduleType].add(key);
      }
      
      // Important: Still add to component map for lookup, but don't notify or fully register
      if (!this.components.has(key)) {
        this.components.set(key, component);
      }
      
      return false;
    }

    // For instance components, check if already exists
    const alreadyExists = this.components.has(key);
    if (alreadyExists) {
      console.warn(`[ComponentRegistry] Component ${key} is already registered. This may indicate a double-registration issue.`);
    }

    this.components.set(key, component);

    if (this.moduleTypes[moduleType]) {
      this.moduleTypes[moduleType].add(key);
    }

    console.log(`[ComponentRegistry] ${alreadyExists ? 'Re-registered' : 'Registered'} component ${key} (${moduleType})`);
    this.notifyListeners('componentLoaded', { key, moduleType });
    this.notifyListeners('registryChanged', { type: 'componentAdded', key });

    return true;
  }

  /**
   * Get a component by key
   * @param {string} key - Component key
   * @returns {Function|null} - Component constructor
   */
  getComponent(key) {
    return this.components.get(key) || null;
  }

  /**
   * Check if a component exists
   * @param {string} key - Component key
   * @returns {boolean} - Whether component exists
   */
  hasComponent(key) {
    return this.components.has(key);
  }

  /**
   * Get all component keys
   * @returns {Array<string>} - All component keys
   */
  getAllComponentKeys() {
    return Array.from(this.components.keys());
  }

  /**
   * Get all registered component keys
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
   * Get instances of a component
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
   * Set logo URL for a module
   * @param {string} key - Module key
   * @param {string} url - Logo URL
   */
  setLogoUrl(key, url) {
    if (key && url) {
      this.logoUrls.set(key, url);
    }
  }

  /**
   * Get logo URL for a module
   * @param {string} key - Module key
   * @returns {string|null} - Logo URL
   */
  getLogoUrl(key) {
    return key ? this.logoUrls.get(key) || null : null;
  }

  /**
   * Get category/type for a module key
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
   * Get all module data
   * @returns {Object} - All module data
   */
  getModuleData() {
    console.log('[component-registry] Getting module data:', this.moduleData);
    return this.moduleData;
  }

  /**
   * Store an error
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
   * Get all errors
   * @returns {Object} - All errors
   */
  getErrors() {
    return Object.fromEntries(this.errors);
  }
  
  /**
   * Unregister a component
   * @param {string} key - Component key
   * @returns {boolean} - Success status
   */
  unregisterComponent(key) {
    if (!this.components.has(key)) {
      console.warn(`[ComponentRegistry] Attempted to unregister component ${key} but it doesn't exist`);
      return false;
    }
    
    // Don't unregister base components
    const parts = key.split('-');
    const isBaseComponent = parts.length <= 2;
    
    if (isBaseComponent) {
      console.log(`[ComponentRegistry] Skipping unregistration of base component ${key}`);
      return false;
    }
    
    // Get the module type before removing the component
    const moduleType = this.getCategoryForModule(key);
    
    // Remove from components map
    this.components.delete(key);
    
    // Remove from module type tracking
    if (this.moduleTypes[moduleType]) {
      this.moduleTypes[moduleType].delete(key);
    }
    
    console.log(`[ComponentRegistry] Unregistered component ${key} (${moduleType})`);
    this.notifyListeners('componentUnloaded', { key, moduleType });
    this.notifyListeners('registryChanged', { type: 'componentRemoved', key });
    
    return true;
  }
}

// Create singleton instance
const registry = new ComponentRegistry();

export default registry;