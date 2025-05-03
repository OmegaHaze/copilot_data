// ErrorNotificationSystem.jsx
import React, { useState, useEffect, createContext, useContext, useRef } from 'react';
import { useSocket } from '../Panes/Utility/SocketContext.jsx';

// Create unified context
export const ErrorContext = createContext({
  showError: () => {},
  hideError: () => {},
  showDebug: () => {},
  hideDebug: () => {},
  messages: [],
  errors: []
});

// Hook to use the error context
export const useErrorSystem = () => useContext(ErrorContext);

// Provider component
export const ErrorProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [errors, setErrors] = useState([]);
  const socketContext = useSocket();
  
  // Safely extract properties with fallbacks
  const servicesWithErrors = socketContext?.servicesWithErrors || {};
  const errorLogs = socketContext?.errorLogs || {};
  
  // Add error from socket context
  useEffect(() => {
    // Only process if we actually have services with errors
    if (servicesWithErrors && Object.keys(servicesWithErrors).length > 0) {
      Object.entries(servicesWithErrors).forEach(([service, hasError]) => {
        if (hasError && errorLogs && errorLogs[service]) {
          // Get the latest error message
          const latestError = errorLogs[service][0];
          if (latestError) {
            // Add to error list if not already present
            showError(`${service}: ${latestError}`, 'error', 0);
          }
        }
      });
    }
  }, [servicesWithErrors, errorLogs]);
  
  // Show debug message (info, warning, success)
  const showDebug = (message, type = 'info', duration = 5000) => {
    const id = Date.now();
    const newMessage = { id, message, type, createdAt: new Date() };
    
    setMessages(prev => [newMessage, ...prev]);
    
    if (duration > 0) {
      setTimeout(() => {
        hideDebug(id);
      }, duration);
    }

    // Log to console for additional visibility
    console.log(`[DEBUG ${type.toUpperCase()}]:`, message);
    return id;
  };

  // Hide debug message
  const hideDebug = (id) => {
    setMessages(prev => prev.filter(msg => msg.id !== id));
  };
  
  // Show error message
  const showError = (message, type = 'error', duration = 10000) => {
    const id = Date.now();
    const newError = { id, message, type, createdAt: new Date() };
    
    setErrors(prev => [newError, ...prev]);
    
    if (duration > 0) {
      setTimeout(() => {
        hideError(id);
      }, duration);
    }

    // Log to console
    console.error(`[ERROR]:`, message);
    return id;
  };
  
  // Hide error message
  const hideError = (id) => {
    setErrors(prev => prev.filter(err => err.id !== id));
  };

  return (
    <ErrorContext.Provider value={{ 
      showDebug, 
      hideDebug, 
      showError, 
      hideError, 
      messages, 
      errors 
    }}>
      {children}
      <ErrorNotificationDisplay 
        messages={messages} 
        errors={errors}
        onCloseMessage={hideDebug}
        onCloseError={hideError}
      />
    </ErrorContext.Provider>
  );
};

// Display component
function ErrorNotificationDisplay({ messages, errors, onCloseMessage, onCloseError }) {
  return (
    <>
      {/* Debug messages at the top */}
      {messages.length > 0 && (
        <div className="fixed top-2 left-1/2 transform -translate-x-1/2 z-50 flex flex-col gap-2">
          {messages.map(msg => (
            <NotificationItem 
              key={msg.id}
              id={msg.id}
              message={msg.message}
              type={msg.type}
              onClose={onCloseMessage}
            />
          ))}
        </div>
      )}
      
      {/* Error messages at the bottom */}
      {errors.length > 0 && (
        <div className="fixed bottom-2 left-1/2 transform -translate-x-1/2 z-50 flex flex-col gap-2">
          {errors.map(err => (
            <NotificationItem 
              key={err.id}
              id={err.id}
              message={err.message}
              type={err.type}
              onClose={onCloseError}
              isError={true}
            />
          ))}
        </div>
      )}
    </>
  );
}

// Individual notification component with effects
function NotificationItem({ id, message, type, onClose, isError = false }) {
  const [isVisible, setIsVisible] = useState(false);
  const [showCopyTooltip, setShowCopyTooltip] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const messageRef = useRef(null);
  
  // Copy message to clipboard on double click
  const handleCopyClick = () => {
    if (showCopyTooltip) {
      // Copy to clipboard
      const textToCopy = message?.includes('[CONSOLE ERROR]') 
        ? message.replace('[CONSOLE ERROR]', '')
        : message?.includes('[CONSOLE WARNING]') 
          ? message.replace('[CONSOLE WARNING]', '')
          : message || '';
      
      navigator.clipboard.writeText(textToCopy).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      });
    } else {
      setShowCopyTooltip(true);
      setTimeout(() => setShowCopyTooltip(false), 3000);
    }
  };
  
  // Get theme styling based on type
  const getTypeStyles = () => {
    // Check for console error/warning to apply special styling
    const isConsoleError = message && message.includes('[CONSOLE ERROR]');
    const isConsoleWarning = message && message.includes('[CONSOLE WARNING]');
    
    switch(type) {
      case 'error':
        return isConsoleError 
          ? 'border-opacity-70 text-red-200 border-l-2 glass-notification-error' 
          : 'border-red-600/30 text-red-300 crt-text2';
      case 'warning':
        return isConsoleWarning
          ? 'border-opacity-70 text-yellow-200 border-l-2 glass-notification-warning'
          : 'border-yellow-600/30 text-yellow-300';
      case 'success':
        return 'border-green-600/40 text-green-300 crt-text3';
      case 'info':
      default:
        return 'border-green-600/30 text-green-300 crt-text3';
    }
  };
  
  // Animation entry effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 10);
    return () => clearTimeout(timer);
  }, []);
  
  // Handle close
  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose(id);
    }, 300);
  };
  
  return (
    <div 
      className={`transition-all duration-300 transform ${
        isVisible ? 'opacity-100 translate-y-0' : isError ? 'opacity-0 translate-y-4' : 'opacity-0 -translate-y-4'
      }`}
    >
      <div 
        className={`flex items-center justify-between px-4 py-1 rounded-lg 
                  ${getTypeStyles()} glass-notification scanlines
                  shadow-xl min-w-[300px] max-w-[600px]
                  ${isError ? 'h-auto min-h-10 py-2 border border-red-500/3' : 'h-10 border border-green-500/3'}
                  transition-all duration-300`}
      >
        <div 
          ref={messageRef}
          onClick={handleCopyClick}
          className={`flex-1 font-mono text-xs ${isError || message?.includes('[CONSOLE') ? 'whitespace-normal' : 'typing-line overflow-hidden whitespace-nowrap'} cursor-pointer relative`}
          title="Click to copy"
        >
          {showCopyTooltip && (
            <div className="absolute -top-6 left-0 bg-black/80 text-green-300 text-xs px-2 py-0.5 rounded pointer-events-none z-10">
              {isCopied ? "Copied!" : "Click again to copy"}
            </div>
          )}
          
          {message?.includes('[CONSOLE ERROR]') ? (
            <div>
              <span className="shadow-glow-sm text-red-300">{message.replace('[CONSOLE ERROR]', '')}</span>
              <span className="block mt-1 text-2xs opacity-70 flex items-center">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5 shadow-glow-sm shadow-red-500/40 debug-indicator"></span>
                ERROR LOG // {new Date().toLocaleTimeString()}
              </span>
            </div>
          ) : message?.includes('[CONSOLE WARNING]') ? (
            <div>
              <span className="shadow-glow-sm text-yellow-200">{message.replace('[CONSOLE WARNING]', '')}</span>
              <span className="block mt-1 text-2xs opacity-70 flex items-center">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-yellow-500 mr-1.5 shadow-glow-sm shadow-yellow-500/40 debug-indicator"></span>
                WARNING LOG // {new Date().toLocaleTimeString()}
              </span>
            </div>
          ) : (
            message || (isError ? 'Error' : 'Debug information')
          )}
        </div>
        <button 
          onClick={handleClose}
          className="text-xs ml-4 cursor-pointer opacity-60 hover:opacity-100 transition-all w-5 h-5 flex items-center justify-center rounded-full hover:bg-green-900/10 font-bold"
          title="Dismiss notification"
        >
          ×
        </button>
      </div>
    </div>
  );
}

export default ErrorProvider;