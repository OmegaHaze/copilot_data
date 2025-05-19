// layout-shared.js
// Stateless layout helpers – fully aligned with example #17 behavior

/**
 * Validates a layout object:
 * - Must be an object
 * - Each breakpoint must contain an array of valid items
 */
export function validateLayout(layouts) {
  if (typeof layouts !== 'object' || layouts === null) return false;

  const required = ['i', 'x', 'y', 'w', 'h'];

  return ['lg', 'md', 'sm', 'xs', 'xxs'].every(bp => {
    const items = layouts[bp];
    if (!items) return true;
    if (!Array.isArray(items)) return false;

    return items.every(item =>
      item &&
      typeof item.i === 'string' &&
      required.every(key => key in item)
    );
  });
}

/**
 * Filters layout object:
 * - Ensures only known breakpoints are returned
 * - Removes invalid or falsey items from arrays
 */
export function transformLayout(layouts) {
  if (!layouts || typeof layouts !== 'object') return generateItemLayouts();

  const required = ['i', 'x', 'y', 'w', 'h'];

  return ['lg', 'md', 'sm', 'xs', 'xxs'].reduce((acc, bp) => {
    const items = layouts[bp];
    acc[bp] = Array.isArray(items)
      ? items.filter(item =>
          item &&
          typeof item.i === 'string' &&
          required.every(key => key in item)
        )
      : [];
    return acc;
  }, {});
}

/**
 * Create an empty layout for all breakpoints
 */
export function generateItemLayouts() {
  return {
    lg: [], md: [], sm: [], xs: [], xxs: []
  };
}

/**
 * Create a default layout using bootstrap-style sizing rules
 * @param {string[]} moduleIds
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

/**
 * Ensures layout items and activeModules are in sync.
 * Rebuilds missing layout entries using default layout generation.
 */
export function synchronizeLayoutAndModules(layouts, activeModules) {
  if (!validateLayout(layouts) || !Array.isArray(activeModules)) {
    return {
      layouts: generateItemLayouts(),
      modules: []
    };
  }

  const layoutIds = new Set();
  Object.values(layouts).forEach(breakpointLayout => {
    if (Array.isArray(breakpointLayout)) {
      breakpointLayout.forEach(item => {
        if (item && typeof item.i === 'string') {
          layoutIds.add(item.i);
        }
      });
    }
  });

  const syncedModules = [];
  activeModules.forEach(id => {
    if (layoutIds.has(id)) {
      syncedModules.push(id);
      layoutIds.delete(id);
    }
  });
  layoutIds.forEach(id => {
    syncedModules.push(id);
  });

// Filter down to valid layout items and track which IDs are present
const cleaned = transformLayout(layouts);
const cleanedIds = new Set();
const paneIdMap = new Map(); // Track paneId to module type and static id
  
Object.values(cleaned).forEach(bp => {
  bp.forEach(item => {
    cleanedIds.add(item.i);
    
    // Parse the paneId to extract moduleType and staticIdentifier
    const parts = item.i.split('-');
    if (parts.length >= 3) {
      const [moduleType, staticIdentifier, ...instanceParts] = parts;
      paneIdMap.set(item.i, { moduleType, staticIdentifier, instanceId: instanceParts.join('-') });
    }
  });
});

  const missing = activeModules.filter(id => !cleanedIds.has(id));
  const filled = generateDefaultLayouts(missing);

  const merged = {};
  for (const bp of ['lg', 'md', 'sm', 'xs', 'xxs']) {
    merged[bp] = [...(cleaned[bp] || []), ...(filled[bp] || [])];
  }

  return {
    layouts: merged,
    modules: syncedModules
  };
}
