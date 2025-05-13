# Socket Error Handling Guide

**Date:** May 4, 2025

## Overview

This guide covers best practices for handling WebSocket errors in the VAIO Board application. Socket errors are critical to manage properly as they impact real-time communication between components.

## Socket Error Types

Socket errors should use the `SOCKET` error type:

```javascript
import { errorHandler } from '../Error-Handling/utils/errorHandler';
import { ErrorType, ErrorSeverity } from '../Error-Handling/Diagnostics/types/errors';

// Use the SOCKET error type for all socket-related errors
errorHandler.showError(
  "Socket connection failed",
  ErrorType.SOCKET,
  ErrorSeverity.MEDIUM,
  {
    // Context information
    componentName: 'SocketProvider',
    action: 'connect',
    location: 'WebSocket',
    metadata: {
      // Additional error details
    }
  }
);
```

## Common Socket Error Scenarios

### 1. Connection Errors

Connection errors occur when a WebSocket fails to establish a connection:

```javascript
socket.on('connect_error', (error) => {
  errorHandler.showError(
    `Socket connection error: ${error.message || 'Failed to connect to server'}`,
    ErrorType.SOCKET,
    ErrorSeverity.MEDIUM,
    {
      componentName: 'YourComponent',
      action: 'socketConnect',
      location: 'WebSocket',
      metadata: {
        error: error.toString(),
        stack: error.stack
      }
    }
  );
  
  // Handle UI-specific notifications if needed
});
```

### 2. Disconnect Events

Not all disconnections are errors, but unexpected disconnects should be tracked:

```javascript
socket.on('disconnect', (reason) => {
  // Only show error for unexpected disconnects
  const unexpectedDisconnects = [
    'transport close', 
    'transport error', 
    'server namespace disconnect'
  ];
  
  if (unexpectedDisconnects.includes(reason)) {
    errorHandler.showError(
      `Socket disconnected: ${reason}`,
      ErrorType.SOCKET,
      ErrorSeverity.MEDIUM,
      {
        componentName: 'YourComponent',
        action: 'socketDisconnect',
        location: 'WebSocket',
        metadata: { reason }
      }
    );
  }
  
  // Handle UI-specific notifications
});
```

### 3. Socket Operation Errors

For errors during socket operations:

```javascript
try {
  socket.emit('event', data);
} catch (error) {
  errorHandler.showError(
    `Failed to send data: ${error.message}`,
    ErrorType.SOCKET,
    ErrorSeverity.MEDIUM,
    {
      componentName: 'YourComponent',
      action: 'emitEvent',
      location: 'WebSocket',
      metadata: {
        event: 'event',
        data: JSON.stringify(data),
        error: error.toString()
      }
    }
  );
}
```

### 4. Socket Error Events

Listen for explicit error events:

```javascript
socket.on('error', (error) => {
  errorHandler.showError(
    `Socket error: ${error.message || 'Unknown socket error'}`,
    ErrorType.SOCKET, 
    ErrorSeverity.MEDIUM,
    {
      componentName: 'YourComponent',
      action: 'socketOperation',
      location: 'WebSocket',
      metadata: {
        error: error.toString(),
        stack: error.stack
      }
    }
  );
});
```

## Best Practices for Socket Error Handling

1. **Provide meaningful context** - Include which socket, namespace, and operation was being performed
2. **Include appropriate severity** - Not all socket errors are equal
3. **Reconnection logic** - Implement automated reconnection for transient errors
4. **Error deduplication** - Prevent duplicate errors for repeated connection attempts
5. **User feedback** - Show appropriate UI feedback for connection issues
6. **Log all errors** - Even minor socket errors should be logged for diagnostics

## Integration with Component-Specific Feedback

In addition to using the central error system, provide component-specific feedback when appropriate:

```javascript
// For terminal components, show messages directly in the terminal as well
if (termRef.current) {
  termRef.current.write(`\r\n\x1b[31mConnection error: ${error.message}\x1b[0m\r\n`);
  termRef.current.write('Trying to reconnect...\r\n');
}
```

Remember that the standardized error system provides global notifications, but components may need additional context-appropriate error feedback.
