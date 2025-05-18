// module-storage.js
// Manages persistent module metadata cache

import { STORAGE_KEYS } from './module-constants.js';

export function cacheModuleData(data) {
  try {
    localStorage.setItem(STORAGE_KEYS.MODULE_CACHE, JSON.stringify({
      timestamp: Date.now(),
      data
    }));
    return true;
  } catch (err) {
    console.warn('[module-storage] Failed to cache module data:', err);
    return false;
  }
}

export function loadCachedModuleData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MODULE_CACHE);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    const maxAge = 24 * 60 * 60 * 1000;
    if (Date.now() - parsed.timestamp > maxAge) return null;

    return parsed.data;
  } catch (err) {
    console.warn('[module-storage] Failed to read module cache:', err);
    return null;
  }
}
