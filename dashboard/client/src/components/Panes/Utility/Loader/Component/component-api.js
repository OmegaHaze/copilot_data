/**
 * component-api.js
 * Functions for interacting with component-related APIs
 */

import { API_ENDPOINTS, TIMEOUTS, MODULE_TYPES } from './component-constants';
import { getCanonicalKey } from './component-shared';

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
    
    const endTime = Date.now();
    console.log(`[component-api] Received response for ${type} modules after ${endTime - startTime}ms`);
    
    if (!response.ok) {
      console.error(`[component-api] API returned status ${response.status} for ${type} modules`);
      throw new Error(`Failed to fetch ${type} modules: ${response.status}`);
    }
    
    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      console.error(`[component-api] Failed to parse JSON response for ${type} modules:`, parseError);
      throw new Error(`Invalid JSON response for ${type} modules`);
    }
    
    if (!Array.isArray(data)) {
      console.error(`[component-api] Expected array for ${type} modules but got:`, typeof data);
      return [];
    }
    
    console.log(`[component-api] Received ${data.length} ${type} modules`);
    
    // Add diagnostic metadata
    data._fetchTime = new Date().toISOString();
    data._responseTime = endTime - startTime;
    
    return data;
  } catch (error) {
    console.error(`[component-api] Error fetching ${type} modules:`, error);
    return [];
  }
}

/**
 * Load all module types from API
 * @returns {Promise<Object>} - Module data by type
 * @deprecated Use fetchModules from '../Module/module-api.js' instead
 */
export async function fetchAllModules() {
  console.warn('[component-api] fetchAllModules is deprecated. Use fetchModules from module-api.js instead.');
  
  // Import and use the centralized module-api fetchModules
  try {
    const { fetchModules } = await import('../Module/module-api');
    return await fetchModules();
  } catch (error) {
    console.error('[component-api] Failed to import fetchModules from module-api.js:', error);
    
    // Fall back to original implementation if import fails
  try {
    console.log('[component-api] Fetching all modules...');
    
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
    
    // Initialize with MODULE_TYPES keys
    const moduleData = Object.values(MODULE_TYPES).reduce((acc, type) => {
      acc[type] = [];
      return acc;
    }, {});
    
    if (Array.isArray(allModules)) {
      allModules.forEach(module => {
        const type = getCanonicalKey(module.module_type || module.moduleType);
        
        // Normalize module using standard property names
        const normalizedModule = {
          ...module,
          moduleType: type,
          staticIdentifier: module.staticIdentifier || module.module || module.paneComponent || module.identifier
        };
        
        if (moduleData[type]) {
          moduleData[type].push(normalizedModule);
        } else {
          console.warn(`[component-api] Unknown module type: ${type}`, normalizedModule);
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
    // Return structure matching MODULE_TYPES
    return Object.values(MODULE_TYPES).reduce((acc, type) => {
      acc[type] = [];
      return acc;
    }, {
      _error: error.message,
      _fetchTime: new Date().toISOString()
    });
  }
  }
}