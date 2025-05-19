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

      const { layouts: syncedLayout, modules: syncedModules } =
        synchronizeLayoutAndModules(gridLayout, activeModules);

      if (syncedModules.some(id => id.startsWith(`${getCanonicalKey(moduleType)}-${staticIdentifier}`))) {
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

      const { layouts: finalLayout, modules: finalModules } =
        synchronizeLayoutAndModules(nextLayout, nextModules);

      try {
        const { loadComponent } = await import('../../../Panes/Utility/Loader/Component/component-loader');
        await loadComponent(extractedType, extractedId);

        // Add module data refresh when launching component
        try {
          console.log('[LaunchButtonSuper] Refreshing module data after component launch');
          const { fetchAllModules } = await import('../../../Panes/Utility/Loader/Component/component-api');
          const registry = (await import('../../../Panes/Utility/Loader/Component/component-registry')).default;

          const moduleData = await fetchAllModules();
          if (moduleData) {
            console.log('[LaunchButtonSuper] Fetched fresh module data:', moduleData);

            // Check module data for debugging purposes
            if (!moduleData.SYSTEM || !Array.isArray(moduleData.SYSTEM)) {
              console.warn('[LaunchButtonSuper] Invalid SYSTEM module data:', moduleData.SYSTEM);
            }
            if (!moduleData.SERVICE || !Array.isArray(moduleData.SERVICE)) {
              console.warn('[LaunchButtonSuper] Invalid SERVICE module data:', moduleData.SERVICE);
            }
            if (!moduleData.USER || !Array.isArray(moduleData.USER)) {
              console.warn('[LaunchButtonSuper] Invalid USER module data:', moduleData.USER);
            }

            // Set the data in registry
            registry.setModuleData(moduleData);

            // Verify the data was set correctly
            const verifyData = registry.getModuleData();
            console.log('[LaunchButtonSuper] Verified module data after setting:', verifyData);

            // Dispatch an additional event to help debug overlay
            try {
              window.dispatchEvent(new CustomEvent('vaio:launch-button-updated-modules', {
                detail: {
                  moduleData: moduleData,
                  paneId,
                  timestamp: Date.now()
                }
              }));
            } catch (e) {
              console.warn('[LaunchButton] Failed to dispatch event:', e);
            }
          }
        } catch (moduleDataError) {
          console.warn('Failed to refresh module data:', moduleDataError);
        }
      } catch (loadError) {
        console.warn(`Preloading component failed, Grid will retry: ${loadError.message}`);
      }

      setActiveModules(finalModules);
      setGridLayout(finalLayout);

      setTimeout(() => {
        saveModuleState(finalLayout, finalModules);
      }, 0);

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
