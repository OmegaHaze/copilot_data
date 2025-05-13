// [LBS-001] LaunchButtonSuper - Button component for launching Supervisor pane
import { useContext, useState } from 'react';
import { SettingsContext } from '../Context/SettingsContext.jsx';
import { useSocket } from '../Context/SocketContext.jsx';
import { createLayoutItemForAllBreakpoints } from '../Loader/LayoutPositioning.js';
import { saveLayoutsToSession } from '../Loader/LayoutManager.js';
import { useError } from '../../../Error-Handling/Diagnostics/ErrorNotificationSystem.jsx';

export default function LaunchButtonSuper() {
  // [LBS-002] Context Access - Get layout state and updaters from context
  const { gridLayout, setGridLayout, activeModules, setActiveModules } = useContext(SettingsContext);
  const { socket } = useSocket();
  const { showError } = useError();
  const [isLaunching, setIsLaunching] = useState(false);

  // [LBS-003] Launch Handler - Core function for creating a new Supervisor pane
  const handleLaunch = async () => {
    if (!Array.isArray(activeModules) || isLaunching) return;
    setIsLaunching(true);

    // [LBS-004] Module Identification - Define type and static identifier
    const moduleType = 'SYSTEM';
    const staticIdentifier = 'SupervisorPane';
    const existing = activeModules.find(id => id.startsWith(`${moduleType}-${staticIdentifier}`));
    
    // [LBS-005] Duplicate Prevention - Only allow one Supervisor pane
    if (existing) {
      showError(`${staticIdentifier} already active`, 'warning');
      setIsLaunching(false);
      return;
    }

    // [LBS-006] Unique ID Generation - For the instance part of the three-part ID
    const instanceId = Date.now().toString(36) + Math.floor(Math.random() * 1000).toString(36);
    const paneId = `${moduleType}-${staticIdentifier}-${instanceId}`;

    try {
      // [LBS-007] Grid Layout Validation - Ensure valid structure
      const safeGridLayout = gridLayout && typeof gridLayout === 'object' ? 
        gridLayout : { lg: [], md: [], sm: [], xs: [], xxs: [] };
      
      // [LBS-008] Layout Item Creation - Get optimal positions for all breakpoints
      const layoutItems = createLayoutItemForAllBreakpoints(moduleType, staticIdentifier, safeGridLayout);
      
      // Create a proper new layout by updating each breakpoint's array
      const newLayouts = { ...safeGridLayout };
      
      // [LBS-009] Breakpoint Processing - Add new item to each responsive breakpoint
      Object.keys(layoutItems).forEach(bp => {
        const newItem = {
          ...layoutItems[bp],
          i: paneId,  // Ensure consistent paneId across all breakpoints
          moduleType: moduleType,  // Explicitly set moduleType
          staticIdentifier: staticIdentifier  // Include staticIdentifier
        };
        
        // Ensure breakpoint exists as an array
        if (!Array.isArray(newLayouts[bp])) {
          newLayouts[bp] = [];
        }
        
        // Add the new item to the array
        newLayouts[bp] = [...newLayouts[bp], newItem];
      });
      
      const newModules = [...activeModules, paneId];

      // [LBS-010] State Update - Update UI state before API call
      setGridLayout(newLayouts);
      setActiveModules(newModules);

      // [LBS-011] Backend Persistence - Save layout to session storage
      const result = await saveLayoutsToSession(newLayouts, newModules);
      
      if (!result) {
        throw new Error('Failed to save layout to session');
      }
      
      // [LBS-012] Socket Notification - Notify system of new pane
      if (socket?.emit) {
        socket.emit("pane:launched", {
          moduleType,
          staticIdentifier,
          instanceId,
          paneId,
          timestamp: Date.now()
        });
      }
    } catch (err) {
      showError(`Supervisor launch failed: ${err.message}`, 'error');
    } finally {
      setIsLaunching(false);
    }
  };

  // Debug function to verify layout data is saved correctly
  const verifyLayoutData = () => {
    try {
      // Check localStorage
      const localData = localStorage.getItem('vaio_layouts');
      const sessionData = sessionStorage.getItem('vaio_layouts');
      const hasLocal = !!localData;
      const hasSession = !!sessionData;
      
      // Trigger debug overlay with storage tab
      window.dispatchEvent(new CustomEvent('vaio:toggle-debug-overlay', {
        detail: { forced: true, tab: 'storage' }
      }));
      
      // Trigger a layout refresh
      window.dispatchEvent(new CustomEvent('vaio:layouts-updated', {
        detail: { source: 'verification' }
      }));
      
      console.log('Layout Storage Status:', {
        localStorage: hasLocal ? 'Found' : 'Not found',
        sessionStorage: hasSession ? 'Found' : 'Not found',
        gridLayoutInContext: !!gridLayout
      });
    } catch (err) {
      console.error('Error verifying layout data:', err);
    }
  };
  
  // Only show the debug button in development mode
  const isDev = window.location.hostname === 'localhost' || 
                window.location.hostname === '127.0.0.1';

  return (
    <div className="flex items-center">
      <button 
        onClick={handleLaunch} 
        disabled={isLaunching}
        className="px-3 py-1 rounded bg-green-700 text-white hover:bg-green-600 disabled:opacity-50"
      >
        {isLaunching ? 'Launching...' : 'Launch Supervisor'}
      </button>
      
      {isDev && (
        <button
          onClick={verifyLayoutData}
          className="ml-2 px-2 py-1 text-xs rounded bg-blue-700 text-white hover:bg-blue-600"
          title="Verify layout data in storage"
        >
          Debug
        </button>
      )}
    </div>
  );
}