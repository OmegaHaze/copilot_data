/**
 * constants.js
 * Central source of truth for all layout-related constants
 */

// Standard responsive breakpoints
export const BREAKPOINTS = ['lg', 'md', 'sm', 'xs', 'xxs'];

// Column configuration for each breakpoint
export const COLS = {
  lg: 12,
  md: 10,
  sm: 6,
  xs: 4,
  xxs: 2
};

// Storage keys for localStorage and sessionStorage
export const STORAGE_KEYS = {
  LAYOUTS: 'vaio_layouts',
  ACTIVE_MODULES: 'vaio_active_modules'
};

// API endpoints for session and layout operations
export const API_ENDPOINTS = {
  SESSION_DATA: '/api/user/session',
  SESSION_GRID: '/api/user/session/grid',
  SESSION_MODULES: '/api/user/session/modules',
  LAYOUTS: '/api/user/layouts'
};

// Default module dimensions
export const DEFAULT_MODULE_SIZE = {
  w: 12,
  h: 8
};

// Default grid item properties
export const DEFAULT_MIN_SIZE = { 
  w: 3, 
  h: 3 
};

// Module type to size mapping
export const MODULE_SIZE_MAP = {
  'SYSTEM': { w: 12, h: 8 },
  'SERVICE': { w: 12, h: 8 },
  'CPU': { w: 12, h: 6 },
  'MEMORY': { w: 12, h: 6 },
  'DISK': { w: 12, h: 8 },
  'NETWORK': { w: 12, h: 8 },
  'USER': { w: 12, h: 8 },
  'default': { w: 12, h: 8 }
};

// Default row height for grid
export const DEFAULT_ROW_HEIGHT = 60;

// Module type style classes for UI differentiation
export const MODULE_TYPE_STYLE_CLASSES = {
  SYSTEM: 'bg-blue-800/10',
  SERVICE: 'bg-purple-800/10', 
  USER: 'bg-yellow-800/10',
  default: 'bg-gray-700/10'
};

// Validation constants
export const VALIDATION = {
  REQUIRED_ITEM_PROPS: ['i', 'x', 'y', 'w', 'h'],
  MODULE_TYPES: ['SYSTEM', 'SERVICE', 'USER']
};
