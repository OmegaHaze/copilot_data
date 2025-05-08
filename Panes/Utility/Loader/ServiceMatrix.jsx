import { useEffect, useState, useContext, useCallback, useMemo } from 'react';
import ServiceGrid from './ServiceGrid.jsx';
import { SettingsContext } from '../Context/SettingsContext.jsx';
import { debouncedSaveToSession, loadLayouts, saveLayoutsToLocal, BREAKPOINTS } from './LayoutManager.js';
import { createEmptyLayouts } from './LayoutTransformer.js';
import { filterByActiveModules } from './ModuleFilter.js';
import { fetchAndSyncSessionData, refreshSessionData } from './SessionManager.js';
import { initializeComponentRegistry, getPaneMap, getLogoMap } from './ComponentRegistryInitializer.js';
import { componentRegistry } from './ComponentRegistry.js';
import { useSocket } from '../Context/SocketContext.jsx';
import { useError } from '../../../Error-Handling/Diagnostics/ErrorNotificationSystem.jsx';
import { ErrorType, ErrorSeverity } from '../../../Error-Handling/Diagnostics/types/errorTypes';

/**
 * ServiceMatrix Component
 * Main container for the dashboard grid system
 */
export default function ServiceMatrix() {
  // === Context and State ===
  const { connected, services: socketServices, socket } = useSocket();
  const { activeModules, setActiveModules, gridLayout, setGridLayout } = useContext(SettingsContext);
  const { showError } = useError();

  // Component state
  const [layouts, setLayouts] = useState(createEmptyLayouts());
  const [modules, setModules] = useState({ SYSTEM: [], SERVICE: [], USER: [] });
  const [filteredItems, setFilteredItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessionData, setSessionData] = useState(null);

  // === Error Handler ===
  const handleError = useCallback((error, context) => {
    console.error(`${context}:`, error);
    showError(
      `${context}: ${error.message}`,
      ErrorType.SYSTEM,  // Use a proper ErrorType instead of 'error'
      ErrorSeverity.MEDIUM
    );
    setError(`${context}: ${error.message}`);
  }, [showError]);

  // === Component Initialization ===
  useEffect(() => {
    async function loadComponents() {
      try {
        setIsLoading(true);
        console.log('Starting component registry initialization...');
        
        // Attempt normal initialization
        const result = await initializeComponentRegistry();
        
        // Process registry results
        if (result.moduleData) {
          setModules(result.moduleData);
        }
        
        const componentKeys = Object.keys(result.paneMap || {});
        console.log(`Initialized component registry with ${componentKeys.length} components`);
        
        if (componentKeys.length === 0) {
          const error = new Error('No UI components were loaded');
          handleError(error, 'Component Initialization');
        }
        
        if (result.errorMessage) {
          handleError(new Error(result.errorMessage), 'Component Initialization');
        }
        
        // Check if we're in fallback mode
        if (result.moduleData?.fallbackMode) {
          console.warn('Operating in fallback mode - some features may be limited');
        }
        
        setIsLoading(false);
      } catch (err) {
        handleError(err, 'Failed to load components');
        setIsLoading(false);
      }
    }
    
    loadComponents();
  }, [handleError]);
  
  // === Fetch Session Data ===
  useEffect(() => {
    if (!isLoading) {
      fetchAndSyncSessionData(
        setGridLayout,  
        setActiveModules,
        setSessionData,
        'initial-load'
      ).catch(err => {
        handleError(err, 'Session data error');
      });
    }
  }, [isLoading, setActiveModules, setGridLayout, handleError, modules, showError]);
  
  // === Active Module Handling ===
  useEffect(() => {
    async function updateActiveComponents() {
      try {
        if (!isLoading) {
          const allPotentialItems = [
            ...(socketServices || []),
            ...(modules.SYSTEM || []),
            ...(modules.SERVICE || []),
            ...(modules.USER || [])
          ];
          
          const filteredItems = filterByActiveModules(allPotentialItems, activeModules);
          setFilteredItems(filteredItems);
          
          const layoutsData = await loadLayouts(filteredItems, sessionData);
          setLayouts(layoutsData);
        }
      } catch (err) {
        handleError(err, 'Layouts update failed');
      }
    }
    
    updateActiveComponents();
  }, [activeModules, isLoading, socketServices, modules, sessionData, gridLayout, handleError]);
  
  // === Layout Management ===
  const onLayoutChange = useCallback((updatedLayouts) => {
    const normalized = {};
    BREAKPOINTS.forEach(bp => {
      normalized[bp] = updatedLayouts[bp] || [];
    });
    
    // Update local state only, debounce server updates
    setLayouts(normalized);
    setGridLayout(normalized);
    saveLayoutsToLocal(normalized);
    
    // Debounce both session save and socket emit
    debouncedSaveToSession(normalized)
      .catch(err => handleError(err, 'Failed to save layouts'));
      
    if (socket?.emit) {
      // Debounce socket emit to avoid rapid updates
      socket.emit('layouts:updated', {
        layouts: normalized,
        timestamp: Date.now()
      }, { debounce: true });
    }
  }, [socket, setGridLayout, handleError]);
  
  // === Listen for Pane Events ===
  useEffect(() => {
    if (socket && !isLoading) {
      const handleRefresh = (reason) => {
        refreshSessionData({
          setSessionData,
          setActiveModules,
          setGridLayout,
          setLayouts,
          componentRegistry,
          reason
        }).catch(err => handleError(err, `Failed to refresh session on ${reason}`));
      };
      
      socket.on('pane:launched', () => handleRefresh('pane:launched'));
      socket.on('pane:closed', () => handleRefresh('pane:closed'));
      socket.on('layouts:updated', () => handleRefresh('layouts:updated'));
      
      return () => {
        socket.off('pane:launched');
        socket.off('pane:closed');
        socket.off('layouts:updated');
      };
    }
  }, [socket, isLoading, setActiveModules, setGridLayout, handleError]);

  // === UI Components ===
  const errorContent = useMemo(() => (
    <div className="fixed inset-0 flex h-full w-full items-center justify-center">
      <div className="text-red-300 text-xl">
        Connection lost - Please check your network connection
      </div>
    </div>
  ), []);

  // === Render ===
  return (
    <div className="relative w-full h-full">
      {/* Main grid with z-20 to stay above boot background but below error effects */}
      <div className="relative">
        {isLoading ? (
          <div className="flex items-center justify-center w-full h-full">
            <div className="text-gray-400">LOADING GRID...</div>
          </div>
        ) : error ? (
          <div className="relative bg-red-800/20 p-4 rounded border border-red-500">
            <h3 className="text-red-400 text-lg">ERROR</h3>
            <p className="text-red-300">{error}</p>
          </div>
        ) : !connected ? (
          errorContent
        ) : (
          <ServiceGrid
            layouts={layouts}
            onLayoutChange={onLayoutChange}
            services={filteredItems}
            modules={modules}
            paneMap={getPaneMap()}
            logoUrls={getLogoMap()}
            activeModules={activeModules}
          />
        )}
      </div>
    </div>
  );
}