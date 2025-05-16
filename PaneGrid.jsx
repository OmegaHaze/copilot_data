// PaneGrid.jsx

import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

import React, { useEffect, useMemo, useCallback, useState } from 'react';
import { useDragDisable } from '../Context/DragDisableContext.jsx';
import { useError } from '../../../Error-Handling/Diagnostics/ErrorNotificationSystem.jsx';
import PaneErrorBoundaryWithHooks from '../../../Error-Handling/PaneErrorBoundary.jsx';
import { ErrorType, ErrorSeverity } from '../../../Error-Handling/Diagnostics/types/errorTypes';
import { renderComponent } from '../Loader/Component/component-index.js';
import {
  COLS,
  BREAKPOINTS,
  BREAKPOINT_VALUES,
  MARGIN,
  CONTAINER_PADDING,
  ROW_HEIGHTS
} from '../Loader/Layout/layout-constants.js';


import { saveLayout } from '../Loader/Layout/layout-index.jsx';

const ResponsiveGridLayout = WidthProvider(Responsive);

const isValidLayoutItem = (item) =>
  item && typeof item === 'object' && item.i &&
  typeof item.x === 'number' &&
  typeof item.y === 'number' &&
  typeof item.w === 'number' &&
  typeof item.h === 'number';

export default function PaneGrid({
  layouts = {},
  onLayoutChange,
  activeModules = []
}) {
  const { isDragDisabled } = useDragDisable();
  const { showError } = useError();
  const [initialized, setInitialized] = useState(false);
  const [breakpoint, setBreakpoint] = useState("lg");
  const rowHeight = ROW_HEIGHTS[breakpoint] || ROW_HEIGHTS.lg;
  
  // No need for resize listener as we'll use the breakpoint from ResponsiveGridLayout

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

  const safeLayouts = useMemo(() => {
    return BREAKPOINTS.reduce((acc, bp) => {
      const items = Array.isArray(layouts?.[bp]) ? layouts[bp].filter(isValidLayoutItem) : [];
      acc[bp] = items;
      return acc;
    }, {});
  }, [layouts]);

  const ensuredLayouts = useMemo(() => {
    return BREAKPOINTS.reduce((acc, bp) => {
      acc[bp] = Array.isArray(safeLayouts[bp]) ? safeLayouts[bp] : [];
      return acc;
    }, {});
  }, [safeLayouts]);

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

    <ResponsiveGridLayout
      className="pane-grid-layout"
      layouts={ensuredLayouts}
      breakpoints={BREAKPOINT_VALUES}
      cols={COLS}
      rowHeight={rowHeight}
      margin={MARGIN}
      containerPadding={CONTAINER_PADDING}
      isDraggable={!isDragDisabled}
      isResizable={!isDragDisabled}
      resizeHandles={['se']}
      allowOverlap={true}
      useCSSTransforms={true}              // GPU-accelerated smoothness
      measureBeforeMount={false}           // Ensures initial sizing is correct
      compactType= "horizontal"              // ⬅️ This is the showcase behavior
      preventCollision={false}            // Let items flow around each other
      draggableCancel=".no-drag"
      draggableHandle=".pane-drag-handle"
      onBreakpointChange={(bp, cols) => {
        console.log(`Breakpoint changed: ${bp}, cols: ${cols}`);
        setBreakpoint(bp);
      }}
      onWidthChange={(w, _margin, cols) => {
        console.log(`Width changed: ${w}px, cols: ${cols}`);
      }}
      onLayoutChange={(_current, allLayouts) => {
        const completeLayouts = BREAKPOINTS.reduce((acc, bp) => {
          acc[bp] = Array.isArray(allLayouts[bp]) ? allLayouts[bp].filter(Boolean) : [];
          return acc;
        }, {});

        saveLayout(completeLayouts);

        if (typeof onLayoutChange === 'function') {
          onLayoutChange(completeLayouts);
        }
      }}
    >
      {activeModules.map(paneId => renderPane({ i: paneId }))}
    </ResponsiveGridLayout>
    
  );
}
