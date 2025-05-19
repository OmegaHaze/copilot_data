/**
 * TypeScript definitions converted to JSDoc for the component system
 */

/**
 * @typedef {'SYSTEM' | 'SERVICE' | 'USER'} ModuleType
 */

/**
 * @typedef {Object} ComponentModule
 * @property {string} module
 * @property {string} [name]
 * @property {string} [description]
 * @property {string} [staticIdentifier]
 * @property {string} [paneComponent]
 * @property {string} [logoUrl]
 * @property {ModuleType} [module_type]
 * @property {() => Promise<any>} [loadComponent]
 * @property {Object.<string, any>} [key]
 */

/**
 * @typedef {Object} ModuleData
 * @property {ComponentModule[]} SYSTEM
 * @property {ComponentModule[]} SERVICE
 * @property {ComponentModule[]} USER
 * @property {Object.<string, ComponentModule[]>} [key]
 */

/**
 * @typedef {Object} ParsedPaneId
 * @property {string} moduleType
 * @property {string} staticIdentifier
 * @property {string | null} instanceId
 * @property {string} fullId
 */

/**
 * @typedef {Object} ComponentResolution
 * @property {React.ComponentType<any>} Component
 * @property {Object} props
 * @property {string} props.key
 * @property {string} props.slug
 * @property {string} props.moduleType
 * @property {string} props.staticIdentifier
 * @property {any} props.moduleData
 * @property {Object.<string, any>} [props.key]
 */

/**
 * @typedef {Object} InitResult
 * @property {boolean} success
 * @property {number} componentCount
 * @property {Object.<string, any>} [paneMap]
 * @property {ModuleData} [moduleData]
 * @property {Object.<string, string>} [logoUrls]
 * @property {string} [error]
 */

/**
 * @typedef {Object} LoadResult
 * @property {React.ComponentType<any> | null} component
 * @property {string} moduleType
 * @property {string} staticIdentifier
 * @property {string} [paneId]
 */

/**
 * @typedef {Object} ActiveComponent
 * @property {string} id
 * @property {string} moduleType
 * @property {string} staticIdentifier
 * @property {string} [name]
 * @property {string} [description]
 * @property {Object.<string, any>} [key]
 */
