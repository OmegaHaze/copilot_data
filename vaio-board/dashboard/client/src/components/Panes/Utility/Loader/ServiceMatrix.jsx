import { useEffect, useState, useContext, useCallback, useMemo } from 'react';
import ServiceGrid from './ServiceGrid.jsx';
import SidePanelLeft from '../../../Panels/SidePanelLeft.jsx';
import SidePanelRight from '../../../Panels/SidePanelRight.jsx';
import ErrorEffects from '../../../Error-Handling/ErrorEffects.jsx';
import ErrorSkull from '../../../Error-Handling/ErrorSkull.jsx';
import { SettingsContext } from '../../../SettingsMenu/SettingsContext.jsx';
import { debouncedSaveToSession } from './LayoutManager.js';

// Import the unified component system
import { initializeComponentRegistry, getPaneMap, getLogoMap } from '../Loader/ ComponentRegistryInitializer.js';
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
  const { connected, services: socketServices, socket } = useSocket();
  const { activeModules, setActiveModules, gridLayout, setGridLayout } = useContext(SettingsContext);

  // Component state
  const [layout, setLayout] = useState(createEmptyLayout());
  const [modules, setModules] = useState({ system: [], service: [], user: [] });
  const [filteredItems, setFilteredItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showLeft, setShowLeft] = useState(true);
  const [showRight, setShowRight] = useState(true);
  const [error, setError] = useState(null);
  const [sessionData, setSessionData] = useState(null);

  // === Component Initialization ===
  useEffect(() => {
    async function loadComponents() {
      try {
        setIsLoading(true);
        
        // Use the unified component registry initializer
        const result = await initializeComponentRegistry();
        
        // Store modules data
        if (result.moduleData) {
          setModules(result.moduleData);
        }
        
        // Log information
        const componentKeys = Object.keys(result.paneMap || {});
        console.log(`Initialized component registry with ${componentKeys.length} components`);
        
        if (componentKeys.length === 0) {
          console.warn('No components were loaded!');
          // Set an error but still continue
          setError('No UI components could be loaded. Please check the browser console for details.');
        }
        
        // If there's a specific error message, display it
        if (result.errorMessage) {
          console.warn('Component registry initialization warning:', result.errorMessage);
          setError(result.errorMessage);
        }
        
        // List what was loaded and what failed
        if (result.loadedComponents?.length > 0) {
          console.log('Successfully loaded:', result.loadedComponents.join(', '));
        }
        
        if (result.failedComponents?.length > 0) {
          console.warn('Failed to load:', result.failedComponents.join(', '));
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
  
  // === Fetch Session Data ===
  useEffect(() => {
    async function fetchSessionData() {
      try {
        if (!isLoading) {
          // Fetch session data from backend
          const sessionRes = await fetch('/api/user/session', {
            credentials: 'include'
          });
          
          if (!sessionRes.ok) {
            throw new Error(`Failed to load session: ${sessionRes.status}`);
          }
          
          const data = await sessionRes.json();
          console.log('ServiceMatrix: Fetched session data', { 
            hasGridLayout: !!data.grid_layout,
            activeModules: data.active_modules?.length || 0
          });
          
          // Store session data for use in other effects
          setSessionData(data);
          
          // Synchronize ComponentRegistry with session data
          componentRegistry.synchronizeWithSessionData(data);
          
          // Update context state with session data
          if (data.grid_layout && Object.keys(data.grid_layout).length > 0) {
            setGridLayout(data.grid_layout);
          } else {
            console.warn('No grid layout in session data');
          }
          
          if (data.active_modules && Array.isArray(data.active_modules)) {
            setActiveModules(data.active_modules);
          } else {
            console.warn('No active modules in session, using defaults');
            // Default modules to ensure UI is functional
            const defaultModules = ['supervisor', 'nvidia'];
            setActiveModules(defaultModules);
            
            // Try to save these defaults to session
            fetch('/api/user/session/modules', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify(defaultModules)
            }).catch(err => {
              console.error('Failed to save default modules:', err);
            });
          }
        }
      } catch (err) {
        console.error('Failed to fetch session data:', err);
        setError(`Session data error: ${err.message}`);
        
        // Show error in notification system if available
        if (window.errorSystem && typeof window.errorSystem.showError === 'function') {
          window.errorSystem.showError(
            `Failed to load session data: ${err.message}`, 
            'error',
            10000
          );
        }
      }
    }
    
    fetchSessionData();
  }, [isLoading, setActiveModules, setGridLayout]);
  
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
          
          // Load layout based on filtered items and session data
          const layoutData = await loadLayout(filteredItems, sessionData);
          
          // Update layout state
          setLayout(layoutData);
        }
      } catch (err) {
        console.error('Layout update failed:', err);
        setError(err.message);
      }
    }
    
    updateActiveComponents();
  }, [activeModules, isLoading, socketServices, modules, sessionData, gridLayout]);
  
  // === Layout Management ===
  const onLayoutChange = useCallback((updatedLayouts) => {
    // Normalize layout to ensure all breakpoints exist
    const normalized = {};
    BREAKPOINTS.forEach(bp => {
      normalized[bp] = updatedLayouts[bp] || [];
    });
    
    // Update state and persist changes
    setLayout(normalized);
    setGridLayout(normalized); // Update context state to ensure it's in sync
    saveLayoutToLocal(normalized);
    
    // Save to server and handle potential errors
    debouncedSaveToSession(normalized)
      .catch(err => {
        console.error('Failed to save layout to session:', err);
        
        // Show error in notification system if available
        if (window.errorSystem && typeof window.errorSystem.showError === 'function') {
          window.errorSystem.showError(
            `Failed to save layout: ${err.message}`, 
            'error',
            10000
          );
        }
      });
      
    // If socket is available, emit layout update event
    if (socket && typeof socket.emit === 'function') {
      socket.emit('layout:updated', {
        layout: normalized,
        timestamp: Date.now()
      });
    }
  }, [socket, setGridLayout]);
  
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
  
  // === Listen for Pane Events ===
  useEffect(() => {
    if (socket && !isLoading) {
      // Listen for pane launched events
      const handlePaneLaunched = (data) => {
        console.log('Pane launched event received:', data);
        
        // If we have layout and activeModules data directly in the event,
        // we can update immediately without a fetch
        if (data.layout && data.activeModules) {
          console.log('Using layout and modules directly from event data');
          setGridLayout(data.layout);
          setActiveModules(data.activeModules);
          setSessionData(prev => ({
            ...prev,
            grid_layout: data.layout,
            active_modules: data.activeModules
          }));
          
          // Synchronize with registry
          componentRegistry.synchronizeWithSessionData({
            grid_layout: data.layout,
            active_modules: data.activeModules
          });
        } else {
          // Otherwise fetch the latest session data
          fetch('/api/user/session', {
            credentials: 'include'
          })
            .then(res => {
              if (!res.ok) {
                throw new Error(`Failed to load session: ${res.status}`);
              }
              return res.json();
            })
            .then(data => {
              console.log('Session data refreshed after pane launch');
              setSessionData(data);
              
              // Synchronize with ComponentRegistry
              componentRegistry.synchronizeWithSessionData(data);
              
              // Update active modules from refreshed session data
              if (data.active_modules && Array.isArray(data.active_modules)) {
                setActiveModules(data.active_modules);
              }
              
              // Update grid layout from refreshed session data
              if (data.grid_layout) {
                setGridLayout(data.grid_layout);
              }
            })
            .catch(err => {
              console.error('Failed to refresh session after pane launch:', err);
              
              // Show error in notification system if available
              if (window.errorSystem && typeof window.errorSystem.showError === 'function') {
                window.errorSystem.showError(
                  `Failed to refresh session: ${err.message}`, 
                  'error',
                  8000
                );
              }
            });
        }
        
        // Register instance in registry if needed
        if (data.moduleType && data.instanceId) {
          componentRegistry.registerInstance(data.moduleType, data.instanceId);
        }
      };
      
      // Listen for pane closed events
      const handlePaneClosed = (data) => {
        console.log('Pane closed event received:', data);
        
        // Similar refresh logic as pane launched
        fetch('/api/user/session', {
          credentials: 'include'
        })
          .then(res => {
            if (!res.ok) {
              throw new Error(`Failed to load session: ${res.status}`);
            }
            return res.json();
          })
          .then(data => {
            console.log('Session data refreshed after pane closed');
            setSessionData(data);
            
            // Synchronize with ComponentRegistry
            componentRegistry.synchronizeWithSessionData(data);
            
            // Update states from refreshed data
            if (data.active_modules && Array.isArray(data.active_modules)) {
              setActiveModules(data.active_modules);
            }
            
            if (data.grid_layout) {
              setGridLayout(data.grid_layout);
            }
          })
          .catch(err => {
            console.error('Failed to refresh session after pane closed:', err);
            
            // Show error in notification system if available
            if (window.errorSystem && typeof window.errorSystem.showError === 'function') {
              window.errorSystem.showError(
                `Failed to refresh session: ${err.message}`, 
                'error',
                8000
              );
            }
          });
      };
      
      // Listen for layout update events
      const handleLayoutUpdated = (data) => {
        console.log('Layout update event received');
        
        if (data.layout) {
          console.log('Updating layout from event');
          setGridLayout(data.layout);
          setLayout(data.layout);
          
          // Update session data
          setSessionData(prev => ({
            ...prev,
            grid_layout: data.layout
          }));
          
          // Sync with registry
          componentRegistry.synchronizeWithSessionData({
            grid_layout: data.layout,
            active_modules: data.activeModules || prev?.active_modules
          });
        }
      };
      
      // Register socket event listeners
      socket.on('pane:launched', handlePaneLaunched);
      socket.on('pane:closed', handlePaneClosed);
      socket.on('layout:updated', handleLayoutUpdated);
      
      // Clean up event listeners on unmount
      return () => {
        socket.off('pane:launched', handlePaneLaunched);
        socket.off('pane:closed', handlePaneClosed);
        socket.off('layout:updated', handleLayoutUpdated);
      };
    }
  }, [socket, isLoading, setActiveModules, setGridLayout]);
  
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