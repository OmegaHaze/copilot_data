// session-api-clear.js
// Special API method for cleaning session data

import { API_ENDPOINTS } from './session-constants';

/**
 * Clean all session data from backend
 * 
 * @returns {Promise<boolean>} Success status
 */
export async function cleanSessionAPI() {
  try {
    // Call the clean endpoint to reset backend session
    const response = await fetch('/api/user/layouts/session/clean', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error(`Failed to clean session: ${response.status}`);
    }
    
    // Also reset grid layout to empty arrays
    const emptyLayout = {
      lg: [], md: [], sm: [], xs: [], xxs: []
    };
    
    const gridResponse = await fetch(API_ENDPOINTS.SESSION_GRID, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emptyLayout),
      credentials: 'include'
    });
    
    if (!gridResponse.ok) {
      console.warn('Failed to reset grid layout:', gridResponse.status);
    }
    
    // Also reset modules
    const modulesResponse = await fetch(API_ENDPOINTS.SESSION_MODULES, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([]),
      credentials: 'include'
    });
    
    if (!modulesResponse.ok) {
      console.warn('Failed to reset modules:', modulesResponse.status);
    }
    
    return true;
  } catch (err) {
    console.error('[session-api] Failed to clean backend session:', err);
    return false;
  }
}
