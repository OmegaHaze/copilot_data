/**
 * component-types.d.ts
 * TypeScript definitions for the component system
 */

// Module type
export type ModuleType = 'SYSTEM' | 'SERVICE' | 'USER';

// Component module
export interface ComponentModule {
  module: string;
  name?: string;
  description?: string;
  staticIdentifier?: string;
  paneComponent?: string;
  logoUrl?: string;
  module_type?: ModuleType;
  loadComponent?: () => Promise<any>;
  [key: string]: any;
}

// Module data
export interface ModuleData {
  SYSTEM: ComponentModule[];
  SERVICE: ComponentModule[];
  USER: ComponentModule[];
  [key: string]: ComponentModule[];
}

// Parsed pane ID
export interface ParsedPaneId {
  moduleType: string;
  staticIdentifier: string;
  instanceId: string | null;
  fullId: string;
}

// Component resolution result
export interface ComponentResolution {
  Component: React.ComponentType<any>;
  props: {
    key: string;
    slug: string;
    moduleType: string;
    staticIdentifier: string;
    moduleData: any;
    [key: string]: any;
  };
}

// Initialization result
export interface InitResult {
  success: boolean;
  componentCount: number;
  paneMap?: Record<string, any>;
  moduleData?: ModuleData;
  logoUrls?: Record<string, string>;
  error?: string;
}

// Component loading result
export interface LoadResult {
  component: React.ComponentType<any> | null;
  moduleType: string;
  staticIdentifier: string;
  paneId?: string;
}

// Active component
export interface ActiveComponent {
  id: string;
  moduleType: string;
  staticIdentifier: string;
  name?: string;
  description?: string;
  [key: string]: any;
}