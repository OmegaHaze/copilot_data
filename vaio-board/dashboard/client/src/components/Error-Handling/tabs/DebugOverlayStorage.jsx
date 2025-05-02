import React from 'react';

/**
 * Storage tab for the Debug Overlay
 * Shows localStorage and sessionStorage contents
 */
export default function DebugOverlayStorage({ storageData }) {
  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border border-green-800 rounded p-3">
          <h3 className="text-green-400 mb-2">Local Storage</h3>
          <div className="scanlines bg-green-900/10 p-2 rounded overflow-auto max-h-96 text-xs">
            {Object.keys(storageData.local).length > 0 ? (
              <div>
                {Object.entries(storageData.local).map(([key, value]) => (
                  <div key={key} className="mb-2 border-b border-green-900/30 pb-1">
                    <div className="font-bold text-green-400">{key}</div>
                    <pre className="text-xs mt-1 break-words whitespace-pre-wrap">
                      {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                    </pre>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-yellow-400">No localStorage items found.</p>
            )}
          </div>
        </div>
        
        <div className="border border-green-800 rounded p-3">
          <h3 className="text-green-400 mb-2">Session Storage</h3>
          <div className="scanlines bg-green-900/10 p-2 rounded overflow-auto max-h-96 text-xs">
            {Object.keys(storageData.session).length > 0 ? (
              <div>
                {Object.entries(storageData.session).map(([key, value]) => (
                  <div key={key} className="mb-2 border-b border-green-900/30 pb-1">
                    <div className="font-bold text-green-400">{key}</div>
                    <pre className="text-xs mt-1 break-words whitespace-pre-wrap">
                      {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                    </pre>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-yellow-400">No sessionStorage items found.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
