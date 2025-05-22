/**
 * MODULE-FLOW-8.4: Module Toggle - UI Control for Modules
 * COMPONENT: UI Layer - Module Management
 * PURPOSE: Provides toggle button for adding/removing modules
 * FLOW: Uses module operations to toggle module instances
 */

import { useContext } from 'react';
import { SettingsContext } from '../../Context/SettingsContext';
import { useSocket } from '../../Context/SocketContext';
import LaunchButtonSuper from '../../Launchers/LaunchButtonSuper';
import { saveModuleState, removeModule, findActiveInstances, hasActiveInstances } from './module-operations';
import { useError } from '../../../../Error-Handling/Diagnostics/ErrorNotificationSystem';
import { ERROR_MESSAGES } from './module-constants';
import { synchronizeLayoutAndModules } from '../../Loader/Layout/layout-shared';

/**
 * MODULE-FLOW-8.4.1: Module Toggle Component
 * COMPONENT: UI Layer - Toggle Button
 * PURPOSE: Renders button that toggles module instances
 * FLOW: Shows add or remove button based on current state
 * @param {Object} props - Component props
 * @param {string} props.slug - Module type identifier
 * @param {string} props.label - Display label
 * @returns {JSX.Element} - Toggle button component
 */
export default function ModuleToggle({ slug, label = null }) {
  // Use context for global state
  const { gridLayout, setGridLayout, activeModules, setActiveModules } = useContext(SettingsContext);
  const { socket } = useSocket();
  const { showError } = useError();
  
  // Check if module has active instances using standardized function
  const hasModuleInstances = hasActiveInstances(slug, activeModules);
  const activeInstances = findActiveInstances(slug, activeModules);

  /**
   * MODULE-FLOW-8.4.2: Module Removal Handler
   * COMPONENT: UI Layer - Event Handler
   * PURPOSE: Handles module removal when button clicked
   * FLOW: Removes instances and updates state
   */
  const handleRemove = async () => {
    try {
      // First ensure layouts and modules are in sync
      const { layouts: syncedLayout, modules: syncedModules } = 
        synchronizeLayoutAndModules(gridLayout, activeModules);
      
      // Get updated state using standardized removeModule function
      const { activeModules: updatedModules, gridLayout: updatedLayout, removedInstances } = 
        removeModule(slug, syncedModules, syncedLayout);
      
      if (!removedInstances || removedInstances.length === 0) return;
      
      // Perform one more sync to ensure everything is consistent
      const { layouts: finalLayout, modules: finalModules } = 
        synchronizeLayoutAndModules(updatedLayout, updatedModules);
      
      // Update context state
      setActiveModules(finalModules);
      setGridLayout(finalLayout);
      
      // Persist state changes using standardized saveModuleState
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
      // Use standardized error message from ERROR_MESSAGES
      showError(
        `${ERROR_MESSAGES.FAILED_TOGGLE} ${slug}: ${err.message}`,
        'error'
      );
    }
  };

  /**
   * MODULE-FLOW-8.4.3: Toggle Button Rendering
   * COMPONENT: UI Layer - UI Rendering
   * PURPOSE: Renders the appropriate button based on state
   * FLOW: Shows remove button or launch button
   */
  return (
    <div className="p-2">
      {hasModuleInstances ? (
        <button
          onClick={handleRemove}
          className="px-4 py-1 rounded text-xs bg-red-700 text-white hover:opacity-80"
          title={`Remove ${activeInstances.length} instance(s) of ${label || slug}`}
        >
          Remove {label || slug} ({activeInstances.length})
        </button>
      ) : (
        <LaunchButtonSuper moduleType={slug} label={label} />
      )}
    </div>
  );
}