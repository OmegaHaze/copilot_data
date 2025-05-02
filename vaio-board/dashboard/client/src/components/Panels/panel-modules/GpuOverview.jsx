import React, { useEffect, useState } from 'react'

const NvidiaIcons = {
  Architecture: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>,
  CUDA: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 12 6 3v-6l-6 3z"></path><path d="M6.5 9.5 9 12l-2.5 2.5"></path><path d="M14 6.5v11"></path><path d="M17 7.5v9"></path><path d="M20 8.5v7"></path></svg>,
  Cores: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 20V10"></path><path d="M12 20V4"></path><path d="M6 20v-6"></path></svg>,
  TensorCores: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="4" width="16" height="16" rx="2"></rect><rect x="9" y="9" width="6" height="6"></rect></svg>,
  Compute: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"></path></svg>,
  Memory: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="4" width="16" height="16" rx="2"></rect></svg>
}

const SettingsSection = ({ title, children, glowIntensity = 2 }) => (
  <div
    className="border border-green-800/50 rounded bg-black/30 p-3 mb-3"
    style={{ filter: `drop-shadow(0 0 ${glowIntensity}px rgba(0, 255, 0, 0.3))` }}
  >
    <h4 className="text-green-300 font-bold mb-2 border-b border-green-800/50 pb-1 flex items-center text-[11px] uppercase tracking-wider">
      <span className="mr-1 text-green-400">▣</span>{title}
    </h4>
    <div className="space-y-2">{children}</div>
  </div>
)

const GPUProperty = ({ label, value, icon }) => (
  <div className="flex mb-1 items-center">
    <div className="w-1/3 text-green-300 font-mono text-[10px] flex items-center">
      {icon && <span className="mr-1">{icon}</span>}{label}:
    </div>
    <div className="w-2/3 crt-text3 font-mono text-[10px]">{value}</div>
  </div>
)

export default function GpuOverview({ staticData, glowIntensity = 2 }) {
  if (!staticData || typeof staticData !== 'object' || !staticData.name) return null;

  const formatMemory = (memoryMiB) => {
    if (!memoryMiB) return 'Unknown';
    return memoryMiB >= 1024 ? `${(memoryMiB / 1024).toFixed(1)} GB` : `${memoryMiB} MiB`;
  };

  return (
    <SettingsSection title="GPU Overview" glowIntensity={glowIntensity}>
      <div className="crt-text3 font-mono text-[10px] mb-2 border-b border-green-800/30 pb-1">
        <span className="text-green-400">GPU:</span> {staticData.name || 'Unknown'} |
        <span className="text-green-400 ml-1">Driver:</span> {staticData.driver_version || 'Unknown'}
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        <GPUProperty icon={<NvidiaIcons.Architecture />} label="ARCH" value={staticData.architecture || 'Unknown'} />
        <GPUProperty icon={<NvidiaIcons.Compute />} label="Compute" value={staticData.compute_capability || 'Unknown'} />
        <GPUProperty icon={<NvidiaIcons.Cores />} label="CUDA Cores" value={staticData.cuda_cores || 'Unknown'} />
        <GPUProperty icon={<NvidiaIcons.Memory />} label="Total VRAM" value={staticData.memory_total ? formatMemory(staticData.memory_total) : 'Unknown'} />
        <GPUProperty icon={<NvidiaIcons.Memory />} label="PCI Bus" value={staticData.pci_bus || 'Unknown'} />
      </div>
    </SettingsSection>
  )
}
