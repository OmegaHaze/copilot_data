/**
 * storage.js
 * Pure functions for layout persistence to localStorage and sessionStorage
 */

import { STORAGE_KEYS } from './layout-constants';
import { validateLayout, transformLayout } from './layout-core';

/**
 * Saves layouts to localStorage only
 * @param {Object} layouts - Layouts to save
 * @returns {boolean} Success status
 */
export function saveToLocalStorage(layouts) {
  if (!validateLayout(layouts)) {
    console.error('Invalid layouts structure provided to saveToLocalStorage');
    return false;
  }
  
  try {
    // Prepare layout for storage (strip unnecessary props, validate structure)
    const transformedLayouts = transformLayout(layouts);
    localStorage.setItem(STORAGE_KEYS.LAYOUTS, JSON.stringify(transformedLayouts));
    return true;
  } catch (error) {
    console.error('Failed to save layouts to localStorage:', error);
    return false;
  }
}

/**
 * Saves active modules to localStorage
 * @param {Array} modules - Active module IDs
 * @returns {boolean} Success status
 */
export function saveActiveModulesToLocalStorage(modules) {
  if (!Array.isArray(modules)) {
    console.error('Invalid modules array provided to saveActiveModulesToLocalStorage');
    return false;
  }
  
  try {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_MODULES, JSON.stringify(modules));
    return true;
  } catch (error) {
    console.error('Failed to save active modules to localStorage:', error);
    return false;
  }
}

/**
 * Loads layouts from localStorage
 * @returns {Object|null} Loaded layouts or null if not found/invalid
 */
export function loadLayoutsFromLocalStorage() {
  try {
    const storedData = localStorage.getItem(STORAGE_KEYS.LAYOUTS);
    if (!storedData) {
      return null;
    }
    
    const parsedLayouts = JSON.parse(storedData);
    
    // Validate the loaded layouts
    if (!validateLayout(parsedLayouts)) {
      console.warn('Invalid layouts found in localStorage');
      return null;
    }
    
    return parsedLayouts;
  } catch (error) {
    console.error('Failed to load layouts from localStorage:', error);
    return null;
  }
}

/**
 * Loads active modules from localStorage
 * @returns {Array|null} Active modules or null if not found/invalid
 */
export function loadActiveModulesFromLocalStorage() {
  try {
    const storedModules = localStorage.getItem(STORAGE_KEYS.ACTIVE_MODULES);
    if (!storedModules) {
      return null;
    }
    
    const parsedModules = JSON.parse(storedModules);
    
    // Validate the loaded modules
    if (!Array.isArray(parsedModules)) {
      console.warn('Invalid active modules found in localStorage');
      return null;
    }
    
    return parsedModules;
  } catch (error) {
    console.error('Failed to load active modules from localStorage:', error);
    return null;
  }
}

/**
 * Clears all layout data from localStorage
 */
export function clearLayoutsFromLocalStorage() {
  try {
    localStorage.removeItem(STORAGE_KEYS.LAYOUTS);
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_MODULES);
    return true;
  } catch (error) {
    console.error('Failed to clear layout data from localStorage:', error);
    return false;
  }
}
