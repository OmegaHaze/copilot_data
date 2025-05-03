// Debug Diagnostics Tab
import React, { useState, useEffect } from 'react';
import { useSocket } from '../../../components/Panes/Utility/SocketContext.jsx';
import ReactDOM from 'react-dom/client';

// Import diagnostic components
import LayoutDebugUtil from '../Diagnostics/LayoutDebugUtil.jsx';
import DebugToolsPanel from '../Diagnostics/DebugToolsPanel.jsx';
import ModuleChecker from '../Diagnostics/ModuleChecker.jsx';
import ModuleReloadButton from '../Diagnostics/ModuleReloadButton.jsx';
import SupervisorRegistrationUtil from '../Diagnostics/SupervisorRegistrationUtil.jsx';

/**
 * Loads diagnostic data from supervisor log files
 * @returns {Object} Diagnostic data including import logs and module status
 */
export async function loadDiagnosticData() {
  try {
    console.log('Loading diagnostic data from supervisor logs...');
    
    // Create endpoint URL for fetching diagnostic logs
    const endpoint = '/system/diagnostics/logs';
    
    // Fetch diagnostic data from server
    const response = await fetch(endpoint);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch diagnostic data: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Process diagnostic data
    return {
      moduleStatus: data.moduleStatus || {},
      importLog: data.importLog || '',
      error: null
    };
  } catch (err) {
    console.error('Error loading diagnostic data:', err);
    return {
      moduleStatus: null,
      importLog: null,
      error: err.message
    };
  }
}

/**
 * Registers essential components that might have failed to load automatically
 * @returns {Object} Registration results with success status
 */
export async function registerEssentialComponents() {
  try {
    console.log('Starting manual registration of essential components...');
    const loadResults = {};
    
    // Map of components for direct registration
    const componentsToRegister = [
      {
        key: 'supervisor',
        component: SupervisorPane,
        category: 'system'
      },
      {
        key: 'nvidia',
        component: NvidiaPane,
        category: 'system'
      },
      {
        key: 'postgres',
        component: PostgresPane,
        category: 'service'
      },
      {
        key: 'default',
        component: DefaultPane,
        category: 'system'
      }
    ];
    

    
    // Register each component directly
    for (const comp of componentsToRegister) {
      try {
        if (comp.component) {
          componentRegistry.register(comp.key, comp.component);
          componentRegistry.setCategoryForModule(comp.key, comp.category);
          loadResults[comp.key] = true;
          console.log(`Successfully registered ${comp.key} component manually`);
        } else {
          console.warn(`${comp.key} component is not available`);
          loadResults[comp.key] = false;
        }
      } catch (err) {
        console.error(`Failed to manually register ${comp.key}:`, err);
        loadResults[comp.key] = false;
      }
    }
    
    // Notify completion
    const success = Object.values(loadResults).some(result => result === true);
    console.log(`Manual component registration ${success ? 'succeeded' : 'failed'}`);
    
    return {
      success,
      loadResults,
      registered: Object.keys(loadResults).filter(key => loadResults[key] === true)
    };
  } catch (err) {
    console.error('Error during manual component registration:', err);
    return {
      success: false,
      error: err.message
    };
  }
}

/**
 * Run diagnostics on the system
 * @returns {Promise<void>} A promise that resolves when diagnostics are complete
 */
export async function runSystemDiagnostics() {
  // The actual diagnostics are handled by the ModuleChecker component
  console.log('Running system diagnostics...');
  return Promise.resolve();
}

/**
 * Debug panel tab for manual component registration
 */
export default function DebugOverlayManualRegistration() {
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [showDiagnosticTools, setShowDiagnosticTools] = useState(false);
  const [diagnosticData, setDiagnosticData] = useState(null);
  const socket = useSocket();
  
  // Run diagnostics when the component mounts
  useEffect(() => {
    // Render the ModuleChecker which runs diagnostics on mount
    const moduleChecker = document.createElement('div');
    moduleChecker.style.display = 'none';
    document.body.appendChild(moduleChecker);
    
    const root = ReactDOM.createRoot(moduleChecker);
    root.render(<ModuleChecker />);
    
    // Load diagnostic data
    loadDiagnosticData().then(data => {
      setDiagnosticData(data);
    });
    
    // Clean up
    return () => {
      root.unmount();
      document.body.removeChild(moduleChecker);
    };
  }, []);

  return (
    <div className="glass-notification p-4 rounded-md border border-green-600/20 debug-border-glow">
      <h3 className="text-green-400 mb-3 debug-header border-b border-green-500/20 pb-2 flex justify-between items-center">
        <span>Diagnostics & Manual Registration</span>
        <button 
          onClick={() => setShowDiagnosticTools(!showDiagnosticTools)}
          className="text-xs bg-green-800/50 hover:bg-green-700/50 px-2 py-0.5 rounded"
        >
          {showDiagnosticTools ? 'Hide Tools' : 'Show Advanced Tools'}
        </button>
      </h3>
      
      {/* Debug Tools Panel - Always visible */}
      <div className="bg-black/30 p-3 rounded border border-green-800 mb-4">
        <h4 className="text-green-400 text-xs font-bold mb-2">Debug Tools</h4>
        <DebugToolsPanel />
      </div>
      
      {/* Diagnostic Tools - Toggle visibility */}
      {showDiagnosticTools && (
        <div className="mb-4">
          <h3 className="text-green-300 text-sm font-bold border-b border-green-700 pb-2 mb-3">Advanced Diagnostic Tools</h3>
          
          {/* Module Reload Section */}
          <div className="bg-black/30 p-3 rounded border border-green-800 mb-4">
            <h4 className="text-green-400 text-xs font-bold mb-2">Module Operations</h4>
            <ModuleReloadButton />
          </div>
          
          {/* Supervisor Registration Section */}
          <div className="bg-black/30 p-3 rounded border border-green-800 mb-4">
            <h4 className="text-green-400 text-xs font-bold mb-2">Supervisor Registration</h4>
            <SupervisorRegistrationUtil />
          </div>
          
          {/* Layout Debug Section */}
          <div className="bg-black/30 p-3 rounded border border-green-800 mb-4">
            <h4 className="text-green-400 text-xs font-bold mb-2">Layout Debug Tools</h4>
            <LayoutDebugUtil />
          </div>
        </div>
      )}
      
      {/* Diagnostic Data Display */}
      <div className="mt-4">
        <h4 className="text-green-300 text-xs mb-2">Diagnostic Results</h4>
        <div className="bg-black/30 p-2 rounded border border-green-800 text-xs mb-2">
          {diagnosticData ? (
            <div>
              <p className="mb-2">
                Status: <span className={diagnosticData.error ? "text-red-400" : "text-green-400"}>
                  {diagnosticData.error ? "Error" : "Available"}
                </span>
              </p>
              
              {diagnosticData.error && (
                <p className="text-red-400 mb-2">{diagnosticData.error}</p>
              )}
              
              {diagnosticData.moduleStatus && (
                <div className="mb-3">
                  <p className="text-green-300 border-b border-green-700/50 pb-1 mb-1">Module Status:</p>
                  <pre className="whitespace-pre-wrap text-green-200 bg-black/20 p-2 rounded max-h-24 overflow-auto">
                    {JSON.stringify(diagnosticData.moduleStatus, null, 2)}
                  </pre>
                </div>
              )}
              
              {diagnosticData.importLog && (
                <div>
                  <p className="text-green-300 border-b border-green-700/50 pb-1 mb-1">Import Log:</p>
                  <pre className="whitespace-pre-wrap text-green-200 bg-black/20 p-2 rounded max-h-24 overflow-auto">
                    {diagnosticData.importLog.slice(-500)}
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <p className="text-yellow-400">Loading diagnostic data...</p>
          )}
        </div>
      </div>
      
      {/* Status message area */}
      <div className="mt-4">
        <div className={`px-4 py-3 rounded ${
          status === 'success' ? 'bg-green-900/20 text-green-400' :
          status === 'error' ? 'bg-red-900/20 text-red-400' :
          'bg-gray-800/30 text-gray-400'
        }`}>
          <pre className="whitespace-pre-wrap text-xs">
            {message || 'No operations performed yet'}
          </pre>
        </div>
      </div>
      
      {/* Status message area */}
      {message && (
        <div className={`mt-4 p-2 rounded text-xs ${
          status === 'error' ? 'bg-red-900/20 text-red-400' : 
          status === 'success' ? 'bg-green-900/20 text-green-400' :
          'bg-yellow-900/20 text-yellow-400'
        }`}>
          <pre className="whitespace-pre-wrap overflow-auto max-h-40">
            {message}
          </pre>
        </div>
      )}
    </div>
  );
}
