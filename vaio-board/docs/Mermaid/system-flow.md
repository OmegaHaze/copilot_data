flowchart TD
    %% Main Components
    A[main.jsx] -->|Wraps with| B(ErrorProvider)
    B -->|Renders| C(App.jsx)
    C -->|Contains| D(ServiceMatrix)
    C -->|Contains| E(SidePanels)
    
    %% Error System Core Components
    B -->|Initializes| F[Error Store]
    B -->|Registers| O[window.__VAIO_ERROR_SYSTEM__]
    B -->|Renders| G[ErrorDisplay]
    
    %% Error Sources
    D -->|Calls| H[useError Hook]
    E -->|Calls| H
    I[Socket Events] -->|Trigger| J[Error Handlers]
    J -->|Call| H
    R[Console Overrides] -->|Call| H
    
    %% Error Processing Flow
    H -->|showError| S[Error Processing]
    S -->|1. Skip if dismissed| T{In dismissedErrors?}
    T -->|Yes| U[Skip Error]
    T -->|No| V{In shownErrors?}
    V -->|Yes| U
    V -->|No| W[Add New Error]
    W -->|Update| F
    
    %% Error Rendering
    F -->|Maps errors to| G
    G -->|Renders| X[ErrorItem]
    X -->|Animation| Y[Fly-up Animation]
    
    %% Error Dismissal
    X -->|hideError| Z[Error Dismissal]
    Z -->|Mark as dismissed| F
    
    %% Problem Zones
    O -.->|Global Access| P[Debug Utils]
    O -.->|Used by| Q[ComponentRegistry.jsx]
    R -.->|May inject benign logs| AA[False Positives]
    Z -.->|May resurface| BB[Unless suppressed]
    
    %% Styling
    classDef problem fill:#f9a,stroke:#f66,stroke-width:2px;
    class O,R,AA,BB problem;
    
    classDef store fill:#bbf,stroke:#55f,stroke-width:1px;
    classDef provider fill:#bfb,stroke:#5c5,stroke-width:1px;
    classDef component fill:#ddd,stroke:#999,stroke-width:1px;
    classDef hook fill:#fcb,stroke:#f95,stroke-width:1px;
    
    class F store;
    class B provider;
    class A,C,D,E,G,I,X component;
    class H hook;