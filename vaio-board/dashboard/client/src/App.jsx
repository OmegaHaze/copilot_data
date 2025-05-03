// Updated App.jsx
import React, { useEffect, useState, useRef, lazy, Suspense } from 'react';
import ServiceMatrix from './components/Panes/Utility/Loader/ServiceMatrix.jsx';
import BootFlicker from './components/Boot/BootFlicker.jsx';
import SetAdmin from './components/Admin/SetAdmin.jsx';
import Login from './components/Admin/Login.jsx';
import BootShell from './components/Boot/BootShell.jsx';

// No diagnostic tools imported directly - use Debug Overlay instead

// Import error test button
import ErrorTestButton from './components/Error-Handling/ErrorTestButton.jsx';

import { SettingsProvider } from './components/SettingsMenu/SettingsContext.jsx';
import { DragDisableProvider } from './components/Panes/Utility/DragDisableContext.jsx';
import { SocketProvider } from './components/Panes/Utility/SocketContext.jsx';
import { EnvSocketProvider } from './components/Panes/Utility/EnvSocketContext.jsx';
import PaneHeaderSettings from './components/Panes/Utility/MainSettings.jsx';
import { ErrorProvider, useErrorSystem } from './components/Error-Handling/ErrorNotificationSystem.jsx';
import DebugOverlay from './components/Error-Handling/DebugOverlay.jsx';
import { initializeDebug } from './components/Error-Handling/DebugUtils.js';

console.log("App.jsx loaded");

// App wrapper to initialize debug system
function AppWithErrorSystem() {
  const errorSystem = useErrorSystem();
  const initialized = useRef(false);
  
  // Initialize debug system
  useEffect(() => {
    if (!initialized.current && errorSystem) {
      // Make error system available globally for use in component loader
      window.errorSystem = errorSystem;
      
      // Initialize debug utilities
      initializeDebug(errorSystem.showDebug, errorSystem.hideDebug);
      
      console.log('✅ Error and debug systems initialized');
      initialized.current = true;
    }
  }, [errorSystem]);
  
  return <AppContent />;
}

// Main app content
function AppContent() {
  const [step, setStep] = useState('checking'); // checking | setadmin | login | boot | ready

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch("/api/user/me", {
          credentials: "include"
        });
        if (res.ok) return setStep("boot");

        const exists = await fetch("/api/user/exists", {
          credentials: "include"
        }).then(r => r.json());

        setStep(exists.exists ? "login" : "setadmin");
      } catch (error) {
        console.error('Session check failed:', error);
        setStep("setadmin");
      }
    };

    checkSession();
  }, []);

  return (
    <>
      {step === 'ready' && (
        <>
          <ServiceMatrix />
          <PaneHeaderSettings />
          <DebugOverlay />
          {/* Module diagnostics are now part of Debug Overlay */}
          {import.meta.env.DEV && (
            // Only include test button in development
            <Suspense fallback={<></>}>
              <ErrorTestButton />
            </Suspense>
          )}
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
    </>
  );
}

// Main App export
export default function App() {
  return (
    <EnvSocketProvider>
      <SocketProvider>
        <ErrorProvider>
          <DragDisableProvider>
            <SettingsProvider>
              <AppWithErrorSystem />
            </SettingsProvider>
          </DragDisableProvider>
        </ErrorProvider>
      </SocketProvider>
    </EnvSocketProvider>
  );
}