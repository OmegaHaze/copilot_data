# Session System

The `Session` module manages all session-related state for the VAIO dashboard, including:
- API interaction with the backend session state
- Persistence via sessionStorage and localStorage
- Runtime sync logic and React context integration
- Stateless validation and transformation logic

---

## 🔩 Design Principles

1. **Separation of Concerns** – API, storage, and logic layers are isolated
2. **Single Source of Truth** – All constants and storage keys come from a shared source
3. **Safe I/O** – All fetch and storage calls are wrapped in error-safe utility functions
4. **Pure Helpers** – Stateless transformation/validation lives in `session-shared.js`
5. **Clean Entry Point** – Consumers access all functionality through `session-index.js`

---

## 📁 Files

| File | Purpose |
|------|---------|
| `session-api.js`        | API fetches + updates with safe error handling |
| `session-storage.js`    | Handles browser storage for session data |
| `session-manager.js`    | Central sync layer between frontend and backend |
| `session-context.js`    | React context for providing session state |
| `session-shared.js`     | Stateless functions for validation and transformation |
| `session-index.js`      | Unified consumer API (`loadSession`, `saveSessionLayouts`, etc.) |
| `session-types.js`      | JSDoc-style type definitions |

---

## 🔄 Data Flow

1. **Initial Load**: `loadSession()` attempts cached session first, then syncs via API
2. **On Update**: `saveSessionLayouts()` and `saveSessionModules()` push to backend and persist to sessionStorage
3. **Reset**: `clearSession()` clears all cached session data

---

## 🧪 Exposed API (from `session-index.js`)

```ts
async function loadSession(): Promise<SessionData>;
async function saveSessionLayouts(layouts: Layouts): Promise<void>;
async function saveSessionModules(modules: string[]): Promise<void>;
function clearSession(): boolean;
