// LaunchButtonSuper.jsx - Launches Supervisor pane with deduplication and error handling
import { useContext, useState } from 'react';
import { SettingsContext } from '../Context/SettingsContext.jsx';
import { useSocket } from '../Context/SocketContext.jsx';
import { saveLayoutsToSession } from '../Loader/LayoutManager.js';
// Remove static import of LayoutPositioning and use dynamic import
import { useError } from '../../../Error-Handling/Diagnostics/ErrorNotificationSystem.jsx';

export default function LaunchButtonSuper() {
  const { gridLayout, setGridLayout, activeModules, setActiveModules } = useContext(SettingsContext);
  const { socket } = useSocket();
  const { showError } = useError();
  const [isLaunching, setIsLaunching] = useState(false);

  const handleLaunch = async () => {
    if (!Array.isArray(activeModules)) return;

    const moduleType = 'SYSTEM';
    const staticIdentifier = 'SupervisorPane';
    const existing = activeModules.find(id => id.startsWith(`${moduleType}-${staticIdentifier}`));
    if (existing) {
      showError(`${staticIdentifier} already active`, 'warning');
      return;
    }

    const instanceId = Math.random().toString(36).substring(2, 8);
    const paneId = `${moduleType}-${staticIdentifier}-${instanceId}`;

    try {
      // Dynamically import LayoutPositioning
      const { createLayoutItemForAllBreakpoints } = await import('../Loader/LayoutPositioning.js');
      
      // Get layout items for all breakpoints
      const layoutItems = createLayoutItemForAllBreakpoints(moduleType, staticIdentifier, gridLayout);
      
      // Create a proper new layout by updating each breakpoint's array
      const newLayouts = { ...gridLayout };
      
      // For each breakpoint, add the new item to the array
      Object.keys(layoutItems).forEach(bp => {
        const newItem = layoutItems[bp];
        // Ensure item has an 'i' property with the paneId
        newItem.i = paneId;
        
        // Ensure breakpoint exists as an array (should already be initialized in SettingsContext)
        if (!newLayouts[bp]) {
          newLayouts[bp] = [];
        }
        
        // Add the new item to the array
        newLayouts[bp] = [...newLayouts[bp], newItem];
      });
      
      const newModules = [...activeModules, paneId];

      setGridLayout(newLayouts);
      setActiveModules(newModules);

      await saveLayoutsToSession(newLayouts, newModules);
    } catch (err) {
      showError(`Supervisor launch failed: ${err.message}`, 'error');
    } finally {
      setIsLaunching(false);
    }
  };

  return (
    <button onClick={handleLaunch} disabled={isLaunching}>
      Launch Supervisor
    </button>
  );
}
