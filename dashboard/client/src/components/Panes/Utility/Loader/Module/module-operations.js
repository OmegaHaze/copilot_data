// MODULE-FLOW-6.2: Module Operations - Core Module Instance Management
// COMPONENT: Module System - Instance Lifecycle
// PURPOSE: Manages module instances and their lifecycle operations
// FLOW: Core functions for creating, removing, and saving module state
// MERMAID-FLOW: flowchart TD; MOD6.2[Module Operations] -->|Manages| MOD6.2.1[Module Instances];
//               MOD6.2 -->|Uses| MOD6.3[Module Core];
//               MOD6.2 -->|Updates| MOD6.1[Component Registry];
//               MOD6.2 -->|Saves| MOD6.4[Module State]

// CONSOLIDATION PLAN: MODULE OPERATIONS REFACTORING
//
// High-level operations for module management with improved
// imports and removal of duplicated functionality

/********************************************************************
 * CONSOLIDATION NOTE:
 *
 * This file has been refactored to:
 * 1. Import shared utilities from shared-utilities.js
 * 2. Import storage functions from module-storage.js
 * 3. Use registry consistently (instead of dynamic imports)
 * 4. Import constants from canonical sources
 * 
 * ⚠️ PHASE 1 LIMITATIONS ⚠️
 * 
 * While we've imported the canonical storage functions from module-storage.js,
 * we still maintain the original duplicate functions in this file to ensure
 * backward compatibility during the transition. In Phase 2, we'll:
 * 
 * 1. Update all references to these functions to import from module-storage.js
 * 2. Remove the duplicate functions from this file entirely
 * 3. Update all tests to use the canonical versions
 * 
 * This approach ensures we don't break anything during the transition.
 ********************************************************************/

import {
  getCanonicalKey,
  createPaneId,
  generateInstanceId
} from '../Shared/shared-utilities';

import { STORAGE_KEYS } from '../Component/component-constants';
import { saveLayoutsToSession } from '../Layout/layout-storage.js';
import { synchronizeLayoutAndModules } from '../Layout/layout-shared.js';
import { cacheModuleData, loadCachedModuleData } from './module-storage.js';
import registry from '../Component/component-registry';

/********************************************************************
 * 🔄 MODULE-COMPONENT SYSTEM RELATIONSHIP 🔄
 * 
 * In this system:
 * - Modules are metadata definitions that come from the backend database
 * - Components are the actual React UI elements that render in the dashboard
 * - A module defines what kind of component can be created
 * - Each component instance is identified by a paneId with format:
 *   "MODULETYPE-STATICIDENTIFIER-INSTANCEID"
 * 
 * The flow is:
 * 1. Backend defines modules (SYSTEM, SERVICE, USER types)
 * 2. Frontend loads module definitions from API
 * 3. User adds a module instance to their dashboard
 * 4. Frontend creates a paneId and updates layout
 * 5. Component-loader dynamically imports the React component
 * 6. PaneGrid renders the component at the specified position
 ********************************************************************/

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
  const instanceId = generateInstanceId(moduleType);
  const paneId = createPaneId(moduleType, staticIdentifier, instanceId);
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
   * 🔄 COMPONENT REGISTRY INTEGRATION 🔄
   * 
   * After removing modules from the active list, we also need to
   * unregister them from the component registry.
   * 
   * The component registry is the "source of truth" for currently loaded
   * React components, while the module system tracks which ones are
   * active in the user's dashboard.
   ********************************************************************/
  
  // Notify registry about removed instances
  if (instances.length > 0) {
    instances.forEach(instanceId => {
      try {
        registry.unregisterComponent(instanceId);
      } catch (err) {
        console.warn(`Failed to unregister component ${instanceId}:`, err);
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