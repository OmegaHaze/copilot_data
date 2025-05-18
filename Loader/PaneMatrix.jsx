// PaneMatrix.jsx
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
  const { connected } = useSocket();
  const { activeModules, setActiveModules, gridLayout, setGridLayout } = useContext(SettingsContext);
  const { showError } = useError();

  const [sessionReady, setSessionReady] = useState(false);

  const handleError = useCallback((err, context = 'Matrix Init') => {
    console.error(`[${context}]`, err);
    showError(err.message, ErrorType.SYSTEM, ErrorSeverity.HIGH);
  }, [showError]);

  // Load registry and sync session on mount
  useEffect(() => {
    async function bootstrap() {
      try {
        // Initialize component registry
        const result = await initComponentSystem();
        if (!result.success) throw new Error(result.errorMessage || 'Component registry failed');
        
        // Try to load from backend first, if fails, use localStorage and push to backend
        await fetchAndSyncSessionData(
          setGridLayout, 
          setActiveModules,
          (err) => handleError(err, 'Session Data Load'),
          'initial-load'
        );

        // Mark session as ready for rendering
        setSessionReady(true);
        
        // Schedule periodic sync to ensure backend remains updated
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

  if (!connected || !sessionReady) return null;

  return (
    <PaneGrid
      layouts={gridLayout}
      activeModules={activeModules}
      onLayoutChange={setGridLayout}
    />
  );
}
