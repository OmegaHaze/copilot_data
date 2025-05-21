import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { useContext, useEffect, useCallback, useState } from 'react';
import { useDragDisable } from '../Context/DragDisableContext.jsx';
import { useError } from '../../../Error-Handling/Diagnostics/ErrorNotificationSystem.jsx';
import PaneErrorBoundaryWithHooks from '../../../Error-Handling/PaneErrorBoundary.jsx';
import { ErrorType, ErrorSeverity } from '../../../Error-Handling/Diagnostics/types/errorTypes';
import { renderComponent } from '../Loader/Component/component-index.js';
import { saveLayout } from '../Loader/Layout/layout-index.jsx';
import { SettingsContext } from '../Context/SettingsContext.jsx';

const ResponsiveGridLayout = WidthProvider(Responsive);

const breakpoints = { lg: 1600, md: 1200, sm: 992, xs: 768, xxs: 480 };
const cols = { lg: 12, md: 12, sm: 12, xs: 12, xxs: 12 };
const rowHeight = 60;
const margin = [10, 10];
const containerPadding = [10, 10];

export default function PaneGrid({ onLayoutChange }) {
  const { isDragDisabled } = useDragDisable();
  const { showError } = useError();
  const { gridLayout, setGridLayout, activeModules } = useContext(SettingsContext);
  const [initialized, setInitialized] = useState(false);

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

  const handleLayoutChange = useCallback((_, allLayouts) => {
    setGridLayout(allLayouts);
    if (onLayoutChange) {
      onLayoutChange(allLayouts, activeModules);
    }
  }, [activeModules, onLayoutChange, setGridLayout]);

  const handleDragResizeStop = useCallback(() => {
    saveLayout(gridLayout, false, activeModules);
  }, [gridLayout, activeModules]);

  const renderPane = useCallback((item) => {
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

  if (!initialized) return null;

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
