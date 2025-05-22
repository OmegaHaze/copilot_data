import React, { useState, useEffect } from 'react'

// SVG Icons for Qdrant Dashboard settings
const QdrantDashboardIcons = {
  Dashboard: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="9"></rect>
      <rect x="14" y="3" width="7" height="5"></rect>
      <rect x="14" y="12" width="7" height="9"></rect>
      <rect x="3" y="16" width="7" height="5"></rect>
    </svg>
  ),
  Connection: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 11a9 9 0 0 1 9 9"></path>
      <path d="M4 4a16 16 0 0 1 16 16"></path>
      <circle cx="5" cy="19" r="2"></circle>
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
  Launch: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
      <polyline points="15 3 21 3 21 9"></polyline>
      <line x1="10" y1="14" x2="21" y2="3"></line>
    </svg>
  ),
  Settings: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
      <circle cx="12" cy="12" r="3"></circle>
    </svg>
  ),
  Metrics: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18"></path>
      <path d="M18 12V8"></path>
      <path d="M14 12V6"></path>
      <path d="M10 12v-1"></path>
      <path d="M6 12v-4"></path>
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

// Qdrant Dashboard Logo with glow effect
const QdrantDashboardLogo = ({ glowIntensity = 2 }) => (
  <div className="h-10 w-auto flex items-center justify-center">
    <div
      className="text-2xl font-bold text-green-400"
      style={{ filter: `drop-shadow(0 0 ${glowIntensity}px rgba(0, 255, 0, 0.7))` }}
    >
      Qdrant <span className="text-green-200">Dashboard</span>
    </div>
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

export default function QdrantDashboardSettings() {
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
  
  // Mock Qdrant Dashboard information
  const qdrantDashboardInfo = {
    version: '1.0.0',
    port: '6333',
    dashboardUrl: 'http://localhost:6333/dashboard'
  }

  const handleCheckForUpdates = () => {
    setIsCheckingForUpdates(true)
    // Simulate update check
    setTimeout(() => {
      setIsCheckingForUpdates(false)
      alert('Qdrant Dashboard is up to date!')
    }, 2000)
  }

  return (
    <div className="h-full p-2 overflow-y-auto">
      {/* Qdrant Dashboard logo and header */}
      <div className="flex items-center justify-between border-b border-green-800 pb-3 mb-4">
        <div>
          <h3 className="text-green-200 text-xl font-bold flex items-center tracking-wide">
            <span className="text-green-400 mr-2">▣</span>
            QDRANT DASHBOARD
          </h3>
          <p className="text-green-400 text-xs mt-0.5">Access and configure Qdrant web interface</p>
        </div>
        <QdrantDashboardLogo glowIntensity={glowIntensity} />
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
      
      {/* Port Check Section */}
      <SettingsSection title="Port Check" glowIntensity={glowIntensity}>
        <div className="text-white font-mono text-[10px] mb-2 border-b border-green-800/30 pb-1">
          <span className="text-green-400">STATUS:</span> Available |
          <span className="text-green-400 ml-1">PORT:</span> {qdrantDashboardInfo.port}
        </div>
        
        <div className="grid grid-cols-1 gap-2">
          <div className="text-green-400 text-[10px] font-mono flex items-start pl-2">
            <span className="text-green-300 mr-1 mt-0.5"><QdrantDashboardIcons.Port /></span>
            <span>Check Qdrant port availability and connection status</span>
          </div>
          
          <div className="border border-green-800/30 rounded bg-black/20 p-2">
            <div className="flex items-center mb-2">
              <span className="text-green-300 mr-1"><QdrantDashboardIcons.Connection /></span>
              <span className="text-green-200 text-[10px] uppercase font-mono font-bold">Connection Status</span>
            </div>
            
            <div className="flex items-center mb-2">
              <div className="w-1/3">
                <label className="text-green-300 text-[10px] font-mono">Port:</label>
              </div>
              <div className="w-2/3 flex items-center">
                <input
                  type="text"
                  value={qdrantDashboardInfo.port}
                  className="bg-black/50 border border-green-800/50 rounded px-2 py-1 text-green-100 text-[10px] font-mono w-20"
                  readOnly
                />
                <StatusIndicator status="Online" glowIntensity={glowIntensity} className="ml-2" />
              </div>
            </div>
            
            <div className="flex items-center mb-2">
              <div className="w-1/3">
                <label className="text-green-300 text-[10px] font-mono">API Endpoint:</label>
              </div>
              <div className="w-2/3">
                <input
                  type="text"
                  value={`http://localhost:${qdrantDashboardInfo.port}`}
                  className="bg-black/50 border border-green-800/50 rounded px-2 py-1 text-green-100 text-[10px] font-mono w-full"
                  readOnly
                />
              </div>
            </div>
            
            <div className="flex justify-end">
              <button className="bg-green-900/50 hover:bg-green-800/50 text-green-100 py-0.5 px-2 rounded text-[9px] font-medium">
                CHECK CONNECTION
              </button>
            </div>
          </div>
        </div>
      </SettingsSection>
      
      {/* Launch Interface Section */}
      <SettingsSection title="Launch Interface" glowIntensity={glowIntensity}>
        <div className="text-white font-mono text-[10px] mb-2 border-b border-green-800/30 pb-1">
          <span className="text-green-400">DASHBOARD:</span> Available |
          <span className="text-green-400 ml-1">URL:</span> {qdrantDashboardInfo.dashboardUrl}
        </div>
        
        <div className="grid grid-cols-1 gap-2">
          <div className="text-green-400 text-[10px] font-mono flex items-start pl-2">
            <span className="text-green-300 mr-1 mt-0.5"><QdrantDashboardIcons.Dashboard /></span>
            <span>Access the Qdrant web dashboard interface</span>
          </div>
          
          <div className="border border-green-800/30 rounded bg-black/20 p-2">
            <div className="flex items-center mb-2">
              <span className="text-green-300 mr-1"><QdrantDashboardIcons.Launch /></span>
              <span className="text-green-200 text-[10px] uppercase font-mono font-bold">Dashboard URL</span>
            </div>
            
            <div className="flex items-center mb-2">
              <div className="w-1/3">
                <label className="text-green-300 text-[10px] font-mono">URL:</label>
              </div>
              <div className="w-2/3">
                <input
                  type="text"
                  value={qdrantDashboardInfo.dashboardUrl}
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
              <button className="bg-green-900/50 hover:bg-green-800/50 text-green-100 py-0.5 px-2 rounded text-[9px] font-medium flex items-center">
                <span className="mr-1"><QdrantDashboardIcons.Launch /></span>
                LAUNCH DASHBOARD
              </button>
            </div>
          </div>
          
          <div className="text-green-300 text-[9px] font-mono mt-1 border-t border-green-800/30 pt-2">
            <span className="text-green-400">NOTE:</span> The Qdrant dashboard provides a visual interface for managing collections and monitoring performance.
          </div>
        </div>
      </SettingsSection>
    </div>
  )
}