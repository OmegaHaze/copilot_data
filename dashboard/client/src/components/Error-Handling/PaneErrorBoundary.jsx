// PaneErrorBoundary.jsx
import React from 'react';
import { useError } from './Diagnostics/ErrorNotificationSystem.jsx';
import ErrorSkull from './ErrorSkull.jsx';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    
    // If onError callback is provided, call it
    if (typeof this.props.onError === 'function') {
      this.props.onError(error, errorInfo);
    }
    
    console.error('Pane Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-container h-full flex flex-col">
          <div className="error-header p-2 text-red-500 font-mono font-bold border-b border-red-700 text-sm bg-red-900/20">
            {this.props.paneName || 'Component'} Error
          </div>
          <div className="error-content p-2 flex-grow flex flex-col overflow-auto text-xs bg-black/90">
            <div className="flex items-center justify-center mb-4">
              <ErrorSkull />
            </div>
            <div className="mb-2 text-yellow-500">{this.state.error && this.state.error.toString()}</div>
            <div className="text-gray-500 whitespace-pre-wrap">
              {this.state.errorInfo && this.state.errorInfo.componentStack}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// This HOC combines the class ErrorBoundary with hooks
const PaneErrorBoundaryWithHooks = (props) => {
  const { showError } = useError();

  const handleError = (error, errorInfo) => {
    if (showError) {
      showError({
        title: `Pane Error: ${props.paneName || 'Unknown Pane'}`,
        message: error.toString(),
        details: errorInfo.componentStack,
        type: 'RENDER_ERROR',
        severity: 'ERROR'
      });
    }
  };

  return (
    <ErrorBoundary {...props} onError={handleError}>
      {props.children}
    </ErrorBoundary>
  );
};

export default PaneErrorBoundaryWithHooks;
