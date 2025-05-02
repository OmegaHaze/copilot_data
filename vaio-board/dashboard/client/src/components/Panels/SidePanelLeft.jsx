import { useState, useEffect, useRef } from 'react'
import HeaderAscii from '../Boot/HeaderAscii.jsx'
import { useSocket } from '../Panes/Utility/SocketContext'
import ModulePaneToggle from '../Panes/Utility/Loader/ModulePaneToggle.jsx'



export default function SidePanelLeft({ show, toggle }) {
  const panelRef = useRef(null)
  const [width, setWidth] = useState(290)
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
  const panelWidth = isMobile ? '100vw' : `${width}px`
  const [modulesOpen, setModulesOpen] = useState(false)
  const [activeModule, setActiveModule] = useState(null)
  const [showPaneCreator, setShowPaneCreator] = useState(false)
  const { services } = useSocket()
  const [systemStatus, setSystemStatus] = useState({ allNominal: true, notRunning: [] })
  const [tabIcon, setTabIcon] = useState('☰')
  const [showTooltip, setShowTooltip] = useState(false)
  const [tooltipShownBefore, setTooltipShownBefore] = useState(false)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })
  
  // Check filtered system status from services data
  useEffect(() => {
    if (!services || !Array.isArray(services)) return;
  
    const filtered = services.filter(svc => 
      svc.module_type === 'user' || 
      ['supervisor', 'nvidia'].includes(svc.name) || 
      svc.status !== 'UNKNOWN'
    );
  
    const notRunningServices = filtered
      .filter(service => service.status !== 'RUNNING' && service.name !== 'supervisor')
      .map(service => service.name.toUpperCase());
  
    setSystemStatus({
      allNominal: notRunningServices.length === 0,
      notRunning: notRunningServices
    });
  }, [services]);
  

  const handleDouble = () => {
    if (isMobile) toggle()
  }

  const handleModuleClick = (moduleName) => {
    if (activeModule === moduleName) {
      setActiveModule(null)
    } else {
      setActiveModule(moduleName)
    }
  }

  const renderModuleContent = () => {
    switch (activeModule) {
      case 'pane':
        return (
          <div className="p-3 text-xs text-muted">
            Pane Creator is now accessed via a modal. Click [+] PANE to launch.
          </div>
        )
      
      case 'stud1':
        return (
          <div className=" p-3">
            <div className="crt-text4 text-xs">
              <p>STUD1 Module Content</p>
              <p className="mt-2">This is a placeholder for the STUD1 module content.</p>
            </div>
          </div>
        )
      case 'stud2':
        return (
          <div className=" p-3">
            <div className="crt-text4 text-xs">
              <p>STUD2 Module Content</p>
              <p className="mt-2">This is a placeholder for the STUD2 module content.</p>
              <div className="flex space-x-2 mt-3">
                <button className="crt-border6 crt-link5 px-2 py-1 text-xs">Option 1</button>
                <button className="crt-border6 crt-link5 px-2 py-1 text-xs">Option 2</button>
              </div>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <>
      {showTooltip && (
        <div 
          className="fixed text-green-400 text-xs pointer-events-none z-[9999]"
          style={{ 
            left: `${tooltipPosition.x}px`, 
            top: `${tooltipPosition.y}px`,
            textShadow: '0 0 5px rgba(0,255,0,0.7)'
          }}
        >
          DRAG
        </div>
      )}
      <div
        id="left-panel"
        ref={panelRef}
        className={`
          fixed top-0 left-0 h-full shadow-inner crt-border-r  z-40
          transition-all duration-300 ease-in-out bg-black/20 backdrop-blur-sm
          ${show ? 'translate-x-0' : '-translate-x-full'}
        `}
        style={{ width: panelWidth }}
      >
      {/* No edge drag handle needed anymore */}

      {/* Toggle Tab with drag functionality */}
      <div
        className="hidden md:flex items-center justify-center opacity-70 absolute crt-panel-tab8 right-[-32px] rounded-r hover-cursor opacity-80 select-none hover:shadow-[0_0_10px_rgba(0,255,0,0.4)]"
        onMouseEnter={() => {
          // Change icon immediately on hover
          setTabIcon('➤');
          // Only show tooltip if it hasn't been shown before
          if (!tooltipShownBefore) {
            setShowTooltip(true);
          }
        }}
        onMouseLeave={() => {
          // Reset the icon when mouse leaves
          setTabIcon('☰');
          
          // If tooltip is currently showing, mark it as shown before
          if (showTooltip) {
            setTooltipShownBefore(true);
          }
          
          setShowTooltip(false);
        }}
        onMouseMove={(e) => {
          setTooltipPosition({ x: e.clientX + 0, y: e.clientY - 10 });
        }}
        onMouseDown={(e) => {
          // Prevent default behavior to avoid text selection
          e.preventDefault();
          
          // Track if this is a click or drag
          let isDragging = false;
          const initialX = e.clientX;
          const initialWidth = width;
          
          // Create a style element to disable text selection during drag
          const disableSelectionStyle = document.createElement('style');
          disableSelectionStyle.innerHTML = `
            * { 
              user-select: none !important; 
              -webkit-user-select: none !important;
              -moz-user-select: none !important;
              -ms-user-select: none !important;
            }
          `;
          document.head.appendChild(disableSelectionStyle);
          
          const mouseMoveHandler = (moveEvent) => {
            // Once we move more than a few pixels, consider it a drag
            if (Math.abs(moveEvent.clientX - initialX) > 3) {
              isDragging = true;
              const newWidth = initialWidth + (moveEvent.clientX - initialX);
              if (newWidth >= 240 && newWidth <= window.innerWidth * 0.8) {
                setWidth(newWidth);
              }
            }
          };
          
          const mouseUpHandler = (upEvent) => {
            // Clean up event listeners
            document.removeEventListener('mousemove', mouseMoveHandler);
            document.removeEventListener('mouseup', mouseUpHandler);
            
            // Remove the style that disables selection
            document.head.removeChild(disableSelectionStyle);
            
            // Only toggle panel if user didn't drag (just clicked)
            if (!isDragging) {
              toggle();
            }
          };
          
          // Add event listeners for mouse move and up
          document.addEventListener('mousemove', mouseMoveHandler);
          document.addEventListener('mouseup', mouseUpHandler);
        }}
      >
        {tabIcon}
      </div>

      {!isMobile && (
        <div
          className="crt-text4 hover-cursor absolute top-2 left-2"
          title={width > 290 ? 'Contract panel' : 'Expand to 1/3 screen'}
          onClick={() => {
            const expanded = Math.floor(window.innerWidth / 3)
            const defaultWidth = 290
            const newWidth = width > defaultWidth ? defaultWidth : expanded
            setWidth(newWidth)
            if (panelRef.current) panelRef.current.style.width = `${newWidth}px`
          }}
        >
          {width > 290 ? '⇤' : '⇥'}
        </div>
      )}

      {/* Header ASCII + Double Tap */}
      <div onDoubleClick={handleDouble} onTouchEnd={handleDouble}>
        <HeaderAscii />
      </div>

      <div className="crt-text4 text-xs crt-border-b m-2">RAG SYSTEM PANEL</div>

      {/* System Stats Section */}
      <div className="mb-4">
        {/* System Status Indicator */}
        <div className={`text-xs mb-1 pl-1 flex items-center ${systemStatus.allNominal ? 'crt-text4' : 'text-red-400'}`}>
          <span className={`mr-1 ${systemStatus.allNominal ? '' : 'animate-pulse'}`}>
            {systemStatus.allNominal ? '✔' : '⚠'}
          </span>
          {systemStatus.allNominal ? (
            <span>SYSTEMS NOMINAL</span>
          ) : (
            <div>
              <span>SYSTEM ALERT: </span>
              <span className="text-yellow-400">
                {systemStatus.notRunning.join(', ')} {systemStatus.notRunning.length === 1 ? 'is' : 'are'} not running
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Service Links Section */}
      <div className="space-y-2 mb-4">
        {/* OpenWebUI Link */}
        <a href="http://localhost:7500" target="_blank" rel="noopener noreferrer" className="flex items-center crt-link5 p-1 rounded">
          <div className="w-10 h-10 mr-2 flex items-center justify-center crt-border6 rounded">
            <span className="crt-text4 ">◯|</span>
          </div>
          <span className="text-xs">LAUNCH OPENWEBUI WINDOW</span>
        </a>

        {/* ComfyUI Link */}
        <a href="http://localhost:8188" target="_blank" rel="noopener noreferrer" className="flex items-center crt-link5 p-1 rounded">
          <div className="w-10 h-10 mr-2 flex items-center justify-center crt-border6 rounded">
            <span className="crt-text4">CUI</span>
          </div>
          <span className="text-xs">LAUNCH COMFYUI WINDOW</span>
        </a>

        {/* N8N Link */}
        <a href="http://localhost:5678" target="_blank" rel="noopener noreferrer" className="flex items-center crt-link5 p-1 rounded">
          <div className="w-10 h-10 mr-2 flex items-center justify-center crt-border6 rounded">
            <span className="crt-text4">n8n</span>
          </div>
          <span className="text-xs">LAUNCH N8N WINDOW</span>
        </a>

        {/* Qdrant Link */}
        <a href="http://localhost:6335" target="_blank" rel="noopener noreferrer" className="flex items-center crt-link5 p-1 rounded">
          <div className="w-10 h-10 mr-2 flex items-center justify-center crt-border6 rounded">
            <span className="crt-text4">qd</span>
          </div>
          <span className="text-xs">LAUNCH QDRANT WINDOW</span>
        </a>
      </div>

{/* MODULES Accordion */}
<div className="absolute transition-all w-full  duration-300 ease-in-out bottom-0 left-0 bg-black/30 backdrop-blur-sm">
  <button 
    onClick={() => setModulesOpen(!modulesOpen)}
    className="w-full crt-text4 crt-link5 flex justify-between items-center px-2 py-1"
  >
    <span>MODULES</span>
    <span>{modulesOpen ? '▽' : '△'}</span>
  </button>
  
  {/* Modules Menu */}
  {modulesOpen && (
    <div className="shadow-lg crt-text4 transition-all duration-300 ease-in-out">
      {/* +Pane Button */}
      <div>
        <button 
          onClick={() => handleModuleClick('pane')} 
          className={`w-full px-2 py-1 text-left crt-link5 flex justify-between items-center`}
        >
          <span>[+] PANE</span>
          <span>{activeModule === 'pane' ? '▽' : '▷'}</span>
        </button>
         {activeModule === 'pane' && (
             <div className="px-2 py-1">
              <ModulePaneToggle slug="supervisor" label="Supervisor Pane" />
              <ModulePaneToggle slug="nvidia" label="NVIDIA GPU Pane" />
              
              {/* Layout Cleaning Button - styled to match your UI */}
              <div className="mt-3 border-t border-green-800/30 pt-2">
                <button
                  onClick={async () => {
                    try {
                      const res = await fetch('/api/user/layouts/session/clean', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' }
                      });
                      const data = await res.json();
                      
                      if (data.status === 'success') {
                        // Show success message and reload after 1s
                        if (window.vaioDebug) {
                          window.vaioDebug.show(`✅ Layout cleaned: ${data.changes} duplicates removed`, 'success', 5000);
                        } else {
                          alert(`Layout cleaned: ${data.changes} duplicates removed`);
                        }
                        
                        // Reload the page after a short delay
                        setTimeout(() => window.location.reload(), 1000);
                      } else {
                        if (window.vaioDebug) {
                          window.vaioDebug.show(`⚠️ ${data.message || 'No changes needed'}`, 'warning', 5000);
                        } else {
                          alert(data.message || 'No changes needed');
                        }
                      }
                    } catch (err) {
                      console.error('Error cleaning layout:', err);
                      if (window.vaioDebug) {
                        window.vaioDebug.show(`🛑 Error cleaning layout: ${err.message}`, 'error', 5000);
                      } else {
                        alert(`Error cleaning layout: ${err.message}`);
                      }
                    }
                  }}
                  className="flex items-center w-full crt-link5 p-1 rounded hover:bg-green-900/20"
                >
                  <div className="w-8 h-8 mr-2 flex items-center justify-center crt-border6 rounded">
                    <span className="crt-text4">🧹</span>
                  </div>
                  <span className="text-xs">CLEAN LAYOUT DUPLICATES</span>
                </button>

                <button
                  onClick={async () => {
                    try {
                      if (confirm("This will reset your layout to default settings. Continue?")) {
                        const res = await fetch('/api/user/session/reset', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' }
                        });
                        const data = await res.json();
                        
                        if (data.status === 'success') {
                          // Show success message and reload after 1s
                          if (window.vaioDebug) {
                            window.vaioDebug.show(`✅ Layout reset: ${data.message}`, 'success', 5000);
                          } else {
                            alert(`Layout reset: ${data.message}`);
                          }
                          
                          // Reload the page after a short delay
                          setTimeout(() => window.location.reload(), 1000);
                        }
                      }
                    } catch (err) {
                      console.error('Error resetting layout:', err);
                      if (window.vaioDebug) {
                        window.vaioDebug.show(`🛑 Error resetting layout: ${err.message}`, 'error', 5000);
                      } else {
                        alert(`Error resetting layout: ${err.message}`);
                      }
                    }
                  }}
                  className="flex items-center w-full crt-link5 p-1 rounded hover:bg-green-900/20 mt-2"
                >
                  <div className="w-8 h-8 mr-2 flex items-center justify-center crt-border6 rounded">
                    <span className="crt-text4">🔄</span>
                  </div>
                  <span className="text-xs">RESET LAYOUT (NUCLEAR OPTION)</span>
                </button>
              </div>

                      </div>
        )}
      </div>
      
      {/* STUD1 Button */}
      <div>
        <button 
          onClick={() => handleModuleClick('stud1')}
          className={`w-full px-2 py-1 text-left crt-link5 flex justify-between items-center`}
        >
          <span>[STUD]</span>
          <span>{activeModule === 'stud1' ? '▽' : '▷'}</span>
        </button>
        {activeModule === 'stud1' && renderModuleContent()}
      </div>
      
      {/* STUD2 Button */}
      <div>
        <button
          onClick={() => handleModuleClick('stud2')}
          className={`w-full px-2 py-1 text-left crt-link5 flex justify-between items-center`}
        >
          <span>[STUD]</span>
          <span>{activeModule === 'stud2' ? '▽' : '▷'}</span>
        </button>
        {activeModule === 'stud2' && renderModuleContent()}
      </div>
    </div>
  )}
</div>
    </div>

   </>
  )
}
