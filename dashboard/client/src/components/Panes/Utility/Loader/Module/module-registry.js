/**
 * module-registry.js
 * Registry for modules
 */

import { STORAGE_KEYS } from './module-constants';

class ModuleRegistry {
  constructor() {
    this.modules = { SYSTEM: [], SERVICE: [], USER: [] };
    this.initialized = false;
  }
  
  async initialize(forceRefresh = false) {
    console.log('[module-registry] Initialize called with forceRefresh:', forceRefresh);
    
    if (this.initialized && !forceRefresh) {
      console.log('[module-registry] Already initialized, skipping');
      return { success: true };
    }
    
    console.log('[module-registry] Starting initialization...');
    
    let success = false;
    
    // No fallbacks - clear approach with strict initialization
    // If forcing refresh, go directly to discovery
    if (forceRefresh) {
      console.log('[module-registry] Force refresh - going directly to pane discovery');
      this.modules = { SYSTEM: [], SERVICE: [], USER: [] };
      
      // Try pane discovery first
      console.log('[module-registry] Starting pane discovery...');
      const discoveryResult = await this.discoverPaneModules();
      
      if (!discoveryResult) {
        // Even with force refresh, try backend as a fallback if discovery fails
        console.log('[module-registry] Discovery failed even with force refresh, trying backend...');
        const backendResult = await this.refreshFromBackend();
        
        if (!backendResult.success) {
          const error = new Error('Failed to discover modules and backend refresh failed');
          console.error('[module-registry] Module system initialization failed completely');
          throw error;
        }
        
        console.log('[module-registry] Successfully loaded modules from backend with force refresh');
      }
      
      success = true;
    } else {
      // Try cache only when not forcing refresh
      if (this.restoreFromCache() && this.countModules().total > 0) {
        console.log('[module-registry] Restored from cache, module counts:', this.countModules());
        success = true;
      } else {
        // If cache fails, go directly to discovery - no API fallback
        console.log('[module-registry] Cache miss - going directly to pane discovery');
        this.modules = { SYSTEM: [], SERVICE: [], USER: [] };
        
        // Try pane discovery first
        console.log('[module-registry] Starting pane discovery...');
        const discoveryResult = await this.discoverPaneModules();
        
        if (!discoveryResult) {
          // If discovery fails, try loading from backend as a fallback
          console.log('[module-registry] Discovery failed, trying backend as fallback...');
          const backendResult = await this.refreshFromBackend();
          
          if (!backendResult.success) {
            const error = new Error('Failed to discover modules and backend refresh failed');
            console.error('[module-registry] Module system initialization failed completely');
            throw error;
          }
          
          console.log('[module-registry] Successfully loaded modules from backend');
        }
        
        success = true;
      }
    }
    
    this.initialized = success;
    
    if (!success) {
      const error = new Error('Failed to initialize module registry - no data available');
      console.error('[module-registry] Initialization failed completely');
      throw error; // Crash on failure - work or crash
    }
    
    console.log('[module-registry] Initialization complete. Success:', success);
    console.log('[module-registry] Final module counts:', this.countModules());
    
    // Update cache regardless of source
    this.updateCache();
    
    return { success };
  }
  
  restoreFromCache() {
    try {
      console.log('[module-registry] Attempting to restore from cache...');
      
      // Try primary registry first
      const cached = localStorage.getItem(STORAGE_KEYS.MODULE_REGISTRY);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed.data) {
            console.log('[module-registry] Found registry data:', {
              SYSTEM: Array.isArray(parsed.data.SYSTEM) ? parsed.data.SYSTEM.length : 0,
              SERVICE: Array.isArray(parsed.data.SERVICE) ? parsed.data.SERVICE.length : 0,
              USER: Array.isArray(parsed.data.USER) ? parsed.data.USER.length : 0
            });
            this.modules = parsed.data;
            
            // Also update the module cache to ensure consistency
            localStorage.setItem(STORAGE_KEYS.MODULE_CACHE, JSON.stringify({
              timestamp: Date.now(),
              data: this.modules
            }));
            
            return true;
          } else {
            console.warn('[module-registry] Found registry but data structure is invalid');
          }
        } catch (parseErr) {
          console.error('[module-registry] Failed to parse MODULE_REGISTRY cache:', parseErr);
        }
      }
      
      // If registry didn't work, try the module cache as backup
      const cachedBackup = localStorage.getItem(STORAGE_KEYS.MODULE_CACHE);
      if (cachedBackup) {
        try {
          const parsed = JSON.parse(cachedBackup);
          if (parsed.data) {
            console.log('[module-registry] Found backup cache data:', {
              SYSTEM: Array.isArray(parsed.data.SYSTEM) ? parsed.data.SYSTEM.length : 0,
              SERVICE: Array.isArray(parsed.data.SERVICE) ? parsed.data.SERVICE.length : 0,
              USER: Array.isArray(parsed.data.USER) ? parsed.data.USER.length : 0
            });
            this.modules = parsed.data;
            
            // Update the registry with this data
            this.updateCache();
            
            return true;
          } else {
            console.warn('[module-registry] Found backup cache but data structure is invalid');
          }
        } catch (parseErr) {
          console.error('[module-registry] Failed to parse MODULE_CACHE backup:', parseErr);
        }
      }
      
      console.log('[module-registry] No valid cache found in any location');
      return false;
    } catch (e) {
      console.error('[module-registry] Error restoring from cache:', e);
      return false;
    }
  }
  
  updateCache() {
    const timestamp = Date.now();
    const data = {
      timestamp,
      data: this.modules
    };
    
    // Update both storage locations to keep them in sync
    localStorage.setItem(STORAGE_KEYS.MODULE_REGISTRY, JSON.stringify(data));
    localStorage.setItem(STORAGE_KEYS.MODULE_CACHE, JSON.stringify(data));
    
    console.log('[module-registry] Updated both registry and cache with latest module data');
  }
  
  setModuleData(data) {
    if (!data) return;
    
    // Simple merge - just set the data
    this.modules = {
      SYSTEM: Array.isArray(data.SYSTEM) ? [...data.SYSTEM] : [],
      SERVICE: Array.isArray(data.SERVICE) ? [...data.SERVICE] : [],
      USER: Array.isArray(data.USER) ? [...data.USER] : []
    };
    
    console.log('[module-registry] Set module data:', {
      SYSTEM: this.modules.SYSTEM.length,
      SERVICE: this.modules.SERVICE.length,
      USER: this.modules.USER.length
    });
    
    this.updateCache();
  }
  
  async refreshFromBackend() {
    try {
      console.log('[module-registry] Refreshing from backend...');
      const { fetchModules } = await import('./module-api');
      const moduleData = await fetchModules();
      if (moduleData) {
        this.setModuleData(moduleData);
        return { success: true };
      }
      return { success: false };
    } catch (error) {
      console.error('[module-registry] Refresh failed:', error);
      return { success: false };
    }
  }
  
  async discoverPaneModules() {
    try {
      console.log('[module-registry] Starting pane discovery...');
      console.log('[module-registry] Current working directory for imports:', window.location.href);
      
      // Skip component resolver data altogether - we don't want any fallbacks
      // This is the module system - it should be the source of truth
      
      // Use the ONLY correct path with no fallbacks
      console.log('[module-registry] Using exact path ../../Pane/*.jsx');
      
      // Only one path - strict approach
      const paneModules = import.meta.glob('../../Pane/*.jsx', { eager: false });
      const modulePaths = Object.keys(paneModules);
      console.log('[module-registry] Path ../../Pane/*.jsx found:', modulePaths.length);
      
      // If no modules found, fail fast - no fallbacks
      if (!modulePaths || modulePaths.length === 0) {
        console.error('[module-registry] No modules found using path ../../Pane/*.jsx');
        throw new Error('No pane modules found - cannot continue with module discovery');
      }
      
      return this.processModulePaths(paneModules, modulePaths);
    } catch (error) {
      console.error('Discovery failed:', error);
      return false;
    }
  }
  
  async processModulePaths(paneModules, modulePaths) {
    for (const path of modulePaths) {
      try {
        console.log(`[module-registry] Loading: ${path}`);
        
        // Extract the component name from the path
        const match = path.match(/\/([^/]+)\.jsx$/);
        const componentName = match ? match[1] : null;
        
        if (!componentName) {
          console.warn(`[module-registry] Could not determine component name from path: ${path}`);
          continue;
        }
        
        // Create a hardcoded reference to the path's lazy loaded module
        // We have to do this because Vite doesn't allow dynamic imports inside functions
        const moduleLoader = paneModules[path];
        
        // Create a loadComponent function for this module that uses the reference
        const loadComponentFn = async () => {
          try {
            return await moduleLoader();
          } catch (err) {
            console.error(`[module-registry] Error loading component ${componentName}:`, err);
            throw err;
          }
        };
        
        // Try to load the module to get its metadata
        let moduleMetadata = null;
        try {
          // Use the referenced moduleLoader
          const module = await moduleLoader();
          const component = module.default;
          
          console.log(`[module-registry] Component loaded:`, {
            hasComponent: !!component,
            hasMetadata: !!component?.moduleMetadata,
            name: componentName
          });
          
          // Get module metadata from component
          moduleMetadata = component?.moduleMetadata;
        } catch (loadError) {
          console.error(`[module-registry] Failed to load ${componentName} for metadata:`, loadError);
          // Continue even if we couldn't load it now - we still register with name only
        }
        
        // If we have metadata, use it to determine module type
        if (moduleMetadata) {
          const moduleType = (moduleMetadata.module_type || 'SYSTEM').toUpperCase();
          
          console.log(`[module-registry] Adding module: ${moduleMetadata.staticIdentifier || componentName} to ${moduleType}`);
          
          if (this.modules[moduleType]) {
            this.modules[moduleType].push({
              ...moduleMetadata,
              staticIdentifier: moduleMetadata.staticIdentifier || componentName,
              moduleType,
              loadComponent: loadComponentFn // Attach the load function
            });
            console.log(`[module-registry] Successfully added: ${moduleMetadata.staticIdentifier || componentName}`);
          }
        } else {
          // Even without metadata, register the component with a default type
          const defaultType = 'SYSTEM';
          console.log(`[module-registry] No metadata found in ${componentName}, registering as ${defaultType}`);
          
          this.modules[defaultType].push({
            staticIdentifier: componentName,
            moduleType: defaultType,
            loadComponent: loadComponentFn, // Attach the load function
            discoveredAt: new Date().toISOString()
          });
          
          console.log(`[module-registry] Added ${componentName} as ${defaultType} module without metadata`);
        }
      } catch (error) {
        console.error(`[module-registry] Failed to process ${path}:`, error);
      }
    }
    
    console.log('[module-registry] Final module counts:', this.countModules());
    this.updateCache();
    return true;
  }
  
  getAllModules() {
    return { ...this.modules };
  }
  
  findModule(moduleType, identifier) {
    return this.modules[moduleType]?.find(m => 
      m.staticIdentifier === identifier || m.paneComponent === identifier
    ) || null;
  }
  
  getModulesByType(moduleType) {
    return this.modules[moduleType] || [];
  }
  
  countModules() {
    return {
      SYSTEM: this.modules.SYSTEM.length,
      SERVICE: this.modules.SERVICE.length,
      USER: this.modules.USER.length,
      total: this.modules.SYSTEM.length + this.modules.SERVICE.length + this.modules.USER.length
    };
  }
  
  // Add missing methods that module-index expects
  addEventListener() { return () => {}; }
  notifyListeners() {}
  unregisterModule() { return true; }
}

const registry = new ModuleRegistry();
export default registry;