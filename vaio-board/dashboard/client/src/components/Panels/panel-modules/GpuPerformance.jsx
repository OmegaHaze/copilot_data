// Fixed GpuPerformance.jsx - hiding Advanced Details section
import React from 'react';
import GpuPerfGraph from './GpuGraph/GpuPerfGraph';
import { NvidiaIcons } from './GpuGraph/GpuIcons'

const SettingsSection = ({ title, children, glowIntensity = 2 }) => (
  <div className="border border-green-800/50 rounded bg-black/30 p-3 mb-3" style={{ filter: `drop-shadow(0 0 ${glowIntensity}px rgba(0, 255, 0, 0.3))` }}>
    <h4 className="text-green-300 font-bold mb-2 border-b border-green-800/50 pb-1 flex items-center text-[11px] uppercase tracking-wider">
      <span className="mr-1 text-green-400">▣</span>{title}
    </h4>
    <div className="space-y-2">{children}</div>
  </div>
);

const MetricBar = ({ label, value, maxValue = 100, icon, unit = '%', criticalThreshold = 80, warningThreshold = 60 }) => {
  const percentage = Math.min(100, Math.max(0, (value / maxValue) * 100));
  let barColor = 'bg-green-500';
  if (percentage >= criticalThreshold) barColor = 'bg-red-500';
  else if (percentage >= warningThreshold) barColor = 'bg-yellow-500';
  return (
    <div className="mb-2">
      <div className="flex justify-between items-center mb-0.5">
        <div className="text-green-300 font-mono text-[10px] flex items-center">
          {icon && <span className="mr-1">{icon}</span>}{label}
        </div>
        <div className="crt-text3 font-mono text-[10px]">
          {value}{unit} {maxValue !== 100 && `/ ${maxValue}${unit}`}
        </div>
      </div>
      <div className="h-1.5 bg-black/60 rounded overflow-hidden border border-green-900/50">
        <div className={`h-full ${barColor} transition-all duration-300 shadow-[0_0_3px_rgba(0,255,0,0.5)]`} style={{ width: `${percentage}%` }}></div>
      </div>
    </div>
  );
};

const GPUProperty = ({ label, value, icon }) => (
  <div className="flex mb-1 items-center">
    <div className="w-1/3 text-green-300 font-mono text-[10px] flex items-center">
      {icon && <span className="mr-1">{icon}</span>}{label}:
    </div>
    <div className="w-2/3 crt-text3 font-mono text-[10px]">{value}</div>
  </div>
);

const GpuPerformance = ({ gpuData, glowIntensity = 2 }) => {
  if (!gpuData) return <div className="text-center p-4 text-green-400">Loading GPU data...</div>;

  const formatMemory = (v) => typeof v === 'number' ? (v >= 1024 ? `${(v / 1024).toFixed(2)} GB` : `${v} MiB`) : 'Unknown';
  const calculateMemoryPercentage = (u, t) => (typeof u === 'number' && typeof t === 'number' && t > 0 ? Math.round((u / t) * 100) : 0);

  const safeGpuData = {
    ...gpuData,
    history: Array.isArray(gpuData.history) ? gpuData.history : [],
    live: {
      temperature: gpuData.live?.temperature ?? 0,
      utilization: gpuData.live?.utilization ?? 0,
      memory: {
        used: gpuData.live?.memory?.used ?? 0,
        total: gpuData.live?.memory?.total ?? 1,
        free: gpuData.live?.memory?.free ?? 0
      },
      power: {
        draw: gpuData.live?.power?.draw ?? 0,
        limit: gpuData.live?.power?.limit ?? 100
      },
      clocks: gpuData.live?.clocks ?? {},
      bar1_memory: gpuData.live?.bar1_memory ?? null,
      encoder_utilization: gpuData.live?.encoder_utilization ?? null
    },
    clock_speeds: gpuData.clock_speeds ?? {},
    max_clocks: gpuData.max_clocks ?? {},
    decoder_utilization: gpuData.decoder_utilization ?? null
  };

  const { live } = safeGpuData;

  return (
    <div className="gpu-performance-container space-y-3">
      {(!live.temperature && !live.clocks && !live.utilization) && (
        <div className="text-yellow-500 text-xs font-mono bg-yellow-900/40 px-2 py-1 rounded mb-2">
          Live GPU telemetry incomplete — check streaming service health.
        </div>
      )}
      <SettingsSection title="GPU Utilization & Performance" glowIntensity={glowIntensity}>
        <MetricBar label="GPU Core" value={live.utilization} icon={<NvidiaIcons.Utilization />} unit="%" warningThreshold={70} criticalThreshold={90} />
        <MetricBar label="Memory Usage" value={calculateMemoryPercentage(live.memory.used, live.memory.total)} icon={<NvidiaIcons.Memory />} unit="%" warningThreshold={80} criticalThreshold={95} />
        <MetricBar label="Temperature" value={live.temperature} maxValue={100} icon={<NvidiaIcons.Temperature />} unit="°C" warningThreshold={70} criticalThreshold={85} />
        <MetricBar label="Power Draw" value={Math.round(live.power.draw)} maxValue={Math.round(live.power.limit)} icon={<NvidiaIcons.Power />} unit="W" warningThreshold={85} criticalThreshold={95} />
        <div className="grid grid-cols-3 gap-2 mt-2">
          <GPUProperty label="VRAM Total" value={formatMemory(live.memory.total)} />
          <GPUProperty label="VRAM Used" value={formatMemory(live.memory.used)} />
          <GPUProperty label="VRAM Free" value={formatMemory(live.memory.free)} />
        </div>
      </SettingsSection>

      <SettingsSection title="GPU Performance History" glowIntensity={glowIntensity}>
  <div style={{ height: '200px' }}>
  <GpuPerfGraph />


  </div>
</SettingsSection>

      <SettingsSection title="Clock Speeds" glowIntensity={glowIntensity}>
        {safeGpuData.max_clocks.graphics !== undefined && <MetricBar label="Graphics Clock" value={safeGpuData.clock_speeds.graphics || 0} maxValue={safeGpuData.max_clocks.graphics} icon={<NvidiaIcons.Clock />} unit=" MHz" />}
        {safeGpuData.max_clocks.memory !== undefined && <MetricBar label="Memory Clock" value={safeGpuData.clock_speeds.memory || 0} maxValue={safeGpuData.max_clocks.memory} icon={<NvidiaIcons.Memory />} unit=" MHz" />}
        {safeGpuData.clock_speeds.sm !== undefined && <MetricBar label="SM Clock" value={safeGpuData.clock_speeds.sm} maxValue={safeGpuData.max_clocks.sm || safeGpuData.max_clocks.graphics || 2000} icon={<NvidiaIcons.Compute />} unit=" MHz" />}
        {safeGpuData.clock_speeds.video !== undefined && <MetricBar label="Video Clock" value={safeGpuData.clock_speeds.video} maxValue={safeGpuData.max_clocks.video || safeGpuData.max_clocks.graphics || 1500} icon={<NvidiaIcons.VideoEncode />} unit=" MHz" />}
      </SettingsSection>

    
    </div>
  );
};

export default GpuPerformance;
