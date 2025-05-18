// session-constants.js
// Constants for session API and storage integration

export const STORAGE_KEYS = {
  SESSION_DATA: 'vaio_session',
  LAYOUTS: 'vaio_layouts',
  ACTIVE_MODULES: 'vaio_active_modules'
};

export const API_ENDPOINTS = {
  SESSION_DATA: '/api/user/session',
  SESSION_GRID: '/api/user/session/grid',
  SESSION_MODULES: '/api/user/session/modules'
};

export const ERROR_MESSAGES = {
  FAILED_LOAD: 'Failed to load session data',
  FAILED_SAVE: 'Failed to save session state'
};
