/**
 * component-registry.js
 * Core registry for managing component references
 */

import { getCanonicalKey, createRegistrationKey } from './component-core';
import { MODULE_TYPES } from './component-constants';

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
  }

  /**
   * Set module data received from API
   * @param {Object} data - Module data
   */
  setModuleData(data) {
    if (!data || typeof data !== 'object') return;
    
    this.moduleData = {
      [MODULE_TYPES.SYSTEM]: Array.isArray(data[MODULE_TYPES.SYSTEM]) ? data[MODULE_TYPES.SYSTEM] : [],
      [MODULE_TYPES.SERVICE]: Array.isArray(data[MODULE_TYPES.SERVICE]) ? data[MODULE_TYPES.SERVICE] : [],
      [MODULE_TYPES.USER]: Array.isArray(data[MODULE_TYPES.USER]) ? data[MODULE_TYPES.USER] : []
    };
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
    this.initialized = true;
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
    if (!key || !component) {
      return false;
    }
    
    this.components.set(key, component);
    
    const canonicalType = getCanonicalKey(moduleType);
    if (this.moduleTypes[canonicalType]) {
      this.moduleTypes[canonicalType].add(key);
    }
    
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
   * Get all module data
   * @returns {Object} - All module data
   */
  getModuleData() {
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
  }

  /**
   * Get all errors
   * @returns {Object} - All errors
   */
  getErrors() {
    return Object.fromEntries(this.errors);
  }
}

// Create singleton instance
const registry = new ComponentRegistry();

export default registry;