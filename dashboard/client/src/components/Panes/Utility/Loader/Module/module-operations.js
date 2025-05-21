// module-operations.js
// CONSOLIDATION PLAN: MODULE OPERATIONS REFACTORING
//
// High-level operations for module management with improved
// imports and removal of duplicated functionality

/********************************************************************
 * 📝 CONSOLIDATION NOTE:
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

/******************************************************************
 * ✅ CRITICAL FUNCTION: INSTANCE FINDER ✅
 * 
 * PURPOSE:
 * - Find all active instances of a specific module type
 * - Core dependency for module toggling and batch operations
 * - Essential for synchronizing module state with layout
 * 
 * IMPACT IF REMOVED:
 * - Module toggling would break completely
 * - Instance tracking would fail
 * - Layout synchronization would be impossible
 ******************************************************************/
export function findActiveInstances(moduleType, activeModules) {
  if (!Array.isArray(activeModules) || !moduleType) return [];
  const canonical = getCanonicalKey(moduleType);
  
  return activeModules.filter(id => {
    const parts = id.split('-');
    return parts.length >= 2 && getCanonicalKey(parts[0]) === canonical;
  });
}

/******************************************************************
 * ✅ CRITICAL FUNCTION: INSTANCE EXISTENCE CHECK ✅
 * 
 * PURPOSE:
 * - Quickly check if any instances of a module type are active
 * - Used by the launcher system to determine toggle state
 * - Required for conditional UI rendering based on module presence
 * 
 * IMPACT IF REMOVED:
 * - Launch buttons would have incorrect toggle state
 * - UI wouldn't know if modules are already open
 * - Toggle operations would need more complex logic
 ******************************************************************/
export function hasActiveInstances(moduleType, activeModules) {
  return findActiveInstances(moduleType, activeModules).length > 0;
}

/******************************************************************
 * ⭐️ CORE CRITICAL FUNCTION: MODULE CREATION ⭐️
 * 
 * PURPOSE:
 * - Primary entry point for creating new module instances
 * - Generates unique identifiers for module instances
 * - Creates layout positions for new modules
 * - Core functionality for the entire dashboard system
 * 
 * IMPACT IF REMOVED:
 * - Users couldn't add any modules to the dashboard
 * - No new components could be created or displayed
 * - Launch buttons would fail to create instances
 * 
 * DO NOT MODIFY WITHOUT EXTENSIVE TESTING!
 ******************************************************************/
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

/******************************************************************
 * ⭐️ CORE CRITICAL FUNCTION: MODULE REMOVAL ⭐️
 * 
 * PURPOSE:
 * - Remove all instances of a specific module type
 * - Clean up layout grid positions
 * - Unregister components from the component registry
 * - Essential for module lifecycle management
 * 
 * IMPACT IF REMOVED:
 * - Users couldn't remove modules from the dashboard
 * - Would cause memory leaks as components stay registered
 * - Layout would get out of sync with active modules
 * - Toggle operations would break (add would work, remove wouldn't)
 * 
 * DO NOT MODIFY WITHOUT EXTENSIVE TESTING!
 ******************************************************************/
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

/******************************************************************
 * ✅ CRITICAL FUNCTION: MODULE TOGGLE ✅
 * 
 * PURPOSE:
 * - Toggle a module type on or off in the dashboard
 * - Convenience wrapper combining add and remove operations
 * - Primary function called by launch buttons and UI controls
 * 
 * IMPACT IF REMOVED:
 * - Launch buttons would need to implement complex toggle logic
 * - User experience for toggling modules would be inconsistent
 * - Most module actions in the UI would fail
 ******************************************************************/
export async function toggleModule(moduleType, activeModules, gridLayout) {
  const hasInstances = hasActiveInstances(moduleType, activeModules);
  return hasInstances
    ? { ...removeModule(moduleType, activeModules, gridLayout), action: 'removed' }
    : { ...(await addModule(moduleType, activeModules, gridLayout)), action: 'added' };
}

/********************************************************************
 * � STORAGE FUNCTION CONSOLIDATION 🔄
 * 
 * The duplicate storage functions have been removed from this file.
 * Instead, they are imported from module-storage.js, which is now
 * the canonical source for these functions.
 * 
 * References:
 * - cacheModuleData is imported from module-storage.js
 * - loadCachedModuleData is imported from module-storage.js
 ********************************************************************/

// No duplicate functions here anymore - they're imported from module-storage.js

/******************************************************************
 * ⭐️ CORE CRITICAL FUNCTION: STATE PERSISTENCE ⭐️
 * 
 * PURPOSE:
 * - Save the complete state of the module system
 * - Persists both layout positions and active module list
 * - Synchronizes layout and modules before saving
 * - Integrates with session system for cross-device persistence
 * 
 * IMPACT IF REMOVED:
 * - User's dashboard state would reset on page refresh
 * - Module positions would not be saved
 * - Active modules would be lost between sessions
 * - User experience would severely degrade
 * 
 * DO NOT MODIFY WITHOUT EXTENSIVE TESTING!
 ******************************************************************/
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
