// layout-core.js - stripped for #17 layout behavior only (standalone)

const breakpoints = { lg: 1600, md: 1200, sm: 992, xs: 768, xxs: 480 };
const cols = { lg: 12, md: 12, sm: 12, xs: 12, xxs: 12 };
const defaultSize = { w: 3, h: 4 }; // #17 behavior: fixed size used across breakpoints

/**
 * Generate deterministic responsive layouts for a given number of panes
 * Mirrors behavior of example #17 (bootstrap-style)
 * @param {number} paneCount
 * @returns {object} Layouts keyed by breakpoint
 */
export function createInitialLayouts(paneCount) {
  const layouts = {};

  for (const bp of Object.keys(breakpoints)) {
    const layoutItems = [];
    const width = defaultSize.w;
    const height = defaultSize.h;
    const colCount = cols[bp];

    for (let i = 0; i < paneCount; i++) {
      layoutItems.push({
        i: String(i),
        x: (i * width) % colCount,
        y: 0,
        w: width,
        h: height
      });
    }

    layouts[bp] = layoutItems;
  }

  return layouts;
}
