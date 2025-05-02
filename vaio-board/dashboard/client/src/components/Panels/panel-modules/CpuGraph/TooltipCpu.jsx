import React from 'react'

export default function TooltipCpu({ active, payload, themeColors, coordinate }) {
  if (!active || !payload?.length || !payload[0]?.payload) return null
  const data = payload[0].payload

  // Extract CPU, memory and temperature values from payload
  let cpuValue = 'ERR';
  let memValue = 'ERR';
  let tempValue = 'ERR';
  
  // Debug logging disabled in production
  // Find values in payload first, as Recharts sometimes restructures the data
  const cpuPayloadItem = payload.find(p => p.dataKey === 'cpu');
  const memPayloadItem = payload.find(p => p.dataKey === 'memory');
  const tempPayloadItem = payload.find(p => p.dataKey === 'temperature');
  
  if (cpuPayloadItem && typeof cpuPayloadItem.value === 'number') {
    cpuValue = cpuPayloadItem.value.toFixed(1);
  } else if (typeof data.cpu === 'number') {
    cpuValue = data.cpu.toFixed(1);
  }
  
  if (memPayloadItem && typeof memPayloadItem.value === 'number') {
    memValue = memPayloadItem.value.toFixed(1);
  } else if (typeof data.memory === 'number') {
    memValue = data.memory.toFixed(1);
  }
  
  if (tempPayloadItem && typeof tempPayloadItem.value === 'number') {
    tempValue = tempPayloadItem.value.toFixed(1);
  } else if (typeof data.temperature === 'number') {
    tempValue = data.temperature.toFixed(1);
  } else if (typeof data.cpu_temperature === 'number') {
    tempValue = data.cpu_temperature.toFixed(1);
  }
  
  // Debug logging disabled in production

  // Get CPU cores - check both naming conventions (cpuCores and cpu_cores)
  let cpuText = '?? cores';
  if (typeof data.cpuCores === 'number' && data.cpuCores > 0) {
    cpuText = `${data.cpuCores} cores`;
  } else if (typeof data.cpu_cores === 'number' && data.cpu_cores > 0) {
    cpuText = `${data.cpu_cores} cores`;
  }
  
  // Get memory size in GB - check both naming conventions
  let memText = '16GB'; // Default value
  if (typeof data.totalMemoryGB === 'string' && data.totalMemoryGB) {
    memText = `${data.totalMemoryGB}GB`;
  } else if (typeof data.total_memory_gb === 'string' && data.total_memory_gb) {
    memText = `${data.total_memory_gb}GB`;
  } else if (typeof data.totalMemoryGB === 'number' && data.totalMemoryGB > 0) {
    memText = `${data.totalMemoryGB.toFixed(1)}GB`;
  } else if (typeof data.total_memory_gb === 'number' && data.total_memory_gb > 0) {
    memText = `${data.total_memory_gb.toFixed(1)}GB`;
  }
  
  // Get CPU model - check both naming conventions and clean up the model name
  let modelText = data.cpuModel || data.cpu_model || "";
  
  
  // Clean up other common prefixes
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
      <p className="crt-text5 font-mono">Time: {new Date(data.timestamp * 1000).toLocaleTimeString()}</p>
      <p style={{ color: themeColors.primary }}>
        CPU: {cpuValue}%<span className="ml-1 opacity-70">({cpuText})</span>
      </p>
      <p style={{ color: themeColors.secondary }}>
        Memory: {memValue}%<span className="ml-1 opacity-70">({memText})</span>
      </p>
      <p style={{ color: themeColors.tertiary || '#ff9800' }}>
        Temp: {tempValue}°C
      </p>
      <p className="crt-text4 text-xs mt-1 opacity-60">{modelText}</p>
    </div>
  )
}
