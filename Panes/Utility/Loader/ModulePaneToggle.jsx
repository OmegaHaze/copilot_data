import { useContext } from 'react';
import { useError } from '../../../Error-Handling/Diagnostics/ErrorNotificationSystem.jsx';
import { SettingsContext } from '../Context/SettingsContext.jsx'
import { useSocket } from '../Context/SocketContext.jsx'
import LaunchButtonSuper from '../Launchers/LaunchButtonSuper.jsx'
import { saveLayoutsToSession } from './LayoutManager.js'
import { componentRegistry } from './ComponentRegistry.js'
import { updateModulesSession } from './SessionManager.js'

export default function ModulePaneToggle({ slug, label = null }) {
  const { gridLayout, setGridLayout, activeModules, setActiveModules } = useContext(SettingsContext)
  const { socket } = useSocket()

  // Check if this module has any active instances
  const findActiveInstances = () => {
    if (!Array.isArray(activeModules)) return [];
    
    const canonicalSlug = componentRegistry.getCanonicalKey(slug);
    
    // Look for any modules that match the canonical key
    return activeModules.filter(moduleId => {
      const moduleKey = componentRegistry.getCanonicalKey(moduleId);
      return moduleKey === canonicalSlug;
    });
  };
  
  const activeInstances = findActiveInstances();
  const hasActiveInstances = activeInstances.length > 0;

  const handleRemove = async () => {
    try {
      // Get active instances
      const instances = findActiveInstances();
      if (instances.length === 0) return;
      
      // Update context state first
      const updatedModules = activeModules.filter(id => !instances.includes(id));
      const updatedLayouts = { ...gridLayout };
      
      Object.keys(updatedLayouts).forEach(bp => {
        if (Array.isArray(updatedLayouts[bp])) {
          updatedLayouts[bp] = updatedLayouts[bp].filter(item => 
            !instances.includes(item.i)
          );
        }
      });
      
      // Update context state
      setActiveModules(updatedModules);
      setGridLayout(updatedLayouts);
      
      // Persist state changes
      try {
        await Promise.all([
          saveLayoutsToSession(updatedLayouts),
          updateModulesSession(updatedModules)
        ]);
      } catch (err) {
        showError(
          `Failed to persist pane removal: ${err.message}`,
          'error'
        );
      }
      
      // Notify other components
      if (socket?.emit) {
        socket.emit("pane:removed", {
          moduleType: slug,  
          instanceIds: instances,
          timestamp: Date.now()
        });
      }
      
      console.log(`🗑️ Removed all ${slug} instances:`, instances);
    } catch (err) {
      showError(
        `Failed to remove pane ${slug}: ${err.message}`,
        'error'
      );
    }
  };

  // We want to either launch a new instance or remove all existing instances
  return (
    <div className="p-2">
      {hasActiveInstances ? (
        <button
          onClick={handleRemove}
          className="px-4 py-1 rounded text-xs bg-red-700 text-white hover:opacity-80"
        >
          Remove {label || slug}
        </button>
      ) : (
        <LaunchButtonSuper moduleType={slug} label={label} />
      )}
    </div>
  )
}