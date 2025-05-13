import { useContext } from 'react';
import { SettingsContext } from '../Context/SettingsContext.jsx'
import { useSocket } from '../Context/SocketContext.jsx'
import LaunchButtonSuper from '../Launchers/LaunchButtonSuper.jsx'
import { saveLayoutsToSession } from './LayoutManager.js'
import { componentRegistry } from './ComponentRegistry';
import { updateModulesSession } from './SessionManager.js'
import { useError } from '../../../Error-Handling/Diagnostics/ErrorNotificationSystem.jsx';

export default function ModulePaneToggle({ slug, label = null }) {
  const { gridLayout, setGridLayout, activeModules, setActiveModules } = useContext(SettingsContext)
  const { socket } = useSocket()
  const { showError } = useError();
  
  // Find active instances of this module type
  const findActiveInstances = () => {
    if (!Array.isArray(activeModules) || !slug) return [];
    
    const moduleType = componentRegistry.getCanonicalKey(slug);
    return activeModules.filter(id => id.startsWith(`${moduleType}-`));
  };
  
  const hasActiveInstances = findActiveInstances().length > 0;

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
      await saveLayoutsToSession(updatedLayouts, updatedModules);
      
      // Notify other components
      if (socket?.emit) {
        socket.emit("pane:removed", {
          moduleType: slug,  
          instanceIds: instances,
          timestamp: Date.now()
        });
      }
    } catch (err) {
      showError(
        `Failed to remove pane ${slug}: ${err.message}`,
        'error'
      );
    }
  };

  // Either launch a new instance or remove existing ones
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