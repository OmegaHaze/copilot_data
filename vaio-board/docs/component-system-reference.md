# VAIO Board Component System - Reference Index

This document provides an organized index of all the commented sections in the VAIO Board component system, organized by module and responsibility.

## Component Registry System (CR)

| ID | File | Description | Responsibility |
|----|------|-------------|----------------|
| CR-001 | `ComponentRegistry.jsx` | Core singleton for dynamic component management | System definition |
| CR-002 | `ComponentRegistry.jsx` | Registry initialization and constructor | Data structure setup |
| CR-003 | `ComponentRegistry.jsx` | Module type categorization (SYSTEM, SERVICE, USER) | Component organization |
| CR-004 | `ComponentRegistry.jsx` | Module metadata storage | Component metadata |
| CR-005 | `ComponentRegistry.jsx` | Registry initialization | Startup |
| CR-006 | `ComponentRegistry.jsx` | Error handler registration | Error handling |
| CR-007 | `ComponentRegistry.jsx` | Standardized error reporting | Error handling |
| CR-008 | `ComponentRegistry.jsx` | Module type normalization | String processing |
| CR-009 | `ComponentRegistry.jsx` | Component registration | Registry management |
| CR-010 | `ComponentRegistry.jsx` | Component retrieval | Registry access |
| CR-011 | `ComponentRegistry.jsx` | Component rendering | UI rendering |
| CR-012 | `ComponentRegistry.jsx` | Error placeholder rendering | UI fallback |
| CR-013 | `ComponentRegistry.jsx` | Dynamic component loading | Import management |
| CR-014 | `ComponentRegistry.jsx` | Component error storage | Error handling |

## Service Grid System (SG)

| ID | File | Description | Responsibility |
|----|------|-------------|----------------|
| SG-001 | `ServiceGrid.jsx` | Main grid component | Container definition |
| SG-002 | `ServiceGrid.jsx` | Responsive grid configuration | Layout responsiveness |
| SG-003 | `ServiceGrid.jsx` | Module style classes | Visual presentation |
| SG-004 | `ServiceGrid.jsx` | Grid component definition | Component structure |
| SG-005 | `ServiceGrid.jsx` | Registry initialization | Startup sequence |
| SG-006 | `ServiceGrid.jsx` | Layout sanitization | Data validation |
| SG-007 | `ServiceGrid.jsx` | Module key extraction | ID parsing |
| SG-008 | `ServiceGrid.jsx` | Pane rendering | Component mounting |
| SG-009 | `ServiceGrid.jsx` | Active panes rendering | Visibility control |
| SG-010 | `ServiceGrid.jsx` | Layout change handler | User interaction |

## Layout Management (LM)

| ID | File | Description | Responsibility |
|----|------|-------------|----------------|
| LM-001 | `LayoutManager.js` | Layout persistence manager | Storage definition |
| LM-003 | `LayoutManager.js` | Breakpoint validation | Data validation |
| LM-004 | `LayoutManager.js` | Layout item validation | Data validation |
| LM-005 | `LayoutManager.js` | Session layout persistence | API integration |
| LM-006 | `LayoutManager.js` | Layout validation before save | Data validation |
| LM-007 | `LayoutManager.js` | Module ID validation | String processing |
| LM-008 | `LayoutManager.js` | API payload preparation | API integration |
| LM-009 | `LayoutManager.js` | API request execution | Network communication |

## Layout Positioning (LP)

| ID | File | Description | Responsibility |
|----|------|-------------|----------------|
| LP-001 | `LayoutPositioning.js` | Layout positioning utilities | Position calculation |
| LP-002 | `LayoutPositioning.js` | Module size configuration | Size definitions |
| LP-003 | `LayoutPositioning.js` | Module size retrieval | Helper methods |
| LP-004 | `LayoutPositioning.js` | Optimal position calculation | Algorithm |

## Layout Transformation (LT)

| ID | File | Description | Responsibility |
|----|------|-------------|----------------|
| LT-001 | `LayoutTransformer.js` | Layout transformer | Data processing |
| LT-002 | `LayoutTransformer.js` | Empty layout creator | Initialization |
| LT-003 | `LayoutTransformer.js` | Item validator | Data validation |
| LT-004 | `LayoutTransformer.js` | Layout structure validator | Data validation |
| LT-005 | `LayoutTransformer.js` | Layout hydrator | Data transformation |
| LT-006 | `LayoutTransformer.js` | Layout sanitizer | Data cleanup |

## Session Management (SM)

| ID | File | Description | Responsibility |
|----|------|-------------|----------------|
| SM-001 | `SessionManager.js` | Session manager | State management |
| SM-002 | `SessionManager.js` | Session data fetcher | API integration |
| SM-003 | `SessionManager.js` | Initial settings load | Startup |
| SM-004 | `SessionManager.js` | Session API call | Network communication |
| SM-005 | `SessionManager.js` | Session refresher | State synchronization |
| SM-006 | `SessionManager.js` | Session API request | Network communication |
| SM-007 | `SessionManager.js` | State updater | React state management |
| SM-008 | `SessionManager.js` | Grid layout updater | UI state management |

## Settings Loading (SL)

| ID | File | Description | Responsibility |
|----|------|-------------|----------------|
| SL-001 | `SettingsLoader.js` | Settings loader | Configuration loading |
| SL-002 | `SettingsLoader.js` | API endpoints | URL definitions |
| SL-003 | `SettingsLoader.js` | Session data loader | Data fetching |
| SL-004 | `SettingsLoader.js` | Session API call | Network communication |
| SL-005 | `SettingsLoader.js` | Data extraction | Response processing |
| SL-006 | `SettingsLoader.js` | Grid layout updater | State management |
| SL-007 | `SettingsLoader.js` | Active modules updater | State management |
| SL-008 | `SettingsLoader.js` | Error handler | Error fallback |

## Context Providers (CTX)

| ID | File | Description | Responsibility |
|----|------|-------------|----------------|
| CTX-001 | `SettingsContext.jsx` | Settings context definition | React context |
| CTX-002 | `SettingsContext.jsx` | Initial state setup | Default values |
| CTX-003 | `SettingsContext.jsx` | Layout state | Grid layout state |
| CTX-004 | `SettingsContext.jsx` | Module state | Active modules tracking |
| CTX-005 | `SettingsContext.jsx` | Context provider | React provider component |

## Launcher Components

### Supervisor Launcher (LBS)

| ID | File | Description | Responsibility |
|----|------|-------------|----------------|
| LBS-001 | `LaunchButtonSuper.jsx` | Supervisor launch button | Component definition |
| LBS-002 | `LaunchButtonSuper.jsx` | Context access | React context usage |
| LBS-003 | `LaunchButtonSuper.jsx` | Launch handler | Core functionality |
| LBS-004 | `LaunchButtonSuper.jsx` | Module identification | ID generation |
| LBS-005 | `LaunchButtonSuper.jsx` | Duplicate prevention | Validation |
| LBS-006 | `LaunchButtonSuper.jsx` | Unique ID generation | ID creation |
| LBS-007 | `LaunchButtonSuper.jsx` | Grid layout validation | Data validation |
| LBS-008 | `LaunchButtonSuper.jsx` | Layout item creation | Position calculation |
| LBS-009 | `LaunchButtonSuper.jsx` | Breakpoint processing | Multi-viewport handling |
| LBS-010 | `LaunchButtonSuper.jsx` | State update | UI state management |
| LBS-011 | `LaunchButtonSuper.jsx` | Backend persistence | API integration |
| LBS-012 | `LaunchButtonSuper.jsx` | Socket notification | Realtime updates |

### NVIDIA Launcher (LBN)

| ID | File | Description | Responsibility |
|----|------|-------------|----------------|
| LBN-001 | `LaunchButtonNvidia.jsx` | NVIDIA launch button | Component definition |
| LBN-002 | `LaunchButtonNvidia.jsx` | Dynamic importing | Code splitting |
| LBN-003 | `LaunchButtonNvidia.jsx` | Context access | React context usage |
| LBN-004 | `LaunchButtonNvidia.jsx` | Launch handler | Core functionality |
| LBN-005 | `LaunchButtonNvidia.jsx` | Module identification | ID generation |
| LBN-006 | `LaunchButtonNvidia.jsx` | Duplicate prevention | Validation |
| LBN-007 | `LaunchButtonNvidia.jsx` | Unique ID generation | ID creation |
| LBN-008 | `LaunchButtonNvidia.jsx` | Dynamic loading | On-demand utilities |
| LBN-009 | `LaunchButtonNvidia.jsx` | Layout item creation | Position calculation |
| LBN-010 | `LaunchButtonNvidia.jsx` | Breakpoint processing | Multi-viewport handling |
| LBN-011 | `LaunchButtonNvidia.jsx` | State update | UI state management |
| LBN-012 | `LaunchButtonNvidia.jsx` | Backend persistence | API integration |

## Backend Integration

### Session API Routes (SES)

| ID | File | Description | Responsibility |
|----|------|-------------|----------------|
| SES-001 | `/backend/routes/layout/routes_session.py` | Session API router | API definition |
| SES-002 | `/backend/routes/layout/routes_session.py` | Get session endpoint | Data retrieval |
| SES-003 | `/backend/routes/layout/routes_session.py` | Update session endpoint | Data update |
| SES-004 | `/backend/routes/layout/routes_session.py` | Update grid layout endpoint | Partial update |
| SES-005 | `/backend/routes/layout/routes_session.py` | Session query | Database access |
| SES-006 | `/backend/routes/layout/routes_session.py` | Session creation | Data creation |
| SES-007 | `/backend/routes/layout/routes_session.py` | Session update | Data update |
| SES-008 | `/backend/routes/layout/routes_session.py` | Response formatting | API structure |

### Database Models (DBM)

| ID | File | Description | Responsibility |
|----|------|-------------|----------------|
| DBM-001 | `/backend/db/models.py` | UserSession model | Database model |
| DBM-002 | `/backend/db/models.py` | UserSession metadata | User identification |
| DBM-003 | `/backend/db/models.py` | UserSession grid_layout | Layout storage |
| DBM-004 | `/backend/db/models.py` | UserSession active_modules | Module tracking |
| DBM-005 | `/backend/db/models.py` | UserSession timestamps | Auditing |
| DBM-006 | `/backend/db/models.py` | PaneLayout model | Named layouts |
| DBM-007 | `/backend/db/models.py` | PaneLayout fields | Layout metadata |
