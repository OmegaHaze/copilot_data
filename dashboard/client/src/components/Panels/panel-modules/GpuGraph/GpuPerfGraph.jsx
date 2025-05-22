import { useState, useEffect } from 'react'
import { useGpuZoom } from './useGpuZoom'
import { useGpuData } from './useGpuData'
import { getThemeColors } from './GpuThemeUtils'
import ChartRenderer from './ChartRenderer'
import CustomTooltip from './TooltipGpu'

export default function GpuPerfGraph() {
  const [chartData, setChartData] = useState([])
  const [currentData, setCurrentData] = useState({
    temp: 0,
    gpuUtil: 0,
    memUtil: 0,
    gpuType: 'Unknown GPU'
  })
  const [errorState, setErrorState] = useState({
    hasError: false,
    errorType: null,
    message: ''
  })
  const [viewMode, setViewMode] = useState('line')
  const [hoverColor, setHoverColor] = useState('var(--color-green-500)')
  const [glowIntensity, setGlowIntensity] = useState(2)
  const [themeColors, setThemeColors] = useState({
    primary: 'var(--color-green-500)',
    secondary: 'var(--color-green-400)',
    tertiary: 'var(--color-green-300)',
    danger: 'var(--color-red-500)',
    warning: 'var(--color-yellow-500)'
  })

  const { zoomState, zoomHandlers, handleZoomReset } = useGpuZoom(chartData)
  const { loadGpuLog, cleanupSockets, retryConnection } = useGpuData(setChartData, setCurrentData, setErrorState)

  // Handle mouse wheel event for zoom reset
  const handleWheel = (e) => {
    // If currently zoomed in, reset zoom on mouse wheel
    if (zoomState.isZoomed) {
      handleZoomReset()
    }
  }

  useEffect(() => {
    const intervalGlow = setInterval(() => {
      setGlowIntensity(prev => {
        const newVal = prev + (Math.random() - 0.5) * 0.5
        return Math.max(1.5, Math.min(3, newVal))
      })
    }, 500)
    return () => clearInterval(intervalGlow)
  }, [])
  
  // Clear connection_slow errors after a timeout
  // We don't want to clear no_gpu or connection_error since those are permanent conditions
  useEffect(() => {
    let timeoutId;
    
    if (errorState.hasError && errorState.errorType === 'connection_slow') {
      timeoutId = setTimeout(() => {
        setErrorState(prev => {
          if (prev.errorType === 'connection_slow') {
            return { hasError: false, errorType: null, message: '' };
          }
          return prev;
        });
      }, 10000); // Clear slow connection errors after 10 seconds
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [errorState.hasError, errorState.errorType]);

  useEffect(() => {
    const colors = getThemeColors()
    setThemeColors(colors)
    setHoverColor(colors.primary)
  }, [])

  // Just initialize sockets without complex logic - same as CPU
  useEffect(() => {
    console.log('GpuPerfGraph: Starting with empty chart and setting up real-time data...');
    
    // Load initial data
    loadGpuLog();
    
    // Set up refresh interval for continuous updates
    const refreshInterval = setInterval(() => {
      loadGpuLog();
    }, 30000); // Refresh every 30 seconds
    
    // Clean up function
    return () => {
      console.log('GpuPerfGraph: Cleaning up on unmount');
      clearInterval(refreshInterval);
      if (cleanupSockets) {
        cleanupSockets();
      }
    };
  }, []);

  return (
    <div
      className="bg-[#08170D]/70 backdrop-blur-[1.5px] shadow-inner overflow-hidden w-full h-full flex flex-col relative min-h-[200px] pr-3"
      style={{
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none',
        touchAction: 'none',
        pointerEvents: 'auto'
      }}
      onWheel={handleWheel}
    >
      {/* GPU Error notification */}
      {errorState.hasError && (
        <div className="absolute top-2 left-2 right-2 flex z-20 justify-center">
          <div 
            className={`border px-2.5 py-1.5 rounded shadow-lg max-w-full ${
              errorState.errorType === 'connection_slow' 
                ? 'bg-blue-900/80 border-blue-700' 
                : errorState.errorType === 'no_gpu' 
                ? 'bg-yellow-900/80 border-yellow-700'
                : 'bg-red-900/80 border-red-700'
            }`}
          >
            <div 
              className={`text-center text-xs font-semibold whitespace-nowrap overflow-hidden text-ellipsis ${
                errorState.errorType === 'connection_slow'
                  ? 'text-blue-300'
                  : errorState.errorType === 'no_gpu'
                  ? 'text-yellow-300'
                  : 'text-red-300'
              }`}
            >
              {errorState.message || "GPU Detection Issue"}
              {errorState.details && (
                <span className="opacity-70 ml-1">({errorState.details})</span>
              )}
            </div>
          </div>
        </div>
      )}
      
      {currentData.gpuType !== 'Unknown GPU' && (
        <div className="absolute top-2 right-2 flex z-10">
          <div className="crt-bg-blk px-1.5 py-1 rounded crt-border-green9 relative">
            <div className="text-center text-xs crt-text4 font-semibold whitespace-nowrap overflow-hidden text-ellipsis">
              {currentData.gpuType}
            </div>
          </div>
        </div>
      )}

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
      
      {chartData.length === 0 ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className={`${errorState.hasError ? 
              (errorState.errorType === 'no_gpu' ? 'text-yellow-400' : 'text-red-400') 
              : 'crt-text4'} mb-2 text-center max-w-xs px-4`}>
            {errorState.hasError ? 
              (errorState.errorType === 'no_gpu' 
                ? 'No NVIDIA GPU detected. Using placeholder data.'
                : errorState.errorType === 'connection_error'
                ? 'Unable to connect to GPU metrics service. Check server status.'
                : errorState.errorType === 'connection_slow'
                ? 'GPU metrics connection is slow. Data may be delayed.'
                : 'Error retrieving GPU data. Using placeholder visualization.') 
              : 'Loading GPU data...'}
          </div>
          <button 
            className={`px-3 py-1 ${
              errorState.hasError
                ? errorState.errorType === 'no_gpu'
                  ? 'bg-yellow-800/40 hover:bg-yellow-700/60 border border-yellow-600/50 text-yellow-400'
                  : 'bg-red-800/40 hover:bg-red-700/60 border border-red-600/50 text-red-400'
                : 'bg-green-800/40 hover:bg-green-700/60 border border-green-600/50 text-green-400'
            } rounded text-xs`}
            onClick={() => {
              // Use the improved retry function that handles both data and connection
              if (cleanupSockets && typeof cleanupSockets === 'function') {
                // Reset any existing data first
                cleanupSockets();
              }
              
              if (retryConnection && typeof retryConnection === 'function') {
                retryConnection(); // This will handle socket reconnection and error state reset
              } else {
                // Fallback to just loading data
                loadGpuLog();
              }
            }}
          >
            {errorState.hasError ? 'Generate Placeholder Data' : 'Retry Load'}
          </button>
        </div>
      ) : (
        <ChartRenderer
          data={chartData}
          zoomState={zoomState}
          zoomHandlers={zoomHandlers}
          viewMode={viewMode}
          themeColors={themeColors}
          glowIntensity={glowIntensity}
          hoverColor={hoverColor}
          tooltip={<CustomTooltip themeColors={themeColors} />}
        />
      )}
    </div>
  )
}