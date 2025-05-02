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
        <div className="border border-green-800 rounded p-3">
          <h3 className="text-green-400 mb-2">Active Modules ({Array.isArray(activeModules) ? activeModules.length : 0})</h3>
          <div className="scanlines bg-green-900/10 p-2 rounded">
            {Array.isArray(activeModules) && activeModules.length > 0 ? (
              <ul>
                {activeModules.map(mod => (
                  <li key={mod} className={mod === 'supervisor'  ? 'text-yellow-400' : ''}>
                    {mod} {(mod === 'supervisor') && '⭐'}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-red-400">No active modules found.</p>
            )}
          </div>
        </div>

        <div className="border border-green-800 rounded p-3">
          <h3 className="text-green-400 mb-2">Supervisor Status</h3>
          <div className="scanlines bg-green-900/10 p-2 rounded">
            <div className="flex items-center gap-2">
              <span className={`h-3 w-3 rounded-full ${hasSupervisor ? 'bg-green-500 flash-flicker' : 'bg-red-500'}`}></span>
              <span>{hasSupervisor ? 'Active in modules list' : 'Not in active modules'}</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className={`h-3 w-3 rounded-full ${supervisorLayout ? 'bg-green-500 flash-flicker' : 'bg-red-500'}`}></span>
              <span>{supervisorLayout ? 'Has layout data' : 'No layout data'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 border border-green-800 rounded p-3">
        <h3 className="text-green-400 mb-2">Grid Layout Data</h3>
        <div className="scanlines bg-green-900/10 p-2 rounded overflow-auto max-h-60">
          <pre className="text-xs">{JSON.stringify(gridLayout, null, 2)}</pre>
        </div>
      </div>

      {supervisorLayout && (
        <div className="mt-4 border border-green-800 rounded p-3">
          <h3 className="text-green-400 mb-2">Supervisor Layout Details</h3>
          <div className="scanlines bg-green-900/10 p-2 rounded">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-green-700">
                  <th className="text-left p-1">Property</th>
                  <th className="text-left p-1">Value</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(supervisorLayout).map(([key, value]) => (
                  <tr key={key} className="border-b border-green-900">
                    <td className="p-1 text-green-200">{key}</td>
                    <td className="p-1">{typeof value === 'object' ? JSON.stringify(value) : value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mt-4">
        <h3 className="text-green-400 mb-2">Recommended Actions:</h3>
        <div className="scanlines bg-green-900/10 p-2 rounded">
          <ul className="list-disc pl-5">
            {!hasSupervisor && <li className="text-red-300">Add 'supervisor' to active modules</li>}
            {hasSupervisor && !supervisorLayout && (
              <li className="text-red-300">
                Supervisor is active but missing layout data. Try:
                <button
                  className="ml-2 bg-blue-900/40 border border-blue-700 rounded px-2 py-0.5 text-xs"
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
              <li className="text-yellow-300">Supervisor layout is missing required 'i' property</li>
            )}
            <li className="text-cyan-300 mt-2">
              <button
                className="bg-blue-900/40 border border-blue-700 rounded px-2 py-0.5 text-xs"
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
