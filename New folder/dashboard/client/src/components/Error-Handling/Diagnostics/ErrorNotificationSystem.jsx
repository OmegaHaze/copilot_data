import { createContext, useContext, useCallback, useEffect, useState, useMemo } from 'react'
import { useErrorStore } from './stores/ErrorStore'
import { initializeErrorHandler } from '../utils/errorHandler'
import { 
  ErrorType, 
  ErrorSeverity, 
  errorTypeStyles,
  shouldAutoDismiss,
  getAutoDismissTimeout
} from './types/errorTypes'
import mitt from 'mitt'
// Error indicator styles are now in theme.css

// Create event emitter for error events
const emitter = mitt()

const ErrorContext = createContext(null)

export function ErrorProvider({ children }) {
  const { 
    addError, 
    removeError, 
    clearErrors, 
    clearAllErrors, 
    restoreCachedErrors, 
    clearCache, 
    errors,
    hasCachedErrors // Ensure this is properly exported from ErrorStore
  } = useErrorStore()
  
  const showError = useCallback((message, type = ErrorType.SYSTEM, priority = ErrorSeverity.MEDIUM, context = {}) => {
    addError({
      message,
      type,
      priority,
      context,
      userDismissable: priority !== ErrorSeverity.HIGH
    })

    // Emit error event for logging/analytics
    emitter.emit('error', { message, type, priority, context })
  }, [addError])

  const hideError = useCallback((id, isAutoDismiss = false) => {
    removeError(id, isAutoDismiss)
  }, [removeError])

  const value = {
    showError,
    hideError,
    clearErrors,
    clearAllErrors,
    restoreCachedErrors,
    clearCache
  }
  
  // Initialize the error handler for non-React components
  useEffect(() => {
    initializeErrorHandler(value)
    
    // Cleanup function
    return () => {
      // Clean up any event listeners or handlers if needed
    }
  }, [value])

  return (
    <ErrorContext.Provider value={value}>
      <CacheTriangle hasCachedErrors={hasCachedErrors} restoreCachedErrors={restoreCachedErrors} />
      <ErrorDisplay errors={errors} />
      {children}
    </ErrorContext.Provider>
  )
}

// Define the useError hook before it's used
export function useError() {
  const context = useContext(ErrorContext)
  if (!context) {
    throw new Error('useError must be used within an ErrorProvider')
  }
  return context
}

// CacheTriangle component - completely independent from error notifications
function CacheTriangle({ hasCachedErrors, restoreCachedErrors }) {
  if (!hasCachedErrors) return null;
  
  return (
    // Position fixed to be independent of any other container
    <div 
      className="fixed top-3 left-1/2 transform -translate-x-1/2 pointer-events-auto z-[100] cursor-pointer"
      onClick={restoreCachedErrors}
      title="Restore dismissed notifications"
    >
      <svg 
        className="w-5 h-5 text-red-500/70 error-indicator hover:text-red-500 hover:scale-110 transition-all animate-pulse" 
        viewBox="0 0 24 24" 
        fill="currentColor"
      >
        <path d="M12 2L1 21h22L12 2zm0 4l7.53 13H4.47L12 6zm-1 4v4h2v-4h-2zm0 6v2h2v-2h-2z" />
      </svg>
    </div>
  );
}

function ErrorDisplay({ errors }) {
  const { hideError } = useError()

  // Memoize the sorted errors to prevent unnecessary re-sorting on each render
  const sortedErrors = useMemo(() => {
    if (errors.length === 0) return [];
    return [...errors].sort((a, b) => b.timestamp - a.timestamp);
  }, [errors]);
  
  // If there are no errors to display, don't render the notification container
  if (errors.length === 0) {
    return null;
  }
  
  return (
    <div className="fixed inset-x-0 top-0 pointer-events-none z-50 overflow-hidden">
      <div className="w-full max-w-lg mx-auto px-4 mt-2">
        {/* Simple stack of notifications */}
        {sortedErrors.map((error, index) => (
          <div className="mb-2 w-full" key={error.id}>
            <ErrorNotification 
              error={error}
              onClose={(isAutoDismiss = false) => hideError(error.id, isAutoDismiss)}
              index={index}
              total={sortedErrors.length}
              columnPosition="center"
            />
          </div>
        ))}
      </div>
    </div>
  )
}

function ErrorNotification({ error, onClose, index = 0, total = 1, columnPosition = 'center' }) {
  const [isVisible, setIsVisible] = useState(false);
  const [message, setMessage] = useState(error.message || '');
  
  // Check if error should be dismissable by user
  const dismissable = error.userDismissable !== false;
  
  // Determine if this notification should auto-dismiss based on priority
  const shouldDismiss = shouldAutoDismiss(error.priority);
  const autoDismissTimeout = getAutoDismissTimeout(error.priority);
  
  const context = error.context || {};
  
  // Copy message to clipboard
  const handleCopyClick = async () => {
    try {
      // Clean the message text
      const textToCopy = error.message || '';

      // Copy to clipboard
      await navigator.clipboard.writeText(textToCopy);
      
      // Show success message temporarily
      setMessage("COPIED ✓");
      setTimeout(() => setMessage(error.message || ''), 1000);
      
    } catch (err) {
      console.error("Failed to copy text: ", err);
      setMessage("Copy failed!");
      setTimeout(() => setMessage(error.message || ''), 1000);
    }
  };
  
  // Get theme styling based on type
  const getTypeStyles = () => {
    // Check if error type exists in styles, fallback to default if not
    return (error.type && errorTypeStyles[error.type]) || errorTypeStyles.default;
  };
  
  // Animation entry effect and auto-dismiss
  useEffect(() => {
    // Show the notification after a brief delay
    const showTimer = setTimeout(() => {
      setIsVisible(true);
    }, 10);
    
    // Set up auto-dismiss if applicable
    let dismissTimer;
    if (shouldDismiss && autoDismissTimeout > 0) {
      // Add slight randomization to prevent multiple errors from dismissing at exactly the same time
      // This helps prevent race conditions in state updates
      const randomizedTimeout = autoDismissTimeout + Math.floor(Math.random() * 500);
      
      dismissTimer = setTimeout(() => {
        handleClose(true); // Pass true to indicate auto-dismissal
      }, randomizedTimeout);
    }
    
    // Clean up timers on unmount
    return () => {
      clearTimeout(showTimer);
      if (dismissTimer) clearTimeout(dismissTimer);
    };
  }, [shouldDismiss, autoDismissTimeout]); // Added proper dependencies
  
  // Handle close
  const handleClose = (isAutoDismiss = false) => {
    // Remove notification immediately without waiting for animation
    onClose(isAutoDismiss);
  };
  
  // Calculate stacking position
  const stackPosition = total - index - 1; // Reverse index so newest is on top
  const stackOffset = 0; // Removed stacking offset since we're handling it with component position
  
  // Set position based on column
  let positionClasses;
  switch(columnPosition) {
    case 'left':
      positionClasses = "ml-auto mr-1"; // Align to right side of left column
      break;
    case 'right':
      positionClasses = "mr-auto ml-1"; // Align to left side of right column
      break;
    case 'center':
    default:
      positionClasses = "mx-auto"; // Center in middle column
      break;
  }
  
  return (
    <div
      className={`relative pointer-events-auto shadow-lg ${positionClasses}`}
      style={{
        transform: isVisible 
          ? `translateY(0)` 
          : `translateY(100vh)`, // Start from bottom of viewport
        opacity: isVisible ? 1 : 0, // Start invisible
        transition: 'transform 0.3s ease-out, opacity 0.3s ease-out', // Animation for entry
        transitionDelay: `${index * 80}ms`, // Keep delay for entry animation
        zIndex: 100 - stackPosition, // Ensure newer items are on top
      }}
    >
      <div 
        className={`relative pr-3 pl-5 py-2.5 rounded-md glass-error backdrop-blur-sm bg-gray-900/95 cursor-pointer transition-colors duration-200 text-sm
          ${message === "COPIED ✓" ? 'border-green-500/50 text-green-300' : getTypeStyles()} 
          flex items-start justify-between gap-3 min-w-[300px] max-w-full mt-0.5 mb-0.5
        `}
        onClick={handleCopyClick}
        style={{
          marginTop: `-${stackOffset}px`, // Create slight overlap
        }}
      >
        <div className="flex-1 mr-6 break-words">
          {message}
          
          {context.componentName && (
            <div className="text-xs mt-1 opacity-75">Component: {context.componentName}</div>
          )}
          {context.location && (
            <div className="text-xs opacity-75">Location: {context.location}</div>
          )}
          {context.action && (
            <div className="text-xs opacity-75">Action: {context.action}</div>
          )}
          
          {context.metadata && (
            <details className="mt-2 text-xs">
              <summary className="cursor-pointer">Additional Details</summary>
              <div className="mt-1 bg-black bg-opacity-25 p-2 rounded max-h-32 overflow-y-auto">
                {Object.entries(context.metadata).map(([key, value]) => (
                  <div key={key} className="mb-1">
                    <span className="text-gray-400">{key}:</span> 
                    <span className="break-all ml-1">
                      {typeof value === 'object' 
                        ? JSON.stringify(value) 
                        : String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
        
        {/* Close button */}
        {dismissable && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleClose();
            }}
            className="absolute right-2 top-1.5 opacity-60 hover:opacity-100 transition-opacity"
            aria-label="Close notification"
          >
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}