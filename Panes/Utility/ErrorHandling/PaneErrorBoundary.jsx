import React from 'react';
import { useError } from '../../../Error-Handling/Diagnostics/ErrorNotificationSystem.jsx';
import { ErrorType, ErrorSeverity } from '../../../Error-Handling/Diagnostics/types/errorTypes';

/**
 * Error Boundary component for Pane components
 * Catches errors in child components to prevent entire dashboard from crashing
 */
class PaneErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null
    };
  }
  
  /**
   * Update state when an error occurs
   * @param {Error} error - The error that was thrown
   */
  static getDerivedStateFromError(error) {
    return { 
      hasError: true, 
      error 
    };
  }
  
  /**
   * Lifecycle method called when an error is caught
   * @param {Error} error - The error that was thrown
   * @param {Object} errorInfo - React component stack information
   */
  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    
    // Log the error to console with component stack
    console.error(`Error in pane component: ${error.message}`, {
      componentStack: errorInfo.componentStack,
      error
    });
    
    // Extract more useful information from the error and component stack
    const componentMatch = errorInfo.componentStack?.match(/\s+at\s+([A-Za-z0-9_$]+)/);
    const failedComponent = componentMatch ? componentMatch[1] : 'Unknown';
    
    // Try to get module type from props or error message
    const moduleType = 
      this.props.moduleType ||
      (typeof error === 'object' && error.moduleType) ||
      'unknown';
    
    // Use error notification system if available
    if (this.props.showError) {
      this.props.showError(
        `Pane Error in ${this.props.paneName || failedComponent}: ${error.message}`,
        ErrorType.UI,
        ErrorSeverity.MEDIUM,
        {
          componentName: this.props.paneName || 'UnknownPane',
          failedComponent,
          location: 'Dashboard Grid',
          action: 'renderComponent',
          moduleType, 
          metadata: {
            componentStack: errorInfo.componentStack,
            errorMessage: error.message,
            errorStack: error.stack,
            props: Object.keys(this.props).filter(key => 
              typeof this.props[key] !== 'function' && 
              key !== 'children'
            ).reduce((obj, key) => {
              try {
                if (typeof this.props[key] === 'object') {
                  obj[key] = JSON.stringify(this.props[key]);
                } else {
                  obj[key] = this.props[key];
                }
              } catch (e) {
                obj[key] = '[Unstringifiable]';
              }
              return obj;
            }, {})
          }
        }
      );
    }
  }
  
  render() {
    // If an error occurred, render fallback UI
    if (this.state.hasError) {
      // Extract the module type for contextual styling
      const moduleType = this.props.moduleType || 'unknown';
      const errorMessage = this.state.error?.message || 'Unknown error';
      const errorStack = this.state.errorInfo?.componentStack || 'No stack trace available';
      const errorKey = `${this.props.paneName || 'unknown'}-${Date.now()}`;
      
      // Try to determine if this is a component loading error
      const isLoadingError = 
        errorMessage.includes("Cannot read properties") || 
        errorMessage.includes("is not a function") ||
        errorMessage.includes("is not defined") ||
        errorMessage.includes("Failed to load") ||
        errorMessage.includes("Cannot find module");
        
      return (
        <div className="error-pane p-4 border-2 border-red-500 rounded bg-black/40 h-full flex flex-col" data-error-key={errorKey}>
          <div className="flex items-center mb-2">
            <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <h3 className="text-lg font-medium text-red-500">Component Error</h3>
          </div>
          
          <div className="mb-3 text-gray-200">
            {this.props.paneName && (
              <p><strong>Pane:</strong> {this.props.paneName}</p>
            )}
            {moduleType !== 'unknown' && (
              <p><strong>Type:</strong> {moduleType}</p>
            )}
            <p><strong>Error:</strong> {errorMessage}</p>
            {isLoadingError && (
              <p className="text-yellow-400 mt-2">
                <strong>Diagnosis:</strong> This appears to be a component loading error.
                The module might be missing or have a different export format than expected.
              </p>
            )}
          </div>
          
          <div className="text-xs mt-2 flex-grow">
            <details className="text-gray-400">
              <summary className="cursor-pointer hover:text-gray-200">View details</summary>
              <pre className="mt-2 whitespace-pre-wrap text-left overflow-auto max-h-40 p-2 bg-black/60 rounded">
                {errorStack}
              </pre>
            </details>
            
            {isLoadingError && (
              <div className="mt-3 p-2 bg-gray-800/50 rounded">
                <details>
                  <summary className="cursor-pointer hover:text-gray-200 text-yellow-400">Troubleshooting Guide</summary>
                  <ul className="mt-2 list-disc list-inside text-gray-300">
                    <li>Check if the component file exists at the expected location</li>
                    <li>Ensure the component exports a default React component</li>
                    <li>Review import/export statements in the component file</li>
                    <li>Check for console errors related to module resolution</li>
                  </ul>
                </details>
              </div>
            )}
          </div>
          
          <div className="mt-auto pt-3 flex justify-between items-center gap-2">
            {this.props.onRetry && (
              <button 
                onClick={this.props.onRetry}
                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-500 flex items-center"
              >
                <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" />
                </svg>
                Retry Component
              </button>
            )}
            {/* Removed fallback component button */}
            <button 
              onClick={() => window.location.reload()}
              className="px-3 py-1 bg-transparent border border-gray-500 text-gray-300 text-sm rounded hover:bg-gray-800"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }
    
    // If no error, render children normally
    return this.props.children;
  }
}

/**
 * Higher-order component to inject useError hook into class component
 */
export default function PaneErrorBoundaryWithHooks(props) {
  const { showError } = useError();
  return <PaneErrorBoundary {...props} showError={showError} />;
}
