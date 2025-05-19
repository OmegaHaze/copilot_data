// filepath: /workspace/dashboard/client/src/components/Panels/panel-modules/NetworkGraph/NetworkGraph.jsx
import React, { useState, useEffect } from 'react'
import NetworkChartRender from './NetworkChartRender'
import TooltipNet from './TooltipNet'
import { getNetTheme } from './NetThemeUtils'
import { useNetworkZoom } from './useNetworkZoom'
import { useNetworkData } from './useNetworkData.js' // Corrected extension to .js
import NetSelector from './NetSelector'

export default function NetworkGraph() {
  // State for chart data and current metrics
  const [chartData, setChartData] = useState([])
  const [currentData, setCurrentData] = useState({
    tx: '0 Mbps',
    rx: '0 Mbps',
    txRaw: 0,
    rxRaw: 0,
    lastNonZeroTx: '0 Mbps',  // Track last non-zero values
    lastNonZeroRx: '0 Mbps'
  })
   // Use the existing network data hook that expects setState functions
  const { loadNetworkLog, cleanupSockets } = useNetworkData(setChartData, setCurrentData)

  // Load network data on component mount and refresh every 30 seconds
  useEffect(() => {
    // Track if the component is still mounted to avoid memory leaks
    let isMounted = true;
    let isLoading = false;
    
    // Function to load data only if not already loading
    const loadData = () => {
      if (isLoading || !isMounted) return;
      
      isLoading = true;
      console.log('Loading network data...');
      
      // Load the data with a callback to reset loading status
      loadNetworkLog().finally(() => {
        if (isMounted) {
          isLoading = false;
        }
      });
    };
    
    // Load data immediately when component mounts
    loadData();
    
    // Set up refresh interval (5 seconds for more frequent updates)
    const refreshInterval = setInterval(loadData, 2000);
    
    // Clean up function
    return () => {
      // Set mounted flag first
      isMounted = false;
      
      // Clear refresh interval
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
      
      // Clean up socket connections - wrapped in try/catch to prevent crashes
      try {
        if (cleanupSockets && typeof cleanupSockets === 'function') {
          console.log('NetworkGraph: Cleaning up sockets on unmount');
          cleanupSockets();
        }
      } catch (err) {
        console.error('Error cleaning up network sockets:', err);
      }
    };
  }, []); // Empty dependency array - only run on mount/unmount

  const { zoomState, zoomHandlers, handleZoomReset } = useNetworkZoom(chartData)
  
  // Handle mouse wheel event for zoom reset - added to match CPU graph functionality
  const handleWheel = (e) => {
    // Don't prevent default to allow normal scrolling
    // If currently zoomed in, reset zoom on mouse wheel
    if (zoomState.isZoomed) {
      handleZoomReset()
    }
  }
  
  const [viewMode, setViewMode] = useState('line') // 'line' or 'area'
  const [themeColors, setThemeColors] = useState(null)
  
  // For interface selection - simulate based on available data
  const [interfaces, setInterfaces] = useState([])
  const [selectedInterface, setSelectedInterface] = useState(null)
  const [connectionStatus, setConnectionStatus] = useState('connecting')
  
  // Extract interface information from chart data if available
  useEffect(() => {
    if (chartData && chartData.length > 0) {
      setInterfaces(['default']);
      setSelectedInterface('default');
      setConnectionStatus('connected');
    } else {
      setConnectionStatus('disconnected');
    }
  }, [chartData])

  useEffect(() => {
    setThemeColors(getNetTheme())
  }, [])
  
  // Glow effect intensity
  const [glowIntensity, setGlowIntensity] = useState(1.5)
  
  // Add pulsing effect like in CPUGraph
  useEffect(() => {
    const pulse = setInterval(() => {
      setGlowIntensity(prev => {
        const next = prev + (Math.random() - 0.5) * 0.5
        return Math.max(1.5, Math.min(3, next))
      })
    }, 500)
    return () => clearInterval(pulse)
  }, [])
  
  // Toggle view mode between line and area
  const toggleViewMode = () => {
    setViewMode(prev => prev === 'line' ? 'area' : 'line')
  }

  return (
    <div
      className="bg-[#08170D]/10 backdrop-blur-[1.5px] shadow-inner overflow-hidden w-full h-full flex flex-col relative pr-2"
      style={{
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none',
        touchAction: 'none',
        pointerEvents: 'auto',
        WebkitTapHighlightColor: 'transparent' // Prevent mobile tap highlight
      }}
      // onContextMenu={e => e.preventDefault()}
      onWheel={handleWheel}
    >
      {/* Header with Network Traffic title */}
         
      {/* Connection status dot (top right corner) */}
      <div className="absolute top-2 right-3 z-40">
        <span className={`inline-block h-2.5 w-2.5 rounded-full ${
          connectionStatus === 'connected' 
            ? 'bg-green-500 shadow-[0_0_4px_rgba(34,197,94,0.8)]' 
            : connectionStatus && typeof connectionStatus === 'string' && connectionStatus.startsWith('error') 
              ? 'bg-red-500 shadow-[0_0_4px_rgba(239,68,68,0.8)]' 
              : 'bg-yellow-500 shadow-[0_0_4px_rgba(234,179,8,0.8)]'
        }`}></span>
      </div>
      
      {/* Network interface selector component */}
      <div className="flex justify-between items-center w-full px-2">
        <NetSelector 
          selectedInterface={selectedInterface}
          setSelectedInterface={setSelectedInterface}
          interfaces={interfaces}
        />
        {/* Display current network traffic values */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center">
            <span className="inline-block h-2 w-2 mr-1 rounded-full bg-green-500"></span>
            <span className="text-gray-300">DL: {
              currentData.rx === '0 bps' ? currentData.lastNonZeroRx : currentData.rx
            }</span>
          </div>
          <div className="flex items-center">
            <span className="inline-block h-2 w-2 mr-1 rounded-full bg-blue-500"></span>
            <span className="text-gray-300">UL: {
              currentData.tx === '0 bps' ? currentData.lastNonZeroTx : currentData.tx
            }</span>
          </div>
        </div>
      </div>
      
      {/* View mode toggle - moved to bottom left */}
      <div className="absolute bottom-2 left-2 z-10 flex gap-2">
        <div
          className="cursor-pointer"
          onClick={toggleViewMode}
          title={`Switch to ${viewMode === 'line' ? 'Area' : 'Line'} Chart`}
        >
          <div className={`
            w-5 h-2.5 rounded-full transition-all duration-300
            bg-black/40 backdrop-blur-sm border border-white/10
            flex items-center
            ${viewMode === 'line' ? 'justify-start' : 'justify-end'}
          `}>
            <div className={`
              h-2.5 w-2.5 rounded-full
              transition-all duration-300 flex items-center justify-center
              ${viewMode === 'line'
                ? 'bg-green-500/70 shadow-[0_0_5px_1px_rgba(0,255,0,0.5)]'
                : 'bg-blue-500/70 shadow-[0_0_5px_1px_rgba(0,128,255,0.5)]'
              }
            `}></div>
          </div>
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="crt-text4">Loading network data...</div>
        </div>
      ) : (
        <NetworkChartRender
          data={chartData}
          zoomState={zoomState}
          zoomHandlers={zoomHandlers}
          viewMode={viewMode}
          themeColors={themeColors}
          glowIntensity={glowIntensity}
          tooltip={<TooltipNet themeColors={themeColors} />}
          selectedInterface={selectedInterface}
        />
      )}
    </div>
  )
}
