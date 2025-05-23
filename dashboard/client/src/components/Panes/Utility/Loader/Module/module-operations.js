/**
 * module-operations.js
 * Operations for managing module instances
 * 
 * This module handles the core operations for managing modules in the system:
 * - Adding new module instances
 * - Removing module instances
 * - Toggling modules on/off
 * - Persisting module state
 * 
 * REGISTRY INTEGRATION:
 * The system now uses the Module Registry as the independent source of truth:
 * - Module Registry - Manages module metadata, instances, and data structure
 * 
 * Previously, this system was integrated with the component registry, but now
 * it operates independently with its own module registry.
 */

import { MODULE_TYPES } from './module-constants';
import { getCanonicalKey, createPaneId, getInstanceId } from './module-shared';
import { synchronizeLayoutAndModules } from '../Layout/layout-shared.js';
import { saveLayoutsToSession } from '../Layout/layout-storage.js';
import moduleRegistry from './module-registry';

/**
 * MODULE-FLOW-6.2.1: Module Instance Finding - Instance Detection
 * COMPONENT: Module System - Instance Lookup
 * PURPOSE: Finds all active instances of a specific module type
 * FLOW: Used by toggle and remove operations
 * @param {string} moduleType - Module type to find
 * @param {Array} activeModules - List of active module IDs
 * @returns {Array} - List of matching module instance IDs
 */
export function findActiveInstances(moduleType, activeModules) {
  if (!Array.isArray(activeModules) || !moduleType) return [];
  const canonical = getCanonicalKey(moduleType);
  
  return activeModules.filter(id => {
    const parts = id.split('-');
    return parts.length >= 2 && getCanonicalKey(parts[0]) === canonical;
  });
}

/**
 * MODULE-FLOW-6.2.2: Module Instance Checking - Instance Existence
 * COMPONENT: Module System - Instance Detection
 * PURPOSE: Checks if any instances of a module type exist
 * FLOW: Used by toggle operations and UI components
 * @param {string} moduleType - Module type to check
 * @param {Array} activeModules - List of active module IDs
 * @returns {boolean} - Whether any instances exist
 */
export function hasActiveInstances(moduleType, activeModules) {
  return findActiveInstances(moduleType, activeModules).length > 0;
}

/**
 * MODULE-FLOW-6.2.3: Module Creation - New Instance Creation
 * COMPONENT: Module System - Instance Creation
 * PURPOSE: Creates a new module instance
 * FLOW: Core function for adding modules to dashboard
 * @param {string} moduleKey - Module key (TYPE-IDENTIFIER)
 * @param {Array} activeModules - Current active modules
 * @param {Object} gridLayout - Current grid layout
 * @returns {Object} - Updated modules, layout, and instance info
 */
export async function addModule(moduleKey, activeModules, gridLayout) {
  if (!moduleKey) throw new Error('Module key is required');

  /********************************************************************
   * 🔍 MODULE INSTANCE CREATION 🔍
   * 
   * Here's where a module instance is created:
   * 1. Split moduleKey into type and identifier (e.g. "SYSTEM-SupervisorPane")
   * 2. Generate a unique instanceId for this instance
   * 3. Create a full paneId in format "TYPE-IDENTIFIER-INSTANCEID"
   * 4. Update the list of active modules with this new paneId
   * 5. Generate layout grid position for the new pane
   * 6. Synchronize the layout and module lists
   * 
   * This paneId will later be used by component-loader to dynamically
   * load and render the corresponding React component
   ********************************************************************/
  const [moduleType, staticIdentifier = 'UnknownModule'] = moduleKey.split('-');
  const instanceId = getInstanceId();
  const paneId = createPaneId(moduleType, staticIdentifier, instanceId);
  
  // Add debug logging to trace the pane ID creation
  console.debug('[module-operations] Creating new module instance:', { 
    moduleKey,
    moduleType, 
    staticIdentifier, 
    instanceId,
    paneId 
  });
  
  const updatedModules = [...(activeModules || []), paneId];

  const { generateItemLayouts } = await import('../Layout/layout-index.jsx');
  const updatedLayout = await generateItemLayouts(paneId, gridLayout || {});

  const { layouts, modules } = synchronizeLayoutAndModules(updatedLayout, updatedModules);

  return {
    activeModules: modules,
    gridLayout: layouts,
    paneId,
    moduleType,
    staticIdentifier,
    instanceId
  };
}

/**
 * MODULE-FLOW-6.2.4: Module Removal - Instance Removal
 * COMPONENT: Module System - Instance Removal
 * PURPOSE: Removes all instances of a module type
 * FLOW: Core function for removing modules from dashboard
 * 
 * REGISTRY INTEGRATION:
 * When removing modules, we need to:
 * 1. Remove the module from the active modules list
 * 2. Remove the module from the grid layout
 * 3. Unregister from the module registry
 * 
 * The module registry ensures that all module data is properly cleaned up
 * when instances are removed from the dashboard.
 * 
 * @param {string} moduleType - Module type to remove
 * @param {Array} activeModules - Current active modules
 * @param {Object} gridLayout - Current grid layout
 * @returns {Object} - Updated modules, layout, and removed instances
 */
export function removeModule(moduleType, activeModules, gridLayout) {
  const instances = findActiveInstances(moduleType, activeModules);
  if (instances.length === 0) return { activeModules, gridLayout };

  const updatedModules = activeModules.filter(id => !instances.includes(id));
  const updatedLayout = { ...gridLayout };

  Object.keys(updatedLayout).forEach(bp => {
    if (Array.isArray(updatedLayout[bp])) {
      updatedLayout[bp] = updatedLayout[bp].filter(item => !instances.includes(item.i));
    }
  });

  const { layouts, modules } = synchronizeLayoutAndModules(updatedLayout, updatedModules);

  /********************************************************************
   * 🔄 MODULE REGISTRY INTEGRATION 🔄
   * 
   * After removing modules from the active list, we also need to
   * unregister them from the module registry.
   * 
   * The module registry is the "source of truth" for currently loaded
   * modules, and we need to ensure it stays in sync with the active
   * modules in the user's dashboard.
   ********************************************************************/
  
  // Notify module registry about removed instances
  if (instances.length > 0) {
    instances.forEach(instanceId => {
      try {
        // Unregister from module registry
        moduleRegistry.unregisterModule(instanceId);
      } catch (err) {
        console.warn(`Failed to unregister module ${instanceId}:`, err);
      }
    });
  }

  return {
    activeModules: modules,
    gridLayout: layouts,
    removedInstances: instances
  };
}

/**
 * MODULE-FLOW-6.2.5: Module Toggle - Instance Toggle
 * COMPONENT: Module System - Instance Control
 * PURPOSE: Toggles a module type on or off
 * FLOW: Combines add and remove operations into one function
 * @param {string} moduleType - Module type to toggle
 * @param {Array} activeModules - Current active modules
 * @param {Object} gridLayout - Current grid layout
 * @returns {Object} - Updated state with action ('added' or 'removed')
 */
export async function toggleModule(moduleType, activeModules, gridLayout) {
  const hasInstances = hasActiveInstances(moduleType, activeModules);
  return hasInstances
    ? { ...removeModule(moduleType, activeModules, gridLayout), action: 'removed' }
    : { ...(await addModule(moduleType, activeModules, gridLayout)), action: 'added' };
}

/**
 * MODULE-FLOW-6.2.7: Module Clear State - Complete Reset
 * COMPONENT: Module System - State Clearing
 * PURPOSE: Clears all module data (localStorage and backend)
 * FLOW: Called when user wants to completely reset system
 * @param {string} clearType - Type of clear ('modules', 'all')
 * @returns {Promise<Object>} - Result of the operation
 */
export async function clearAllModuleData(clearType = 'modules') {
  try {
    console.log(`[module-operations] Clearing all module data (type: ${clearType})...`);
    
    // Import the functions we need
    const { clearModuleStorage } = await import('./module-storage');
    const { resetModuleDatabase, clearModuleDatabase } = await import('./module-api');
    
    // Clear localStorage regardless of clearType
    clearModuleStorage();
    
    // Clear backend data based on clearType
    if (clearType === 'all') {
      // Clear entire database
      const result = await clearModuleDatabase();
      return {
        success: result.success,
        message: 'All module data cleared (localStorage and database)',
        backendResult: result
      };
    } else {
      // Reset only module tables
      const result = await resetModuleDatabase();
      return {
        success: result.success,
        message: 'Module data cleared (localStorage and module tables)',
        backendResult: result
      };
    }
  } catch (error) {
    console.error('[module-operations] Error clearing module data:', error);
    return {
      success: false,
      message: 'Failed to clear module data',
      error: error.message
    };
  }
}

/**
 * MODULE-FLOW-6.2.6: Module State Persistence - State Saving
 * COMPONENT: Module System - State Management
 * PURPOSE: Saves complete module system state
 * FLOW: Persists layout and active modules to storage
 * @param {Object} gridLayout - Current grid layout
 * @param {Array} activeModules - Current active modules
 * @returns {Promise<boolean>} - Success status
 */
export async function saveModuleState(gridLayout, activeModules) {
  try {
    const { layouts, modules } = synchronizeLayoutAndModules(gridLayout, activeModules);
    await saveLayoutsToSession(layouts, modules);

    /********************************************************************
     * 🔄 SESSION INTEGRATION 🔄
     * 
     * Here the module system integrates with the session system to
     * persist the user's layout and active modules both to local storage
     * and to the backend server.
     * 
     * This ensures the user's dashboard state is preserved between
     * page reloads and across different devices.
     ********************************************************************/
    const { saveLayouts, saveModules } = await import('../Session/session-manager.js');
    await Promise.all([
      saveLayouts(layouts),
      saveModules(modules)
    ]);

    return true;
  } catch (error) {
    console.error('Failed to save module state:', error);
    return false;
  }
}