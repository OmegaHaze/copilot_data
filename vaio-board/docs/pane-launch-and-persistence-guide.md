# End-to-End Pane Launch and Layout Persistence System

This document provides a comprehensive overview of how panes are launched, rendered, and persisted in the VAIO Board system.

## 1. Database Models & Structure

### Backend Data Models
- **UserSession Model** (in `backend/db/models.py`):
  - Stores user's current session with `grid_layout` and `active_modules`
  - Uses array format for layouts: `grid_layout: Dict[str, List[Dict[str, Any]]]`
  - Each layout follows the standardized breakpoint structure: `{"lg": [], "md": [], "sm": [], "xs": [], "xxs": []}`

- **PaneLayout Model** (in `backend/db/models.py`):
  - Stores saved layouts with `grid` and `modules` fields
  - Formats each module ID using three-part format: `MODULETYPE-STATICIDENTIFIER-INSTANCEID`

### Backend API Routes
- **Session Routes** (`/api/user/session/grid`):
  - Handles updating grid layouts and active modules
  - Validates layout array format before storage
  - Ensures consistent array format for all breakpoints

## 2. Frontend State Management

### SettingsContext
- **Initialization** (in `SettingsContext.jsx`):
  - Sets up initial empty grid layout: `{ lg: [], md: [], sm: [], xs: [], xxs: [] }`
  - Initializes empty `activeModules` array
  - Calls `loadSettingsFromSession()` on mount to fetch data from backend

### ServiceMatrix Component
- Acts as the main container for the grid system
- Calls `fetchAndSyncSessionData()` to load data from API
- Passes layouts and modules to ServiceGrid for rendering

### ComponentRegistry
- Maintains registry of available components
- Maps module types to component implementations
- Provides utility methods for working with module IDs

## 3. Launch Button Implementation

### LaunchButtonSuper Component
1. **Button Press**:
   ```jsx
   handleLaunch = async () => {
     // Check for duplicate modules and initialization
     // Generate unique instance ID
   ```

2. **Create Pane ID**:
   ```jsx
   const moduleType = 'SYSTEM';
   const staticIdentifier = 'SupervisorPane';
   const instanceId = Date.now().toString(36) + Math.random().toString(36).substr(2,5);
   const paneId = `${moduleType}-${staticIdentifier}-${instanceId}`;
   ```

3. **Generate Layout Items**:
   ```jsx
   // Get optimal positions for all breakpoints
   const layoutItems = createLayoutItemForAllBreakpoints(moduleType, staticIdentifier, safeGridLayout);
   ```

4. **Update Layout State**:
   ```jsx
   // Update each breakpoint with new item
   Object.keys(layoutItems).forEach(bp => {
     const newItem = {
       ...layoutItems[bp],
       i: paneId,  // Consistent pane ID
       moduleType,
       staticIdentifier
     };
     newLayouts[bp] = [...newLayouts[bp], newItem];
   });
   ```

5. **Update Context State**:
   ```jsx
   // Update state for immediate UI feedback
   setGridLayout(newLayouts);
   setActiveModules([...activeModules, paneId]);
   ```

6. **Persist Changes**:
   ```jsx
   // Save to backend session storage
   const result = await saveLayoutsToSession(newLayouts, newModules);
   ```

7. **Notify System**:
   ```jsx
   // Emit socket event for real-time updates
   socket.emit("pane:launched", {
     moduleType, staticIdentifier, instanceId, paneId, timestamp: Date.now()
   });
   ```

## 4. Layout Positioning & Creation

### LayoutPositioning.js
- `createLayoutItemForAllBreakpoints()`:
  - Takes module type and current layouts
  - Gets default size based on module type
  - Calculates optimal position for each breakpoint
  - Returns layout items for all breakpoints (lg, md, sm, xs, xxs)

- `getOptimalPosition()`:
  - Analyzes current layout to find best placement
  - Avoids overlap with existing items
  - Returns x/y coordinates

## 5. Layout Persistence Flow

### LayoutManager.js
1. **Validate Layouts**:
   ```javascript
   if (!validateLayouts(layouts)) {
     throw new Error('Invalid grid layout structure');
   }
   ```

2. **Validate Active Modules**:
   ```javascript
   // Filter valid modules with three-part format
   activeModules = activeModules.filter(id => id && id.split('-').length === 3);
   ```

3. **Prepare API Payload**:
   ```javascript
   const payload = {
     grid_layout: layouts,
     active_modules: activeModules
   };
   ```

4. **Send to API**:
   ```javascript
   const response = await fetchWithRetry('/api/user/session/grid', {
     method: 'PUT',
     headers: { 'Content-Type': 'application/json' },
     credentials: 'include',
     body: JSON.stringify(payload)
   });
   ```

### Backend Session Handling
1. **Receive Layout Update** (in `routes_session.py`):
   ```python
   @router.put("/session/grid")
   async def update_grid_layouts(payload, user):
     # Validate grid layout format
     # Store in database as array format
     # Update user session
   ```

2. **Format Validation**:
   ```python
   # Ensures all breakpoints use array format
   for bp in ['lg', 'md', 'sm', 'xs', 'xxs']:
       if not isinstance(grid_layout.get(bp), list):
           grid_layout[bp] = []
   ```

## 6. Grid Rendering in UI

### ServiceGrid.jsx
- Takes layouts and renders them using React Grid Layout
- Ensures each breakpoint array contains valid items
- Maps each item ID to the appropriate component
- Handles drag/drop and resize operations

## 7. Layout Transformations

### LayoutTransformer.js
- Provides utilities for layout data conversion and validation
- `createEmptyLayouts()`: Initializes empty layout arrays
- `hydrateLayoutsFromDB()`: Ensures API data is in proper format
- `sanitizeLayoutsForStorage()`: Cleans layout data before storage
- `isValidResponsiveLayout()`: Validates layout structure

## 8. Session Management

### SessionManager.js
- Handles loading/saving session data
- `fetchAndSyncSessionData()`: Initial data load
- `updateModulesSession()`: Updates active modules list
- `refreshSessionData()`: Reloads data from backend

## 9. Layout Load Sequence

1. **Application Startup**:
   - `SettingsContext` initializes
   - `loadSettingsFromSession()` fetches data
   - Layout data is normalized to array format
   - ServiceMatrix sets up grid with loaded data

2. **On Layout Change**:
   - React Grid Layout emits change event
   - `debouncedSaveToSession()` called to persist changes
   - API updates user session in database

## 10. Key Standardization Points

- **Module ID Format**: Always use `MODULETYPE-STATICIDENTIFIER-INSTANCEID`
- **Layout Format**: Always use array format for grid layouts
- **Breakpoints**: Always include all breakpoints: lg, md, sm, xs, xxs

## 11. Debugging Layout Issues

If layout persistence issues occur:

1. **Verify Data Format**: 
   - Check that grid layouts use array format for all breakpoints
   - Ensure all module IDs follow the three-part format

2. **Check API Flow**:
   - Use Browser DevTools to verify API payloads
   - Check backend logs for validation errors

3. **Component Registration**:
   - Verify components are properly registered in ComponentRegistry
   - Check module type mapping is correct

4. **Layout Validation**:
   - Use LayoutDebugUtil to inspect layout structures
   - Verify validateLayouts() is properly checking format

## 12. Simple Summary of Launch Button Flow

When a Launch Button is clicked:

1. **Create a unique pane ID** using the format: `${moduleType}-${staticIdentifier}-${instanceId}`
2. **Check for duplicates** to prevent launching multiple instances of the same pane
3. **Generate layout positions** for the pane across all responsive breakpoints (lg, md, sm, xs, xxs)
4. **Update the React state**:
   - Add the new pane ID to `activeModules` array
   - Add the new layout items to each breakpoint array in `gridLayout`
5. **Persist the layouts**:
   - Call `saveLayoutsToSession(newLayouts, newModules)` to save to backend
   - This ensures layouts survive page refreshes
6. **Notify the system**:
   - Emit a socket event like `pane:launched` to notify other parts of the system
   - Update any UI elements that show active panes
7. **Handle errors** gracefully if any of the above steps fail
