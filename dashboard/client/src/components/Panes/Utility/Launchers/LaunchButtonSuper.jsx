import { useState, useContext } from 'react';
import { SettingsContext } from '../Context/SettingsContext.jsx';
import { useSocket } from '../Context/SocketContext.jsx';
import { useError } from '../../../Error-Handling/Diagnostics/ErrorNotificationSystem.jsx';
import { ErrorType, ErrorSeverity } from '../../../Error-Handling/Diagnostics/types/errorTypes';
import { addModule, saveModuleState } from '../../../Panes/Utility/Loader/Module/module-operations.js';
import { getCanonicalKey } from '../../../Panes/Utility/Loader/Module/module-shared.js';
import { synchronizeLayoutAndModules } from '../../../Panes/Utility/Loader/Layout/layout-shared.js';

export default function LaunchButtonSuper({
  moduleType = 'SYSTEM',
  staticIdentifier = 'SupervisorPane',
  label = 'Launch Supervisor'
}) {
  const [isLaunching, setIsLaunching] = useState(false);
  const { socket } = useSocket();
  const { showError } = useError();
  const { gridLayout, setGridLayout, activeModules, setActiveModules } = useContext(SettingsContext);

  const handleLaunch = async () => {
    setIsLaunching(true);
    try {
      const fullKey = `${getCanonicalKey(moduleType)}-${staticIdentifier}`;

      // Synchronize layout and modules using context state
      const { layouts: syncedLayout, modules: syncedModules } =
        synchronizeLayoutAndModules(gridLayout, activeModules);

      if (syncedModules.some(id => id.startsWith(fullKey))) {
        console.warn(`Instance of ${fullKey} already active. Skipping launch.`);
        setIsLaunching(false);
        return;
      }

      const {
        paneId,
        moduleType: extractedType,
        staticIdentifier: extractedId,
        instanceId,
        activeModules: nextModules,
        gridLayout: nextLayout
      } = await addModule(fullKey, syncedModules, syncedLayout);

      console.log(`Launching ${extractedType}-${extractedId}-${instanceId}`);

      // Update context state directly
      setActiveModules(nextModules);
      setGridLayout(nextLayout);

      // Save state asynchronously
      saveModuleState(nextLayout, nextModules);

      // Emit socket event
      socket.emit('pane:launched', {
        paneId,
        moduleType: extractedType,
        staticIdentifier: extractedId,
        instanceId,
        timestamp: Date.now()
      });
    } catch (err) {
      showError(`Failed to launch ${staticIdentifier}: ${err.message}`, ErrorType.SYSTEM, ErrorSeverity.HIGH);
    } finally {
      setIsLaunching(false);
    }
  };

  return (
    <button
      onClick={handleLaunch}
      disabled={isLaunching}
      className="px-4 py-2 bg-green-700 hover:bg-green-600 text-white rounded text-sm"
    >
      {label}
    </button>
  );
}
