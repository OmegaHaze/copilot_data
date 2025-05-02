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
import { getBaseModuleType, parsePaneId } from './ModuleRegistry.js';
import { getCanonicalComponentKey } from './ComponentRegistry.js';

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
 * Debug logging helper for development mode
 * @param {string} label - Log label
 * @param {Object} layoutObj - Layout object to log
 */
function logDebugLayout(label, layoutObj) {
  if (process.env.NODE_ENV !== 'development') return;
  console.groupCollapsed(`🧹 [GRID DEBUG] ${label}`);
  Object.entries(layoutObj).forEach(([key, val]) => {
    console.log(`🔘 ${key}:`, val);
  });
  console.groupEnd();
}

/**
 * Diagnostic function to analyze and log pane rendering issues
 * @param {Object} paneMap - Map of available components
 * @param {Object} layout - Current grid layout
 */
function diagnosePaneRenderingIssues(paneMap, layout) {
  if (!layout?.lg) return;
  
  console.groupCollapsed('🔍 [ServiceGrid] Diagnosing pane rendering issues');
  
  // Check for missing components
  layout.lg.forEach(item => {
    const moduleType = item.moduleType || (item.i && item.i.includes('-') ? item.i.split('-')[0] : null);
    
    if (moduleType) {
      const hasComponent = !!paneMap[moduleType.toLowerCase()];
      console.log(`${hasComponent ? '✅' : '❌'} ${moduleType}: ${item.i} - Component ${hasComponent ? 'found' : 'missing'}`);
      
      if (!hasComponent) {
        console.log('Available component keys:', Object.keys(paneMap));
      }
    }
  });
  
  console.groupEnd();
}

/**
 * Run diagnostics on component mapping and pane rendering
 * Logs detailed information to help debug component loading issues
 */
function runGridDiagnostics(gridLayout, paneMap, activeModules) {
  if (!window.vaioDebug) return;
  
  // Create an object to store diagnostics
  const diagnostics = {
    gridItems: {},
    activeModules: [],
    missingComponents: [],
    componentMap: Object.keys(paneMap || {}),
    timestamp: new Date().toISOString()
  };
  
  // Process all active modules
  if (Array.isArray(activeModules)) {
    activeModules.forEach(moduleId => {
      const moduleType = moduleId.includes('-') ? moduleId.split('-')[0] : moduleId;
      const canonicalKey = getCanonicalComponentKey(moduleType);
      
      diagnostics.activeModules.push({
        id: moduleId,
        moduleType,
        canonicalKey,
        hasComponent: !!paneMap[canonicalKey],
        alternateFound: !paneMap[canonicalKey] && !!paneMap[moduleType]
      });
      
      // Track missing components
      if (!paneMap[canonicalKey] && !paneMap[moduleType]) {
        diagnostics.missingComponents.push(moduleType);
      }
    });
  }
  
  // Process all layout items 
  if (gridLayout?.lg) {
    gridLayout.lg.forEach(item => {
      if (!item.i) return;
      
      const moduleType = item.moduleType || (item.i.includes('-') ? item.i.split('-')[0] : item.i);
      const canonicalKey = getCanonicalComponentKey(moduleType);
      
      diagnostics.gridItems[item.i] = {
        moduleType,
        canonicalKey,
        hasComponent: paneMap && !!paneMap[canonicalKey],
        alternateFound: paneMap && !paneMap[canonicalKey] && !!paneMap[moduleType],
        inActiveModules: Array.isArray(activeModules) && activeModules.includes(item.i)
      };
      
      // Track missing components
      if (!paneMap[canonicalKey] && !paneMap[moduleType]) {
        diagnostics.missingComponents.push(moduleType);
      }
    });
  }

  // Make the diagnostic data available on the debug console
  window.vaioDebug.gridDiagnostics = diagnostics;
  
  // Show any critical errors
  if (diagnostics.missingComponents.length > 0) {
    const uniqueMissing = [...new Set(diagnostics.missingComponents)];
    window.vaioDebug.error(`Missing components: ${uniqueMissing.join(', ')}`, 10000);
    
    // Add debugging help
    window.vaioDebug.fixComponentMapping = (moduleType) => {
      if (!moduleType) {
        window.vaioDebug.warn("Please specify a moduleType to fix");
        return;
      }
      
      // If we have access to component registry from ComponentLoader
      if (window.vaioDebug.componentRegistry?.forceReload) {
        window.vaioDebug.componentRegistry.forceReload(moduleType)
          .then(success => {
            if (success) {
              window.vaioDebug.success(`Component ${moduleType} reloaded. Refresh the page.`);
            }
          });
      }
    };
  }
  
  return diagnostics;
}

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
 * Attempt to restore missing components if needed
 * This function can dynamically import components that should be available but aren't in paneMap
 * @param {Object} currentPaneMap - Current component map
 * @param {Array} missingComponents - List of components to restore
 * @returns {Promise<Object>} - Updated pane map
 */
async function restoreComponents(currentPaneMap, missingComponents) {
  if (!missingComponents || missingComponents.length === 0) {
    return currentPaneMap;
  }
  
  const updatedMap = { ...currentPaneMap };
  const restorePromises = [];
  
  for (const componentKey of missingComponents) {
    // Try to load the component dynamically using naming convention
    const componentName = `${componentKey.charAt(0).toUpperCase()}${componentKey.slice(1)}Pane`;
    const componentPath = `../Pane/${componentName}.jsx`;
    
    const importPromise = import(componentPath)
      .then(module => {
        if (module.default) {
          updatedMap[componentKey] = module.default;
          if (window.vaioDebug) {
            window.vaioDebug.success(`Restored missing component: ${componentKey}`);
          }
        }
        return true;
      })
      .catch(err => {
        console.error(`Failed to restore component ${componentKey}:`, err);
        if (window.vaioDebug) {
          window.vaioDebug.error(`Failed to restore ${componentKey}: ${err.message}`);
        }
        return false;
      });
    
    restorePromises.push(importPromise);
  }
  
  // Wait for all restore operations to complete
  await Promise.allSettled(restorePromises);
  
  if (window.vaioDebug && Object.keys(updatedMap).length > Object.keys(currentPaneMap).length) {
    window.vaioDebug.success(`Restored ${Object.keys(updatedMap).length - Object.keys(currentPaneMap).length} components`);
  }
  
  return updatedMap;
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
  
  // Log initial state in development mode
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      logDebugLayout('Initial Layout', layout);
      console.log('Services:', services.map(s => s.name).join(', '));
      console.log('Modules:', {
        system: modules.system.length,
        service: modules.service.length,
        user: modules.user.length
      });
      console.log('Active Modules:', activeModules);
      
      // Run grid diagnostics to help with debugging
      if (window.vaioDebug) {
        runGridDiagnostics(layout, paneMap, activeModules);
      }
    }
  }, [services, modules, layout, activeModules, paneMap]);

  /**
   * Extract component key and grid item ID from an item
   * @param {Object} item - Item to process
   * @returns {Object} - Component key and grid item ID
   */
  const getPaneKey = useCallback((item) => {
    // First identify the module type from all available properties in priority order
    const moduleTypeFromProps = item.moduleType || item.module_type || item.module;
    const moduleTypeFromId = item.i && item.i.includes('-') ? getBaseModuleType(item.i) : null;
    
    // Use the most reliable source of module type
    const rawModuleType = moduleTypeFromProps || moduleTypeFromId || item.name;
    
    // Get the canonical component key for consistent lookup
    const key = getCanonicalComponentKey(rawModuleType);
    
    console.log(`[DEBUG INFO]: Component lookup for "${rawModuleType}": key="${key}", found=${!!paneMap[key]}`);
    
    // Create a fallback if we couldn't determine the key
    const componentKey = key || `unknown-${Math.random().toString(36).slice(2, 8)}`;
    
    // Debug output if we can't find the component
    if (!paneMap[componentKey]) {
      // Use the debug system if available
      if (window.vaioDebug) {
        window.vaioDebug.log(`Component lookup for "${rawModuleType}": key="${componentKey}", found=${!!paneMap[componentKey]}`);
      } else {
        console.log(`🔍 [ServiceGrid] Pane component lookup:`, { 
          componentKey, 
          id: item.i,
          rawModuleType,
          moduleTypeFromProps,
          moduleTypeFromId,
          hasComponent: !!paneMap[componentKey],
          availableKeys: Object.keys(paneMap).join(', ')
        });
      }
    }
    
    // Use the parsePaneId utility if we have an item.i in the format 'moduleType-instanceId'
    let instanceId = item.instanceId;
    if (!instanceId && item.i && item.i.includes('-')) {
      const parsed = parsePaneId(item.i);
      instanceId = parsed.instanceId;
    }
    
    // Create grid item ID
    const gridItemId = item.i?.includes('-') ? item.i : (instanceId ? `${componentKey}-${instanceId}` : componentKey);
    
    // Store grid ID on item for easier access
    // eslint-disable-next-line no-param-reassign
    item._gridId = gridItemId;

    return {
      componentKey,
      gridItemId
    };

  }, []);

  /**
   * Fallback component for when no matching component is found
   * @param {Object} props - Component props
   * @returns {JSX.Element} - Fallback UI
   */
  const FallbackComponent = useCallback(props => (
    <div className="bg-black rounded border border-amber-600 shadow-inner overflow-hidden w-full h-full flex flex-col">
      <div className="px-2 py-1 text-xs font-bold bg-amber-500/10">{props.name || 'Unknown Component'}</div>
      <div className="flex-grow flex items-center justify-center text-amber-400 text-xs">
        Component not found: {props.slug}
      </div>
    </div>
  ), []);

  /**
   * Render a single pane with error boundary
   * @param {string} key - Component key
   * @param {Object} paneProps - Props for the pane
   * @param {Component} Component - React component to render
   * @param {string} className - CSS class for the pane
   * @returns {JSX.Element|null} - Rendered pane or null
   */
  const renderPane = useCallback((key, paneProps, Component, className) => {
    // Safety check - if Component isn't a valid function, use FallbackComponent
    if (!Component || typeof Component !== 'function') {
      console.error(`❌ Invalid component for ${key}, using fallback`);
      Component = FallbackComponent;
    }

    // Sanitize props to avoid passing invalid objects
    const safePaneProps = {};
    Object.entries(paneProps).forEach(([k, v]) => {
      if (k === 'moduleData') {
        safePaneProps[k] = v;
      } else if (v === undefined || v === null) {
        safePaneProps[k] = (k === 'name') ? 'Unnamed' : (k === 'status' ? 'Unknown' : v);
      } else if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
        console.warn(`⚠️ Complex object in prop ${k} for ${key}`);
        try {
          safePaneProps[k] = JSON.stringify(v);
        } catch (err) {
          safePaneProps[k] = `[Object ${k}]`;
        }
      } else {
        safePaneProps[k] = v;
      }
    });

    // Track component initialization just once
    if (window.vaioDebug && !window[`_${key}Rendered`]) {
      window[`_${key}Rendered`] = true;
      window.vaioDebug.show(`✅ ${key} component initialized`, 'info');
    }

    return (
      <div key={safePaneProps._gridId || key} className={className}>
        <ErrorBoundary componentName={`Pane:${safePaneProps._gridId || key}`} showStack={true}>
          <Component {...safePaneProps} />
        </ErrorBoundary>
      </div>
    );
  }, []);

  /**
   * Add a pane to the render list
   * @param {Object} item - Pane item configuration
   * @param {string} type - Module type (system, service, user)
   * @returns {JSX.Element|null} - Rendered pane
   */
  const addPane = useCallback((item, type = 'service', panes) => {
    // Get canonical component key and grid item ID
    const { componentKey, gridItemId } = getPaneKey(item);
    
    // First try to look up using the exact componentKey
    // Then try alternate keys in case of registration inconsistencies
    let Component = paneMap[componentKey];
    
    // If we couldn't find the component, try fallbacks
    if (!Component) {
      // Try alternate keys that might work
      const altKey1 = item.moduleType;
      const altKey2 = item.module;
      const altKey3 = getBaseModuleType(item.i);
      
      // Check all alternates
      Component = paneMap[altKey1] || paneMap[altKey2] || paneMap[altKey3] || FallbackComponent;
      
      // Log issue if we had to use an alternate
      if (Component !== FallbackComponent && window.vaioDebug) {
        window.vaioDebug.warn(
          `Component "${componentKey}" not found directly, using alternate key: ${
            Component === paneMap[altKey1] ? altKey1 : 
            Component === paneMap[altKey2] ? altKey2 : altKey3
          }`
        );
      }
    }
    
    // Get logo and class based on module type
    const logo = item.logoUrl || logoUrls[componentKey];
    const className = MODULE_TYPE_CLASSES[type] || MODULE_TYPE_CLASSES.default;
    
    // Extract the module type from all available properties for consistency
    const moduleType = item.moduleType || item.module_type || 
                      getBaseModuleType(item.i) || 
                      item.module || componentKey;

    // Create standardized props for the component
    const props = {
      slug: componentKey,
      _gridId: gridItemId,
      name: item.name || item.module || moduleType || 'Unnamed',
      logo,
      moduleData: {
        ...item,
        module_type: moduleType // Ensure module_type is available in moduleData
      },
      status: typeof item.status === 'string' ? item.status : 'Unknown',
      moduleType: moduleType // Pass moduleType directly as a prop
    };
    
    // Debug component selection (only in development)
    if (process.env.NODE_ENV === 'development') {
      console.log(`🧩 [ServiceGrid] Rendering pane:`, {
        componentKey,
        gridItemId,
        hasComponent: !!paneMap[componentKey],
        component: Component?.name || 'Unknown',
        moduleType
      });
    }

    // Render the pane and add to collection
    panes.push(renderPane(componentKey, props, Component, className));
  }, [getPaneKey, paneMap, logoUrls, renderPane, FallbackComponent]);

  /**
   * Render all panes based on services, layout items and modules
   * @returns {Array<JSX.Element>} - Array of rendered panes
   */
  const renderAll = useCallback(() => {
    const panes = [];
    
    // Debug available component keys
    console.log('🗂️ [ServiceGrid] Available component keys:', Object.keys(paneMap));

    // Add services first
    services.forEach(svc => addPane(svc, 'service', panes));

    // Add layout items (from saved layout) - this is crucial for dynamically added items
    if (layout?.lg?.length > 0) {
      if (window.vaioDebug) {
        window.vaioDebug.log(`Processing ${layout.lg.length} layout items`);
      }
      
      layout.lg.forEach(layoutItem => {
        if (layoutItem.i) {
          // Extract the module type directly from the item ID if possible
          const moduleTypeFromId = layoutItem.i.split('-')[0];
          
          // Ensure the module type is normalized and consistent across all properties
          const normalizedModuleType = getCanonicalComponentKey(layoutItem.moduleType || moduleTypeFromId);
          
          // Create an enhanced layout item with consistent module type properties
          const enhancedItem = { 
            ...layoutItem,
            // Ensure consistent naming across all properties
            moduleType: normalizedModuleType,
            module_type: normalizedModuleType, 
            module: normalizedModuleType,
            name: layoutItem.name || layoutItem.moduleType || moduleTypeFromId || 'Unknown Module'
          };
          
          // Add to panes using the module's canonical type as the pane type
          addPane(
            enhancedItem, 
            normalizedModuleType || 'layout',
            panes
          );
          
          // Debug to help diagnose component loading issues
          if (window.vaioDebug && !paneMap[normalizedModuleType]) {
            window.vaioDebug.log(`Processing layout item: ${layoutItem.i} (${normalizedModuleType})`, 
              { hasComponent: false });
          }
        }
      });
    } else {
      console.log('⚠️ [ServiceGrid] No layout items found in layout.lg');
    }

    // Add system modules
    modules.system.forEach(mod => addPane(mod, 'system', panes));
    
    // Add service modules that are installed
    modules.service
      .filter(m => m.is_installed)
      .forEach(mod => addPane(mod, 'service', panes));
    
    // Add user modules
    modules.user.forEach(mod => addPane(mod, 'user', panes));

    return panes;
  }, [services, layout, modules, addPane]);

  /**
   * Handle layout changes from react-grid-layout
   * @param {Object} _currentLayout - Current layout (not used)
   * @param {Object} allLayouts - All layouts across breakpoints
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

  // Run diagnostics when layout or paneMap changes
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      diagnosePaneRenderingIssues(paneMap, safeLayout);
    }
  }, [paneMap, safeLayout]);

  // Debug components (hidden) for development mode
  const debugContent = useMemo(() => {
    if (process.env.NODE_ENV !== 'development') return null;
    
    return Object.entries(paneMap).map(([key, Component]) => (
      typeof Component === 'function' ? (
        <div key={`debug-${key}`} style={{ display: 'none' }}>
          <Component name={`Debug ${key}`} slug={key} moduleData={{ name: key, module_type: key }} />
        </div>
      ) : null
    ));
  }, [paneMap]);

  // Global debug helper for ServiceGrid
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      window.debugServiceGrid = {
        layout: safeLayout,
        paneMap,
        services,
        modules,
        activeModules,
        analyzePanes: () => {
          const analysis = {
            renderable: [],
            missing: [],
            components: {}
          };
          
          // Check layout items for renderability
          if (safeLayout.lg) {
            safeLayout.lg.forEach(item => {
              const moduleType = getCanonicalComponentKey(item.moduleType || item.i);
              const hasComponent = !!paneMap[moduleType];
              
              if (hasComponent) {
                analysis.renderable.push(item.i);
              } else {
                analysis.missing.push({
                  id: item.i,
                  moduleType,
                  availableComponents: Object.keys(paneMap)
                });
              }
              
              analysis.components[moduleType] = hasComponent;
            });
          }
          
          console.log('ServiceGrid Analysis:', analysis);
          return analysis;
        }
      };
      
      // Run analysis on mount
      window.debugServiceGrid.analyzePanes();
    }
    
    return () => {
      if (window.debugServiceGrid) {
        delete window.debugServiceGrid;
      }
    };
  }, [safeLayout, paneMap, services, modules, activeModules]);

  return (
    <div className="w-full mx-auto relative">
      {debugContent}
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