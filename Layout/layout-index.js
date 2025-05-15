/**
 * index.js
 * Main entry point for the layout system
 * Provides a clean, unified API to the layout functionality
 */

import { BREAKPOINTS, COLS, MODULE_SIZE_MAP, DEFAULT_ROW_HEIGHT, MODULE_TYPE_STYLE_CLASSES } from './layout-constants';
import { createEmptyLayout, validateLayout, transformLayout } from './layout-core';
import { getModuleDefaultSize, getOptimalPosition } from './layout-positioning';
import { saveToLocalStorage, saveActiveModulesToLocalStorage, 
         loadLayoutsFromLocalStorage, loadActiveModulesFromLocalStorage,
         clearLayoutsFromLocalStorage } from './layout-storage';
import { fetchSessionData, updateSessionGrid, updateSessionModules,
         saveLayoutTemplate, getLayoutTemplates, getLayoutTemplate,
         applyLayoutTemplate } from './layout-api';
import { findLayoutItem, addItemToAllBreakpoints, removeItemFromAllBreakpoints,
         createItemForAllBreakpoints, updateItemInAllBreakpoints,
         resizeItemInAllBreakpoints, reorderLayoutsByPosition } from './layout-operations';

/**
 * Handles complete layout saving to both localStorage and backend API
 * @param {Object} layouts - Layouts to save
 * @param {boolean} skipApi - If true, only save to localStorage (default: false)
 * @returns {Promise<boolean>} Success status
 */
export async function saveLayout(layouts, skipApi = false) {
  // First save locally
  const localSaveSuccess = saveToLocalStorage(layouts);
  
  // If local save failed or API is skipped, return early
  if (!localSaveSuccess || skipApi) {
    return localSaveSuccess;
  }
  
  // Then try to update API
  try {
    await updateSessionGrid(layouts);
    return true;
  } catch (error) {
    console.error('Failed to save layouts to API:', error);
    // Local storage was still updated successfully
    return true;
  }
}

/**
 * Handles complete active modules saving to both localStorage and backend API
 * @param {Array} modules - Active module IDs
 * @param {boolean} skipApi - If true, only save to localStorage (default: false)
 * @returns {Promise<boolean>} Success status
 */
export async function saveActiveModules(modules, skipApi = false) {
  // First save locally
  const localSaveSuccess = saveActiveModulesToLocalStorage(modules);
  
  // If local save failed or API is skipped, return early
  if (!localSaveSuccess || skipApi) {
    return localSaveSuccess;
  }
  
  // Then try to update API
  try {
    await updateSessionModules(modules);
    return true;
  } catch (error) {
    console.error('Failed to save active modules to API:', error);
    // Local storage was still updated successfully
    return true;
  }
}

/**
 * Loads layouts from optimal source (localStorage as primary)
 * @param {Function} onSuccess - Callback on successful load
 * @returns {Promise<Object>} Loaded layouts
 */
export async function loadLayout(onSuccess) {
  // Try localStorage first
  const localLayouts = loadLayoutsFromLocalStorage();
  
  if (localLayouts) {
    if (onSuccess) onSuccess(localLayouts);
    return localLayouts;
  }
  
  // If no local layouts, try loading from API
  try {
    const sessionData = await fetchSessionData();
    let layouts = null;
    
    // Extract grid layouts from session data
    if (sessionData && sessionData.grid_layout) {
      layouts = sessionData.grid_layout;
    }
    
    // Save valid layouts to localStorage for future use
    if (layouts && validateLayout(layouts)) {
      saveToLocalStorage(layouts);
      if (onSuccess) onSuccess(layouts);
      return layouts;
    }
  } catch (error) {
    console.error('Failed to load layouts from API:', error);
  }
  
  // Return empty layouts as fallback
  const emptyLayouts = createEmptyLayout();
  if (onSuccess) onSuccess(emptyLayouts);
  return emptyLayouts;
}

/**
 * Adds a new module to layouts
 * @param {string} moduleId - ID of module to add
 * @param {string} moduleType - Type of module (SYSTEM, SERVICE, USER)
 * @param {Object} currentLayouts - Current layouts
 * @param {boolean} autosave - Whether to save changes (default: false)
 * @returns {Object} Updated layouts
 */
export function addModule(moduleId, moduleType, currentLayouts, autosave = false) {
  // Get default size for this module type
  const size = getModuleDefaultSize(moduleType);
  
  // Add to all breakpoints
  const updatedLayouts = createItemForAllBreakpoints(moduleId, currentLayouts, size);
  
  // Autosave if requested
  if (autosave) {
    saveLayout(updatedLayouts);
  }
  
  return updatedLayouts;
}

/**
 * Removes a module from layouts
 * @param {string} moduleId - ID of module to remove
 * @param {Object} currentLayouts - Current layouts
 * @param {boolean} autosave - Whether to save changes (default: false)
 * @returns {Object} Updated layouts
 */
export function removeModule(moduleId, currentLayouts, autosave = false) {
  // Remove from all breakpoints
  const updatedLayouts = removeItemFromAllBreakpoints(currentLayouts, moduleId);
  
  // Autosave if requested
  if (autosave) {
    saveLayout(updatedLayouts);
  }
  
  return updatedLayouts;
}

// Export constants and all key functions
export {
  // Constants
  BREAKPOINTS,
  COLS,
  MODULE_SIZE_MAP,
  DEFAULT_ROW_HEIGHT,
  MODULE_TYPE_STYLE_CLASSES,
  
  // Core functions
  createEmptyLayout,
  validateLayout,
  transformLayout,
  
  // Positioning functions
  getModuleDefaultSize,
  getOptimalPosition,
  
  // Storage functions
  saveToLocalStorage,
  loadLayoutsFromLocalStorage,
  loadActiveModulesFromLocalStorage,
  clearLayoutsFromLocalStorage,
  
  // API functions
  fetchSessionData,
  updateSessionGrid,
  updateSessionModules,
  saveLayoutTemplate,
  getLayoutTemplates,
  getLayoutTemplate,
  applyLayoutTemplate,
  
  // Operations
  findLayoutItem,
  addItemToAllBreakpoints,
  removeItemFromAllBreakpoints,
  createItemForAllBreakpoints,
  updateItemInAllBreakpoints,
  resizeItemInAllBreakpoints,
  reorderLayoutsByPosition
};
