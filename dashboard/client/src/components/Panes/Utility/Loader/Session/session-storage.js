// session-storage.js
// Unified session/local storage logic for session state

import { STORAGE_KEYS } from './session-constants';

/**
 * Save value to sessionStorage
 */
export function saveToSessionStorage(key, value) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    console.error('Failed to save to sessionStorage:', err);
    return false;
  }
}

/**
 * Load value from sessionStorage
 */
export function loadFromSessionStorage(key) {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.error('Failed to load from sessionStorage:', err);
    return null;
  }
}

/**
 * Save value to localStorage
 */
export function saveToLocalStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    console.error('Failed to save to localStorage:', err);
    return false;
  }
}

/**
 * Load value from localStorage
 */
export function loadFromLocalStorage(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.error('Failed to load from localStorage:', err);
    return null;
  }
}

/**
 * Clear session-specific storage
 */
export function clearSessionStorage() {
  try {
    sessionStorage.removeItem(STORAGE_KEYS.SESSION_DATA);
    sessionStorage.removeItem(STORAGE_KEYS.LAYOUTS);
    sessionStorage.removeItem(STORAGE_KEYS.ACTIVE_MODULES);
    return true;
  } catch (err) {
    console.error('Failed to clear sessionStorage:', err);
    return false;
  }
}
