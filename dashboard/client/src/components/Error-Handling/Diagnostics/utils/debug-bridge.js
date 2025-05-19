/**
 * Debug Bridge
 * 
 * Connects the ComponentRegistry to the debug overlay system via safe methods,
 * avoiding direct window mutation or raw registry access.
 */

import componentRegistry from '../../../Panes/Utility/Loader/Component/component-registry.js';
import { errorHandler } from '../../utils/errorHandler.js';
import { ErrorType, ErrorSeverity } from '../types/errorTypes.js';

export function initializeDebugBridge() {
  if (typeof window === 'undefined') return;
  if (window.debugBridgeInitialized) return;

  try {
    console.log('⚡ Initializing debug bridge...');

    registerComponentRegistryTools();
    registerLayoutTools();
    registerEventHandlers();

    window.debugBridgeInitialized = true;
    console.log('✅ Debug bridge initialized successfully');
    return true;
  } catch (err) {
    console.error('Failed to initialize debug bridge:', err);
    errorHandler.showError(
      `Debug bridge init failed: ${err.message}`,
      ErrorType.SYSTEM,
      ErrorSeverity.MEDIUM,
      {
        componentName: 'debug-bridge',
        action: 'initializeDebugBridge',
        location: 'debug-bridge.js',
        metadata: {
          error: err.toString(),
          stack: err.stack
        }
      }
    );
    return false;
  }
}

function registerComponentRegistryTools() {
  window.debugRegistry = {
    getComponents: () => {
      try {
        const output = {};
        const allKeys = componentRegistry.getAllRegisteredKeys();

        allKeys.forEach((key) => {
          const component = componentRegistry.getComponent(key);
          output[key] = {
            registered: !!component,
            name: component?.name || component?.name || null,
            category: componentRegistry.getCategoryForModule?.(key) || 'UNKNOWN',
            error: componentRegistry.errors?.get(key) || null
          };
        });

        // Include errors that might not be tied to keys anymore
        if (componentRegistry.errors) {
          componentRegistry.errors.forEach((error, key) => {
            if (!output[key]) {
              output[key] = {
                registered: false,
                name: null,
                category: 'UNKNOWN',
                error
              };
            }
          });
        }

        return output;
      } catch (err) {
        console.error('debugRegistry.getComponents failed:', err);
        return { error: err.message };
      }
    },

    getModuleData: async () => {
      try {
        // Log the current state of the registry's moduleData for debugging
        console.log('Debug registry getting module data:', componentRegistry.moduleData);
        
        // Return what's currently in the registry without any automatic API refresh
        return {
          SYSTEM: Array.isArray(componentRegistry.moduleData?.SYSTEM) ? [...componentRegistry.moduleData.SYSTEM] : [],
          SERVICE: Array.isArray(componentRegistry.moduleData?.SERVICE) ? [...componentRegistry.moduleData.SERVICE] : [],
          USER: Array.isArray(componentRegistry.moduleData?.USER) ? [...componentRegistry.moduleData.USER] : [],
          _timestamp: new Date().toISOString(), // Add timestamp for tracking
          _diagnostic: {
            source: 'registry-cache',
            systemCount: Array.isArray(componentRegistry.moduleData?.SYSTEM) ? componentRegistry.moduleData.SYSTEM.length : 0,
            serviceCount: Array.isArray(componentRegistry.moduleData?.SERVICE) ? componentRegistry.moduleData.SERVICE.length : 0,
            userCount: Array.isArray(componentRegistry.moduleData?.USER) ? componentRegistry.moduleData.USER.length : 0
          }
        };
        
        // NO automatic background refresh to avoid flooding the console with API calls
        // Users can explicitly refresh data using the "Force Refresh Module Data" button instead
      } catch (err) {
        console.error('debugRegistry.getModuleData failed:', err);
        return { 
          error: err.message,
          SYSTEM: [],
          SERVICE: [],
          USER: [],
          _timestamp: new Date().toISOString(),
          _error: true
        };
      }
    },

    getInstances: () => {
      try {
        const out = {};
        const allKeys = componentRegistry.getAllRegisteredKeys();

        allKeys.forEach((key) => {
          const instances = componentRegistry.getInstances?.(key);
          if (Array.isArray(instances) && instances.length > 0) {
            out[key] = instances;
          }
        });

        return out;
      } catch (err) {
        console.error('debugRegistry.getInstances failed:', err);
        return { error: err.message };
      }
    }
  };
}

function registerLayoutTools() {
  window.debugLayouts = {
    requestLayoutData: () => {
      window.dispatchEvent(new CustomEvent('vaio:debug-request-layouts', {
        detail: { timestamp: Date.now() }
      }));
    },
    testLayoutSave: () => {
      window.dispatchEvent(new CustomEvent('vaio:debug-test-layout-save', {
        detail: { timestamp: Date.now() }
      }));
    }
  };
}

function registerEventHandlers() {
  window.debugEvents = {
    toggleDebugOverlay: () => {
      window.dispatchEvent(new CustomEvent('vaio:toggle-debug-overlay', {
        detail: { forced: false }
      }));
    },
    openDebugOverlay: () => {
      window.dispatchEvent(new CustomEvent('vaio:toggle-debug-overlay', {
        detail: { forced: true }
      }));
    }
  };
}

// Auto-initialize on import
initializeDebugBridge();
