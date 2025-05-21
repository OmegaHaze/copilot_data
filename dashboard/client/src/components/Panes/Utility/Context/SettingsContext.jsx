// SettingsContext.jsx
import { createContext, useState, useEffect } from 'react';
import { loadCompleteSessionState } from '../Loader/Session/session-index';
import { MODULE_TYPES } from '../Loader/Component/component-constants';

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

  const updateGridLayout = (newLayout) => {
    if (JSON.stringify(gridLayout) !== JSON.stringify(newLayout)) {
      setGridLayout(newLayout);
      console.log('[SettingsContext] Grid layout updated:', newLayout);
    }
  };

  const validateModuleIdFormat = (moduleId) => {
    const parts = moduleId.split('-');
    return parts.length === 3 && Object.values(MODULE_TYPES).includes(parts[0]);
  };

  const updateActiveModules = (newModules) => {
    const validModules = newModules.filter(validateModuleIdFormat);
    if (JSON.stringify(activeModules) !== JSON.stringify(validModules)) {
      setActiveModules(validModules);
      console.log('[SettingsContext] Active modules updated:', validModules);
    }
  };

  return (
    <SettingsContext.Provider
      value={{
        gridLayout,
        setGridLayout: updateGridLayout,
        activeModules,
        setActiveModules: updateActiveModules
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};
