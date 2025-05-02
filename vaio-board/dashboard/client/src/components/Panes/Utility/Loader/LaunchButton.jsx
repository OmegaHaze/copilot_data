// LaunchButton.jsx - Properly launches a module with instanceId and layout updates
import { useContext, useState } from 'react';
import { SettingsContext } from '../../../SettingsMenu/SettingsContext.jsx';
import { useSocket } from '../SocketContext.jsx';
import { 
  saveLayoutToSession, 
  saveLayoutToLocal, 
  BREAKPOINTS 
} from './LayoutManager.js';
import { createLayoutItemForAllBreakpoints } from './LayoutPositioning.js';

export default function LaunchButton({ moduleType, label = null }) {
  const { gridLayout, setGridLayout, activeModules, setActiveModules } = useContext(SettingsContext);
  const { socket } = useSocket();
  const [isLaunching, setIsLaunching] = useState(false);
  const [error, setError] = useState(null);

  const handleLaunch = async () => {
    if (isLaunching) return; // Prevent multiple clicks
    
    setIsLaunching(true);
    setError(null);
    
    // Ensure activeModules is always an array
    const safeActiveModules = Array.isArray(activeModules) ? activeModules : [];
    
    // Generate a unique instanceId using the same method as your system
    const instanceId = Math.random().toString(36).substring(2, 8);
    
    // Create the unique pane identifier that combines moduleType + instanceId
    const paneId = `${moduleType}-${instanceId}`;
    
    console.log(`LaunchButton: Creating new instance of ${moduleType} with ID ${paneId}`);

    try {
      // 1. Use LayoutPositioning utility to create optimally positioned layout items
      const newLayoutItems = createLayoutItemForAllBreakpoints(moduleType, instanceId, gridLayout);
      if (!newLayoutItems) {
        throw new Error('Failed to create layout items');
      }
      
      // Ensure layout items have the moduleType property set correctly
      Object.values(newLayoutItems).forEach(item => {
        item.moduleType = moduleType; // Explicitly set moduleType
      });
      
      console.log(`LaunchButton: Created layout items with moduleType=${moduleType}:`, newLayoutItems);
      
      // 2. Create a proper updated layout structure
      const updatedLayout = { ...gridLayout };
      
      // Ensure all breakpoints exist with proper initialization
      BREAKPOINTS.forEach(bp => {
        // Initialize empty arrays for any missing breakpoints
        if (!updatedLayout[bp]) {
          updatedLayout[bp] = [];
        }
        
        // Add the new layout item for this breakpoint
        if (newLayoutItems[bp]) {
          updatedLayout[bp] = [...updatedLayout[bp], newLayoutItems[bp]];
        }
      });
      
      // 3. Add to active modules list
      const updatedModules = [...safeActiveModules, paneId];

      // 4. Update local state immediately for responsive UI
      setGridLayout(updatedLayout);
      setActiveModules(updatedModules);

      // 5. Save to localStorage as fallback
      console.log('💾 Saving to localStorage as fallback');
      saveLayoutToLocal(updatedLayout);

      // 6. Update active modules in session
      console.log('📝 Updating active modules on server:', updatedModules);
      try {
        const moduleResponse = await fetch("/api/user/session/modules", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(updatedModules)
        });
        
        if (!moduleResponse.ok) {
          console.error(`Failed to update active modules: ${moduleResponse.status}`);
          // Continue despite failure - we can still try to update the layout
        } else {
          const responseData = await moduleResponse.json();
          console.log('✅ Active modules updated:', responseData);
        }
      } catch (moduleError) {
        console.error('❌ Error updating active modules:', moduleError);
        // Continue despite failure - we can still try to update the layout
      }

      // 7. Save updated layout to session
      console.log('📊 Saving layout to session:', updatedLayout);
      const layoutData = await saveLayoutToSession(updatedLayout);
      
      if (!layoutData) {
        throw new Error('Failed to save layout to session');
      }
      
      // 8. Emit socket event to notify other components
      if (socket && typeof socket.emit === 'function') {
        console.log('🔄 Emitting pane:launched event');
        socket.emit("pane:launched", { 
          moduleType,
          module_type: moduleType, // Add module_type for backend compatibility
          instanceId, 
          paneId,
          timestamp: Date.now()
        });
        
        // Also emit a direct connection to the module's namespace
        console.log(`🔌 Requesting connection to module namespace: ${moduleType}`);
        socket.emit("connect:module", {
          name: moduleType,
          module_type: moduleType
        });
        
        // Add direct debug info to help diagnose component loading issues
        if (window.vaioDebug) {
          window.vaioDebug.log(`LaunchButton: Launched ${moduleType} module with ID ${paneId}`);
          
          // For supervisor specifically, check if the component is loaded
          if (moduleType === 'supervisor' && window.components) {
            const hasComponent = !!window.components['supervisor'];
            window.vaioDebug.log(`Supervisor component availability: ${hasComponent ? 'Yes' : 'No'}`);
          }
        }
      }
      
      console.log(`✅ Successfully launched module ${moduleType} with instance ID ${instanceId}`);
    } catch (err) {
      console.error(`❌ Failed to launch pane: ${moduleType}`, err);
      setError(err.message || 'Failed to launch module');
      
      // Show error and continue - don't revert state changes since 
      // we already have localStorage backup
    } finally {
      setIsLaunching(false);
    }
  };

  return (
    <div className="p-2">
      <button
        onClick={handleLaunch}
        disabled={isLaunching}
        className={`px-4 py-1 rounded text-xs ${isLaunching ? 'bg-gray-400' : 'bg-blue-600'} text-white hover:opacity-80`}
      >
        {isLaunching ? 'Launching...' : `Launch ${label || moduleType}`}
      </button>
      {error && (
        <div className="text-red-500 text-xs mt-1">{error}</div>
      )}
    </div>
  );
}