/**
 * component-registry.js
 * Central registry for React components
 */

import { MODULE_TYPES, STORAGE_KEYS } from '../Module/module-constants';
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
    
    try {
      // Get module data directly from module registry - strict source of truth approach
      console.log('[component-registry] Initializing by getting data from module registry...');
      await this.setModuleData(); // This will fetch from moduleRegistry
      
      // Restore active modules from local storage
      const registryData = localStorage.getItem(STORAGE_KEYS.MODULE_REGISTRY);
      if (registryData) {
        try {
          const parsed = JSON.parse(registryData);
          if (parsed.activeModules) {
            this.activeModules = parsed.activeModules;
            this.restoreActiveModules();
          }
        } catch (err) {
          console.warn('[component-registry] Failed to parse registry data for active modules:', err);
        }
      }
    } catch (error) {
      console.error('[component-registry] Failed to initialize from module registry:', error);
      throw error; // Crash in strict mode
    }
    
    this.initialized = true;
    return true;
  }

  restoreActiveModules() {
    if (!Array.isArray(this.activeModules)) {
      console.warn('[component-registry] activeModules is not an array');
      return;
    }
    
    // Log active modules to understand what we're working with
    console.log('[component-registry] Restoring active modules:', this.activeModules.length);
    
    this.activeModules.forEach(({ moduleType, staticIdentifier, instanceId }) => {
      if (!(moduleType && staticIdentifier && instanceId)) {
        console.warn(`[component-registry] Invalid module data: ${JSON.stringify({ moduleType, staticIdentifier, instanceId })}`);
        return;
      }
      
      // Create the registration key which is what matters most for component resolution
      const key = createRegistrationKey(moduleType, staticIdentifier, instanceId);
      console.debug(`[component-registry] Processing registration key: ${key}`);
      
      // Ensure module type exists in moduleData
      if (!this.moduleData) this.moduleData = {};
      if (!this.moduleData[moduleType]) this.moduleData[moduleType] = [];
      
      // Find existing module info if available
      const moduleList = this.moduleData[moduleType];
      const moduleInfo = Array.isArray(moduleList) ? 
        moduleList.find(m => {
          const identifier = m?.staticIdentifier || m?.module || m?.paneComponent;
          return identifier === staticIdentifier;
        }) : null;
      
      // Only notify for module state changes - don't create placeholders
      // This simplifies the system to focus on key-based operations
      if (moduleInfo) {
        this.notifyListeners('moduleStateChanged', {
          activeModule: key,
          moduleInfo,
          action: 'activate'
        });
      } else {
        // Just log it for debugging but use just the key for component resolution
        console.debug(`[component-registry] Module info not found for ${staticIdentifier}`);
        
        // No need to create placeholders - component-loader will handle resolution
        this.notifyListeners('moduleStateChanged', {
          activeModule: key,
          moduleType,
          staticIdentifier,
          action: 'activate-key-only'
        });
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
    
    // Use MODULE storage keys for consistency across the system
    localStorage.setItem(STORAGE_KEYS.MODULE_REGISTRY, JSON.stringify(registryData));
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

  async setModuleData(data = null) {
    // In strict approach, always get data from module registry first
    try {
      // Import moduleRegistry and use it as the definitive source
      const moduleRegistry = await import('../Module/module-registry').then(m => m.default);
      
      // Ensure module registry is initialized
      if (!moduleRegistry.initialized) {
        console.log('[component-registry] Module registry not initialized, initializing now...');
        await moduleRegistry.initialize();
      }
      
      // Get the latest data directly from module registry
      const registryData = moduleRegistry.getAllModules();
      
      if (!registryData) {
        throw new Error('Module registry did not provide valid data');
      }
      
      console.log('[component-registry] Using data from module registry:', {
        SYSTEM: Array.isArray(registryData.SYSTEM) ? registryData.SYSTEM.length : 0,
        SERVICE: Array.isArray(registryData.SERVICE) ? registryData.SERVICE.length : 0,
        USER: Array.isArray(registryData.USER) ? registryData.USER.length : 0
      });
      
      // Initialize with MODULE_TYPES structure and ensure arrays
      this.moduleData = Object.values(MODULE_TYPES).reduce((acc, type) => {
        // Make sure each type is initialized with an empty array
        acc[type] = [];
        
        // Copy data from registry if it exists
        if (registryData[type] && Array.isArray(registryData[type])) {
          acc[type] = [...registryData[type]];
        }
        
        return acc;
      }, {});
      
      this.updateComponentRegistry();
  
      this.notifyListeners('moduleDataChanged', {
        moduleData: this.moduleData,
        activeModules: this.activeModules,
        timestamp: Date.now(),
        source: 'moduleRegistry'
      });
    } catch (error) {
      console.error('[component-registry] Critical error getting data from module registry:', error);
      throw error; // In strict mode, propagate errors
    }
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