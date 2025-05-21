/**
 * MODULE-FLOW-8.2: Pane Grid - Module Layout Grid
 * COMPONENT: UI Layer - Module Rendering
 * PURPOSE: Renders the responsive grid with module components
 * FLOW: Creates grid layout and renders module components
 * MERMAID-FLOW: flowchart TD; MOD8.2[Pane Grid] -->|Renders| MOD8.2.1[Module Components];
 *               MOD8.2 -->|Uses| MOD6.1[Component Registry];
 *               MOD8.2 -->|Persists| MOD7.1[Settings Context]
 */

import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { useContext, useEffect, useCallback, useState } from 'react';
import { useDragDisable } from '../Context/DragDisableContext.jsx';
import { useError } from '../../../Error-Handling/Diagnostics/ErrorNotificationSystem.jsx';
import PaneErrorBoundaryWithHooks from '../../../Error-Handling/PaneErrorBoundary.jsx';
import { ErrorType, ErrorSeverity } from '../../../Error-Handling/Diagnostics/types/errorTypes';
// Import from component-operations directly rather than component-index
import { renderComponent } from '../Loader/Component/component-operations.jsx';
import { saveLayout } from '../Loader/Layout/layout-index.jsx';
import { SettingsContext } from '../Context/SettingsContext.jsx';

/**
 * MODULE-FLOW-8.2.1: Responsive Grid Layout Setup
 * COMPONENT: UI Layer - Grid Configuration
 * PURPOSE: Sets up responsive grid layout with width provider
 * FLOW: Initializes the grid layout component
 */
const ResponsiveGridLayout = WidthProvider(Responsive);

// Grid configuration constants
const breakpoints = { lg: 1600, md: 1200, sm: 992, xs: 768, xxs: 480 };
const cols = { lg: 12, md: 12, sm: 12, xs: 12, xxs: 12 };
const rowHeight = 60;
const margin = [10, 10];
const containerPadding = [10, 10];

/**
 * MODULE-FLOW-8.2.2: Pane Grid Component
 * COMPONENT: UI Layer - Grid Container
 * PURPOSE: Manages the grid layout and renders modules
 * FLOW: Renders grid with all active modules
 * @param {Object} props - Component props
 * @param {Function} props.onLayoutChange - Layout change handler
 * @returns {JSX.Element} - Grid component
 */
export default function PaneGrid({ onLayoutChange }) {
  // Context and state hooks
  const { isDragDisabled } = useDragDisable();
  const { showError } = useError();
  const { gridLayout, setGridLayout, activeModules } = useContext(SettingsContext);
  const [initialized, setInitialized] = useState(false);

  /**
   * MODULE-FLOW-8.2.3: Component System Initialization
   * COMPONENT: UI Layer - Component System Setup
   * PURPOSE: Initializes the component system
   * FLOW: Prepares component system for rendering
   */
  useEffect(() => {
    const init = async () => {
      try {
        await renderComponent('__warmup__');
        setInitialized(true);
      } catch (err) {
        showError(`Failed to initialize component system: ${err.message}`, ErrorType.SYSTEM, ErrorSeverity.HIGH);
        setInitialized(true);
      }
    };
    init();
  }, [showError]);

  /**
   * MODULE-FLOW-8.2.4: Layout Change Handler
   * COMPONENT: UI Layer - Event Handler
   * PURPOSE: Handles layout changes from grid
   * FLOW: Updates layout state and notifies parent
   * @param {Array} _ - Current layout array (unused)
   * @param {Object} allLayouts - All layout breakpoints
   */
  const handleLayoutChange = useCallback((_, allLayouts) => {
    setGridLayout(allLayouts);
    if (onLayoutChange) {
      onLayoutChange(allLayouts, activeModules);
    }
  }, [activeModules, onLayoutChange, setGridLayout]);

  /**
   * MODULE-FLOW-8.2.5: Drag/Resize Stop Handler
   * COMPONENT: UI Layer - Event Handler
   * PURPOSE: Handles end of drag or resize operations
   * FLOW: Saves layout state to persistence
   */
  const handleDragResizeStop = useCallback(() => {
    saveLayout(gridLayout, false, activeModules);
  }, [gridLayout, activeModules]);

  /**
   * MODULE-FLOW-8.2.6: Module Rendering Function
   * COMPONENT: UI Layer - Component Rendering
   * PURPOSE: Renders individual module component
   * FLOW: Loads and renders component for module ID
   * @param {Object} item - Grid item with module ID
   * @returns {JSX.Element} - Rendered module with error boundary
   */
  const renderPane = useCallback((item) => {
    // Use renderComponent from component system to render the module
    const component = renderComponent(item.i, {
      onComponentLoaded: () => {
        console.log(`[PaneGrid] Component loaded for pane: ${item.i}`);
        setGridLayout((prev) => ({ ...prev }));
      }
    });

    return (
      <div key={item.i} className="h-full w-full">
        <PaneErrorBoundaryWithHooks paneId={item.i}>
          {component || <div>Loading...</div>}
        </PaneErrorBoundaryWithHooks>
      </div>
    );
  }, [setGridLayout]);

  // Wait for initialization before rendering
  if (!initialized) return null;

  /**
   * MODULE-FLOW-8.2.7: Grid Rendering
   * COMPONENT: UI Layer - Grid Layout
   * PURPOSE: Renders the responsive grid with all modules
   * FLOW: Creates grid with all active modules
   */
  return (
    <div className="h-full w-full overflow-y-auto overflow-x-hidden">
      <ResponsiveGridLayout
        className="pane-grid-layout"
        layouts={gridLayout}
        breakpoints={breakpoints}
        cols={cols}
        rowHeight={rowHeight}
        margin={margin}
        containerPadding={containerPadding}
        isDraggable={!isDragDisabled}
        isResizable={!isDragDisabled}
        draggableHandle=".pane-drag-handle"
        onLayoutChange={handleLayoutChange}
        onDragStop={handleDragResizeStop}
        onResizeStop={handleDragResizeStop}
      >
        {activeModules.map(paneId => renderPane({ i: paneId }))}
      </ResponsiveGridLayout>
    </div>
  );
}