///workspace/dashboard/client/src/components/Panes/Utility/PaneHeaderRestart.jsx
import { useState } from 'react'
import DeleteConfirmationDialog from '../../Error-Handling/DeleteConfirmationDialog'
// Keeping ErrorEffects import in case it's used elsewhere
import ErrorEffects from '../../Error-Handling/ErrorEffects'

/**
 * PaneHeaderRestart - Adds a restart button to pane headers
 * 
 * This component allows users to restart the service associated with
 * the current pane directly from the pane header.
 * 
 * TODO: Wire this up with the user settings menu to allow customization
 * of which panes show the restart button and other options.
 */
export default function PaneHeaderRestart({ paneName }) {
  const [restarting, setRestarting] = useState(false)
  const [status, setStatus] = useState(null) // 'success', 'error', or null
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, paneName: '' })
  // Keeping the state but commenting out its usage
  // const [showExplosion, setShowExplosion] = useState(false)
  
  // Maps pane names to supervisor service names
  const SUPERVISOR_SERVICE_MAP = {
    // System services
    'supervisor': 'supervisor',
    'nvidia': 'nvidia',
    
    // AI services
    'comfyui': 'comfyui',
    'openwebui': 'openwebui',
    'openwebui_backend': 'openwebui_backend',
    'ollama': 'ollama',
    
    // Database services
    'qdrant': 'qdrant',
    'qdrant_dashboard': 'qdrant_dashboard',
    'postgres': 'postgres',
    'postgresql': 'postgres',
    
    // Automation
    'n8n': 'n8n'
  }
  
  if (!paneName || typeof paneName !== 'string') return null
  
  const serviceName = SUPERVISOR_SERVICE_MAP[paneName.toLowerCase()] || null
  
  // If we can't map the pane to a service, don't render anything
  if (!serviceName) return null

  // Open the restart confirmation dialog
  const openRestartDialog = (e) => {
    // Stop propagation to prevent drag
    e.stopPropagation()
    setConfirmDialog({ isOpen: true, paneName })
  }

  // Close the restart confirmation dialog
  const closeRestartDialog = () => {
    setConfirmDialog({ isOpen: false, paneName: '' })
  }

  // Handle actual restart after confirmation
  const handleRestart = async () => {
    setRestarting(true)
    setStatus(null)
    
    // First close the confirmation dialog
    closeRestartDialog()
    // Comment out explosion effect
    // setShowExplosion(true)
    
    try {
      const res = await fetch('/run-command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cmd: `supervisorctl -c /etc/supervisor/supervisord.conf restart ${serviceName}`
        })
      })
      
      if (!res.ok) {
        throw new Error(`Server responded with status: ${res.status}`)
      }
      
      const text = await res.text()
      console.log(`[Restart] Service ${serviceName} restart output:`, text)
      
      setStatus('success')
      
      // Comment out hiding explosion effect
      // setTimeout(() => {
      //   setShowExplosion(false)
      // }, 2500)
      
      // Reset status after a delay
      setTimeout(() => setStatus(null), 3000)
    } catch (err) {
      console.error(`[Restart] Error restarting ${serviceName}:`, err)
      setStatus('error')
      
      // Comment out hiding explosion effect
      // setTimeout(() => {
      //   setShowExplosion(false)
      //   setStatus(null)
      // }, 2500)
      
      // Keep the status reset
      setTimeout(() => {
        setStatus(null)
      }, 2500)
    } finally {
      setTimeout(() => {
        setRestarting(false)
      }, 2500)
    }
  }
  
  return (
    <>
      {/* Restart button */}
      <button
        onClick={openRestartDialog}
        onMouseDown={(e) => e.stopPropagation()} // Stop drag propagation
        disabled={restarting}
        title={`Restart ${serviceName}`}
        className={`inline-flex items-center justify-center p-1.5 mx-1 rounded z-1000
          ${restarting ? 'text-yellow-400' : 'text-green-400 hover:text-green-200'} 
          ${status === 'success' ? 'text-green-300' : ''}
          ${status === 'error' ? 'text-red-400' : ''}
          cursor-pointer
          transition-colors duration-200`}
      >
        <svg 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          className={`w-5 h-5
            ${restarting ? 'animate-spin' : ''}`}
        >
          {/* Refresh/restart icon - cleaner circular arrow */}
          <path d="M21 2v6h-6"></path>
          <path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
          <path d="M3 22v-6h6"></path>
          <path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path>
        </svg>
      </button>

      {/* Confirmation dialog */}
      <DeleteConfirmationDialog
        isOpen={confirmDialog.isOpen}
        paneName={paneName}
        onClose={closeRestartDialog}
        onConfirm={handleRestart}
        customLabels={{
          title: `RESTART ${paneName}?`,
          cancel: '[CANCEL]',
          confirm: '[CONFIRM]',
          processing: '[RESTARTING...]'
        }}
        isRestarting={true}
      />

      {/* ASCII Explosion Effect Overlay - COMMENTED OUT
      {showExplosion && (
        <div className="fixed inset-0 z-[1001] flex flex-col items-center justify-center">
          <ErrorEffects isActive={true} />
          
          <div className="absolute inset-0 flex items-center justify-center z-40">
            <pre className="text-center text-green-400 text-base tracking-widest">
              {[
                "  ██╗   ██╗  █████╗  ██╗  ██████╗   ",
                " ██║   ██║ ██╔══██╗ ██║ ██╔═══██╗ ",
                " ██║   ██║ ███████║ ██║ ██║   ██║ ",
                " ╚██╗ ██╔╝ ██╔══██║ ██║ ██║   ██║ ",
                "   ╚████╔╝  ██║  ██║ ██║ ╚██████╔╝  ",
                "    ╚═══╝   ╚═╝  ╚═╝ ╚═╝  ╚═════╝   ",
              ].map((line, i) => (
                <div key={i}>
                  {line.split('').map((char, j) => (
                    <span
                      key={j}
                      className="explode-char"
                      style={{
                        transform: `translate(${Math.random() * 600 - 300}px, ${Math.random() * 600 - 300}px) rotate(${Math.random() * 1024 - 720}deg) scale(${1 + Math.random() * 1.5})`,
                        opacity: 0,
                        display: 'inline-block',
                        transition: 'all s ease-out',
                      }}
                    >
                      {char}
                    </span>
                  ))}
                </div>
              ))}
            </pre>
          </div>
        </div>
      )}
      */}
    </>
  )
}