import React from 'react';

/**
 * Network tab for the Debug Overlay
 * Monitors and displays network requests made through fetch API
 */
export default function DebugOverlayNetwork({ networkRequests, setNetworkRequests }) {
  return (
    <div>
      <div className="border border-green-800 rounded p-3">
        <h3 className="text-green-400 mb-2">Network Request Monitor</h3>
        <div className="scanlines bg-green-900/10 p-2 rounded text-xs">
          <div className="overflow-auto max-h-96">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-green-700">
                  <th className="p-1">URL</th>
                  <th className="p-1">Method</th>
                  <th className="p-1">Status</th>
                  <th className="p-1">Time</th>
                </tr>
              </thead>
              <tbody>
                {networkRequests.length > 0 ? networkRequests.map((req, idx) => (
                  <tr key={idx} className="border-b border-green-900/30">
                    <td className="p-1">{req.url}</td>
                    <td className="p-1">{req.method}</td>
                    <td className={`p-1 ${req.status === 'success' ? 'text-green-400' : 
                                       req.status === 'pending' ? 'text-yellow-400' : 'text-red-400'}`}>
                      {req.status === 'success' ? '✅' : req.status === 'pending' ? '⏳' : '❌'} 
                      {req.statusCode ? ` (${req.statusCode})` : ''}
                    </td>
                    <td className="p-1">{new Date(req.timestamp).toLocaleTimeString()}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="p-2 text-center text-yellow-400">
                      No network requests captured yet. Actions like refreshing data will appear here.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {networkRequests.length > 0 && (
            <div className="mt-3 border-t border-green-700 pt-2">
              <button
                className="bg-blue-900/40 border border-blue-700 rounded px-2 py-0.5 text-xs"
                onClick={() => setNetworkRequests([])}
              >
                Clear Requests
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
