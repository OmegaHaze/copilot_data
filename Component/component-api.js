/**
 * component-api.js
 * Functions for interacting with component-related APIs
 */

import { API_ENDPOINTS, TIMEOUTS, MODULE_TYPES } from './component-constants';

/**
 * Fetch modules from API
 * @param {string} type - Module type
 * @returns {Promise<Array>} - Array of modules
 */
export async function fetchModules(type) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUTS.API_REQUEST);
    
    const response = await fetch(`${API_ENDPOINTS.MODULES}?module_type=${type}`, {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch ${type} modules: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error fetching ${type} modules:`, error);
    return [];
  }
}

/**
 * Load all module types from API
 * @returns {Promise<Object>} - Module data by type
 */
export async function fetchAllModules() {
  try {
    const [SYSTEM, SERVICE, USER] = await Promise.all([
      fetchModules(MODULE_TYPES.SYSTEM),
      fetchModules(MODULE_TYPES.SERVICE),
      fetchModules(MODULE_TYPES.USER)
    ]);
    
    return {
      [MODULE_TYPES.SYSTEM]: SYSTEM,
      [MODULE_TYPES.SERVICE]: SERVICE,
      [MODULE_TYPES.USER]: USER
    };
  } catch (error) {
    console.error('Failed to fetch all modules:', error);
    return {
      [MODULE_TYPES.SYSTEM]: [],
      [MODULE_TYPES.SERVICE]: [],
      [MODULE_TYPES.USER]: []
    };
  }
}