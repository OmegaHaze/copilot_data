import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

import { useEffect, useMemo, useCallback, useState } from 'react';
import { useDragDisable } from '../Context/DragDisableContext.jsx';
import { breakpoints, cols } from './GridUtils.js';
import { isValidLayoutItem } from './LayoutTransformer.js';
import { useError } from '../../../Error-Handling/Diagnostics/ErrorNotificationSystem.jsx';
// DefaultPane removed - we should dynamically render panes instead
import PaneErrorBoundaryWithHooks from '../ErrorHandling/PaneErrorBoundary.jsx';
import { ErrorType, ErrorSeverity } from '../../../Error-Handling/Diagnostics/types/errorTypes';
import { componentRegistry } from './ComponentRegistry.js';

// Apply width provider HOC for responsive behavior
const ResponsiveGridLayout = WidthProvider(Responsive);

// Default row height for grid
const DEFAULT_ROW_HEIGHT = 60;

// Module type style classes
const MODULE_TYPE_STYLE_CLASSES = {
  SYSTEM: 'bg-blue-800/10',
  SERVICE: 'bg-purple-800/10',
  USER: 'bg-yellow-800/10',
  default: 'bg-gray-700/10'
};

/**
 * ServiceGrid Component
 * Renders a responsive grid of service panes
 */
export default function ServiceGrid({
  layouts = {},
  onLayoutChange,
  services = [],
  modules = { SYSTEM: [], SERVICE: [], USER: [] },
  paneMap = {},
  logoUrls = {},
  activeModules = []
}) {
  const { isDragDisabled } = useDragDisable();
  const { showError } = useError();
  const [initialized, setInitialized] = useState(false);

  // Initialize registry on mount
  useEffect(() => {
    const initRegistry = async () => {
      try {
        if (!componentRegistry.isInitialized()) {
          await componentRegistry.initialize();
        }
        setInitialized(true);
      } catch (err) {
        showError(
          `Failed to initialize component registry: ${err.message}`,
          ErrorType.SYSTEM,
          ErrorSeverity.HIGH
        );
        // Still mark initialized to avoid blocking render
        setInitialized(true);
      }
    };
    
    initRegistry();
  }, [showError]);
  
  // Ensure each breakpoint in layouts is an array
  const safeLayouts = useMemo(() => {
    const result = {};
    Object.keys(cols).forEach(bp => {
      result[bp] = Array.isArray(layouts[bp]) ? 
        layouts[bp].filter(isValidLayoutItem) : [];
    });
    return result;
  }, [layouts]);

  // Get module key in a consistent way
  const getModuleKey = useCallback((item) => {
    if (!item) return '';
    const identifier = item.moduleType || 
                      (item.i && item.i.includes('-') ? item.i.split('-')[0] : null) ||
                      item.module_type || 
                      item.module || 
                      item.name;
    return identifier ? identifier.toLowerCase() : '';
  }, []);

  // Add a pane to rendered items
  const addPane = useCallback((item, type, panes) => {
    if (!item) return;
    
    // Get unique ID for this pane
    const gridItemId = item.i || `${type}-${Date.now()}`;
    
    // Get the canonical module key
    const moduleKey = getModuleKey(item);
    if (!moduleKey) return;
    
    // Get styling based on module type
    const logo = item.logoUrl || logoUrls[moduleKey];
    const className = MODULE_TYPE_STYLE_CLASSES[type] || MODULE_TYPE_STYLE_CLASSES.default;
    
    // Extract staticIdentifier from item or from gridItemId (formatted as moduleType-staticIdentifier-instanceId)
    const gridIdParts = gridItemId.split('-');
    const staticIdentifier = item.staticIdentifier || (gridIdParts.length > 1 ? gridIdParts[1] : moduleKey);
    
    // Create standardized props for component
    const props = {
      slug: moduleKey,
      _gridId: gridItemId,
      name: item.name || item.module || moduleKey || 'Unnamed',
      logo,
      moduleData: { ...item, module_type: moduleKey, staticIdentifier },
      status: typeof item.status === 'string' ? item.status : 'Unknown',
      moduleType: moduleKey,
      staticIdentifier
    };

    // Get the component from paneMap
    const Component = paneMap[moduleKey];
    
    // Add wrapped component to panes array
    panes.push(
      <div key={gridItemId} className={className}>
        <PaneErrorBoundaryWithHooks 
          paneName={props.name || moduleKey}
          moduleType={moduleKey}
          onRetry={() => {
            if (window.reloadComponentByName) {
              window.reloadComponentByName(moduleKey);
            }
          }}
        >
          {Component && typeof Component === 'function' ? (
            <Component {...props} />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-800/60 text-gray-400 text-sm">
              <div className="text-center p-4">
                <span className="block">Component failed to load</span>
                <span className="block text-gray-500 text-xs mt-1">{moduleKey}</span>
              </div>
            </div>
          )}
        </PaneErrorBoundaryWithHooks>
      </div>
    );
  }, [getModuleKey, paneMap, logoUrls]);

  // Render all panes based on services, layout items and modules
  const renderAll = useCallback(() => {
    const panes = [];
    const renderedIds = new Set();
    
    // Helper to safely add a pane
    const safeAddPane = (item, type) => {
      if (!item) return;
      
      // Skip items without proper identifier
      const itemId = item.i || 
                    (item.module && `${item.module}-${Date.now()}`) || 
                    (item._id && `item-${item._id}`);
                    
      if (!itemId) return;
      
      // Prevent duplicate panes
      if (renderedIds.has(itemId)) return;
      
      // Track this ID
      renderedIds.add(itemId);
      
      // Add the pane
      addPane(item, type, panes);
    };
    
    // Add services first
    if (Array.isArray(services)) {
      services.forEach(svc => safeAddPane(svc, 'SERVICE'));
    }

    // Add items from saved layouts
    if (Array.isArray(safeLayouts.lg)) {
      safeLayouts.lg.forEach(layoutItem => {
        if (layoutItem && layoutItem.i) {
          // Create enhanced layout item with module type properties
          const moduleType = getModuleKey(layoutItem);
          const enhancedItem = { 
            ...layoutItem,
            moduleType,
            module_type: moduleType,
            module: moduleType
          };
          
          // Add to panes
          safeAddPane(enhancedItem, moduleType || 'layout');
        }
      });
    }
    
    // Add modules from each category
    if (modules) {
      // Add system modules
      if (Array.isArray(modules.SYSTEM)) {
        modules.SYSTEM.forEach(mod => safeAddPane(mod, 'SYSTEM'));
      }
      
      // Add service modules (only installed ones)
      if (Array.isArray(modules.SERVICE)) {
        modules.SERVICE
          .filter(m => m.is_installed)
          .forEach(mod => safeAddPane(mod, 'SERVICE'));
      }
      
      // Add user modules
      if (Array.isArray(modules.USER)) {
        modules.USER.forEach(mod => safeAddPane(mod, 'USER'));
      }
    }

    return panes;
  }, [safeLayouts, services, modules, addPane, getModuleKey]);

  // Handle layout changes
  const handleLayoutChange = useCallback((_, allLayouts) => {
    if (onLayoutChange) {
      onLayoutChange(allLayouts);
    }
  }, [onLayoutChange]);

  // Check if we have any active modules but no valid layouts items
  const hasActiveModulesButNoLayouts = 
    Array.isArray(activeModules) && 
    activeModules.length > 0 && 
    Object.values(safeLayouts).every(
      items => !items || !items.length
    );

  // Loading state
  if (!initialized) {
    return (
      <div className="p-6 text-center rounded-lg border border-green-800/30 bg-black/30">
        <h3 className="text-lg font-mono text-green-500">Initializing Grid</h3>
      </div>
    );
  }

  // No layouts - show empty state
  const hasLayoutItems = Object.values(safeLayouts).some(
    items => Array.isArray(items) && items.length > 0
  );
  
  if (!hasLayoutItems) {
    return (
      <div className="p-6 text-center rounded-lg border border-green-800/30 bg-black/30">
        <h3 className="text-lg font-mono text-green-500">Grid Layouts Empty</h3>
        
        {hasActiveModulesButNoLayouts ? (
          <div>
            <p className="text-green-400 mb-2">
              You have {activeModules.length} active module(s) but no layouts data.
            </p>
            <div className="mt-4">
              <button
                onClick={() => window.location.reload()}
                className="px-3 py-1 bg-green-700 text-white rounded hover:bg-green-600"
              >
                Reload Dashboard
              </button>
            </div>
          </div>
        ) : (
          <p className="text-green-400">
            Use the modules section in the left sidebar to launch components.
          </p>
        )}
      </div>
    );
  }

  // List of components to render
  const renderedComponents = renderAll();

  // Main render - grid
  return (
    <div className="w-full mx-auto relative">
      {renderedComponents.length > 0 ? (
        <ResponsiveGridLayout
          className="layouts"
          layouts={safeLayouts}
          breakpoints={breakpoints}
          cols={cols}
          rowHeight={DEFAULT_ROW_HEIGHT}
          margin={[10, 10]}
          containerPadding={[10, 10]}
          onLayoutChange={handleLayoutChange}
          compactType={null}
          preventCollision
          isDraggable={!isDragDisabled}
          isResizable={!isDragDisabled}
          draggableHandle=".pane-drag-handle"
        >
          {renderedComponents}
        </ResponsiveGridLayout>
      ) : (
        <div className="p-6 text-center rounded-lg border border-green-800/30 bg-black/30">
          <h3 className="text-lg font-mono text-green-500">No Components</h3>
          <p className="text-green-400">
            No components were loaded. Check console for errors.
          </p>
        </div>
      )}
    </div>
  );
}