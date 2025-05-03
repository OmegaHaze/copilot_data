import React from 'react';

/**
 * Storage tab for the Debug Overlay
 * Shows localStorage and sessionStorage contents
 */
export default function DebugOverlayStorage({ storageData }) {
  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-notification rounded-md p-4 border border-green-600/20 debug-border-glow">
          <h3 className="text-green-400 mb-3 debug-header border-b border-green-500/20 pb-2">Local Storage</h3>
          <div className="scanlines bg-black/30 p-3 rounded-md overflow-auto max-h-96 text-xs">
            {Object.keys(storageData.local).length > 0 ? (
              <div>
                {Object.entries(storageData.local).map(([key, value]) => (
                  <div key={key} className="mb-3 border border-green-500/10 rounded bg-black/20 overflow-hidden">
                    <div className="font-bold text-green-400 px-2 py-1 bg-green-900/20 border-b border-green-500/20">
                      {key}
                    </div>
                    <pre className="text-xs p-2 break-words whitespace-pre-wrap text-green-200">
                      {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                    </pre>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-yellow-400 flex items-center p-2">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-yellow-500 mr-1.5 shadow-glow-sm shadow-yellow-500/40 debug-indicator"></span>
                No localStorage items found.
              </p>
            )}
          </div>
        </div>
        
        <div className="glass-notification rounded-md p-4 border border-green-600/20 debug-border-glow">
          <h3 className="text-green-400 mb-3 debug-header border-b border-green-500/20 pb-2">Session Storage</h3>
          <div className="scanlines bg-black/30 p-3 rounded-md overflow-auto max-h-96 text-xs">
            {Object.keys(storageData.session).length > 0 ? (
              <div>
                {Object.entries(storageData.session).map(([key, value]) => (
                  <div key={key} className="mb-3 border border-green-500/10 rounded bg-black/20 overflow-hidden">
                    <div className="font-bold text-green-400 px-2 py-1 bg-green-900/20 border-b border-green-500/20">
                      {key}
                    </div>
                    <pre className="text-xs p-2 break-words whitespace-pre-wrap text-green-200">
                      {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                    </pre>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-yellow-400 flex items-center p-2">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-yellow-500 mr-1.5 shadow-glow-sm shadow-yellow-500/40 debug-indicator"></span>
                No sessionStorage items found.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
