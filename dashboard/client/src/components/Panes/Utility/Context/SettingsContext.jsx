// SettingsContext.jsx
import { createContext, useState, useEffect } from 'react';
import { loadCompleteSessionState } from '../Loader/Session/session-index';

export const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
  const [gridLayout, setGridLayout] = useState(null);
  const [activeModules, setActiveModules] = useState([]);

  useEffect(() => {
    const sessionState = loadCompleteSessionState();

    if (sessionState) {
      setGridLayout(sessionState.gridLayout);
      setActiveModules(sessionState.activeModules || []);
      console.log('[SettingsContext] Loaded session layout + modules');
    } else {
      console.warn('[SettingsContext] No session state found, starting empty');
      setGridLayout(null);  // layout system will generate fallback
    }

    // Trigger backend sync after restore
    setTimeout(async () => {
      try {
        const { syncLocalStorageToBackend } = await import('../Loader/Session/session-manager');
        await syncLocalStorageToBackend();
      } catch (err) {
        console.warn('[SettingsContext] Initial backend sync failed:', err);
      }
    }, 2000);
  }, []);

  return (
    <SettingsContext.Provider
      value={{
        gridLayout,
        setGridLayout,
        activeModules,
        setActiveModules
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};
