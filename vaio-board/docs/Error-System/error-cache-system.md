# Error Cache System Documentation

## Overview

The VAIO Board error cache system provides a mechanism to store and retrieve auto-dismissed error notifications. This ensures that important information is not lost when notifications are automatically dismissed based on their severity level.

## Key Components

### 1. Error Indicator

A semi-transparent red warning triangle appears at the top-center of the screen when there are auto-dismissed notifications in the cache. This provides a subtle yet noticeable indication that there are previous notifications the user might want to review. The triangle is designed to be minimally intrusive:

- No text labels (only a tooltip on hover)
- Semi-transparent appearance (70% opacity)
- Subtle pulse animation
- Positioned behind notifications to avoid blocking important content
- Becomes fully opaque on hover for better visibility when needed

### 2. Dismissal Cache

The system maintains a cache of automatically dismissed notifications with the following behaviors:
- Only auto-dismissed notifications are added to the cache
- Manually dismissed notifications (when the user clicks the X) are not cached
- The cache is limited to the 50 most recent auto-dismissed notifications

### 3. Restoration Mechanism

When the user clicks the red triangle indicator:
- Up to 5 of the most recent cached notifications are restored to the active notification queue
- These notifications are removed from the cache
- If more than 5 notifications are in the cache, the indicator remains visible

## Usage

### Automatic Behavior

1. Notifications are displayed based on their type and severity
2. Low and Medium severity notifications auto-dismiss after their configured timeouts:
   - Low severity: 7 seconds
   - Medium severity: 10 seconds 
3. High severity notifications remain on screen until manually dismissed
4. When auto-dismissed, notifications are moved to the cache

### User Interaction

1. Users can see auto-dismissed notifications by clicking the red triangle indicator
2. Users can manually dismiss any notification by clicking the X button
3. Users can copy notification text by clicking on the notification body

## Implementation Details

### Error Store

The error cache is managed by the ErrorStore using Zustand with the following state:
- `errors`: Array of active error notifications
- `dismissCache`: Array of auto-dismissed notifications
- `hasCachedErrors`: Boolean flag that controls indicator visibility

### Key Methods

- `removeError(id, isAutoDismiss)`: Removes an error and adds it to the cache if auto-dismissed
- `restoreCachedErrors()`: Restores recent cached errors to the active display
- `clearCache()`: Clears only the cached errors
- `clearErrors()`: Clears only active errors but preserves cached errors
- `clearAllErrors()`: Clears both active and cached errors completely

## Notification Layout Integration

The error cache system is deeply integrated with the notification layout to provide a seamless experience:

### Vertical Layout Organization

1. When errors are restored from the cache, they appear in their appropriate severity rows:
   - HIGH severity errors in the "Critical" row at the top
   - MEDIUM severity errors in the "Warnings" row in the middle
   - LOW severity errors in the "Info" row at the bottom

2. Cached errors maintain their original properties when restored:
   - Severity level and styling
   - Auto-dismiss timeouts
   - Context information
   - Interactive behaviors

### User Experience Improvements

- The notification layout's vertical organization keeps related notifications grouped together
- Each severity level has its own row with a clear visual header
- Empty rows collapse automatically to save space
- When restored, cached notifications animate into their proper position

### Triangle Indicator Position

- The red triangle indicator is positioned at the top center of the screen
- It sits behind notifications to avoid blocking important content
- In the vertical layout, it remains visible even when multiple notifications are displayed

## Best Practices

1. **Proper Severity Assignment**: Ensure errors are assigned appropriate severity levels:
   - High: Use for critical user-blocking issues
   - Medium: Use for important but non-blocking issues
   - Low: Use for informational messages
   
2. **Error Context**: Always include relevant context with errors to help users understand:
   - Component name
   - Action being performed
   - Location in the application
   - Additional metadata when available

## Example

```jsx
// Showing an error that will auto-dismiss and be cached
errorHandler.showError(
  "Database connection temporarily unavailable",
  ErrorType.API,
  ErrorSeverity.MEDIUM,
  {
    componentName: "DataLoader",
    action: "fetchData",
    location: "Dashboard",
    metadata: {
      timestamp: new Date().toISOString(),
      endpoint: "/api/data"
    }
  }
);
```
