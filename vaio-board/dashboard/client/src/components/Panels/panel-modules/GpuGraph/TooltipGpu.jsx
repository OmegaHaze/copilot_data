// filepath: /home/vaio/vaio-board/dashboard/client/src/components/Panels/panel-modules/GpuGraph/TooltipGpu.jsx
import React from 'react';

export default function TooltipGpu({ active, payload, themeColors }) {
  if (!active || !payload?.length || !payload[0]?.payload) return null;
  const data = payload[0].payload;

  // Debug the actual payload structure for troubleshooting
  console.log("GPU Tooltip payload:", payload);
  console.log("First payload item:", payload[0]);
  console.log("Payload data:", data);

  // Extract values directly from the data object instead of searching payload
  const gpuUsageValue = typeof data.gpuUtil === 'number' ? data.gpuUtil : 'ERR';
  const gpuMemValue = typeof data.memUtil === 'number' ? data.memUtil : 'ERR';
  const gpuTempValue = typeof data.temp === 'number' ? data.temp : 'ERR';

  // Format memory total display
  const hasMemTotal = typeof data.gpuMemTotal !== 'undefined' && data.gpuMemTotal > 0;
  const memTextValue = hasMemTotal ? `${(data.gpuMemTotal / 1024).toFixed(1)}GB` : 'ERR';
  const isMemError = !hasMemTotal;

  const style = {
    marginLeft: 50,
    marginRight: 50,
  };

  return (
    <div style={style} className="custom-tooltip p-2 bg-black/70 backdrop-blur-sm max-w-[135px] rounded text-xs border border-green-500/30">
      <p className="crt-text5 font-bold border-b border-green-500/20 pb-1 mb-1">GPU STATS</p>
      <p className="crt-text5 font-mono">Time: {data.time || new Date(data.timestamp * 1000).toLocaleTimeString()}</p>
      <p style={{ color: themeColors.primary }}>
        Usage: {gpuUsageValue !== 'ERR' ? `${gpuUsageValue}%` : 'N/A'}
      </p>
      <p style={{ color: themeColors.secondary }}>
        Memory: {gpuMemValue !== 'ERR' ? `${gpuMemValue}%` : 'N/A'} <span className="ml-1 opacity-70">({isMemError ? <span className="text-red-400 font-bold">{memTextValue}</span> : memTextValue})</span>
      </p>
      <p style={{ color: themeColors.tertiary }}>
        Temp: {gpuTempValue !== 'ERR' ? `${gpuTempValue}°C` : 'N/A'}
      </p>
    </div>
  );
}
