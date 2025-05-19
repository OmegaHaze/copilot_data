import React from 'react'

export default function TooltipCpu({ active, payload, themeColors }) {
  if (!active || !payload?.length || !payload[0]?.payload) return null
  const data = payload[0].payload

  // Extract values directly from data object - simple and direct
  const cpuValue = typeof data.cpu === 'number' ? data.cpu.toFixed(1) : '';
  const memValue = typeof data.memory === 'number' ? data.memory.toFixed(1) : '';
  
  // Only check if temperature property exists and has a value (don't filter out zeros)
  const hasTemp = 'temperature' in data && 
                  data.temperature !== undefined && 
                  data.temperature !== null;
  
  // Format temperature if available (zero is a valid temperature)
  const tempValue = hasTemp ? Number(data.temperature).toFixed(1) : '';
  
  // CPU cores extraction
  const cpuText = typeof data.cpuCores === 'number' && data.cpuCores > 0 
    ? `${data.cpuCores} cores` 
    : '';
  
  // Memory size in GB
  const memText = typeof data.totalMemoryGB === 'number' && data.totalMemoryGB > 0
    ? `${data.totalMemoryGB.toFixed(1)}GB`
    : '';
  
  // More robust CPU model extraction with cleanup
  let modelText = data.cpuModel || "";
  // Remove any generic "CPU" text or model name prefix if present
  modelText = modelText.replace(/model name\s*:/i, "").trim();
  modelText = modelText.replace(/^CPU\s+/i, "").trim();
  
  const style = {
    padding: '8px 12px',
    background: 'rgba(0, 15, 0, 0.85)',
    border: `1px solid ${themeColors?.primary || 'rgb(67, 200, 110)'}`,
    color: 'white',
    borderRadius: '4px',
    boxShadow: '0 0 8px rgba(67, 200, 110, 0.6)'
  }

  return (
    <div style={style} className="custom-tooltip backdrop-blur-sm max-w-[155px] rounded text-xs">
      <p className="crt-text5 font-bold border-b border-green-500/20 pb-1 mb-1">SYSTEM STATS</p>
      <p className="crt-text5 font-mono">Time: {data.time || new Date(data.timestamp * 1000).toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit', second:'2-digit', hour12: true})}</p>
      {cpuValue && <p style={{ color: themeColors.primary }}>
        CPU: {cpuValue}%{cpuText && <span className="ml-1 opacity-70">({cpuText})</span>}
      </p>}
      {memValue && <p style={{ color: themeColors.secondary }}>
        Memory: {memValue}%{memText && <span className="ml-1 opacity-70">({memText})</span>}
      </p>}
      {hasTemp && <p style={{ color: themeColors.tertiary || '#ff9800' }}>
        Temp: {tempValue}°C
      </p>}
      {modelText && <p className="crt-text4 text-xs mt-1 opacity-60">{modelText}</p>}
    </div>
  )
}