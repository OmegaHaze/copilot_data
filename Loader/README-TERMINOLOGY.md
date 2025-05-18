# Terminology Guide for Layout System

This document clarifies the terminology used throughout the layout system to avoid confusion between similar concepts.

## Core Terminology

### Module System

- **moduleType**: The category of a module (SYSTEM, SERVICE, USER)
- **staticIdentifier**: The specific component name (e.g., "Supervisor", "Status")
- **instanceId**: A randomly generated ID for each instance of a component (e.g., "1X2YZ")
- **paneId**: The full identifier of a pane, constructed as `${moduleType}-${staticIdentifier}-${instanceId}` (e.g., "SYSTEM-Supervisor-1X2YZ")
- **moduleKey**: Refers to `${moduleType}-${staticIdentifier}` without the instance ID (e.g., "SYSTEM-Supervisor")

### Layout System

- **layout item**: A single item in a layout grid with `i`, `x`, `y`, `w`, `h` properties (where `i` is the paneId)
- **layout**: Array of layout items for a specific breakpoint
- **layouts**: Object containing layouts for all breakpoints (lg, md, sm, xs, xxs)
- **breakpoint**: Responsive size category (lg, md, sm, xs, xxs)

## Relationship Between Components and Modules

In the VAIO system:
- A **component** is a specific UI element that can be added to the dashboard
- A **module** is a more general term that encompasses components and their configuration
- A component is essentially a specific module with a UI representation

When referring to:
- A single UI element in the grid: use "component" or "pane"
- Multiple UI elements: use "components" or "panes"
- The general system for managing these elements: use "module system"

## Function Parameter Naming Conventions

For consistency across the codebase, use these parameter names:

- `paneId`: The full identifier of a pane (e.g., "SYSTEM-Supervisor-1X2YZ")
- `moduleKey`: The module type + static identifier (e.g., "SYSTEM-Supervisor")
- `moduleType`: The category (SYSTEM, SERVICE, USER)
- `staticIdentifier`: The component name (e.g., "Supervisor")
- `instanceId`: The instance-specific part of the paneId (e.g., "1X2YZ")
