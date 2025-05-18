# Module System

The `Module` system controls runtime state for dynamic modules in the VAIO dashboard. It manages:

- Toggle logic (add/remove)
- Type-based rules (multi-instance, persistence)
- Cache and layout integration
- Consistent ID/key formatting and validation

---

## 🧩 Design Principles

1. **Immutable State Ops** – All operations return new copies of layout/module state
2. **Centralized Constants** – All config, types, errors live in `module-constants.js`
3. **No Side Effects in Core** – Shared helpers are pure and stateless
4. **All Control via Index** – Consumers only use `module-index.js`

---

## 📁 Files

| File | Purpose |
|------|---------|
| `module-index.js`       | Public interface to the module system |
| `module-core.js`        | Core ID, filtering, and validation logic |
| `module-shared.js`      | Stateless helpers for ID parsing and validation |
| `module-operations.js`  | High-level toggle + layout sync logic |
| `module-toggle.jsx`     | React component to toggle modules in UI |
| `module-constants.js`   | Defines types, config, storage keys |
| `module-types.js`       | Pure JSDoc typedefs, no runtime logic |

---

## 🔄 Data Flow

1. **User click**: `ModuleToggle` triggers toggle
2. **Toggle logic**: `addModule()` or `removeModule()` modifies state
3. **Grid layout**: updated in-place and saved via `saveModuleState()`
4. **Storage**: module metadata can be cached and loaded from `localStorage`

---

## 🧪 Public API (from `module-index.js`)

```ts
function getModuleType(key): ModuleType
function isModule(key, type): boolean
function allowsMultipleInstances(key): boolean
function getCanonicalKey(moduleKey): string
function createPaneId(type, instanceId): string
function getInstanceId(paneId): string

function findActiveInstances(type, activeModules): string[]
function hasActiveInstances(type, activeModules): boolean
function addModule(type, activeModules, gridLayout): AddModuleResult
function removeModule(type, activeModules, gridLayout): RemoveModuleResult
function toggleModule(type, activeModules, gridLayout): ToggleResult

function mergeModuleItems(modules): ModuleItem[]
function validateModule(mod): boolean
function validateModules(array): boolean

function saveModuleState(gridLayout, activeModules): Promise<boolean>
function cacheModuleData(data): boolean
function loadCachedModuleData(): ModulesCollection | null



## 💡 Behavior Rules

| Module Type | Persistent | Allow Multiple |
|-------------|------------|----------------|
| SYSTEM      | ✅         | ✅             |
| SERVICE     | ✅         | ✅             |
| USER        | ✅         | ✅             |

All modules behave the same way: 
- They can all be launched multiple times
- They all remain active unless explicitly removed
