import { createContext, useState, useEffect } from 'react'
import { loadSettingsFromSession } from '../Loader/SettingsLoader'

export const SettingsContext = createContext()

export function SettingsProvider({ children }) {
  const [visible, setVisible] = useState(false)
  const [pane, setPane] = useState(null)

  // gridLayout - stores the grid layouts for all breakpoints (plural, despite the variable name)
  const [gridLayout, setGridLayout] = useState({})
  const [activeModules, setActiveModules] = useState([])
  const [initialized, setInitialized] = useState(false)

  // Load settings from session when component mounts
  useEffect(() => {
    if (!initialized) {
      loadSettingsFromSession(setGridLayout, setActiveModules)
        .then(() => setInitialized(true))
        .catch(err => console.error('Failed to initialize settings:', err))
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
