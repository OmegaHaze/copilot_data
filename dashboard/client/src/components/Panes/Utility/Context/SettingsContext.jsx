/**
 * MODULE-FLOW-7.1: Settings Context - Global State Management
 * COMPONENT: Context Layer - State Management
 * PURPOSE: Provides global state for grid layout and active modules
 * FLOW: Used by module operations and UI components
 * MERMAID-FLOW: flowchart TD; MOD7.1[Settings Context] -->|Stores| MOD7.1.1[Grid Layout];
 *               MOD7.1 -->|Stores| MOD7.1.2[Active Modules];
 *               MOD7.1 -->|Used by| MOD8.1[Pane Matrix]
 */

import { createContext, useState, useEffect } from 'react';
import { loadCompleteSessionState } from '../Loader/Session/session-index';
// Import from canonical source
import { MODULE_TYPES } from '../Loader/Component/component-constants';

/**
 * MODULE-FLOW-7.1.1: Settings Context Definition
 * COMPONENT: Context Layer - Context Object
 * PURPOSE: Creates React context for settings
 * FLOW: Used by components to access settings state
 */
export const SettingsContext = createContext();

/**
 * MODULE-FLOW-7.1.2: Settings Provider Component
 * COMPONENT: Context Layer - Context Provider
 * PURPOSE: Provides settings context to component tree
 * FLOW: Manages state and loads session data
 * @param {Object} props - Component props
 * @param {ReactNode} props.children - Child components
 * @returns {JSX.Element} - Context provider component
 */
export const SettingsProvider = ({ children }) => {
  // State for grid layout and active modules
  const [gridLayout, setGridLayout] = useState(null);
  const [activeModules, setActiveModules] = useState([]);

  /**
   * MODULE-FLOW-7.1.3: Session Loading
   * COMPONENT: Context Layer - State Initialization
   * PURPOSE: Loads session state on component mount
   * FLOW: Initializes state from localStorage or backend
   */
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

  /**
   * MODULE-FLOW-7.1.4: Grid Layout Update
   * COMPONENT: Context Layer - State Update
   * PURPOSE: Updates grid layout with change detection
   * FLOW: Called when layout changes
   * @param {Object} newLayout - New grid layout
   */
  const updateGridLayout = (newLayout) => {
    if (JSON.stringify(gridLayout) !== JSON.stringify(newLayout)) {
      setGridLayout(newLayout);
      console.log('[SettingsContext] Grid layout updated:', newLayout);
    }
  };

  /**
   * MODULE-FLOW-7.1.5: Module ID Validation
   * COMPONENT: Context Layer - Data Validation
   * PURPOSE: Validates module ID format
   * FLOW: Used to ensure module IDs are valid
   * @param {string} moduleId - Module ID to validate
   * @returns {boolean} - Whether ID is valid
   */
  const validateModuleIdFormat = (moduleId) => {
    const parts = moduleId.split('-');
    return parts.length === 3 && Object.values(MODULE_TYPES).includes(parts[0]);
  };

  /**
   * MODULE-FLOW-7.1.6: Active Modules Update
   * COMPONENT: Context Layer - State Update
   * PURPOSE: Updates active modules with validation
   * FLOW: Called when modules are added or removed
   * @param {Array} newModules - New active modules
   */
  const updateActiveModules = (newModules) => {
    const validModules = newModules.filter(validateModuleIdFormat);
    if (JSON.stringify(activeModules) !== JSON.stringify(validModules)) {
      setActiveModules(validModules);
      console.log('[SettingsContext] Active modules updated:', validModules);
    }
  };

  /**
   * MODULE-FLOW-7.1.7: Context Value
   * COMPONENT: Context Layer - Provider Value
   * PURPOSE: Provides state and update functions to consumers
   * FLOW: Used by components via useContext
   */
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