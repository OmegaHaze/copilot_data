import React, { useState, useEffect } from 'react'

// SVG Icons for ComfyUI settings
const ComfyIcons = {
  Version: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 8-9.04 9.06a2.82 2.82 0 1 0 3.98 3.98L16 12"></path>
      <circle cx="17" cy="7" r="5"></circle>
    </svg>
  ),
  Python: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 9H7.5a2.5 2.5 0 0 1 0-5H12m0 0-3 6m3-6h4.5a2.5 2.5 0 0 1 0 5H12m0 0 3 6m0 0h-4.5a2.5 2.5 0 0 1 0-5H12"></path>
    </svg>
  ),
  Cuda: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 12 6 3v-6l-6 3z"></path>
      <path d="M6.5 9.5 9 12l-2.5 2.5"></path>
      <path d="M14 6.5v11"></path>
      <path d="M17 7.5v9"></path>
      <path d="M20 8.5v7"></path>
    </svg>
  ),
  Update: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
      <path d="M3 3v5h5"></path>
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"></path>
      <path d="M16 16h5v5"></path>
    </svg>
  ),
  Model: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
      <polyline points="3.29 7 12 12 20.71 7"></polyline>
      <line x1="12" y1="22" x2="12" y2="12"></line>
    </svg>
  ),
  Node: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="8" height="8" rx="2"></rect>
      <rect x="14" y="2" width="8" height="8" rx="2"></rect>
      <rect x="2" y="14" width="8" height="8" rx="2"></rect>
      <rect x="14" y="14" width="8" height="8" rx="2"></rect>
    </svg>
  ),
  Performance: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
    </svg>
  ),
  Connection: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 11a9 9 0 0 1 9 9"></path>
      <path d="M4 4a16 16 0 0 1 16 16"></path>
      <circle cx="5" cy="19" r="2"></circle>
    </svg>
  ),
  Port: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"></path>
      <path d="M18 14h-8"></path>
      <path d="M15 18h-5"></path>
      <path d="M10 6h8v4h-8V6Z"></path>
    </svg>
  ),
  Template: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 3H3v7h18V3z"></path>
      <path d="M21 14h-5v7h5v-7z"></path>
      <path d="M8 14H3v7h5v-7z"></path>
      <path d="M14 14h-3v7h3v-7z"></path>
    </svg>
  ),
  SDXL: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12h20"></path>
      <path d="M2 4h20"></path>
      <path d="M2 20h20"></path>
      <path d="M19 8c0 0-3 5.5-7 5.5S5 8 5 8"></path>
      <path d="M19 16c0 0-3-5.5-7-5.5S5 16 5 16"></path>
    </svg>
  ),
  Video: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m22 8-6 4 6 4V8Z"></path>
      <rect width="14" height="12" x="2" y="6" rx="2" ry="2"></rect>
    </svg>
  )
}
// Component for settings sections with glow effect
const SettingsSection = ({ title, children, glowIntensity = 2 }) => (
  <div
    className="border border-green-800/50 rounded bg-black/30 p-3 mb-3"
    style={{ filter: `drop-shadow(0 0 ${glowIntensity}px rgba(0, 255, 0, 0.3))` }}
  >
    <h4 className="text-green-300 font-bold mb-2 border-b border-green-800/50 pb-1 flex items-center text-[11px] uppercase tracking-wider">
      <span className="mr-1 text-green-400">▣</span>{title}
    </h4>
    <div className="space-y-2">
      {children}
    </div>
  </div>
)
// ComfyUI Logo with glow effect
const ComfyUILogo = ({ glowIntensity = 2 }) => (
  <div className="h-10 w-auto flex items-center justify-center">
    <div
      className="text-2xl font-bold text-green-400"
      style={{ filter: `drop-shadow(0 0 ${glowIntensity}px rgba(0, 255, 0, 0.7))` }}
    >
      Comfy<span className="text-green-200">UI</span>
    </div>
  </div>
)

// Property Display with icons
const ComfyProperty = ({ label, value, icon }) => (
  <div className="flex mb-1 items-center">
    <div className="w-1/3 text-green-300 font-mono text-[10px] flex items-center">
      {icon && <span className="mr-1">{icon}</span>}
      {label}:
    </div>
    <div className="w-2/3 text-white font-mono text-[10px]">{value}</div>
  </div>
)

export default function ComfyUISettings() {
  const [isCheckingForUpdates, setIsCheckingForUpdates] = useState(false)
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
  
  // Mock ComfyUI version information
  const versionInfo = {
    version: '1.6.2',
    lastUpdated: '2023-09-15',
    pythonVersion: '3.11.4',
    cudaVersion: '12.1'
  }

  const handleCheckForUpdates = () => {
    setIsCheckingForUpdates(true)
    // Simulate update check
    setTimeout(() => {
      setIsCheckingForUpdates(false)
      alert('ComfyUI is up to date!')
    }, 2000)
  }

  return (
    <div className="h-full p-2 overflow-y-auto">
      {/* ComfyUI logo and header */}
      <div className="flex items-center justify-between border-b border-green-800 pb-3 mb-4">
        <div>
          <h3 className="text-green-200 text-xl font-bold flex items-center tracking-wide">
            <span className="text-green-400 mr-2">▣</span>
            COMFYUI SETTINGS
          </h3>
          <p className="text-green-400 text-xs mt-0.5">Configure ComfyUI parameters and options</p>
        </div>
        <ComfyUILogo glowIntensity={glowIntensity} />
      </div>
      
      {/* Refresh button */}
      <div className="mb-4 flex justify-end">
        <button
          className="bg-green-800/70 hover:bg-green-700 text-white py-1.5 px-3 rounded text-xs font-medium flex items-center"
          onClick={handleCheckForUpdates}
          disabled={isCheckingForUpdates}
          style={{ filter: `drop-shadow(0 0 ${glowIntensity}px rgba(0, 255, 0, 0.3))` }}
        >
          {isCheckingForUpdates ? (
            <>
              <span className="mr-1 animate-spin">⟳</span> Checking...
            </>
          ) : (
            <>
              <span className="mr-1">⟳</span> Check for Updates
            </>
          )}
        </button>
      </div>
      
      {/* Version Information */}
      <SettingsSection title="Version Information" glowIntensity={glowIntensity}>
        <div className="text-white font-mono text-[10px] mb-2 border-b border-green-800/30 pb-1">
          <span className="text-green-400">ComfyUI:</span> {versionInfo.version} |
          <span className="text-green-400 ml-1">Updated:</span> {versionInfo.lastUpdated}
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          <ComfyProperty
            icon={<ComfyIcons.Version />}
            label="VERSION"
            value={versionInfo.version}
          />
          <ComfyProperty
            icon={<ComfyIcons.Update />}
            label="UPDATED"
            value={versionInfo.lastUpdated}
          />
          <ComfyProperty
            icon={<ComfyIcons.Python />}
            label="PYTHON"
            value={versionInfo.pythonVersion}
          />
          <ComfyProperty
            icon={<ComfyIcons.Cuda />}
            label="CUDA"
            value={versionInfo.cudaVersion}
          />
        </div>
      </SettingsSection>
      {/* Auto System Template Settings */}
      <SettingsSection title="Model Management" glowIntensity={glowIntensity}>
        <div className="text-white font-mono text-[10px] mb-2 border-b border-green-800/30 pb-1">
          <span className="text-green-400">STATUS:</span> In Development |
          <span className="text-green-400 ml-1">PRIORITY:</span> High
        </div>
        
        <div className="grid grid-cols-1 gap-2">
          {/* Template System Description */}
          <div className="text-green-400 text-[10px] font-mono flex items-start">
            <span className="text-green-300 mr-1 mt-0.5"><ComfyIcons.Template /></span>
            <span>Auto system template setting configs for AI model setup</span>
          </div>
          
          {/* SDXL Template */}
          <div className="border border-green-800/30 rounded bg-black/20 p-2">
            <div className="flex items-center mb-1">
              <span className="text-green-300 mr-1"><ComfyIcons.SDXL /></span>
              <span className="text-green-200 text-[10px] uppercase font-mono font-bold">SDXL Template</span>
            </div>
            <div className="text-green-400 text-[9px] font-mono pl-4">
              • Auto-downloads required SDXL models<br />
              • Configures optimal parameters<br />
              • Sets up workflow templates<br />
              <button className="mt-1 bg-green-900/50 hover:bg-green-800/50 text-green-100 py-0.5 px-2 rounded text-[8px] font-medium">
                SETUP SDXL ENVIRONMENT
              </button>
            </div>
          </div>
          
          {/* FLUX Template */}
          <div className="border border-green-800/30 rounded bg-black/20 p-2">
            <div className="flex items-center mb-1">
              <span className="text-green-300 mr-1"><ComfyIcons.Model /></span>
              <span className="text-green-200 text-[10px] uppercase font-mono font-bold">FLUX Template</span>
            </div>
            <div className="text-green-400 text-[9px] font-mono pl-4">
              • Auto-downloads FLUX model components<br />
              • Configures specialized nodes<br />
              • Sets up optimized workflow templates<br />
              <button className="mt-1 bg-green-900/50 hover:bg-green-800/50 text-green-100 py-0.5 px-2 rounded text-[8px] font-medium">
                SETUP FLUX ENVIRONMENT
              </button>
            </div>
          </div>
          
          {/* SVD Template */}
          <div className="border border-green-800/30 rounded bg-black/20 p-2">
            <div className="flex items-center mb-1">
              <span className="text-green-300 mr-1"><ComfyIcons.Video /></span>
              <span className="text-green-200 text-[10px] uppercase font-mono font-bold">SVD Template</span>
            </div>
            <div className="text-green-400 text-[9px] font-mono pl-4">
              • Auto-downloads Stable Video Diffusion models<br />
              • Configures video processing nodes<br />
              • Sets up frame interpolation workflow<br />
              <button className="mt-1 bg-green-900/50 hover:bg-green-800/50 text-green-100 py-0.5 px-2 rounded text-[8px] font-medium">
                SETUP SVD ENVIRONMENT
              </button>
            </div>
          </div>
          
          <div className="text-green-300 text-[9px] font-mono mt-1 border-t border-green-800/30 pt-2">
            <span className="text-green-400">NOTE:</span> Templates automatically download required models and configure the environment for optimal performance.
          </div>
        </div>
      </SettingsSection>
      
      {/* Placeholder for Node Configuration */}
      <SettingsSection title="Node Configuration" glowIntensity={glowIntensity}>
        <div className="text-white font-mono text-[10px] mb-2 border-b border-green-800/30 pb-1">
          <span className="text-green-400">STATUS:</span> Not Implemented |
          <span className="text-green-400 ml-1">PRIORITY:</span> Medium
        </div>
        <div className="grid grid-cols-1 gap-1">
          <div className="text-green-400 text-[10px] font-mono flex items-start">
            <span className="text-green-300 mr-1 mt-0.5"><ComfyIcons.Node /></span>
            Node configuration options will be implemented in a future update.
          </div>
          <div className="text-green-400 text-[10px] font-mono pl-5">
            • Customize node behavior and appearance<br />
            • Configure default node settings<br />
            • Create node presets and templates
          </div>
        </div>
      </SettingsSection>
      
      {/* Connection Monitoring Section */}
      <SettingsSection title="Connection Monitoring" glowIntensity={glowIntensity}>
        <div className="text-white font-mono text-[10px] mb-2 border-b border-green-800/30 pb-1">
          <span className="text-green-400">STATUS:</span> Not Implemented |
          <span className="text-green-400 ml-1">PRIORITY:</span> High
        </div>
        <div className="grid grid-cols-1 gap-1">
          <div className="text-green-400 text-[10px] font-mono flex items-start">
            <span className="text-green-300 mr-1 mt-0.5"><ComfyIcons.Connection /></span>
            ComfyUI OpenWebUI port/connection monitoring system will be implemented.
          </div>
          <div className="text-green-400 text-[10px] font-mono pl-5">
            • Real-time port status monitoring<br />
            • Connection health metrics<br />
            • Automatic reconnection handling<br />
            • Cross-service communication status
          </div>
        </div>
      </SettingsSection>
      
      {/* Placeholder for Performance Options */}
      <SettingsSection title="Performance" glowIntensity={glowIntensity}>
        <div className="text-white font-mono text-[10px] mb-2 border-b border-green-800/30 pb-1">
          <span className="text-green-400">STATUS:</span> Not Implemented |
          <span className="text-green-400 ml-1">PRIORITY:</span> High
        </div>
        <div className="grid grid-cols-1 gap-1">
          <div className="text-green-400 text-[10px] font-mono flex items-start">
            <span className="text-green-300 mr-1 mt-0.5"><ComfyIcons.Performance /></span>
            Performance optimization settings will be implemented in a future update.
          </div>
          <div className="text-green-400 text-[10px] font-mono pl-5">
            • Memory management and allocation<br />
            • Cache settings and optimization<br />
            • Execution preferences and scheduling
          </div>
        </div>
      </SettingsSection>
    </div>
  )
}