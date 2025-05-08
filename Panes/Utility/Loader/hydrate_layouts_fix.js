/**
 * Rehydrate layouts data from storage format
 * @param {Object|string} storedLayouts - Layouts data from storage
 * @returns {Object} Processed layouts ready for use
 */
export function hydrateLayoutsFromDB(storedLayouts) {
  try {
    // Handle completely undefined or null input
    if (!storedLayouts) {
      console.warn('hydrateLayoutsFromDB: No stored layouts data provided');
      return createEmptyLayouts();
    }
    
    // Parse JSON string if needed
    if (typeof storedLayouts === 'string') {
      try {
        storedLayouts = JSON.parse(storedLayouts);
      } catch (parseErr) {
        console.warn('hydrateLayoutsFromDB: Failed to parse layouts JSON:', parseErr);
        return createEmptyLayouts();
      }
    }

    // Validate basic structure
    if (typeof storedLayouts !== 'object') {
      console.warn(`hydrateLayoutsFromDB: Invalid layouts type: ${typeof storedLayouts}`);
      return createEmptyLayouts();
    }
    
    // Check if it's an empty object
    if (Object.keys(storedLayouts).length === 0) {
      console.warn('hydrateLayoutsFromDB: Empty layout object');
      return createEmptyLayouts();
    }

    // Convert different storage formats
    const convertedLayouts = {};
    DEFAULT_BREAKPOINTS.forEach(bp => {
      // Initialize each breakpoint with an empty array
      convertedLayouts[bp] = [];
      
      // Skip if no data for this breakpoint
      if (!storedLayouts[bp]) return;
      
      // Check if we have a valid value for this breakpoint
      if (Array.isArray(storedLayouts[bp])) {
        // Standard array format - filter out any invalid items
        convertedLayouts[bp] = storedLayouts[bp].filter(item => item && typeof item === 'object');
      } 
      else if (typeof storedLayouts[bp] === 'object') {
        // Handle object/dictionary format by converting it to array
        const values = Object.values(storedLayouts[bp]);
        if (Array.isArray(values)) {
          convertedLayouts[bp] = values.filter(item => item && typeof item === 'object');
        }
      }
    });

    // Normalize the layouts (makes sure all required breakpoints exist)
    const normalized = normalizeLayouts(convertedLayouts);
    
    // Verify that we have valid breakpoints
    const hasValidData = DEFAULT_BREAKPOINTS.some(bp => 
      Array.isArray(normalized[bp]) && normalized[bp].length > 0
    );
    
    if (!hasValidData) {
      console.warn('hydrateLayoutsFromDB: No valid data in any breakpoint');
    }

    return normalized;
  } catch (err) {
    console.warn('hydrateLayoutsFromDB: Error processing layouts data:', err);
    return createEmptyLayouts();
  }
}
