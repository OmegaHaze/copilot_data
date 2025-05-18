# Layout System

## Overview
This directory contains a clean, streamlined implementation of the layout system for the VAIO dashboard. It handles grid layout management, transformation, and persistence with clear separation of concerns.

## Design Principles
1. **Single Source of Truth** - Clear ownership of data and constants
2. **Pure Functions** - Most utilities are pure functions for better testability
3. **Clear Data Flow** - Defined priority: localStorage for active usage, session API for initial load
4. **No Redundancy** - No duplicate code or functionality
5. **No Fallbacks** - Clean error handling, no unnecessary fallbacks
6. **Explicit Data Paths** - Clear data flow between components

## Core Files

### `layout-constants.js`
Single source of truth for all layout-related constants like breakpoints, storage keys, etc.

### `layout-core.js`
Core layout primitives and utilities for creating, validating, and transforming layouts.

### `layout-positioning.js`
Smart placement algorithms for determining optimal positions for new layout items.

### `layout-storage.js`
Pure functions for layout persistence to localStorage and sessionStorage.

### `layout-api.js`
Functions for interacting with backend layout APIs.

### `layout-operations.js`
High-level operations for manipulating layouts (add, remove, resize items).

### `index.js`
Main interface to the layout system, exposing a clean API to consumers.

## Data Flow
1. **Initial Load**: Session API data (if user is logged in)
2. **Active Usage**: localStorage is the primary data store
3. **API Synchronization**: API updated when layout changes persist

## API Design
The layout system exposes a clean API through `index.js`:

- `createEmptyLayout()`: Create a new empty layout structure
- `saveLayout(layouts)`: Save layouts to localStorage & backend
- `loadLayout()`: Load layouts from localStorage or API
- `validateLayout(layout)`: Validate layout structure
- `transformLayout(layout)`: Transform layout for persistence
- `getOptimalPosition(...)`: Find best position for new items
- `addModule(moduleId, moduleType, currentLayouts)`: Add a new module to layouts
- `removeModule(moduleId, currentLayouts)`: Remove module from layouts
- `saveLayoutTemplate(name, layouts, modules)`: Save layouts as a template
- `getLayoutTemplates()`: Get all saved layout templates
- `applyLayoutTemplate(id)`: Apply a template to current layout

## Breaking Changes from Previous Implementation
- Removed all fallbacks for cleaner code
- Consolidated all constants in a single file
- Streamlined API endpoints usage
- Clear separation between core functions and API interaction
- Standardized Promise-based approach for async operations
- Reduced API surface to improve maintainability