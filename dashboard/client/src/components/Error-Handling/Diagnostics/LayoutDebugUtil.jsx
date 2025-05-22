import React, { useState, useContext, useEffect } from 'react';
import { saveLayout, loadSession } from '../../Panes/Utility/Loader/Layout/layout-index.jsx';
import { SettingsContext } from '../../Panes/Utility/Context/SettingsContext.jsx';
import LayoutDebugger from './tabs/LayoutDebugger.jsx';

/**
 * Debug utility for testing and diagnosing layout-related issues
 */
export default function LayoutDebugUtil() {
  const { gridLayout, activeModules, setGridLayout, setActiveModules } = useContext(SettingsContext);

  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [sessionData, setSessionData] = useState(null);
  const [apiCheck, setApiCheck] = useState({ status: 'idle', results: null });
  const [sessionStorageData, setSessionStorageData] = useState(null);

  useEffect(() => {
    refreshSession();
    checkSessionStorage();
  }, []);

  const refreshSession = async () => {
    try {
      const data = await loadSession();
      setSessionData(data);
    } catch (err) {
      console.error('Failed to load session:', err);
    }
  };

  const checkSessionStorage = () => {
    const data = {};
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      try {
        data[key] = JSON.parse(sessionStorage.getItem(key));
      } catch {
        data[key] = sessionStorage.getItem(key);
      }
    }
    setSessionStorageData(data);
  };

  const saveTestLayout = async () => {
    const testLayout = {
      lg: [{
        i: 'test-debug-pane',
        x: 0, y: 0, w: 6, h: 6,
        moduleType: 'SYSTEM',
        staticIdentifier: 'DebugTest'
      }],
      md: [], sm: [], xs: [], xxs: []
    };

    try {
      setStatus('loading');
      setMessage('Saving test layout...');

      await saveLayout(testLayout);

      setStatus('success');
      setMessage('Test layout saved successfully');
      refreshSession();
      checkSessionStorage();
    } catch (err) {
      setStatus('error');
      setMessage(err.message);
    }
  };

  const saveCurrentLayout = async () => {
    try {
      setStatus('loading');
      setMessage('Saving current layout...');

      await saveLayout(gridLayout);

      setStatus('success');
      setMessage('Current layout saved');
      refreshSession();
      checkSessionStorage();
    } catch (err) {
      setStatus('error');
      setMessage(err.message);
    }
  };

  return (
    <div className="p-4 bg-black/30 border border-green-800 rounded text-xs">
      <h3 className="text-green-400 font-bold mb-2">🛠 Layout Debug Tools</h3>

      <div className="flex flex-wrap gap-2 mb-3">
        <button
          onClick={saveTestLayout}
          className="bg-purple-600 hover:bg-purple-500 px-2 py-1 rounded text-white"
        >
          Save Test Layout
        </button>

        <button
          onClick={saveCurrentLayout}
          className="bg-blue-600 hover:bg-blue-500 px-2 py-1 rounded text-white"
        >
          Save Current Layout
        </button>

        <button
          onClick={refreshSession}
          className="bg-yellow-600 hover:bg-yellow-500 px-2 py-1 rounded text-white"
        >
          Refresh Session
        </button>

        <button
          onClick={checkSessionStorage}
          className="bg-teal-600 hover:bg-teal-500 px-2 py-1 rounded text-white"
        >
          Inspect sessionStorage
        </button>
      </div>

      {message && (
        <div className={`p-2 rounded text-xs mb-3 ${
          status === 'error' ? 'bg-red-900/20 text-red-400 border border-red-800' : 
          status === 'success' ? 'bg-green-900/20 text-green-400 border border-green-800' : 
          'bg-yellow-900/20 text-yellow-400 border border-yellow-800'
        }`}>
          {message}
        </div>
      )}

      <div className="mb-4">
        <h4 className="text-green-300 mb-1">Current Layout</h4>
        <LayoutDebugger currentLayout={gridLayout} />
      </div>

      <div className="mb-4">
        <h4 className="text-yellow-400 mb-1">Backend Session Data</h4>
        <pre className="bg-black/20 text-yellow-300 p-2 rounded max-h-64 overflow-auto">
          {JSON.stringify(sessionData, null, 2)}
        </pre>
      </div>

      <div>
        <h4 className="text-blue-400 mb-1">Browser Session Storage</h4>
        <pre className="bg-black/20 text-blue-300 p-2 rounded max-h-64 overflow-auto">
          {JSON.stringify(sessionStorageData, null, 2)}
        </pre>
      </div>
    </div>
  );
}
