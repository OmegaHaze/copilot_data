import React, { useContext } from 'react';
import { SettingsContext } from '../../SettingsMenu/SettingsContext.jsx';

/**
 * Session tab for the Debug Overlay
 * Displays session data and authentication state
 */
export default function DebugOverlaySession({ sessionData, fetchSessionData }) {
  const { activeModules, gridLayout } = useContext(SettingsContext);
  return (
    <div>
      {/* Active Modules and Layout Relationship */}
      <div className="glass-notification p-4 rounded-md mb-4 border border-green-600/20 debug-border-glow">
        <div className="flex justify-between items-center mb-3 border-b border-green-500/20 pb-2">
          <h3 className="text-green-400 debug-header">Active Modules and Layout</h3>
          <button
            className="debug-item-hover border border-green-500/30 text-green-300 rounded px-2.5 py-1 text-xs transition-all shadow-glow-sm"
            onClick={fetchSessionData}
          >
            Refresh
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-green-300 text-xs mb-1">Active Modules from SettingsContext</h4>
            <div className="scanlines bg-black/30 p-3 rounded-md overflow-auto max-h-40 text-xs">
              {Array.isArray(activeModules) && activeModules.length > 0 ? (
                <ul className="space-y-1">
                  {activeModules.map(moduleId => (
                    <li key={moduleId} className="px-2 py-1 rounded hover:bg-green-900/10 transition-colors">
                      <span className="text-green-300">{moduleId}</span>
                      {moduleId.includes('-') && (
                        <div className="pl-4 mt-0.5 border-l border-green-500/20">
                          <span className="text-gray-400">Base: </span>
                          <span className="text-green-200">{moduleId.split('-')[0]}</span>
                          <span className="text-gray-400"> | Instance: </span>
                          <span className="text-yellow-300">{moduleId.split('-')[1]}</span>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-red-400">No active modules found!</p>
              )}
            </div>
          </div>
          
          <div>
            <h4 className="text-green-300 text-xs mb-1">Layout Keys (LG breakpoint)</h4>
            <div className="scanlines bg-black/30 p-3 rounded-md overflow-auto max-h-40 text-xs">
              {gridLayout && gridLayout.lg && gridLayout.lg.length > 0 ? (
                <ul className="space-y-1">
                  {gridLayout.lg.map((item, idx) => (
                    <li key={idx} className="px-2 py-1 rounded hover:bg-green-900/10 transition-colors flex justify-between">
                      <span className="text-green-300">{item.i}</span>
                      {!activeModules.includes(item.i) && (
                        <span className="text-red-400 bg-red-900/20 px-1.5 py-0.5 rounded-sm">Not in activeModules</span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-yellow-400">No layout items found!</p>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Session Data */}
      <div className="glass-notification rounded-md p-4 border border-green-600/20 debug-border-glow">
        <div className="flex justify-between items-center mb-3 border-b border-green-500/20 pb-2">
          <h3 className="text-green-400 debug-header">Backend Session Data</h3>
          <button
            className="debug-item-hover border border-green-500/30 text-green-300 rounded px-2.5 py-1 text-xs transition-all shadow-glow-sm"
            onClick={fetchSessionData}
          >
            Refresh
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-green-300 text-xs mb-1 flex items-center">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5 shadow-glow-sm shadow-green-500/40 debug-indicator"></span>
              /api/user/session
            </h4>
            <div className="scanlines bg-black/30 p-3 rounded-md overflow-auto max-h-60 text-xs">
              <pre className="text-green-300">{JSON.stringify(sessionData?.session || {}, null, 2)}</pre>
            </div>
          </div>
          <div>
            <h4 className="text-green-300 text-xs mb-1 flex items-center">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5 shadow-glow-sm shadow-green-500/40 debug-indicator"></span>
              /api/user/me
            </h4>
            <div className="scanlines bg-black/30 p-3 rounded-md overflow-auto max-h-60 text-xs">
              <pre className="text-green-300">{JSON.stringify(sessionData?.me || {}, null, 2)}</pre>
            </div>
          </div>
        </div>
        <div className="mt-3 text-xs">
          <h4 className="text-green-300 mb-1 flex items-center">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-yellow-500 mr-1.5"></span>
            Session Comparison
          </h4>
          {sessionData && (
            <div className="scanlines bg-black/20 p-2 rounded mt-2 border border-yellow-500/20">
              {Object.keys(sessionData.session || {}).some(key => 
                key in (sessionData.me || {}) && 
                JSON.stringify(sessionData.session[key]) !== JSON.stringify(sessionData.me[key])
              ) ? (
                <ul className="space-y-1">
                  {Object.keys(sessionData.session || {}).map(key => {
                    if (key in (sessionData.me || {}) && 
                        JSON.stringify(sessionData.session[key]) !== JSON.stringify(sessionData.me[key])) {
                      return (
                        <li key={key} className="text-red-300 px-2 py-1 rounded bg-red-900/10 border border-red-500/20 flex items-center">
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5"></span>
                          <strong>{key}</strong>: Different values in /session vs /me
                        </li>
                      );
                    }
                    return null;
                  }).filter(Boolean)}
                </ul>
              ) : (
                <p className="text-green-400 flex items-center">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5"></span>
                  No data inconsistencies found between /session and /me
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
