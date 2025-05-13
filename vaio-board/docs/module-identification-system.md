# Module Identification System

## Overview

This document describes the module identification system used in VAIO Board, including the recent standardization of layout data structures.

## Updates

### May 2025 - Layout Array Standardization
The module layout system has been updated to consistently use array format for grid layouts across both frontend and backend. This eliminates type conversion, simplifies the codebase, and fixes the "t.lg.find is not a function" error that occurred when the frontend expected arrays but received objects. See [layout-array-standardization.md](layout-array-standardization.md) for details.

## Module ID Format

All modules in the VAIO Board system use a three-part identifier format:

```
MODULETYPE-STATICIDENTIFIER-INSTANCEID
```

Where:
- `MODULETYPE`: The category of the module (e.g., "SYSTEM", "UTILITY", "VISUALIZATION")
- `STATICIDENTIFIER`: The specific module type (e.g., "SupervisorPane", "ClockPane")
- `INSTANCEID`: A unique instance identifier (can be a UUID or other unique string)

Example: `SYSTEM-SupervisorPane-123456`

## Layout Data Structure

### Frontend Format (React-Grid-Layout)

The frontend components use array format for all layout data. This format is required by react-grid-layout:

```javascript
{
  lg: [
    { i: "SYSTEM-SupervisorPane-123456", x: 0, y: 0, w: 3, h: 2, ... },
    { i: "UTILITY-ClockPane-abcdef", x: 3, y: 0, w: 2, h: 2, ... },
    // More items...
  ],
  md: [ ... ],
  sm: [ ... ],
  xs: [ ... ],
  xxs: [ ... ]
}
```

### Backend Format (Python/Database)

The backend may store layouts in a dictionary format for easier lookups:

```python
{
  "lg": {
    "SYSTEM-SupervisorPane-123456": {"x": 0, "y": 0, "w": 3, "h": 2, ...},
    "UTILITY-ClockPane-abcdef": {"x": 3, "y": 0, "w": 2, "h": 2, ...}
  },
  "md": { ... },
  "sm": { ... },
  "xs": { ... },
  "xxs": { ... }
}
```

## Format Conversion

The `LayoutTransformer.js` component is responsible for converting between these formats:

1. When receiving data from the backend, the `hydrateLayoutsFromDB()` function ensures all breakpoints are converted to arrays.
2. When creating new layouts, the `createEmptyLayouts()` function initializes with empty arrays.

## Standardization Rules

To maintain consistent data structures:

1. **Frontend Rule**: Always use array format for all breakpoints
   ```javascript
   const gridLayout = {
     lg: [], md: [], sm: [], xs: [], xxs: []
   };
   ```

2. **Backend Communication**: The LayoutTransformer handles conversion between formats

3. **Data Validation**: Always validate layout items to ensure they have the required properties (i, x, y, w, h)

4. **Legacy Support**: Conversion utilities in LayoutTransformer handle legacy or mixed formats

## Implementation Details

### Key Components

1. **LayoutTransformer.js**: Central utility for layout data conversion and validation
2. **LayoutManager.js**: Manages saving and loading layouts to/from session storage
3. **SettingsLoader.js**: Handles initial loading and normalization of layouts
4. **LaunchButtons**: Components that seed layouts when launching new modules

### Debug Utilities

The `LayoutDebugger.js` provides utilities to:

1. Validate layout formats (`validateGridFormat`)
2. Fix common layout issues (`fixGridLayout`) 
3. Debug layout problems (`debugGridLayout`)

## Common Issues and Solutions

1. **"t.lg.find is not a function" Error**
   - Cause: Layout data has an object format instead of array format for breakpoints
   - Solution: Ensure all components use array format consistently

2. **Module Not Appearing In Layout**
   - Cause: Layout item may be invalid or have incorrect module ID format
   - Solution: Check debug overlay (F10) for module validation errors

3. **Launch Buttons Not Working**
   - Cause: Layout seeding issue or incompatible layout format
   - Solution: Ensure launch buttons correctly seed new layout items as arrays

## Migration Path

For components still using legacy object formats:

1. Use the LayoutTransformer to convert layouts to array format
2. Update component state to initialize with arrays
3. Remove any custom object-to-array conversion code

## Future Enhancements

1. Strict validation at API boundaries
2. Runtime checks for layout format consistency 
3. Type definitions for layout data structures
