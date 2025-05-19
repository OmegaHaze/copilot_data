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
          {window.debugRegistry && typeof window.debugRegistry.getComponents === 'function' ? (
            (() => {
              const components = window.debugRegistry.getComponents();
              const missing = Object.entries(components)
                .filter(([_, info]) => info.error)
                .map(([key, info]) => ({ key, error: info.error }));
                
              return missing.length > 0 ? (
                <ul className="list-disc pl-5">
                  {missing.map((item, idx) => (
                    <li key={idx}>{item.key} 
                      {item.error && 
                        <span className="ml-2 text-red-400">Error: {typeof item.error === 'object' ? item.error.error || item.error.message : item.error}</span>
                      }
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-green-400">✅ All pane mappings resolved</p>
              );
            })()
          ) : (
            <p>Component registry not available.</p>
          )}
        </div>

        {/* ✅ Mapped Pane Keys with Details */}
        {window.debugRegistry && typeof window.debugRegistry.getComponents === 'function' && (
          <div className="mt-3 border-t border-red-700 pt-3 text-xs text-green-300">
            <h4 className="mb-1">✔️ Loaded Pane Components</h4>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-green-700">
                  <th className="p-1">Key</th>
                  <th className="p-1">Category</th>
                  <th className="p-1">Name</th>
                  <th className="p-1">Valid Component</th>
                </tr>
              </thead>
              <tbody className="max-h-32 overflow-auto">
                {Object.entries(window.debugRegistry.getComponents() || {}).map(([key, info]) => {
                  // Extract relevant information from the component registry
                  const category = info.category || 'unknown';
                  const name = info.name || 'unnamed';
                  const isValid = info.registered && !info.error;
                  const hasError = info.error ? true : false;
                  
                  return (
                    <tr key={key} className="border-b border-green-900/30">
                      <td className="p-1">{key}</td>
                      <td className="p-1">{category}</td>
                      <td className="p-1">{name}</td>
                      <td className={`p-1 ${isValid ? 'text-green-400' : 'text-red-400'}`}>
                        {isValid ? '✅ Yes' : '❌ No'}
                        {hasError && 
                          <span className="ml-1 cursor-help" title={typeof info.error === 'object' ? info.error.error || info.error.message : info.error || "Unknown error"}>
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
      
      {/* COMPONENT REGISTRY - EXACTLY WHAT YOU ASKED FOR */}
      <div className="mt-4 glass-notification border border-red-800/30 rounded-md p-4">
        <h3 className="text-red-400 mb-3 border-b border-red-500/20 pb-2">🔥 COMPONENT REGISTRY DUMP</h3>
        <div className="scanlines bg-red-900/10 p-3 rounded-md text-xs">
          <button
            className="glass-notification border border-red-700/40 rounded px-3 py-1 text-xs mb-3 debug-item-hover shadow-glow-sm text-red-300"
            onClick={() => {
              console.log('Component Registry:', window.debugRegistry && window.debugRegistry.getComponents ? window.debugRegistry.getComponents() : 'Not available');
            }}
          >
            Log Component Registry to Console
          </button>
          
          <pre className="overflow-auto max-h-60 text-green-300">
            {JSON.stringify(window.debugRegistry && window.debugRegistry.getComponents ? window.debugRegistry.getComponents() : {}, null, 2)}
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
                <th className="p-1">Module ID</th>
                <th className="p-1">Module Type</th>
                <th className="p-1">Static ID</th>
                <th className="p-1">Instance ID</th>
                <th className="p-1">Has Component?</th>
                <th className="p-1">Valid?</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(gridPaneMap).map(([key, data]) => (
                <tr key={key} className="border-b border-blue-900/30">
                  <td className="p-1">{key}</td>
                  <td className="p-1">{data.moduleType || '—'}</td>
                  <td className="p-1">{data.staticId || '—'}</td>
                  <td className="p-1">{data.instanceId || '—'}</td>
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
          
          <div className="mb-2">
            <button
              className="glass-notification border border-green-700/40 rounded px-3 py-1 text-xs debug-item-hover shadow-glow-sm text-green-300 mr-2"
              onClick={async (e) => {
                try {
                  // Visual feedback
                  const button = e.target;
                  const originalText = button.innerText;
                  button.innerText = "Refreshing...";
                  button.disabled = true;
                  
                  console.log('Manually refreshing module data from API...');
                  
                  // Import the module fetching function directly
                  const { fetchAllModules } = await import('../../../Panes/Utility/Loader/Component/component-api');
                  const registry = (await import('../../../Panes/Utility/Loader/Component/component-registry')).default;
                  
                  // Fetch fresh data directly from the API - only one request per click
                  const moduleData = await fetchAllModules();
                  console.log('API returned module data:', moduleData);
                  
                  if (moduleData) {
                    // Update the registry with fresh data
                    registry.setModuleData(moduleData);
                    
                    // Get the updated data from the registry to verify it's set
                    const verifyData = registry.getModuleData();
                    console.log('Registry now contains:', verifyData);
                    
                    // Dispatch a custom event that the debug overlay listens for
                    window.dispatchEvent(new CustomEvent('vaio:module-data-updated', { 
                      detail: { moduleData: verifyData, timestamp: Date.now() } 
                    }));
                    
                    // Update through parent component's passed function
                    if (analyzeGridPaneMapping) {
                      analyzeGridPaneMapping();
                    }
                    
                    // Restore button
                    setTimeout(() => {
                      button.innerText = "✓ Refreshed";
                      setTimeout(() => {
                        button.innerText = originalText;
                        button.disabled = false;
                      }, 1500);
                    }, 500);
                  } else {
                    console.warn('Failed to fetch module data from API');
                    button.innerText = "❌ Failed";
                    setTimeout(() => {
                      button.innerText = originalText;
                      button.disabled = false;
                    }, 1500);
                  }
                } catch (error) {
                  console.error('Error refreshing module data:', error);
                  e.target.innerText = "❌ Error";
                  setTimeout(() => {
                    e.target.innerText = "Force Refresh Module Data";
                    e.target.disabled = false;
                  }, 1500);
                }
              }}
            >
              Force Refresh Module Data
            </button>
            
            {/* Direct API check button */}
            <button
              className="glass-notification border border-yellow-700/40 rounded px-3 py-1 text-xs debug-item-hover shadow-glow-sm text-yellow-300 mr-2"
              onClick={async () => {
                try {
                  console.log('Testing API endpoints directly...');
                  const endpoints = ['SYSTEM', 'SERVICE', 'USER'];
                  
                  for (const type of endpoints) {
                    try {
                      // Removed automatic API calls for debugging purposes
                      console.log(`Testing /api/modules?module_type=${type}...`);
                    } catch (endpointErr) {
                      console.error(`- API test failed for ${type}:`, endpointErr);
                    }
                  }
                } catch (error) {
                  console.error('API endpoint test failed:', error);
                }
              }}
            >
              Test API Endpoints
            </button>
            
            <span className="text-xs text-green-400">
              {moduleInitData._timestamp ? new Date(moduleInitData._timestamp).toLocaleTimeString() : 'No timestamp'}
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h4 className="text-green-300 text-sm mb-1">
                System Modules 
                <span className="ml-2 text-xs">
                  {Array.isArray(moduleInitData.SYSTEM) && moduleInitData.SYSTEM.length > 0 
                    ? <span className="text-green-400">({moduleInitData.SYSTEM.length})</span>
                    : <span className="text-red-400">(Empty)</span>
                  }
                </span>
                {moduleInitData._apiStatus && moduleInitData._apiStatus.SYSTEM && (
                  <span className={`ml-2 text-xs ${moduleInitData._apiStatus.SYSTEM.ok ? 'text-green-400' : 'text-red-400'}`}>
                    [API: {moduleInitData._apiStatus.SYSTEM.ok ? 'OK' : 'Error'}]
                  </span>
                )}
              </h4>
              <div className="scanlines bg-green-900/10 p-2 rounded overflow-auto max-h-40 text-xs">
                {Array.isArray(moduleInitData.SYSTEM) && moduleInitData.SYSTEM.length > 0 ? (
                  <pre>{JSON.stringify(moduleInitData.SYSTEM, null, 2)}</pre>
                ) : (
                  <div className="text-yellow-400 p-2">
                    No system modules found. This might indicate an API issue or that modules aren't registered.
                  </div>
                )}
              </div>
            </div>
            <div>
              <h4 className="text-green-300 text-sm mb-1">
                Service Modules
                <span className="ml-2 text-xs">
                  {Array.isArray(moduleInitData.SERVICE) && moduleInitData.SERVICE.length > 0 
                    ? <span className="text-green-400">({moduleInitData.SERVICE.length})</span>
                    : <span className="text-red-400">(Empty)</span>
                  }
                </span>
                {moduleInitData._apiStatus && moduleInitData._apiStatus.SERVICE && (
                  <span className={`ml-2 text-xs ${moduleInitData._apiStatus.SERVICE.ok ? 'text-green-400' : 'text-red-400'}`}>
                    [API: {moduleInitData._apiStatus.SERVICE.ok ? 'OK' : 'Error'}]
                  </span>
                )}
              </h4>
              <div className="scanlines bg-green-900/10 p-2 rounded overflow-auto max-h-40 text-xs">
                {Array.isArray(moduleInitData.SERVICE) && moduleInitData.SERVICE.length > 0 ? (
                  <pre>{JSON.stringify(moduleInitData.SERVICE, null, 2)}</pre>
                ) : (
                  <div className="text-yellow-400 p-2">
                    No service modules found. This might indicate an API issue or that modules aren't registered.
                  </div>
                )}
              </div>
            </div>
            <div>
              <h4 className="text-green-300 text-sm mb-1">
                User Modules
                <span className="ml-2 text-xs">
                  {Array.isArray(moduleInitData.USER) && moduleInitData.USER.length > 0 
                    ? <span className="text-green-400">({moduleInitData.USER.length})</span>
                    : <span className="text-red-400">(Empty)</span>
                  }
                </span>
                {moduleInitData._apiStatus && moduleInitData._apiStatus.USER && (
                  <span className={`ml-2 text-xs ${moduleInitData._apiStatus.USER.ok ? 'text-green-400' : 'text-red-400'}`}>
                    [API: {moduleInitData._apiStatus.USER.ok ? 'OK' : 'Error'}]
                  </span>
                )}
              </h4>
              <div className="scanlines bg-green-900/10 p-2 rounded overflow-auto max-h-40 text-xs">
                {Array.isArray(moduleInitData.USER) && moduleInitData.USER.length > 0 ? (
                  <pre>{JSON.stringify(moduleInitData.USER, null, 2)}</pre>
                ) : (
                  <div className="text-yellow-400 p-2">
                    No user modules found. This might indicate an API issue or that modules aren't registered.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
