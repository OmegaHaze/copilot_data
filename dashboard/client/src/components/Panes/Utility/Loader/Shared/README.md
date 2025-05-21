# Shared Utilities Consolidation

## Overview

This directory contains shared utilities that have been consolidated from the Module and Component systems. The goal of this consolidation is to eliminate duplicate code, standardize behavior, and create clearer boundaries between systems.

## Background

Previously, the Module and Component systems had duplicate implementations of many utility functions, often with subtle differences that led to inconsistent behavior. The consolidation effort moves these shared functions into a central location while maintaining backward compatibility through the transition period.

## Files

- `shared-utilities.js`: The primary source of shared utility functions used by both Module and Component systems

## Consolidation Plan

### Phase 1: Initial Consolidation ✅

1. **Created shared utilities file** with canonical implementations of functions that were duplicated across systems
2. **Updated imports in module-constants.js** to use component-constants.js for shared constants (MODULE_TYPES, STORAGE_KEYS)
3. **Removed duplicate storage functions** from module-operations.js in favor of module-storage.js implementations
4. **Fixed unsafe dynamic registry import** in module-operations.js
5. **Added re-exports for backward compatibility** in module-shared.js and component-core.jsx

### Phase 2: Clean-Up (Next Steps)

1. **Update imports across the codebase** to point directly to shared-utilities.js
2. **Remove transition files** like module-shared.js when all references are updated
3. **Standardize on component registry** as the source of truth for module configuration
4. **Remove re-exports** once direct imports are in place
5. **Address circular dependencies** by restructuring interdependencies between systems

#### ⚠️ Important Note on Circular Dependencies

During Phase 1 implementation, we discovered circular dependencies between the Module and Component systems. This is why some functions in component-core.jsx still maintain their original implementations rather than importing from shared-utilities.js.

In Phase 2, we need to carefully resolve these circular dependencies through:
- Restructuring the dependency graph
- Creating intermediate abstraction layers
- Potentially implementing a service locator pattern

## Design Principles

1. **Single Source of Truth**: Each concept should have one canonical implementation
2. **Clean Boundaries**: Systems should have clear responsibilities with minimal overlap
3. **Backward Compatibility**: Changes should not break existing functionality
4. **Clear Documentation**: Code should be well-documented with comments explaining the consolidation plan

## Function Map

| Original Location | Function | New Location |
|------------------|----------|-------------|
| module-shared.js | getCanonicalKey | shared-utilities.js |
| module-shared.js | createPaneId | shared-utilities.js |
| module-shared.js | getInstanceId | shared-utilities.js |
| module-shared.js | mergeModuleItems | shared-utilities.js |
| module-shared.js | validateModule | shared-utilities.js |
| module-shared.js | validateModules | shared-utilities.js |
| component-core.jsx | getCanonicalKey | shared-utilities.js |
| component-core.jsx | createRegistrationKey | shared-utilities.js (as createPaneId) |
| component-core.jsx | isValidPaneId | shared-utilities.js |
| component-core.jsx | parsePaneId | shared-utilities.js |
| component-core.jsx | mergeModuleData | shared-utilities.js (as mergeModuleItems) |
| component-core.jsx | validateModulesCollection | shared-utilities.js |

## Constants Map

| Original Location | Constant | New Location |
|------------------|----------|-------------|
| module-constants.js | MODULE_TYPES | component-constants.js |
| module-constants.js | STORAGE_KEYS | component-constants.js |
| module-constants.js | MODULE_CONFIG | Removed (using component registry) |

## Troubleshooting Common Issues

### "require is not defined" Error

If you encounter "require is not defined" errors:

1. **Problem**: ESM modules (used in the React frontend) don't support CommonJS `require()` function
2. **Solution**: Replace `require()` with ESM `import` statements
   - For regular imports: `import { something } from './somewhere'`
   - For dynamic imports: `const module = await import('./somewhere')`

### Circular Dependencies

If you encounter errors related to circular dependencies:

1. **Problem**: Module A imports from Module B, which imports from Module A
2. **Immediate solution**: Keep original implementation in one of the modules temporarily
3. **Better solution**: Restructure code to eliminate the circular dependency

### Missing Functions or Constants

If you encounter errors about missing exports:

1. **Problem**: An import points to a file that no longer contains that export
2. **Solution**: Update the import to point to the new canonical source:
   - Constants should come from `component-constants.js`
   - Utility functions should come from `shared-utilities.js`
   - Storage functions should come from `module-storage.js`
