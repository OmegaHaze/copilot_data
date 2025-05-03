import React, { useState, useEffect, useRef, useContext } from 'react';
import { SettingsContext } from '../SettingsMenu/SettingsContext.jsx';
import { useSocket } from '../Panes/Utility/SocketContext.jsx';
import DebugOverlayPanes from './tabs/DebugOverlayPanes.jsx';
import DebugOverlayGeneral from './tabs/DebugOverlayGeneral.jsx';
import DebugOverlaySession from './tabs/DebugOverlaySession.jsx';
import DebugOverlayNetwork from './tabs/DebugOverlayNetwork.jsx';
import DebugOverlayStorage from './tabs/DebugOverlayStorage.jsx';

// Debug Overlay with enhanced monitoring capabilities
export default function DebugOverlay() {
  const { gridLayout, activeModules } = useContext(SettingsContext);
  // Use socket context safely with optional chaining
  const socketContext = useSocket() || {};
  const [isOpen, setIsOpen] = useState(false);
  const [hasSupervisor, setHasSupervisor] = useState(false);
  const [supervisorLayout, setSupervisorLayout] = useState(null);
  const [missingPanes, setMissingPanes] = useState([]);
  const [activeTab, setActiveTab] = useState('general'); // New tabs system
  const buttonRef = useRef(null);

  // Enhanced debug state
  const [sessionData, setSessionData] = useState(null);
  const [networkRequests, setNetworkRequests] = useState([]);
  const [storageData, setStorageData] = useState({ local: {}, session: {} });
  const [moduleInitData, setModuleInitData] = useState(null);
  const [socketData, setSocketData] = useState({
    services: [],
    logStreams: {},
    errorLogs: {},
    connected: false
  });

  // Update socket data periodically when overlay is open
  useEffect(() => {
    if (!isOpen) return;
    
    // Safely access socket context properties
    const services = socketContext.services || [];
    const logStreams = socketContext.logStreams || {};
    const errorLogs = socketContext.errorLogs || {};
    const connected = socketContext.connected || false;
    
    // Update socket data immediately
    setSocketData({
      services,
      logStreams,
      errorLogs,
      connected
    });
    
    // Set up interval to update socket data
    const interval = setInterval(() => {
      setSocketData({
        services: socketContext.services || [],
        logStreams: socketContext.logStreams || {},
        errorLogs: socketContext.errorLogs || {},
        connected: socketContext.connected || false
      });
    }, 2000);
    
    return () => clearInterval(interval);
  }, [isOpen, socketContext]);

  // Fetch session data for debugging
  const fetchSessionData = async () => {
    try {
      const [sessionRes, meRes] = await Promise.all([
        fetch('/api/user/session'),
        fetch('/api/user/me')
      ]);
      
      const sessionData = await sessionRes.json().catch(() => ({}));
      const meData = await meRes.json().catch(() => ({}));
      
      setSessionData({
        session: sessionData,
        me: meData,
        timestamp: new Date().toISOString()
      });
      
      return { session: sessionData, me: meData };
    } catch (err) {
      console.error('Failed to fetch session data:', err);
      return null;
    }
  };
  
  // Network request monitoring
  useEffect(() => {
    if (!isOpen) return;
    
    // Only setup monitoring when debug overlay is open
    const originalFetch = window.fetch;
    const requests = [];
    
    window.fetch = async (...args) => {
      const url = args[0];
      const options = args[1] || {};
      
      const requestData = {
        url,
        method: options.method || 'GET',
        timestamp: new Date().toISOString(),
        status: 'pending'
      };
      
      requests.push(requestData);
      setNetworkRequests([...requests]);
      
      try {
        const response = await originalFetch(...args);
        const clonedResponse = response.clone();
        
        try {
          const responseData = await clonedResponse.json().catch(() => null);
          requestData.responseData = responseData;
        } catch (e) {}
        
        requestData.status = response.ok ? 'success' : 'error';
        requestData.statusCode = response.status;
        setNetworkRequests([...requests]);
        
        return response;
      } catch (error) {
        requestData.status = 'failed';
        requestData.error = error.message;
        setNetworkRequests([...requests]);
        throw error;
      }
    };
    
    return () => {
      window.fetch = originalFetch;
    };
  }, [isOpen]);
  
  // Storage monitoring
  useEffect(() => {
    if (!isOpen) return;
    
    const updateStorage = () => {
      // Get all localStorage and sessionStorage items
      const localData = {};
      const sessionData = {};
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        try {
          localData[key] = JSON.parse(localStorage.getItem(key));
        } catch (e) {
          localData[key] = localStorage.getItem(key);
        }
      }
      
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        try {
          sessionData[key] = JSON.parse(sessionStorage.getItem(key));
        } catch (e) {
          sessionData[key] = sessionStorage.getItem(key);
        }
      }
      
      setStorageData({
        local: localData,
        session: sessionData
      });
    };
    
    // Get module init data
    if (window.getModuleData) {
      setModuleInitData(window.getModuleData());
    }
    
    updateStorage();
    
    // Monitor storage changes
    const storageHandler = () => updateStorage();
    window.addEventListener('storage', storageHandler);
    
    // Periodic refresh
    const interval = setInterval(updateStorage, 2000);
    
    return () => {
      window.removeEventListener('storage', storageHandler);
      clearInterval(interval);
    };
  }, [isOpen]);
  
  useEffect(() => {
    // Expose the function to toggle the debug overlay to the window object
    window.toggleDebugOverlay = () => setIsOpen(prev => !prev);
    
    // Add event listener for toggling the debug overlay
    const handleToggleEvent = (event) => {
      const forced = event.detail?.forced;
      setIsOpen(prev => forced ? true : !prev);
    };
    
    window.addEventListener('vaio:toggle-debug-overlay', handleToggleEvent);
    
    // Reset layout function 
    window.vaioResetLayout = async () => {
      try {
        localStorage.removeItem('vaio_layout');
        await fetch('/api/user/session/grid', { method: 'DELETE' });
        window.location.reload();
      } catch (e) {
        console.error('❌ Reset layout failed:', e);
        
        // Show error in notification system if available
        if (window.errorSystem && typeof window.errorSystem.showError === 'function') {
          window.errorSystem.showError(`Failed to reset layout: ${e.message}`, 'error');
        }
      }
    };
    
    // Fetch session data initially
    fetchSessionData();
    
    return () => {
      delete window.vaioResetLayout;
      delete window.toggleDebugOverlay;
      window.removeEventListener('vaio:toggle-debug-overlay', handleToggleEvent);
    };
  }, []);

  // Track grid layout to pane mapping relationship
  const [gridPaneMap, setGridPaneMap] = useState({});
  const [renderableItems, setRenderableItems] = useState([]);
  const [nonRenderableItems, setNonRenderableItems] = useState([]);

  // This is the key function that diagnoses why panes aren't rendering
  const analyzeGridPaneMapping = () => {
    if (!gridLayout) return {};
    
    const gridToPane = {};
    const canRender = [];
    const cannotRender = [];
    
    // Get the pane map from the ComponentLoader
    const paneMap = window.getPaneMap ? window.getPaneMap() : {};
    // ALSO get the raw paneMap directly from the module (for accurate component detection)
    const rawPaneMap = window.rawPaneMap || {};
    
    console.log('DEBUG - Analysis Start:');
    console.log('- Available in window.getPaneMap():', Object.keys(paneMap));
    console.log('- Available in rawPaneMap:', Object.keys(rawPaneMap));
    console.log('- Grid layout keys:', Object.keys(gridLayout));
    
    // Analyze each grid item and check if it can be rendered
    Object.entries(gridLayout).forEach(([gridKey, gridItem]) => {
      // Skip entries that don't have the expected grid item format
      if (!gridItem || typeof gridItem !== 'object' || !gridItem.i) return;
      
      const moduleKey = gridKey.toLowerCase();
      // Check BOTH pane maps for the component
      const hasPaneComponent = moduleKey in paneMap || moduleKey in rawPaneMap;
      const componentType = paneMap[moduleKey]?.type || typeof rawPaneMap[moduleKey];
      const isFunction = componentType === 'function';
      const isValidComponent = hasPaneComponent && (
        paneMap[moduleKey]?.isValid === true || 
        isFunction
      );
      
      console.log(`- Grid item "${gridKey}": found=${hasPaneComponent}, type=${componentType}, valid=${isValidComponent}`);
      
      gridToPane[gridKey] = {
        gridItem,
        moduleKey,
        hasPaneComponent,
        isValidComponent,
        error: paneMap[moduleKey]?.error || null // Changed from errorInfo to error to match usage in UI
      };
      
      if (isValidComponent) {
        canRender.push(gridKey);
      } else {
        cannotRender.push({
          key: gridKey,
          reason: !hasPaneComponent ? 'No pane component found' : 
                  'Component exists but is not valid',
          error: paneMap[moduleKey]?.error || null
        });
      }
    });
    
    setGridPaneMap(gridToPane);
    setRenderableItems(canRender);
    setNonRenderableItems(cannotRender);
    
    return gridToPane;
  };

  useEffect(() => {
    const supervisorActive = Array.isArray(activeModules) &&
      (activeModules.includes('supervisor'));

    let supervisorData = null;
    if (gridLayout) {
      supervisorData = gridLayout.supervisor || gridLayout.supervisord || null;
    }

    setHasSupervisor(supervisorActive);
    setSupervisorLayout(supervisorData);

    if (supervisorActive && !supervisorData) {
      setIsOpen(true);
    }

    // Analyze why panes aren't rendering
    analyzeGridPaneMapping();

    // Check for failed pane mappings
    if (typeof window.getPaneMapErrors === 'function') {
      const errors = window.getPaneMapErrors();
      if (errors.length > 0) {
        console.warn('❌ Unmapped Panes Detected:', errors);
        setMissingPanes(errors.map(e => typeof e === 'object' ? e.key : e));
        
        // Open debug panel automatically on errors
        setIsOpen(true);
        
        // Show error in notification system if available
        if (window.errorSystem && typeof window.errorSystem.showError === 'function') {
          const errorCount = errors.length;
          window.errorSystem.showError(
            `${errorCount} pane${errorCount > 1 ? 's' : ''} failed to load. Check Debug Panel for details.`,
            'error',
            10000
          );
        }
      }
    }
  }, [activeModules, gridLayout]);

  // useEffect(() => {
  //   if (buttonRef.current) return;

  //   const btn = document.createElement('button');
  //   btn.innerText = '🔍';
  //   btn.id = 'vaio-debug-button';
  //   btn.className = 'fixed top-2 right-2 z-[9999] h-8 w-8 rounded-full bg-green-900/80 text-green-300 border border-green-600 flex items-center justify-center hover:bg-green-800';
  //   btn.onclick = () => setIsOpen(true);
  //   document.body.appendChild(btn);
  //   buttonRef.current = btn;

  //   return () => {
  //     if (buttonRef.current) {
  //       buttonRef.current.remove();
  //       buttonRef.current = null;
  //     }
  //   };
  // }, []);

  // Force re-fetch session data when debug overlay is opened
  useEffect(() => {
    if (isOpen) {
      fetchSessionData();
      
      // Update button appearance when panel is open
      if (buttonRef.current) {
        buttonRef.current.className = 'fixed top-2 right-2 z-[9999] h-8 w-8 rounded-full bg-blue-900/80 text-blue-300 border border-blue-600 flex items-center justify-center hover:bg-blue-800';
      }
    } else {
      // Reset button appearance when panel is closed
      if (buttonRef.current) {
        buttonRef.current.className = 'fixed top-2 right-2 z-[9999] h-8 w-8 rounded-full bg-green-900/80 text-green-300 border border-green-600 flex items-center justify-center hover:bg-green-800';
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;
  
  return (
    <div className="fixed top-0 left-0 w-full h-full bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 font-mono">
      <div className="glass-notification rounded-lg w-[85%] max-w-5xl h-[85%] overflow-hidden shadow-xl flex flex-col scanlines border border-green-600/5">
        <div className="flex justify-between items-center px-4 py-2 border-b border-green-600/20">
          <h2 className="text-green-400 text-lg debug-header">vAIO Debug Console</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="text-xs font-bold cursor-pointer opacity-60 hover:opacity-100 transition-all w-6 h-6 flex items-center justify-center rounded-full hover:bg-green-900/20"
            title="Close debug overlay"
          >
            ×
          </button>
        </div>
        
        {/* Debug Tabs */}
        <div className="flex flex-wrap border-b border-green-700/30 mb-1 px-4 py-1">
          <button 
            onClick={() => setActiveTab('general')}
            className={`px-3 py-1.5 mr-1 text-xs transition-all ${
              activeTab === 'general' 
                ? 'text-green-300 border-b-2 border-green-500/60' 
                : 'text-green-500 hover:text-green-400 hover:border-b-2 hover:border-green-500/30'
            }`}
          >
            General
          </button>
          <button 
            onClick={() => setActiveTab('panes')}
            className={`px-3 py-1.5 mr-1 text-xs transition-all ${
              activeTab === 'panes' 
                ? 'text-green-300 border-b-2 border-green-500/60' 
                : 'text-green-500 hover:text-green-400 hover:border-b-2 hover:border-green-500/30'
            }`}
          >
            Panes
          </button>
          <button 
            onClick={() => setActiveTab('session')}
            className={`px-3 py-1.5 mr-1 text-xs transition-all ${
              activeTab === 'session' 
                ? 'text-green-300 border-b-2 border-green-500/60' 
                : 'text-green-500 hover:text-green-400 hover:border-b-2 hover:border-green-500/30'
            }`}
          >
            Session
          </button>
          <button 
            onClick={() => setActiveTab('network')}
            className={`px-3 py-1.5 mr-1 text-xs transition-all ${
              activeTab === 'network' 
                ? 'text-green-300 border-b-2 border-green-500/60' 
                : 'text-green-500 hover:text-green-400 hover:border-b-2 hover:border-green-500/30'
            }`}
          >
            Network
          </button>
          <button 
            onClick={() => setActiveTab('storage')}
            className={`px-3 py-1.5 mr-1 text-xs transition-all ${
              activeTab === 'storage' 
                ? 'text-green-300 border-b-2 border-green-500/60' 
                : 'text-green-500 hover:text-green-400 hover:border-b-2 hover:border-green-500/30'
            }`}
          >
            Storage
          </button>
          <button 
            onClick={() => setActiveTab('socket')}
            className={`px-3 py-1.5 mr-1 text-xs transition-all ${
              activeTab === 'socket' 
                ? 'text-green-300 border-b-2 border-green-500/60' 
                : 'text-green-500 hover:text-green-400 hover:border-b-2 hover:border-green-500/30'
            }`}
          >
            Socket
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-auto p-4">
          {/* General Tab - Original Debug Info */}
          {activeTab === 'general' && (
            <DebugOverlayGeneral
              activeModules={activeModules}
              hasSupervisor={hasSupervisor}
              supervisorLayout={supervisorLayout}
              gridLayout={gridLayout}
              fetchSessionData={fetchSessionData}
            />
          )}

          {/* Panes Tab - Component Loading Debug */}
          {activeTab === 'panes' && (
            <DebugOverlayPanes
              missingPanes={missingPanes}
              gridPaneMap={gridPaneMap}
              renderableItems={renderableItems}
              nonRenderableItems={nonRenderableItems}
              moduleInitData={moduleInitData}
              analyzeGridPaneMapping={() => {
                const results = analyzeGridPaneMapping();
                // Force a re-render by setting state with new values
                setGridPaneMap({...results});
                // Also update the timestamp to help ensure a refresh
                setModuleInitData({
                  ...(moduleInitData || {}),
                  _lastUpdated: new Date().toISOString()
                });
                return results;
              }}
            />
          )}
          
          {/* Session Tab - Authentication Tracking */}
          {activeTab === 'session' && (
            <DebugOverlaySession
              sessionData={sessionData}
              fetchSessionData={fetchSessionData}
            />
          )}

          {/* Network Tab - API Request Monitoring */}
          {activeTab === 'network' && (
            <DebugOverlayNetwork
              networkRequests={networkRequests}
              setNetworkRequests={setNetworkRequests}
            />
          )}
          
          {/* Storage Tab - localStorage/sessionStorage Inspection */}
          {activeTab === 'storage' && (
            <DebugOverlayStorage
              storageData={storageData}
            />
          )}
          
          {/* Socket Tab - Socket.io Data Monitoring */}
          {activeTab === 'socket' && (
            <div>
              <div className="glass-notification p-4 rounded-md border border-green-600/20 debug-border-glow">
                <h3 className="text-green-400 mb-3 debug-header border-b border-green-500/20 pb-2">
                  Socket Status: {socketData.connected ? (
                    <span className="text-green-400">✅ Connected</span>
                  ) : (
                    <span className="text-red-400">❌ Disconnected</span>
                  )}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-green-300 text-xs mb-1">
                      Services ({Array.isArray(socketData.services) ? socketData.services.length : 0})
                    </h4>
                    <div className="scanlines bg-green-900/10 p-2 rounded overflow-auto max-h-40 text-xs">
                      {Array.isArray(socketData.services) && socketData.services.length > 0 ? (
                        <ul className="list-disc pl-5">
                          {socketData.services.map((service, idx) => (
                            <li key={idx} className="mb-1">
                              <span className="text-green-300">{service.name}</span>
                              <span className="ml-2">
                                {service.status ? (
                                  <span className={service.status.toLowerCase().includes('error') 
                                    ? 'text-red-400' 
                                    : service.status.toLowerCase().includes('running') 
                                      ? 'text-green-400' 
                                      : 'text-yellow-400'
                                  }>
                                    {service.status}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">Unknown</span>
                                )}
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-yellow-400">No services data available</p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-green-300 text-xs mb-1">
                      Error Logs ({Object.keys(socketData.errorLogs || {}).length})
                    </h4>
                    <div className="scanlines bg-green-900/10 p-2 rounded overflow-auto max-h-40 text-xs">
                      {Object.entries(socketData.errorLogs || {}).length > 0 ? (
                        <div>
                          {Object.entries(socketData.errorLogs).map(([service, logs]) => (
                            <div key={service} className="mb-2">
                              <h5 className="text-red-400">{service}</h5>
                              <ul className="list-disc pl-5 text-red-300">
                                {Array.isArray(logs) && logs.slice(0, 3).map((log, idx) => (
                                  <li key={idx}>{log}</li>
                                ))}
                                {Array.isArray(logs) && logs.length > 3 && (
                                  <li className="text-red-500">
                                    ... and {logs.length - 3} more errors
                                  </li>
                                )}
                              </ul>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-green-400">✅ No error logs found</p>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="mt-4">
                  <h4 className="text-green-300 text-xs mb-1">
                    Log Streams ({Object.keys(socketData.logStreams || {}).length})
                  </h4>
                  <div className="scanlines bg-green-900/10 p-2 rounded overflow-auto max-h-40 text-xs">
                    {Object.entries(socketData.logStreams || {}).length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {Object.entries(socketData.logStreams).map(([service, logs]) => (
                          <div key={service} className="mb-2">
                            <h5 className="text-green-400">{service}</h5>
                            <div className="border border-green-900/30 p-2 bg-black/30 max-h-24 overflow-auto">
                              <pre className="text-green-200 text-[9px]">
                                {typeof logs === 'string' 
                                  ? logs.split('\n').slice(-10).join('\n') 
                                  : 'No log data'}
                              </pre>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-yellow-400">No log streams available</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}