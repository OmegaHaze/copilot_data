# ComponentRegistry Technical Documentation

## Overview

The ComponentRegistry is a core singleton that manages dynamic component loading, registration, and rendering in the VAIO Board dashboard. It serves as the central repository for all UI components (panes/modules) that can be dynamically placed in the dashboard's grid layout.

## Key Responsibilities

1. **Component Registration**: Store and categorize React components
2. **Dynamic Loading**: Import components on-demand using a standard path convention
3. **Component Rendering**: Transform pane IDs into rendered React components
4. **Error Handling**: Standardized error reporting and fallback UI

## Component Identification System

The registry uses a standardized identification scheme:

- **Registration Key**: `TYPE-IDENTIFIER` format 
  - Example: `SYSTEM-Supervisor`
  
- **Pane ID**: `TYPE-IDENTIFIER-INSTANCE` format
  - Example: `SYSTEM-Supervisor-1`
  - Used to uniquely identify rendered instances

- **Module Types**:
  - `SYSTEM`: Core system components
  - `SERVICE`: External service integrations
  - `USER`: User-created components

## Data Structures

- `components`: Map of registration keys to React components
- `instances`: Map to track component instances
- `moduleTypes`: Categorized Sets of component keys
- `moduleData`: Metadata arrays for each module type
- `errors`: Map of loading/rendering errors by key
- `logoUrls`: Map of logo URLs for components

## Core Methods

### Component Registration

```javascript
registerComponent(key, component, moduleType = 'SYSTEM', metadata = {})
```

Registers a component with the registry, categorizing it by module type and storing any additional metadata.

### Component Retrieval

```javascript
getComponent(key)
```

Retrieves a previously registered component by its key.

### Component Rendering

```javascript
renderComponent(paneId, item)
```

Renders a component based on:
- `paneId`: The component identifier (`TYPE-IDENTIFIER-INSTANCE`)
- `item`: Layout item data with positioning/sizing

Process:
1. Parse the paneId to extract parts
2. Look up the component by `TYPE-IDENTIFIER`
3. Create props from paneId parts and item data
4. Return the rendered component or a placeholder

### Dynamic Loading

```javascript
async loadComponent(key, staticIdentifier)
```

Dynamically imports and registers a component:
1. Generate registration key
2. Check if already loaded
3. Import from standard path: `../../TYPE/IDENTIFIER/IDENTIFIER.jsx`
4. Register and return the component

### Error Handling

```javascript
reportError(message, type = 'SYSTEM', severity = 'MEDIUM', context = {})
```

Standardized error reporting with severity levels and context data.

```javascript
storeComponentError(key, message, context = {})
```

Stores component-specific errors for later inspection.

```javascript
renderPlaceholder(paneId, message)
```

Renders an error placeholder when a component fails to load or render.

## Usage Example

```javascript
// Import the singleton
import registry from '../Loader/ComponentRegistry';

// Initialize the registry
await registry.initialize();

// Register error handler
registry.setErrorHandler((message, type, severity, context) => {
  console.error(`${type} error (${severity}): ${message}`, context);
});

// Load a component dynamically
const MyComponent = await registry.loadComponent('SYSTEM', 'Dashboard');

// Render a component by ID
const renderedComponent = registry.renderComponent('SYSTEM-Dashboard-1', {
  x: 0,
  y: 0,
  w: 6,
  h: 4,
  // other grid item properties
});
```

## Best Practices

1. **Error Handling**: Always handle potential null returns from `loadComponent` and `getComponent`
2. **Key Consistency**: Use consistent TYPE-IDENTIFIER keys throughout the system
3. **Module Organization**: Maintain logical grouping in the module type categories
4. **Component Structure**: Ensure components properly accept and use the standard props
