import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { ErrorType, ErrorSeverity } from '../types/errorTypes.js';
// Diagnostics tools
import LayoutDebugUtil from '../LayoutDebugUtil.jsx';
import ModuleChecker from '../ModuleChecker.jsx';
import ModuleReloadButton from '../ModuleReloadButton.jsx';
import SupervisorRegistrationUtil from '../SupervisorRegistrationUtil.jsx';

import registry from '../../../Panes/Utility/Loader/Component/component-registry.js';

// Register fallback components here
const componentsToRegister = [
  {
    key: 'SYSTEM-SupervisorPane',
    moduleType: 'SYSTEM',
    path: '../../../Panes/Utility/Pane/SupervisorPane.jsx' // relative to project structure
  }
];

export async function loadDiagnosticData() {
  try {
    const listResponse = await fetch('/api/logs/list');
    if (!listResponse.ok) throw new Error(`Failed to fetch logs: ${listResponse.statusText}`);

    const { logs } = await listResponse.json();
    const diagnosticLogs = logs.filter(log =>
      log.includes('diagnostic') || log.includes('import') || log.includes('module_status')
    );

    if (!diagnosticLogs.length) return {
      moduleStatus: {},
      importLog: 'No diagnostic logs found',
      error: null
    };

    const logContents = await Promise.all(diagnosticLogs.map(async (logName) => {
      const res = await fetch(`/logs/file?filename=${logName}`);
      return { name: logName, content: await res.text() };
    }));

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
      if (name.includes('diagnostic') || name.includes('import')) {
        importLog += `=== ${name} ===\n${content}\n\n`;
      }
    });

    return { moduleStatus, importLog, error: null };
  } catch (err) {
    return { moduleStatus: null, importLog: null, error: err.message };
  }
}

export async function registerEssentialComponents() {
  const loadResults = {};
  try {
    for (const { key, moduleType, path } of componentsToRegister) {
      try {
        const mod = await import(path);
        const Component = mod.default;
        if (Component) {
          registry.registerComponent(key, Component, moduleType);
          loadResults[key] = true;
          console.log(`✅ Registered component: ${key}`);
        } else {
          loadResults[key] = false;
          console.warn(`❌ Missing default export for ${key}`);
        }
      } catch (err) {
        loadResults[key] = false;
        console.error(`❌ Failed to register ${key}:`, err);
      }
    }

    const success = Object.values(loadResults).some(v => v === true);
    return {
      success,
      loadResults,
      registered: Object.entries(loadResults).filter(([_, ok]) => ok).map(([k]) => k)
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function runSystemDiagnostics() {
  console.log('🔍 Running system diagnostics...');
  return Promise.resolve();
}

export default function DebugOverlayManualRegistration() {
  const [diagnosticData, setDiagnosticData] = useState(null);

  const logError = (msg, type = 'SYSTEM', severity = 'MEDIUM', context = {}) => {
    console.error(`[${type}:${severity}] ${msg}`, context);
  };

  useEffect(() => {
    const container = document.createElement('div');
    container.style.display = 'none';
    document.body.appendChild(container);
    const root = ReactDOM.createRoot(container);
    root.render(<ModuleChecker />);

    loadDiagnosticData()
      .then((data) => {
        setDiagnosticData(data);
        if (data.error) {
          logError(data.error, ErrorType.MODULE, ErrorSeverity.MEDIUM, {
            componentName: 'DebugOverlayManualRegistration',
            action: 'loadDiagnosticData'
          });
        }
      })
      .catch((err) => {
        logError(err.message, ErrorType.MODULE, ErrorSeverity.MEDIUM, {
          componentName: 'DebugOverlayManualRegistration',
          action: 'loadDiagnosticData'
        });
      });

    return () => {
      root.unmount();
      document.body.removeChild(container);
    };
  }, []);

  return (
    <div className="glass-notification p-4 rounded-md border border-green-600/20 debug-border-glow">
      <h3 className="text-green-400 mb-3 debug-header border-b border-green-500/20 pb-2">
        Diagnostics & Manual Registration
      </h3>

      <div className="mb-4">
        <h3 className="text-green-300 text-sm font-bold border-b border-green-700 pb-2 mb-3">
          Advanced Diagnostic Tools
        </h3>

        <div className="bg-black/30 p-3 rounded border border-green-800 mb-4">
          <h4 className="text-green-400 text-xs font-bold mb-2">Module Operations</h4>
          <ModuleReloadButton />
        </div>

        <div className="bg-black/30 p-3 rounded border border-green-800 mb-4">
          <h4 className="text-green-400 text-xs font-bold mb-2">Supervisor Registration</h4>
          <SupervisorRegistrationUtil />
        </div>

        <div className="bg-black/30 p-3 rounded border border-green-800 mb-4">
          <h4 className="text-green-400 text-xs font-bold mb-2">Layout Debug Tools</h4>
          <LayoutDebugUtil />
        </div>
      </div>

      <div className="mt-4">
        <h4 className="text-green-300 text-xs mb-2">Diagnostic Results</h4>
        <div className="bg-black/30 p-2 rounded border border-green-800 text-xs mb-2">
          {diagnosticData ? (
            <div>
              <p className="mb-2">
                Status:{' '}
                <span className={diagnosticData.error ? 'text-red-400' : 'text-green-400'}>
                  {diagnosticData.error ? 'Error' : 'Available'}
                </span>
              </p>
              {diagnosticData.error && <p className="text-red-400 mb-2">{diagnosticData.error}</p>}
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
