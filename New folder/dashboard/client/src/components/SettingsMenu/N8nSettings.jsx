import React, { useState, useEffect } from 'react'

// SVG Icons for n8n settings
const N8nIcons = {
  Workflow: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18"></path>
      <path d="m7 17 4-4 4 4 4-4"></path>
      <path d="M7 7h10"></path>
      <path d="M7 11h10"></path>
      <path d="M7 15h4"></path>
    </svg>
  ),
  Connection: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 11a9 9 0 0 1 9 9"></path>
      <path d="M4 4a16 16 0 0 1 16 16"></path>
      <circle cx="5" cy="19" r="2"></circle>
    </svg>
  ),
  Integration: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="8" height="8" rx="2"></rect>
      <rect x="14" y="2" width="8" height="8" rx="2"></rect>
      <rect x="2" y="14" width="8" height="8" rx="2"></rect>
      <rect x="14" y="14" width="8" height="8" rx="2"></rect>
    </svg>
  ),
  API: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
    </svg>
  ),
  Settings: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
      <circle cx="12" cy="12" r="3"></circle>
    </svg>
  ),
  Status: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
    </svg>
  ),
  Port: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"></path>
      <path d="M18 14h-8"></path>
      <path d="M15 18h-5"></path>
      <path d="M10 6h8v4h-8V6Z"></path>
    </svg>
  ),
  Security: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
    </svg>
  ),
  OpenWebUI: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 8v8a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5V8a5 5 0 0 1 5-5h8a5 5 0 0 1 5 5Z"></path>
      <path d="M11 21v-4a3 3 0 0 1 3-3h4"></path>
      <path d="M9 7h.01"></path>
    </svg>
  )
}

// Component for settings sections with glow effect
const SettingsSection = ({ title, children, glowIntensity = 2 }) => (
  <div
    className="border border-green-800/50 rounded bg-black/30 p-3 mb-3"
    style={{ filter: `drop-shadow(0 0 ${glowIntensity}px rgba(0, 255, 0, 0.3))` }}
  >
    <h4 className="text-green-300 font-bold mb-2 border-b border-green-800/50 pb-1 flex items-center text-[11px] uppercase tracking-wider">
      <span className="mr-1 text-green-400">▣</span>{title}
    </h4>
    <div className="space-y-2">
      {children}
    </div>
  </div>
)

// n8n Logo with glow effect
const N8nLogo = ({ glowIntensity = 2 }) => (
  <div className="h-10 w-auto flex items-center justify-center">
    <div
      className="text-2xl font-bold text-green-400"
      style={{ filter: `drop-shadow(0 0 ${glowIntensity}px rgba(0, 255, 0, 0.7))` }}
    >
      n<span className="text-green-200">8n</span>
    </div>
  </div>
)

// Property Display with icons
const N8nProperty = ({ label, value, icon }) => (
  <div className="flex mb-1 items-center">
    <div className="w-1/3 text-green-300 font-mono text-[10px] flex items-center">
      {icon && <span className="mr-1">{icon}</span>}
      {label}:
    </div>
    <div className="w-2/3 text-white font-mono text-[10px]">{value}</div>
  </div>
)

// Status indicator component
const StatusIndicator = ({ status, glowIntensity = 2 }) => {
  const getStatusColor = () => {
    switch (status.toLowerCase()) {
      case 'online':
        return {
          bgColor: 'bg-green-500',
          textColor: 'text-green-100',
          glowColor: 'rgba(0, 255, 0, 0.7)'
        }
      case 'offline':
        return {
          bgColor: 'bg-red-500',
          textColor: 'text-red-100',
          glowColor: 'rgba(255, 0, 0, 0.7)'
        }
      case 'connecting':
        return {
          bgColor: 'bg-yellow-500',
          textColor: 'text-yellow-100',
          glowColor: 'rgba(255, 255, 0, 0.7)'
        }
      default:
        return {
          bgColor: 'bg-gray-500',
          textColor: 'text-gray-100',
          glowColor: 'rgba(128, 128, 128, 0.7)'
        }
    }
  }

  const { bgColor, textColor, glowColor } = getStatusColor()

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-medium ${bgColor} ${textColor}`}
      style={{ filter: `drop-shadow(0 0 ${glowIntensity}px ${glowColor})` }}
    >
      <span className="w-1.5 h-1.5 mr-1 rounded-full bg-current"></span>
      {status}
    </span>
  )
}

// Workflow card component
const WorkflowCard = ({ name, status, lastRun, glowIntensity = 2 }) => {
  return (
    <div className="border border-green-800/30 rounded bg-black/20 p-2 mb-2">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center">
          <span className="text-green-300 mr-1"><N8nIcons.Workflow /></span>
          <span className="text-green-200 text-[10px] uppercase font-mono font-bold">{name}</span>
        </div>
        <StatusIndicator status={status} glowIntensity={glowIntensity} />
      </div>
      
      <div className="text-green-400 text-[9px] font-mono pl-4 mb-2">
        • Status: {status}<br />
        • Last run: {lastRun}<br />
        • Trigger: Schedule (every 1h)
      </div>
      
      <div className="flex justify-end space-x-1">
        <button className="bg-green-900/50 hover:bg-green-800/50 text-green-100 py-0.5 px-2 rounded text-[8px] font-medium flex items-center">
          <span className="mr-1"><N8nIcons.Settings /></span>
          EDIT
        </button>
        <button className="bg-green-900/50 hover:bg-green-800/50 text-green-100 py-0.5 px-2 rounded text-[8px] font-medium flex items-center">
          <span className="mr-1">▶</span>
          EXECUTE
        </button>
      </div>
    </div>
  )
}

export default function N8nSettings() {
  const [isCheckingForUpdates, setIsCheckingForUpdates] = useState(false)
  const [glowIntensity, setGlowIntensity] = useState(2)
  
  // Mock workflows data
  const [workflows, setWorkflows] = useState([
    { name: 'data-sync', status: 'Online', lastRun: '10 min ago' },
    { name: 'image-processing', status: 'Online', lastRun: '1 hour ago' },
    { name: 'notification-system', status: 'Offline', lastRun: '2 days ago' }
  ])
  
  // Create pulsing effect for the glow
  useEffect(() => {
    const glowInterval = setInterval(() => {
      setGlowIntensity(prev => {
        const newValue = prev + (Math.random() - 0.5) * 0.5
        return Math.max(1.5, Math.min(3, newValue))
      })
    }, 500)

    return () => clearInterval(glowInterval)
  }, [])
  
  // Mock n8n information
  const n8nInfo = {
    version: '0.214.2',
    lastUpdated: '2024-03-01',
    port: '5678',
    apiKey: '********'
  }

  const handleCheckForUpdates = () => {
    setIsCheckingForUpdates(true)
    // Simulate update check
    setTimeout(() => {
      setIsCheckingForUpdates(false)
      alert('n8n is up to date!')
    }, 2000)
  }

  return (
    <div className="h-full p-2 overflow-y-auto">
      {/* n8n logo and header */}
      <div className="flex items-center justify-between border-b border-green-800 pb-3 mb-4">
        <div>
          <h3 className="text-green-200 text-xl font-bold flex items-center tracking-wide">
            <span className="text-green-400 mr-2">▣</span>
            N8N SETTINGS
          </h3>
          <p className="text-green-400 text-xs mt-0.5">Configure n8n workflow automation settings</p>
        </div>
        <N8nLogo glowIntensity={glowIntensity} />
      </div>
      
      {/* Refresh button */}
      <div className="mb-4 flex justify-end">
        <button
          className="bg-green-800/70 hover:bg-green-700 text-white py-1.5 px-3 rounded text-xs font-medium flex items-center"
          onClick={handleCheckForUpdates}
          disabled={isCheckingForUpdates}
          style={{ filter: `drop-shadow(0 0 ${glowIntensity}px rgba(0, 255, 0, 0.3))` }}
        >
          {isCheckingForUpdates ? (
            <>
              <span className="mr-1 animate-spin">⟳</span> Checking...
            </>
          ) : (
            <>
              <span className="mr-1">⟳</span> Check for Updates
            </>
          )}
        </button>
      </div>
      
      {/* Connection Settings Section */}
      <SettingsSection title="Connection Settings" glowIntensity={glowIntensity}>
        <div className="text-white font-mono text-[10px] mb-2 border-b border-green-800/30 pb-1">
          <span className="text-green-400">STATUS:</span> Online |
          <span className="text-green-400 ml-1">PORT:</span> {n8nInfo.port}
        </div>
        
        <div className="grid grid-cols-1 gap-2">
          <div className="text-green-400 text-[10px] font-mono flex items-start">
            <span className="text-green-300 mr-1 mt-0.5"><N8nIcons.Connection /></span>
            <span>Configure n8n connection settings and access</span>
          </div>
          
          <div className="border border-green-800/30 rounded bg-black/20 p-2">
            <div className="flex items-center mb-2">
              <span className="text-green-300 mr-1"><N8nIcons.Port /></span>
              <span className="text-green-200 text-[10px] uppercase font-mono font-bold">Port Configuration</span>
            </div>
            
            <div className="flex items-center mb-2">
              <div className="w-1/3">
                <label className="text-green-300 text-[10px] font-mono">Current Port:</label>
              </div>
              <div className="w-2/3 flex items-center">
                <input
                  type="text"
                  value={n8nInfo.port}
                  className="bg-black/50 border border-green-800/50 rounded px-2 py-1 text-green-100 text-[10px] font-mono w-20"
                  readOnly
                />
                <StatusIndicator status="Online" glowIntensity={glowIntensity} className="ml-2" />
              </div>
            </div>
            
            <div className="flex items-center">
              <div className="w-1/3">
                <label className="text-green-300 text-[10px] font-mono">New Port:</label>
              </div>
              <div className="w-2/3 flex items-center">
                <input
                  type="text"
                  placeholder="Enter port"
                  className="bg-black/50 border border-green-800/50 rounded px-2 py-1 text-green-100 text-[10px] font-mono w-20"
                />
                <button className="ml-2 bg-green-900/50 hover:bg-green-800/50 text-green-100 py-0.5 px-2 rounded text-[9px] font-medium">
                  APPLY
                </button>
              </div>
            </div>
          </div>
          
          <div className="border border-green-800/30 rounded bg-black/20 p-2">
            <div className="flex items-center mb-2">
              <span className="text-green-300 mr-1"><N8nIcons.Security /></span>
              <span className="text-green-200 text-[10px] uppercase font-mono font-bold">API Access</span>
            </div>
            
            <div className="flex items-center mb-2">
              <div className="w-1/3">
                <label className="text-green-300 text-[10px] font-mono">API Key:</label>
              </div>
              <div className="w-2/3 flex items-center">
                <input
                  type="password"
                  value={n8nInfo.apiKey}
                  className="bg-black/50 border border-green-800/50 rounded px-2 py-1 text-green-100 text-[10px] font-mono w-full"
                  readOnly
                />
                <button className="ml-2 bg-green-900/50 hover:bg-green-800/50 text-green-100 py-0.5 px-2 rounded text-[9px] font-medium">
                  SHOW
                </button>
              </div>
            </div>
            
            <div className="flex justify-end">
              <button className="bg-green-900/50 hover:bg-green-800/50 text-green-100 py-0.5 px-2 rounded text-[9px] font-medium">
                REGENERATE KEY
              </button>
            </div>
          </div>
          
          <div className="text-green-300 text-[9px] font-mono mt-1 border-t border-green-800/30 pt-2">
            <span className="text-green-400">NOTE:</span> Changing ports or API keys requires a service restart to take effect.
          </div>
        </div>
      </SettingsSection>
      
      {/* Workflow Management Section */}
      <SettingsSection title="Workflow Management" glowIntensity={glowIntensity}>
        <div className="text-white font-mono text-[10px] mb-2 border-b border-green-800/30 pb-1">
          <span className="text-green-400">WORKFLOWS:</span> {workflows.length} |
          <span className="text-green-400 ml-1">ACTIVE:</span> {workflows.filter(w => w.status === 'Online').length}
        </div>
        
        <div className="grid grid-cols-1 gap-2">
          <div className="text-green-400 text-[10px] font-mono flex items-start">
            <span className="text-green-300 mr-1 mt-0.5"><N8nIcons.Workflow /></span>
            <span>Manage and monitor n8n workflows</span>
          </div>
          
          <div className="text-green-200 text-[10px] uppercase font-mono font-bold mb-1 border-b border-green-800/30 pb-1">
            Active Workflows
          </div>
          
          {/* Workflow cards */}
          {workflows.map((workflow, index) => (
            <WorkflowCard 
              key={index}
              name={workflow.name}
              status={workflow.status}
              lastRun={workflow.lastRun}
              glowIntensity={glowIntensity}
            />
          ))}
          
          <div className="flex justify-end mt-2">
            <button className="bg-green-900/50 hover:bg-green-800/50 text-green-100 py-0.5 px-2 rounded text-[9px] font-medium flex items-center">
              <span className="mr-1">+</span>
              CREATE NEW WORKFLOW
            </button>
          </div>
        </div>
      </SettingsSection>
      
      {/* OpenWebUI Integration Section */}
      <SettingsSection title="OpenWebUI Integration" glowIntensity={glowIntensity}>
        <div className="text-white font-mono text-[10px] mb-2 border-b border-green-800/30 pb-1">
          <span className="text-green-400">STATUS:</span> Connected |
          <span className="text-green-400 ml-1">INTEGRATION:</span> Active
        </div>
        
        <div className="grid grid-cols-1 gap-2">
          <div className="text-green-400 text-[10px] font-mono flex items-start">
            <span className="text-green-300 mr-1 mt-0.5"><N8nIcons.OpenWebUI /></span>
            <span>Configure integration between n8n and OpenWebUI</span>
          </div>
          
          <div className="border border-green-800/30 rounded bg-black/20 p-2">
            <div className="flex items-center mb-2">
              <span className="text-green-300 mr-1"><N8nIcons.Integration /></span>
              <span className="text-green-200 text-[10px] uppercase font-mono font-bold">Integration Settings</span>
            </div>
            
            <div className="flex items-center mb-2">
              <div className="w-1/3">
                <label className="text-green-300 text-[10px] font-mono">OpenWebUI URL:</label>
              </div>
              <div className="w-2/3">
                <input
                  type="text"
                  value="http://localhost:3000"
                  className="bg-black/50 border border-green-800/50 rounded px-2 py-1 text-green-100 text-[10px] font-mono w-full"
                />
              </div>
            </div>
            
            <div className="flex items-center mb-2">
              <div className="w-1/3">
                <label className="text-green-300 text-[10px] font-mono">Webhook URL:</label>
              </div>
              <div className="w-2/3">
                <input
                  type="text"
                  value="http://localhost:5678/webhook/openwebui"
                  className="bg-black/50 border border-green-800/50 rounded px-2 py-1 text-green-100 text-[10px] font-mono w-full"
                  readOnly
                />
              </div>
            </div>
            
            <div className="flex items-center mb-2">
              <div className="w-1/3">
                <label className="text-green-300 text-[10px] font-mono">Status:</label>
              </div>
              <div className="w-2/3">
                <StatusIndicator status="Online" glowIntensity={glowIntensity} />
              </div>
            </div>
            
            <div className="flex justify-end">
              <button className="bg-green-900/50 hover:bg-green-800/50 text-green-100 py-0.5 px-2 rounded text-[9px] font-medium">
                TEST CONNECTION
              </button>
              <button className="ml-2 bg-green-900/50 hover:bg-green-800/50 text-green-100 py-0.5 px-2 rounded text-[9px] font-medium">
                SAVE
              </button>
            </div>
          </div>
          
          <div className="border border-green-800/30 rounded bg-black/20 p-2">
            <div className="flex items-center mb-2">
              <span className="text-green-300 mr-1"><N8nIcons.API /></span>
              <span className="text-green-200 text-[10px] uppercase font-mono font-bold">Event Triggers</span>
            </div>
            
            <div className="flex items-center mb-2">
              <div className="w-full">
                <label className="inline-flex items-center">
                  <input type="checkbox" className="form-checkbox h-3 w-3 text-green-600 rounded border-green-800" checked />
                  <span className="ml-1 text-green-200 text-[9px]">Trigger workflow on new OpenWebUI chat message</span>
                </label>
              </div>
            </div>
            
            <div className="flex items-center mb-2">
              <div className="w-full">
                <label className="inline-flex items-center">
                  <input type="checkbox" className="form-checkbox h-3 w-3 text-green-600 rounded border-green-800" checked />
                  <span className="ml-1 text-green-200 text-[9px]">Trigger workflow on document upload</span>
                </label>
              </div>
            </div>
            
            <div className="flex items-center mb-2">
              <div className="w-full">
                <label className="inline-flex items-center">
                  <input type="checkbox" className="form-checkbox h-3 w-3 text-green-600 rounded border-green-800" />
                  <span className="ml-1 text-green-200 text-[9px]">Trigger workflow on user login/logout</span>
                </label>
              </div>
            </div>
            
            <div className="flex justify-end">
              <button className="bg-green-900/50 hover:bg-green-800/50 text-green-100 py-0.5 px-2 rounded text-[9px] font-medium">
                SAVE TRIGGERS
              </button>
            </div>
          </div>
          
          <div className="text-green-300 text-[9px] font-mono mt-1 border-t border-green-800/30 pt-2">
            <span className="text-green-400">NOTE:</span> n8n integration allows you to create automated workflows triggered by OpenWebUI events.
          </div>
        </div>
      </SettingsSection>
    </div>
  )
}