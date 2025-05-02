import { useContext } from 'react'
import { SettingsContext } from '../../../SettingsMenu/SettingsContext.jsx'
import { useSocket } from '../../../Panes/Utility/SocketContext.jsx'
import LaunchButton from './LaunchButton.jsx'
import { saveLayoutToSession } from './LayoutManager.js'

export default function ModulePaneToggle({ slug, label = null }) {
  const { gridLayout, setGridLayout, activeModules, setActiveModules } = useContext(SettingsContext)
  const { socket } = useSocket()

  // Check if this module has any active instances
  const findActiveInstances = () => {
    if (!Array.isArray(activeModules)) return [];
    
    // Look for any modules that start with the base name
    return activeModules.filter(moduleId => 
      moduleId === slug || // Legacy case - plain module name
      (moduleId.includes('-') && moduleId.split('-')[0] === slug) // New format: moduleType-instanceId
    );
  };
  
  const activeInstances = findActiveInstances();
  const hasActiveInstances = activeInstances.length > 0;

  const handleRemove = async () => {
    try {
      // 1. Get the active instances
      const instances = findActiveInstances();
      if (instances.length === 0) return;
      
      // 2. Filter out these instances from activeModules  
      const updatedModules = Array.isArray(activeModules) 
        ? activeModules.filter(id => !instances.includes(id))
        : [];
      
      // 3. Update active modules in session
      await fetch("/api/user/session/modules", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include", 
        body: JSON.stringify(updatedModules)
      });
      
      // 4. Remove from layout
      const updatedLayout = { ...gridLayout };
      Object.keys(updatedLayout).forEach(bp => {
        if (Array.isArray(updatedLayout[bp])) {
          updatedLayout[bp] = updatedLayout[bp].filter(item => 
            !instances.includes(item.i)
          );
        }  
      });
      
      // 5. Save layout
      await saveLayoutToSession(updatedLayout);
      
      // 6. Update local state
      setGridLayout(updatedLayout);
      setActiveModules(updatedModules);
      
      // 7. Emit socket event to notify other components
      socket?.emit?.("pane:removed", {
        moduleType: slug,
        instanceIds: instances,
        timestamp: new Date().getTime()
      });
      
      console.log(`🗑️ Removed all ${slug} instances:`, instances);
    } catch (err) {
      console.error(`Failed to remove pane: ${slug}`, err);
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
        <LaunchButton moduleType={slug} label={label} />
      )}
    </div>
  )
}
