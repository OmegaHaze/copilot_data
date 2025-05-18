# Component System

The `Component` module dynamically manages pane-rendered components within the VAIO dashboard. It handles:

- Runtime registration of components by module type
- Dynamic imports and error-safe resolution
- Internal registry and logo mapping
- Stateless parsing, validation, and normalization

---

## 🧩 Design Principles

1. **Separation of Runtime and Logic** – Registry and loader are stateful, core helpers are pure
2. **Central Index API** – All external use flows through `component-index.js`
3. **Safe Lazy Loading** – Uses fallback placeholders and background resolution
4. **Single Source of Truth** – All constants and storage keys are centralized

---

## 📁 Core Files

| File | Purpose |
|------|---------|
| `component-index.js`     | Unified entrypoint for external consumers |
| `component-core.js`      | JSX fallback and side-effect helpers (e.g. placeholders) |
| `component-shared.js`    | Stateless validation, parsing, ID handling |
| `component-loader.js`    | Dynamic import + paneId loader |
| `component-operations.js`| High-level resolve/render helpers |
| `component-registry.js`  | Centralized runtime registry and event system |
| `component-api.js`       | Fetches module metadata from API |
| `component-constants.js` | Centralized strings, enums, keys |
| `component-types.js`     | JSDoc typedefs only, no logic |

---

## 🔄 Data Flow

1. **Startup**: `initComponentSystem()` loads registry and fetches module data
2. **On Demand**: `resolvePaneComponent(paneId)` finds and loads a matching component
3. **Render**: `renderComponent(paneId)` renders a registered component, with fallback
4. **Sync**: Logo and module data are cached via registry

---

## 🧪 Exposed API (from `component-index.js`)

```ts
async function initComponentSystem(): Promise<InitResult>;

function loadComponent(moduleType: string, staticIdentifier: string): Promise<Component>;
function resolvePaneComponent(paneId: string): Promise<ComponentResolution | null>;
function renderComponent(paneId: string, props?): JSX.Element;
function getPaneMap(): { [key: string]: Component };
function getLogoMap(): { [key: string]: string };
function getActiveComponents(modules, activeModuleIds): ActiveComponent[];
