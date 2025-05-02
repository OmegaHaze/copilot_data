import { useState, useEffect } from 'react'
import axios from 'axios'
import TerminalIcons from './assets/TerminalIcons'

// InfoItem component for displaying each piece of information with responsive layout
const InfoItem = ({ label, value, icon }) => {
  return (
    <div className="responsive-info-item rounded hover:bg-black/20 transition-colors overflow-hidden">
      <div className="info-content flex items-center">
        <span className="mr-1 crt-text3">{icon}</span>
        <span className="font-bold crt-text4 mr-1">{label}:</span>
        <span className="crt-text4 info-value" title={value}>{value || '—'}</span>
      </div>
    </div>
  )
}

export default function SysInfo() {
  const [systemInfo, setSystemInfo] = useState({
    cpuModel: '',
    totalRam: '',
    cpuCores: '',
    cpuArch: '',
    osInfo: '',
    uptime: '',
    availableRam: '',
    gpuInfo: null
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
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

  useEffect(() => {
    (async () => {
      try {
        const response = await axios.get('/api/system/info');
        
        // Process the raw CPU system info into the format expected by the component
        if (response.data) {
          // Extract data from the format provided by the Python backend
          const rawData = response.data.data || {};  // <<<< fix  
          const cpuInfo = rawData.cpu || {};
          const memoryInfo = rawData.memory || {};
          const osData = rawData.os || {};
          
          /* Uptime calculation commented out
          // Get uptime directly from the backend if available
          let uptimeStr = 'Unknown';
          if (osData && osData.uptime_seconds) {
            uptimeStr = formatUptime(osData.uptime_seconds);
          } else if (response.data.boot_time) {
            // Fallback to calculating from boot_time
            try {
              const bootDate = new Date(response.data.boot_time);
              const nowDate = new Date();
              const uptimeMs = nowDate - bootDate;
              const uptimeSec = Math.floor(uptimeMs / 1000);
              uptimeStr = formatUptime(uptimeSec);
            } catch (e) {
              console.error('Error calculating uptime:', e);
              uptimeStr = 'Calculation error';
            }
          }
          */
          const uptimeStr = 'Disabled'; // Placeholder value since we're not displaying uptime
          
          // Format memory values to GB with 1 decimal place
          const totalRamGB = memoryInfo.total ? 
            `${(memoryInfo.total / 1024 / 1024 / 1024).toFixed(1)} GB` : '';
          const availableRamGB = memoryInfo.available ? 
            `${(memoryInfo.available / 1024 / 1024 / 1024).toFixed(1)} GB` : '';
          
          // Get CPU information including architecture directly from backend
          let cpuModel = cpuInfo.model || '';
          
          if (cpuModel) {
            // Clean up the CPU model string by removing any remaining "model name:" prefix
            // This provides a fallback in case the backend regex didn't clean it properly
            cpuModel = cpuModel.replace(/model name\s*:/i, "").trim();
            
            // Also remove any "CPU" prefix if present
            cpuModel = cpuModel.replace(/^CPU\s+/i, "").trim();
          }
          
          const cpuCores = cpuInfo.logical_cores || cpuInfo.physical_cores || 0;
          
          // Get OS info and architecture from backend
          const osInfo = osData?.name || '';
          const cpuArch = cpuInfo?.architecture || '';
          
          setSystemInfo({
            cpuModel: cpuModel,
            cpuCores: cpuCores,
            cpuArch: cpuArch,
            osInfo: osInfo,
            // uptime: uptimeStr, // Uptime display commented out
            totalRam: totalRamGB,
            availableRam: availableRamGB,
            gpuInfo: null // Will be populated by a separate GPU endpoint if available
          });
          setError(null);
        }
      } catch (err) {
        console.error('[SysInfo] Failed to fetch system info:', err)
        setError('Failed to fetch system information')
      } finally {
        setLoading(false)
      }
    })()
  }, []) // only once on mount
  
  /* 
  // Helper function to format uptime - commented out since uptime display is removed
  const formatUptime = (seconds) => {
    const days = Math.floor(seconds / (3600 * 24));
    const hours = Math.floor((seconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    let result = '';
    if (days > 0) result += `${days}d `;
    if (hours > 0) result += `${hours}h `;
    result += `${minutes}m`;
    
    return result;
  }
  */
  

  if (loading) {
    return (
      <div className="crt-text4 text-sm animate-pulse flex items-center justify-center h-24">
        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 crt-text5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Loading system information...
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
    <div className="mt-2 crt-text5 text-[10px] leading-tight">
      <div className="crt-text text-[10px] leading-tight pt-2 crt-border-t mt-2">
        HARDWARE ENVIRONMENT
      </div>
      
      {/* Add global styles via a style tag */}
      <style dangerouslySetInnerHTML={{ __html: `
        /* Default style for narrow view - items in a single row */
        .responsive-info-item {
          padding: 4px;
          margin-bottom: 4px;
        }
        
        .info-content {
          display: flex;
          align-items: center;
          width: 100%;
        }
        
        .info-value {
          flex: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        /* Responsive layout for wider views */
        @media (min-width: 380px) {
          .system-info-container {
            display: grid !important;
            grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
            gap: 8px;
          }
          
          .responsive-info-item {
            padding: 6px;
            margin-bottom: 0;
          }
          
          .info-content {
            display: flex;
            align-items: center;
          }
          
          .info-value {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
        }
      `}} />
      
      {/* Responsive container that adapts layout based on width */}
      <div 
        className="system-info-container flex flex-col bg-black/30 border crt-border-green9 rounded p-2 mt-2"
        style={{ filter: `drop-shadow(0 0 ${glowIntensity}px rgba(0, 255, 0, 0.3))` }}
      >
        <InfoItem
          label="CPU"
          value={systemInfo.cpuModel}
          icon={<TerminalIcons.SysInfo.CPU />}
        />
        
        <InfoItem
          label="CORES"
          value={systemInfo.cpuCores}
          icon={<TerminalIcons.SysInfo.Cores />}
        />
        
        <InfoItem
          label="ARCH"
          value={systemInfo.cpuArch}
          icon={<TerminalIcons.SysInfo.Arch />}
        />
        
        <InfoItem
          label="TOTAL RAM"
          value={systemInfo.totalRam}
          icon={<TerminalIcons.SysInfo.RAM />}
        />
        
        <InfoItem
          label="FREE RAM"
          value={systemInfo.availableRam}
          icon={<TerminalIcons.SysInfo.FreeRAM />}
        />
        
        <InfoItem
          label="OS"
          value={systemInfo.osInfo}
          icon={<TerminalIcons.SysInfo.OS />}
        />
        
        {/* Uptime display commented out
        <InfoItem
          label="UPTIME"
          value={systemInfo.uptime}
          icon={<TerminalIcons.SysInfo.Uptime />}
        />
        */}
        
        {systemInfo.gpuInfo && systemInfo.gpuInfo !== 'No GPU detected' && (
          <InfoItem
            label="GPU"
            value={systemInfo.gpuInfo}
            icon={<TerminalIcons.SysInfo.GPU />}
          />
        )}
      </div>
    </div>
  )
}