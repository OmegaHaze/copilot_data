// components/PaneHeader.jsx
import { useContext } from 'react'
import { SettingsContext } from './Context/SettingsContext'
import DeleteConfirmationDialog from '../../Error-Handling/DeleteConfirmationDialog'
import ClearGpuLogButton from '../../Panels/panel-modules/GpuGraph/ClearGpuLogButton'
import PaneHeaderStatus from './PaneHeaderStatus'
import PaneHeaderRestart from './PaneHeaderRestart'
import { useSocket } from './Context/SocketContext'
import { saveLayoutsToSession } from './Loader/LayoutManager'

export default function PaneHeader({ name, status: propStatus, logo, moduleType, _gridId, staticIdentifier }) {
  const { services } = useSocket()
  const { open, activeModules, setActiveModules, gridLayout, setGridLayout } = useContext(SettingsContext)

  // Find current status from socket, fallback to prop
  const serviceStatus = services.find(s => s.name === name)?.status || propStatus

  return (
    <div className="flex items-center justify-between px-2 py-1 text-xs font-bold bg-green-400/10 move-cursor pane-drag-handle">
      <div className="flex items-center space-x-1 pointer-events-none">
        {logo && <img src={logo} alt={name || 'Component'} className="h-7 w-7" />}
        <span className="crt-text2 tracking-wide">{(name && typeof name === 'string') ? name.toUpperCase() : 'UNNAMED COMPONENT'}</span>
        {staticIdentifier && (
          <span className="text-green-400/60 text-xs ml-2">
            [{staticIdentifier}]
          </span>
        )}
      </div>
      <div className="flex items-center ml-auto pointer-events-auto">
        {/* Status indicator */}
        <PaneHeaderStatus status={serviceStatus} name={name} />

        {/* Restart Button */}
        {/* Restart or Clear Button */}
           {(name?.toLowerCase() === 'nvidia')
           ? <ClearGpuLogButton />
           : <PaneHeaderRestart paneName={name} />}




        {/* Remove button */}
        <button
          onMouseDown={(e) => e.stopPropagation()}
          onClick={async (e) => {
            e.stopPropagation()
            
            // Only proceed if we have an actual grid ID
            if (!_gridId) {
              console.warn("Cannot remove pane: No grid ID provided")
              return
            }
            
            console.log(`Removing pane with ID: ${_gridId}`)
            
            try {
              // 1. Remove from active modules
              const updatedModules = Array.isArray(activeModules) 
                ? activeModules.filter(id => id !== _gridId)
                : []
              
              // 2. Update active modules in session
              await fetch("/api/user/session/modules", {
                method: "PUT", 
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(updatedModules)
              })
              
              // 3. Remove from layouts
              const updatedLayouts = { ...gridLayout }
              Object.keys(updatedLayouts).forEach(bp => {
                if (Array.isArray(updatedLayouts[bp])) {
                  updatedLayouts[bp] = updatedLayouts[bp].filter(item => item.i !== _gridId)
                }
              })
              
              // 4. Save layouts
              await saveLayoutsToSession(updatedLayouts)
              
              // 5. Update local state
              setGridLayout(updatedLayouts)
              setActiveModules(updatedModules)
              
              console.log(`✅ Removed pane: ${_gridId}`)
            } catch (err) {
              console.error(`Failed to remove pane: ${_gridId}`, err)
            }
          }}
          className="text-red-400 hover:text-red-500 mr-2 cursor-pointer"
          title="Remove pane"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        
        {/* Settings button (for system and service panes only) */}
        {moduleType !== 'USER' && (
          <button
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation()
              open(name.toLowerCase())
            }}
            className="crt-link5 cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}
