// ErrorNotificationSystem.jsx
import React, { useState, useEffect, createContext, useContext } from 'react';
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
  
  // Get theme styling based on type
  const getTypeStyles = () => {
    switch(type) {
      case 'error':
        return 'bg-red-900/40 border-red-600 text-red-300';
      case 'warning':
        return 'bg-yellow-900/40 border-yellow-600 text-yellow-300';
      case 'success':
        return 'bg-green-900/40 border-green-600 text-green-300';
      case 'info':
      default:
        return 'bg-green-900/40 border-green-600 text-green-300';
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
        className={`flex items-center justify-between px-4 py-1 rounded 
                  ${getTypeStyles()} border scanlines 
                  shadow-lg crt-glow min-w-[300px] max-w-[600px]
                  ${isError ? 'flash-flicker h-auto min-h-10 py-2' : 'h-10'}`}
      >
        <div className={`flex-1 font-mono text-xs ${isError ? 'whitespace-normal' : 'typing-line overflow-hidden whitespace-nowrap'}`}>
          {message || (isError ? 'Error' : 'Debug information')}
        </div>
        <button 
          onClick={handleClose}
          className="text-xs ml-4 hover-cursor opacity-70 hover:opacity-100 crt-text2"
        >
          ×
        </button>
      </div>
    </div>
  );
}

export default ErrorProvider;