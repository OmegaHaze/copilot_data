/**
 * ServiceMatrix - Main container for the dashboard grid system
 * Orchestrates component loading, layout management, and service filtering
 */
import { useEffect, useState, useContext, useRef, useCallback, useMemo } from 'react';
import ServiceGrid from './ServiceGrid.jsx';
import SidePanelLeft from '../../../Panels/SidePanelLeft.jsx';
import SidePanelRight from '../../../Panels/SidePanelRight.jsx';
import ErrorEffects from '../../../Error-Handling/ErrorEffects.jsx';
import ErrorSkull from '../../../Error-Handling/ErrorSkull.jsx';
import { SettingsContext } from '../../../SettingsMenu/SettingsContext.jsx';
import { getBaseModuleType } from './ModuleRegistry.js';
import { debouncedSaveToSession } from './LayoutManager.js';

// Import component and layout managers
import {
  initComponentLoader,
  getPaneMap
} from './ComponentLoader.js';
import { getLogoMap, getModuleData } from './ComponentRegistry.js';

import {
  loadLayout,
  saveLayoutToLocal,
  createEmptyLayout,
  BREAKPOINTS
} from './LayoutManager.js';

import { useSocket } from '../SocketContext.jsx';

// === Utility Functions ===

/**
 * Deep equality check for arrays and objects
 * @param {any} a - First value to compare
 * @param {any} b - Second value to compare
 * @returns {boolean} True if values are deeply equal
 */
function isEqual(a, b) {
  // Handle reference equality
  if (a === b) return true;
  
  // Handle null/undefined cases
  if (!a || !b) return false;
  
  // Handle arrays
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((val, idx) => isEqual(val, b[idx]));
  }
  
  // Handle objects
  if (typeof a === 'object' && typeof b === 'object') {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    return keysA.every(key => isEqual(a[key], b[key]));
  }
  
  // Values are not equal
  return false;
}

/**
 * Filter items based on active modules
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
    
    // Get the module name/key
    const moduleName = (item.module || item.name || '').toLowerCase();
    if (!moduleName) return false;
    
    // Check for direct module name match
    if (activeModules.includes(moduleName)) {
      return true;
    }
    
    // Check for moduleType-instanceId format
    return activeModules.some(activeId => {
      if (activeId.includes('-')) {
        const baseType = getBaseModuleType(activeId);
        return baseType === moduleName;
      }
      return false;
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
  
  // Refs for tracking previous values
  const prevSocketServices = useRef([]);
  const prevActiveModules = useRef([]);
  const isInitialLoad = useRef(true);

  // === Component Initialization ===
  
  /**
   * Load components and module data on mount
   */
  useEffect(() => {
    async function loadComponents() {
      try {
        console.log('⏳ Starting component loader initialization...');
        setIsLoading(true);
        
        const result = await initComponentLoader();
        console.log('✅ Component loader initialized with result:', result);
        
        // Store modules data from result
        if (result && result.moduleData) {
          setModules(result.moduleData);
        }
        
        // Log available components for debugging
        const componentKeys = Object.keys(result?.paneMap || {});
        console.log('📦 Available pane components:', componentKeys);
        if (componentKeys.length === 0) {
          console.error('⚠️ No components were loaded! This will cause rendering issues.');
        }
        
        // Make resetLayout available for debugging
        if (process.env.NODE_ENV === 'development') {
          window.vaioResetLayout = resetLayout;
        }
        
        // Use the moduleData directly from the initialization result
        const moduleData = result.moduleData || getModuleData();
        console.log('📊 Module data retrieved:', {
          system: moduleData.system.length,
          service: moduleData.service.length,
          user: moduleData.user.length
        });
        
        setModules(moduleData);
        setIsLoading(false);
      } catch (err) {
        console.error('🛑 Failed to initialize components:', err);
        setError(`Failed to load components: ${err.message}`);
        setIsLoading(false);
      }
    }
    
    loadComponents();
  }, []);
  
  // === Active Module Handling ===
  
  /**
   * Update layout when active modules change
   */
  useEffect(() => {
    async function updateActiveComponents() {
      try {
        // Skip update if modules haven't changed (except on initial load)
        if (!isInitialLoad.current && isEqual(activeModules, prevActiveModules.current)) {
          console.log('⏭️ Skipping layout update - active modules unchanged');
          return;
        }
        
        isInitialLoad.current = false;
        console.log('🔄 Active modules changed, updating layout');
        
        // Get all available module data
        const moduleData = modules || getModuleData();
        
        // Combine all potential items
        const allPotentialItems = [
          ...(socketServices || []),
          ...(moduleData.system || []),
          ...(moduleData.service || []),
          ...(moduleData.user || [])
        ];
        
        // Filter based on active modules
        const filteredItems = filterByActiveModules(allPotentialItems, activeModules);
        console.log(`📊 Filtered ${allPotentialItems.length} potential items to ${filteredItems.length} active items`);
        
        // Update filtered items for rendering
        setFilteredItems(filteredItems);
        
        // Load layout based on filtered items
        console.log('🔄 Loading layout for items:', filteredItems.length);
        const layoutData = await loadLayout(filteredItems);
        
        console.log('📊 Layout loaded:', { 
          breakpoints: Object.keys(layoutData),
          itemsPerBreakpoint: Object.keys(layoutData).reduce((acc, bp) => {
            acc[bp] = layoutData[bp]?.length || 0;
            return acc;
          }, {})
        });
        
        // Update layout state
        setLayout(layoutData);
        
        // Store current active modules to prevent unnecessary updates
        prevActiveModules.current = [...activeModules];
      } catch (err) {
        console.error('🛑 ServiceMatrix layout update failed:', err);
        setError(err.message);
      }
    }
    
    if (!isLoading) {
      updateActiveComponents();
    }
  }, [activeModules, isLoading, socketServices]);
  
  /**
   * Track service data changes without triggering layout updates
   */
  useEffect(() => {
    if (socketServices && Array.isArray(socketServices)) {
      console.log('📊 Updating service props only - not changing layout');
      prevSocketServices.current = socketServices;
    }
  }, [socketServices]);
  
  // === Layout Management ===
  
  /**
   * Handle layout changes from the grid
   */
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
      console.log('🧹 Resetting layout to empty state...');
      
      // 1. Clear local storage
      localStorage.removeItem('vaio_layout');
      
      // 2. Clear layout in session
      await fetch('/api/user/session/grid', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      
      // 3. Clear active modules
      await fetch('/api/user/session/modules', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify([])
      });
      
      console.log('✅ Layout reset complete, reloading page...');
      
      // 4. Reload the page to apply changes
      window.location.reload();
    } catch (err) {
      console.error('🛑 Error resetting layout:', err);
      setError(`Failed to reset layout: ${err.message}`);
      alert('Failed to reset layout. See console for details.');
    }
  }, []);
  
  // === UI Management ===
  
  /**
   * Toggle left panel visibility
   */
  const toggleLeftPanel = useCallback(() => {
    setShowLeft(prev => !prev);
  }, []);
  
  /**
   * Toggle right panel visibility
   */
  const toggleRightPanel = useCallback(() => {
    setShowRight(prev => !prev);
  }, []);
  
  /**
   * Error state UI
   */
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
  
  /**
   * Loading state UI
   */
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