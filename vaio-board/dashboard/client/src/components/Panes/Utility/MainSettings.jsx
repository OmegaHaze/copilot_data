import { useContext, useState, useEffect, useCallback } from 'react'
import { SettingsContext } from '../../SettingsMenu/SettingsContext.jsx'
import CRTEffects from '../../Services/CRT-Effects.jsx'
import DefaultPanesSettingsMenu from '../../SettingsMenu/DefaultPanesSettingsMenu.jsx'

// Define configuration and settings content for all services
const SERVICES = {
  // System
  GENERAL: {
    title: 'General Settings',
    icon: 'settings',
    description: 'System-wide settings and configuration options',
  },
  SUPERVISOR: {
    title: 'Supervisor',
    icon: 'monitor',
    description: 'Control and manage system services',
  },
  NVIDIA: {
    title: 'NVIDIA',
    icon: 'gpu',
    description: 'GPU settings and monitoring',
  },
  
  // AI Services
  COMFYUI: {
    title: 'ComfyUI',
    icon: 'image',
    description: 'AI image generation interface',
  },
  OPENWEBUI: {
    title: 'OpenWebUI',
    icon: 'chat',
    description: 'Web interface for AI models',
  },
  OLLAMA: {
    title: 'Ollama',
    icon: 'brain',
    description: 'Local large language model runner',
  },
  
  // Database Services
  QDRANT: {
    title: 'Qdrant',
    icon: 'database',
    description: 'Vector database engine',
  },
  QDRANT_DASHBOARD: {
    title: 'Qdrant Dashboard',
    icon: 'layout',
    description: 'Qdrant web management UI',
  },
  POSTGRES: {
    title: 'Postgres',
    icon: 'database-backup',
    description: 'SQL database server',
  },
  
  // Automation
  N8N: {
    title: 'N8N',
    icon: 'workflow',
    description: 'Workflow automation platform',
  }
}

// Mapping from pane names (lowercase) to their corresponding settings tabs
const PANE_MAP = {
  'supervisor': 'SUPERVISOR',
  'nvidia': 'NVIDIA',
  'comfyui': 'COMFYUI',
  'openwebui': 'OPENWEBUI',
  'openwebui_backend': 'OPENWEBUI',
  'ollama': 'OLLAMA',
  'qdrant': 'QDRANT',
  'qdrant_dashboard': 'QDRANT_DASHBOARD',
  'postgres': 'POSTGRES',
  'postgresql': 'POSTGRES',
  'postgre': 'POSTGRES',
  'n8n': 'N8N'
}

// Group settings tabs by category for better organization
const CATEGORIES = [
  {
    name: 'System',
    tabs: ['GENERAL', 'SUPERVISOR', 'NVIDIA']
  },
  {
    name: 'AI Services',
    tabs: ['COMFYUI', 'OPENWEBUI', 'OLLAMA']
  },
  {
    name: 'Database',
    tabs: ['QDRANT', 'QDRANT_DASHBOARD', 'POSTGRES']
  },
  {
    name: 'Automation',
    tabs: ['N8N']
  }
]

// Icons for each service (simplified SVG paths)
const ICONS = {
  settings: <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.6v-.09A2 2 0 0 1 11 3a2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z" />,
  monitor: <path d="M8 21h8 M12 17v4 M12 3a9 9 0 0 1 9 9h-9V3z M3 12h9V3a9 9 0 0 0-9 9z M3 16h18" />,
  gpu: <path d="M5 7v12a1 1 0 001 1h12a1 1 0 001-1V7a1 1 0 00-1-1H6a1 1 0 00-1 1z M9 11h6 M8 15h8" />,
  image: <path d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z M9 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z M21 15l-5-5L5 21" />,
  chat: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10Z M8 10h.01 M12 10h.01 M16 10h.01" />,
  brain: <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5V6a2 2 0 0 1-2 2H6a2 2 0 0 0-2 2v1a2 2 0 0 0 2 2h.5a2.5 2.5 0 0 1 2.5 2.5c0 .431-.122.835-.335 1.176A2 2 0 0 1 6 16v1a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-.5a2.5 2.5 0 0 1 2.5-2.5 2.5 2.5 0 0 1 2.5 2.5c0 .431-.122.835-.335 1.176A2 2 0 0 1 16 19h2a2 2 0 0 0 2-2v-1a2 2 0 0 0-2-2h-.5a2.5 2.5 0 0 1-2.5-2.5 2.5 2.5 0 0 1 2.5-2.5H18a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-4a2 2 0 0 1-2-2" />,
  database: <path d="M12 8c4.4 0 8-1.8 8-4s-3.6-4-8-4-8 1.8-8 4 3.6 4 8 4Z M4 6v6c0 2.2 3.6 4 8 4s8-1.8 8-4V6 M4 12v6c0 2.2 3.6 4 8 4s8-1.8 8-4v-6" />,
  layout: <path d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z M3 9h18 M9 21V9" />,
  "database-backup": <path d="M12 8c4.4 0 8-1.8 8-4s-3.6-4-8-4-8 1.8-8 4 3.6 4 8 4Z M20 12V6 M4 6v14c0 1.1.9 2 2 2h9 M18 16v6 M21 16l-3-3-3 3" />,
  workflow: <path d="M5 3a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H5z M7 9h2 M7 13h2 M7 17h2 M14 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4z M16 17a2 2 0 1 0-4 0 2 2 0 0 0 4 0z" />,
  close: <path d="M18 6L6 18 M6 6l12 12" />
}

export default function PaneHeaderSettings() {
  const { visible, pane, close } = useContext(SettingsContext)
  const [activeTab, setActiveTab] = useState('GENERAL')
  const [isClosing, setIsClosing] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [introAnimationComplete, setIntroAnimationComplete] = useState(false)
  
  // Map pane name to corresponding tab
  const mapPaneToTab = useCallback((paneName) => {
    if (!paneName) return 'GENERAL'
    
    // Convert to lowercase for case-insensitive matching
    const normalizedName = paneName.toLowerCase()
    const mappedTab = PANE_MAP[normalizedName]
    
    // Debug for mapping issues
    console.log(`Mapping pane name: '${normalizedName}' to tab: '${mappedTab || 'GENERAL'}'`)
    
    return mappedTab || 'GENERAL'
  }, [])
  
  // Handle closing animation
  const handleClose = useCallback(() => {
    setIsClosing(true)
    setTimeout(() => {
      setIsClosing(false)
      close()
    }, 300)
  }, [close])
  
  // Handle ESC key to close settings
  useEffect(() => {
    const handleEscKey = (e) => {
      if (visible && e.key === 'Escape') handleClose()
    }
    
    window.addEventListener('keydown', handleEscKey)
    return () => window.removeEventListener('keydown', handleEscKey)
  }, [visible, handleClose])
  
  // Set active tab when pane changes
  useEffect(() => {
    if (pane) {
      const mappedTab = mapPaneToTab(pane)
      setActiveTab(mappedTab)
      console.log(`Settings: mapping pane "${pane}" to tab "${mappedTab}"`)
      
      // Reset intro animation when panel opens with new pane
      setIntroAnimationComplete(false)
      setTimeout(() => setIntroAnimationComplete(true), 1500)
    }
  }, [pane, mapPaneToTab])

  // Handle window resize for responsive layout
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  
  // Background click handler
  const handleBackgroundClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }

  // If settings are not visible, return null
  if (!visible || !pane) return null
  
  return (
    <>
      {/* Overlay with CRT effect */}
      <div 
        className="fixed inset-0 z-[998] bg-black/30 backdrop-blur-[1.5px]"
        onClick={handleBackgroundClick}
      >
        <CRTEffects isActive={true} />
      </div>
      
      {/* Settings modal - improved responsiveness */}
      <div 
        className={`fixed top-1/2 left-1/2 
                   md:w-[700px] w-[95%] h-[85vh] md:h-[600px] 
                   bg-black/60 backdrop-blur-[1.5px] overflow-hidden border border-green-700/50
                   rounded-sm shadow-2xl shadow-green-900/40
                   transform -translate-x-1/2 -translate-y-1/2 z-[999]
                   transition-all duration-300 ease-out
                   ${isClosing ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-3 border-b border-green-800/50">
          <div>
            <h2 className="text-green-300 font-medium text-lg intro-text" style={{"--delay": "0"}}>
              {SERVICES[activeTab]?.title || 'Settings'}
            </h2>
            <p className={`text-green-500/80 text-xs ${!introAnimationComplete ? 'intro-text' : ''}`} 
               style={{"--delay": "1"}}>
              {SERVICES[activeTab]?.description || 'Configure system settings and preferences'}
            </p>
          </div>
          
          {/* Close button */}
          <button 
            onClick={handleClose}
            className="p-1.5 rounded-full bg-green-900/20 hover:bg-green-900/40 text-green-400
                     transition-colors duration-200"
            aria-label="Close settings"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" 
                 className="w-5 h-5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {ICONS.close}
            </svg>
          </button>
        </div>
        
        {/* Content area with sidebar */}
        <div className="flex h-[calc(100%-56px)] ml-3">
          {/* Navigation sidebar */}
          <div className={`${isMobile ? 'w-[80px]' : 'w-[200px]'} h-full border-r border-green-800/50 bg-black/40`}>
            <div className="h-full overflow-y-auto scroll-panel">
              {CATEGORIES.map((category, idx) => (
                <div key={idx} className="px-2 py-3">
                  <h4 className={`text-green-400 ${isMobile ? 'text-[10px] text-center' : 'text-xs'} font-medium mb-2 uppercase tracking-wide ${!introAnimationComplete ? 'intro-text' : ''}`}
                     style={{"--delay": String(2 + idx)}}>
                    {category.name}
                  </h4>
                  <div className={`space-y-1 ${isMobile ? 'flex flex-col items-center' : ''}`}>
                    {category.tabs.map((tab, tabIdx) => {
                      const service = SERVICES[tab]
                      return (
                        <button
                          key={tab}
                          onClick={() => setActiveTab(tab)}
                          className={`flex ${isMobile ? 'flex-col items-center justify-center w-12 h-12' : 'items-center w-full py-1.5 pl-2'} 
                                    rounded ${activeTab === tab ? 'bg-green-900/40 text-green-200' : 'hover:bg-green-900/20 text-green-400'}
                                    transition-colors duration-200 ${!introAnimationComplete ? 'intro-text' : ''}`}
                          style={{"--delay": String(3 + idx + (tabIdx * 0.5))}}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" 
                              className={`${isMobile ? 'w-5 h-5 mb-1' : 'w-4 h-4 mr-3'}`} 
                              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            {ICONS[service.icon]}
                          </svg>
                          <span className={`${isMobile ? 'text-[9px]' : 'text-sm'}`}>
                            {service.title.split(' ')[0]}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Main content area - uses scroll-panel class for scrollbars */}
          <div className="flex-1 h-full overflow-hidden">
            <div className="w-full h-full overflow-y-auto scroll-panel p-2">
              <DefaultPanesSettingsMenu activeTab={activeTab} />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
