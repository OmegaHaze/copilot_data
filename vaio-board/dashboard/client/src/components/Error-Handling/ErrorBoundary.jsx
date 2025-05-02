import React from 'react';
import { useErrorSystem } from './ErrorNotificationSystem.jsx';

class ErrorBoundaryInner extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error
    console.error(`🔍 ERROR BOUNDARY CAUGHT ERROR in ${this.props.componentName || 'unknown component'}:`, error);
    console.error('Component stack:', errorInfo.componentStack);
    
    // Set error info in state
    this.setState({ errorInfo });
    
    // Call error handler from props if available
    if (this.props.onError) {
      this.props.onError(error, errorInfo, this.props.componentName);
    }
  }

  render() {
    if (this.state.hasError) {
      // Custom hard error UI without fallback mechanism
      return (
        <div className="p-3 border border-red-500 bg-black/70 rounded">
          <h3 className="text-red-400 font-bold">Component Error: {this.props.componentName || 'Unknown'}</h3>
          <p className="text-red-300 text-xs mt-1">
            Error: {this.state.error?.message || 'Unknown error'}
          </p>
          {this.props.showStack && (
            <pre className="mt-2 text-xs text-red-200 p-2 bg-black/50 max-h-40 overflow-y-auto">
              {this.state.errorInfo?.componentStack || 'No stack available'}
            </pre>
          )}
        </div>
      );
    }

    // No error, render children normally
    return this.props.children;
  }
}

// Wrapper to access context
export default function ErrorBoundary(props) {
  const errorSystem = useErrorSystem();
  
  // Handler to show error in notification system
  const handleError = (error, errorInfo, componentName) => {
    if (errorSystem && errorSystem.showError) {
      errorSystem.showError(
        `Error in ${componentName || 'component'}: ${error.message || 'Unknown error'}`,
        'error',
        0 // Don't auto-dismiss
      );
    }
  };
  
  return <ErrorBoundaryInner {...props} onError={handleError} />;
}