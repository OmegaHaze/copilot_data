import React, { useState, useEffect } from 'react'
import GpuOverview from '../Panels/panel-modules/GpuOverview'
import GpuPerformance from '../Panels/panel-modules/GpuPerformance'

const NvidiaLogo = ({ glowIntensity = 2 }) => (
  <div className="h-10 w-10 flex items-center justify-center">
    <img
      src="https://upload.wikimedia.org/wikipedia/commons/8/8e/Logo-nvidia-transparent-PNG.png"
      width="40"
      height="40"
      alt="NVIDIA Logo"
      className="object-contain"
      style={{ filter: `drop-shadow(0 0 ${glowIntensity}px rgba(118, 185, 0, 0.7))` }}
    />
  </div>
)

export default function NvidiaSettings() {
  const [glowIntensity, setGlowIntensity] = useState(2)
  const [refreshing, setRefreshing] = useState(false)
  const [gpuData, setGpuData] = useState(null)

  const isValidGpuData = (gpu) =>
    !!gpu &&
    typeof gpu === 'object' &&
    gpu.static &&
    typeof gpu.static.name === 'string' &&
    typeof gpu.static.driver_version === 'string' &&
    typeof gpu.static.compute_capability === 'string' && gpu.live &&
    typeof gpu.live.temperature === 'number' &&
    typeof gpu.live.utilization === 'number' &&
    typeof gpu.live.memory_used === 'number';
  

    const fetchGpuInfo = async () => {
      try {
        const [infoRes, logRes] = await Promise.all([
          fetch('/api/system/info'),
          fetch('/api/nvidia/gpu-log?minutes=3')
        ]);
    
        const infoData = await infoRes.json();
        const logData = await logRes.json();
    
        if (infoData.success && infoData.gpus?.[0]) {
          const gpu = infoData.gpus[0];
          
          // Validate GPU data structure
          if (isValidGpuData(gpu)) {
            const flatGpuData = {
              ...gpu.static,
              live: gpu.live,
              clock_speeds: gpu.static.clock_speeds,
              max_clocks: gpu.static.max_clocks,
              decoder_utilization: gpu.static.decoder_utilization,
              history: Array.isArray(logData) ? logData : []
            };
            setGpuData(flatGpuData);
          } else {
            console.warn('Invalid GPU data structure:', gpu);
          }
        } else {
          console.warn('GPU info fetch failed or structure invalid:', infoData);
        }
      } catch (err) {
        console.error('Failed to fetch GPU info or logs:', err);
      }
    };
    
  // Glow animation
  useEffect(() => {
    const interval = setInterval(() => {
      setGlowIntensity(prev => {
        const next = prev + (Math.random() - 0.5) * 0.5;
        return Math.max(1.5, Math.min(3, next));
      });
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchGpuInfo();
    setTimeout(() => setRefreshing(false), 800);
  }

  return (
    <div className="h-full p-2 overflow-y-auto">
      <div className="flex items-center justify-between border-b border-green-800 pb-3 mb-4">
        <h3 className="text-green-200 text-xl font-bold flex items-center tracking-wide">
          <span className="text-green-400 mr-2">▣</span>
          NVIDIA GPU SETTINGS
        </h3>
        <NvidiaLogo glowIntensity={glowIntensity} />
      </div>

      <div className="mb-4 flex justify-end">
        <button
          className="bg-green-800/70 hover:bg-green-700 text-white py-1.5 px-3 rounded text-xs font-medium flex items-center"
          onClick={handleRefresh}
          disabled={refreshing}
          style={{ filter: `drop-shadow(0 0 ${glowIntensity}px rgba(0, 255, 0, 0.3))` }}
        >
          {refreshing ? (
            <>
              <span className="mr-1 animate-spin">⟳</span> Refreshing...
            </>
          ) : (
            <>
              <span className="mr-1">⟳</span> Refresh Data
            </>
          )}
        </button>
      </div>

      {gpuData && (
        <>
          <GpuOverview staticData={gpuData} glowIntensity={glowIntensity} />
          
          <GpuPerformance gpuData={gpuData} glowIntensity={glowIntensity} />
        </>
      )}
    </div>
  )
}
