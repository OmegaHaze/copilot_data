// ComponentLoader.js
import { initializeComponentRegistry, getPaneMap, getLogoMap } from './ComponentRegistryInitializer.js';
import { useLoaderError } from './hooks/useLoaderError';

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
      logoUrls: getLogoMap()
    };
  } catch (err) {
    useLoaderError.getState().showError(
      'Component loader failed to initialize',
      err.message
    );
    throw err;
  }
}

/**
 * Resolves a paneId into a renderable component.
 * @param {string} paneId - Format: moduleType-instanceId
 * @param {Object} moduleData - All available module metadata
 * @returns {JSX.Element} Renderable component (or fallback)
 */
export async function resolvePaneComponent(paneId, moduleData = {}) {
  if (typeof paneId !== 'string' || !paneId.includes('-')) {
    useLoaderError.getState().showError(
      'Invalid paneId format',
      paneId
    );
    return (
      <DefaultPane
        name="Invalid"
        status="Malformed"
        logo={null}
        moduleType="unknown"
        slug={paneId}
      />
    );
  }

  const [moduleType] = paneId.split('-');

  try {
    const { loadModuleComponent } = require('./ComponentManager.js');
    const { component: ResolvedPane } = await loadModuleComponent(moduleType, paneId);
    
    if (!ResolvedPane) {
      throw new Error(`No component found for moduleType "${moduleType}"`);
    }

    return (
      <ResolvedPane
        key={paneId}
        slug={paneId}
        moduleType={moduleType}
        moduleData={moduleData}
      />
    );
  } catch (err) {
    logExternalError({
      message: err.message,
      source: 'ComponentLoader'
    });
    
    return (
      <DefaultPane
        name={moduleType}
        status="Error"
        logo={null}
        moduleType={moduleType}
        slug={paneId}
        error={err.message}
      />
    );
  }
}

// Utility re-exports
export { getPaneMap, getLogoMap } from './ComponentRegistryInitializer.js';
