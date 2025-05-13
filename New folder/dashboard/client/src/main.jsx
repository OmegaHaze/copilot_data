import { StrictMode } from 'react';
import { ErrorProvider } from './components/Error-Handling/Diagnostics/ErrorNotificationSystem.jsx';
import NotificationProvider from './components/Notifications/NotificationSystem.jsx';
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './styles/theme.css'
import { errorHandler } from './components/Error-Handling/utils/errorHandler'
import { ErrorType, ErrorSeverity, parseConsoleMessage } from './components/Error-Handling/Diagnostics/types/errorTypes'

// Import required context providers from App.jsx
import { EnvSocketProvider } from './components/Panes/Utility/Context/EnvSocketContext.jsx';
import { LogProvider } from './components/Panes/Utility/Context/LogContext.jsx';
import { SocketProvider } from './components/Panes/Utility/Context/SocketContext.jsx';
import { DragDisableProvider } from './components/Panes/Utility/Context/DragDisableContext.jsx';
import { SettingsProvider } from './components/Panes/Utility/Context/SettingsContext.jsx';

// Store original console methods
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

// Override console.warn to capture warnings in the error system
console.warn = function() {
  // Call original console.warn
  originalConsoleWarn.apply(console, arguments);
  
  // Convert arguments to string
  const warningMessage = Array.from(arguments).join(' ');
  
  // Skip React internal warnings to avoid noise
  const skipWarnings = [
    'Warning: ',
    '[React DevTools]',
    '[HMR]',
    '[vite]',
    'DevTools failed to load',
    '[Vite]',
    'Invalid prop',
    'Failed prop type',
    'You provided a `checked` prop to a form field'
  ];
  
  if (!skipWarnings.some(skip => warningMessage.includes(skip))) {
    // Parse warning message to determine type and severity
    const { type, severity } = parseConsoleMessage(warningMessage, 'warn');
    
    // Send non-React warnings to error system
    errorHandler.showError(
      warningMessage, 
      type,
      severity,
      {
        componentName: 'Console',
        action: 'warning',
        location: 'Browser Console',
        metadata: {
          timestamp: new Date().toISOString(),
          source: 'console.warn'
        }
      }
    );
  }
};

// Override console.error to capture errors in the error system
console.error = function() {
  // Call original console.error
  originalConsoleError.apply(console, arguments);
  
  // Convert arguments to string
  const errorMessage = Array.from(arguments).join(' ');
  
  // Skip React internal errors to avoid noise and our own error system logs to prevent infinite loops
  const skipErrors = [
    '[React DevTools]',
    '[HMR]',
    '[vite]',
    'Warning: ',
    'DevTools failed to load',
    'React does not recognize',
    '[CONSOLE_ERROR]' // Add this to prevent infinite recursion in error handling
  ];
  
  if (!skipErrors.some(skip => errorMessage.includes(skip))) {
    // Parse error message to determine type and severity
    const { type, severity } = parseConsoleMessage(errorMessage, 'error');
    
    // Send non-React errors to error system
    errorHandler.showError(
      errorMessage,
      type,
      severity,
      {
        componentName: 'Console',
        action: 'error',
        location: 'Browser Console',
        metadata: {
          timestamp: new Date().toISOString(),
          source: 'console.error'
        }
      }
    );
  }
};

// Import the Debug Overlay Provider
import { DebugOverlayProvider } from './components/Error-Handling/Diagnostics/DebugOverlayContext.jsx';

// Initialize app with error handling and notification system
const RootApp = () => (
  <StrictMode>
    <ErrorProvider>
      <NotificationProvider>
        <DebugOverlayProvider>
          <EnvSocketProvider>
            <LogProvider>
              <SocketProvider>
                <DragDisableProvider>
                  <SettingsProvider>
                    <App />
                  </SettingsProvider>
                </DragDisableProvider>
              </SocketProvider>
            </LogProvider>
          </EnvSocketProvider>
        </DebugOverlayProvider>
      </NotificationProvider>
    </ErrorProvider>
  </StrictMode>
);

// Create root and render app
createRoot(document.getElementById('root')).render(<RootApp />)
