import { useEffect, useState, useContext, useCallback, useMemo } from 'react';
import ServiceGrid from './ServiceGrid.jsx';
import { SettingsContext } from '../Context/SettingsContext.jsx';
import { debouncedSaveToSession, loadLayouts, saveLayoutsToLocal } from './LayoutManager.js';
import { filterByActiveModules } from './ModuleFilter.js';
import { fetchAndSyncSessionData, refreshSessionData } from './SessionManager.js';
import { initializeComponentRegistry, getPaneMap, getLogoMap } from './ComponentRegistryInitializer.js';
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
  const [layouts, setLayouts] = useState({ lg: [], md: [], sm: [], xs: [], xxs: [] });
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
      ErrorType.SYSTEM,
      ErrorSeverity.MEDIUM
    );
    setError(`${context}: ${error.message}`);
  }, [showError]);

  // === Component Initialization ===
  useEffect(() => {
    async function loadComponents() {
      try {
        setIsLoading(true);
        
        // Initialize component registry
        const result = await initializeComponentRegistry();
        
        // Process registry results
        if (result.moduleData) {
          setModules(result.moduleData);
        }
        
        if (!result.success) {
          handleError(new Error(result.errorMessage || 'Failed to initialize components'), 
                      'Component Initialization');
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
  }, [isLoading, setActiveModules, setGridLayout, handleError]);
  
  // === Active Module Handling ===
  useEffect(() => {
    async function updateActiveComponents() {
      try {
        if (!isLoading) {
          // Combine all potential items
          const allPotentialItems = [
            ...(socketServices || []),
            ...(modules.SYSTEM || []),
            ...(modules.SERVICE || []),
            ...(modules.USER || [])
          ];
          
          // Filter items based on active modules
          const filteredItems = await filterByActiveModules(allPotentialItems, activeModules);
          setFilteredItems(filteredItems);
          
          // Load layouts using filtered items and session data
          const layoutsData = await loadLayouts(filteredItems, sessionData);
          setLayouts(layoutsData);
        }
      } catch (err) {
        handleError(err, 'Active components update failed');
      }
    }
    
    updateActiveComponents();
  }, [activeModules, isLoading, socketServices, modules, sessionData, gridLayout, handleError]);
  
  // === Layout Management ===
  const onLayoutChange = useCallback((updatedLayouts) => {
    // Ensure all breakpoints exist
    const normalized = {};
    ['lg', 'md', 'sm', 'xs', 'xxs'].forEach(bp => {
      normalized[bp] = updatedLayouts[bp] || [];
    });
    
    // Update local state
    setLayouts(normalized);
    setGridLayout(normalized);
    
    // Save to local storage for quick recovery
    saveLayoutsToLocal(normalized);
    
    // Debounce server updates to avoid excessive API calls
    debouncedSaveToSession(normalized, activeModules)
      .catch(err => handleError(err, 'Failed to save layouts'));
    
    // Notify other components via socket
    if (socket?.emit) {
      socket.emit('layouts:updated', {
        layouts: normalized,
        timestamp: Date.now()
      }, { debounce: true });
    }
  }, [socket, setGridLayout, activeModules, handleError]);
  
  // === Listen for Pane Events ===
  useEffect(() => {
    if (socket && !isLoading) {
      const handleRefresh = (reason) => {
        refreshSessionData({
          setSessionData,
          setActiveModules,
          setGridLayout,
          setLayouts,
          componentRegistry: window.componentRegistry,
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

  // === UI States ===
  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <div className="text-gray-400">LOADING GRID...</div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="relative bg-red-800/20 p-4 rounded border border-red-500">
        <h3 className="text-red-400 text-lg">ERROR</h3>
        <p className="text-red-300">{error}</p>
      </div>
    );
  }

  // Disconnected state
  if (!connected) {
    return (
      <div className="fixed inset-0 flex h-full w-full items-center justify-center">
        <div className="text-red-300 text-xl">
          Connection lost - Please check your network connection
        </div>
      </div>
    );
  }

  // Main render - grid
  return (
    <div className="relative w-full h-full">
      <ServiceGrid
        layouts={layouts}
        onLayoutChange={onLayoutChange}
        services={filteredItems}
        modules={modules}
        paneMap={getPaneMap()}
        logoUrls={getLogoMap()}
        activeModules={activeModules}
      />
    </div>
  );
}