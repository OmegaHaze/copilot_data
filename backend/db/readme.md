flowchart TD
    %% Define layers and subgraphs
    subgraph DatabaseLayer["Database Layer (MODULE-FLOW-1.x)"]
        MOD1.1[ModuleType Enum]
        MOD1.2[User Model]
        MOD1.3[Module Model]
        MOD1.4[Service Model]
        MOD1.5[UserSession Model]
        MOD1.6[PaneLayout Model]
        MOD1.7[ServiceError Model]
    end
    
    subgraph RegistryLayer["Service Registry Layer (MODULE-FLOW-3.x)"]
        MOD3.1[Service Registry]
        MOD3.1.1[Service Listing]
        MOD3.1.2[Module Listing]
    end
    
    subgraph RouterLayer["Router Layer (MODULE-FLOW-2.0)"]
        MOD2.0[Main Router]
    end
    
    subgraph ModuleRoutesLayer["Module Routes Layer (MODULE-FLOW-2.x)"]
        MOD2.1[Module Management Router]
        MOD2.2[Module API Router]
        MOD2.3[Module Installer Router]
        MOD2.4[Database Reset Router]
    end
    
    subgraph ServiceManagerLayer["Service Manager Layer (MODULE-FLOW-4.x)"]
        MOD4.1[Service Manager]
        MOD4.1.1[Module Status Check]
        MOD4.1.2[Start Service]
        MOD4.1.3[Stop Service]
        MOD4.1.4[Uninstall Service]
    end
    
    subgraph SocketLayer["Socket Layer (MODULE-FLOW-5.x)"]
        MOD5.1[Socket Router]
        MOD5.2[Module Socket Handler]
        MOD5.3[Module Tracker]
        MOD5.4[Module Registry]
    end
    
    %% Database Layer internal connections
    MOD1.1 --> MOD1.3
    MOD1.2 --> MOD1.3
    MOD1.3 --> MOD1.4
    MOD1.2 --> MOD1.5
    MOD1.2 --> MOD1.6
    
    %% Registry Layer internal connections
    MOD3.1 --> MOD3.1.1
    MOD3.1 --> MOD3.1.2
    
    %% Service Manager Layer internal connections
    MOD4.1 --> MOD4.1.1
    MOD4.1 --> MOD4.1.2
    MOD4.1 --> MOD4.1.3
    MOD4.1 --> MOD4.1.4
    
    %% Module Routes Layer internal connections
    MOD2.1 --> MOD2.1.1[Registry Endpoint]
    MOD2.1 --> MOD2.1.2[Visible Modules]
    MOD2.1 --> MOD2.1.3[Install Endpoint]
    MOD2.1 --> MOD2.1.4[Uninstall Endpoint]
    MOD2.1 --> MOD2.1.5[Start Endpoint]
    MOD2.1 --> MOD2.1.6[Stop Endpoint]
    
    %% Socket Layer internal connections
    MOD5.1 --> MOD5.2
    MOD5.2 --> MOD5.3
    MOD5.2 --> MOD5.4
    
    %% Cross-layer connections
    %% Database Layer to Registry Layer
    MOD1.3 -.-> MOD3.1
    MOD1.4 -.-> MOD3.1
    MOD1.5 -.-> MOD3.1
    
    %% Registry Layer to Router Layer
    MOD3.1 -.-> MOD2.0
    
    %% Router Layer to Module Routes Layer
    MOD2.0 -.-> MOD2.1
    MOD2.0 -.-> MOD2.2
    MOD2.0 -.-> MOD2.3
    MOD2.0 -.-> MOD2.4
    
    %% Module Routes Layer to Service Manager Layer
    MOD2.1 -.-> MOD4.1
    MOD2.3 -.-> MOD4.1
    
    %% Service Manager to Socket Layer
    MOD4.1 -.-> MOD5.2
    
    %% Feedback loops
    %% Socket Layer back to Service Manager 
    MOD5.2 -.-> MOD4.1
    
    %% Module Routes to Registry
    MOD2.1 -.-> MOD3.1
    MOD2.2 -.-> MOD3.1
    MOD2.3 -.-> MOD3.1
    
    %% Module Tracker to Registry
    MOD5.3 -.-> MOD3.1
    
    %% Service Manager to Registry
    MOD4.1 -.-> MOD3.1
    
    %% Data flow paths - make different color/style for clarity
    MOD1.3 -. "Module Data Flow" .-> MOD3.1
    MOD3.1 -. "Module Data Flow" .-> MOD2.1
    MOD2.1 -. "Control Flow" .-> MOD4.1
    MOD4.1 -. "Status Flow" .-> MOD5.2
    MOD5.2 -. "Realtime Updates" .-> MOD5.4
    
    %% Legend
    classDef primary fill:#f9f,stroke:#333,stroke-width:2px
    classDef secondary fill:#bbf,stroke:#333,stroke-width:1px
    
    class MOD1.3,MOD3.1,MOD4.1,MOD5.2 primary
    class MOD1.1,MOD1.2,MOD1.4,MOD1.5,MOD1.6,MOD1.7 secondary