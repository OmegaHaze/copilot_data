import { useState, useContext } from 'react';
import { SettingsContext } from '../Context/SettingsContext.jsx';
import { useSocket } from '../Context/SocketContext.jsx';
import { useError } from '../../../Error-Handling/Diagnostics/ErrorNotificationSystem.jsx';
import { ErrorType, ErrorSeverity } from '../../../Error-Handling/Diagnostics/types/errorTypes';
import { addModule, saveModuleState } from '../../../Panes/Utility/Loader/Module/module-operations.js';
import { getCanonicalKey } from '../../../Panes/Utility/Loader/Component/component-shared';

export default function LaunchButtonNvidia({
  moduleType = 'SERVICE',
  staticIdentifier = 'NvidiaPane',
  label = 'Launch NVIDIA'
}) {
  const [isLaunching, setIsLaunching] = useState(false);
  const { socket } = useSocket();
  const { showError } = useError();
  const { gridLayout, setGridLayout, activeModules, setActiveModules } = useContext(SettingsContext);

  const handleLaunch = async () => {
    setIsLaunching(true);
    try {
      const fullKey = `${getCanonicalKey(moduleType)}-${staticIdentifier}`;

      const {
        paneId,
        moduleType: extractedType,
        staticIdentifier: extractedId,
        instanceId,
        activeModules: nextModules,
        gridLayout: nextLayout
      } = await addModule(fullKey, activeModules, gridLayout);

      console.log(`Launching ${extractedType}-${extractedId}-${instanceId}`);

      try {
        const { loadComponent } = await import('../../../Panes/Utility/Loader/Component/component-loader');
        await loadComponent(extractedType, extractedId, paneId);
      } catch (loadError) {
        console.warn(`Preloading component failed, Grid will retry: ${loadError.message}`);
      }

      setActiveModules(nextModules);
      setGridLayout(nextLayout);

      setTimeout(() => {
        saveModuleState(nextLayout, nextModules);
      }, 0);

      socket.emit('pane:launched', {
        paneId,
        moduleType: extractedType,
        staticIdentifier: extractedId,
        instanceId,
        timestamp: Date.now()
      });
    } catch (err) {
      showError(`Failed to launch ${staticIdentifier}: ${err.message}`, ErrorType.SERVICE, ErrorSeverity.HIGH);
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
