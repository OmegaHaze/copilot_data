/**
 * module-index.js
 * CONSOLIDATION PLAN: CLEAN MODULE API SURFACE
 *
 * This file has been refactored to provide a cleaner, more organized
 * API for the module system with clear boundaries and documentation.
 */

/********************************************************************
 * � CONSOLIDATION NOTE:
 *
 * This file now:
 * 1. Imports constants from canonical sources
 * 2. Maintains a cleaner API surface with documented function groups
 * 3. Imports shared utilities from shared-utilities.js
 * 4. No longer re-exports functions through multiple layers
 ********************************************************************/

// Import constants from canonical source
import { MODULE_TYPES } from '../Component/component-constants';

// Import core module-specific functionality
import { 
  getModuleType,
  isModule,
  allowsMultipleInstances
} from './module-core';

// Import operations (actual functionality)
import {
  findActiveInstances,
  hasActiveInstances,
  addModule,
  removeModule,
  toggleModule,
  saveModuleState
} from './module-operations';

// Import shared utilities directly from shared location
import {
  getCanonicalKey,
  generateInstanceId,
  createPaneId,
  getInstanceId,
  filterByActiveModules,
  mergeModuleItems,
  processModuleData,
  validateModule,
  validateModules
} from '../Shared/shared-utilities';

/**
 * MODULE SYSTEM API
 * -----------------
 * The module system provides facilities for managing dashboard modules:
 * - Creating module instances
 * - Removing module instances
 * - Toggling modules on/off
 * - Saving module state
 * - Working with module identifiers
 */
export {
  // Constants
  MODULE_TYPES,
  
  // Core module type functions
  getModuleType,
  isModule,
  allowsMultipleInstances,
  
  // Main operations (primary API)
  findActiveInstances,  // Find all instances of a module type
  hasActiveInstances,   // Check if any instances of a module type exist
  addModule,            // Add a new module instance
  removeModule,         // Remove module instances
  toggleModule,         // Toggle a module on/off
  saveModuleState,      // Save module state to storage/server
  
  // ID handling utilities
  getCanonicalKey,      // Get canonical module type from a key
  generateInstanceId,   // Generate a unique instance ID
  createPaneId,         // Create a full pane ID
  getInstanceId,        // Get instance ID from a pane ID
  
  // Data processing utilities
  filterByActiveModules, // Filter by active modules
  mergeModuleItems,      // Merge module items from different sources
  processModuleData,     // Process module data into standard format
  validateModule,        // Validate single module
  validateModules        // Validate module collection
};