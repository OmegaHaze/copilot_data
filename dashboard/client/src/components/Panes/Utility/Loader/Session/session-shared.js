// session-shared.js
// Strict session validation helpers — crash on malformed layout/session data

/**
 * Validates the structure of session data
 * @param {object} data - Raw session data from API or storage
 * @returns {boolean}
 * @throws {Error} if structure is invalid
 */
export function validateSessionData(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid session data: not an object');
  }

  const gridLayout = data.gridLayout || data.grid_layout;
  const activeModules = data.activeModules || data.active_modules;

  if (!gridLayout || typeof gridLayout !== 'object') {
    throw new Error('Invalid session data: missing or malformed gridLayout');
  }

  if (!Array.isArray(activeModules)) {
    throw new Error('Invalid session data: activeModules must be an array');
  }

  return true;
}

/**
 * Validates layout object structure and throws on malformed data
 * @param {object} layout - Breakpoint-keyed layout object
 * @returns {object} The same layout if valid
 * @throws {Error} if invalid
 */
export function assertValidLayout(layout) {
  if (!layout || typeof layout !== 'object') {
    throw new Error('Invalid layout object: not an object');
  }

  for (const [bp, items] of Object.entries(layout)) {
    if (!Array.isArray(items)) {
      throw new Error(`Invalid layout breakpoint '${bp}': must be an array`);
    }

    for (const item of items) {
      if (
        !item ||
        typeof item !== 'object' ||
        typeof item.i !== 'string' ||
        typeof item.x !== 'number' ||
        typeof item.y !== 'number' ||
        typeof item.w !== 'number' ||
        typeof item.h !== 'number'
      ) {
        throw new Error(`Malformed layout item in breakpoint '${bp}': ${JSON.stringify(item)}`);
      }
    }
  }

  return layout;
}
