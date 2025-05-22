/**
 * component-core.jsx
 * Visual components and re-exports from shared utilities
 */

import React from 'react';
import { isValidPaneId, parsePaneId, createPaneId, createRegistrationKey } from './component-shared';

// Re-export utility functions for backward compatibility
export { isValidPaneId, parsePaneId, createPaneId, createRegistrationKey };

/**
 * Create a visual placeholder for loading/error states
 * @param {string} paneId - Pane ID
 * @param {string} message - Error message
 * @returns {JSX.Element} Placeholder component
 */
export function createPlaceholder(paneId, message = 'Component not available') {
  return (
    <div className="p-4 bg-red-900/20 border border-red-800/50 rounded-lg h-full w-full flex flex-col items-center justify-center">
      <div className="text-red-500 text-lg font-mono mb-2">Component Error</div>
      <div className="text-red-400 text-sm">{message}</div>
      <div className="text-red-300/70 text-xs mt-4">{paneId || 'Unknown ID'}</div>
    </div>
  );
}