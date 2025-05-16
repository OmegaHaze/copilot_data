// layout-constants.js
// Centralized configuration for responsive grid layout system (balanced precision mode)

// -------------------------------------------------------------
// Breakpoint Definitions – used in all layout calculations
export const BREAKPOINTS = ['lg', 'md', 'sm', 'xs', 'xxs'];

export const BREAKPOINT_VALUES = {
  lg: 1600, // Ultra-wide monitors, large desktops
  md: 1200, // Standard desktops
  sm: 992,  // Tablets and small laptops
  xs: 768,  // Large phones / portrait tablets
  xxs: 480  // Mobile phones
};

// -------------------------------------------------------------
// Grid Column Precision – reduced for better UX
export const COLS = {
  lg: 24,
  md: 20,
  sm: 16,
  xs: 12,
  xxs: 8
};
// -------------------------------------------------------------
// Static row heights per breakpoint (in pixels)
export const ROW_HEIGHTS = {
  lg: 30,
  md: 28,
  sm: 26,
  xs: 24,
  xxs: 22
};

// -------------------------------------------------------------
// Margins between items (in pixels) [horizontal, vertical]
export const MARGIN = {
  lg: [8, 8],
  md: [8, 8],
  sm: [6, 6],
  xs: [4, 4],
  xxs: [2, 2]
};

// -------------------------------------------------------------
// Padding around the entire grid container
export const CONTAINER_PADDING = {
  lg: [10, 10],
  md: [8, 8],
  sm: [6, 6],
  xs: [4, 4],
  xxs: [2, 2]
};

// -------------------------------------------------------------
// Default module sizes per breakpoint (grid units)
export const DEFAULT_MODULE_SIZES = {
  lg: { w: 12, h: 8 },   // Reduced by half and swapped h/w
  md: { w: 12, h: 6 },
  sm: { w: 10, h: 6 },
  xs: { w: 8, h: 4 },
  xxs: { w: 6, h: 4 }
};



// -------------------------------------------------------------
// Local/session storage keys (flat string constants)
export const STORAGE_KEYS = {
  LAYOUTS: 'vaio_layouts',
  ACTIVE_MODULES: 'vaio_active_modules'
};

// -------------------------------------------------------------
// Backend API endpoints for layout/session persistence
export const API_ENDPOINTS = {
  SESSION_DATA: '/api/user/session',
  SESSION_GRID: '/api/user/session/grid',
  SESSION_MODULES: '/api/user/session/modules',
  LAYOUTS: '/api/user/layouts',
  TEMPLATES: '/api/layout/templates'
};

// -------------------------------------------------------------
// Min dimension enforcement (used during resizing/insertion)
export const MODULE_CONSTRAINTS = {
  MIN_W: 6,
  MIN_H: 4
};

// -------------------------------------------------------------
// Hard rules for validation and normalization
export const VALIDATION = {
  REQUIRED_ITEM_PROPS: ['i', 'x', 'y', 'w', 'h'],
  MODULE_TYPES: ['SYSTEM', 'SERVICE', 'USER']
};
