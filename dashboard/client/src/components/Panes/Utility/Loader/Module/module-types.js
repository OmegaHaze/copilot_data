/**
 * MODULE-FLOW-6.7: Module Types - Type Definitions
 * COMPONENT: Module System - Type Definitions
 * PURPOSE: Provides JSDoc type definitions for the module system
 * FLOW: Used for documentation and development tools
 */

/**
 * MODULE-FLOW-6.7.1: Module Type Definition
 * COMPONENT: Module System - Type Definitions
 * PURPOSE: Defines module type enum in JSDoc format
 * FLOW: Used throughout module system for typing
 * 
 * @typedef {'SYSTEM' | 'SERVICE' | 'USER'} ModuleType
 */

/**
 * MODULE-FLOW-6.7.2: Module Configuration Definition
 * COMPONENT: Module System - Type Definitions
 * PURPOSE: Defines module configuration structure
 * FLOW: Used for module configuration options
 * 
 * @typedef {Object} ModuleConfig
 * @property {boolean} isPersistent - Whether module state persists
 * @property {boolean} allowMultiple - Whether multiple instances are allowed
 */

/**
 * MODULE-FLOW-6.7.3: Module Item Definition
 * COMPONENT: Module System - Type Definitions
 * PURPOSE: Defines module item structure
 * FLOW: Used for representing module metadata
 * 
 * @typedef {Object} ModuleItem
 * @property {string} [name] - Display name
 * @property {string} [module] - Internal module identifier
 * @property {string} [description] - Module description
 * @property {Object.<string, any>} [key] - Additional properties
 */

/**
 * MODULE-FLOW-6.7.4: Modules Collection Definition
 * COMPONENT: Module System - Type Definitions
 * PURPOSE: Defines module collection structure
 * FLOW: Used for grouping modules by type
 * 
 * @typedef {Object} ModulesCollection
 * @property {ModuleItem[]} SYSTEM - System modules
 * @property {ModuleItem[]} SERVICE - Service modules
 * @property {ModuleItem[]} USER - User modules
 * @property {Object.<string, ModuleItem[]>} [key] - Additional types
 */

/**
 * MODULE-FLOW-6.7.5: Toggle Result Definition
 * COMPONENT: Module System - Type Definitions
 * PURPOSE: Defines result of toggle operation
 * FLOW: Used for toggle operation results
 * 
 * @typedef {Object} ToggleResult
 * @property {string[]} activeModules - Updated active modules
 * @property {any} gridLayout - Updated grid layout
 * @property {string} [paneId] - New pane ID if added
 * @property {string[]} [removedInstances] - Removed instances if removed
 * @property {'added' | 'removed' | 'unchanged'} action - Action performed
 */

/**
 * MODULE-FLOW-6.7.6: Add Module Result Definition
 * COMPONENT: Module System - Type Definitions
 * PURPOSE: Defines result of add operation
 * FLOW: Used for add module operation results
 * 
 * @typedef {Object} AddModuleResult
 * @property {string[]} activeModules - Updated active modules
 * @property {any} gridLayout - Updated grid layout
 * @property {string} paneId - New pane ID
 */

/**
 * MODULE-FLOW-6.7.7: Remove Module Result Definition
 * COMPONENT: Module System - Type Definitions
 * PURPOSE: Defines result of remove operation
 * FLOW: Used for remove module operation results
 * 
 * @typedef {Object} RemoveModuleResult
 * @property {string[]} activeModules - Updated active modules
 * @property {any} gridLayout - Updated grid layout
 * @property {string[]} removedInstances - Removed instance IDs
 */