/**
 * ModuleFilter.js
 * Responsible for filtering and managing module lists
 */

let componentRegistry;

/**
 * Dynamically import the component registry module
 */
async function loadComponentRegistry() {
  if (!componentRegistry) {
    const registry = await import('./ComponentRegistry.js');
    componentRegistry = registry.componentRegistry;
  }
}

/**
 * Filter items based on active modules using the component registry
 * @param {Array} items - All available items
 * @param {Array} activeModules - List of active module IDs
 * @returns {Array} - Filtered items that match active modules
 */
export async function filterByActiveModules(items, activeModules) {
  await loadComponentRegistry();

  console.log('ModuleFilter: Filtering by active modules', {
    itemCount: items?.length || 0,
    activeModuleCount: activeModules?.length || 0
  });
  
  if (!Array.isArray(items)) {
    console.warn('ModuleFilter: items is not an array:', items);
    return [];
  }
  
  if (!Array.isArray(activeModules) || activeModules.length === 0) {
    console.warn('ModuleFilter: No active modules to filter by');
    return [];
  }
  
  // Log active modules for debugging
  console.log('ModuleFilter: Active modules:', activeModules);
  
  const result = items.filter(item => {
    if (!item) {
      console.warn('ModuleFilter: Skipping null/undefined item');
      return false;
    }
    
    // Get the module key using the registry
    const moduleKey = componentRegistry.getCanonicalKey(item.module || item.name);
    if (!moduleKey) {
      console.warn('ModuleFilter: Could not get canonical key for item:', item);
      return false;
    }
    
    // Check for module instances using canonical keys
    const isActive = activeModules.some(activeId => {
      const activeKey = componentRegistry.getCanonicalKey(activeId);
      const match = activeKey === moduleKey;
      return match;
    });
    
    // Log detailed matching info for debugging
    if (isActive) {
      console.log(`ModuleFilter: MATCHED item "${moduleKey}"`, item);
    }
    
    return isActive;
  });
}

/**
 * Merge items from different module types into a single array
 * @param {Object} modules - Object containing arrays of different module types
 * @returns {Array} - Combined array of all modules
 */
export function mergeModuleItems(modules) {
  return [
    ...(modules.SYSTEM || []),
    ...(modules.SERVICE || []),
    ...(modules.USER || [])
  ].filter(Boolean);
}

/**
 * Process and validate module data
 * @param {Object} modules - Raw module data
 * @returns {Object} - Processed and validated module data with uppercase keys
 */
export function processModuleData(modules) {
  // Ensure we only use uppercase keys for Python enum compatibility
  const result = {
    SYSTEM: [],
    SERVICE: [],
    USER: []
  };
  
  // Handle explicit uppercase keys
  if (modules.SYSTEM && Array.isArray(modules.SYSTEM)) result.SYSTEM = modules.SYSTEM;
  if (modules.SERVICE && Array.isArray(modules.SERVICE)) result.SERVICE = modules.SERVICE;
  if (modules.USER && Array.isArray(modules.USER)) result.USER = modules.USER;
  
  // Handle any unknown keys by logging a warning
  Object.keys(modules).forEach(key => {
    if (key !== 'SYSTEM' && key !== 'SERVICE' && key !== 'USER') {
      console.error(`Invalid module type key: ${key}. Only uppercase SYSTEM, SERVICE, or USER are accepted.`);
    }
  });
  
  return result;
}
