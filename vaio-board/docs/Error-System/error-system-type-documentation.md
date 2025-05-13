# Error Type System Documentation

## CRITICAL: Error Type System vs. Regular Notifications

> **CRITICAL NOTICE**: The Error Type System (`errorTypes.js`) is specifically designed for error and diagnostic notifications, not for general UI notifications or confirmations. These should remain separate systems with distinct styling and behaviors.

## Overview

The VAIO Board uses a comprehensive error handling system that categorizes and manages all types of errors, warnings, and diagnostic messages. The system is designed to:

1. **Standardize error reporting** across all components
2. **Provide consistent styling** based on message type and severity
3. **Capture console messages** including warnings and errors
4. **Centralize notification display** for better user experience
5. **Support contextual information** for improved debugging

## Error Type Classification

The system defines several error types to properly categorize different kinds of messages:

| Error Type | Description | Default Severity | Visual Style |
|------------|-------------|-----------------|--------------|
| `SYSTEM` | System/configuration errors | HIGH | Red border/text |
| `UI` | User interface errors | MEDIUM | Yellow border/text |
| `API` | Network/API request errors | MEDIUM | Purple border/text |
| `SOCKET` | WebSocket connection errors | MEDIUM | Blue border/text |
| `SESSION` | Session management errors | HIGH | Yellow border/text |
| `WARNING` | General warning messages | MEDIUM | Orange border/text |
| `CONSOLE_WARNING` | Captured console.warn() calls | MEDIUM | Orange border/text |
| `CONSOLE_ERROR` | Captured console.error() calls | MEDIUM | Red border/text |
| `DEBUG` | Debug information messages | LOW | Gray border/text |
| `SUCCESS` | Operation success messages | LOW | Green border/text |
| `INFO` | Informational messages | LOW | Blue border/text |

## Severity Levels

Each message also has a severity level which determines its importance:

- `HIGH`: User-blocking issues that require immediate attention
- `MEDIUM`: Issues that affect user experience but don't block core functionality
- `LOW`: Informational messages with minimal impact on user experience

## Notification Layout

The error notification system organizes notifications in a vertical stacked layout:

1. **Severity-based Rows**
   - HIGH severity errors appear in the top "Critical" row
   - MEDIUM severity errors appear in the middle "Warnings" row
   - LOW severity errors appear in the bottom "Info" row

2. **Row Behavior**
   - Empty rows collapse automatically to save space
   - Each row has a subtle header indicating the severity level
   - Rows are separated by subtle borders

3. **Notification Stacking**
   - Within each row, notifications stack vertically with slight offsets
   - Newest notifications appear at the top of each row
   - Notifications of the same severity level stack within their designated row
   - This prevents notifications of different severity from overlapping

4. **Visual Indicators**
   - A counter at the bottom shows additional hidden notifications
   - A red triangle indicator appears when there are cached notifications available
   - Clicking the triangle restores previously auto-dismissed notifications

### Layout Benefits

- Clear visual hierarchy based on notification severity
- Better space utilization with collapsible rows
- Consistent notification placement for improved UX
- Prevents notification overlap between different severity levels

## Usage

### In React Components

Use the `useError` hook in React components:

```javascript
import { useError } from '../Error-Handling/Diagnostics/ErrorNotificationSystem';
import { ErrorType, ErrorSeverity } from '../Error-Handling/Diagnostics/types/errorTypes';

function MyComponent() {
  const { showError } = useError();
  
  const handleError = () => {
    showError(
      'Failed to load data', 
      ErrorType.API, 
      ErrorSeverity.MEDIUM,
      {
        componentName: 'MyComponent',
        action: 'fetchData',
        metadata: { /* additional context */ }
      }
    );
  };
  
  // ...
}
```

### In Non-React Code

Use the `errorHandler` utility:

```javascript
import { errorHandler } from '../Error-Handling/utils/errorHandler';
import { ErrorType, ErrorSeverity } from '../Error-Handling/Diagnostics/types/errorTypes';

function processData() {
  try {
    // Some operation that might fail
  } catch (error) {
    errorHandler.showError(
      `Processing failed: ${error.message}`,
      ErrorType.SYSTEM,
      ErrorSeverity.HIGH,
      {
        location: 'Data Processor',
        action: 'processData',
        metadata: { error }
      }
    );
  }
}
```

## Console Message Interception

The system automatically intercepts `console.warn` and `console.error` calls and displays them in the notification system. This helps catch issues that might otherwise only appear in the browser console.

These interceptors include filters to prevent excessive noise from React development warnings and other common development messages.

## Implementation Details

The error type system is defined in `/dashboard/client/src/components/Error-Handling/Diagnostics/types/errorTypes.js` and includes:

- `ErrorType` enum for message categorization
- `ErrorSeverity` enum for importance levels
- `errorTypeStyles` mapping for consistent styling
- Helper functions for default severity

## Best Practices

1. **Choose the right type** for each error to ensure proper categorization
2. **Set appropriate severity** based on the impact to the user
3. **Include context information** to help with debugging
4. **Avoid noise** by not showing unnecessary notifications
5. **Use descriptive messages** that explain both the problem and potential solutions
