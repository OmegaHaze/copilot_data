import { useContext } from 'react';
import { SettingsContext } from '../../Context/SettingsContext';
import { useSocket } from '../../Context/SocketContext';
import LaunchButtonSuper from '../../Launchers/LaunchButtonSuper';
import { saveModuleState } from './module-operations';
import { findActiveInstances, hasActiveInstances, removeModule } from './module-operations';
import { useError } from '../../../../Error-Handling/Diagnostics/ErrorNotificationSystem';
import { ERROR_MESSAGES } from './module-constants';
import { synchronizeLayoutAndModules } from '../../Loader/Layout/layout-shared';

export default function ModuleToggle({ slug, label = null }) {
  const { gridLayout, setGridLayout, activeModules, setActiveModules } = useContext(SettingsContext);
  const { socket } = useSocket();
  const { showError } = useError();
  
  const hasModuleInstances = hasActiveInstances(slug, activeModules);

  const handleRemove = async () => {
    try {
      // First ensure layouts and modules are in sync
      const { layouts: syncedLayout, modules: syncedModules } = 
        synchronizeLayoutAndModules(gridLayout, activeModules);
      
      // Get updated state
      const { activeModules: updatedModules, gridLayout: updatedLayout, removedInstances } = 
        removeModule(slug, syncedModules, syncedLayout);
      
      if (!removedInstances || removedInstances.length === 0) return;
      
      // Perform one more sync to ensure everything is consistent
      const { layouts: finalLayout, modules: finalModules } = 
        synchronizeLayoutAndModules(updatedLayout, updatedModules);
      
      // Update context state
      setActiveModules(finalModules);
      setGridLayout(finalLayout);
      
      // Persist state changes
      await saveModuleState(finalLayout, finalModules);
      
      // Notify other components
      if (socket?.emit) {
        socket.emit("pane:removed", {
          moduleType: slug,  
          instanceIds: removedInstances,
          timestamp: Date.now()
        });
      }
    } catch (err) {
      showError(
        `${ERROR_MESSAGES.FAILED_TOGGLE} ${slug}: ${err.message}`,
        'error'
      );
    }
  };

  // Either launch a new instance or remove existing ones
  return (
    <div className="p-2">
      {hasModuleInstances ? (
        <button
          onClick={handleRemove}
          className="px-4 py-1 rounded text-xs bg-red-700 text-white hover:opacity-80"
        >
          Remove {label || slug}
        </button>
      ) : (
        <LaunchButtonSuper moduleType={slug} label={label} />
      )}
    </div>
  );
}