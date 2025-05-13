# VAIO Board Pane System Architecture

This document provides a comprehensive overview of the VAIO Board pane system architecture, focusing on the core components, data flow, and key responsibilities of each module.

## System Overview

The VAIO Board uses a modular pane system that allows dynamic loading and rendering of various UI components (referred to as "panes" or "modules"). The system is built on the following principles:

- **Dynamic Component Loading**: Components are loaded on-demand
- **Three-tier Module Classification**: SYSTEM, SERVICE, USER modules
- **Persistent Layout Management**: Grid layouts saved to backend
- **Standardized Module Identification**: Uses TYPE-IDENTIFIER-INSTANCE pattern

## Core Components & Responsibilities

### Component Registry (ComponentRegistry.jsx)

The central singleton responsible for:

1. **Component Registration & Retrieval**
   - Maintains registry of all loaded components using a Map
   - Categorizes components by module type (SYSTEM, SERVICE, USER)
   - Stores component metadata for UI rendering

2. **Dynamic Component Loading**
   - Lazy-loads components using a standardized path convention
   - Caches loaded components to prevent duplicate imports
   - Follows TYPE-IDENTIFIER path pattern: `../../TYPE/IDENTIFIER/IDENTIFIER.jsx`
   
3. **Component Rendering**
   - Renders components using their paneId and grid item data
   - Creates appropriate component props by parsing the paneId
   - Provides fallback error rendering for missing components

4. **Error Handling**
   - Reports and stores component loading/rendering errors
   - Provides standardized error reporting APIs
   - Maintains error history for debugging

### Service Grid (ServiceGrid.jsx)

The main container component that:

1. **Grid Layout Management**
   - Renders the responsive grid layout
   - Handles grid item positioning and constraints
   - Processes layout changes from user interactions

2. **Pane Rendering**
   - Uses ComponentRegistry to render individual panes
   - Applies appropriate styling based on module type
   - Handles pane visibility and state management

3. **Module Key Extraction**
   - Parses pane IDs to extract module information
   - Ensures proper component identification

### Layout Manager (LayoutManager.js)

Responsible for:

1. **Layout Persistence**
   - Saves grid layouts to backend
   - Validates layout structure before saving
   - Handles API communication for layout updates

2. **Layout Validation**
   - Ensures layout data meets expected format
   - Validates breakpoint structures
   - Checks required properties on layout items

3. **Module ID Management**
   - Validates three-part ID format
   - Provides utilities for ID parsing and creation

### Session Manager (SessionManager.js)

Manages:

1. **Session State**
   - Handles synchronization of UI state with backend
   - Fetches and updates session data
   - Coordinates with grid layout to apply session settings

2. **API Communication**
   - Performs API calls to backend session endpoints
   - Handles response processing and error cases
   - Updates React context with session results

### Layout Positioning (LayoutPositioning.js)

Provides:

1. **Intelligent Layout Placement**
   - Finds optimal positions for new panes
   - Respects configured constraints for different module types
   - Handles different breakpoint sizes

2. **Module Size Configuration**
   - Stores default sizing parameters by module type
   - Provides sizing utility functions

## Module Identification System

Modules (panes) use a three-part identifier format:

```
TYPE-IDENTIFIER-INSTANCE
```

- **TYPE**: Module category (SYSTEM, SERVICE, USER)
- **IDENTIFIER**: Static component name (e.g., "Supervisor", "Nvidia")
- **INSTANCE**: Unique instance ID (uuid or numbered instance)

Examples:
- `SYSTEM-Supervisor-1`: System component, Supervisor module, instance 1
- `SERVICE-Nvidia-uuid123`: Service component, Nvidia module, instance uuid123

## Data Flow

1. User requests a new pane (via launcher button)
2. Layout is calculated using LayoutPositioning
3. New item is added to grid layout state
4. ServiceGrid renders the new grid item
5. ComponentRegistry is used to load and render the component
6. Layout is persisted to backend via LayoutManager
7. Session is updated via SessionManager

## Backend Integration

The system interacts with the backend through:

1. **Session API**
   - GET/POST endpoints for retrieving and updating session data
   - Stores grid layout and active modules

2. **Socket Notifications**
   - Real-time updates for module state changes
   - Event-based communication for multi-user scenarios
