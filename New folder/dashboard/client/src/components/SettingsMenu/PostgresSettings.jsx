import React, { useState, useEffect } from 'react'

// SVG Icons for Postgres settings
const PostgresIcons = {
  Database: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
    </svg>
  ),
  Table: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3h18v18H3zM3 9h18M9 21V9"></path>
    </svg>
  ),
  Performance: () => (
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
  Connection: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 11a9 9 0 0 1 9 9"></path>
      <path d="M4 4a16 16 0 0 1 16 16"></path>
      <circle cx="5" cy="19" r="2"></circle>
    </svg>
  ),
  Memory: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 19v-3"></path>
      <path d="M10 19v-3"></path>
      <path d="M14 19v-3"></path>
      <path d="M18 19v-3"></path>
      <rect x="4" y="4" width="16" height="12" rx="2"></rect>
      <path d="M4 8h16"></path>
      <path d="M4 12h16"></path>
    </svg>
  ),
  Backup: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
      <polyline points="17 8 12 3 7 8"></polyline>
      <line x1="12" y1="3" x2="12" y2="15"></line>
    </svg>
  ),
  Security: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
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

// Postgres Logo with glow effect
const PostgresLogo = ({ glowIntensity = 2 }) => (
  <div className="h-10 w-auto flex items-center justify-center">
    <div
      className="text-2xl font-bold text-green-400"
      style={{ filter: `drop-shadow(0 0 ${glowIntensity}px rgba(0, 255, 0, 0.7))` }}
    >
      Postgre<span className="text-green-200">SQL</span>
    </div>
  </div>
)

// Property Display with icons
const PostgresProperty = ({ label, value, icon }) => (
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

// Database table component
const DatabaseTable = ({ name, rows, size, glowIntensity = 2 }) => {
  return (
    <div className="border border-green-800/30 rounded bg-black/20 p-2 mb-2">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center">
          <span className="text-green-300 mr-1"><PostgresIcons.Table /></span>
          <span className="text-green-200 text-[10px] uppercase font-mono font-bold">{name}</span>
        </div>
        <span className="text-green-400 text-[9px] font-mono">{rows} rows</span>
      </div>
      
      <div className="text-green-400 text-[9px] font-mono pl-4 mb-2">
        • Size: {size}<br />
        • Last vacuum: 2 days ago<br />
        • Indexes: 3
      </div>
      
      <div className="flex justify-end space-x-1">
        <button className="bg-green-900/50 hover:bg-green-800/50 text-green-100 py-0.5 px-2 rounded text-[8px] font-medium flex items-center">
          <span className="mr-1"><PostgresIcons.Settings /></span>
          QUERY
        </button>
        <button className="bg-green-900/50 hover:bg-green-800/50 text-green-100 py-0.5 px-2 rounded text-[8px] font-medium flex items-center">
          <span className="mr-1"><PostgresIcons.Backup /></span>
          BACKUP
        </button>
      </div>
    </div>
  )
}

export default function PostgresSettings() {
  const [isCheckingForUpdates, setIsCheckingForUpdates] = useState(false)
  const [glowIntensity, setGlowIntensity] = useState(2)
  
  // Mock tables data
  const [tables, setTables] = useState([
    { name: 'users', rows: '1,245', size: '8.2 MB' },
    { name: 'documents', rows: '3,782', size: '24.5 MB' },
    { name: 'embeddings', rows: '12,892', size: '156.7 MB' }
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
  
  // Mock Postgres information
  const postgresInfo = {
    version: '14.5',
    lastUpdated: '2024-01-15',
    port: '5432',
    dbName: 'fluxx_db'
  }

  const handleCheckForUpdates = () => {
    setIsCheckingForUpdates(true)
    // Simulate update check
    setTimeout(() => {
      setIsCheckingForUpdates(false)
      alert('PostgreSQL is up to date!')
    }, 2000)
  }

  return (
    <div className="h-full p-2 overflow-y-auto">
      {/* Postgres logo and header */}
      <div className="flex items-center justify-between border-b border-green-800 pb-3 mb-4">
        <div>
          <h3 className="text-green-200 text-xl font-bold flex items-center tracking-wide">
            <span className="text-green-400 mr-2">▣</span>
            POSTGRESQL SETTINGS
          </h3>
          <p className="text-green-400 text-xs mt-0.5">Configure PostgreSQL database settings</p>
        </div>
        <PostgresLogo glowIntensity={glowIntensity} />
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
      
      {/* Database Configuration Section */}
      <SettingsSection title="Database Configuration" glowIntensity={glowIntensity}>
        <div className="text-white font-mono text-[10px] mb-2 border-b border-green-800/30 pb-1">
          <span className="text-green-400">STATUS:</span> Online |
          <span className="text-green-400 ml-1">VERSION:</span> {postgresInfo.version}
        </div>
        
        <div className="grid grid-cols-1 gap-2">
          <div className="text-green-400 text-[10px] font-mono flex items-start">
            <span className="text-green-300 mr-1 mt-0.5"><PostgresIcons.Database /></span>
            <span>Configure PostgreSQL database connection and settings</span>
          </div>
          
          <div className="border border-green-800/30 rounded bg-black/20 p-2">
            <div className="flex items-center mb-2">
              <span className="text-green-300 mr-1"><PostgresIcons.Connection /></span>
              <span className="text-green-200 text-[10px] uppercase font-mono font-bold">Connection Settings</span>
            </div>
            
            <div className="flex items-center mb-2">
              <div className="w-1/3">
                <label className="text-green-300 text-[10px] font-mono">Host:</label>
              </div>
              <div className="w-2/3">
                <input
                  type="text"
                  value="localhost"
                  className="bg-black/50 border border-green-800/50 rounded px-2 py-1 text-green-100 text-[10px] font-mono w-full"
                />
              </div>
            </div>
            
            <div className="flex items-center mb-2">
              <div className="w-1/3">
                <label className="text-green-300 text-[10px] font-mono">Port:</label>
              </div>
              <div className="w-2/3">
                <input
                  type="text"
                  value={postgresInfo.port}
                  className="bg-black/50 border border-green-800/50 rounded px-2 py-1 text-green-100 text-[10px] font-mono w-full"
                />
              </div>
            </div>
            
            <div className="flex items-center mb-2">
              <div className="w-1/3">
                <label className="text-green-300 text-[10px] font-mono">Database:</label>
              </div>
              <div className="w-2/3">
                <input
                  type="text"
                  value={postgresInfo.dbName}
                  className="bg-black/50 border border-green-800/50 rounded px-2 py-1 text-green-100 text-[10px] font-mono w-full"
                />
              </div>
            </div>
            
            <div className="flex items-center mb-2">
              <div className="w-1/3">
                <label className="text-green-300 text-[10px] font-mono">Username:</label>
              </div>
              <div className="w-2/3">
                <input
                  type="text"
                  value="postgres"
                  className="bg-black/50 border border-green-800/50 rounded px-2 py-1 text-green-100 text-[10px] font-mono w-full"
                />
              </div>
            </div>
            
            <div className="flex items-center mb-2">
              <div className="w-1/3">
                <label className="text-green-300 text-[10px] font-mono">Password:</label>
              </div>
              <div className="w-2/3">
                <input
                  type="password"
                  value="********"
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
          
          <div className="text-green-200 text-[10px] uppercase font-mono font-bold mb-1 border-b border-green-800/30 pb-1">
            Database Tables
          </div>
          
          {/* Table cards */}
          {tables.map((table, index) => (
            <DatabaseTable 
              key={index}
              name={table.name}
              rows={table.rows}
              size={table.size}
              glowIntensity={glowIntensity}
            />
          ))}
        </div>
      </SettingsSection>
      
      {/* Performance Monitoring Section */}
      <SettingsSection title="Performance Monitoring" glowIntensity={glowIntensity}>
        <div className="text-white font-mono text-[10px] mb-2 border-b border-green-800/30 pb-1">
          <span className="text-green-400">STATUS:</span> Active |
          <span className="text-green-400 ml-1">METRICS COLLECTION:</span> Enabled
        </div>
        
        <div className="grid grid-cols-1 gap-2">
          <div className="text-green-400 text-[10px] font-mono flex items-start">
            <span className="text-green-300 mr-1 mt-0.5"><PostgresIcons.Performance /></span>
            <span>Monitor and optimize PostgreSQL database performance</span>
          </div>
          
          <div className="border border-green-800/30 rounded bg-black/20 p-2">
            <div className="flex items-center mb-2">
              <span className="text-green-300 mr-1"><PostgresIcons.Metrics /></span>
              <span className="text-green-200 text-[10px] uppercase font-mono font-bold">Performance Metrics</span>
            </div>
            
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 mb-2">
              <PostgresProperty
                icon={<PostgresIcons.Settings />}
                label="QUERIES/SEC"
                value="24.5"
              />
              <PostgresProperty
                icon={<PostgresIcons.Memory />}
                label="MEMORY"
                value="256 MB"
              />
              <PostgresProperty
                icon={<PostgresIcons.Table />}
                label="TABLES"
                value={tables.length}
              />
              <PostgresProperty
                icon={<PostgresIcons.Connection />}
                label="CONNECTIONS"
                value="12/100"
              />
            </div>
            
            <div className="flex justify-end">
              <button className="bg-green-900/50 hover:bg-green-800/50 text-green-100 py-0.5 px-2 rounded text-[9px] font-medium">
                VIEW DETAILED METRICS
              </button>
            </div>
          </div>
          
          <div className="border border-green-800/30 rounded bg-black/20 p-2">
            <div className="flex items-center mb-2">
              <span className="text-green-300 mr-1"><PostgresIcons.Backup /></span>
              <span className="text-green-200 text-[10px] uppercase font-mono font-bold">Backup & Maintenance</span>
            </div>
            
            <div className="flex items-center mb-2">
              <div className="w-1/3">
                <label className="text-green-300 text-[10px] font-mono">Auto Vacuum:</label>
              </div>
              <div className="w-2/3 flex items-center">
                <label className="inline-flex items-center">
                  <input type="checkbox" className="form-checkbox h-3 w-3 text-green-600 rounded border-green-800" checked />
                  <span className="ml-1 text-green-200 text-[9px]">Enable automatic vacuuming</span>
                </label>
              </div>
            </div>
            
            <div className="flex items-center mb-2">
              <div className="w-1/3">
                <label className="text-green-300 text-[10px] font-mono">Auto Backup:</label>
              </div>
              <div className="w-2/3 flex items-center">
                <label className="inline-flex items-center">
                  <input type="checkbox" className="form-checkbox h-3 w-3 text-green-600 rounded border-green-800" checked />
                  <span className="ml-1 text-green-200 text-[9px]">Enable daily backups</span>
                </label>
              </div>
            </div>
            
            <div className="flex justify-end">
              <button className="bg-green-900/50 hover:bg-green-800/50 text-green-100 py-0.5 px-2 rounded text-[9px] font-medium">
                BACKUP NOW
              </button>
              <button className="ml-2 bg-green-900/50 hover:bg-green-800/50 text-green-100 py-0.5 px-2 rounded text-[9px] font-medium">
                SAVE SETTINGS
              </button>
            </div>
          </div>
          
          <div className="text-green-300 text-[9px] font-mono mt-1 border-t border-green-800/30 pt-2">
            <span className="text-green-400">NOTE:</span> Regular maintenance and backups are essential for optimal PostgreSQL performance.
          </div>
        </div>
      </SettingsSection>
    </div>
  )
}
