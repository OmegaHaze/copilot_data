/**
 * Transform layouts data based on session data and items
 * @param {Object} options - Options object
 * @param {Object} options.sessionData - Session data from server
 * @param {Array} options.items - Available module items
 * @returns {Object} The transformed layouts
 */
export async function transformLayouts({ sessionData, items }) {
  try {
    // Handle no session data
    if (!sessionData || typeof sessionData !== 'object') {
      console.warn('No session data provided or invalid format, returning empty layouts');
      return createEmptyLayouts();
    }

    // Extra debug information
    console.log('Transform layouts - session data available:', {
      hasGridLayout: !!sessionData.grid_layout,
      activeModulesCount: sessionData?.active_modules?.length || 0,
      sessionDataType: typeof sessionData,
      sessionKeys: Object.keys(sessionData)
    });

    // Transform session layouts data with extra safety
    let fromSession;
    try {
      fromSession = hydrateLayoutsFromDB(sessionData?.grid_layout);
      console.log('Layouts hydrated successfully:', {
        success: !!fromSession,
        hasBreakpoints: fromSession ? Object.keys(fromSession).length > 0 : false
      });
    } catch (hydrateError) {
      console.error('Error hydrating layouts from DB:', hydrateError);
      fromSession = createEmptyLayouts();
    }
    
    // Validate and auto-fix the hydrated layouts
    const isValidLayout = isValidResponsiveLayout(fromSession, true);
    if (!isValidLayout) {
      console.warn('Invalid layouts after hydration and auto-fix, forcing empty layouts');
      return createEmptyLayouts();
    }
    
    // Check for active modules that need layouts items
    const hasActiveModules = Array.isArray(sessionData?.active_modules) && sessionData.active_modules.length > 0;
    if (hasActiveModules) {
      const hasLayoutsItems = countLayoutsItems(fromSession) > 0;
      
      // Create layouts items for active modules if none exist
      if (!hasLayoutsItems) {
        console.log('Creating layouts items for active modules');
        const newLayouts = createEmptyLayouts();

        for (const moduleId of sessionData.active_modules) {
          if (moduleId && typeof moduleId === 'string' && moduleId.includes('-')) {
            const [moduleType, instanceId] = moduleId.split('-');
            
            try {
              const layoutsItems = createLayoutItemForAllBreakpoints(moduleType, instanceId, newLayouts);
              
              // Add items to each breakpoint
              Object.entries(layoutsItems).forEach(([bp, item]) => {
                if (item) {
                  item.i = moduleId;
                  item.moduleType = moduleType;
                  newLayouts[bp].push(item);
                }
              });
            } catch (itemError) {
              console.error(`Error creating layout item for module ${moduleId}:`, itemError);
              // Continue with the next module
            }
          }
        }

        return newLayouts;
      }
    }

    // Use existing layouts or create empty one
    return fromSession && Object.keys(fromSession).length > 0
      ? fromSession
      : createEmptyLayouts();
  } catch (error) {
    console.error('Error in transformLayouts:', error);
    return createEmptyLayouts();
  }
}
