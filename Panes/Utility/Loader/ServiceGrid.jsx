import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

import { useEffect, useMemo, useCallback, useState } from 'react';
import { useDragDisable } from '../Context/DragDisableContext.jsx';
import { breakpoints, cols } from './GridUtils.js';
import { isValidLayoutItem } from './LayoutTransformer.js';
import { useError } from '../../../Error-Handling/Diagnostics/ErrorNotificationSystem.jsx';
import DefaultPane from '../Pane/DefaultPane.jsx';
import PaneErrorBoundaryWithHooks from '../ErrorHandling/PaneErrorBoundary.jsx';
import { componentRegistry } from './ComponentRegistry.js';
import { ErrorType, ErrorSeverity } from '../../../Error-Handling/Diagnostics/types/errorTypes';

// Apply width provider HOC for responsive behavior
const ResponsiveGridLayout = WidthProvider(Responsive);

// Default row height for grid
const DEFAULT_ROW_HEIGHT = 60;

// CSS styling classes mapped to module types for visual distinction in UI
// These are purely for styling and NOT directly tied to database enum values
// SYSTEM (blue), SERVICE (purple), USER (yellow), with fallbacks for other types
const MODULE_TYPE_STYLE_CLASSES = {
  SYSTEM: 'bg-blue-800/10',
  SERVICE: 'bg-purple-800/10',
  USER: 'bg-yellow-800/10',
  layouts: 'bg-gray-700/10',
  default: 'bg-gray-700/10'
};

/**
 * Validate layouts to ensure all items have valid IDs and properties
 * Provides more thorough validation to prevent layouts errors
 * @param {Object} layouts - Layouts object to validate
 * @returns {Object} - Validated layouts with only valid items
 */
function validateLayouts(layouts) {
  const valid = {};
  
  // If not a valid object, return empty layouts
  if (!layouts || typeof layouts !== 'object') {
    Object.keys(cols).forEach(bp => {
      valid[bp] = [];
    });
    return valid;
  }
  
  // Process each breakpoint
  Object.entries(cols).forEach(([bp]) => {
    const existing = layouts[bp] || [];
    
    // Validate each item in the breakpoint
    if (Array.isArray(existing)) {
      valid[bp] = existing.filter(item => {
        // Basic layouts item validation
        const isValid = isValidLayoutItem(item);
        
        // Extra safeguards against common issues
        if (!isValid && item && item.i) {
          console.warn(`Invalid layouts item filtered out: ${item.i}`, item);
        }
        
        return isValid;
      });
    } else {
      // If the breakpoint isn't an array, initialize it empty
      valid[bp] = [];
    }
  });
  
  return valid;
}

/**
 * ServiceGrid Component
 * Renders a responsive grid of service panes using react-grid-layout
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
  
  // Initialize component registry on mount if needed
  useEffect(() => {
    if (!componentRegistry.isInitialized()) {
      console.log('Initializing component registry from ServiceGrid');
      
      // Track initialization attempts
      let retryCount = 0;
      const maxRetries = 2;
      
      const attemptInitialization = async () => {
        try {
          await componentRegistry.initialize();
          console.log('Component registry initialized from ServiceGrid');
          setInitialized(true);
          // Component reload functionality
          if (!window.reloadComponentByName) {
            window.reloadComponentByName = async (componentName) => {
              try {
                console.log(`Attempting to reload component: ${componentName}`);
                const result = await componentRegistry.loadComponent(componentName, null, true);
                console.log(`Reload result:`, result ? 'Success' : 'Failed');
                return result;
              } catch (err) {
                console.error(`Error reloading component ${componentName}:`, err);
                return null;
              }
            };
          }
        } catch (error) {
          console.error(`Failed to initialize component registry (attempt ${retryCount + 1}/${maxRetries + 1}):`, error);
          
          // Show error notification
          showError(
            `Failed to initialize component registry: ${error.message}`,
            ErrorType.SYSTEM,
            ErrorSeverity.HIGH,
            {
              componentName: 'ServiceGrid',
              action: 'initialize',
              error: error.toString(),
              attempt: retryCount + 1
            }
          );
          
          // Retry initialization with exponential backoff
          if (retryCount < maxRetries) {
            retryCount++;
            const delay = 1000 * Math.pow(2, retryCount); // 2s, 4s
            console.log(`Retrying initialization in ${delay / 1000}s...`);
            
            setTimeout(() => {
              console.log(`Retry ${retryCount} of ${maxRetries} for component registry initialization`);
              attemptInitialization();
            }, delay);
          } else {
            console.warn('Component registry initialization failed after retries');
            setInitialized(true); // Allow rendering to proceed
          }
        }
      };
      
      // Start the initialization process
      attemptInitialization();
    } else {
      console.log('Component registry already initialized');
      setInitialized(true);
    }
  }, [showError]);
  
  // Validate that layouts have at least some valid breakpoints
  const hasValidLayouts = useMemo(() => {
    // Check if any breakpoint has layout items
    if (!layouts) return false;
    
    return Object.keys(layouts).some(bp => 
      Array.isArray(layouts[bp]) && layouts[bp].length > 0
    );
  }, [layouts]);

  // Get canonical key for a module/service item using the registry
  const getModuleKey = useCallback((item) => {
    // Always use the component registry for key resolution
    if (!item) return '';
    
    // Use the first available identifier
    const identifier = item.moduleType || 
                      (item.i && item.i.includes('-') ? item.i : null) ||
                      item.module_type || 
                      item.module || 
                      item.name;
                      
    // Return the canonical key
    return componentRegistry.getCanonicalKey(identifier);
  }, []);

  /**
   * Add pane to rendered items - improved version with simplified logic
   */
  const addPane = useCallback((item, type, panes) => {
    // Skip invalid items
    if (!item) return;
    
    // Get unique ID for this pane
    const gridItemId = item.i || `${type}-${Date.now()}`;
    
    // Get the canonical module key using component registry
    const moduleKey = getModuleKey(item);
    if (!moduleKey) {
      console.warn('Cannot determine module key for item:', item);
      return;
    }
    
    // Get styling based on module type
    const logo = item.logoUrl || logoUrls[moduleKey];
    
    let className = '';
    
    // Determine styling based on module type
    if (MODULE_TYPE_STYLE_CLASSES) {
      className = MODULE_TYPE_STYLE_CLASSES[type] || MODULE_TYPE_STYLE_CLASSES.default || 'bg-gray-700/10';
    } else {
      // Fallback styling if MODULE_TYPE_STYLE_CLASSES is undefined
      className = 'bg-gray-700/10';
    }
    
    // Extract module type for props
    const moduleType = moduleKey;

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

    // Get the component from paneMap
    const Component = paneMap[moduleKey];
    
    // Use the same div wrapper regardless of component presence
    panes.push(
      <div key={props._gridId || moduleKey} className={className}>
        <PaneErrorBoundaryWithHooks 
          paneName={props.name || moduleKey}
          moduleType={moduleType}
          onRetry={() => {
            // Force component reload by requesting a refresh of this module
            if (window.reloadComponentByName) {
              window.reloadComponentByName(moduleKey);
            }
          }}
        >
          {Component && typeof Component === 'function' ? (
            <Component {...props} />
          ) : (
            <DefaultPane 
              {...props} 
              slug={moduleKey} 
              error={`Component "${moduleKey}" not found or failed to load`}
              status="Missing"
            />
          )}
        </PaneErrorBoundaryWithHooks>
      </div>
    );
  }, [getModuleKey, paneMap, logoUrls]);

  /**
   * Render all panes based on services, layout items and modules
   * Enhanced with better validation and error handling
   */
  const renderAll = useCallback(() => {
    const panes = [];
    let validItemsCount = 0;
    let invalidItemsCount = 0;
    
    // Track existing pane IDs to prevent duplicates
    const renderedIds = new Set();
    
    // Helper to safely add a pane with duplicate prevention
    const safeAddPane = (item, type) => {
      try {
        if (!item) return;
        
        // Skip items without proper identifier
        const itemId = item.i || 
                      (item.module && `${item.module}-${Date.now()}`) || 
                      (item._id && `item-${item._id}`);
                      
        if (!itemId) {
          console.warn('Item skipped due to missing identifier:', item);
          invalidItemsCount++;
          return;
        }
        
        // Prevent duplicate panes
        if (renderedIds.has(itemId)) {
          console.warn(`Duplicate pane ID detected: ${itemId}`, item);
          return;
        }
        
        // Track this ID
        renderedIds.add(itemId);
        
        // Add the pane
        addPane(item, type, panes);
        validItemsCount++;
      } catch (error) {
        console.error(`Error adding pane item:`, error, item);
        invalidItemsCount++;
        
        // Report error to notification system
        showError(
          `Failed to add pane to grid: ${error.message}`,
          ErrorType.UI,
          ErrorSeverity.MEDIUM,
          {
            componentName: 'ServiceGrid',
            action: 'safeAddPane',
            metadata: { item, type, error: error.toString() }
          }
        );
      }
    };
    
    try {
      // Add services first (if available)
      if (Array.isArray(services)) {
        services.forEach(svc => safeAddPane(svc, 'service'));
      }
  
      // Add items from saved layouts
      if (layouts?.lg?.length > 0) {
        layouts.lg.forEach(layoutItem => {
          if (layoutItem.i) {
            try {
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
            } catch (err) {
              console.error(`Failed to process layout item ${layoutItem.i}:`, err);
              invalidItemsCount++;
            }
          } else {
            invalidItemsCount++;
          }
        });
      }
      
      // Add modules from each category
      if (modules) {
        // Add system modules
        if (Array.isArray(modules.SYSTEM) && modules.SYSTEM.length > 0) {
          modules.SYSTEM.forEach(mod => safeAddPane(mod, 'SYSTEM'));
        }
        
        // Add service modules (only installed ones)
        if (Array.isArray(modules.SERVICE) && modules.SERVICE.length > 0) {
          modules.SERVICE
            .filter(m => m.is_installed)
            .forEach(mod => safeAddPane(mod, 'SERVICE'));
        }
        
        // Add user modules
        if (Array.isArray(modules.USER) && modules.USER.length > 0) {
          modules.USER.forEach(mod => safeAddPane(mod, 'USER'));
        }
      }
    } catch (error) {
      console.error('Critical error in renderAll:', error);
      showError(
        `Grid rendering error: ${error.message}`,
        ErrorType.UI,
        ErrorSeverity.HIGH,
        { componentName: 'ServiceGrid', action: 'renderAll', error: error.toString() }
      );
    }
    
    // Log statistics for debugging
    if (invalidItemsCount > 0) {
      console.warn(`ServiceGrid: Rendered ${validItemsCount} valid items, filtered out ${invalidItemsCount} invalid items`);
    }

    return panes;
  }, [layouts, services, modules, addPane, getModuleKey, logoUrls, showError]);

  /**
   * Handle layout changes from react-grid-layout
   */
  const handleLayoutChange = useCallback((_, allLayouts) => {
    if (onLayoutChange) {
      onLayoutChange(allLayouts);
    }
  }, [onLayoutChange]);

  // Validate layouts to ensure all items are properly formed
  const safeLayouts = useMemo(() => {
    try {
      // Short-circuit if layouts are undefined/null
      if (!layouts) {
        const emptyLayouts = {};
        Object.keys(cols).forEach(bp => {
          emptyLayouts[bp] = [];
        });
        return emptyLayouts;
      }
      
      // Validate the layouts structure
      const validatedLayouts = validateLayouts(layouts);
      
      // Ensure all breakpoints exist
      Object.keys(cols).forEach(bp => {
        if (!validatedLayouts[bp]) validatedLayouts[bp] = [];
      });
      
      // Check if valid layout items were filtered out during validation
      if (layouts && Object.keys(layouts).some(bp => {
        return Array.isArray(layouts[bp]) && 
               Array.isArray(validatedLayouts[bp]) && 
               layouts[bp].length > validatedLayouts[bp].length;
      })) {
        console.warn('Some invalid layouts items were filtered during validation');
        
        // Count filtered items for debugging
        const originalCount = Object.values(layouts)
          .filter(Array.isArray)
          .reduce((sum, arr) => sum + arr.length, 0);
          
        const validatedCount = Object.values(validatedLayouts)
          .filter(Array.isArray)
          .reduce((sum, arr) => sum + arr.length, 0);
          
        if (originalCount > validatedCount) {
          console.warn(`Filtered out ${originalCount - validatedCount} invalid layouts items`);
          
          // Log which items were filtered out for diagnosis
          Object.keys(layouts).forEach(bp => {
            if (Array.isArray(layouts[bp]) && Array.isArray(validatedLayouts[bp])) {
              const filteredItems = layouts[bp].filter(item => {
                return !validatedLayouts[bp].some(validItem => validItem.i === item.i);
              });
              
              if (filteredItems.length > 0) {
                console.warn(`Filtered out ${filteredItems.length} items from ${bp} breakpoint:`, 
                  filteredItems.map(item => item.i || 'unknown'));
              }
            }
          });
        }
      }
      
      return validatedLayouts;
    } catch (error) {
      console.error('Error validating layouts:', error);
      showError(
        `Layouts validation error: ${error.message}`,
        ErrorType.SYSTEM,
        ErrorSeverity.MEDIUM,
        {
          componentName: 'ServiceGrid',
          action: 'validateLayouts',
          metadata: { 
            error: error.toString(),
            stack: error.stack,
            layoutKeys: layouts ? Object.keys(layouts) : [],
            hasLgBreakpoint: layouts && layouts.lg ? true : false
          }
        }
      );
      
      // Return empty layouts as fallback
      const emptyLayouts = {};
      Object.keys(cols).forEach(bp => {
        emptyLayouts[bp] = [];
      });
      return emptyLayouts;
    }
  }, [layouts, showError]);
  
  // Check if we have any active modules but no valid layouts items
  const hasActiveModulesButNoLayouts = 
    Array.isArray(activeModules) && 
    activeModules.length > 0 && 
    !hasValidLayouts;
    
  // Check if the layouts have any items for any breakpoint
  const hasAnyLayoutsItems = useMemo(() => {
    if (!layouts) return false;
    return Object.values(layouts).some(
      breakpointItems => Array.isArray(breakpointItems) && breakpointItems.length > 0
    );
  }, [layouts]);
  
  // List of components to render
  const renderedComponents = useMemo(() => {
    // Only render if we have valid layouts
    if (!hasAnyLayoutsItems) return [];
    return renderAll();
  }, [hasAnyLayoutsItems, renderAll]);
  
  // Main render method
  return (
    <div className="w-full mx-auto relative">
      {!hasValidLayouts ? (
        // Render empty state or error message when no valid layouts exist
        <div className="p-6 text-center rounded-lg border border-green-800/30 bg-black/30">
          <h3 className="text-lg font-mono text-green-500 mb-4">Grid Layouts Empty</h3>
          
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
      ) : (
        // Render grid layouts when we have valid layouts data
        <>
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
              <h3 className="text-lg font-mono text-green-500 mb-4">No Components to Render</h3>
              <p className="text-green-400">
                Layouts exist but no components were loaded. Check console for errors.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}