import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { useEffect, useCallback, useState } from 'react';
import { useDragDisable } from '../Context/DragDisableContext.jsx';
import { useError } from '../../../Error-Handling/Diagnostics/ErrorNotificationSystem.jsx';
import PaneErrorBoundaryWithHooks from '../../../Error-Handling/PaneErrorBoundary.jsx';
import { ErrorType, ErrorSeverity } from '../../../Error-Handling/Diagnostics/types/errorTypes';
import { renderComponent } from '../Loader/Component/component-index.js';
import { saveLayout } from '../Loader/Layout/layout-index.jsx';
import {  synchronizeLayoutAndModules} from '../Loader/Layout/layout-shared.js';

const ResponsiveGridLayout = WidthProvider(Responsive);

const breakpoints = { lg: 1600, md: 1200, sm: 992, xs: 768, xxs: 480 };
const cols = { lg: 12, md: 12, sm: 12, xs: 12, xxs: 12 };
const rowHeight = 30;
const margin = [10, 10];
const containerPadding = [10, 10];

export default function PaneGrid({ layouts = {}, onLayoutChange, activeModules = [] }) {
  const { isDragDisabled } = useDragDisable();
  const { showError } = useError();
  const [initialized, setInitialized] = useState(false);

  const initialSync = synchronizeLayoutAndModules(layouts, activeModules);
  const [layoutState, setLayoutState] = useState(initialSync.layouts);
  const [syncedModuleIds, setSyncedModuleIds] = useState(initialSync.modules);

  useEffect(() => {
    const { layouts: syncedLayouts, modules: syncedModules } =
      synchronizeLayoutAndModules(layouts, activeModules);

    if (JSON.stringify(syncedLayouts) !== JSON.stringify(layoutState)) {
      setLayoutState(syncedLayouts);
    }

    if (JSON.stringify(syncedModules) !== JSON.stringify(syncedModuleIds)) {
      setSyncedModuleIds(syncedModules);
    }
  }, [layouts, activeModules]);

  const handleLayoutChange = useCallback((_, allLayouts) => {
    const { layouts: syncedLayouts, modules: syncedModules } =
      synchronizeLayoutAndModules(allLayouts, syncedModuleIds);

    setLayoutState(syncedLayouts);
    if (JSON.stringify(syncedModules.sort()) !== JSON.stringify(syncedModuleIds.sort())) {
      setSyncedModuleIds(syncedModules);
    }

    if (onLayoutChange) {
      onLayoutChange(syncedLayouts, syncedModules);
    }
  }, [syncedModuleIds, onLayoutChange]);

  const handleDragResizeStop = useCallback(() => {
    saveLayout(layoutState, false, syncedModuleIds);
  }, [layoutState, syncedModuleIds]);

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

  const renderPane = useCallback((item) => {
    try {
      return (
        <div key={item.i} className="h-full w-full">
          <PaneErrorBoundaryWithHooks paneId={item.i}>
            {renderComponent(item.i)}
          </PaneErrorBoundaryWithHooks>
        </div>
      );
    } catch (err) {
      showError(`Error rendering pane: ${item.i}`, ErrorType.RENDER, ErrorSeverity.MEDIUM);
      return (
        <div key={item.i} className="bg-red-900/20 p-4 text-red-400 text-xs">
          Failed to render pane
        </div>
      );
    }
  }, [showError]);

  if (!initialized) return null;

  return (
    <div className="h-full w-full overflow-y-auto overflow-x-hidden">
      <ResponsiveGridLayout
        className="pane-grid-layout"
        layouts={layoutState}
        breakpoints={breakpoints}
        cols={cols}
        rowHeight={rowHeight}
        margin={margin}
        containerPadding={containerPadding}
        isDraggable={!isDragDisabled}
        isResizable={!isDragDisabled}
        onLayoutChange={handleLayoutChange}
        onDragStop={handleDragResizeStop}
        onResizeStop={handleDragResizeStop}
      >
        {syncedModuleIds.map(paneId => renderPane({ i: paneId }))}
      </ResponsiveGridLayout>
    </div>
  );
}
