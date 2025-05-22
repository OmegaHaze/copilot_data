import React, { useContext, useState } from 'react';
import { SettingsContext } from '../../../Panes/Utility/Context/SettingsContext.jsx';
import { clearSession } from '../../../Panes/Utility/Loader/Session/session-index';

/**
 * Session tab for the Debug Overlay
 * Displays session data and authentication state
 */
export default function DebugOverlaySession({ sessionData, fetchSessionData }) {
  const { activeModules, gridLayout, setGridLayout, setActiveModules } = useContext(SettingsContext);
  const [clearingData, setClearingData] = useState(false);
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
      
      {/* Clear Data Section */}
      <div className="glass-notification p-4 rounded-md mb-4 border border-red-600/20 debug-border-glow">
        <div className="flex justify-between items-center mb-3 border-b border-red-500/20 pb-2">
          <h3 className="text-red-400 debug-header">Danger Zone</h3>
        </div>
        <div className="flex items-center justify-between bg-black/30 p-3 rounded-md">
          <div>
            <h4 className="text-red-300 font-medium">Clear All Session Data</h4>
            <p className="text-xs text-gray-400 mt-1">
              This will clear all layout data, active modules, and session state from localStorage, 
              sessionStorage, and backend API. This cannot be undone.
            </p>
          </div>
          <button
            className={`debug-item-hover border border-red-500/30 text-red-300 rounded px-3 py-1.5 text-xs transition-all shadow-glow-sm flex items-center ${clearingData ? 'opacity-50 pointer-events-none' : ''}`}
            onClick={async () => {
              if (window.confirm('Are you sure you want to clear ALL session data? This cannot be undone.')) {
                setClearingData(true);
                try {
                  await clearSession(true);
                  // Reset local state
                  const emptyLayout = {lg: [], md: [], sm: [], xs: [], xxs: []};
                  setGridLayout(emptyLayout);
                  setActiveModules([]);
                  // Refresh data
                  fetchSessionData();
                  alert('Session data cleared successfully!');
                } catch (err) {
                  console.error('Error clearing session data:', err);
                  alert('Failed to clear some session data. Check console for details.');
                } finally {
                  setClearingData(false);
                }
              }
            }}
            disabled={clearingData}
          >
            {clearingData ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-red-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Clearing...
              </>
            ) : (
              <>Clear All Session Data</>
            )}
          </button>
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
