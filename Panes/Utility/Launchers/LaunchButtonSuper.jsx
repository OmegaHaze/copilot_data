// LaunchButtonSuper.jsx - Launches Supervisor pane with deduplication and error handling
import { useContext, useState } from 'react';
import { SettingsContext } from '../Context/SettingsContext.jsx';
import { useSocket } from '../Context/SocketContext.jsx';
import { saveLayoutsToSession } from '../Loader/LayoutManager.js';
import { createLayoutItemForAllBreakpoints } from '../Loader/LayoutPositioning.js';
import { useError } from '../../../Error-Handling/Diagnostics/ErrorNotificationSystem.jsx';

export default function LaunchButtonSuper() {
  const { gridLayout, setGridLayout, activeModules, setActiveModules } = useContext(SettingsContext);
  const { socket } = useSocket();
  const { showError } = useError();
  const [isLaunching, setIsLaunching] = useState(false);

  const handleLaunch = async () => {
    if (!Array.isArray(activeModules)) return;

    const moduleType = 'SYSTEM';
    const existing = activeModules.find(id => id.startsWith(moduleType + '-'));
    if (existing) {
      showError(`${moduleType} already active`, 'warning');
      return;
    }

    const instanceId = Math.random().toString(36).substring(2, 8);
    const paneId = `${moduleType}-${instanceId}`;

    try {
      const newLayouts = { ...gridLayout, ...createLayoutItemForAllBreakpoints(moduleType, instanceId, gridLayout) };
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
