// filepath: /panel-modules/CpuGraph/CpuGraph.jsx
import { useState, useEffect } from 'react'
import { useCpuZoom } from './useCpuZoom'
import { useCpuData } from './useCpuData'
import { getCpuTheme } from './CpuThemeUtils'
import CpuChartRender from './CpuChartRender'
import TooltipCpu from './TooltipCpu'

export default function CpuGraph() {
  const [chartData, setChartData] = useState([])
  const [latestMetrics, setLatestMetrics] = useState({})

  const [viewMode, setViewMode] = useState('line')
  const [glowIntensity, setGlowIntensity] = useState(2)
  const [themeColors, setThemeColors] = useState(null)

  useEffect(() => {
    setThemeColors(getCpuTheme())
  }, [])

  const { zoomState, zoomHandlers, handleZoomReset } = useCpuZoom(chartData)
  const { loadCpuLog, cleanupSockets } = useCpuData(setChartData, setLatestMetrics)

  // Handle mouse wheel event for zoom reset
  const handleWheel = (e) => {
    // Don't prevent default to allow normal scrolling
    // If currently zoomed in, reset zoom on mouse wheel
    if (zoomState.isZoomed) {
      handleZoomReset()
    }
  }

  useEffect(() => {
    const pulse = setInterval(() => {
      setGlowIntensity(prev => {
        const next = prev + (Math.random() - 0.5) * 0.5
        return Math.max(1.5, Math.min(3, next))
      })
    }, 500)
    return () => clearInterval(pulse)
  }, [])

  useEffect(() => {
    console.log('CPUGraph: Starting with empty chart and setting up real-time data...');
    
    // Just initialize sockets without loading any history
    loadCpuLog();
    
    // Clean up function
    return () => {
      console.log('CPUGraph: Cleaning up sockets on unmount');
      try {
        if (cleanupSockets) {
          cleanupSockets();
        }
      } catch (err) {
        console.error('Error cleaning up CPU sockets:', err);
      }
    }
  }, [])

  return (
    <div
      className="bg-[#08170D]/10 backdrop-blur-[1.5px] shadow-inner overflow-hidden w-full h-full flex flex-col relative pr-2"
      style={{
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none',
        touchAction: 'none',
        pointerEvents: 'auto'
      }}
      // onContextMenu={e => e.preventDefault()}// Remove prevent default from handleWheel
      onWheel={handleWheel} 
    >
      <div className="absolute bottom-2 left-2 z-10 flex gap-2">
        <div
          className="cursor-pointer"
          onClick={() => setViewMode(prev => (prev === 'line' ? 'area' : 'line'))}
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
      
      <div className="absolute top-2 right-3 text-xs opacity-70 flex items-center gap-1">
        <div className="w-2 h-2 rounded-full" style={{backgroundColor: themeColors?.primary}}></div>
        <span className="text-[10px]">CPU</span>
        <div className="w-2 h-2 rounded-full ml-2" style={{backgroundColor: themeColors?.secondary}}></div>
        <span className="text-[10px]">Memory</span>
      </div>

      {chartData.length === 0 || !themeColors ? (
  <div className="absolute inset-0 flex items-center justify-center">
    <div className="crt-text4">Loading CPU data...</div>
  </div>
) : (
  <CpuChartRender
    data={chartData}
    zoomState={zoomState}
    zoomHandlers={zoomHandlers}
    viewMode={viewMode}
    themeColors={themeColors}
    glowIntensity={glowIntensity}
    tooltip={<TooltipCpu themeColors={themeColors} />}
  />
)}

    </div>
  )
}
