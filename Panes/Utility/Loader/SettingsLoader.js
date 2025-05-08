// File: SettingsLoader.js
// Loads layouts + module state from backend and initializes SettingsContext

import { errorHandler } from '../../../Error-Handling/utils/errorHandler';
import { ErrorType, ErrorSeverity } from '../../../Error-Handling/Diagnostics/types/errorTypes';

export async function loadSettingsFromSession(setGridLayout, setActiveModules) {
  try {
    const sessionRes = await fetch('/api/user/session', { credentials: 'include' });

    if (!sessionRes.ok) {
      throw new Error(`Failed to load session: HTTP ${sessionRes.status}`);
    }

    const sessionData = await sessionRes.json();

    if (!sessionData || typeof sessionData !== 'object') {
      throw new Error('Empty or invalid session data received');
    }

    // Extract the data fields (note: grid_layout contains multiple layouts despite the singular name)
    const { grid_layout, active_modules } = sessionData;

    // Load grid layouts
    if (grid_layout && typeof grid_layout === 'object') {
      setGridLayout(grid_layout);
    } else {
      errorHandler.showError(
        'No valid grid layouts in session data',
        ErrorType.SYSTEM,
        ErrorSeverity.MEDIUM,
        {
          componentName: 'SettingsLoader',
          action: 'loadSettingsFromSession',
          location: 'Grid Layouts Processing',
          metadata: {
            availableKeys: sessionData ? Object.keys(sessionData) : []
          }
        }
      );
    }

    // Load active modules
    if (Array.isArray(active_modules)) {
      setActiveModules(active_modules);
    } else {
      errorHandler.showError(
        'No active_modules array in session; leaving module state empty',
        ErrorType.SYSTEM,
        ErrorSeverity.LOW,
        {
          componentName: 'SettingsLoader',
          action: 'loadSettingsFromSession',
          location: 'Active Modules Processing',
          metadata: {
            availableKeys: sessionData ? Object.keys(sessionData) : []
          }
        }
      );

      setActiveModules([]); // Explicitly set to empty to avoid undefined bugs
    }

    return true;
  } catch (err) {
    errorHandler.showError(
      `Settings load failure: ${err.message}`,
      ErrorType.SYSTEM,
      ErrorSeverity.HIGH,
      {
        componentName: 'SettingsLoader',
        action: 'loadSettingsFromSession',
        location: 'API Request',
        metadata: {
          endpoint: '/api/user/session',
          errorStack: err.stack,
          timestamp: new Date().toISOString()
        }
      }
    );

    // On fatal failure, start with empty state
    setGridLayout({});
    setActiveModules([]);
    return false;
  }
}
