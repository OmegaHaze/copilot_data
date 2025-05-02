/**
 * ServiceGrid - Core component for rendering the grid of panes/modules
 * Handles layout management and pane rendering with React Grid Layout
 */
import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

import { useEffect, useMemo, useCallback } from 'react';
import { useDragDisable } from '../DragDisableContext.jsx';
import { breakpoints, cols, isValidLayoutItem } from './GridUtils.js';
import ErrorBoundary from '../../../Error-Handling/ErrorBoundary.jsx';
import { getBaseModuleType } from './ComponentRegistry.js';

// Apply width provider HOC for responsive behavior
const ResponsiveGridLayout = WidthProvider(Responsive);

// Default row height for grid
const DEFAULT_ROW_HEIGHT = 60;

// CSS classes for different module types
const MODULE_TYPE_CLASSES = {
  system: 'bg-blue-800/10',
  service: 'bg-purple-800/10',
  user: 'bg-yellow-800/10',
  layout: 'bg-gray-700/10',
  default: 'bg-gray-700/10'
};

/**
 * Validate layout to ensure all items have valid IDs
 * @param {Object} layouts - Layout object to validate
 * @returns {Object} - Validated layout
 */
function validateLayout(layouts) {
  const valid = {};
  Object.entries(cols).forEach(([bp]) => {
    const existing = layouts[bp] || [];
    valid[bp] = existing.filter(item => isValidLayoutItem(item));
  });
  return valid;
}

/**
 * ServiceGrid Component
 * Renders a responsive grid of service panes using react-grid-layout
 */
export default function ServiceGrid({
  layout = {},
  onLayoutChange,
  services = [],
  modules = { system: [], service: [], user: [] },
  paneMap = {},
  logoUrls = {},
  activeModules = []
}) {
  const { isDragDisabled } = useDragDisable();

  // Extract base key from a module/service item
  const getModuleKey = useCallback((item) => {
    // Get base module type from item in priority order
    if (item.moduleType) {
      return item.moduleType.toLowerCase();
    }
    
    if (item.i && item.i.includes('-')) {
      return item.i.split('-')[0].toLowerCase();
    }
    
    if (item.module_type) {
      return item.module_type.toLowerCase();
    }
    
    return (item.module || item.name || '').toLowerCase();
  }, []);

  /**
   * Render a single pane component
   */
  const renderPane = useCallback((key, props, Component, className) => {
    if (!Component || typeof Component !== 'function') {
      console.error(`Invalid component for ${key}`);
      return null;
    }

    return (
      <div key={props._gridId || key} className={className}>
        <ErrorBoundary componentName={`Pane:${key}`}>
          <Component {...props} />
        </ErrorBoundary>
      </div>
    );
  }, []);

  /**
   * Add pane to rendered items
   */
  const addPane = useCallback((item, type, panes) => {
    // Skip invalid items
    if (!item) return;
    
    // Get unique ID for this pane
    const gridItemId = item.i || `${type}-${Date.now()}`;
    
    // Get the module key for component lookup
    const moduleKey = getModuleKey(item);
    
    // Get the component from paneMap
    const Component = paneMap[moduleKey];
    
    // Skip if component not found
    if (!Component) return;
    
    // Get styling based on module type
    const logo = item.logoUrl || logoUrls[moduleKey];
    const className = MODULE_TYPE_CLASSES[type] || MODULE_TYPE_CLASSES.default;
    
    // Extract module type for props
    const moduleType = item.moduleType || item.module_type || 
                        getBaseModuleType(item.i) || 
                        item.module || moduleKey;

    // Create standardized props for component
    const props = {
      slug: moduleKey,
      _gridId: gridItemId,
      name: item.name || item.module || moduleType || 'Unnamed',
      logo,
      moduleData: {
        ...item,
        module_type: moduleType
      },
      status: typeof item.status === 'string' ? item.status : 'Unknown',
      moduleType
    };

    // Render pane and add to collection
    const renderedPane = renderPane(moduleKey, props, Component, className);
    if (renderedPane) {
      panes.push(renderedPane);
    }
  }, [getModuleKey, paneMap, logoUrls, renderPane]);

  /**
   * Render all panes based on services, layout items and modules
   */
  const renderAll = useCallback(() => {
    const panes = [];
    
    // Add services first
    services.forEach(svc => addPane(svc, 'service', panes));

    // Add layout items (from saved layout)
    if (layout?.lg?.length > 0) {
      layout.lg.forEach(layoutItem => {
        if (layoutItem.i) {
          // Create enhanced layout item with module type properties
          const moduleType = getModuleKey(layoutItem);
          const enhancedItem = { 
            ...layoutItem,
            moduleType,
            module_type: moduleType,
            module: moduleType
          };
          
          // Add to panes 
          addPane(enhancedItem, moduleType || 'layout', panes);
        }
      });
    }
    
    // Add modules from each category
    if (modules.system && modules.system.length > 0) {
      modules.system.forEach(mod => addPane(mod, 'system', panes));
    }
    
    if (modules.service && modules.service.length > 0) {
      modules.service
        .filter(m => m.is_installed)
        .forEach(mod => addPane(mod, 'service', panes));
    }
    
    if (modules.user && modules.user.length > 0) {
      modules.user.forEach(mod => addPane(mod, 'user', panes));
    }

    return panes;
  }, [layout, services, modules, addPane]);

  /**
   * Handle layout changes from react-grid-layout
   */
  const handleLayoutChange = useCallback((_, allLayouts) => {
    if (onLayoutChange) {
      onLayoutChange(allLayouts);
    }
  }, [onLayoutChange]);

  // Validate layout to ensure all items are properly formed
  const safeLayout = useMemo(() => {
    const validatedLayout = validateLayout(layout);
    
    // Ensure all breakpoints exist
    Object.keys(cols).forEach(bp => {
      if (!validatedLayout[bp]) validatedLayout[bp] = [];
    });
    
    return validatedLayout;
  }, [layout]);
  
  // Main render method
  return (
    <div className="w-full mx-auto relative">
      <ResponsiveGridLayout
        className="layout"
        layouts={safeLayout}
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
        {renderAll()}
      </ResponsiveGridLayout>
    </div>
  );
}