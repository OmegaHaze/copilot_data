# Error System Testing Guide

## Overview

This guide documents how to test and verify the operation of the VAIO Board error handling system. The system has been enhanced to standardize error types, capture console warnings/errors, and provide a consistent notification system.

## Testing with ErrorSystemTest Component

We've created a test component at:
`/dashboard/client/src/components/Error-Handling/tests/ErrorSystemTest.jsx`

This component allows you to:

1. Generate custom errors with specific types and severities
2. Test console warnings and errors to verify they're captured
3. Run a sequence of different error types to view styling differences

## Key Features to Test

### 1. Console Message Capturing

The system now intelligently captures and categorizes console messages:

- **Console Warnings**: Captured as `CONSOLE_WARNING` type with medium severity
- **Console Errors**: Captured as `CONSOLE_ERROR` type with medium severity
- **Special Prefixes**: Messages with `[ERROR]`, `[WARNING]`, `[INFO]`, etc. are categorized accordingly
- **Emoji Detection**: Messages containing ⚠️, ❌, ✅, etc. get appropriate categorization

### 2. Error Type System

The error system now provides standardized types:

- **SYSTEM**: Critical system errors (high severity)
- **UI**: User interface errors (medium severity)
- **API**: API request failures (medium severity)
- **SOCKET**: WebSocket connection issues (medium severity)
- **SESSION**: Authentication/session errors (high severity)
- **WARNING**: Non-critical warnings (medium severity)
- **SUCCESS**: Success messages (low severity)
- **INFO**: Informational messages (low severity)
- **DEBUG**: Debug information (low severity)

### 3. Severity Levels

- **HIGH**: User-blocking issues that require immediate attention (don't auto-dismiss)
- **MEDIUM**: Important but not blocking issues (auto-dismiss after 10 seconds)
- **LOW**: Informational messages (auto-dismiss after 7 seconds)

### 4. Vertical Notification Layout

The notification system now uses a vertical stacking layout organized by severity:

- **Critical Row**: Contains HIGH severity errors at the top
- **Warning Row**: Contains MEDIUM severity errors in the middle
- **Info Row**: Contains LOW severity errors at the bottom

#### Testing the Vertical Layout

The ErrorSystemTest component includes a "Test Vertical Layout" button that:

1. Displays a HIGH severity error in the Critical row
2. Displays a MEDIUM severity warning in the Warning row
3. Displays a LOW severity info message in the Info row

This test verifies that:
- Each notification appears in the correct row based on severity
- Rows show and hide properly as notifications are added/removed
- Rows have proper spacing and styling between them
- Notifications stack properly within each row

#### What to Look For

When testing the vertical layout:

1. **Row Separation**: Each severity level should have its own clearly defined section
2. **Headers**: Each row should show its category label (Critical, Warnings, Info)
3. **Animation**: Rows should smoothly expand/collapse as notifications are added/dismissed
4. **Z-index Stacking**: Within each row, newer notifications should appear on top
5. **Auto-dismiss**: Verify that LOW and MEDIUM severity messages auto-dismiss
6. **Cache Indicator**: After auto-dismiss, verify the red triangle indicator appears

## Integration Instructions

To add the test component to your application:

```jsx
import ErrorSystemTest from './components/Error-Handling/tests/ErrorSystemTest';

// Then in your component:
<ErrorSystemTest />
```

## Troubleshooting

If console warnings/errors are not being captured:

1. Verify the imports in `main.jsx` include `parseConsoleMessage`
2. Check that the `ErrorType` and `ErrorSeverity` are being properly imported
3. Ensure the error handler is properly initialized before the console overrides
