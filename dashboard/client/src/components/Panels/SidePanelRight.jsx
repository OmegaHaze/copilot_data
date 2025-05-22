import { useEffect, useState, useRef } from 'react'
import TerminalPane from './panel-modules/TerminalPane'
import ServerTerminal from './panel-modules/ServerTerminal'
import PanelSetting from './panel-modules/PanelSetting'
import CPUGraph from './panel-modules/CpuGraph/CPUGraph'
import NetworkGraph from './panel-modules/NetworkGraph/NetworkGraph'
import SysInfo from './panel-modules/SysInformantion'
import TerminalIcons from '../Panels/panel-modules/assets/TerminalIcons'
// import CPUGraphVisx from './panel-modules/CPUGraphVisx'

export default function SidePanelRight({ show, toggle, onReset }) {
  const panelRef = useRef(null)
  // const socketRef = useRef(null)
  const terminalPaneRef = useRef(null)
  const [width, setWidth] = useState(300)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [activeExplanation, setActiveExplanation] = useState(null)
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
  const panelWidth = isMobile ? '100vw' : `${width}px`
  const [graphType, setGraphType] = useState('cpu') // 'cpu' or 'network'
  const [isGraphExpanded, setIsGraphExpanded] = useState(false) // track if graph is expanded
  const [tabIcon, setTabIcon] = useState('☰')
  const [showTooltip, setShowTooltip] = useState(false)
  const [tooltipShownBefore, setTooltipShownBefore] = useState(false)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })

  // Get diagnostic data from our dedicated hook
  // const { stats, recentEvents } = useDiagnostics()
// No longer need the socket connection for logs as it's handled in ServerTerminal

  const handleDouble = () => {
    if (isMobile) toggle()
  }

  // No edge drag handlers needed anymore

  useEffect(() => {
    return () => {
      // Keep the cleanup empty, but maintain the effect for consistency
    };
  }, []);

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
        id="right-panel"
        ref={panelRef}
        className={`
          fixed top-0 right-0 h-full crt-border-l shadow-inner z-40 text-xs crt-text4
          transition-all duration-300 ease-in-out flex flex-col bg-black/20 backdrop-blur-sm
          ${show ? 'translate-x-0' : 'translate-x-full'} `}
        style={{ width: panelWidth}}
      >

      {/* No edge drag handle needed anymore */}
      
      {/* Toggle Tab with drag functionality */}
      <div
        className="hidden md:flex items-center justify-center opacity-70 absolute top-4 left-[-32px] bg-green-800 text-black text-xs font-bold px-2 py-1 rounded-l shadow-lg z-50 move-cursor select-none hover:shadow-[0_0_10px_rgba(0,255,0,0.4)]"
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
          // Prevent default behavior and stop propagation to avoid text selection and terminal input
          e.preventDefault();
          e.stopPropagation();
          
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
              pointer-events: none !important;
            }
            #right-panel, #right-panel * {
              pointer-events: auto !important;
            }
          `;
          document.head.appendChild(disableSelectionStyle);
          
          const mouseMoveHandler = (moveEvent) => {
            // Once we move more than a few pixels, consider it a drag
            if (Math.abs(moveEvent.clientX - initialX) > 3) {
              isDragging = true;
              const newWidth = window.innerWidth - moveEvent.clientX;
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
        {tabIcon === '➤' ? (
          <span style={{ display: 'inline-block', transform: 'rotate(180deg)' }}>
            {tabIcon}
          </span>
        ) : (
          tabIcon
        )}
      </div>
      
      {/* Expand Button */}
      {!isMobile && (
        <div
          className="crt-text4 hover-cursor absolute top-2 right-2"
          title={width > 300 ? 'Contract panel' : 'Expand to 1/3 screen'}
          onClick={() => {
            const expanded = Math.floor(window.innerWidth / 3)
            const defaultWidth = 300
            const newWidth = width > defaultWidth ? defaultWidth : expanded
            setWidth(newWidth)
            if (panelRef.current) panelRef.current.style.width = `${newWidth}px`
          }}
        >
          {width > 300 ? '⇥' : '⇤'}
        </div>
      )}
      
      {/* Header + Double Tap Close */}
      <div onDoubleClick={handleDouble} onTouchEnd={handleDouble}>
        <div className="text-[10px] crt-border-b p-2  ">
          ENV CONTROL PANEL
        </div>
      </div>
      
      <div className="flex flex-col overflow-y-auto flex-grow h-full">
        {/* Panel Contents */}
        <div className="flex flex-col h-full p-2" style={{
          transition: 'all 0.3s ease-in-out'
        }}>
          {/* Section 1: Graph Display - Fixed at the top with expandable height */}
          <div className="w-full flex-shrink-0">
  <div className="flex justify-between items-center mb-1">
    <span className="text-[10px] uppercase tracking-widest text-green-400">
      {graphType === 'cpu' ? 'cpu load' : 'network traffic'}
    </span>
    <div className="flex items-center space-x-1">
      <button
        onClick={() => setGraphType(type => type === 'cpu' ? 'network' : 'cpu')}
        className="text-[9px] px-1 py-[1px] text-green-400 rounded-sm opacity-70 hover:opacity-100 border border-green-500/20 bg-black/30 hover:border-green-500/50"
      >
        {graphType === 'cpu' ? 'Network' : 'CPU'}
      </button>
      <button
        onClick={() => setIsGraphExpanded(prev => !prev)}
        className="text-[9px] w-5 flex items-center justify-center text-green-400 py-[1px] opacity-70 hover:opacity-100 border border-green-500/20 bg-black/30 hover:border-green-500/50"
        title={isGraphExpanded ? "Collapse graph" : "Expand graph"}
      >
        {isGraphExpanded ? '↑' : '↓'}
      </button>
    </div>
  </div>
  <div 
    className="crt-border-inner7"
    style={{ 
      maxHeight: isGraphExpanded ? '250px' : '180px',
      height: isGraphExpanded ? '250px' : '180px',
      transition: 'all 0.3s ease-in-out'
    }}
  >
    {graphType === 'cpu' ? <CPUGraph /> : <NetworkGraph />}
  </div>
</div>

          
          {/* Section 2: System Info - Below the CPU Graph */}
          <div className="w-full flex-shrink-0 pt-2">
            <SysInfo />
          </div>
          
          {/* Section 3: Server Terminal with Input Terminal directly below */}
          <div className="flex flex-col w-full pb-2"> 
            <div className=" min-h-[220px]" 
                style={{ transition: 'all 0.3s ease-in-out' }}>
              <ServerTerminal />
            </div>
            
            {/* Terminal Input - Now part of the flex column with ServerTerminal */}
            <div className="flex flex-col flex-shrink-0 pt-2">
              <div className="crt-text5 mr-1 pb-1 flex items-center justify-between crt-border-b">
                <div className="flex items-center">
                  <TerminalIcons.Terminal />
                  <span>
                    <button className="crt-link5">
                      vAio SERVER TERMINAL INPUT
                    </button>
                  </span>
                </div>
                <div className="flex space-x-1">
                  <button 
                    className="w-5 h-5 rounded text-green-400 flex items-center justify-center text-xs hover:opacity-100"
                    onClick={() => {
                      if (terminalPaneRef.current) {
                        terminalPaneRef.current.increaseFontSize();
                      }
                    }}
                    title="Increase font size"
                  >
                    A+
                  </button>
                  <button 
                    className="w-5 h-5 rounded text-green-400 flex items-center justify-center text-xs hover:opacity-100"
                    onClick={() => {
                      if (terminalPaneRef.current) {
                        terminalPaneRef.current.decreaseFontSize();
                      }
                    }}
                    title="Decrease font size"
                  >
                    A-
                  </button>
                </div>
              </div>
              <div className=""></div>
              <div 
                className="h-[135px] overflow-hidden rounded crt-border-inner7 relative"
                style={{ 
                  transition: 'all 0.3s ease-in-out',
                  position: 'relative',
                  zIndex: 1,
                }}
                onClick={(e) => {
                  // Let the terminal handle clicks
                  e.stopPropagation();
                  if (terminalPaneRef.current) {
                    terminalPaneRef.current.focus();
                  }
                }}
              >
                <TerminalPane ref={terminalPaneRef} />
                <div className="absolute top-1 right-2 text-[8px] text-green-500/50 pointer-events-none">
                  SHELL
                </div>
              </div>
            </div>
          </div>
    
          {/* Settings Panel - Positioned at the bottom */}
          <div className={`flex-shrink-0 transition-all duration-300 ease-in-out ${settingsOpen ? 'mt-4' : 'mt-2'}`}>
            <PanelSetting
              settingsOpen={settingsOpen}
              setSettingsOpen={setSettingsOpen}
              activeExplanation={activeExplanation}
              setActiveExplanation={setActiveExplanation}
              onReset={onReset}
            />
          </div>
        </div>
      </div>
    </div>
    </>
  )
}
