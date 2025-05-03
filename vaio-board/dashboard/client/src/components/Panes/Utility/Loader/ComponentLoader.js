// ComponentLoader.js - Simplified to import from ComponentRegistryInitializer
import { initializeComponentRegistry, getPaneMap, getLogoMap } from './ComponentRegistryInitializer.js';

/**
 * Initialize component loader - delegates to ComponentRegistryInitializer
 * @returns {Promise<Object>} Component registry
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
    console.error('Component loader failed to initialize:', err);
    throw err;
  }
}

// Re-export utility functions from ComponentRegistryInitializer
export { getPaneMap, getLogoMap } from './ComponentRegistryInitializer.js';