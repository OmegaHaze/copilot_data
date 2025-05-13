// [LBN-001] LaunchButtonNvidia - Button component for launching NVIDIA service pane
import { useContext, useState } from 'react';
import { SettingsContext } from '../Context/SettingsContext.jsx';
import { useSocket } from '../Context/SocketContext.jsx';
import { saveLayoutsToSession } from '../Loader/LayoutManager.js';
// [LBN-002] Dynamic Importing - Uses dynamic import for optimization
// Remove static import of LayoutPositioning and use dynamic import
import { useError } from '../../../Error-Handling/Diagnostics/ErrorNotificationSystem.jsx';

export default function LaunchButtonNvidia() {
  // [LBN-003] Context Access - Get layout state and updaters from context
  const { gridLayout, setGridLayout, activeModules, setActiveModules } = useContext(SettingsContext);
  const { socket } = useSocket();
  const { showError } = useError();
  const [isLaunching, setIsLaunching] = useState(false);

  // [LBN-004] Launch Handler - Core function for creating a new NVIDIA pane
  const handleLaunch = async () => {
    if (!Array.isArray(activeModules)) return;

    // [LBN-005] Module Identification - Define type and static identifier
    const moduleType = 'SERVICE';
    const staticIdentifier = 'NvidiaPane';
    const existing = activeModules.find(id => id.startsWith(`${moduleType}-${staticIdentifier}`));
    
    // [LBN-006] Duplicate Prevention - Only allow one NVIDIA pane
    if (existing) {
      showError(`${staticIdentifier} already active`, 'warning');
      return;
    }

    // [LBN-007] Unique ID Generation - For the instance part of the three-part ID
    const instanceId = Math.random().toString(36).substring(2, 8);
    const paneId = `${moduleType}-${staticIdentifier}-${instanceId}`;

    try {
      // [LBN-008] Dynamic Loading - Fetch layout positioning utilities on demand
      // Dynamically import LayoutPositioning
      const { createLayoutItemForAllBreakpoints } = await import('../Loader/LayoutPositioning.js');
      
      // [LBN-009] Layout Item Creation - Get optimal positions for all breakpoints
      // Get layout items for all breakpoints
      const layoutItems = createLayoutItemForAllBreakpoints(moduleType, staticIdentifier, gridLayout);
      
      // Create a proper new layout by updating each breakpoint's array
      const newLayouts = { ...gridLayout };
      
      // [LBN-010] Breakpoint Processing - Add new item to each responsive breakpoint
      // For each breakpoint, add the new item to the array
      Object.keys(layoutItems).forEach(bp => {
        const newItem = {
          ...layoutItems[bp],
          i: paneId,  // Ensure consistent paneId across all breakpoints
          moduleType: moduleType,  // Explicitly set moduleType
          staticIdentifier: staticIdentifier  // Include staticIdentifier
        };
        
        // Ensure breakpoint exists as an array (should already be initialized in SettingsContext)
        if (!newLayouts[bp]) {
          newLayouts[bp] = [];
        }
        
        // Add the new item to the array
        newLayouts[bp] = [...newLayouts[bp], newItem];
      });
      
      const newModules = [...activeModules, paneId];

      // [LBN-011] State Update - Update UI state before API call
      setGridLayout(newLayouts);
      setActiveModules(newModules);

      // [LBN-012] Backend Persistence - Save layout to session storage
      await saveLayoutsToSession(newLayouts, newModules);
    } catch (err) {
      showError(`NVIDIA launch failed: ${err.message}`, 'error');
    } finally {
      setIsLaunching(false);
    }
  };

  return (
    <button onClick={handleLaunch} disabled={isLaunching}>
      Launch NVIDIA
    </button>
  );
}
