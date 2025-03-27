import { useContext, useState } from 'react'
import { SettingsContext } from './SettingsContext'

const PAGES = {
  GENERAL: '',
  SUPERVISOR: 'This is the Supervisor settings panel. Add buttons or tools here.',
  OPENWEBUI: 'OpenWebUI config goes here.',
  OLLAMA: 'Ollama service settings go here.',
  COMFYUI: 'ComfyUI settings interface.',
  QDRANT: 'Qdrant tuning and tools.',
  QDRANT_DASHBOARD: 'Qdrant Dashboard UI settings.',
  N8N: 'n8n automation options.',
  POSTGRES: 'Postgres tuning or backup features.',
}

const BUTTONS = Object.keys(PAGES)

export default function PaneHeaderSettings() {
  const { visible, pane, close } = useContext(SettingsContext)
  const [activeTab, setActiveTab] = useState('GENERAL')

  if (!visible || !pane) return null

  return (
    <div className="fixed top-1/2 left-1/2 w-[600px] h-[400px] bg-black overflow-hidden border border-green-700 shadow-xl z-[999] rounded-xl transform -translate-x-1/2 -translate-y-1/2 flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center px-4 py-2 bg-green-900 text-green-300 text-sm font-bold border-b border-green-700">
        <span>{pane.toUpperCase()} SETTINGS</span>
        <button onClick={close} className="text-green-400 hover:text-green-200">✖</button>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Menu */}
        <div className="w-40 border-r border-green-800 p-2 text-xs space-y-1">
          {BUTTONS.map(key => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`w-full text-left px-2 py-1 rounded hover:bg-green-800 ${
                activeTab === key ? 'bg-green-800 text-green-200 font-bold' : 'text-green-300'
              }`}
            >
              {key}
            </button>
          ))}
        </div>

        {/* Page Content */}
        <div className="flex-1 p-4 text-xs text-green-300 overflow-auto">
          {activeTab === 'SUPERVISOR' && (
            <div className="flex justify-between items-center">
              <span className="text-green-400 font-bold">Reread & Update Supervisor </span>
              <button
  className="text-black bg-green-400 hover:bg-green-300 text-xs font-bold px-2 py-1 rounded"
  onClick={async () => {
    try {
      const res = await fetch('http://localhost:1488/run-command', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    cmd: `supervisorctl reread && supervisorctl update &&`
  })
})


      const text = await res.text()
      console.log('[RUN Response]', text)

      if (!res.ok) {
        alert(`RUR failed: ${res.status}`)
      } else {
        alert('RUN executed successfully.')
      }
    } catch (err) {
      console.error('RUN error:', err)
      alert('Failed to execute RUN.')
    }
  }}
>
  RUN
</button>

            </div>
          )}

          {activeTab !== 'SUPERVISOR' && (
            <div>{PAGES[activeTab]}</div>
          )}
        </div>
      </div>
    </div>
  )
}
