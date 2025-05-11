import { createContext, useState, useEffect } from 'react'
import { loadSettingsFromSession } from '../Loader/SettingsLoader'
import { debugGridLayout } from '../Loader/LayoutDebugger'

export const SettingsContext = createContext()

export function SettingsProvider({ children }) {
  const [visible, setVisible] = useState(false)
  const [pane, setPane] = useState(null)

  // gridLayout - stores the grid layouts for all breakpoints (plural, despite the variable name)
  // IMPORTANT: Always initialize with empty arrays for each breakpoint to avoid .find errors
  const [gridLayout, setGridLayout] = useState({
    lg: [], md: [], sm: [], xs: [], xxs: []
  })
  const [activeModules, setActiveModules] = useState([])
  const [initialized, setInitialized] = useState(false)

  // Load settings from session when component mounts
  useEffect(() => {
    if (!initialized) {
      console.log('SettingsContext: Loading settings from session');
      
      loadSettingsFromSession(setGridLayout, setActiveModules)
        .then((result) => {
          console.log('SettingsContext: Settings loaded successfully', {
            activeModules: result?.activeModules?.length || 0,
            hasLayout: result?.gridLayout ? true : false
          });
          
          // Set default modules if no active modules were found
          if (!result?.activeModules || result.activeModules.length === 0) {
            console.log('SettingsContext: No active modules found, setting defaults');
            // Add default system modules - common module types
            setActiveModules(['status', 'system', 'monitoring']);
          }
          
          setInitialized(true);
        })
        .catch(err => {
          console.error('SettingsContext: Failed to initialize settings:', err);
          
          // Set fallback modules on error
          setActiveModules(['status', 'system']);
          setInitialized(true);
        });
    }
  }, [initialized])

  const open = (paneName) => {
    setPane(paneName)
    setVisible(true)
  }

  const close = () => {
    setVisible(false)
    setPane(null)
  }

  return (
    <SettingsContext.Provider value={{
      visible,
      pane,
      open,
      close,
      gridLayout,
      setGridLayout,
      activeModules,
      setActiveModules
    }}>
      {children}
    </SettingsContext.Provider>
  )
}
