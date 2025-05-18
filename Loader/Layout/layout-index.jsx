// layout-index.js
// Main layout system entrypoint – fully aligned with example #17 behavior

import {
  validateLayout,
  createEmptyLayout,
  synchronizeLayoutAndModules
} from './layout-shared';

import {
  saveToLocalStorage,
  saveActiveModulesToLocalStorage,
  loadLayoutsFromLocalStorage,
  loadActiveModulesFromLocalStorage,
  clearLayoutsFromLocalStorage
} from './layout-storage';

import {
  fetchSessionData,
  updateSessionGrid,
  updateSessionModules,
  saveLayoutTemplate as api_saveLayoutTemplate,
  getLayoutTemplates as api_getLayoutTemplates,
  applyLayoutTemplate as api_applyLayoutTemplate
} from './layout-api';

/**
 * Build a full layout using bootstrap-style sizing for new module IDs
 */
function generateDefaultLayouts(moduleIds = []) {
  const widths = { lg: 3, md: 4, sm: 6, xs: 12, xxs: 12 };
  const cols = { lg: 12, md: 12, sm: 12, xs: 12, xxs: 12 };

  return Object.keys(cols).reduce((acc, bp) => {
    const w = widths[bp];
    const col = cols[bp];
    acc[bp] = moduleIds.map((id, i) => ({
      i: id,
      x: (i * w) % col,
      y: 0,
      w,
      h: 4
    }));
    return acc;
  }, {});
}

async function saveLayout(layouts, skipApi = false, activeModules = null) {
  if (!validateLayout(layouts)) {
    console.error('[layout] Invalid layout object provided to saveLayout:', layouts);
    return false;
  }

  let modulesToSave = activeModules;
  if (!modulesToSave) {
    const ids = new Set();
    Object.values(layouts).forEach(breakpointLayout => {
      if (Array.isArray(breakpointLayout)) {
        breakpointLayout.forEach(item => ids.add(item.i));
      }
    });
    modulesToSave = Array.from(ids);
  }

  const localSaveSuccess = saveToLocalStorage(layouts);
  if (modulesToSave) {
    saveActiveModulesToLocalStorage(modulesToSave);
  }

  try {
    const { saveToSessionStorage, loadFromSessionStorage } = await import('../Session/session-storage');
    const { STORAGE_KEYS } = await import('../Session/session-constants');

    saveToSessionStorage(STORAGE_KEYS.LAYOUTS, layouts);
    const sessionData = loadFromSessionStorage(STORAGE_KEYS.SESSION_DATA) || {};
    sessionData.gridLayout = layouts;
    if (modulesToSave) {
      saveToSessionStorage(STORAGE_KEYS.ACTIVE_MODULES, modulesToSave);
      sessionData.activeModules = modulesToSave;
    }
    saveToSessionStorage(STORAGE_KEYS.SESSION_DATA, sessionData);
  } catch (err) {
    console.warn('[layout] Failed to sync to sessionStorage:', err);
  }

  if (!localSaveSuccess || skipApi) return localSaveSuccess;

  try {
    await updateSessionGrid(layouts);
    if (modulesToSave) await updateSessionModules(modulesToSave);
    return true;
  } catch (err) {
    console.error('[layout] Failed to save layout to API:', err);
    return true;
  }
}

async function saveActiveModules(modules, skipApi = false) {
  if (!Array.isArray(modules)) {
    console.error('[layout] Invalid modules array provided to saveActiveModules');
    return false;
  }

  const localSaveSuccess = saveActiveModulesToLocalStorage(modules);

  try {
    const { saveToSessionStorage, loadFromSessionStorage } = await import('../Session/session-storage');
    const { STORAGE_KEYS } = await import('../Session/session-constants');

    saveToSessionStorage(STORAGE_KEYS.ACTIVE_MODULES, modules);
    const sessionData = loadFromSessionStorage(STORAGE_KEYS.SESSION_DATA) || {};
    sessionData.activeModules = modules;
    saveToSessionStorage(STORAGE_KEYS.SESSION_DATA, sessionData);
  } catch (err) {
    console.warn('[layout] Failed to sync modules to sessionStorage:', err);
  }

  if (!localSaveSuccess || skipApi) return localSaveSuccess;

  try {
    await updateSessionModules(modules);
    return true;
  } catch (err) {
    console.error('[layout] Failed to save active modules to API:', err);
    return true;
  }
}

async function loadLayout() {
  let layout = null;

  try {
    const sessionData = await fetchSessionData();
    const sessionLayout = sessionData?.grid_layout;

    if (sessionLayout && validateLayout(sessionLayout)) {
      layout = sessionLayout;
      saveToLocalStorage(sessionLayout);

      try {
        const { saveToSessionStorage } = await import('../Session/session-storage');
        const { STORAGE_KEYS } = await import('../Session/session-constants');

        saveToSessionStorage(STORAGE_KEYS.LAYOUTS, sessionLayout);

        if (Array.isArray(sessionData?.active_modules)) {
          saveToSessionStorage(STORAGE_KEYS.ACTIVE_MODULES, sessionData.active_modules);
          saveActiveModulesToLocalStorage(sessionData.active_modules);
        }

        saveToSessionStorage(STORAGE_KEYS.SESSION_DATA, {
          gridLayout: sessionLayout,
          activeModules: sessionData?.active_modules || []
        });
      } catch (err) {
        console.warn('[layout] Failed to mirror layout to sessionStorage:', err);
      }

      return layout;
    }
  } catch (err) {
    console.error('[layout] Failed to load layout from session API:', err);
  }

  const local = loadLayoutsFromLocalStorage();
  if (local && validateLayout(local)) {
    layout = local;

    try {
      await updateSessionGrid(local);
      const activeModules = loadActiveModulesFromLocalStorage();
      if (Array.isArray(activeModules)) {
        await updateSessionModules(activeModules);
      }
    } catch (err) {
      console.warn('[layout] Failed to push local layout to backend:', err);
    }

    return layout;
  }

  return createInitialLayouts(0);
}

function addModule(paneId, currentLayouts, autosave = false, currentModules = []) {
  const newIds = currentModules.includes(paneId)
    ? [...currentModules]
    : [...currentModules, paneId];

  const updatedLayouts = synchronizeLayoutAndModules(currentLayouts, newIds).layouts;

  if (autosave) {
    saveLayout(updatedLayouts, false, newIds);
    saveActiveModules(newIds);
  }

  return {
    layouts: updatedLayouts,
    modules: newIds
  };
}

function removeModule(paneId, currentLayouts, autosave = false, currentModules = []) {
  const newIds = currentModules.filter(id => id !== paneId);

  const synced = synchronizeLayoutAndModules(currentLayouts, newIds);
  const updatedLayouts = synced.layouts;

  if (autosave) {
    saveLayout(updatedLayouts, false, newIds);
    saveActiveModules(newIds);
  }

  return {
    layouts: updatedLayouts,
    modules: newIds
  };
}

function createInitialLayouts(count) {
  const moduleIds = Array.from({ length: count }, (_, i) => `__default-${i}`);
  return generateDefaultLayouts(moduleIds);
}

export {
  saveLayout,
  saveActiveModules,
  loadLayout,
  loadLayout as loadSession,
  addModule,
  removeModule,
  createInitialLayouts,

  clearLayoutsFromLocalStorage,
  loadActiveModulesFromLocalStorage,
  synchronizeLayoutAndModules,

  api_saveLayoutTemplate as saveLayoutTemplate,
  api_getLayoutTemplates as getLayoutTemplates,
  api_applyLayoutTemplate as applyLayoutTemplate
};
