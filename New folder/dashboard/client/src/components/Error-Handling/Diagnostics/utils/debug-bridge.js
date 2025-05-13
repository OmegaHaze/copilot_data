/**
 * Debug Bridge
 * 
 * This utility provides a bridge between the ComponentRegistry and the debug overlay system,
 * allowing access to component registration information without direct dependencies.
 * 
 * The debug bridge avoids using direct window object access where possible, instead using
 * custom events to communicate with the debug overlay system.
 */

import { componentRegistry } from '../../../Panes/Utility/Loader/ComponentRegistry.jsx';
import { errorHandler } from '../../utils/errorHandler.js';
import { ErrorType, ErrorSeverity } from '../types/errorTypes.js';

/**
 * Initialize the debug bridge
 * This connects the ComponentRegistry with the debug overlay system
 */
export function initializeDebugBridge() {
  // Only initialize in browser environment
  if (typeof window === 'undefined') return;
  
  // Prevent multiple initializations
  if (window.debugBridgeInitialized) return;
  
  try {
    console.log('⚡ Initializing debug bridge...');

    // Register debugging utilities
    registerComponentRegistryTools();
    registerLayoutTools();
    registerEventHandlers();

    // Mark as initialized
    window.debugBridgeInitialized = true;
    
    // Log success message
    console.log('✅ Debug bridge initialized successfully');
    return true;
  } catch (err) {
    console.error('Failed to initialize debug bridge:', err);
    errorHandler.showError(
      `Failed to initialize debug bridge: ${err.message}`,
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

/**
 * Register debugging tools for working with the ComponentRegistry
 */
function registerComponentRegistryTools() {
  // Diagnostic tool to get component registry state
  window.debugRegistry = {
    // Get registered components with validation details
    getComponents: () => {
      try {
        // Use the registry directly instead of accessing internal Map
        const registeredComponents = {};
        
        if (!componentRegistry || !componentRegistry.components) {
          return { error: 'Component registry not initialized' };
        }
        
        // Get all module types from all categories
        const allModuleTypes = [
          ...Array.from(componentRegistry.moduleTypes.SYSTEM || []),
          ...Array.from(componentRegistry.moduleTypes.SERVICE || []),
          ...Array.from(componentRegistry.moduleTypes.USER || [])
        ];
        
        // Use registry methods for proper access
        allModuleTypes.forEach(moduleType => {
          const component = componentRegistry.getComponent(moduleType);
          registeredComponents[moduleType] = {
            registered: !!component,
            name: component ? (component.displayName || component.name || 'Anonymous') : null,
            category: getComponentCategory(moduleType),
            error: componentRegistry.errors.get(moduleType)
          };
        });
        
        // Also include components that have errors but might not be in a category
        componentRegistry.errors.forEach((error, moduleType) => {
          if (!registeredComponents[moduleType]) {
            registeredComponents[moduleType] = {
              registered: false,
              name: null,
              category: 'UNKNOWN',
              error: error
            };
          }
        });
        
        return registeredComponents;
      } catch (err) {
        console.error('Error in debugRegistry.getComponents:', err);
        return { error: err.message };
      }
    },
    
    // Get module data from registry
    getModuleData: () => {
      try {
        return {
          SYSTEM: [...(componentRegistry.moduleData.SYSTEM || [])],
          SERVICE: [...(componentRegistry.moduleData.SERVICE || [])],
          USER: [...(componentRegistry.moduleData.USER || [])],
          ALL: [...(componentRegistry.moduleData.ALL || [])]
        };
      } catch (err) {
        console.error('Error in debugRegistry.getModuleData:', err);
        return { error: err.message };
      }
    },
    
    // Get active instances from registry
    getInstances: () => {
      try {
        const allInstances = {};
        
        if (!componentRegistry || !componentRegistry.components) {
          return { error: 'Component registry not initialized' };
        }
        
        // Use registry methods for proper access
        componentRegistry.components.forEach((_, moduleType) => {
          const instances = componentRegistry.getInstances(moduleType);
          if (instances && instances.length > 0) {
            allInstances[moduleType] = instances;
          }
        });
        
        return allInstances;
      } catch (err) {
        console.error('Error in debugRegistry.getInstances:', err);
        return { error: err.message };
      }
    }
  };
}

/**
 * Register debugging tools for layouts
 */
function registerLayoutTools() {
  // No direct window manipulation for layout tools
  // Instead we'll use custom events
  
  // Create event for requesting layout debug info
  window.debugLayouts = {
    // Request current layout data via event
    requestLayoutData: () => {
      window.dispatchEvent(new CustomEvent('vaio:debug-request-layouts', {
        detail: { timestamp: Date.now() }
      }));
    },
    
    // Request layout save test via event
    testLayoutSave: () => {
      window.dispatchEvent(new CustomEvent('vaio:debug-test-layout-save', {
        detail: { timestamp: Date.now() }
      }));
    }
  };
}

/**
 * Register event handlers for the debug system
 */
function registerEventHandlers() {
  // Define debug toggle helper
  // This should dispatch an event that DebugOverlayContext listens for
  window.debugEvents = {
    toggleDebugOverlay: () => {
      window.dispatchEvent(new CustomEvent('vaio:toggle-debug-overlay', { 
        detail: { forced: false } 
      }));
    },
    
    // Force open the debug overlay
    openDebugOverlay: () => {
      window.dispatchEvent(new CustomEvent('vaio:toggle-debug-overlay', { 
        detail: { forced: true } 
      }));
    }
  };
}

/**
 * Get component category from module type
 * @param {string} moduleType 
 * @returns {string} 'SYSTEM', 'SERVICE', 'USER' or 'UNKNOWN'
 */
function getComponentCategory(moduleType) {
  if (!componentRegistry || !componentRegistry.moduleTypes) {
    return 'UNKNOWN';
  }
  
  const key = moduleType;
  
  if (componentRegistry.moduleTypes.SYSTEM.has(key)) {
    return 'SYSTEM';
  } else if (componentRegistry.moduleTypes.SERVICE.has(key)) {
    return 'SERVICE';
  } else if (componentRegistry.moduleTypes.USER.has(key)) {
    return 'USER';
  }
  
  return 'UNKNOWN';
}

// Auto-initialize when imported
initializeDebugBridge();
