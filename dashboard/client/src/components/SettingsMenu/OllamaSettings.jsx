import React, { useState, useEffect } from 'react'

// SVG Icons for Ollama settings
const OllamaIcons = {
  Connection: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 11a9 9 0 0 1 9 9"></path>
      <path d="M4 4a16 16 0 0 1 16 16"></path>
      <circle cx="5" cy="19" r="2"></circle>
    </svg>
  ),
  Model: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
      <polyline points="3.29 7 12 12 20.71 7"></polyline>
      <line x1="12" y1="22" x2="12" y2="12"></line>
    </svg>
  ),
  AI: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a8 8 0 0 0-8 8c0 6 8 12 8 12s8-6 8-12a8 8 0 0 0-8-8zm0 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"></path>
    </svg>
  ),
  Status: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
    </svg>
  ),
  Settings: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
      <circle cx="12" cy="12" r="3"></circle>
    </svg>
  ),
  Download: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
      <polyline points="7 10 12 15 17 10"></polyline>
      <line x1="12" y1="15" x2="12" y2="3"></line>
    </svg>
  ),
  Delete: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18"></path>
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
      <line x1="10" y1="11" x2="10" y2="17"></line>
      <line x1="14" y1="11" x2="14" y2="17"></line>
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

// Ollama Logo with glow effect
const OllamaLogo = ({ glowIntensity = 2 }) => (
  <div className="h-10 w-auto flex items-center justify-center">
    <div
      className="text-2xl font-bold text-green-400"
      style={{ filter: `drop-shadow(0 0 ${glowIntensity}px rgba(0, 255, 0, 0.7))` }}
    >
      Oll<span className="text-green-200">ama</span>
    </div>
  </div>
)

// Property Display with icons
const OllamaProperty = ({ label, value, icon }) => (
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

// Model card component
const ModelCard = ({ model, status, size, glowIntensity = 2 }) => {
  return (
    <div className="border border-green-800/30 rounded bg-black/20 p-2 mb-2">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center">
          <span className="text-green-300 mr-1"><OllamaIcons.Model /></span>
          <span className="text-green-200 text-[10px] uppercase font-mono font-bold">{model}</span>
        </div>
        <StatusIndicator status={status} glowIntensity={glowIntensity} />
      </div>
      
      <div className="text-green-400 text-[9px] font-mono pl-4 mb-2">
        • Size: {size}<br />
        • Status: {status}<br />
        • Parameters: {model.includes('7b') ? '7 billion' : model.includes('13b') ? '13 billion' : '3 billion'}
      </div>
      
      <div className="flex justify-end space-x-1">
        <button className="bg-green-900/50 hover:bg-green-800/50 text-green-100 py-0.5 px-2 rounded text-[8px] font-medium flex items-center">
          <span className="mr-1"><OllamaIcons.Settings /></span>
          CONFIGURE
        </button>
        <button className="bg-red-900/50 hover:bg-red-800/50 text-red-100 py-0.5 px-2 rounded text-[8px] font-medium flex items-center">
          <span className="mr-1"><OllamaIcons.Delete /></span>
          REMOVE
        </button>
      </div>
    </div>
  )
}

export default function OllamaSettings() {
  const [isCheckingForUpdates, setIsCheckingForUpdates] = useState(false)
  const [glowIntensity, setGlowIntensity] = useState(2)
  const [openWebUIStatus, setOpenWebUIStatus] = useState('Online')
  
  // Mock models data
  const [models, setModels] = useState([
    { name: 'llama3:8b', status: 'Online', size: '4.7 GB' },
    { name: 'mistral:7b', status: 'Online', size: '4.1 GB' },
    { name: 'codellama:13b', status: 'Offline', size: '8.2 GB' }
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
  
  // Mock Ollama information
  const ollamaInfo = {
    version: '0.1.17',
    lastUpdated: '2024-03-10',
    endpoint: 'http://localhost:11434'
  }

  const handleCheckForUpdates = () => {
    setIsCheckingForUpdates(true)
    // Simulate update check
    setTimeout(() => {
      setIsCheckingForUpdates(false)
      alert('Ollama is up to date!')
    }, 2000)
  }
  
  const handleOpenWebUIStatusCheck = () => {
    // Simulate status check
    setOpenWebUIStatus('Connecting')
    setTimeout(() => {
      setOpenWebUIStatus('Online')
    }, 1500)
  }

  return (
    <div className="h-full p-2 overflow-y-auto">
      {/* Ollama logo and header */}
      <div className="flex items-center justify-between border-b border-green-800 pb-3 mb-4">
        <div>
          <h3 className="text-green-200 text-xl font-bold flex items-center tracking-wide">
            <span className="text-green-400 mr-2">▣</span>
            OLLAMA SETTINGS
          </h3>
          <p className="text-green-400 text-xs mt-0.5">Configure Ollama models and connections</p>
        </div>
        <OllamaLogo glowIntensity={glowIntensity} />
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
      
      {/* OpenWebUI Connection Status Section */}
      <SettingsSection title="OpenWebUI Connection Status" glowIntensity={glowIntensity}>
        <div className="text-white font-mono text-[10px] mb-2 border-b border-green-800/30 pb-1">
          <span className="text-green-400">STATUS:</span> {openWebUIStatus} |
          <span className="text-green-400 ml-1">ENDPOINT:</span> {ollamaInfo.endpoint}
        </div>
        
        <div className="grid grid-cols-1 gap-2">
          <div className="text-green-400 text-[10px] font-mono flex items-start">
            <span className="text-green-300 mr-1 mt-0.5"><OllamaIcons.OpenWebUI /></span>
            <span>Monitor and manage connection with OpenWebUI</span>
          </div>
          
          <div className="border border-green-800/30 rounded bg-black/20 p-2">
            <div className="flex items-center mb-2">
              <span className="text-green-300 mr-1"><OllamaIcons.Connection /></span>
              <span className="text-green-200 text-[10px] uppercase font-mono font-bold">Connection Status</span>
            </div>
            
            <div className="flex items-center mb-2">
              <div className="w-1/3">
                <label className="text-green-300 text-[10px] font-mono">Status:</label>
              </div>
              <div className="w-2/3 flex items-center">
                <StatusIndicator status={openWebUIStatus} glowIntensity={glowIntensity} />
                <button 
                  className="ml-2 bg-green-900/50 hover:bg-green-800/50 text-green-100 py-0.5 px-2 rounded text-[9px] font-medium"
                  onClick={handleOpenWebUIStatusCheck}
                >
                  CHECK
                </button>
              </div>
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
                  readOnly
                />
              </div>
            </div>
            
            <div className="flex items-center">
              <div className="w-1/3">
                <label className="text-green-300 text-[10px] font-mono">Ollama API:</label>
              </div>
              <div className="w-2/3">
                <input
                  type="text"
                  value={ollamaInfo.endpoint}
                  className="bg-black/50 border border-green-800/50 rounded px-2 py-1 text-green-100 text-[10px] font-mono w-full"
                  readOnly
                />
              </div>
            </div>
          </div>
          
          <div className="text-green-300 text-[9px] font-mono mt-1 border-t border-green-800/30 pt-2">
            <span className="text-green-400">NOTE:</span> OpenWebUI connects to Ollama to provide a user-friendly interface for interacting with models.
          </div>
        </div>
      </SettingsSection>
      
      {/* Model Manager Section */}
      <SettingsSection title="Model Manager" glowIntensity={glowIntensity}>
        <div className="text-white font-mono text-[10px] mb-2 border-b border-green-800/30 pb-1">
          <span className="text-green-400">MODELS:</span> {models.length} |
          <span className="text-green-400 ml-1">ACTIVE:</span> {models.filter(m => m.status === 'Online').length}
        </div>
        
        <div className="grid grid-cols-1 gap-2">
          <div className="text-green-400 text-[10px] font-mono flex items-start">
            <span className="text-green-300 mr-1 mt-0.5"><OllamaIcons.Model /></span>
            <span>Manage installed models and download new ones</span>
          </div>
          
          <div className="border border-green-800/30 rounded bg-black/20 p-2 mb-2">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <span className="text-green-300 mr-1"><OllamaIcons.Download /></span>
                <span className="text-green-200 text-[10px] uppercase font-mono font-bold">Download New Model</span>
              </div>
            </div>
            
            <div className="flex items-center mb-2">
              <div className="w-2/3">
                <select className="bg-black/50 border border-green-800/50 rounded px-2 py-1 text-green-100 text-[10px] font-mono w-full">
                  <option>llama3:8b</option>
                  <option>llama3:70b</option>
                  <option>mistral:7b</option>
                  <option>mistral:instruct</option>
                  <option>codellama:13b</option>
                  <option>phi3:mini</option>
                </select>
              </div>
              <div className="w-1/3 pl-2">
                <button className="w-full bg-green-900/50 hover:bg-green-800/50 text-green-100 py-1 px-2 rounded text-[9px] font-medium flex items-center justify-center">
                  <span className="mr-1"><OllamaIcons.Download /></span>
                  DOWNLOAD
                </button>
              </div>
            </div>
          </div>
          
          <div className="text-green-200 text-[10px] uppercase font-mono font-bold mb-1 border-b border-green-800/30 pb-1">
            Installed Models
          </div>
          
          {/* Model cards */}
          {models.map((model, index) => (
            <ModelCard 
              key={index}
              model={model.name}
              status={model.status}
              size={model.size}
              glowIntensity={glowIntensity}
            />
          ))}
          
          <div className="text-green-300 text-[9px] font-mono mt-1 border-t border-green-800/30 pt-2">
            <span className="text-green-400">NOTE:</span> Models are stored locally and can be used offline once downloaded.
          </div>
        </div>
      </SettingsSection>
      
      {/* vAio System AI Integration Section */}
      <SettingsSection title="vAio System AI Integration" glowIntensity={glowIntensity}>
        <div className="text-white font-mono text-[10px] mb-2 border-b border-green-800/30 pb-1">
          <span className="text-green-400">STATUS:</span> Not Configured |
          <span className="text-green-400 ml-1">PRIORITY:</span> High
        </div>
        
        <div className="grid grid-cols-1 gap-2">
          <div className="text-green-400 text-[10px] font-mono flex items-start">
            <span className="text-green-300 mr-1 mt-0.5"><OllamaIcons.AI /></span>
            <span>Configure vAio system AI integration with Ollama models</span>
          </div>
          
          <div className="border border-green-800/30 rounded bg-black/20 p-2">
            <div className="flex items-center mb-2">
              <span className="text-green-300 mr-1"><OllamaIcons.Integration /></span>
              <span className="text-green-200 text-[10px] uppercase font-mono font-bold">System Integration</span>
            </div>
            
            <div className="flex items-center mb-2">
              <div className="w-1/3">
                <label className="text-green-300 text-[10px] font-mono">System Model:</label>
              </div>
              <div className="w-2/3">
                <select className="bg-black/50 border border-green-800/50 rounded px-2 py-1 text-green-100 text-[10px] font-mono w-full">
                  <option>llama3:8b</option>
                  <option>mistral:7b</option>
                  <option>codellama:13b</option>
                </select>
              </div>
            </div>
            
            <div className="flex items-center mb-2">
              <div className="w-1/3">
                <label className="text-green-300 text-[10px] font-mono">Integration Level:</label>
              </div>
              <div className="w-2/3">
                <select className="bg-black/50 border border-green-800/50 rounded px-2 py-1 text-green-100 text-[10px] font-mono w-full">
                  <option>Basic (Command Processing)</option>
                  <option>Standard (System Assistance)</option>
                  <option>Advanced (Full System Control)</option>
                </select>
              </div>
            </div>
            
            <div className="flex items-center mb-2">
              <div className="w-1/3">
                <label className="text-green-300 text-[10px] font-mono">Auto-Start:</label>
              </div>
              <div className="w-2/3 flex items-center">
                <label className="inline-flex items-center">
                  <input type="checkbox" className="form-checkbox h-3 w-3 text-green-600 rounded border-green-800" />
                  <span className="ml-1 text-green-200 text-[9px]">Enable system AI on startup</span>
                </label>
              </div>
            </div>
            
            <div className="flex items-center mb-2">
              <div className="w-1/3">
                <label className="text-green-300 text-[10px] font-mono">Status:</label>
              </div>
              <div className="w-2/3">
                <StatusIndicator status="Offline" glowIntensity={glowIntensity} />
              </div>
            </div>
            
            <div className="flex justify-end">
              <button className="bg-green-900/50 hover:bg-green-800/50 text-green-100 py-0.5 px-2 rounded text-[9px] font-medium">
                CONFIGURE & ACTIVATE
              </button>
            </div>
          </div>
          
          <div className="text-green-300 text-[9px] font-mono mt-1 border-t border-green-800/30 pt-2">
            <span className="text-green-400">NOTE:</span> vAio System AI integration allows Ollama models to interact with system components and services.
          </div>
        </div>
      </SettingsSection>
    </div>
  )
}