// [SG-001] ServiceGrid - Main grid component that renders all panes/modules
import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

import { useEffect, useMemo, useCallback, useState } from 'react';
import { useDragDisable } from '../Context/DragDisableContext.jsx';
import { breakpoints, cols } from './GridUtils.js';
import { isValidLayoutItem } from './LayoutTransformer.js';
import { useError } from '../../../Error-Handling/Diagnostics/ErrorNotificationSystem.jsx';
import PaneErrorBoundaryWithHooks from '../ErrorHandling/PaneErrorBoundary.jsx';
import { ErrorType, ErrorSeverity } from '../../../Error-Handling/Diagnostics/types/errorTypes';
import componentRegistry from './ComponentRegistry.jsx';

// [SG-002] Responsive Grid - Width-adjusted grid for automatic sizing
// Apply width provider HOC for responsive behavior
const ResponsiveGridLayout = WidthProvider(Responsive);

// Default row height for grid
const DEFAULT_ROW_HEIGHT = 60;

// [SG-003] Module Style Classes - Visual differentiation of module types
// Module type style classes
const MODULE_TYPE_STYLE_CLASSES = {
  SYSTEM: 'bg-blue-800/10',
  SERVICE: 'bg-purple-800/10',
  USER: 'bg-yellow-800/10',
  default: 'bg-gray-700/10'
};

// [SG-004] Grid Component Definition - Main responsive pane container
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

  // [SG-005] Registry Initialization - Ensures component registry is ready
  // Initialize registry on mount
  useEffect(() => {
    const initRegistry = async () => {
      try {
        if (!componentRegistry.initialized) {
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
  
  // [SG-006] Layout Sanitization - Ensures valid layouts for all breakpoints
  // Ensure each breakpoint in layouts is an array
  const safeLayouts = useMemo(() => {
    const result = {};
    Object.keys(cols).forEach(bp => {
      result[bp] = Array.isArray(layouts[bp]) ? 
        layouts[bp].filter(isValidLayoutItem) : [];
    });
    return result;
  }, [layouts]);

  // [SG-007] Module Key Extraction - Consistent way to identify modules
  // Get module key in a consistent way
  const getModuleKey = useCallback((item) => {
    if (!item) return '';
    
    const identifier = item.moduleType || 
                      (item.i && item.i.includes('-') ? item.i.split('-')[0] : null) ||
                      item.module_type || 
                      item.module || 
                      item.name;
                      
    return identifier ? componentRegistry.getCanonicalKey(identifier) : '';
  }, []);

  // [SG-008] Pane Rendering - Adds a pane to the grid
  // Add a pane to rendered items
  const addPane = useCallback((item, type, panes) => {
    if (!item) return;
    
    // Get unique ID for this pane
    const gridItemId = item.i || `${type}-${Date.now()}`;
    
    // Get the canonical module key
    const moduleKey = getModuleKey(item);
    if (!moduleKey) return;
    
    // Get styling based on module type
    const typeClass = MODULE_TYPE_STYLE_CLASSES[moduleKey] || MODULE_TYPE_STYLE_CLASSES.default;
    
    // Add to panes array
    panes.push(
      <div key={gridItemId} className={`rounded shadow-lg overflow-hidden ${typeClass}`}>
        <PaneErrorBoundaryWithHooks paneId={gridItemId}>
          {/* Render component from registry */}
          {componentRegistry.renderComponent(gridItemId, item)}
        </PaneErrorBoundaryWithHooks>
      </div>
    );
  }, [getModuleKey]);
  
  // [SG-009] Active Panes Rendering - Processes currently active modules
  // Generate panes from active modules
  const panes = useMemo(() => {
    const result = [];
    
    // Skip if not initialized
    if (!initialized) return result;
    
    // Process active modules
    if (Array.isArray(activeModules)) {
      activeModules.forEach(moduleId => {
        if (typeof moduleId !== 'string') return;
        
        const [type, identifier, instance] = moduleId.split('-');
        if (!type || !identifier) return;
        
        // Find layout item for this module
        const layoutItem = safeLayouts.lg?.find(item => item.i === moduleId);
        
        // Add the pane with layout data if found
        addPane(layoutItem || { i: moduleId, moduleType: type }, type, result);
      });
    }
    
    return result;
  }, [activeModules, safeLayouts, addPane, initialized]);
  
  // [SG-010] Layout Change Handler - Updates layout state on user interactions
  // Handle grid layout changes
  const handleLayoutChange = useCallback((newLayout, allLayouts) => {
    if (typeof onLayoutChange === 'function') {
      onLayoutChange(newLayout, allLayouts);
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