import { useState, useEffect } from 'react'
import ErrorDialog from '../../Error-Handling/ErrorDialog'
import { useSocket } from './Context/SocketContext'

export default function PaneHeaderStatus({ status: initialStatus, name }) {
  const [currentStatus, setCurrentStatus] = useState(initialStatus || 'UNKNOWN')
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false)
  const { errorLogs } = useSocket()
  
  // Retrieve the service key name (lowercase) for logging
  const getServiceKey = () => {
    // Check if name is a string before calling toLowerCase()
    const key = (name && typeof name === 'string') ? name.toLowerCase() : 'unknown';
    if (key === 'postgresql') return 'postgres';
    if (key === 'nvidia gpu') return 'nvidia';
    return key;
  }
  
  // Check if this service has errors
  const serviceKey = getServiceKey();
  const hasErrorLogs = errorLogs && errorLogs[serviceKey] && errorLogs[serviceKey].length > 0;
  
  // Add useEffect to update the status when props change
  useEffect(() => {
    if (initialStatus !== currentStatus) {
      setIsTransitioning(true)
      setCurrentStatus(initialStatus || 'UNKNOWN')
      
      // Extract error message if present in the status string
      const errorMatch = (initialStatus || '').match(/error:?\s*(.*)/i)
      if (errorMatch && errorMatch[1]) {
        setErrorMessage(errorMatch[1].trim())
      } else if ((initialStatus || '').toLowerCase().includes('error')) {
        setErrorMessage('Service reported an error')
      } else {
        setErrorMessage('')
      }
      
      const timer = setTimeout(() => {
        setIsTransitioning(false)
      }, 1000)
      
      return () => clearTimeout(timer)
    }
  }, [initialStatus, currentStatus])

  // Map any unknown status to a format we can handle
  const normalizeStatus = (status) => {
    // Ensure status is a string, if not return 'UNKNOWN'
    if (typeof status !== 'string' && status !== null && status !== undefined) {
      console.warn('Received non-string status:', status);
      return 'UNKNOWN';
    }
    
    // Convert status to uppercase for consistency - safely
    const upperStatus = (status || '').toString().toUpperCase()
    
    // Check for error condition first
    if (upperStatus.includes('ERROR') || upperStatus.includes('FAIL') || upperStatus.includes('EXCEPTION')) {
      return 'ERROR'
    }
    
    // Map common status strings to our known statuses
    if (upperStatus.includes('RUNNING') || upperStatus === 'OK' || upperStatus === 'ACTIVE') {
      return 'RUNNING'
    } else if (upperStatus.includes('START') || upperStatus.includes('LOADING') || upperStatus.includes('INIT')) {
      return 'STARTING'
    } else if (upperStatus.includes('STOP') || upperStatus.includes('DOWN')) {
      return 'STOPPED'
    }
    
    return upperStatus || 'UNKNOWN'
  }

  const normalizedStatus = normalizeStatus(currentStatus)
  const hasError = normalizedStatus === 'ERROR' || !!errorMessage

  // Status display styles
  const getStatusStyles = () => {
    const baseStyles = 'flex items-center space-x-1 px-2 py-0.5 rounded transition-all duration-300'
    
    switch (normalizedStatus) {
      case 'RUNNING':
        return `${baseStyles} bg-green-500/20 text-green-400`
      case 'STARTING':
        return `${baseStyles} bg-yellow-500/20 text-yellow-400`
      case 'STOPPED':
        return `${baseStyles} bg-red-500/20 text-red-400`
      case 'ERROR':
        return `${baseStyles} bg-red-500/30 text-red-400`
      default:
        // Changed from gray to red for UNKNOWN status
        return `${baseStyles} bg-red-500/20 text-red-400`
    }
  }

  const getStatusIcon = () => {
    switch (normalizedStatus) {
      case 'RUNNING':
        return (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        )
      case 'STARTING':
        return (
          <svg className="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        )
      case 'STOPPED':
        return (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        )
      case 'ERROR':
        return (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      default:
        return (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
    }
  }

  // Get display text based on status
  const getStatusText = () => {
    if (hasError) {
      return "Threw an error"
    }
    return normalizedStatus
  }

  // Tooltip for more details (error message)
  const renderTooltip = () => {
    if (!errorMessage) return null;
    
    return (
      <div className="absolute bottom-full left-0 mb-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
        <div className="bg-gray-900 text-white text-xs p-2 rounded shadow-lg max-w-xs whitespace-normal">
          <p className="font-bold mb-1">Error Detail:</p>
          <p>{errorMessage}</p>
        </div>
      </div>
    )
  }

  // Add a continuous pulse animation for RUNNING status
  const getStatusTextClass = () => {
    if (isTransitioning) return 'animate-pulse';
    
    // Add continuous pulse for RUNNING status
    if (normalizedStatus === 'RUNNING') return 'animate-pulse-slow';
    
    return '';
  };

  return (
    <div className="relative group flex items-center mr-2">
      <div className={getStatusStyles()}>
        <span>{getStatusIcon()}</span>
        <span className={getStatusTextClass()}>
          {getStatusText()}
        </span>
      </div>
      {renderTooltip()}
      
      {/* Error icon - only shown when there are error logs */}
      {hasErrorLogs && (
        <button 
          onClick={() => setIsErrorDialogOpen(true)}
          onMouseDown={(e) => e.stopPropagation()} // Prevent drag behavior when clicking
          className="ml-2 text-red-500 hover:text-red-300 transition-colors pulse-alert"
          title="View error logs"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" 
               className="w-4 h-4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
        </button>
      )}
      
      {/* Error dialog */}
      <ErrorDialog
        isOpen={isErrorDialogOpen}
        onClose={() => setIsErrorDialogOpen(false)}
        paneName={name && typeof name === 'string' ? name : 'Unknown'}
        errors={errorLogs && serviceKey && errorLogs[serviceKey] ? errorLogs[serviceKey] : ''}
      />
    </div>
  )
}