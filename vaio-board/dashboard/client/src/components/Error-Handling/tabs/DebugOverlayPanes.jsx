import React from 'react';

/**
 * Panes tab for the Debug Overlay
 * Shows information about pane components, mappings, and grid connections
 */
export default function DebugOverlayPanes({ 
  missingPanes, 
  gridPaneMap, 
  renderableItems, 
  nonRenderableItems, 
  moduleInitData,
  analyzeGridPaneMapping 
}) {
  return (
    <div>
      {missingPanes.length > 0 && (
        <div className="mt-4 glass-notification border border-red-700/30 rounded-md p-4 error-border-pulse">
          <h3 className="text-red-400 mb-3 border-b border-red-500/20 pb-2 shadow-glow-sm shadow-red-500/20">❌ Missing Pane Components</h3>
          <ul className="list-disc list-inside text-red-300 text-sm">
            {missingPanes.map(key => (
              <li key={key} className="py-0.5">{key}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4 glass-notification border border-red-800/30 rounded-md p-4 error-border-pulse">
        <h3 className="text-red-400 mb-3 border-b border-red-500/20 pb-2 shadow-glow-sm shadow-red-500/20">❌ Missing Pane Mappings</h3>
        <div className="scanlines bg-red-900/10 p-3 rounded-md text-red-300 text-xs">
          {typeof window.getPaneMapErrors === 'function' ? (
            (() => {
              const missing = window.getPaneMapErrors();
              return missing.length > 0 ? (
                <ul className="list-disc pl-5">
                  {missing.map((item, idx) => (
                    <li key={idx}>{typeof item === 'object' ? item.key : item} 
                      {typeof item === 'object' && item.error && 
                        <span className="ml-2 text-red-400">Error: {item.error.error}</span>
                      }
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-green-400">✅ All pane mappings resolved</p>
              );
            })()
          ) : (
            <p>Pane error checker not available.</p>
          )}
        </div>

        {/* ✅ Mapped Pane Keys with Details */}
        {typeof window.getPaneMap === 'function' && (
          <div className="mt-3 border-t border-red-700 pt-3 text-xs text-green-300">
            <h4 className="mb-1">✔️ Loaded Pane Components</h4>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-green-700">
                  <th className="p-1">Key</th>
                  <th className="p-1">Type</th>
                  <th className="p-1">Valid Component</th>
                </tr>
              </thead>
              <tbody className="max-h-32 overflow-auto">
                {Object.entries(window.getPaneMap() || {}).map(([key, info]) => {
                  // With the updated getPaneMap, info is now an object with details about the component
                  // Extract relevant information
                  const compType = info.type || 'unknown';
                  const isValid = info.isValid || false;
                  const hasError = info.error ? true : false;
                  
                  return (
                    <tr key={key} className="border-b border-green-900/30">
                      <td className="p-1">{key}</td>
                      <td className="p-1">{compType}</td>
                      <td className={`p-1 ${isValid ? 'text-green-400' : 'text-red-400'}`}>
                        {isValid ? '✅ Yes' : '❌ No'}
                        {hasError && 
                          <span className="ml-1 cursor-help" title={info.error?.error || "Unknown error"}>
                            ⓘ
                          </span>
                        }
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* RAW PANE MAP - EXACTLY WHAT YOU ASKED FOR */}
      <div className="mt-4 glass-notification border border-red-800/30 rounded-md p-4">
        <h3 className="text-red-400 mb-3 border-b border-red-500/20 pb-2">🔥 RAW PANE MAP DUMP</h3>
        <div className="scanlines bg-red-900/10 p-3 rounded-md text-xs">
          <button
            className="glass-notification border border-red-700/40 rounded px-3 py-1 text-xs mb-3 debug-item-hover shadow-glow-sm text-red-300"
            onClick={() => {
              console.log('Raw Pane Map:', window.getPaneMap ? window.getPaneMap() : 'Not available');
            }}
          >
            Log Raw Pane Map to Console
          </button>
          
          <pre className="overflow-auto max-h-60 text-green-300">
            {JSON.stringify(window.getPaneMap ? window.getPaneMap() : {}, null, 2)}
          </pre>
        </div>
      </div>
      
      {/* Grid Pane Rendering Analysis - THIS IS THE KEY SECTION FOR DEBUGGING */}
      <div className="mt-4 glass-notification border border-blue-800/30 rounded-md p-4">
        <h3 className="text-blue-400 mb-3 border-b border-blue-500/20 pb-2 debug-header">🔍 Grid-Pane Rendering Analysis</h3>
        <div className="scanlines bg-blue-900/10 p-3 rounded-md text-xs">                  
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
            <div>
              <h4 className="text-blue-300 mb-1">✅ Grid Items That Can Render</h4>
              {renderableItems.length > 0 ? (
                <ul className="list-disc pl-5 text-green-300">
                  {renderableItems.map(key => (
                    <li key={key}>{key}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-yellow-400">No grid items can be rendered!</p>
              )}
            </div>
            
            <div>
              <h4 className="text-blue-300 mb-1">❌ Grid Items That CANNOT Render</h4>
              {nonRenderableItems.length > 0 ? (
                <ul className="list-disc pl-5 text-red-300">
                  {nonRenderableItems.map((item, idx) => (
                    <li key={idx}>
                      <strong>{item.key}</strong>: {item.reason}
                      {item.error && <div className="ml-3 text-red-400">Error: {item.error.error}</div>}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-green-400">All grid items can be rendered!</p>
              )}
            </div>
          </div>
          
          <h4 className="text-blue-300 mb-1 border-t border-blue-700 pt-2">Detailed Grid-Pane Connections</h4>
          <table className="w-full text-left border-collapse mt-2">
            <thead>
              <tr className="border-b border-blue-700">
                <th className="p-1">Grid Item</th>
                <th className="p-1">Module Key</th>
                <th className="p-1">Has Component?</th>
                <th className="p-1">Valid Component?</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(gridPaneMap).map(([key, data]) => (
                <tr key={key} className="border-b border-blue-900/30">
                  <td className="p-1">{key}</td>
                  <td className="p-1">{data.moduleKey}</td>
                  <td className={`p-1 ${data.hasPaneComponent ? 'text-green-400' : 'text-red-400'}`}>
                    {data.hasPaneComponent ? '✅' : '❌'}
                  </td>
                  <td className={`p-1 ${data.isValidComponent ? 'text-green-400' : 'text-red-400'}`}>
                    {data.isValidComponent ? '✅' : '❌'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <div className="mt-3 border-t border-blue-700 pt-2">
            <button
              className="glass-notification border border-blue-700/40 rounded px-3 py-1 text-xs debug-item-hover shadow-glow-sm text-blue-300"
              onClick={analyzeGridPaneMapping}
            >
              Re-Analyze Grid-Pane Connections
            </button>
          </div>
        </div>
      </div>
      
      {moduleInitData && (
        <div className="mt-4 glass-notification border border-green-600/20 rounded-md p-4 debug-border-glow">
          <h3 className="text-green-400 mb-3 debug-header border-b border-green-500/20 pb-2">Module Initialization Data</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h4 className="text-green-300 text-sm mb-1">System Modules</h4>
              <div className="scanlines bg-green-900/10 p-2 rounded overflow-auto max-h-40 text-xs">
                <pre>{JSON.stringify(moduleInitData.system || [], null, 2)}</pre>
              </div>
            </div>
            <div>
              <h4 className="text-green-300 text-sm mb-1">Service Modules</h4>
              <div className="scanlines bg-green-900/10 p-2 rounded overflow-auto max-h-40 text-xs">
                <pre>{JSON.stringify(moduleInitData.service || [], null, 2)}</pre>
              </div>
            </div>
            <div>
              <h4 className="text-green-300 text-sm mb-1">User Modules</h4>
              <div className="scanlines bg-green-900/10 p-2 rounded overflow-auto max-h-40 text-xs">
                <pre>{JSON.stringify(moduleInitData.user || [], null, 2)}</pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
