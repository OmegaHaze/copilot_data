import React, { useState, useEffect } from 'react'

// SVG Icons for OpenWebUI settings
const OpenWebUIIcons = {
  Port: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"></path>
      <path d="M18 14h-8"></path>
      <path d="M15 18h-5"></path>
      <path d="M10 6h8v4h-8V6Z"></path>
    </svg>
  ),
  Connection: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 11a9 9 0 0 1 9 9"></path>
      <path d="M4 4a16 16 0 0 1 16 16"></path>
      <circle cx="5" cy="19" r="2"></circle>
    </svg>
  ),
  ComfyUI: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="8" height="8" rx="2"></rect>
      <rect x="14" y="2" width="8" height="8" rx="2"></rect>
      <rect x="2" y="14" width="8" height="8" rx="2"></rect>
      <rect x="14" y="14" width="8" height="8" rx="2"></rect>
    </svg>
  ),
  Ollama: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 8v8a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5V8a5 5 0 0 1 5-5h8a5 5 0 0 1 5 5Z"></path>
      <path d="M11 21v-4a3 3 0 0 1 3-3h4"></path>
      <path d="M9 7h.01"></path>
    </svg>
  ),
  RAG: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      <line x1="9" y1="10" x2="15" y2="10"></line>
    </svg>
  ),
  N8n: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 21a6 6 0 0 0-12 0"></path>
      <circle cx="12" cy="11" r="4"></circle>
      <path d="M18 3a6 6 0 0 0-6 6c0-3.09-1.91-6-5-6"></path>
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

// OpenWebUI Logo with glow effect
const OpenWebUILogo = ({ glowIntensity = 2 }) => (
  <div className="h-10 w-auto flex items-center justify-center">
    <div
      className="text-2xl font-bold text-green-400"
      style={{ filter: `drop-shadow(0 0 ${glowIntensity}px rgba(0, 255, 0, 0.7))` }}
    >
      Open<span className="text-green-200">WebUI</span>
    </div>
  </div>
)

// Property Display with icons
const OpenWebUIProperty = ({ label, value, icon }) => (
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

export default function OpenWebUISettings() {
  const [isCheckingForUpdates, setIsCheckingForUpdates] = useState(false)
  const [glowIntensity, setGlowIntensity] = useState(2)
  
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
  
  // Mock OpenWebUI information
  const openWebUIInfo = {
    version: '1.2.3',
    lastUpdated: '2024-03-15',
    status: 'Online',
    port: '3000'
  }

  const handleCheckForUpdates = () => {
    setIsCheckingForUpdates(true)
    // Simulate update check
    setTimeout(() => {
      setIsCheckingForUpdates(false)
      alert('OpenWebUI is up to date!')
    }, 2000)
  }

  return (
    <div className="h-full p-2 overflow-y-auto">
      {/* OpenWebUI logo and header */}
      <div className="flex items-center justify-between border-b border-green-800 pb-3 mb-4">
        <div>
          <h3 className="text-green-200 text-xl font-bold flex items-center tracking-wide">
            <span className="text-green-400 mr-2">▣</span>
            OPENWEBUI SETTINGS
          </h3>
          <p className="text-green-400 text-xs mt-0.5">Configure OpenWebUI parameters and connections</p>
        </div>
        <OpenWebUILogo glowIntensity={glowIntensity} />
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
      
      {/* Port Management Section */}
      <SettingsSection title="Port Management" glowIntensity={glowIntensity}>
        <div className="text-white font-mono text-[10px] mb-2 border-b border-green-800/30 pb-1">
          <span className="text-green-400">STATUS:</span> Active |
          <span className="text-green-400 ml-1">PORT:</span> {openWebUIInfo.port}
        </div>
        
        <div className="grid grid-cols-1 gap-2">
          <div className="text-green-400 text-[10px] font-mono flex items-start">
            <span className="text-green-300 mr-1 mt-0.5"><OpenWebUIIcons.Port /></span>
            <span>Configure port settings for OpenWebUI service</span>
          </div>
          
          <div className="border border-green-800/30 rounded bg-black/20 p-2">
            <div className="flex items-center mb-2">
              <span className="text-green-300 mr-1"><OpenWebUIIcons.Settings /></span>
              <span className="text-green-200 text-[10px] uppercase font-mono font-bold">Port Configuration</span>
            </div>
            
            <div className="flex items-center mb-2">
              <div className="w-1/3">
                <label className="text-green-300 text-[10px] font-mono">Current Port:</label>
              </div>
              <div className="w-2/3 flex items-center">
                <input
                  type="text"
                  value={openWebUIInfo.port}
                  className="bg-black/50 border border-green-800/50 rounded px-2 py-1 text-green-100 text-[10px] font-mono w-20"
                  readOnly
                />
                <StatusIndicator status={openWebUIInfo.status} glowIntensity={glowIntensity} className="ml-2" />
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
          
          <div className="text-green-300 text-[9px] font-mono mt-1 border-t border-green-800/30 pt-2">
            <span className="text-green-400">NOTE:</span> Changing ports requires a service restart to take effect.
          </div>
        </div>
      </SettingsSection>
      
      {/* ComfyUI Connection Section */}
      <SettingsSection title="ComfyUI Connection" glowIntensity={glowIntensity}>
        <div className="text-white font-mono text-[10px] mb-2 border-b border-green-800/30 pb-1">
          <span className="text-green-400">STATUS:</span> Connected |
          <span className="text-green-400 ml-1">ENDPOINT:</span> http://localhost:8188
        </div>
        
        <div className="grid grid-cols-1 gap-2">
          <div className="text-green-400 text-[10px] font-mono flex items-start">
            <span className="text-green-300 mr-1 mt-0.5"><OpenWebUIIcons.ComfyUI /></span>
            <span>Configure connection settings for ComfyUI integration</span>
          </div>
          
          <div className="border border-green-800/30 rounded bg-black/20 p-2">
            <div className="flex items-center mb-2">
              <span className="text-green-300 mr-1"><OpenWebUIIcons.Connection /></span>
              <span className="text-green-200 text-[10px] uppercase font-mono font-bold">ComfyUI Endpoint</span>
            </div>
            
            <div className="flex items-center mb-2">
              <div className="w-1/3">
                <label className="text-green-300 text-[10px] font-mono">URL:</label>
              </div>
              <div className="w-2/3">
                <input
                  type="text"
                  value="http://localhost:8188"
                  className="bg-black/50 border border-green-800/50 rounded px-2 py-1 text-green-100 text-[10px] font-mono w-full"
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
        </div>
      </SettingsSection>
      
      {/* Ollama Connection Section */}
      <SettingsSection title="Ollama Connection" glowIntensity={glowIntensity}>
        <div className="text-white font-mono text-[10px] mb-2 border-b border-green-800/30 pb-1">
          <span className="text-green-400">STATUS:</span> Connected |
          <span className="text-green-400 ml-1">ENDPOINT:</span> http://localhost:11434
        </div>
        
        <div className="grid grid-cols-1 gap-2">
          <div className="text-green-400 text-[10px] font-mono flex items-start">
            <span className="text-green-300 mr-1 mt-0.5"><OpenWebUIIcons.Ollama /></span>
            <span>Configure connection settings for Ollama integration</span>
          </div>
          
          <div className="border border-green-800/30 rounded bg-black/20 p-2">
            <div className="flex items-center mb-2">
              <span className="text-green-300 mr-1"><OpenWebUIIcons.Connection /></span>
              <span className="text-green-200 text-[10px] uppercase font-mono font-bold">Ollama Endpoint</span>
            </div>
            
            <div className="flex items-center mb-2">
              <div className="w-1/3">
                <label className="text-green-300 text-[10px] font-mono">URL:</label>
              </div>
              <div className="w-2/3">
                <input
                  type="text"
                  value="http://localhost:11434"
                  className="bg-black/50 border border-green-800/50 rounded px-2 py-1 text-green-100 text-[10px] font-mono w-full"
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
        </div>
      </SettingsSection>
      
      {/* RAG Management Section */}
      <SettingsSection title="RAG Management" glowIntensity={glowIntensity}>
        <div className="text-white font-mono text-[10px] mb-2 border-b border-green-800/30 pb-1">
          <span className="text-green-400">STATUS:</span> Configured |
          <span className="text-green-400 ml-1">PROVIDER:</span> Qdrant
        </div>
        
        <div className="grid grid-cols-1 gap-2">
          <div className="text-green-400 text-[10px] font-mono flex items-start">
            <span className="text-green-300 mr-1 mt-0.5"><OpenWebUIIcons.RAG /></span>
            <span>Configure Retrieval-Augmented Generation settings</span>
          </div>
          
          <div className="border border-green-800/30 rounded bg-black/20 p-2">
            <div className="flex items-center mb-2">
              <span className="text-green-300 mr-1"><OpenWebUIIcons.Settings /></span>
              <span className="text-green-200 text-[10px] uppercase font-mono font-bold">RAG Configuration</span>
            </div>
            
            <div className="flex items-center mb-2">
              <div className="w-1/3">
                <label className="text-green-300 text-[10px] font-mono">Vector DB:</label>
              </div>
              <div className="w-2/3">
                <select className="bg-black/50 border border-green-800/50 rounded px-2 py-1 text-green-100 text-[10px] font-mono w-full">
                  <option>Qdrant</option>
                  <option>Chroma</option>
                  <option>Pinecone</option>
                </select>
              </div>
            </div>
            
            <div className="flex items-center mb-2">
              <div className="w-1/3">
                <label className="text-green-300 text-[10px] font-mono">Endpoint:</label>
              </div>
              <div className="w-2/3">
                <input
                  type="text"
                  value="http://localhost:6333"
                  className="bg-black/50 border border-green-800/50 rounded px-2 py-1 text-green-100 text-[10px] font-mono w-full"
                />
              </div>
            </div>
            
            <div className="flex items-center mb-2">
              <div className="w-1/3">
                <label className="text-green-300 text-[10px] font-mono">Embedding Model:</label>
              </div>
              <div className="w-2/3">
                <select className="bg-black/50 border border-green-800/50 rounded px-2 py-1 text-green-100 text-[10px] font-mono w-full">
                  <option>all-MiniLM-L6-v2</option>
                  <option>e5-large-v2</option>
                  <option>nomic-embed-text</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end">
              <button className="bg-green-900/50 hover:bg-green-800/50 text-green-100 py-0.5 px-2 rounded text-[9px] font-medium">
                SAVE CONFIGURATION
              </button>
            </div>
          </div>
        </div>
      </SettingsSection>
      
      {/* n8n Integration Section */}
      <SettingsSection title="n8n Integration" glowIntensity={glowIntensity}>
        <div className="text-white font-mono text-[10px] mb-2 border-b border-green-800/30 pb-1">
          <span className="text-green-400">STATUS:</span> Not Configured |
          <span className="text-green-400 ml-1">PRIORITY:</span> Medium
        </div>
        
        <div className="grid grid-cols-1 gap-2">
          <div className="text-green-400 text-[10px] font-mono flex items-start">
            <span className="text-green-300 mr-1 mt-0.5"><OpenWebUIIcons.N8n /></span>
            <span>Configure n8n workflow integration with OpenWebUI</span>
          </div>
          
          <div className="border border-green-800/30 rounded bg-black/20 p-2">
            <div className="flex items-center mb-2">
              <span className="text-green-300 mr-1"><OpenWebUIIcons.Connection /></span>
              <span className="text-green-200 text-[10px] uppercase font-mono font-bold">n8n Connection</span>
            </div>
            
            <div className="flex items-center mb-2">
              <div className="w-1/3">
                <label className="text-green-300 text-[10px] font-mono">n8n URL:</label>
              </div>
              <div className="w-2/3">
                <input
                  type="text"
                  placeholder="http://localhost:5678"
                  className="bg-black/50 border border-green-800/50 rounded px-2 py-1 text-green-100 text-[10px] font-mono w-full"
                />
              </div>
            </div>
            
            <div className="flex items-center mb-2">
              <div className="w-1/3">
                <label className="text-green-300 text-[10px] font-mono">API Key:</label>
              </div>
              <div className="w-2/3">
                <input
                  type="password"
                  placeholder="Enter API key"
                  className="bg-black/50 border border-green-800/50 rounded px-2 py-1 text-green-100 text-[10px] font-mono w-full"
                />
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
                TEST CONNECTION
              </button>
              <button className="ml-2 bg-green-900/50 hover:bg-green-800/50 text-green-100 py-0.5 px-2 rounded text-[9px] font-medium">
                SAVE
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