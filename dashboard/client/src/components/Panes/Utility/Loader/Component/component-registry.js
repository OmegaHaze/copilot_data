/**
 * component-registry.js
 * Central registry for React components
 */

import { MODULE_TYPES } from '../Module/module-constants';
import { STORAGE_KEYS } from './component-constants';
import { createRegistrationKey, parsePaneId } from './component-shared';

class ComponentRegistry {
  constructor() {
    this.components = new Map();
    this.moduleTypes = Object.values(MODULE_TYPES).reduce((acc, type) => {
      acc[type] = new Set();
      return acc;
    }, {});
    this.errors = new Map();
    this.logoUrls = new Map();
    this.initialized = false;
    this.errorHandler = null;
    this.moduleData = Object.values(MODULE_TYPES).reduce((acc, type) => {
      acc[type] = [];
      return acc;
    }, {});
    this.activeModules = [];
    this.eventListeners = {
      componentLoaded: [],
      componentUnloaded: [],
      moduleStateChanged: [],
      moduleDataChanged: []
    };
  }

  async initialize() {
    if (this.initialized) return true;
    
    const registryData = localStorage.getItem(STORAGE_KEYS.COMPONENT_REGISTRY);
    if (registryData) {
      try {
        const parsed = JSON.parse(registryData);
        if (parsed.data) this.moduleData = parsed.data;
        if (parsed.activeModules) {
          this.activeModules = parsed.activeModules;
          this.restoreActiveModules();
        }
      } catch (err) {
        console.warn('[component-registry] Failed to parse registry data:', err);
      }
    }
    
    this.initialized = true;
    return true;
  }

  restoreActiveModules() {
    if (!Array.isArray(this.activeModules)) {
      console.warn('[component-registry] activeModules is not an array');
      return;
    }
    
    this.activeModules.forEach(({ moduleType, staticIdentifier, instanceId }) => {
      if (!(moduleType && staticIdentifier && instanceId)) {
        console.warn(`[component-registry] Invalid module data: ${JSON.stringify({ moduleType, staticIdentifier, instanceId })}`);
        return;
      }
      
      const key = createRegistrationKey(moduleType, staticIdentifier, instanceId);
      const moduleList = this.moduleData[moduleType];
      if (!moduleList) {
        console.warn(`[component-registry] Module type ${moduleType} not found in moduleData`);
        return;
      }
      
      // Use standardized property lookup
      const moduleInfo = moduleList.find(m => {
        const identifier = m.staticIdentifier || m.module;
        return identifier === staticIdentifier;
      });
      
      if (moduleInfo) {
        this.notifyListeners('moduleStateChanged', {
          activeModule: key,
          moduleInfo,
          action: 'activate'
        });
      } else {
        console.warn(`[component-registry] Module info not found for ${staticIdentifier}`);
      }
    });
  }

  /**
   * Updates the component registry in localStorage
   * @returns {void}
   */
  updateComponentRegistry() {
    if (!Array.isArray(this.activeModules)) {
      console.error('[component-registry] Cannot update registry: activeModules is not an array');
      return;
    }

    // Use MODULE_TYPES to create layout structure
    const layoutByType = Object.values(MODULE_TYPES).reduce((acc, type) => {
      acc[type] = [];
      return acc;
    }, {});

    this.activeModules.forEach(({ moduleType, staticIdentifier, instanceId }) => {
      if (!(moduleType && staticIdentifier && instanceId)) {
        console.warn(`[component-registry] Skipping invalid module: ${JSON.stringify({ moduleType, staticIdentifier, instanceId })}`);
        return;
      }
      
      const key = createRegistrationKey(moduleType, staticIdentifier, instanceId);
      
      if (!layoutByType[moduleType]) {
        console.warn(`[component-registry] Unknown module type: ${moduleType}`);
        return;
      }
      
      layoutByType[moduleType].push(key);
    });

    const registryData = {
      timestamp: Date.now(),
      data: layoutByType,
      activeModules: this.activeModules
    };
    
    // Update both storage keys to maintain consistency
    localStorage.setItem(STORAGE_KEYS.COMPONENT_REGISTRY, JSON.stringify(registryData));
    localStorage.setItem(STORAGE_KEYS.COMPONENT_CACHE, JSON.stringify(registryData));
  }

  updateModuleStateFromSession(moduleIds) {
    if (!Array.isArray(moduleIds)) {
      console.error('[component-registry] Cannot update module state: moduleIds is not an array');
      return;
    }
    
    const parsedIds = moduleIds.map((id, index) => {
      const parsed = parsePaneId(id);
      if (!parsed) {
        console.warn(`[component-registry] Invalid pane ID at index ${index}: ${id}`);
      }
      return parsed;
    }).filter(Boolean);
    
    if (parsedIds.length !== moduleIds.length) {
      console.warn(`[component-registry] Some pane IDs (${moduleIds.length - parsedIds.length}) were invalid and filtered out`);
    }
    
    this.activeModules = parsedIds;
    this.updateComponentRegistry();
  }

  setErrorHandler(handler) {
    if (typeof handler === 'function') this.errorHandler = handler;
  }

  setModuleData(data) {
    if (!data) {
      console.error('[component-registry] Cannot set module data: data is null or undefined');
      return;
    }
    
    // Initialize with MODULE_TYPES structure
    this.moduleData = Object.values(MODULE_TYPES).reduce((acc, type) => {
      acc[type] = Array.isArray(data[type]) ? [...data[type]] : [];
      if (!Array.isArray(data[type])) {
        console.warn(`[component-registry] Module data for type ${type} is not an array, using empty array`);
      }
      return acc;
    }, {});
    
    this.updateComponentRegistry();

    this.notifyListeners('moduleDataChanged', {
      moduleData: this.moduleData,
      activeModules: this.activeModules,
      timestamp: Date.now()
    });
  }

  countModules() {
    return Object.values(MODULE_TYPES).reduce((total, type) => {
      return total + (this.moduleData[type]?.length || 0);
    }, 0);
  }

  getModuleData() {
    return this.moduleData;
  }

  getActiveModules() {
    return this.activeModules;
  }

  registerComponent(key, component, moduleType) {
    if (!key || !component) return false;
    this.components.set(key, component);
    this.moduleTypes[moduleType]?.add(key);
    this.notifyListeners('componentLoaded', { key, moduleType });
    return true;
  }

  getComponent(key) {
    return this.components.get(key) || null;
  }

  hasComponent(key) {
    return this.components.has(key);
  }

  getAllComponentKeys() {
    return Array.from(this.components.keys());
  }

  setLogoUrl(key, url) {
    if (key && url) this.logoUrls.set(key, url);
  }

  getLogoUrl(key) {
    return this.logoUrls.get(key) || null;
  }

  addError(key, error) {
    if (!key || !error) return;
    this.errors.set(key, {
      error: error.message || String(error),
      timestamp: new Date().toISOString()
    });
    if (this.errorHandler) {
      this.errorHandler(
        `Component error: ${error.message}`,
        'COMPONENT',
        'MEDIUM',
        { key, error: error.toString() }
      );
    }
  }

  getErrors() {
    return Object.fromEntries(this.errors);
  }

  unregisterComponent(key) {
    if (!this.components.has(key)) return false;
    const moduleType = key.split('-')[0];
    const success = this.components.delete(key);
    if (success) this.moduleTypes[moduleType]?.delete(key);
    this.notifyListeners('componentUnloaded', { key, moduleType });
    return success;
  }

  addEventListener(event, callback) {
    if (this.eventListeners[event] && typeof callback === 'function') {
      this.eventListeners[event].push(callback);
      return true;
    }
    return false;
  }

  removeEventListener(event, callback) {
    if (!this.eventListeners[event]) return false;
    this.eventListeners[event] = this.eventListeners[event].filter(cb => cb !== callback);
    return true;
  }

  notifyListeners(event, data) {
    if (!event) {
      console.error('[component-registry] Cannot notify listeners: event name is required');
      return;
    }
    
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
      console.info(`[component-registry] Creating new event listener array for: ${event}`);
    }
    
    if (this.eventListeners[event].length === 0) {
      console.info(`[component-registry] No listeners registered for event: ${event}`);
    }
    
    this.eventListeners[event].forEach((callback, index) => {
      if (typeof callback !== 'function') {
        console.error(`[component-registry] Invalid listener at index ${index} for event ${event}`);
        return;
      }
      
      try {
        callback(data);
      } catch (err) {
        console.error(`[component-registry] Error in event listener for ${event}: ${err.message}`);
        console.error(err.stack);
      }
    });
    
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(`vaio:${event}`, {
        detail: {
          ...data,
          timestamp: Date.now(),
          eventType: event
        }
      }));
    }
  }
}

const registry = new ComponentRegistry();
export default registry;