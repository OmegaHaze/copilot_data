import React from 'react';
import { componentRegistry } from '../Panes/Utility/Loader/ComponentRegistry.js';
import { initializeComponentRegistry } from '../Panes/Utility/Loader/ ComponentRegistryInitializer.js';

/**
 * Module reload button for debugging
 */
export default function ModuleReloadButton() {
  const reloadModules = async () => {
    try {
      console.log('🔄 Reloading all modules...');
      
      // Reinitialize component registry
      const result = await initializeComponentRegistry();
      
      if (result.success) {
        console.log('✅ Module reload successful!');
        console.log('Total components:', result.componentCount);
        console.log('Module data:', componentRegistry.getModuleData());
        
        // Check for supervisor component specifically
        const hasSupervisor = componentRegistry.hasComponent('supervisor');
        console.log('Has supervisor component:', hasSupervisor);
        
        // Alert the user
        window.alert(`Modules reloaded successfully. ${result.componentCount} components available.`);
      } else {
        console.error('❌ Module reload failed:', result.error);
        window.alert(`Module reload failed: ${result.error}`);
      }
    } catch (err) {
      console.error('❌ Error reloading modules:', err);
      window.alert(`Error reloading modules: ${err.message}`);
    }
  };
  
  return (
    <button
      onClick={reloadModules}
      className="px-2 py-1 bg-blue-700 text-white text-xs rounded hover:bg-blue-600"
    >
      Reload Modules
    </button>
  );
}
