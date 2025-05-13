import React, { useState, useEffect, useRef, useContext } from 'react';
import { SettingsContext } from '../../Panes/Utility/Context/SettingsContext.jsx';
import { useSocket } from '../../Panes/Utility/Context/SocketContext.jsx';
import { useError } from './ErrorNotificationSystem.jsx';
import { useDebugOverlay } from './DebugOverlayContext.jsx';
import DebugOverlayPanes from './tabs/DebugOverlayPanes.jsx';
import DebugOverlayGeneral from './tabs/DebugOverlayGeneral.jsx';
import DebugOverlaySession from './tabs/DebugOverlaySession.jsx';
import DebugOverlayNetwork from './tabs/DebugOverlayNetwork.jsx';
import DebugOverlayStorage from './tabs/DebugOverlayStorage.jsx';
import DebugOverlayManualRegistration from './tabs/DebugOverlayManualRegistration.jsx';
import LayoutDebugger from './tabs/LayoutDebugger.jsx';

// Debug Overlay with enhanced monitoring capabilities
export default function DebugOverlay() {
  const { gridLayout, activeModules } = useContext(SettingsContext);
  const socketContext = useSocket() || {};
  const { showError } = useError();
  const { isOpen, activeTab, setActiveTab, closeOverlay } = useDebugOverlay();
  const [hasSupervisor, setHasSupervisor] = useState(false);
  const [supervisorLayout, setSupervisorLayout] = useState(null);
  const [missingPanes, setMissingPanes] = useState([]);
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
      // Try multiple possible session endpoints with error handling
      let sessionData = {};
      let meData = {};
      
      try {
        const sessionRes = await fetch('/api/user/session', { credentials: 'include' });
        if (sessionRes.ok) {
          sessionData = await sessionRes.json();
          console.log('Successfully loaded session data from /api/user/session');
        } else {
          console.warn(`Session endpoint returned status: ${sessionRes.status}`);
        }
      } catch (sessionErr) {
        console.error('Error fetching from /api/user/session:', sessionErr);
      }
      
      try {
        const meRes = await fetch('/api/user/me', { credentials: 'include' });
        if (meRes.ok) {
          meData = await meRes.json();
          console.log('Successfully loaded user data from /api/user/me');
        } else {
          console.warn(`User endpoint returned status: ${meRes.status}`);
        }
      } catch (meErr) {
        console.error('Error fetching from /api/user/me:', meErr);
      }
      
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
      
      // Check specifically for VAIO layouts data first
      try {
        const vaioLayouts = localStorage.getItem('vaio_layouts');
        if (vaioLayouts) {
          try {
            localData['vaio_layouts'] = JSON.parse(vaioLayouts);
          } catch (e) {
            localData['vaio_layouts'] = vaioLayouts;
            console.warn('Failed to parse VAIO layouts data:', e);
          }
        }
      } catch (e) {
        console.error('Error accessing VAIO layouts data:', e);
      }
      
      // Get all other localStorage items
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key === 'vaio_layouts') continue; // Already handled
        
        try {
          localData[key] = JSON.parse(localStorage.getItem(key));
        } catch (e) {
          localData[key] = localStorage.getItem(key);
        }
      }
      
      // Get sessionStorage items
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        try {
          sessionData[key] = JSON.parse(sessionStorage.getItem(key));
        } catch (e) {
          sessionData[key] = sessionStorage.getItem(key);
        }
      }
      
      // Fetch from API session to get server-side layouts
      if (activeTab === 'storage' || activeTab === 'layouts') {
        try {
          fetch('/api/user/session/grid', { 
            credentials: 'include',
            headers: { 'Accept': 'application/json' }
          })
            .then(res => res.json())
            .then(data => {
              if (data && data.grid_layout) {
                // Add server-side layout data to session display
                sessionData['vaio_layouts'] = data.grid_layout;
                
                // Update storage data with the session data
                setStorageData({
                  local: localData,
                  session: sessionData
                });
              }
            })
            .catch(err => {
              console.warn('Failed to fetch session layouts:', err);
            });
        } catch (e) {
          console.error('Error fetching session layouts:', e);
        }
      }
      
      setStorageData({
        local: localData,
        session: sessionData
      });
    };
    
    // Get module init data
    if (window.debugRegistry && window.debugRegistry.getModuleData) {
      setModuleInitData(window.debugRegistry.getModuleData());
    }
    
    updateStorage();
    
    // Monitor standard storage changes
    const storageHandler = () => updateStorage();
    window.addEventListener('storage', storageHandler);
    
    // Listen for custom layout update events from LayoutManager
    const layoutUpdateHandler = () => {
      console.log('🔄 Layout update detected, refreshing storage data');
      updateStorage();
    };
    window.addEventListener('vaio:layouts-updated', layoutUpdateHandler);
    
    // Since the storage event doesn't fire for changes in the same tab,
    // we need to add a custom method to monitor layout changes
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = function(key, value) {
      originalSetItem.apply(this, arguments);
      if (isOpen) {
        updateStorage(); // Re-read storage after any changes
      }
    };
    
    // Periodic refresh - less frequent to reduce overhead
    const interval = setInterval(updateStorage, 2000);
    
    return () => {
      // Clean up all event listeners and restore original methods
      localStorage.setItem = originalSetItem;
      window.removeEventListener('storage', storageHandler);
      window.removeEventListener('vaio:layouts-updated', layoutUpdateHandler);
      clearInterval(interval);
    };
  }, [isOpen]);
  
  // Initialize debug overlay
  useEffect(() => {
    // Add event listener for toggling the debug overlay (for backward compatibility)
    const handleToggleEvent = (event) => {
      // This uses the context's methods instead of local state
      const forced = event.detail?.forced;
      const tab = event.detail?.tab; // Optional target tab
      
      if (forced === true || tab) {
        // Use the context's openWithTab method
        if (tab && typeof tab === 'string') {
          setActiveTab(tab);
        }
      } else {
        // Just toggle visibility
        useDebugOverlay().toggleOverlay();
      }
    };
    
    window.addEventListener('vaio:toggle-debug-overlay', handleToggleEvent);
    
    // Fetch session data initially
    fetchSessionData();
    
    // Extended debugging info on page load
    console.log('🔍 Debug overlay initialized');
    if (window.debugRegistry && typeof window.debugRegistry.getComponents === 'function') {
      const components = window.debugRegistry.getComponents();
      console.log('📊 Registered components:', Object.keys(components));
    } else {
      console.warn('❌ Debug registry not available - debug bridge may not be initialized');
    }
    
    return () => {
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
    
    // Get the component registry information via debug bridge
    const components = window.debugRegistry && typeof window.debugRegistry.getComponents === 'function' 
      ? window.debugRegistry.getComponents() 
      : {};
    
    console.log('DEBUG - Analysis Start:');
    console.log('- Available registered components:', Object.keys(components));
    
    // Log more details about the grid layout structure to help with debugging
    console.log('- Grid layout type:', typeof gridLayout);
    if (typeof gridLayout === 'object') {
      // Check if grid_layout is using the new format with breakpoints
      if (gridLayout.lg && Array.isArray(gridLayout.lg)) {
        console.log('- Grid layout has breakpoints. LG breakpoint has', gridLayout.lg.length, 'items');
        console.log('- Grid layout keys:', Object.keys(gridLayout));
        
        // Show a sample of the layout items to understand their structure
        if (gridLayout.lg.length > 0) {
          console.log('- Sample layout item format:', gridLayout.lg[0]);
        }
      } else {
        console.log('- Grid layout has no breakpoints or unusual structure:', Object.keys(gridLayout));
      }
    }
    
    // Enhanced analysis for grid layout structure
    // For breakpoint layouts (new format)
    if (gridLayout.lg && Array.isArray(gridLayout.lg)) {
      // Use the "lg" breakpoint by default (most commonly used)
      gridLayout.lg.forEach((item) => {
        if (!item || typeof item !== 'object' || !item.i) return;
        
        // Use the full ID without converting to lowercase (three-part format: MODULETYPE-STATICID-INSTANCEID)
        const moduleId = item.i;
        // Parse the three-part ID to get moduleType and staticId
        const parts = moduleId.split('-');
        
        // Check if the ID follows the three-part format
        if (parts.length !== 3) {
          console.warn(`Invalid module ID format: ${moduleId}. Expected MODULETYPE-STATICID-INSTANCEID`);
        }
        
        const moduleType = parts.length >= 1 ? parts[0] : '';
        const staticId = parts.length >= 2 ? parts[1] : '';
        const instanceId = parts.length >= 3 ? parts[2] : '';
        
        // For component lookup, preserve the full ID
        const lookupKey = moduleId;
        
        // Check registry components
        const componentInfo = components[lookupKey];
        const hasPaneComponent = !!componentInfo && componentInfo.registered;
        const isValidComponent = hasPaneComponent && !componentInfo.error;
        
        console.log(`- Grid item "${moduleId}": found=${hasPaneComponent}, valid=${isValidComponent}, moduleType=${moduleType}`);
        
        gridToPane[moduleId] = {
          gridItem: item,
          moduleId,
          moduleType,
          staticId,
          instanceId,
          hasPaneComponent,
          isValidComponent,
          error: componentInfo?.error || null
        };
        
        if (isValidComponent) {
          canRender.push(item.i);
        } else {
          cannotRender.push({
            key: item.i,
            reason: !hasPaneComponent ? 'No pane component found' : 
                    'Component exists but is not valid',
            error: componentInfo?.error || null
          });
        }
      });
    }
    // Legacy format or unexpected structure - we shouldn't reach here anymore
    else {
      console.warn('Grid layout is not using the expected array format with breakpoints');
      
      // Initialize empty arrays for all breakpoints
      ['lg', 'md', 'sm', 'xs', 'xxs'].forEach(bp => {
        if (!gridLayout[bp]) {
          gridLayout[bp] = [];
        } else if (!Array.isArray(gridLayout[bp])) {
          console.warn(`Converting ${bp} from ${typeof gridLayout[bp]} to array`);
          gridLayout[bp] = [];
        }
      });
    }
    
    setGridPaneMap(gridToPane);
    setRenderableItems(canRender);
    setNonRenderableItems(cannotRender);
    
    return gridToPane;
  };

  useEffect(() => {
    // Check for supervisor using the three-part module ID format (SYSTEM-SupervisorPane-instanceId)
    const supervisorActive = Array.isArray(activeModules) &&
      activeModules.some(moduleId => moduleId.startsWith('SYSTEM-SupervisorPane-'));

    let supervisorData = null;
    if (gridLayout && gridLayout.lg) {
      // Always treat gridLayout.lg as an array with additional safety
      if (!Array.isArray(gridLayout.lg)) {
        console.warn('gridLayout.lg is not an array in DebugOverlay - forcing conversion');
        gridLayout.lg = [];
      }
          
      // Find supervisor item in grid layout
      const supervisorItem = gridLayout.lg.find(item => 
        item && item.i && item.i.startsWith('SYSTEM-SupervisorPane-')
      );
      supervisorData = supervisorItem || null;
    }

    setHasSupervisor(supervisorActive);
    setSupervisorLayout(supervisorData);

    // Use the context's method instead of directly setting state
    if (supervisorActive && !supervisorData) {
      // Access toggleOverlay method from the imported context, not the hook call
      closeOverlay && closeOverlay();
    }

    // Analyze why panes aren't rendering
    analyzeGridPaneMapping();

    // Check for failed pane mappings
    if (window.debugRegistry && typeof window.debugRegistry.getComponents === 'function') {
      const componentsWithErrors = Object.entries(window.debugRegistry.getComponents())
        .filter(([_, info]) => info.error)
        .map(([key, info]) => ({ key, error: info.error }));
        
      if (componentsWithErrors.length > 0) {
        console.warn('❌ Unmapped Panes Detected:', componentsWithErrors);
        setMissingPanes(componentsWithErrors.map(e => e.key));
        
        // Use the context's method instead of directly setting state
        // Do not auto-open the debug panel as it conflicts with context
        // The error notification will allow users to open it if needed
        
        // Use error context to show the error
        showError(
          `${componentsWithErrors.length} pane(s) failed to load. Check Debug Panel for details.`,
          'PaneMapping',
          'error'
        );
      }
    }
  }, [activeModules, gridLayout, showError]);

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
            onClick={closeOverlay}
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
            onClick={() => setActiveTab('manual-registration')}
            className={`px-3 py-1.5 mr-1 text-xs transition-all ${
              activeTab === 'manual-registration' 
                ? 'text-green-300 border-b-2 border-green-500/60' 
                : 'text-green-500 hover:text-green-400 hover:border-b-2 hover:border-green-500/30'
            }`}
          >
            Manual Registration
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
          <button 
            onClick={() => setActiveTab('layouts')}
            className={`px-3 py-1.5 mr-1 text-xs transition-all ${
              activeTab === 'layouts' 
                ? 'text-green-300 border-b-2 border-green-500/60' 
                : 'text-green-500 hover:text-green-400 hover:border-b-2 hover:border-green-500/30'
            }`}
          >
            Layouts
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
          
          {/* Manual Registration Tab - Component Manual Registration */}
          {activeTab === 'manual-registration' && (
            <DebugOverlayManualRegistration />
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
                          {socketData.services.map((SERVICE, idx) => (
                            <li key={idx} className="mb-1">
                              <span className="text-green-300">{SERVICE.name}</span>
                              <span className="ml-2">
                                {SERVICE.status ? (
                                  <span className={SERVICE.status.toLowerCase().includes('error') 
                                    ? 'text-red-400' 
                                    : SERVICE.status.toLowerCase().includes('running') 
                                      ? 'text-green-400' 
                                      : 'text-yellow-400'
                                  }>
                                    {SERVICE.status}
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
                          {Object.entries(socketData.errorLogs).map(([SERVICE, logs]) => (
                            <div key={SERVICE} className="mb-2">
                              <h5 className="text-red-400">{SERVICE}</h5>
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
                        {Object.entries(socketData.logStreams).map(([SERVICE, logs]) => (
                          <div key={SERVICE} className="mb-2">
                            <h5 className="text-green-400">{SERVICE}</h5>
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
          
          {/* Layouts Tab - Grid Layout Debugging */}
          {activeTab === 'layouts' && (
            <div className="glass-notification p-4 rounded-md border border-green-600/20 debug-border-glow">
              <h3 className="text-green-400 mb-3 debug-header border-b border-green-500/20 pb-2">
                Layout Debugger
              </h3>
              <LayoutDebugger currentLayout={gridLayout} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}