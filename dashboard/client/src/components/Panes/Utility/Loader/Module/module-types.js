/**
 * TypeScript definitions converted to JSDoc for the module system
 */

/**
 * @typedef {'SYSTEM' | 'SERVICE' | 'USER'} ModuleType
 */

/**
 * @typedef {Object} ModuleConfig
 * @property {boolean} isPersistent
 * @property {boolean} allowMultiple
 */

/**
 * @typedef {Object} ModuleItem
 * @property {string} [name]
 * @property {string} [module]
 * @property {string} [description]
 * @property {Object.<string, any>} [key]
 */

/**
 * @typedef {Object} ModulesCollection
 * @property {ModuleItem[]} SYSTEM
 * @property {ModuleItem[]} SERVICE
 * @property {ModuleItem[]} USER
 * @property {Object.<string, ModuleItem[]>} [key]
 */

/**
 * @typedef {Object} ToggleResult
 * @property {string[]} activeModules
 * @property {any} gridLayout
 * @property {string} [paneId]
 * @property {string[]} [removedInstances]
 * @property {'added' | 'removed' | 'unchanged'} action
 */

/**
 * @typedef {Object} AddModuleResult
 * @property {string[]} activeModules
 * @property {any} gridLayout
 * @property {string} paneId
 */

/**
 * @typedef {Object} RemoveModuleResult
 * @property {string[]} activeModules
 * @property {any} gridLayout
 * @property {string[]} removedInstances
 */
