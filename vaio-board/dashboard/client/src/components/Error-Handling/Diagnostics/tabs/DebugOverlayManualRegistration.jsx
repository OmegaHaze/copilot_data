// Debug Diagnostics Tab
import React, { useState, useEffect } from 'react';
import { ErrorType, ErrorSeverity } from '../types/errorTypes.js';
import ReactDOM from 'react-dom/client';

// Import diagnostic components
import LayoutDebugUtil from '../LayoutDebugUtil.jsx';
import ModuleChecker from '../ModuleChecker.jsx';
import ModuleReloadButton from '../ModuleReloadButton.jsx';
import SupervisorRegistrationUtil from '../SupervisorRegistrationUtil.jsx';

// Define essential components that might need manual registration
const componentsToRegister = [
  {
    key: 'SYSTEM-SupervisorPane',
    category: 'SYSTEM'
  }
];

/**
 * Loads diagnostic data from supervisor log files
 * @returns {Object} Diagnostic data including import logs and module status
 */
export async function loadDiagnosticData() {
  try {
    console.log('Loading diagnostic data from available logs...');
    
    // First get list of all available logs
    const listResponse = await fetch('/api/logs/list');
    if (!listResponse.ok) {
      throw new Error(`Failed to fetch log list: ${listResponse.statusText}`);
    }
    
    const { logs } = await listResponse.json();
    console.log('Available logs:', logs);
    
    // Look for diagnostic-related logs
    const diagnosticLogs = logs.filter(log => 
      log.includes('diagnostic') || 
      log.includes('import') || 
      log.includes('module_status'));
      
    if (!diagnosticLogs.length) {
      console.warn('No diagnostic logs found');
      return {
        moduleStatus: {},
        importLog: 'No diagnostic logs available',
        error: null
      };
    }

    // Fetch content for each relevant log
    const logContents = await Promise.all(
      diagnosticLogs.map(async logName => {
        const response = await fetch(`/logs/file?filename=${logName}`);
        const content = await response.text();
        return { name: logName, content };
      })
    );

    // Extract information from logs
    const moduleStatus = {};
    let importLog = '';

    logContents.forEach(({ name, content }) => {
      if (name.includes('module_status')) {
        try {
          moduleStatus[name] = JSON.parse(content);
        } catch {
          moduleStatus[name] = content;
        }
      }
      if (name.includes('import') || name.includes('diagnostic')) {
        importLog += `=== ${name} ===\n${content}\n\n`;
      }
    });
    
    return {
      moduleStatus,
      importLog: importLog || 'No import logs found',
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
    
    // Dynamically import ComponentRegistry
    const { componentRegistry } = await import('../../../Panes/Utility/Loader/ComponentRegistry.jsx');
    

    // Register each component directly
    for (const comp of componentsToRegister) {
      try {
        // For SupervisorPane, try to dynamically import the component
        if (comp.key === 'SYSTEM-SupervisorPane') {
          const { default: SupervisorPane } = await import('../../../Panes/Utility/Pane/SupervisorPane.jsx');
          if (SupervisorPane) {
            componentRegistry.register(comp.key, SupervisorPane);
            componentRegistry.setCategoryForModule(comp.key, comp.category);
            loadResults[comp.key] = true;
            console.log(`Successfully registered ${comp.key} component manually with direct import`);
          }
        } else if (comp.component) {
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
  const [diagnosticData, setDiagnosticData] = useState(null);
  
  // Create safe error handler without requiring the context
  // This prevents the "useError must be used within an ErrorProvider" error
  
  // Safe error handler that works even outside ErrorProvider
  const safeShowError = (msg, _type, _severity, context) => {
    // Just log to console when outside error context
    // Using prefixed underscore to indicate intentionally unused parameters
    console.error(`Debug message [${_severity || 'MEDIUM'}]`, msg, context);
  };

  // Run diagnostics when the component mounts
  useEffect(() => {
    // Render the ModuleChecker which runs diagnostics on mount
    const moduleChecker = document.createElement('div');
    moduleChecker.style.display = 'none';
    document.body.appendChild(moduleChecker);
    
    const root = ReactDOM.createRoot(moduleChecker);
    root.render(<ModuleChecker />);
    
    // Load diagnostic data with error handling
    loadDiagnosticData().then(data => {
      setDiagnosticData(data);
      if (data.error) {
        safeShowError(
          `Diagnostic data error: ${data.error}`, 
          ErrorType.MODULE, 
          ErrorSeverity.MEDIUM,
          {
            componentName: 'DebugOverlayManualRegistration',
            action: 'loadDiagnosticData',
            location: 'Diagnostics',
          }
        );
      }
    }).catch(err => {
      safeShowError(
        `Failed to load diagnostic data: ${err.message}`, 
        ErrorType.MODULE, 
        ErrorSeverity.MEDIUM,
        {
          componentName: 'DebugOverlayManualRegistration',
          action: 'loadDiagnosticData',
          location: 'Diagnostics',
          metadata: { error: err.toString() }
        }
      );
    });
    
    // Clean up
    return () => {
      root.unmount();
      document.body.removeChild(moduleChecker);
    };
  }, []);

  return (
    <div className="glass-notification p-4 rounded-md border border-green-600/20 debug-border-glow">
      <h3 className="text-green-400 mb-3 debug-header border-b border-green-500/20 pb-2">
        Diagnostics & Manual Registration
      </h3>

      {/* Module Operations Section */}
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
      
    </div>
  );
}
