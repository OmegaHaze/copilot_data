// MODULE-FLOW-8.1: Pane Matrix - Top Level Dashboard Container
// COMPONENT: UI Layer - Module Grid Initialization
// PURPOSE: Initializes the component system and renders dashboard layout
// FLOW: Entry point for frontend module system initialization
// MERMAID-FLOW: flowchart TD; MOD8.1[Pane Matrix] -->|Initializes| MOD6.1[Component System];
//               MOD8.1 -->|Syncs| MOD7.1[Session Data];
//               MOD8.1 -->|Renders| MOD8.2[Pane Grid]

import { useEffect, useState, useContext, useCallback } from 'react';
import { useSocket } from '../Context/SocketContext.jsx';
import { SettingsContext } from '../Context/SettingsContext.jsx';
import { useError } from '../../../Error-Handling/Diagnostics/ErrorNotificationSystem.jsx';
import { ErrorType, ErrorSeverity } from '../../../Error-Handling/Diagnostics/types/errorTypes';

import PaneGrid from './PaneGrid.jsx';
import { initComponentSystem } from '../Loader/Component/component-index.js';
import { fetchAndSyncSessionData } from '../Loader/Session/session-manager.js';

/**
 * PaneMatrix
 * Top-level layout container for the VAIO dashboard grid
 */
export default function PaneMatrix() {
  // MODULE-FLOW-8.1.1: Socket Connection State
  // COMPONENT: UI Layer - Connection Management
  // PURPOSE: Manages WebSocket connection state for real-time updates
  // FLOW: Determines if dashboard should render based on connection status
  const { connected } = useSocket();
  
  // MODULE-FLOW-8.1.2: Grid State Management
  // COMPONENT: UI Layer - Layout State
  // PURPOSE: Manages the grid layout and active modules state
  // FLOW: Provides state for grid rendering and module operations
  const { activeModules, setActiveModules, gridLayout, setGridLayout } = useContext(SettingsContext);
  
  const { showError } = useError();
  const [sessionReady, setSessionReady] = useState(false);

  // MODULE-FLOW-8.1.3: Error Handling
  // COMPONENT: UI Layer - Error Management
  // PURPOSE: Provides centralized error handling for initialization failures
  // FLOW: Captures and displays errors during system bootstrap
  const handleError = useCallback((err, context = 'Matrix Init') => {
    console.error(`[${context}]`, err);
    showError(err.message, ErrorType.SYSTEM, ErrorSeverity.HIGH);
  }, [showError]);

  // MODULE-FLOW-8.1.4: Component System Initialization
  // COMPONENT: UI Layer - Module System Bootstrap
  // PURPOSE: Initializes the component registry and loads session data
  // FLOW: Entry point for the entire frontend module system
  // MERMAID-FLOW: flowchart TD; MOD8.1.4[Init Components] -->|Loads| MOD6.1.1[Component Registry];
  //               MOD8.1.4 -->|Fetches| MOD7.1.1[Session Data];
  //               MOD8.1.4 -->|Syncs| MOD7.1.2[Backend State]
  useEffect(() => {
    async function bootstrap() {
      try {
        // MODULE-FLOW-8.1.4.1: Component Registry Initialization
        // COMPONENT: UI Layer - Registry Setup
        // PURPOSE: Initializes the component registry with all available components
        // FLOW: Loads component definitions and prepares for dynamic loading
        const result = await initComponentSystem();
        if (!result.success) throw new Error(result.errorMessage || 'Component registry failed');
        
        // MODULE-FLOW-8.1.4.2: Session Data Synchronization
        // COMPONENT: UI Layer - State Restoration
        // PURPOSE: Loads and synchronizes session state from backend or localStorage
        // FLOW: Retrieves grid layout and active modules for rendering
        await fetchAndSyncSessionData(
          setGridLayout, 
          setActiveModules,
          (err) => handleError(err, 'Session Data Load'),
          'initial-load'
        );

        // Mark session as ready for rendering
        setSessionReady(true);
        
        // MODULE-FLOW-8.1.4.3: Background Synchronization
        // COMPONENT: UI Layer - State Persistence
        // PURPOSE: Ensures backend remains updated with client state
        // FLOW: Periodically syncs localStorage to backend
        const syncInterval = setInterval(async () => {
          try {
            const { syncLocalStorageToBackend } = await import('../Loader/Session/session-manager');
            await syncLocalStorageToBackend();
          } catch (err) {
            console.warn('Background sync failed:', err);
          }
        }, 60000); // Sync every minute
        
        return () => clearInterval(syncInterval);
      } catch (err) {
        handleError(err);
      }
    }

    bootstrap();
  }, [setActiveModules, setGridLayout, handleError]);

  // MODULE-FLOW-8.1.5: Conditional Rendering
  // COMPONENT: UI Layer - Render Control
  // PURPOSE: Only renders when system is fully initialized
  // FLOW: Prevents partial or inconsistent UI state during initialization
  if (!connected || !sessionReady) return null;

  // MODULE-FLOW-8.1.6: Grid Rendering
  // COMPONENT: UI Layer - Dashboard Display
  // PURPOSE: Renders the responsive grid with all active modules
  // FLOW: Final output of the module system to the user interface
  return (
    <PaneGrid
      layouts={gridLayout}
      activeModules={activeModules}
      onLayoutChange={setGridLayout}
    />
  );
}