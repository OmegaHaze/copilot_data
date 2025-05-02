import { useEffect, useState, useContext, useCallback, useMemo } from 'react';
import ServiceGrid from './ServiceGrid.jsx';
import SidePanelLeft from '../../../Panels/SidePanelLeft.jsx';
import SidePanelRight from '../../../Panels/SidePanelRight.jsx';
import ErrorEffects from '../../../Error-Handling/ErrorEffects.jsx';
import ErrorSkull from '../../../Error-Handling/ErrorSkull.jsx';
import { SettingsContext } from '../../../SettingsMenu/SettingsContext.jsx';
import { debouncedSaveToSession } from './LayoutManager.js';

// Import the unified component system
import { initializeComponentRegistry, getPaneMap, getLogoMap } from './ComponentRegistryInitializer.js';
import { componentRegistry } from './ComponentRegistry.js';
import { loadLayout, saveLayoutToLocal, createEmptyLayout, BREAKPOINTS } from './LayoutManager.js';
import { useSocket } from '../SocketContext.jsx';

/**
 * Filter items based on active modules using the component registry
 * @param {Array} items - All available items
 * @param {Array} activeModules - List of active module IDs
 * @returns {Array} - Filtered items that match active modules
 */
function filterByActiveModules(items, activeModules) {
  if (!Array.isArray(activeModules) || activeModules.length === 0) {
    return [];
  }
  
  return items.filter(item => {
    if (!item) return false;
    
    // Get the module key using the registry
    const moduleKey = componentRegistry.getCanonicalKey(item.module || item.name);
    if (!moduleKey) return false;
    
    // Check for direct module name match
    if (activeModules.includes(moduleKey)) {
      return true;
    }
    
    // Check for module instances using canonical keys
    return activeModules.some(activeId => {
      return componentRegistry.getCanonicalKey(activeId) === moduleKey;
    });
  });
}

/**
 * ServiceMatrix Component
 * Main container for the dashboard grid system
 */
export default function ServiceMatrix() {
  // === Context and State ===
  const { connected, services: socketServices } = useSocket();
  const { activeModules, setActiveModules } = useContext(SettingsContext);

  // Component state
  const [layout, setLayout] = useState(createEmptyLayout());
  const [modules, setModules] = useState({ system: [], service: [], user: [] });
  const [filteredItems, setFilteredItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showLeft, setShowLeft] = useState(true);
  const [showRight, setShowRight] = useState(true);
  const [error, setError] = useState(null);

  // === Component Initialization ===
  useEffect(() => {
    async function loadComponents() {
      try {
        setIsLoading(true);
        
        // Use the unified component registry initializer
        const result = await initializeComponentRegistry();
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to initialize component registry');
        }
        
        // Store modules data
        if (result.moduleData) {
          setModules(result.moduleData);
        }
        
        // Log success information
        const componentKeys = Object.keys(result.paneMap || {});
        console.log(`Initialized component registry with ${componentKeys.length} components`);
        
        if (componentKeys.length === 0) {
          console.warn('No components were loaded!');
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error('Failed to initialize components:', err);
        setError(`Failed to load components: ${err.message}`);
        setIsLoading(false);
      }
    }
    
    loadComponents();
  }, []);
  
  // === Active Module Handling ===
  useEffect(() => {
    async function updateActiveComponents() {
      try {
        if (!isLoading) {
          // Combine all potential items
          const allPotentialItems = [
            ...(socketServices || []),
            ...(modules.system || []),
            ...(modules.service || []),
            ...(modules.user || [])
          ];
          
          // Filter based on active modules using the registry
          const filteredItems = filterByActiveModules(allPotentialItems, activeModules);
          
          // Update filtered items for rendering
          setFilteredItems(filteredItems);
          
          // Load layout based on filtered items
          const layoutData = await loadLayout(filteredItems);
          
          // Update layout state
          setLayout(layoutData);
        }
      } catch (err) {
        console.error('Layout update failed:', err);
        setError(err.message);
      }
    }
    
    updateActiveComponents();
  }, [activeModules, isLoading, socketServices, modules]);
  
  // === Layout Management ===
  const onLayoutChange = useCallback((updatedLayouts) => {
    // Normalize layout to ensure all breakpoints exist
    const normalized = {};
    BREAKPOINTS.forEach(bp => {
      normalized[bp] = updatedLayouts[bp] || [];
    });
    
    // Update state and persist changes
    setLayout(normalized);
    saveLayoutToLocal(normalized);
    debouncedSaveToSession(normalized);
  }, []);
  
  /**
   * Reset the layout to empty state
   */
  const resetLayout = useCallback(async () => {
    try {
      // Clear local storage
      localStorage.removeItem('vaio_layout');
      
      // Clear layout and modules in session
      await Promise.all([
        fetch('/api/user/session/grid', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        }),
        fetch('/api/user/session/modules', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify([])
        })
      ]);
      
      // Reload the page to apply changes
      window.location.reload();
    } catch (err) {
      console.error('Error resetting layout:', err);
      setError(`Failed to reset layout: ${err.message}`);
    }
  }, []);
  
  // === UI Management ===
  const toggleLeftPanel = useCallback(() => {
    setShowLeft(prev => !prev);
  }, []);
  
  const toggleRightPanel = useCallback(() => {
    setShowRight(prev => !prev);
  }, []);
  
  // === UI Components ===
  const errorContent = useMemo(() => (
    <>
      <ErrorEffects isActive />
      <div className="flex h-full w-full items-center justify-center">
        <div 
          className="text-black text-4xl font-mono animate-scanlines" 
          style={{ fontSize: '3rem', textShadow: '0 0 5px rgba(255,255,255,0.7)' }}
        >
          <ErrorSkull />
          FATAL SOCKET DEATH
        </div>
      </div>
    </>
  ), []);
  
  const loadingContent = useMemo(() => (
    <div className="flex h-full w-full items-center justify-center">
      <div className="text-green-400 text-xl">Loading components...</div>
    </div>
  ), []);
  
  // === Main Render ===
  return (
    <div 
      className={`w-screen h-screen flex flex-col bg-black text-green-300 font-mono ${!connected ? 'boot-glow' : ''}`}
    >
      {/* Visual effect overlay */}
      <div className={`fixed inset-0 z-50 pointer-events-none ${!connected ? 'scanlines' : ''}`} />
      
      {/* Mobile navigation */}
      <div className="flex md:hidden justify-between px-4 py-2 bg-black border-b border-green-600">
        <button 
          onClick={toggleLeftPanel} 
          className="text-green-400 text-xs border px-2 py-1"
        >
          ☰ Menu
        </button>
        <button 
          onClick={toggleRightPanel} 
          className="text-green-400 text-xs border px-2 py-1"
        >
          ☰ Panel
        </button>
      </div>
      
      {/* Main layout */}
      <div className="flex flex-1 h-0">
        {/* Left panel */}
        <SidePanelLeft show={showLeft} toggle={toggleLeftPanel} />
        
        {/* Main content area */}
        <div className="flex-1 h-full overflow-y-auto p-4 scroll-panel">
          {isLoading ? (
            loadingContent
          ) : error ? (
            <div className="bg-red-800/20 p-4 rounded border border-red-500">
              <h3 className="text-red-400 text-lg">Error</h3>
              <p className="text-red-300">{error}</p>
            </div>
          ) : !connected ? (
            errorContent
          ) : (
            <ServiceGrid
              layout={layout}
              onLayoutChange={onLayoutChange}
              services={filteredItems}
              modules={modules}
              paneMap={getPaneMap()}
              logoUrls={getLogoMap()}
              activeModules={activeModules}
            />
          )}
        </div>
        
        {/* Right panel */}
        <SidePanelRight 
          show={showRight} 
          toggle={toggleRightPanel} 
          onReset={resetLayout} 
        />
      </div>
    </div>
  );
}