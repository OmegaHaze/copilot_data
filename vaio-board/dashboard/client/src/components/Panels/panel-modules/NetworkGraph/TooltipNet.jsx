import React from 'react'

// Helper to format bits to human-readable network speeds - skip Kbps and go straight to Mbps
const formatNetworkSpeed = (bits) => {
  if (bits === undefined || bits === null || isNaN(bits)) return 'ERR';
  
  // Handle very large values properly
  const absValue = Math.abs(bits);
  
  if (absValue < 1024) return bits.toFixed(1) + ' bps';
  // Skip Kbps entirely - go straight to Mbps for better readability
  else if (absValue < 1024 * 1024 * 1024) return (bits / (1024 * 1024)).toFixed(3) + ' Mbps';
  else return (bits / (1024 * 1024 * 1024)).toFixed(2) + ' Gbps';
};

export default function TooltipNet({ active, payload, themeColors, coordinate }) {
  if (!active || !payload?.length || !payload[0]?.payload) return null
  const data = payload[0].payload
  
  // Find rx and tx values in the payload - check for both naming conventions
  const rxPayloadItem = payload.find(p => p.dataKey === 'rx' || p.dataKey === 'rxKB');
  const txPayloadItem = payload.find(p => p.dataKey === 'tx' || p.dataKey === 'txKB');
  
  // Get values from the payload or fallback to data object
  // Recharts may pass the values already converted to the scale we're using
  let rxValue = 'ERR';
  let txValue = 'ERR';
  
  // First try the payload values (from formatter)
  if (rxPayloadItem?.value !== undefined && !isNaN(rxPayloadItem.value)) {
    rxValue = rxPayloadItem.value;
  } 
  // Then try from data object
  else if (typeof data.rx === 'number') {
    rxValue = data.rx;
  }
  else if (typeof data.rxKB === 'number') {
    rxValue = data.rxKB * 1024; // Convert Kb to bits
  }
  
  if (txPayloadItem?.value !== undefined && !isNaN(txPayloadItem.value)) {
    txValue = txPayloadItem.value;
  }
  else if (typeof data.tx === 'number') {
    txValue = data.tx;
  }
  else if (typeof data.txKB === 'number') {
    txValue = data.txKB * 1024; // Convert Kb to bits
  }

  const style = {
    padding: '8px 12px',
    background: 'rgba(0, 15, 0, 0.85)',
    border: `1px solid ${themeColors?.primary || 'rgb(67, 200, 110)'}`,
    color: 'white',
    borderRadius: '4px',
    boxShadow: '0 0 8px rgba(67, 200, 110, 0.6)'
  }
  
  // Format the timestamp properly
  let timeDisplay = 'Unknown';
  try {
    // Network timestamps may be in seconds or milliseconds, handle both formats
    const timestamp = data.timestamp;
    const date = typeof timestamp === 'number' && timestamp > 1000000000000 ? 
      new Date(timestamp) : // Already milliseconds
      new Date(timestamp * 1000); // Convert seconds to milliseconds
    
    timeDisplay = date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'});
  } catch (e) {
    console.error("Error formatting timestamp", e);
  }

  return (
    <div style={style} className="custom-tooltip p-2 bg-black/70 backdrop-blur-sm max-w-[155px] rounded text-xs border border-green-500/30">
      <p className="crt-text5 font-bold border-b border-green-500/20 pb-1 mb-1">NETWORK TRAFFIC</p>
      <p className="crt-text5 font-mono">Time: {timeDisplay}</p>
      <p style={{ color: themeColors?.primary || '#4ade80' }}>
        Download: {rxValue !== 'ERR' ? formatNetworkSpeed(rxValue) : <span className="text-red-400 font-bold">ERR</span>}
      </p>
      <p style={{ color: themeColors?.secondary || '#3b82f6' }}>
        Upload: {txValue !== 'ERR' ? formatNetworkSpeed(txValue) : <span className="text-red-400 font-bold">ERR</span>}
      </p>
      {data.interface && <p className="text-gray-400 text-[10px] mt-1">Interface: {data.interface}</p>}
    </div>
  )
}
