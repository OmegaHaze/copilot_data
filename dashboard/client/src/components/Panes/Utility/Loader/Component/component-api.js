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
    console.log('[component-api] Fetching all module types...');
    
    // Use individual fetch calls with detailed error handling
    let systemModules = [], serviceModules = [], userModules = [];
    
    try {
      systemModules = await fetchModules(MODULE_TYPES.SYSTEM);
      console.log(`[component-api] Fetched ${systemModules.length} SYSTEM modules`);
    } catch (sysError) {
      console.error('[component-api] SYSTEM module fetch error:', sysError);
    }
    
    try {
      serviceModules = await fetchModules(MODULE_TYPES.SERVICE);
      console.log(`[component-api] Fetched ${serviceModules.length} SERVICE modules`);
    } catch (svcError) {
      console.error('[component-api] SERVICE module fetch error:', svcError);
    }
    
    try {
      userModules = await fetchModules(MODULE_TYPES.USER);
      console.log(`[component-api] Fetched ${userModules.length} USER modules`);
    } catch (userError) {
      console.error('[component-api] USER module fetch error:', userError);
    }
    
    const moduleData = {
      [MODULE_TYPES.SYSTEM]: Array.isArray(systemModules) ? systemModules : [],
      [MODULE_TYPES.SERVICE]: Array.isArray(serviceModules) ? serviceModules : [],
      [MODULE_TYPES.USER]: Array.isArray(userModules) ? userModules : []
    };
    
    console.log('[component-api] Complete module data:', moduleData);
    
    // Add a _fetchTime property for debugging
    moduleData._fetchTime = new Date().toISOString();
    
    return moduleData;
  } catch (error) {
    console.error('Failed to fetch all modules:', error);
    return {
      [MODULE_TYPES.SYSTEM]: [],
      [MODULE_TYPES.SERVICE]: [],
      [MODULE_TYPES.USER]: [],
      _error: error.message,
      _fetchTime: new Date().toISOString()
    };
  }
}