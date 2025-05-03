// LaunchButtonNvidia.jsx - Properly launches the Nvidia pane with instanceId and layout updates
import { useContext, useState, useEffect } from 'react';
import { SettingsContext } from '../../../SettingsMenu/SettingsContext.jsx';
import { useSocket } from '../SocketContext.jsx';
import { 
  saveLayoutToSession, 
  saveLayoutToLocal, 
  BREAKPOINTS 
} from '../Loader/LayoutManager.js';
import { createLayoutItemForAllBreakpoints } from '../Loader/LayoutPositioning.js';
import { componentRegistry } from '../Loader/ComponentRegistry.js';

export default function LaunchButtonNvidia({ moduleType, label = null }) {
  const { gridLayout, setGridLayout, activeModules, setActiveModules } = useContext(SettingsContext);
  const { socket } = useSocket();
  const [isLaunching, setIsLaunching] = useState(false);
  const [error, setError] = useState(null);
  const [isComponentAvailable, setIsComponentAvailable] = useState(null);
  
  // Pre-load the component on mount to ensure it's ready
  useEffect(() => {
    const preloadComponent = async () => {
      try {
        // Check if the component already exists in the registry
        if (componentRegistry.hasComponent(moduleType)) {
          setIsComponentAvailable(true);
          return;
        }
        
        // Try to pre-load the component
        const component = await componentRegistry.loadComponent(moduleType);
        setIsComponentAvailable(!!component);
        
        if (!component) {
          console.warn(`Component for ${moduleType} is not available`);
        }
      } catch (err) {
        console.error(`Error pre-loading component for ${moduleType}:`, err);
        setIsComponentAvailable(false);
      }
    };
    
    preloadComponent();
  }, [moduleType]);

  const handleLaunch = async () => {
    if (isLaunching) return; // Prevent multiple clicks
    
    setIsLaunching(true);
    setError(null);
    
    // Check if the component exists in the registry
    if (!componentRegistry.hasComponent(moduleType)) {
      console.error(`Component ${moduleType} is not available`);
      setError(`Component ${moduleType} is not available`);
      setIsLaunching(false);
      
      // Show error in notification system if available
      if (window.errorSystem && typeof window.errorSystem.showError === 'function') {
        window.errorSystem.showError(
          `Failed to launch: Component ${moduleType} is not available`, 
          'error',
          10000
        );
      }
      return;
    }
    
    // Ensure activeModules is always an array
    const safeActiveModules = Array.isArray(activeModules) ? activeModules : [];
    
    // Generate a unique instanceId using the registry
    const instanceId = componentRegistry.generateInstanceId();
    
    // Create the unique pane identifier that combines moduleType + instanceId
    const paneId = componentRegistry.createPaneId(moduleType, instanceId);
    
    // Register the instance in the registry
    componentRegistry.registerInstance(moduleType, instanceId);
    
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

      // 5. Update active modules in session
      console.log('Updating active modules on server:', updatedModules);
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
          console.log('Active modules updated:', responseData);
        }
      } catch (moduleError) {
        console.error('Error updating active modules:', moduleError);
        // Continue despite failure - we can still try to update the layout
      }

      // 6. Save updated layout to session
      console.log('Saving layout to session:', updatedLayout);
      const layoutData = await saveLayoutToSession(updatedLayout);
      
      if (!layoutData) {
        throw new Error('Failed to save layout to session');
      }
      
      // 7. Emit socket event to notify other components
      if (socket && typeof socket.emit === 'function') {
        console.log('Emitting pane:launched event');
        socket.emit("pane:launched", { 
          moduleType,
          module_type: moduleType, // Add module_type for backend compatibility
          instanceId, 
          paneId,
          timestamp: Date.now()
        });
        
        // Also emit a direct connection to the module's namespace
        console.log(`Requesting connection to module namespace: ${moduleType}`);
        socket.emit("connect:module", {
          name: moduleType,
          module_type: moduleType
        });
      }
      
      console.log(`Successfully launched module ${moduleType} with instance ID ${instanceId}`);
    } catch (err) {
      console.error(`Failed to launch pane: ${moduleType}`, err);
      setError(err.message || 'Failed to launch module');
      
      // Show error in notification system if available
      if (window.errorSystem && typeof window.errorSystem.showError === 'function') {
        window.errorSystem.showError(
          `Failed to launch module: ${err.message}`, 
          'error',
          10000
        );
      }
    } finally {
      setIsLaunching(false);
    }
  };

  return (
    <div className="p-2">
      <button
        onClick={handleLaunch}
        disabled={isLaunching || isComponentAvailable === false}
        title={isComponentAvailable === false ? `Component ${moduleType} is not available` : `Launch ${label || moduleType}`}
        className={`px-4 py-1 rounded text-xs ${
          isLaunching ? 'bg-gray-400' : 
          isComponentAvailable === false ? 'bg-red-400' : 
          'bg-blue-600'
        } text-white hover:opacity-80`}
      >
        {isLaunching ? 'Launching...' : 
         isComponentAvailable === false ? 'Unavailable' : 
         label || 'Launch'}
      </button>
      {error && (
        <div className="text-red-500 text-xs mt-1">{error}</div>
      )}
    </div>
  );
}