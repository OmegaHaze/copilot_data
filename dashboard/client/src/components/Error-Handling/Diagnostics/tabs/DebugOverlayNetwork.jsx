import React from 'react';

/**
 * Network tab for the Debug Overlay
 * Monitors and displays network requests made through fetch API
 */
export default function DebugOverlayNetwork({ networkRequests, setNetworkRequests }) {
  return (
    <div>
      <div className="glass-notification rounded-md p-4 border border-green-600/20 debug-border-glow">
        <h3 className="text-green-400 mb-3 debug-header border-b border-green-500/20 pb-2">Network Request Monitor</h3>
        <div className="scanlines bg-black/30 p-3 rounded-md text-xs">
          <div className="overflow-auto max-h-96">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-green-700/30">
                  <th className="p-2 text-green-400">URL</th>
                  <th className="p-2 text-green-400">Method</th>
                  <th className="p-2 text-green-400">Status</th>
                  <th className="p-2 text-green-400">Time</th>
                </tr>
              </thead>
              <tbody>
                {networkRequests.length > 0 ? networkRequests.map((req, idx) => (
                  <tr key={idx} className="border-b border-green-900/20 hover:bg-green-900/10">
                    <td className="p-1.5 text-green-300">{req.url}</td>
                    <td className="p-1.5">{req.method}</td>
                    <td className={`p-1.5 ${
                      req.status === 'success' 
                        ? 'text-green-400' 
                        : req.status === 'pending' 
                          ? 'text-yellow-400' 
                          : 'text-red-400'
                    }`}>
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded-sm ${
                        req.status === 'success' 
                          ? 'bg-green-900/20 border border-green-500/30' 
                          : req.status === 'pending' 
                            ? 'bg-yellow-900/20 border border-yellow-500/30' 
                            : 'bg-red-900/20 border border-red-500/30'
                      }`}>
                        {req.status} {req.statusCode ? `(${req.statusCode})` : ''}
                      </span>
                    </td>
                    <td className="p-1.5 text-green-200">{new Date(req.timestamp).toLocaleTimeString()}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="p-3 text-center text-yellow-400">
                      No network requests captured yet. Actions like refreshing data will appear here.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {networkRequests.length > 0 && (
            <div className="mt-3 border-t border-green-700/20 pt-2 flex justify-end">
              <button
                className="glass-notification border border-green-500/30 text-green-300 rounded px-3 py-1 text-xs hover:bg-green-900/20 transition-colors debug-item-hover shadow-glow-sm"
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
