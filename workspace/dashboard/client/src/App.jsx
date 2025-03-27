import { useState } from 'react'
import ServiceMatrix from './components/ServiceMatrix.jsx'
import BootFlicker from './components/BootFlicker.jsx'
import { SettingsProvider } from './components/SettingsContext'
import PaneHeaderSettings from './components/PaneHeaderSettings'

console.log("App.jsx loaded")

export default function App() {
  const [ready, setReady] = useState(false)

  return (
    <SettingsProvider>
      {ready ? (
        <>
          <ServiceMatrix />
          <PaneHeaderSettings /> {/* 🔧 Settings modal */}
        </>
      ) : (
        <BootFlicker onComplete={() => setReady(true)} />
      )}
    </SettingsProvider>
  )
}
