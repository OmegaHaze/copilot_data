// ComponentLoader.jsx - Handles component loading and resolution
import { useState, useEffect } from 'react';
import { useLoaderError } from './hooks/useLoaderError';
// DefaultPane import removed - we should dynamically render panes on call, not use static placeholders
import { logExternalError } from '../logging';
import { initializeComponentRegistry, getPaneMap } from './ComponentRegistryInitializer.js';

/**
 * Bootstraps the entire component registry and logs on failure.
 * @returns {Promise<Object>} component registry state
 */
export async function initComponentLoader() {
  try {
    const result = await initializeComponentRegistry();

    return {
      success: result.success,
      componentCount: result.componentCount,
      paneMap: getPaneMap(),
      moduleData: result.moduleData,
      logoUrls: result.logoUrls || {}
    };
  } catch (err) {
    const errorHandler = useLoaderError.getState();
    errorHandler.showError(
      `Component loader failed to initialize: ${err.message}`,
      'system',
      'high'
    );
    throw err;
  }
}

/**
 * Validates a paneId format
 * @param {string} paneId - The paneId to validate (moduleType-staticIdentifier-instanceId)
 * @returns {boolean} True if valid
 */
function isValidPaneId(paneId) {
  if (typeof paneId !== 'string' || !paneId.includes('-')) {
    return false;
  }
  
  const parts = paneId.split('-');
  // Must have moduleType, staticIdentifier, and instanceId parts
  return parts.length >= 3 && parts[0].length > 0 && parts[1].length > 0;
}

/**
 * Resolves a paneId into a renderable component.
 * @param {string} paneId - Format: moduleType-staticIdentifier-instanceId
 * @param {Object} moduleData - All available module metadata
 * @returns {Promise<JSX.Element>} Renderable component (or fallback)
 */
export async function resolvePaneComponent(paneId, moduleData = {}) {
  if (!isValidPaneId(paneId)) {
    logExternalError({
      message: `Invalid paneId format: ${paneId}`,
      source: 'ComponentLoader'
    });
    
    // Return null instead of DefaultPane - let the caller handle invalid panes
    return null;
  }

  // Extract moduleType and staticIdentifier from paneId
  const parts = paneId.split('-');
  const moduleType = parts[0];
  const staticIdentifier = parts.length > 1 ? parts[1] : moduleType;

  try {
    // Dynamic import using import() instead of require()
    const ComponentManager = await import('./ComponentManager.js');
    const { 
      component: ResolvedPane, 
      staticIdentifier: moduleStaticId 
    } = await ComponentManager.loadModuleComponent(moduleType, paneId);
    
    if (!ResolvedPane) {
      throw new Error(`No component found for moduleType "${moduleType}"`);
    }

    // Use staticIdentifier from component manager if available, otherwise use from paneId
    const finalStaticId = moduleStaticId || staticIdentifier;

    // Pass the staticIdentifier to the component
    return (
      <ResolvedPane
        key={paneId}
        slug={paneId}
        moduleType={moduleType}
        staticIdentifier={finalStaticId}
        moduleData={{
          ...moduleData,
          staticIdentifier: finalStaticId // Also include in moduleData for backward compatibility
        }}
      />
    );
  } catch (err) {
    logExternalError({
      message: err.message,
      source: 'ComponentLoader'
    });
    
    // Return null instead of DefaultPane - let the caller handle errors
    // This aligns with the dynamic rendering approach rather than using static placeholders
    return null;
  }
}

// Export only what's needed - avoid circular dependency
export { getPaneMap } from './ComponentRegistryInitializer.js';