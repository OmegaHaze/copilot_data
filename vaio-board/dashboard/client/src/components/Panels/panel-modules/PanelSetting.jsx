import { useContext } from 'react'
import { SettingsContext } from '../../SettingsMenu/SettingsContext'
// Diagnostic components removed - now only available in Debug Overlay

export default function PanelSetting({ 
  settingsOpen, 
  setSettingsOpen, 
  activeExplanation, 
  setActiveExplanation,
  onReset 
}) {
  const { open } = useContext(SettingsContext)

  const handleOpenSettings = () => {
    open('general')
  }

  const handleClearSession = async () => {
    if (!confirm('This will clear your session data including layouts and active modules. Are you sure?')) {
      return
    }
    
    try {
      // Remove grid layout
      await fetch('/api/user/session/grid', { method: 'DELETE' })
      
      alert('Session cleared successfully. The page will now reload.')
      window.location.reload()
    } catch (err) {
      console.error('[Frontend] Session Clear Failed:', err)
      alert('Error: ' + err.message)
    }
  }
  
  const handleDeleteDb = async () => {
    if (!confirm('WARNING: This will delete all database data including your layouts and sessions. The database will be reseeded with default values. Are you sure?')) {
      return
    }
    
    try {
      // Remove grid layout
      await fetch('/api/user/session/grid', { method: 'DELETE' })
      
      // Delete all database entries
      const res = await fetch('/api/module/reset-db', {
        method: 'POST'
      })
      
      const json = await res.json()
      if (json.success) {
        alert('Database cleared successfully. The page will now reload.')
        window.location.reload()
      } else {
        console.error('[Frontend] DB Reset Failed:', json.error)
        alert('Failed to clear database: ' + json.error)
      }
    } catch (err) {
      console.error('[Frontend] DB Reset Request Failed:', err)
      alert('Error: ' + err.message)
    }
  }
  
  const handleExplanationClick = (explanationName) => {
    if (activeExplanation === explanationName) {
      setActiveExplanation(null)
    } else {
      setActiveExplanation(explanationName)
    }
  }

  const renderExplanation = (name) => {
    switch(name) {
      case 'settings':
        return (
          <div className="bg-black/70 backdrop-blur-sm p-3">
            <div className="crt-text4 text-xs">
              <p>System Settings allows you to configure:</p>
              <p className="mt-2">• Theme preferences</p>
              <p className="mt-1">• Interface options</p>
              <p className="mt-1">• System behavior</p>
            </div>
          </div>
        )
      case 'clear-session':
        return (
          <div className="bg-black/70 backdrop-blur-sm p-3">
            <div className="crt-text4 text-xs">
              <p>Clear Session will:</p>
              <p className="mt-2">• Reset all layout positioning</p>
              <p className="mt-1">• Clear grid layouts for all panes</p>
              <p className="mt-1">• Trigger regeneration of default layouts</p>
              <p className="mt-1">• Keep module definitions intact</p>
            </div>
          </div>
        )
      case 'reset-dash':
        return (
          <div className="bg-black/70 backdrop-blur-sm p-3">
            <div className="crt-text4 text-xs">
              <p>Delete DB will:</p>
              <p className="mt-2">• Delete all database entries</p>
              <p className="mt-1">• Reset layouts and session data</p>
              <p className="mt-1">• Trigger automatic reseeding of system modules</p>
              <p className="mt-1 text-red-400">• WARNING: This action cannot be undone!</p>
            </div>
          </div>
        )
      case 'reset-layout':
        return (
          <div className="bg-black/70 backdrop-blur-sm p-3">
            <div className="crt-text4 text-xs">
              <p>Reset Layout will restore:</p>
              <p className="mt-2">• Default panel positions</p>
              <p className="mt-1">• Default window sizes</p>
              <p className="mt-1">• Default pane arrangements</p>
            </div>
          </div>
        )
      case 'debug-tools':
        return (
          <div className="bg-black/70 backdrop-blur-sm p-3">
            <div className="crt-text4 text-xs">
              <p>Debug Tools provide:</p>
              <p className="mt-2">• Module reload capabilities</p>
              <p className="mt-1">• Supervisor registration utility</p>
              <p className="mt-1">• Layout debugging tools</p>
              <p className="mt-1">• Diagnostic functions for troubleshooting</p>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="fixed md:absolute bottom-0 left-0 right-0 shadow-lg crt-text4 z-50 bg-black/50 backdrop-blur-sm">
      <button 
        onClick={() => setSettingsOpen(!settingsOpen)}
        className="w-full px-2 py-1 crt-link5 flex items-center"
      >
        <span className="w-6 crt-text4 ">{settingsOpen ? '▽' : '△'}</span>
        <span className="flex-grow text-right text-lg ">SETTINGS</span>
      </button>
      
      {settingsOpen && (
        <div>
          <div>
            <div className="flex items-center">
              <button 
                onClick={() => handleExplanationClick('settings')}
                className=" w-6 px-2 py-1 crt-link5"
              >
                <span>{activeExplanation === 'settings' ? '▽' : '◁'}</span>
              </button>
              <button 
                onClick={handleOpenSettings}
                className="flex-grow px-2 py-1 text-right crt-link5 text-lg"
              >
                [⚙] SYS SETTINGS
              </button>
            </div>
            {activeExplanation === 'settings' && renderExplanation('settings')}
          </div>

          <div>
            <div className="flex items-center">
              <button 
                onClick={() => handleExplanationClick('clear-session')}
                className="w-6 px-2 py-1 crt-link5"
              >
                <span>{activeExplanation === 'clear-session' ? '▽' : '◁'}</span>
              </button>
              <button 
                onClick={handleClearSession}
                className="flex-grow px-2 py-1 text-right crt-link5 text-lg text-orange-400"
              >
                [⟳] CLEAR SESSION
              </button>
            </div>
            {activeExplanation === 'clear-session' && renderExplanation('clear-session')}
          </div>

          <div>
            <div className="flex items-center">
              <button 
                onClick={() => handleExplanationClick('reset-dash')}
                className="w-6 px-2 py-1 crt-link5"
              >
                <span>{activeExplanation === 'reset-dash' ? '▽' : '◁'}</span>
              </button>
              <button 
                onClick={handleDeleteDb}
                className="flex-grow px-2 py-1 text-right crt-link5 text-lg text-red-500"
              >
                [☢] DELETE DB
              </button>
            </div>
            {activeExplanation === 'reset-dash' && renderExplanation('reset-dash')}
          </div>

          <div>
            <div className="flex items-center">
              <button 
                onClick={() => handleExplanationClick('reset-layout')}
                className="w-6 px-2 py-1 crt-link5"
              >
                <span>{activeExplanation === 'reset-layout' ? '▽' : '◁'}</span>
              </button>
              <button 
                onClick={onReset}
                className="flex-grow px-2 py-1 text-right crt-link5 text-lg"
              >
                [⊞] RESET LAYOUT
              </button>
            </div>
            {activeExplanation === 'reset-layout' && renderExplanation('reset-layout')}
          </div>

          <div>
            <div className="flex items-center">
              <button 
                onClick={() => handleExplanationClick('debug-tools')}
                className="w-6 px-2 py-1 crt-link5"
              >
                <span>{activeExplanation === 'debug-tools' ? '▽' : '◁'}</span>
              </button>
              <button 
                className="flex-grow px-2 py-1 text-right crt-link5 text-lg text-blue-400"
                onClick={() => handleExplanationClick('debug-tools')}
              >
                [🛠] DEBUG TOOLS
              </button>
            </div>
            {activeExplanation === 'debug-tools' && (
              <div className="bg-black/70 backdrop-blur-sm p-3">
                <div className="crt-text4 text-xs space-y-3">
                  <div>
                    <h3 className="font-bold mb-1">Module Operations</h3>
                    {/* Diagnostic components moved to Debug Overlay */}
                    <div className="mt-2">
                      <button 
                        className="bg-blue-900/30 text-blue-300 px-3 py-1 rounded text-xs"
                        onClick={() => window.toggleDebugOverlay && window.toggleDebugOverlay()}
                      >
                        Open Debug Overlay
                      </button>
                      <p className="text-gray-400 text-xs mt-1">
                        Module diagnostics are now available in the Debug Overlay
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}