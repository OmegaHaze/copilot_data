/**
 * MODULE-FLOW-8.3: Launch Button Super - Module Creation Button
 * COMPONENT: UI Layer - User Interaction
 * PURPOSE: Creates new module instances when clicked
 * FLOW: Triggers module creation and layout updates
 * MERMAID-FLOW: flowchart TD; MOD8.3[Launch Button] -->|Creates| MOD8.3.1[Module Instance];
 *               MOD8.3 -->|Updates| MOD7.1[Settings Context];
 *               MOD8.3 -->|Emits| MOD7.2[Socket Events]
 */

import { useState, useContext } from 'react';
import { SettingsContext } from '../Context/SettingsContext.jsx';
import { useSocket } from '../Context/SocketContext.jsx';
import { useError } from '../../../Error-Handling/Diagnostics/ErrorNotificationSystem.jsx';
import { ErrorType, ErrorSeverity } from '../../../Error-Handling/Diagnostics/types/errorTypes';

// Import from component-shared instead of shared-utilities
import { getCanonicalKey } from '../Loader/Component/component-shared';
import { addModule, saveModuleState } from '../Loader/Module/module-operations.js';
import { synchronizeLayoutAndModules } from '../Loader/Layout/layout-shared.js';

/**
 * MODULE-FLOW-8.3.1: Launch Button Super Component
 * COMPONENT: UI Layer - Button Component
 * PURPOSE: Creates system module instances
 * FLOW: Calls module operations to create new instances
 * @param {Object} props - Component props
 * @param {string} props.moduleType - Type of module to launch
 * @param {string} props.staticIdentifier - Component identifier
 * @param {string} props.label - Button label text
 * @returns {JSX.Element} - Button component
 */
export default function LaunchButtonSuper({
  moduleType = 'SYSTEM',
  staticIdentifier = 'SupervisorPane',
  label = 'Launch Supervisor'
}) {
  // State to track button loading state
  const [isLaunching, setIsLaunching] = useState(false);
  
  // Context for state and socket
  const { socket } = useSocket();
  const { showError } = useError();
  const { gridLayout, setGridLayout, activeModules, setActiveModules } = useContext(SettingsContext);

  /**
   * MODULE-FLOW-8.3.2: Launch Handler
   * COMPONENT: UI Layer - Event Handler
   * PURPOSE: Handles button click to launch module
   * FLOW: Adds module, updates state, and saves changes
   */
  const handleLaunch = async () => {
    setIsLaunching(true);
    try {
      // Create fully qualified module key with canonical type
      const fullKey = `${getCanonicalKey(moduleType)}-${staticIdentifier}`;

      // Synchronize layout and modules using context state
      const { layouts: syncedLayout, modules: syncedModules } =
        synchronizeLayoutAndModules(gridLayout, activeModules);

      // Check if module instance already exists
      if (syncedModules.some(id => id.startsWith(fullKey))) {
        console.warn(`Instance of ${fullKey} already active. Skipping launch.`);
        setIsLaunching(false);
        return;
      }

      // Create new module instance
      const {
        paneId,
        moduleType: extractedType,
        staticIdentifier: extractedId,
        instanceId,
        activeModules: nextModules,
        gridLayout: nextLayout
      } = await addModule(fullKey, syncedModules, syncedLayout);

      console.log(`Launching ${extractedType}-${extractedId}-${instanceId}`);

      // Preload component if possible
      try {
        const { loadComponent } = await import('../Loader/Component/component-loader');
        await loadComponent(extractedType, extractedId, paneId);
      } catch (loadError) {
        console.warn(`Preloading component failed, Grid will retry: ${loadError.message}`);
      }

      // Update context state directly
      setActiveModules(nextModules);
      setGridLayout(nextLayout);

      // Save state asynchronously
      saveModuleState(nextLayout, nextModules);

      // Emit socket event for other components
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

  /**
   * MODULE-FLOW-8.3.3: Button Rendering
   * COMPONENT: UI Layer - UI Element
   * PURPOSE: Renders the launch button with proper state
   * FLOW: Shows button with loading state
   */
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