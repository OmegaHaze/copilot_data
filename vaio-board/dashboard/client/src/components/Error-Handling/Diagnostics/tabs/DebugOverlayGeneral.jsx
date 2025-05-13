import React from 'react';

/**
 * General tab for the Debug Overlay
 * Shows overall system information and supervisor status
 */
export default function DebugOverlayGeneral({ 
  activeModules,
  hasSupervisor,
  supervisorLayout,
  gridLayout,
  fetchSessionData
}) {
  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-notification p-4 rounded-md border border-green-600/20 debug-border-glow">
          <h3 className="text-green-400 mb-3 debug-header border-b border-green-500/20 pb-2">Active Modules ({Array.isArray(activeModules) ? activeModules.length : 0})</h3>
          <div className="scanlines bg-black/30 p-3 rounded-md">
            {Array.isArray(activeModules) && activeModules.length > 0 ? (
              <ul className="space-y-1 text-xs">
                {activeModules.map(mod => {
                  // Parse three-part module ID: MODULETYPE-STATICID-INSTANCEID
                  const parts = mod.split('-');
                  const moduleType = parts.length >= 1 ? parts[0] : '';
                  const staticId = parts.length >= 2 ? parts[1] : '';
                  const instanceId = parts.length >= 3 ? parts[2] : '';
                  
                  // Check for supervisor in three-part format
                  const isSupervisor = moduleType === 'SYSTEM' && staticId === 'SupervisorPane';
                  
                  return (
                    <li key={mod} className={`${isSupervisor ? 'text-yellow-300' : 'text-green-300'} px-3 py-1.5 rounded hover:bg-green-900/20 transition-all debug-item-hover`}>
                      <span className="font-bold">{moduleType}</span>
                      <span className="text-gray-400">-</span>
                      <span>{staticId}</span>
                      <span className="text-gray-400">-</span>
                      <span className="text-gray-500">{instanceId}</span>
                      {isSupervisor && ' ⭐'}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-red-400 flex items-center">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5 shadow-glow-sm shadow-red-500/40 debug-indicator"></span>
                No active modules found.
              </p>
            )}
          </div>
        </div>

        <div className="glass-notification p-4 rounded-md border border-green-600/20 debug-border-glow">
          <h3 className="text-green-400 mb-3 debug-header border-b border-green-500/20 pb-2">Supervisor Status</h3>
          <div className="scanlines bg-black/30 p-3 rounded-md">
            <div className="flex items-center gap-2 p-1 rounded transition-colors">
              <span className={`h-3 w-3 rounded-full ${
                hasSupervisor 
                  ? 'bg-green-500 shadow-glow-sm shadow-green-500/40 debug-indicator' 
                  : 'bg-red-500 debug-indicator'
              }`}></span>
              <span className="text-xs">{hasSupervisor ? 'Active in modules list' : 'Not in active modules'}</span>
            </div>
            <div className="flex items-center gap-2 mt-2 p-1 rounded transition-colors">
              <span className={`h-3 w-3 rounded-full ${
                supervisorLayout 
                  ? 'bg-green-500 shadow-glow-sm shadow-green-500/40 debug-indicator' 
                  : 'bg-red-500 debug-indicator'
              }`}></span>
              <span className="text-xs">{supervisorLayout ? 'Has layout data' : 'No layout data'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 debug-glass-panel p-4 rounded-lg">
        <h3 className="text-green-400 mb-2 debug-header border-b border-green-500/20 pb-1">Grid Layout Data</h3>
        <div className="scanlines bg-black/20 p-3 rounded-md overflow-auto max-h-60">
          <pre className="text-xs text-green-300">{JSON.stringify(gridLayout, null, 2)}</pre>
        </div>
      </div>

      {supervisorLayout && (
        <div className="mt-4 debug-glass-panel p-4 rounded-lg">
          <h3 className="text-green-400 mb-2 debug-header border-b border-green-500/20 pb-1">Supervisor Layout Details</h3>
          <div className="scanlines bg-black/20 p-3 rounded-md">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-green-700/30">
                  <th className="text-left p-1 text-green-400">Property</th>
                  <th className="text-left p-1 text-green-400">Value</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(supervisorLayout).map(([key, value]) => (
                  <tr key={key} className="border-b border-green-900/20 hover:bg-green-900/10">
                    <td className="p-1.5 text-green-300">{key}</td>
                    <td className="p-1.5 text-green-200">{typeof value === 'object' ? JSON.stringify(value) : value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mt-4 glass-notification rounded-md p-3">
        <h3 className="text-green-400 mb-2 crt-text3 border-b border-green-500/20 pb-1">Recommended Actions</h3>
        <div className="scanlines bg-black/20 p-2 rounded">
          <ul className="space-y-2 text-xs">
            {!hasSupervisor && 
              <li className="flex items-center p-1.5 rounded bg-red-900/10 border border-red-500/30">
                <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-2 shadow-glow-sm shadow-red-500/40"></span>
                <span className="text-red-300">Add 'supervisor' to active modules</span>
              </li>
            }
            {hasSupervisor && !supervisorLayout && (
              <li className="flex items-center justify-between p-1.5 rounded bg-red-900/10 border border-red-500/30">
                <div className="flex items-center">
                  <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-2 shadow-glow-sm shadow-red-500/40"></span>
                  <span className="text-red-300">Supervisor is active but missing layout data</span>
                </div>
                <button
                  className="ml-2 glass-notification border border-blue-500/30 text-blue-300 rounded px-2 py-0.5 text-xs hover:bg-blue-900/20 transition-colors"
                  onClick={() => {
                    if (typeof window.vaioResetLayout === 'function') {
                      window.vaioResetLayout();
                    } else {
                      console.warn('❌ Reset function not available');
                    }
                  }}
                >
                  Reset Layout
                </button>
              </li>
            )}
            {supervisorLayout && !supervisorLayout.i && (
              <li className="flex items-center p-1.5 rounded bg-yellow-900/10 border border-yellow-500/30">
                <span className="inline-block w-2 h-2 rounded-full bg-yellow-500 mr-2 shadow-glow-sm shadow-yellow-500/40"></span>
                <span className="text-yellow-300">Supervisor layout is missing required 'i' property</span>
              </li>
            )}
            <li className="flex justify-end mt-2">
              <button
                className="glass-notification border border-green-500/30 text-green-300 rounded px-3 py-1 text-xs hover:bg-green-900/20 transition-colors"
                onClick={fetchSessionData}
              >
                Refresh Session Data
              </button>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
