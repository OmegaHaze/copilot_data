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
    const apiUrl = API_ENDPOINTS.MODULES;
    console.log(`[component-api] Fetching modules for ${type} from ${apiUrl}?module_type=${type}`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      console.error(`[component-api] API request for ${type} modules timed out after ${TIMEOUTS.API_REQUEST}ms`);
    }, TIMEOUTS.API_REQUEST);
    
    // Log request start time for diagnostics
    const startTime = Date.now();
    console.log(`[component-api] Starting fetch for ${type} modules at ${new Date(startTime).toISOString()}`);
    
    const response = await fetch(`${apiUrl}?module_type=${type}`, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache, no-store'
      }
    });
    
    clearTimeout(timeoutId);
    
    // Log response time for diagnostics
    const endTime = Date.now();
    console.log(`[component-api] Received response for ${type} modules after ${endTime - startTime}ms`);
    
    if (!response.ok) {
      console.error(`[component-api] API returned status ${response.status} for ${type} modules`);
      throw new Error(`Failed to fetch ${type} modules: ${response.status}`);
    }
    
    // Try to parse the response as JSON
    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      console.error(`[component-api] Failed to parse JSON response for ${type} modules:`, parseError);
      throw new Error(`Invalid JSON response for ${type} modules`);
    }
    
    // Validate the response data
    if (!Array.isArray(data)) {
      console.error(`[component-api] Expected array for ${type} modules but got:`, typeof data);
      return []; // Return empty array instead of throwing
    }
    
    console.log(`[component-api] Received ${data.length} ${type} modules`);
    
    // Add diagnostic metadata
    data._fetchTime = new Date().toISOString();
    data._responseTime = endTime - startTime;
    
    return data;
  } catch (error) {
    console.error(`[component-api] Error fetching ${type} modules:`, error);
    return []; // Always return an empty array on failure
  }
}

/**
 * Load all module types from API
 * @returns {Promise<Object>} - Module data by type
 */
export async function fetchAllModules() {
  try {
    console.log('[component-api] Fetching all modules...');
    
    // Make a single request to get all modules at once
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      console.error(`[component-api] API request for all modules timed out after ${TIMEOUTS.API_REQUEST}ms`);
    }, TIMEOUTS.API_REQUEST);
    
    const startTime = Date.now();
    const response = await fetch(API_ENDPOINTS.MODULES, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache, no-store'
      }
    });
    
    clearTimeout(timeoutId);
    const endTime = Date.now();
    
    if (!response.ok) {
      throw new Error(`Failed to fetch modules: ${response.status}`);
    }
    
    const allModules = await response.json();
    console.log('[component-api] Received all modules:', allModules);
    
    // Group modules by type
    const moduleData = {
      [MODULE_TYPES.SYSTEM]: [],
      [MODULE_TYPES.SERVICE]: [],
      [MODULE_TYPES.USER]: []
    };
    
    if (Array.isArray(allModules)) {
      allModules.forEach(module => {
        // Convert module_type to uppercase to match MODULE_TYPES
        const type = (module.module_type || '').toUpperCase();
        if (moduleData[type]) {
          moduleData[type].push(module);
        } else {
          console.warn(`[component-api] Unknown module type: ${module.module_type}`, module);
        }
      });
    }
    
    console.log('[component-api] Grouped module data:', moduleData);
    
    // Add diagnostic data
    moduleData._fetchTime = new Date().toISOString();
    moduleData._responseTime = endTime - startTime;
    
    return moduleData;
  } catch (error) {
    console.error('[component-api] Failed to fetch modules:', error);
    return {
      [MODULE_TYPES.SYSTEM]: [],
      [MODULE_TYPES.SERVICE]: [],
      [MODULE_TYPES.USER]: [],
      _error: error.message,
      _fetchTime: new Date().toISOString()
    };
  }
}