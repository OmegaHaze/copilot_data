import React, { useState } from 'react';
import { errorHandler } from '../utils/errorHandler';
import { ErrorType, ErrorSeverity } from '../Diagnostics/types/errorTypes';

/**
 * Test component for the error handling system
 * This component provides a simple UI to test various error types and severities
 */
const ErrorSystemTest = () => {
  const [message, setMessage] = useState('Test error message');
  const [errorType, setErrorType] = useState(ErrorType.SYSTEM);
  const [severity, setSeverity] = useState(ErrorSeverity.MEDIUM);
  
  const triggerError = () => {
    errorHandler.showError(
      message,
      errorType,
      severity,
      {
        componentName: 'ErrorSystemTest',
        action: 'test',
        location: 'Test Component',
        metadata: {
          timestamp: new Date().toISOString(),
          source: 'test'
        }
      }
    );
  };
  
  const testConsoleWarning = () => {
    console.warn('[WARNING] Test console warning message');
  };
  
  const testConsoleError = () => {
    console.error('[ERROR] Test console error message');
  };
  
  const testConsoleInfo = () => {
    console.log('[INFO] Test console info message');
  };
  
  const testVerticalLayout = () => {
    // Show one of each severity to test vertical layout
    // HIGH severity - Critical row
    errorHandler.showError(
      'Critical system error - testing vertical layout',
      ErrorType.SYSTEM,
      ErrorSeverity.HIGH,
      { componentName: 'ErrorSystemTest', action: 'testVerticalLayout' }
    );
    
    // MEDIUM severity - Warning row
    setTimeout(() => {
      errorHandler.showError(
        'Medium severity warning - testing vertical layout',
        ErrorType.WARNING,
        ErrorSeverity.MEDIUM,
        { componentName: 'ErrorSystemTest', action: 'testVerticalLayout' }
      );
    }, 300);
    
    // LOW severity - Info row
    setTimeout(() => {
      errorHandler.showError(
        'Low severity info message - testing vertical layout',
        ErrorType.INFO,
        ErrorSeverity.LOW,
        { componentName: 'ErrorSystemTest', action: 'testVerticalLayout' }
      );
    }, 600);
  };
  
  const testSpecificErrors = () => {
    // Test system error
    errorHandler.showError(
      'Critical system configuration error',
      ErrorType.SYSTEM,
      ErrorSeverity.HIGH
    );
    
    // Test API error
    setTimeout(() => {
      errorHandler.showError(
        'Failed to fetch data from API endpoint',
        ErrorType.API,
        ErrorSeverity.MEDIUM
      );
    }, 1000);
    
    // Test UI warning
    setTimeout(() => {
      errorHandler.showError(
        'Component rendered with missing props',
        ErrorType.UI,
        ErrorSeverity.LOW
      );
    }, 2000);
    
    // Test socket error
    setTimeout(() => {
      errorHandler.showError(
        'Socket connection lost',
        ErrorType.SOCKET,
        ErrorSeverity.MEDIUM
      );
    }, 3000);
    
    // Test success message
    setTimeout(() => {
      errorHandler.showError(
        'Operation completed successfully',
        ErrorType.SUCCESS,
        ErrorSeverity.LOW
      );
    }, 4000);
  };

  return (
    <div className="p-4 border border-gray-700 rounded-lg my-4">
      <h2 className="text-xl font-bold mb-4">Error System Test Panel</h2>
      
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block mb-1">Error Message</label>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full p-2 border border-gray-600 bg-gray-800 rounded"
            />
          </div>
          
          <div>
            <label className="block mb-1">Error Type</label>
            <select
              value={errorType}
              onChange={(e) => setErrorType(e.target.value)}
              className="w-full p-2 border border-gray-600 bg-gray-800 rounded"
            >
              {Object.entries(ErrorType).map(([key, value]) => (
                <option key={key} value={value}>{key}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block mb-1">Error Severity</label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              className="w-full p-2 border border-gray-600 bg-gray-800 rounded"
            >
              {Object.entries(ErrorSeverity).map(([key, value]) => (
                <option key={key} value={value}>{key}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          <button
            onClick={triggerError}
            className="p-2 bg-blue-600 hover:bg-blue-700 rounded"
          >
            Show Custom Error
          </button>
          
          <button
            onClick={testSpecificErrors}
            className="p-2 bg-purple-600 hover:bg-purple-700 rounded"
          >
            Test All Error Types
          </button>
          
          <button
            onClick={testVerticalLayout}
            className="p-2 bg-pink-600 hover:bg-pink-700 rounded"
          >
            Test Vertical Layout
          </button>
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          <button
            onClick={testConsoleWarning}
            className="p-2 bg-yellow-600 hover:bg-yellow-700 rounded"
          >
            Test Console Warning
          </button>
          
          <button
            onClick={testConsoleError}
            className="p-2 bg-red-600 hover:bg-red-700 rounded"
          >
            Test Console Error
          </button>
          
          <button
            onClick={testConsoleInfo}
            className="p-2 bg-green-600 hover:bg-green-700 rounded"
          >
            Test Console Info
          </button>
        </div>
      </div>
      
      <div className="mt-4">
        <p className="text-sm text-gray-400">
          Use this panel to test the error notification system with various message types and severities.
          The console warning/error tests verify that console messages are properly captured by the error system.
        </p>
      </div>
    </div>
  );
};

export default ErrorSystemTest;
