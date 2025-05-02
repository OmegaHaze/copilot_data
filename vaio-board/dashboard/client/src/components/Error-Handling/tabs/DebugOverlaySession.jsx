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
      <div className="border border-cyan-800 rounded p-3 mb-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-cyan-400">Active Modules and Layout</h3>
          <button
            className="bg-blue-900/40 border border-blue-700 rounded px-2 py-0.5 text-xs"
            onClick={fetchSessionData}
          >
            Refresh
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-cyan-300 text-sm mb-1">Active Modules from SettingsContext</h4>
            <div className="scanlines bg-cyan-900/10 p-2 rounded overflow-auto max-h-40 text-xs">
              {Array.isArray(activeModules) && activeModules.length > 0 ? (
                <ul className="list-disc pl-5">
                  {activeModules.map(moduleId => (
                    <li key={moduleId} className="mb-1">
                      <span className="text-cyan-300">{moduleId}</span>
                      {moduleId.includes('-') && (
                        <div className="pl-5">
                          <span className="text-gray-400">Base: </span>
                          <span className="text-cyan-200">{moduleId.split('-')[0]}</span>
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
            <h4 className="text-cyan-300 text-sm mb-1">Layout Keys (LG breakpoint)</h4>
            <div className="scanlines bg-cyan-900/10 p-2 rounded overflow-auto max-h-40 text-xs">
              {gridLayout && gridLayout.lg && gridLayout.lg.length > 0 ? (
                <ul className="list-disc pl-5">
                  {gridLayout.lg.map((item, idx) => (
                    <li key={idx} className="mb-1">
                      <span className="text-cyan-300">{item.i}</span>
                      {!activeModules.includes(item.i) && (
                        <span className="ml-2 text-red-400">⚠️ Not in activeModules!</span>
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
      <div className="border border-green-800 rounded p-3">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-green-400">Backend Session Data</h3>
          <button
            className="bg-blue-900/40 border border-blue-700 rounded px-2 py-0.5 text-xs"
            onClick={fetchSessionData}
          >
            Refresh
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-green-300 text-sm mb-1">/api/user/session</h4>
            <div className="scanlines bg-green-900/10 p-2 rounded overflow-auto max-h-60 text-xs">
              <pre>{JSON.stringify(sessionData?.session || {}, null, 2)}</pre>
            </div>
          </div>
          <div>
            <h4 className="text-green-300 text-sm mb-1">/api/user/me</h4>
            <div className="scanlines bg-green-900/10 p-2 rounded overflow-auto max-h-60 text-xs">
              <pre>{JSON.stringify(sessionData?.me || {}, null, 2)}</pre>
            </div>
          </div>
        </div>
        <div className="mt-3 text-xs text-yellow-300">
          <h4>Session Comparison</h4>
          {sessionData && (
            <div className="scanlines bg-yellow-900/10 p-2 rounded mt-2">
              {Object.keys(sessionData.session || {}).some(key => 
                key in (sessionData.me || {}) && 
                JSON.stringify(sessionData.session[key]) !== JSON.stringify(sessionData.me[key])
              ) ? (
                <ul className="list-disc pl-5">
                  {Object.keys(sessionData.session || {}).map(key => {
                    if (key in (sessionData.me || {}) && 
                        JSON.stringify(sessionData.session[key]) !== JSON.stringify(sessionData.me[key])) {
                      return (
                        <li key={key} className="text-red-300">
                          <strong>{key}</strong>: Different values in /session vs /me
                        </li>
                      );
                    }
                    return null;
                  }).filter(Boolean)}
                </ul>
              ) : (
                <p className="text-green-400">✅ No data inconsistencies found between /session and /me</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
