import React from 'react'
import TerminalIcons from './TerminalIcons'

/**
 * Terminal header component with settings menu
 */
const TerminalHeader = ({ 
  showSettings, 
  toggleSettings, 
  toggleSearch, 
  toggleAutoScroll, 
  clearLogs, 
  copyToClipboard, 
  exportLogs, 
  isAutoScroll, 
  showSearch, 
  showAdvancedSearch, 
  toggleAdvancedSearch,
  fontSize,
  setFontSize,
  terminalTheme,
  setTerminalTheme,
  processedLogs
}) => {
  // Add click outside handler to close settings menu
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if settings menu is open and click is outside
      if (showSettings && !event.target.closest('.settings-menu-container')) {
        toggleSettings()
      }
    }
    
    // Add event listener
    document.addEventListener('mousedown', handleClickOutside)
    
    // Clean up
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showSettings, toggleSettings])
  return (
    <div className="crt-link5 text-[10px] leading-tight pt-2 crt-border-b mt-2 flex justify-between items-center " style={{ maxWidth: '100%' }}>
      <div className="flex items-center">
        <span className="crt-text5 mr-1"><TerminalIcons.Terminal /></span>
        <span>vAio SERVER TERMINAL</span>
        {/* Status indicator showing if AI analysis is active */}
        <span className="ml-2 px-1 text-[8px] rounded crt-bg-blk">
          <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1"></span>
          ACTIVE
        </span>
      </div>
      
      {/* Single gear icon for settings */}
      <div className="relative">
        <button
          onClick={toggleSettings}
          className={`transition-colors hover:text-blue-400 ${showSettings ? 'text-blue-400' : ''}`}
          title="Terminal settings"
        >
          <span className="crt-text5">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
          </span>
        </button>

        {/* Settings popout menu - positioned at bottom right of gear icon */}
        {showSettings && (
          <div className="absolute right-0 top-full mt-1 z-10 crt-border-inner7 rounded shadow-lg p-2 w-48 settings-menu-container"
               style={{
                 backgroundColor: '#000',
                 boxShadow: 'inset 0 0 10px #39ff141a, 0 0 15px #39ff1426'
               }}>
            <div className="text-[10px] crt-text5 mb-2 pb-1 crt-border-b">TERMINAL SETTINGS</div>
            
            <div className="grid grid-cols-1 gap-2">
              {/* Search option */}
              <button
                onClick={toggleSearch}
                className="flex items-center justify-between crt-link5 p-1 rounded"
              >
                <span className="flex items-center">
                  <span className="crt-text5 mr-2"><TerminalIcons.Search /></span>
                  <span className="text-[10px]">Search</span>
                </span>
                <span className={`w-2 h-2 rounded-full ${showSearch ? 'bg-green-500' : 'bg-gray-700'}`}></span>
              </button>
              
              {/* Advanced search option */}
              <button
                onClick={toggleAdvancedSearch}
                className="flex items-center justify-between crt-link5 p-1 rounded"
              >
                <span className="flex items-center">
                  <span className="crt-text5 mr-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8"></circle>
                      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                      <path d="M11 8v6"></path>
                      <path d="M8 11h6"></path>
                    </svg>
                  </span>
                  <span className="text-[10px]">Advanced Search</span>
                </span>
                <span className={`w-2 h-2 rounded-full ${showAdvancedSearch ? 'bg-green-500' : 'bg-gray-700'}`}></span>
              </button>
              
              {/* Auto-scroll option */}
              <button
                onClick={toggleAutoScroll}
                className="flex items-center justify-between crt-link5 p-1 rounded"
              >
                <span className="flex items-center">
                  <span className="crt-text5 mr-2"><TerminalIcons.AutoScroll /></span>
                  <span className="text-[10px]">Auto-scroll</span>
                </span>
                <span className={`w-2 h-2 rounded-full ${isAutoScroll ? 'bg-green-500' : 'bg-gray-700'}`}></span>
              </button>
              
              {/* Clear logs option */}
              <button
                onClick={clearLogs}
                className="flex items-center justify-between crt-link5 p-1 rounded"
              >
                <span className="flex items-center">
                  <span className="crt-text5 mr-2"><TerminalIcons.Clear /></span>
                  <span className="text-[10px]">Clear Logs</span>
                </span>
              </button>
              
              {/* Copy logs option */}
              <button
                onClick={() => copyToClipboard(processedLogs)}
                className="flex items-center justify-between crt-link5 p-1 rounded"
              >
                <span className="flex items-center">
                  <span className="crt-text5 mr-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                  </span>
                  <span className="text-[10px]">Copy Logs</span>
                </span>
              </button>
              
              {/* Export logs option */}
              <button
                onClick={exportLogs}
                className="flex items-center justify-between crt-link5 p-1 rounded"
              >
                <span className="flex items-center">
                  <span className="crt-text5 mr-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="7 10 12 15 17 10"></polyline>
                      <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                  </span>
                  <span className="text-[10px]">Export Logs</span>
                </span>
              </button>
              
              {/* Font size controls */}
              <div className="flex items-center justify-between crt-link5 p-1 rounded">
                <span className="text-[10px]">Font Size</span>
                <div className="flex items-center">
                  <button 
                    onClick={() => setFontSize(Math.max(8, fontSize - 1))}
                    className="w-5 h-5 flex items-center justify-center crt-bg-blk hover:bg-green-900/30 rounded crt-border-inner7"
                  >-</button>
                  <span className="mx-1 text-[10px] crt-text4">{fontSize}</span>
                  <button 
                    onClick={() => setFontSize(Math.min(14, fontSize + 1))}
                    className="w-5 h-5 flex items-center justify-center crt-bg-blk hover:bg-green-900/30 rounded crt-border-inner7"
                  >+</button>
                </div>
              </div>
              
              {/* Theme selection */}
              <div className="flex items-center justify-between crt-link5 p-1 rounded">
                <span className="text-[10px]">Theme</span>
                <select
                  value={terminalTheme}
                  onChange={(e) => setTerminalTheme(e.target.value)}
                  className="crt-bg-blk border-none outline-none text-[10px] crt-text5 crt-border-inner7 px-1 rounded"
                  style={{ backgroundColor: '#000' }}
                >
                  <option value="default" className="crt-bg-blk">Default</option>
                  <option value="matrix" className="crt-bg-blk">Matrix</option>
                  <option value="midnight" className="crt-bg-blk">Midnight</option>
                  <option value="amber" className="crt-bg-blk">Amber</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default TerminalHeader