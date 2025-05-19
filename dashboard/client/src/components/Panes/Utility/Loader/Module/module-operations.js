// module-operations.js
// High-level operations for module management

import {
  getCanonicalKey,
  createPaneId,
  generateInstanceId
} from './module-core';

import { STORAGE_KEYS } from './module-constants';
import { saveLayoutsToSession } from '../Layout/layout-storage.js';
import { synchronizeLayoutAndModules } from '../Layout/layout-shared.js';
import registry from '../Component/component-registry';
/**
 * Find active instances of a module type
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
 * Check if any instances of a module type exist
 */
export function hasActiveInstances(moduleType, activeModules) {
  return findActiveInstances(moduleType, activeModules).length > 0;
}

/**
 * Add module instance with responsive layout
 */
export async function addModule(moduleKey, activeModules, gridLayout) {
  if (!moduleKey) throw new Error('Module key is required');

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
 * Remove all instances of a module type
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

  // Notify registry about removed instances
  if (instances.length > 0) {
    // Import registry dynamically to prevent circular dependencies
    try {
      const registry = require('../Component/component-registry').default;
      instances.forEach(instanceId => {
        try {
          registry.unregisterComponent(instanceId);
        } catch (err) {
          console.warn(`Failed to unregister component ${instanceId}:`, err);
        }
      });
    } catch (err) {
      console.warn('Failed to load component registry:', err);
    }
  }

  return {
    activeModules: modules,
    gridLayout: layouts,
    removedInstances: instances
  };
}

/**
 * Toggle module instance on/off
 */
export async function toggleModule(moduleType, activeModules, gridLayout) {
  const hasInstances = hasActiveInstances(moduleType, activeModules);
  return hasInstances
    ? { ...removeModule(moduleType, activeModules, gridLayout), action: 'removed' }
    : { ...(await addModule(moduleType, activeModules, gridLayout)), action: 'added' };
}

/**
 * Cache module metadata
 */
export function cacheModuleData(modules) {
  try {
    localStorage.setItem(STORAGE_KEYS.MODULE_CACHE, JSON.stringify({
      timestamp: Date.now(),
      data: modules
    }));
    return true;
  } catch (error) {
    console.warn('Failed to cache module data:', error);
    return false;
  }
}

/**
 * Load module metadata from cache
 */
export function loadCachedModuleData() {
  try {
    const cached = localStorage.getItem(STORAGE_KEYS.MODULE_CACHE);
    if (!cached) return null;

    const parsed = JSON.parse(cached);
    if (Date.now() - parsed.timestamp > 24 * 60 * 60 * 1000) return null;

    return parsed.data;
  } catch (error) {
    console.warn('Failed to load cached module data:', error);
    return null;
  }
}

/**
 * Save module state (layout + active list)
 */
export async function saveModuleState(gridLayout, activeModules) {
  try {
    const { layouts, modules } = synchronizeLayoutAndModules(gridLayout, activeModules);
    await saveLayoutsToSession(layouts, modules);

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
