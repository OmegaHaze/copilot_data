/**
 * Error Handler Utility
 * 
 * This module provides error handling functions for non-React components
 * that cannot directly use the useError hook. It uses a module pattern
 * to provide a consistent interface while allowing the implementation
 * to be updated when the React context is available.
 */
import { ErrorType, ErrorSeverity } from '../Diagnostics/types/errorTypes';

// Default implementation that logs to console
let showErrorFn = (message, type = ErrorType.SYSTEM, priority = ErrorSeverity.MEDIUM, context = {}) => {
  console.error(`[${type.toUpperCase()}][${priority}] ${message}`, context);
  return null;
};

let hideErrorFn = (id) => {
  // Noop until initialized
};

let clearErrorsFn = () => {
  // Noop until initialized
};

let clearAllErrorsFn = () => {
  // Noop until initialized
};

/**
 * Update the error handler implementation with real functions
 * from the error system.
 * 
 * @param {Object} errorHandlers Object containing error handling functions
 * @param {Function} errorHandlers.showError Function to show an error
 * @param {Function} errorHandlers.hideError Function to hide an error
 * @param {Function} errorHandlers.clearErrors Function to clear active errors
 * @param {Function} errorHandlers.clearAllErrors Function to clear all errors including cache
 */
export const initializeErrorHandler = (errorHandlers) => {
  if (errorHandlers?.showError) {
    showErrorFn = errorHandlers.showError;
  }
  
  if (errorHandlers?.hideError) {
    hideErrorFn = errorHandlers.hideError;
  }
  
  if (errorHandlers?.clearErrors) {
    clearErrorsFn = errorHandlers.clearErrors;
  }
  
  if (errorHandlers?.clearAllErrors) {
    clearAllErrorsFn = errorHandlers.clearAllErrors;
  }
  
  console.log('Error handler initialized for non-React components');
};

/**
 * Standardized error handler object that can be used in non-React code
 */
export const errorHandler = {
  /**
   * Show an error message
   * @param {string} message Error message text
   * @param {string} type Error type from ErrorType
   * @param {string} priority Error priority from ErrorSeverity
   * @param {Object} [context] Additional context information
   * @param {string} [context.componentName] Name of the component that generated the error
   * @param {string} [context.location] Where in the application the error occurred
   * @param {string} [context.action] What action was being performed when the error occurred
   * @param {Object} [context.metadata] Additional contextual information
   * @returns {string|null} Error ID if successful
   */
  showError: (message, type = ErrorType.SYSTEM, priority = ErrorSeverity.MEDIUM, context = {}) => {
    return showErrorFn(message, type, priority, context);
  },
  
  /**
   * Hide a specific error by ID
   * @param {string} id Error ID to hide
   */
  hideError: (id) => {
    hideErrorFn(id);
  },
  
  /**
   * Clear active errors but preserve cached errors
   */
  clearErrors: () => {
    clearErrorsFn();
  },
  
  /**
   * Clear all errors including cached errors
   */
  clearAllErrors: () => {
    clearAllErrorsFn();
  }
};
