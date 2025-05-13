// App.jsx
import React, { useEffect, useState, useCallback } from 'react';
import ServiceMatrix from './components/Panes/Utility/Loader/ServiceMatrix.jsx';
import BootFlicker from './components/Boot/BootFlicker.jsx';
import SetAdmin from './components/Admin/SetAdmin.jsx';
import Login from './components/Admin/Login.jsx';
import BootShell from './components/Boot/BootShell.jsx';
import SidePanelLeft from './components/Panels/SidePanelLeft.jsx';
import SidePanelRight from './components/Panels/SidePanelRight.jsx';
import PaneHeaderSettings from './components/Panes/Utility/MainSettings.jsx';
import DebugOverlay from './components/Error-Handling/Diagnostics/DebugOverlay.jsx';
// Import debug bridge to initialize debug functions
import { initializeDebugBridge } from './components/Error-Handling/Diagnostics/utils/debug-bridge.js';

function App() {
  const [step, setStep] = useState('checking');
  const [showLeft, setShowLeft] = useState(true);
  const [showRight, setShowRight] = useState(true);

  // Panel toggle functions
  const toggleLeftPanel = useCallback(() => {
    setShowLeft(prev => !prev);
  }, []);

  const toggleRightPanel = useCallback(() => {
    setShowRight(prev => !prev);
  }, []);

  useEffect(() => {
    // Initialize the debug bridge
    initializeDebugBridge();
    
    const checkSession = async () => {
      try {
        const res = await fetch("/api/user/me", { credentials: "include" });
        if (res.ok) return setStep("boot");

        const exists = await fetch("/api/user/exists", { credentials: "include" }).then(r => r.json());
        setStep(exists.exists ? "login" : "setadmin");
      } catch {
        setStep("setadmin");
      }
    };

    checkSession();
  }, []);

  return (
    <>
      {step === 'ready' && (
        <>
          <div className="flex w-screen h-screen">
            <SidePanelLeft show={showLeft} toggle={toggleLeftPanel} />
            <div className="flex-1">
              <ServiceMatrix showLeft={showLeft} showRight={showRight} />
              <PaneHeaderSettings />
            </div>
            <SidePanelRight show={showRight} toggle={toggleRightPanel} />
          </div>
        </>
      )}
      {step === 'setadmin' && (
        <BootShell>
          <SetAdmin onComplete={() => setStep('boot')} />
        </BootShell>
      )}
      {step === 'login' && (
        <BootShell>
          <Login onComplete={() => setStep('boot')} />
        </BootShell>
      )}
      {step === 'boot' && (
        <BootFlicker onComplete={() => setStep('ready')} />
      )}
      
      {/* Debug Overlay - rendered at the root level, conditionally displayed via its own isOpen state */}
      <DebugOverlay />
    </>
  );
}

// Export just the App component now - providers have been moved to main.jsx
export default App;
