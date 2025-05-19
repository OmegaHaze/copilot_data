import { useState, useEffect } from 'react';

/**
 * Hook for managing pane state with automatic persistence to backend
 * @param {string} paneId - The unique ID of the pane
 * @param {Object} defaultState - Default state to use if none is found
 * @returns {[Object, Function]} State object and update function
 */
export function usePaneState(paneId, defaultState = {}) {
  const [state, setState] = useState(defaultState);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Load state on mount
  useEffect(() => {
    async function loadPaneState() {
      try {
        // Dynamically import to avoid circular dependencies
        const { API_ENDPOINTS } = await import('../Loader/Session/session-constants');
        
        const response = await fetch(`${API_ENDPOINTS.SESSION_DATA}/pane/${paneId}`);
        if (response.ok) {
          const data = await response.json();
          if (data && data.state) {
            setState(prevState => ({
              ...prevState,
              ...data.state
            }));
          }
        }
        setIsLoaded(true);
      } catch (err) {
        console.error(`[usePaneState] Failed to load state for pane ${paneId}:`, err);
        setIsLoaded(true);
      }
    }
    
    if (paneId) {
      loadPaneState();
    }
  }, [paneId]);
  
  // Save state when it changes
  useEffect(() => {
    // Don't save until initial load is complete
    if (!isLoaded || !paneId) return;
    
    const saveTimeout = setTimeout(async () => {
      try {
        // Dynamically import to avoid circular dependencies
        const { savePaneState } = await import('../Loader/Session/session-manager');
        await savePaneState(paneId, state);
      } catch (err) {
        console.error(`[usePaneState] Failed to save state for pane ${paneId}:`, err);
      }
    }, 500); // Debounce saves to reduce API calls
    
    return () => clearTimeout(saveTimeout);
  }, [state, isLoaded, paneId]);
  
  return [state, setState];
}

export default usePaneState;
