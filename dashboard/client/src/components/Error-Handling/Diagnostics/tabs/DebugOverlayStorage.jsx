import React, { useState } from 'react';

/**
 * Storage tab for the Debug Overlay
 * Shows localStorage and sessionStorage contents
 */
export default function DebugOverlayStorage({ storageData }) {
  const [refreshing, setRefreshing] = useState(false);
  
  // Check if VAIO layouts data exists
  const hasVaioLayouts = storageData.local && 'vaio_layouts' in storageData.local;
  const hasSessionLayouts = storageData.session && 'vaio_layouts' in storageData.session;
  
  // Function to manually refresh layout data (for debugging)
  const refreshLayoutData = () => {
    setRefreshing(true);
    try {
      // First attempt to get layout data from context if available
      if (window.currentGridLayout || window.gridLayout) {
        const layoutData = window.currentGridLayout || window.gridLayout;
        if (layoutData && typeof layoutData === 'object') {
          localStorage.setItem('vaio_layouts', JSON.stringify(layoutData));
          console.log('Layout data refreshed from current application state');
        }
      }
      
      // Then trigger a full refresh of the storage display
      window.dispatchEvent(new CustomEvent('vaio:layouts-updated', {
        detail: {
          source: 'debug-overlay',
          forceRefresh: true
        }
      }));
      
      // Clear refreshing state after a short delay
      setTimeout(() => {
        setRefreshing(false);
      }, 800);
    } catch (error) {
      console.error('Error refreshing layout data:', error);
      setRefreshing(false);
    }
  };
  
  return (
    <div>
      {/* Info message */}
      <div className="glass-notification rounded-md p-4 border border-blue-600/20 debug-border-glow mb-4">
        <h3 className="text-blue-400 mb-3 debug-header border-b border-blue-500/20 pb-2 flex items-center justify-between">
          <div>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 mr-1.5 shadow-glow-sm shadow-blue-500/40 debug-indicator"></span>
            Layout Storage Info
          </div>
          <button 
            onClick={refreshLayoutData}
            disabled={refreshing}
            className={`text-xs ${refreshing ? 'bg-blue-900 text-blue-300' : 'bg-blue-800 hover:bg-blue-700 text-blue-100'} px-2 py-1 rounded transition-colors`}
          >
            {refreshing ? 'Refreshing...' : 'Refresh Layout Data'}
          </button>
        </h3>
        <div className="text-blue-200 text-sm">
          <p className="mb-2">VAIO Board layout data key: <code className="bg-black/30 px-1 rounded text-blue-300">vaio_layouts</code></p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 mb-2 bg-black/20 p-2 rounded">
            <div>
              <span className="text-xs text-blue-400 block mb-1">Local Storage:</span>
              {hasVaioLayouts ? (
                <span className="text-green-400 text-sm">✓ Layout data present</span>
              ) : (
                <span className="text-red-400 text-sm">✕ No layout data</span>
              )}
            </div>
            
            <div>
              <span className="text-xs text-blue-400 block mb-1">Session Storage:</span>
              {hasSessionLayouts ? (
                <span className="text-green-400 text-sm">✓ Layout data present</span>
              ) : (
                <span className="text-red-400 text-sm">✕ No layout data</span>
              )}
            </div>
          </div>
          {(hasVaioLayouts || hasSessionLayouts) && (
            <div className="mt-3 p-2 bg-blue-900/20 rounded border border-blue-500/20 text-xs">
              <p className="font-medium text-blue-300 mb-1">Layout Structure Analysis:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Local Storage Layout Structure */}
                {hasVaioLayouts && storageData.local['vaio_layouts'] && (
                  <div className="border border-blue-500/20 rounded p-2">
                    <div className="font-medium text-blue-300 mb-1">Local Storage:</div>
                    <div className="ml-2">
                      {Object.keys(storageData.local['vaio_layouts'] || {}).map(breakpoint => (
                        <div key={breakpoint} className="flex items-center mb-1">
                          <span className="text-blue-400 w-12">{breakpoint}:</span>
                          <span className="text-blue-200">
                            {Array.isArray(storageData.local['vaio_layouts'][breakpoint]) ? 
                              `${storageData.local['vaio_layouts'][breakpoint].length} items` : 
                              'Invalid format'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Session Storage Layout Structure */}
                {hasSessionLayouts && storageData.session['vaio_layouts'] && (
                  <div className="border border-green-500/20 rounded p-2">
                    <div className="font-medium text-green-300 mb-1">Session Storage:</div>
                    <div className="ml-2">
                      {Object.keys(storageData.session['vaio_layouts'] || {}).map(breakpoint => (
                        <div key={breakpoint} className="flex items-center mb-1">
                          <span className="text-green-400 w-12">{breakpoint}:</span>
                          <span className="text-green-200">
                            {Array.isArray(storageData.session['vaio_layouts'][breakpoint]) ? 
                              `${storageData.session['vaio_layouts'][breakpoint].length} items` : 
                              'Invalid format'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-notification rounded-md p-4 border border-green-600/20 debug-border-glow">
          <h3 className="text-green-400 mb-3 debug-header border-b border-green-500/20 pb-2">Local Storage</h3>
          <div className="scanlines bg-black/30 p-3 rounded-md overflow-auto max-h-96 text-xs">
            {Object.keys(storageData.local).length > 0 ? (
              <div>
                {/* Display VAIO layouts first if it exists */}
                {hasVaioLayouts && (
                  <div className="mb-3 border border-blue-500/30 rounded bg-blue-900/10 overflow-hidden">
                    <div className="font-bold text-blue-400 px-2 py-1 bg-blue-900/30 border-b border-blue-500/30 flex justify-between items-center">
                      vaio_layouts
                      <span className="text-xs bg-blue-800/40 px-2 py-0.5 rounded">VAIO Board Layout Data</span>
                    </div>
                    <pre className="text-xs p-2 break-words whitespace-pre-wrap text-blue-200">
                      {typeof storageData.local['vaio_layouts'] === 'object' 
                        ? JSON.stringify(storageData.local['vaio_layouts'], null, 2) 
                        : String(storageData.local['vaio_layouts'])}
                    </pre>
                  </div>
                )}
                
                {/* Display all other localStorage items */}
                {Object.entries(storageData.local)
                  .filter(([key]) => key !== 'vaio_layouts')
                  .map(([key, value]) => (
                    <div key={key} className="mb-3 border border-green-500/10 rounded bg-black/20 overflow-hidden">
                      <div className="font-bold text-green-400 px-2 py-1 bg-green-900/20 border-b border-green-500/20">
                        {key}
                      </div>
                      <pre className="text-xs p-2 break-words whitespace-pre-wrap text-green-200">
                        {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                      </pre>
                    </div>
                  ))
                }
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
                {/* Display VAIO layouts first if it exists in session storage */}
                {hasSessionLayouts && (
                  <div className="mb-3 border border-green-500/30 rounded bg-green-900/10 overflow-hidden">
                    <div className="font-bold text-green-400 px-2 py-1 bg-green-900/30 border-b border-green-500/30 flex justify-between items-center">
                      vaio_layouts
                      <span className="text-xs bg-green-800/40 px-2 py-0.5 rounded">SERVER-SIDE Layout Data</span>
                    </div>
                    <pre className="text-xs p-2 break-words whitespace-pre-wrap text-green-200">
                      {typeof storageData.session['vaio_layouts'] === 'object' 
                        ? JSON.stringify(storageData.session['vaio_layouts'], null, 2) 
                        : String(storageData.session['vaio_layouts'])}
                    </pre>
                  </div>
                )}
                
                {/* Display all other sessionStorage items */}
                {Object.entries(storageData.session)
                  .filter(([key]) => key !== 'vaio_layouts')
                  .map(([key, value]) => (
                    <div key={key} className="mb-3 border border-green-500/10 rounded bg-black/20 overflow-hidden">
                      <div className="font-bold text-green-400 px-2 py-1 bg-green-900/20 border-b border-green-500/20">
                        {key}
                      </div>
                      <pre className="text-xs p-2 break-words whitespace-pre-wrap text-green-200">
                        {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                      </pre>
                    </div>
                  ))
                }
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
