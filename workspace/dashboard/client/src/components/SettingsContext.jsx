import { createContext, useState } from 'react'

export const SettingsContext = createContext()

export function SettingsProvider({ children }) {
  const [visible, setVisible] = useState(false)
  const [pane, setPane] = useState(null)

  const open = (paneName) => {
    setPane(paneName)
    setVisible(true)
  }

  const close = () => {
    setVisible(false)
    setPane(null)
  }

  return (
    <SettingsContext.Provider value={{ visible, pane, open, close }}>
      {children}
    </SettingsContext.Provider>
  )
}
