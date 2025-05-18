/**
 * module-index.js
 * Main interface to module system
 */

import { MODULE_TYPES, MODULE_CONFIG } from './module-constants';
import { 
  getModuleType,
  isModule,
  allowsMultipleInstances,
  getCanonicalKey,
  generateInstanceId,
  createPaneId,
  getInstanceId,
  filterByActiveModules,
  mergeModuleItems,
  processModuleData,
  validateModule,
  validateModules
} from './module-core';
import {
  findActiveInstances,
  hasActiveInstances,
  addModule,
  removeModule,
  toggleModule,
  saveModuleState
} from './module-operations';

// Export public API
export {
  // Constants
  MODULE_TYPES,
  MODULE_CONFIG,
  
  // Core functions
  getModuleType,
  isModule,
  allowsMultipleInstances,
  getCanonicalKey,
  generateInstanceId,
  createPaneId,
  getInstanceId,
  
  // Operations
  findActiveInstances,
  hasActiveInstances,
  addModule,
  removeModule,
  toggleModule,
  saveModuleState,
  
  // Utilities
  filterByActiveModules,
  mergeModuleItems,
  processModuleData,
  validateModule,
  validateModules
};