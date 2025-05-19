/**
 * Error Type System for VAIO Board
 * 
 * This module defines a comprehensive classification system for all diagnostic,
 * warning, and error messages across the application, with standardized styling
 * and behavior for each type.
 * 
 * IMPORTANT: This system focuses specifically on errors and diagnostic notifications.
 * For general UI notifications (success messages, alerts), use a separate UI notification system.
 */

/**
 * Message Types
 * 
 * Each type represents a different category of error or notification in the system
 * Used for both visual styling and handling behavior
 */
export const ErrorType = {
  /**
   * System/configuration errors
   * Examples: Application startup issues, invalid config, missing dependencies
   * Severity: Typically HIGH - Often user blocking
   */
  SYSTEM: 'system',
  
  /**
   * User interface errors
   * Examples: Component rendering issues, state management problems
   * Severity: Typically MEDIUM - May affect user experience but not block usage
   */
  UI: 'ui',
  
  /**
   * Network/API request errors
   * Examples: Failed HTTP requests, invalid response formats
   * Severity: Typically MEDIUM - Could prevent data retrieval but not block UI
   */
  API: 'api',
  
  /**
   * WebSocket connection errors
   * Examples: Socket disconnects, message parsing errors
   * Severity: Typically MEDIUM to LOW - May affect real-time updates
   */
  SOCKET: 'socket',
  
  /**
   * Session management errors
   * Examples: Authentication issues, session timeouts
   * Severity: Typically MEDIUM to HIGH - May prevent user actions
   */
  SESSION: 'session',
  
  /**
   * Warning messages (non-critical issues)
   * Examples: Deprecation warnings, performance issues, minor problems
   * Severity: Typically MEDIUM to LOW - Informational but worth attention
   */
  WARNING: 'warning',
  
  /**
   * Console warnings that are captured and displayed
   * Examples: Caught console.warn() calls from libraries or app code
   * Severity: Typically MEDIUM to LOW - Developer-focused warnings
   */
  CONSOLE_WARNING: 'console_warning',
  
  /**
   * Console errors that are captured and displayed
   * Examples: Caught console.error() calls from libraries or app code
   * Severity: Typically MEDIUM - Developer-focused errors
   */
  CONSOLE_ERROR: 'console_error',
  
  /**
   * Debug messages (not actual errors)
   * Examples: Runtime diagnostics, performance metrics
   * Severity: Typically LOW - Purely informational
   */
  DEBUG: 'debug',
  
  /**
   * Success messages for operations that completed successfully
   * Examples: API calls that succeeded, operations completed
   * Severity: Typically LOW - Informational, positive outcomes
   */
  SUCCESS: 'success',
  
  /**
   * Informational messages that aren't errors or warnings
   * Examples: System status updates, user action confirmations
   * Severity: Typically LOW - Contextual information
   */
  INFO: 'info'
}

/**
 * Error Severity Levels
 * 
 * Determines the impact of a notification and how it should be presented
 */
export const ErrorSeverity = {
  /**
   * High severity - User blocking issues
   * Requires immediate attention, potentially prevents system usage
   */
  HIGH: 'high',
  
  /**
   * Medium severity - User affecting issues
   * Degrades experience but doesn't prevent core functionality
   */
  MEDIUM: 'medium',
  
  /**
   * Low severity - Minor issues
   * Mostly informational, minimal impact on user experience
   */
  LOW: 'low'
}

/**
 * Alternative source classification for errors
 * 
 * Used for more specific error categorization when needed
 */
export const MessageSource = {
  /**
   * System/configuration messages
   * Examples: Application startup, configuration issues
   */
  SYSTEM: 'system',
  
  /**
   * User interface messages
   * Examples: Component rendering, state management
   */
  UI: 'ui',
  
  /**
   * Network/API messages
   * Examples: HTTP requests, API responses
   */
  API: 'api',
  
  /**
   * WebSocket connection messages
   * Examples: Socket events, real-time updates
   */
  SOCKET: 'socket',
  
  /**
   * Session management messages
   * Examples: Authentication, user permissions
   */
  SESSION: 'session',
  
  /**
   * Module-specific messages
   * Examples: Module loading, module-specific operations
   */
  MODULE: 'module',
  
  /**
   * Console output (intercepted)
   * Examples: console.log, console.error, console.warn
   */
  CONSOLE: 'console',
}

/**
 * Helper function to get the appropriate severity based on error type
 * @param {string} type - Error type from ErrorType
 * @returns {string} - Default severity for the error type
 */
export function getDefaultSeverityForType(type) {
  switch (type) {
    case ErrorType.SYSTEM:
      return ErrorSeverity.HIGH;
    case ErrorType.SESSION:
      return ErrorSeverity.HIGH;
    case ErrorType.API:
    case ErrorType.SOCKET:
    case ErrorType.UI:
    case ErrorType.CONSOLE_ERROR:
      return ErrorSeverity.MEDIUM;
    case ErrorType.WARNING:
    case ErrorType.CONSOLE_WARNING:
      return ErrorSeverity.MEDIUM;
    case ErrorType.DEBUG:
    case ErrorType.INFO:
    case ErrorType.SUCCESS:
      return ErrorSeverity.LOW;
    default:
      return ErrorSeverity.MEDIUM;
  }
}

/**
 * Maps error types to CSS classes for styling
 */
export const errorTypeStyles = {
  [ErrorType.SYSTEM]: 'border-opacity-70 text-red-200 border-red-500 border-l-4 glass-error-error',
  [ErrorType.UI]: 'border-opacity-70 text-yellow-200 border-yellow-500 border-l-4 glass-error-warning',
  [ErrorType.API]: 'border-opacity-70 text-purple-200 border-purple-500 border-l-4 glass-error',
  [ErrorType.SOCKET]: 'border-opacity-70 text-blue-200 border-blue-500 border-l-4 glass-error',
  [ErrorType.SESSION]: 'border-opacity-70 text-yellow-200 border-yellow-500 border-l-4 glass-error-warning',
  [ErrorType.WARNING]: 'border-opacity-70 text-orange-200 border-orange-500 border-l-4 glass-error-warning',
  [ErrorType.CONSOLE_WARNING]: 'border-opacity-70 text-orange-200 border-orange-500 border-l-4 glass-error-warning',
  [ErrorType.CONSOLE_ERROR]: 'border-opacity-70 text-red-200 border-red-500 border-l-4 glass-error-error',
  [ErrorType.DEBUG]: 'border-opacity-70 text-gray-200 border-gray-500 border-l-4 glass-error',
  [ErrorType.SUCCESS]: 'border-opacity-70 text-green-200 border-green-500 border-l-4 glass-error-success',
  [ErrorType.INFO]: 'border-opacity-70 text-blue-200 border-blue-500 border-l-4 glass-error-info',
  // Default for any other error type
  default: 'border-red-600/30 text-red-300 glass-error'
};

/**
 * Action types available for error notifications
 * 
 * Defines possible interactive elements in error notifications
 */
export const ErrorAction = {
  DISMISS: 'dismiss',     // Close the notification
  RETRY: 'retry',         // Retry the failed operation
  VIEW: 'view',           // View related details
  SETTINGS: 'settings',   // Open relevant settings
  DOCS: 'docs',           // Open documentation
  CUSTOM: 'custom'        // Custom action with callback
};

/**
 * Determine if an error notification should be auto-dismissed
 * @param {string} severity - Severity from ErrorSeverity
 * @returns {boolean} - Whether notification should auto-dismiss
 */
export function shouldAutoDismiss(severity) {
  return severity !== ErrorSeverity.HIGH;
}

/**
 * Get the auto-dismiss timeout for an error notification based on severity
 * @param {string} severity - Severity from ErrorSeverity
 * @returns {number} - Timeout in milliseconds before auto-dismissal (0 for no auto-dismiss)
 */
export function getAutoDismissTimeout(severity) {
  switch (severity) {
    case ErrorSeverity.HIGH:
      return 0; // No auto-dismiss for high severity
    case ErrorSeverity.MEDIUM:
      return 10000; // 10 seconds
    case ErrorSeverity.LOW:
      return 7000; // 7 seconds
    default:
      return 5000; // Default 5 seconds
  }
}

/**
 * Parse a console message to extract error information
 * @param {string} message - The console message
 * @param {string} consoleMethod - The console method used ('error', 'warn', 'log')
 * @returns {Object} - Error properties { type, severity }
 */
export function parseConsoleMessage(message, consoleMethod = 'log') {
  let type = ErrorType.INFO;
  let severity = ErrorSeverity.LOW;
  
  // Determine type based on console method
  switch (consoleMethod) {
    case 'error':
      type = ErrorType.CONSOLE_ERROR;
      severity = ErrorSeverity.MEDIUM;
      break;
    case 'warn':
      type = ErrorType.CONSOLE_WARNING;
      severity = ErrorSeverity.MEDIUM;
      break;
    default:
      type = ErrorType.INFO;
      severity = ErrorSeverity.LOW;
  }
  
  // Check for specific patterns in the message to refine categorization
  if (typeof message === 'string') {
    if (message.includes('[ERROR]') || message.includes('❌')) {
      type = ErrorType.CONSOLE_ERROR;
      severity = ErrorSeverity.MEDIUM;
    } else if (message.includes('[WARNING]') || message.includes('[WARN]') || message.includes('⚠️')) {
      type = ErrorType.CONSOLE_WARNING;
      severity = ErrorSeverity.MEDIUM;
    } else if (message.includes('[SUCCESS]') || message.includes('✅')) {
      type = ErrorType.SUCCESS;
      severity = ErrorSeverity.LOW;
    } else if (message.includes('[INFO]') || message.includes('ℹ️')) {
      type = ErrorType.INFO;
      severity = ErrorSeverity.LOW;
    } else if (message.includes('[DEBUG]') || message.includes('🔍')) {
      type = ErrorType.DEBUG;
      severity = ErrorSeverity.LOW;
    }
  }

  return { type, severity };
}

/**
 * Additional source-based styling accents
 */
export const sourceStyles = {
  [MessageSource.SYSTEM]: {
    accent: 'border-t-red-400',
  },
  [MessageSource.SESSION]: {
    accent: 'border-t-amber-400',
  },
  [MessageSource.API]: {
    accent: 'border-t-purple-400',
  },
  [MessageSource.SOCKET]: {
    accent: 'border-t-blue-400',
  },
  [MessageSource.UI]: {
    accent: 'border-t-orange-400',
  },
  [MessageSource.MODULE]: {
    accent: 'border-t-cyan-400',
  },
  [MessageSource.CONSOLE]: {
    accent: 'border-t-gray-400',
  }
};

/**
 * Create a standardized error notification object
 * @param {string} message - The notification message
 * @param {Object} options - Notification options
 * @returns {Object} - Standardized notification object
 */
export function createErrorNotification(message, options = {}) {
  const {
    type = ErrorType.SYSTEM,
    severity = null,
    context = {},
    actions = [],
    id = Date.now().toString(),
    timestamp = Date.now(),
  } = options;
  
  // Determine appropriate severity if not specified
  const errorSeverity = severity || getDefaultSeverityForType(type);
  
  // Process context object to ensure word wrapping in UI
  const processedContext = {};
  if (context) {
    Object.entries(context).forEach(([key, value]) => {
      if (typeof value === 'object' && value !== null) {
        try {
          // Format objects with line breaks for better readability
          processedContext[key] = JSON.stringify(value, null, 2);
        } catch (e) {
          processedContext[key] = String(value);
        }
      } else {
        processedContext[key] = value;
      }
    });
  }
  
  return {
    id,
    message,
    type,
    priority: errorSeverity, // Using priority for backwards compatibility
    context: processedContext,
    actions,
    timestamp,
    autoDismiss: shouldAutoDismiss(errorSeverity),
    dismissTimeout: getAutoDismissTimeout(errorSeverity)
  };
}

/**
 * For backward compatibility with older notification system
 */
export const NotificationType = {
  ERROR: 'error',
  WARNING: 'warning',
  SUCCESS: 'success',
  INFO: 'info',
  DEBUG: 'debug',
}

/**
 * For backward compatibility with older priority system
 */
export const NotificationPriority = {
  CRITICAL: 'critical',
  HIGH: ErrorSeverity.HIGH,
  MEDIUM: ErrorSeverity.MEDIUM,
  LOW: ErrorSeverity.LOW,
  MINIMAL: 'minimal'
}
