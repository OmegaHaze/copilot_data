import { useState, useEffect } from 'react'
import axios from 'axios'

// SVG Icons for system integration
const SysGrationIcons = {
  OS: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
      <line x1="8" y1="21" x2="16" y2="21"></line>
      <line x1="12" y1="17" x2="12" y2="21"></line>
    </svg>
  ),
  Python: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 9H7.5a2.5 2.5 0 0 1 0-5H12m0 0v5m0-5a2.5 2.5 0 0 1 0 5"></path>
      <path d="M12 16H7.5a2.5 2.5 0 0 0 0 5H12m0 0v-5m0 5a2.5 2.5 0 0 0 0-5"></path>
      <path d="M17 6v.01"></path>
      <path d="M17 18v.01"></path>
    </svg>
  ),
  PyTorch: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v8"></path>
      <path d="m4.93 10.93 6.1-6.1"></path>
      <path d="M2 18h12"></path>
      <path d="M19 18a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"></path>
    </svg>
  ),
  CUDA: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 12 6 3v-6l-6 3z"></path>
      <path d="M6.5 9.5 9 12l-2.5 2.5"></path>
      <path d="M14 6.5v11"></path>
      <path d="M17 7.5v9"></path>
      <path d="M20 8.5v7"></path>
    </svg>
  ),
  CUDNN: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
      <path d="M22 4 12 14.01l-3-3"></path>
    </svg>
  ),
  PCI: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="6" width="20" height="12" rx="2"></rect>
      <path d="M6 12h4"></path>
      <path d="M14 12h4"></path>
    </svg>
  ),
  Driver: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
    </svg>
  )
}

// InfoItem component for displaying each piece of information
const InfoItem = ({ label, value, icon }) => (
  <div className="flex items-center mb-2">
    <div className="font-bold text-green-400 mr-1 min-w-[100px] flex items-center">
      <span className="mr-1 text-green-300">{icon}</span>
      {label}:
    </div>
    <div className="truncate text-green-300">{value}</div>
  </div>
)

export default function SysGration() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [systemInfo, setSystemInfo] = useState({
    os: 'Loading...',
    python_version: 'Loading...',
    pytorch_version: 'Loading...',
    pytorch_cuda: 'Loading...',
    cudnn: 'Loading...',
    driver_capabilities: []
  })
  const [gpuData, setGpuData] = useState(null)
  const [glowIntensity, setGlowIntensity] = useState(2)

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

  // Fetch system integration info when component mounts
  useEffect(() => {
    const fetchSystemInfo = async () => {
      try {
        const gpuResponse = await axios.get('/api/history/gpu?minutes=3', { timeout: 10000 });
        if (gpuResponse.data?.data) {
          setGpuData(gpuResponse.data.data);
        }
      } catch (gpuErr) {
        console.warn('Could not fetch GPU info:', gpuErr);
      }

      try {
        const osRes = await axios.get('/api/system/info')
        if (osRes.data?.success) {
          setSystemInfo(prev => ({ ...prev, os: osRes.data.data.osInfo || 'Unknown' }))
        }
      } catch (err) {
        console.warn('[SysGration] OS info fetch failed:', err)
      }
  
      try {
        const mlRes = await axios.get('/api/ml/environment')
        if (mlRes.data?.success) {
          setSystemInfo(prev => ({
            ...prev,
            python_version: mlRes.data.python_version || 'Unknown',
            pytorch_version: mlRes.data.pytorch_version || 'Unknown',
            pytorch_cuda: mlRes.data.pytorch_cuda || 'Unknown',
            cudnn: mlRes.data.cudnn || 'Unknown',
            driver_capabilities: mlRes.data.driver_capabilities || [],
          }))
        }
      } catch (err) {
        console.warn('[SysGration] ML env fetch failed:', err)
      }
  
      setLoading(false)
      setError(null)
    }
  
    fetchSystemInfo()
  }, []) // no polling

  if (loading) {
    return (
      <div className="text-green-400 text-sm animate-pulse flex items-center justify-center h-24">
        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Loading system integration information...
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-red-400 text-sm bg-red-900/20 border border-red-800/50 rounded p-3 flex items-center">
        <span className="text-red-500 mr-2">⚠</span>
        {error}
      </div>
    )
  }

  return (
    <div className="mt-2 text-green-300 text-[10px] leading-tight">
      <div className="text-green-500 text-[10px] leading-tight pt-2 border-t border-green-700 mt-2">
        DEVELOPMENT ENVIRONMENT
      </div>
      
      <div className="grid grid-cols-1 gap-1 bg-black/30 border border-green-800 rounded p-2 mt-2"
           style={{ filter: `drop-shadow(0 0 ${glowIntensity}px rgba(0, 255, 0, 0.3))` }}>
        <div className="grid grid-cols-2 gap-x-2 gap-y-1">
          <InfoItem
            label="OS"
            value={systemInfo.os || 'Unknown'}
            icon={<SysGrationIcons.OS />}
          />
          <InfoItem
            label="PYTHON"
            value={systemInfo.python_version || 'Unknown'}
            icon={<SysGrationIcons.Python />}
          />
          <InfoItem
            label="PYTORCH"
            value={systemInfo.pytorch_version || 'Unknown'}
            icon={<SysGrationIcons.PyTorch />}
          />
          <InfoItem
            label="CUDA"
            value={systemInfo.pytorch_cuda || 'Unknown'}
            icon={<SysGrationIcons.CUDA />}
          />
          <InfoItem
            label="CUDNN"
            value={systemInfo.cudnn || 'Unknown'}
            icon={<SysGrationIcons.CUDNN />}
          />
          {gpuData?.pci_info?.bus_id && gpuData.pci_info.bus_id !== "N/A" && (
            <InfoItem
              label="PCI BUS ID"
              value={gpuData.pci_info.bus_id}
              icon={<SysGrationIcons.PCI />}
            />
          )}
        </div>
        
        {systemInfo.driver_capabilities?.length > 0 && (
          <div className="mt-3 border-t border-green-800/30 pt-2">
            <div className="text-xs text-green-400 mb-1 flex items-center">
              <span className="mr-1 text-green-300"><SysGrationIcons.Driver /></span> DRIVER CAPABILITIES
            </div>
            <div className="flex flex-wrap gap-1 mt-1">
              {systemInfo.driver_capabilities.map((cap, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 bg-green-800/30 text-green-200 text-[9px] rounded border border-green-700/50 inline-flex items-center"
                >
                  {cap}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}