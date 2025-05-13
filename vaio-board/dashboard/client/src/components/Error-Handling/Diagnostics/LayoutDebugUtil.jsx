import React, { useState, useContext, useEffect } from 'react';
import { saveLayoutsToSession } from '../../Panes/Utility/Loader/LayoutManager.js';
import { SettingsContext } from '../../Panes/Utility/Context/SettingsContext.jsx';
import LayoutDebugger from './tabs/LayoutDebugger.jsx';

/**
 * Debug utility for testing and diagnosing layout-related issues
 */
export default function LayoutDebugUtil() {
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [sessionData, setSessionData] = useState(null);
  const [apiCheck, setApiCheck] = useState({ status: 'idle', results: null });
  const { gridLayout, activeModules, setGridLayout, setActiveModules } = useContext(SettingsContext);
  const [sessionStorageData, setSessionStorageData] = useState(null);
  const [portTest, setPortTest] = useState({
    status: 'idle',
    results: null,
    currentPort: 1888 // Default to port 1888 as specified
  });

  // Fetch current session data on mount
  useEffect(() => {
    fetchSessionData();
    checkSessionStorage();
  }, []);

  // Check session storage for items
  const checkSessionStorage = () => {
    try {
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
    } catch (err) {
      console.error('Error checking sessionStorage:', err);
    }
  };

  // Fetch session data from API
  const fetchSessionData = async () => {
    try {
      setStatus('loading');
      setMessage('Fetching session data...');
      
      const res = await fetch('/api/user/session', { 
        credentials: 'include',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (!res.ok) {
        throw new Error(`Failed to fetch session: HTTP ${res.status}`);
      }
      
      const data = await res.json();
      setSessionData(data);
      setStatus('success');
      setMessage('Session data loaded successfully');
    } catch (err) {
      console.error('Error fetching session data:', err);
      setStatus('error');
      setMessage(`Error: ${err.message}`);
    }
  };
  
  // Test direct API call
  const testApiDirectly = async () => {
    try {
      setApiCheck({ status: 'loading', results: null });
      
      const testLayout = {
        grid_layout: {
          lg: [{
            i: 'test-api-item',
            x: 0, y: 0, w: 6, h: 6,
            moduleType: 'SYSTEM',
            staticIdentifier: 'APITest'
          }],
          md: [], sm: [], xs: [], xxs: []
        },
        active_modules: ['SYSTEM-APITest-direct']
      };
      
      const res = await fetch('/api/user/session/grid', {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(testLayout)
      });
      
      const data = await res.json();
      
      setApiCheck({
        status: res.ok ? 'success' : 'error',
        results: {
          statusCode: res.status,
          ok: res.ok,
          response: data,
          sentPayload: testLayout
        }
      });
      
      // Refresh session data to see the changes
      fetchSessionData();
      checkSessionStorage();
      
    } catch (err) {
      setApiCheck({
        status: 'error',
        results: {
          error: err.message,
          stack: err.stack
        }
      });
    }
  };
  
  // Test layout save function
  const testLayoutsSave = async () => {
    try {
      setStatus('loading');
      setMessage('Testing layouts save...');
      
      // Create test layouts with minimal content
      const testLayouts = {
        lg: [
          {
            i: 'test-layout-item',
            x: 0,
            y: 0,
            w: 12,
            h: 8,
            moduleType: 'SYSTEM'
          }
        ],
        md: [
          {
            i: 'test-layout-item',
            x: 0,
            y: 0,
            w: 12,
            h: 8,
            moduleType: 'SYSTEM'
          }
        ],
        sm: [
          {
            i: 'test-layout-item',
            x: 0,
            y: 0,
            w: 6,
            h: 6,
            moduleType: 'SYSTEM'
          }
        ],
        xs: [
          {
            i: 'test-layout-item',
            x: 0,
            y: 0,
            w: 4,
            h: 6,
            moduleType: 'SYSTEM'
          }
        ],
        xxs: [
          {
            i: 'test-layout-item',
            x: 0,
            y: 0,
            w: 2,
            h: 4,
            moduleType: 'SYSTEM'
          }
        ]
      };
      
      // Try to save the layouts
      const result = await saveLayoutsToSession(testLayouts);
      console.log('Layout save test result:', result);
      
      if (result) {
        setStatus('success');
        setMessage('Layout saved successfully! Check console for details.');
        // Refresh session data and storage
        fetchSessionData();
        checkSessionStorage();
      } else {
        setStatus('error');
        setMessage('Layout save returned null or undefined.');
      }
    } catch (err) {
      console.error('Error testing layout save:', err);
      setStatus('error');
      setMessage(`Error: ${err.message}`);
    }
  };
  
  // Save current layouts
  const saveCurrentLayouts = async () => {
    try {
      setStatus('loading');
      setMessage('Saving current layouts...');
      
      if (!gridLayout) {
        throw new Error('No grid layout available in context');
      }
      
      // Try to save the current layouts
      const result = await saveLayoutsToSession(gridLayout, activeModules);
      console.log('Current layout save result:', result);
      
      if (result) {
        setStatus('success');
        setMessage('Current layouts saved successfully!');
        // Refresh data
        fetchSessionData();
        checkSessionStorage();
      } else {
        setStatus('error');
        setMessage('Layout save returned null or undefined.');
      }
    } catch (err) {
      console.error('Error saving current layouts:', err);
      setStatus('error');
      setMessage(`Error: ${err.message}`);
    }
  };

  // Reset debug state by clearing data
  const resetDebugState = async () => {
    try {
      setStatus('loading');
      setMessage('Clearing debug state...');
      
      // Clear session storage (for debugging purposes only)
      const oldStorageData = {};
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        oldStorageData[key] = sessionStorage.getItem(key);
      }
      
      // Update UI
      setStatus('success');
      setMessage('Debug state cleared');
      checkSessionStorage();
      
    } catch (err) {
      console.error('Error resetting debug state:', err);
      setStatus('error');
      setMessage(`Error: ${err.message}`);
    }
  };
  
  // Test API with specific port
  const testApiWithPort = async () => {
    try {
      setPortTest({ ...portTest, status: 'loading', results: null });
      
      const port = portTest.currentPort;
      const baseUrl = `http://${window.location.hostname}:${port}`;
      const apiUrl = `${baseUrl}/api/user/session/grid`;
      
      // First, try to login to get valid cookies
      const loginUrl = `${baseUrl}/api/auth/token`;
      console.log(`Attempting to login at ${loginUrl} to get auth tokens...`);
      
      // Use default credentials for testing (should be configured properly in production)
      const credentials = { username: 'admin', password: 'admin' };
      
      // Try login first to get auth token
      const loginRes = await fetch(loginUrl, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: new URLSearchParams({
          'username': credentials.username,
          'password': credentials.password
        })
      });
      
      const loginData = await loginRes.json();
      console.log('Login response:', loginRes.status, loginData);
      
      // Now try to save the layout
      const testLayout = {
        grid_layout: {
          lg: [{
            i: 'port-test-item',
            x: 0, y: 0, w: 6, h: 6,
            moduleType: 'SYSTEM',
            staticIdentifier: 'PortTest'
          }],
          md: [], sm: [], xs: [], xxs: []
        },
        active_modules: ['SYSTEM-PortTest-port' + port]
      };
      
      console.log(`Testing API endpoint at ${apiUrl}`);
      
      const res = await fetch(apiUrl, {
        method: 'PUT',
        credentials: 'include',  // Include cookies for authentication
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(testLayout)
      });
      
      let data;
      try {
        data = await res.json();
      } catch (e) {
        data = { error: "Failed to parse response as JSON", message: e.message };
      }
      
      setPortTest({
        ...portTest,
        status: res.ok ? 'success' : 'error',
        results: {
          port,
          url: apiUrl,
          statusCode: res.status,
          ok: res.ok,
          response: data,
          sentPayload: testLayout,
          auth: {
            loginStatus: loginRes.status,
            loginSuccess: loginRes.ok,
            loginData: loginData
          }
        }
      });
      
      // If successful, refresh session data
      if (res.ok) {
        fetchSessionData();
        checkSessionStorage();
      }
      
    } catch (err) {
      setPortTest({
        ...portTest,
        status: 'error',
        results: {
          port: portTest.currentPort,
          error: err.message,
          stack: err.stack
        }
      });
    }
  };
  
  // Update port to test
  const updatePort = (e) => {
    const newPort = parseInt(e.target.value, 10);
    if (!isNaN(newPort) && newPort > 0) {
      setPortTest({ ...portTest, currentPort: newPort });
    }
  };

  return (
    <div className="my-2">
      <div className="grid grid-cols-1 gap-4">
        <div className="bg-black/30 p-3 rounded border border-green-800 text-xs">
          <h3 className="font-bold text-green-400 mb-2">Layout API Debug Controls</h3>
          
          {/* Port Test Controls */}
          <div className="mb-4 p-3 bg-black/20 rounded border border-orange-800">
            <h4 className="text-orange-400 font-semibold mb-2">Port-Specific API Test</h4>
            <div className="flex items-center gap-2 mb-3">
              <label className="text-orange-300">Port:</label>
              <input 
                type="number" 
                value={portTest.currentPort} 
                onChange={updatePort}
                className="w-20 px-2 py-1 bg-black/30 border border-orange-700 rounded text-orange-200"
              />
              <button
                onClick={testApiWithPort}
                disabled={portTest.status === 'loading'}
                className={`px-2 py-1 rounded text-white ${
                  portTest.status === 'loading' ? 'bg-gray-500' : 'bg-orange-600 hover:bg-orange-500'
                }`}
              >
                Test API on Port {portTest.currentPort}
              </button>
            </div>
            
            {portTest.results && (
              <div className="scanlines bg-black/20 p-2 rounded overflow-auto max-h-32 text-xs">
                <div className={`mb-2 font-bold ${portTest.status === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                  Port Test Status: {portTest.status === 'success' ? 'Success' : 'Failed'} 
                  {portTest.results.statusCode && ` (${portTest.results.statusCode})`}
                </div>
                <pre className="text-orange-300">{JSON.stringify(portTest.results, null, 2)}</pre>
              </div>
            )}
          </div>
          
          <div className="flex flex-wrap gap-2 mb-3">
            <button
              onClick={testLayoutsSave}
              disabled={status === 'loading'}
              className={`px-2 py-1 rounded text-white ${
                status === 'loading' ? 'bg-gray-500' : 'bg-green-600 hover:bg-green-500'
              }`}
            >
              Test Layout Save
            </button>
            
            <button
              onClick={saveCurrentLayouts}
              disabled={status === 'loading' || !gridLayout}
              className={`px-2 py-1 rounded text-white ${
                status === 'loading' || !gridLayout ? 'bg-gray-500' : 'bg-blue-600 hover:bg-blue-500'
              }`}
            >
              Save Current Layout
            </button>
            
            <button
              onClick={testApiDirectly}
              disabled={apiCheck.status === 'loading'}
              className={`px-2 py-1 rounded text-white ${
                apiCheck.status === 'loading' ? 'bg-gray-500' : 'bg-purple-600 hover:bg-purple-500'
              }`}
            >
              Test API Directly
            </button>
            
            <button
              onClick={fetchSessionData}
              disabled={status === 'loading'}
              className={`px-2 py-1 rounded text-white ${
                status === 'loading' ? 'bg-gray-500' : 'bg-yellow-600 hover:bg-yellow-500'
              }`}
            >
              Refresh Session Data
            </button>
            
            <button
              onClick={checkSessionStorage}
              disabled={status === 'loading'}
              className={`px-2 py-1 rounded text-white ${
                status === 'loading' ? 'bg-gray-500' : 'bg-teal-600 hover:bg-teal-500'
              }`}
            >
              Check sessionStorage
            </button>

            <button
              onClick={resetDebugState}
              disabled={status === 'loading'}
              className={`px-2 py-1 rounded text-white ${
                status === 'loading' ? 'bg-gray-500' : 'bg-red-600 hover:bg-red-500'
              }`}
            >
              Reset Debug State
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
        </div>
        
        {/* API Direct Test Results */}
        {apiCheck.results && (
          <div className="bg-black/30 p-3 rounded border border-purple-800">
            <h4 className="font-bold text-purple-400 mb-2">API Direct Test Results</h4>
            <div className="scanlines bg-black/20 p-2 rounded overflow-auto max-h-60 text-xs">
              <div className={`mb-2 font-bold ${apiCheck.status === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                Status: {apiCheck.status === 'success' ? 'Success' : 'Failed'} 
                {apiCheck.results.statusCode && ` (${apiCheck.results.statusCode})`}
              </div>
              <pre className="text-purple-300">{JSON.stringify(apiCheck.results, null, 2)}</pre>
            </div>
          </div>
        )}
        
        {/* Session Storage Data */}
        <div className="bg-black/30 p-3 rounded border border-blue-800">
          <h4 className="font-bold text-blue-400 mb-2">Browser Session Storage</h4>
          <div className="scanlines bg-black/20 p-2 rounded overflow-auto max-h-60 text-xs">
            {sessionStorageData && Object.keys(sessionStorageData).length > 0 ? (
              <pre className="text-blue-300">{JSON.stringify(sessionStorageData, null, 2)}</pre>
            ) : (
              <p className="text-yellow-400">No items found in sessionStorage</p>
            )}
          </div>
        </div>
        
        {/* Layout Debugger */}
        <div className="bg-black/30 p-3 rounded border border-green-800">
          <h4 className="font-bold text-green-400 mb-2">Current Grid Layout</h4>
          <LayoutDebugger currentLayout={gridLayout} />
        </div>
        
        {/* Backend Session Data */}
        <div className="bg-black/30 p-3 rounded border border-yellow-800">
          <h4 className="font-bold text-yellow-400 mb-2">Backend Session Data</h4>
          <div className="scanlines bg-black/20 p-2 rounded overflow-auto max-h-60 text-xs">
            {sessionData ? (
              <pre className="text-yellow-300">{JSON.stringify(sessionData, null, 2)}</pre>
            ) : (
              <p className="text-yellow-400">No session data available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
