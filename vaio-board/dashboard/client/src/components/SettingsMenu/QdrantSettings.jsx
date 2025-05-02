import React, { useState, useEffect } from 'react'

// SVG Icons for Qdrant settings
const QdrantIcons = {
  Database: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
    </svg>
  ),
  Vector: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 3 9 15"></path>
      <path d="M12 3H3v18h18v-9"></path>
      <path d="M16 3h5v5"></path>
      <path d="M14 15H9v-5"></path>
    </svg>
  ),
  Search: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"></circle>
      <path d="m21 21-4.3-4.3"></path>
    </svg>
  ),
  Collection: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
      <polyline points="3.29 7 12 12 20.71 7"></polyline>
      <line x1="12" y1="22" x2="12" y2="12"></line>
    </svg>
  ),
  Settings: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
      <circle cx="12" cy="12" r="3"></circle>
    </svg>
  ),
  Connection: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 11a9 9 0 0 1 9 9"></path>
      <path d="M4 4a16 16 0 0 1 16 16"></path>
      <circle cx="5" cy="19" r="2"></circle>
    </svg>
  ),
  Metrics: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
    </svg>
  ),
  Add: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="8" x2="12" y2="16"></line>
      <line x1="8" y1="12" x2="16" y2="12"></line>
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

// Qdrant Logo with glow effect
const QdrantLogo = ({ glowIntensity = 2 }) => (
  <div className="h-10 w-auto flex items-center justify-center">
    <div
      className="text-2xl font-bold text-green-400"
      style={{ filter: `drop-shadow(0 0 ${glowIntensity}px rgba(0, 255, 0, 0.7))` }}
    >
      Qdr<span className="text-green-200">ant</span>
    </div>
  </div>
)

// Property Display with icons
const QdrantProperty = ({ label, value, icon }) => (
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

// Collection card component
const CollectionCard = ({ name, vectors, dimensions, glowIntensity = 2 }) => {
  return (
    <div className="border border-green-800/30 rounded bg-black/20 p-2 mb-2">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center">
          <span className="text-green-300 mr-1"><QdrantIcons.Collection /></span>
          <span className="text-green-200 text-[10px] uppercase font-mono font-bold">{name}</span>
        </div>
        <StatusIndicator status="Online" glowIntensity={glowIntensity} />
      </div>
      
      <div className="text-green-400 text-[9px] font-mono pl-4 mb-2">
        • Vectors: {vectors}<br />
        • Dimensions: {dimensions}<br />
        • Distance: Cosine
      </div>
      
      <div className="flex justify-end space-x-1">
        <button className="bg-green-900/50 hover:bg-green-800/50 text-green-100 py-0.5 px-2 rounded text-[8px] font-medium flex items-center">
          <span className="mr-1"><QdrantIcons.Search /></span>
          QUERY
        </button>
        <button className="bg-red-900/50 hover:bg-red-800/50 text-red-100 py-0.5 px-2 rounded text-[8px] font-medium flex items-center">
          <span className="mr-1"><QdrantIcons.Delete /></span>
          DELETE
        </button>
      </div>
    </div>
  )
}

export default function QdrantSettings() {
  const [isCheckingForUpdates, setIsCheckingForUpdates] = useState(false)
  const [glowIntensity, setGlowIntensity] = useState(2)
  
  // Mock collections data
  const [collections, setCollections] = useState([
    { name: 'documents', vectors: '1,245', dimensions: '768' },
    { name: 'images', vectors: '3,782', dimensions: '1024' },
    { name: 'code_snippets', vectors: '892', dimensions: '384' }
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
  
  // Mock Qdrant information
  const qdrantInfo = {
    version: '1.1.0',
    lastUpdated: '2024-02-20',
    endpoint: 'http://localhost:6333'
  }

  const handleCheckForUpdates = () => {
    setIsCheckingForUpdates(true)
    // Simulate update check
    setTimeout(() => {
      setIsCheckingForUpdates(false)
      alert('Qdrant is up to date!')
    }, 2000)
  }

  return (
    <div className="h-full p-2 overflow-y-auto">
      {/* Qdrant logo and header */}
      <div className="flex items-center justify-between border-b border-green-800 pb-3 mb-4">
        <div>
          <h3 className="text-green-200 text-xl font-bold flex items-center tracking-wide">
            <span className="text-green-400 mr-2">▣</span>
            QDRANT SETTINGS
          </h3>
          <p className="text-green-400 text-xs mt-0.5">Configure Qdrant vector database settings</p>
        </div>
        <QdrantLogo glowIntensity={glowIntensity} />
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
      
      {/* Vector Database Management Section */}
      <SettingsSection title="Vector Database Management" glowIntensity={glowIntensity}>
        <div className="text-white font-mono text-[10px] mb-2 border-b border-green-800/30 pb-1">
          <span className="text-green-400">STATUS:</span> Online |
          <span className="text-green-400 ml-1">COLLECTIONS:</span> {collections.length}
        </div>
        
        <div className="grid grid-cols-1 gap-2">
          <div className="text-green-400 text-[10px] font-mono flex items-start">
            <span className="text-green-300 mr-1 mt-0.5"><QdrantIcons.Database /></span>
            <span>Manage vector database collections and configuration</span>
          </div>
          
          <div className="border border-green-800/30 rounded bg-black/20 p-2">
            <div className="flex items-center mb-2">
              <span className="text-green-300 mr-1"><QdrantIcons.Connection /></span>
              <span className="text-green-200 text-[10px] uppercase font-mono font-bold">Connection Settings</span>
            </div>
            
            <div className="flex items-center mb-2">
              <div className="w-1/3">
                <label className="text-green-300 text-[10px] font-mono">Endpoint:</label>
              </div>
              <div className="w-2/3">
                <input
                  type="text"
                  value={qdrantInfo.endpoint}
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
                  placeholder="Enter API key (optional)"
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
          
          <div className="border border-green-800/30 rounded bg-black/20 p-2 mb-2">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <span className="text-green-300 mr-1"><QdrantIcons.Add /></span>
                <span className="text-green-200 text-[10px] uppercase font-mono font-bold">Create New Collection</span>
              </div>
            </div>
            
            <div className="flex items-center mb-2">
              <div className="w-1/3">
                <label className="text-green-300 text-[10px] font-mono">Name:</label>
              </div>
              <div className="w-2/3">
                <input
                  type="text"
                  placeholder="collection_name"
                  className="bg-black/50 border border-green-800/50 rounded px-2 py-1 text-green-100 text-[10px] font-mono w-full"
                />
              </div>
            </div>
            
            <div className="flex items-center mb-2">
              <div className="w-1/3">
                <label className="text-green-300 text-[10px] font-mono">Dimensions:</label>
              </div>
              <div className="w-2/3">
                <input
                  type="number"
                  placeholder="768"
                  className="bg-black/50 border border-green-800/50 rounded px-2 py-1 text-green-100 text-[10px] font-mono w-full"
                />
              </div>
            </div>
            
            <div className="flex items-center mb-2">
              <div className="w-1/3">
                <label className="text-green-300 text-[10px] font-mono">Distance:</label>
              </div>
              <div className="w-2/3">
                <select className="bg-black/50 border border-green-800/50 rounded px-2 py-1 text-green-100 text-[10px] font-mono w-full">
                  <option>Cosine</option>
                  <option>Euclidean</option>
                  <option>Dot Product</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end">
              <button className="bg-green-900/50 hover:bg-green-800/50 text-green-100 py-0.5 px-2 rounded text-[9px] font-medium">
                CREATE COLLECTION
              </button>
            </div>
          </div>
          
          <div className="text-green-200 text-[10px] uppercase font-mono font-bold mb-1 border-b border-green-800/30 pb-1">
            Existing Collections
          </div>
          
          {/* Collection cards */}
          {collections.map((collection, index) => (
            <CollectionCard 
              key={index}
              name={collection.name}
              vectors={collection.vectors}
              dimensions={collection.dimensions}
              glowIntensity={glowIntensity}
            />
          ))}
        </div>
      </SettingsSection>
      
      {/* Qdrant Dashboard Section */}
      <SettingsSection title="Qdrant Dashboard" glowIntensity={glowIntensity}>
        <div className="text-white font-mono text-[10px] mb-2 border-b border-green-800/30 pb-1">
          <span className="text-green-400">STATUS:</span> Available |
          <span className="text-green-400 ml-1">PORT:</span> 6333
        </div>
        
        <div className="grid grid-cols-1 gap-2">
          <div className="text-green-400 text-[10px] font-mono flex items-start pl-2">
            <span className="text-green-300 mr-1 mt-0.5"><QdrantIcons.Connection /></span>
            <span>Access Qdrant web interface and check connection status</span>
          </div>
          
          <div className="border border-green-800/30 rounded bg-black/20 p-2">
            <div className="flex items-center mb-2">
              <span className="text-green-300 mr-1"><QdrantIcons.Connection /></span>
              <span className="text-green-200 text-[10px] uppercase font-mono font-bold">Connection Status</span>
            </div>
            
            <div className="flex items-center mb-2">
              <div className="w-1/3">
                <label className="text-green-300 text-[10px] font-mono">Dashboard URL:</label>
              </div>
              <div className="w-2/3">
                <input
                  type="text"
                  value="http://localhost:6333/dashboard"
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
                CHECK CONNECTION
              </button>
              <button className="ml-2 bg-green-900/50 hover:bg-green-800/50 text-green-100 py-0.5 px-2 rounded text-[9px] font-medium">
                LAUNCH DASHBOARD
              </button>
            </div>
          </div>
          
          <div className="text-green-300 text-[9px] font-mono mt-1 border-t border-green-800/30 pt-2">
            <span className="text-green-400">NOTE:</span> The Qdrant dashboard provides a visual interface for managing collections and monitoring performance.
          </div>
        </div>
      </SettingsSection>
      
      {/* Search Configuration Section */}
      <SettingsSection title="Search Configuration" glowIntensity={glowIntensity}>
        <div className="text-white font-mono text-[10px] mb-2 border-b border-green-800/30 pb-1">
          <span className="text-green-400">STATUS:</span> Configured |
          <span className="text-green-400 ml-1">DEFAULT COLLECTION:</span> documents
        </div>
        
        <div className="grid grid-cols-1 gap-2">
          <div className="text-green-400 text-[10px] font-mono flex items-start">
            <span className="text-green-300 mr-1 mt-0.5"><QdrantIcons.Search /></span>
            <span>Configure vector search parameters and defaults</span>
          </div>
          
          <div className="border border-green-800/30 rounded bg-black/20 p-2">
            <div className="flex items-center mb-2">
              <span className="text-green-300 mr-1"><QdrantIcons.Settings /></span>
              <span className="text-green-200 text-[10px] uppercase font-mono font-bold">Search Parameters</span>
            </div>
            
            <div className="flex items-center mb-2">
              <div className="w-1/3">
                <label className="text-green-300 text-[10px] font-mono">Default Collection:</label>
              </div>
              <div className="w-2/3">
                <select className="bg-black/50 border border-green-800/50 rounded px-2 py-1 text-green-100 text-[10px] font-mono w-full">
                  {collections.map((collection, index) => (
                    <option key={index}>{collection.name}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex items-center mb-2">
              <div className="w-1/3">
                <label className="text-green-300 text-[10px] font-mono">Limit:</label>
              </div>
              <div className="w-2/3">
                <input
                  type="number"
                  value="10"
                  className="bg-black/50 border border-green-800/50 rounded px-2 py-1 text-green-100 text-[10px] font-mono w-full"
                />
              </div>
            </div>
            
            <div className="flex items-center mb-2">
              <div className="w-1/3">
                <label className="text-green-300 text-[10px] font-mono">Score Threshold:</label>
              </div>
              <div className="w-2/3">
                <input
                  type="number"
                  value="0.75"
                  step="0.01"
                  min="0"
                  max="1"
                  className="bg-black/50 border border-green-800/50 rounded px-2 py-1 text-green-100 text-[10px] font-mono w-full"
                />
              </div>
            </div>
            
            <div className="flex items-center mb-2">
              <div className="w-1/3">
                <label className="text-green-300 text-[10px] font-mono">Use Filtering:</label>
              </div>
              <div className="w-2/3 flex items-center">
                <label className="inline-flex items-center">
                  <input type="checkbox" className="form-checkbox h-3 w-3 text-green-600 rounded border-green-800" checked />
                  <span className="ml-1 text-green-200 text-[9px]">Enable payload filtering</span>
                </label>
              </div>
            </div>
            
            <div className="flex justify-end">
              <button className="bg-green-900/50 hover:bg-green-800/50 text-green-100 py-0.5 px-2 rounded text-[9px] font-medium">
                SAVE CONFIGURATION
              </button>
            </div>
          </div>
          
          <div className="border border-green-800/30 rounded bg-black/20 p-2">
            <div className="flex items-center mb-2">
              <span className="text-green-300 mr-1"><QdrantIcons.Metrics /></span>
              <span className="text-green-200 text-[10px] uppercase font-mono font-bold">Performance Metrics</span>
            </div>
            
            <div className="text-green-400 text-[9px] font-mono pl-4 mb-2">
              • Average query time: 12ms<br />
              • Queries per minute: 245<br />
              • Cache hit ratio: 68%<br />
              • Index size: 1.2 GB
            </div>
            
            <div className="flex justify-end">
              <button className="bg-green-900/50 hover:bg-green-800/50 text-green-100 py-0.5 px-2 rounded text-[9px] font-medium">
                VIEW DETAILED METRICS
              </button>
            </div>
          </div>
          
          <div className="text-green-300 text-[9px] font-mono mt-1 border-t border-green-800/30 pt-2">
            <span className="text-green-400">NOTE:</span> Qdrant is a vector database optimized for similarity search and vector embeddings storage.
          </div>
        </div>
      </SettingsSection>
    </div>
  )
}