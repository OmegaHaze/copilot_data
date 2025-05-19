import React from 'react';
import { initComponentSystem } from '../../Panes/Utility/Loader/Component/component-index.js';
import registry from '../../Panes/Utility/Loader/Component/component-registry.js';

/**
 * Module reload button for debugging
 */
export default function ModuleReloadButton() {
  const reloadModules = async () => {
    try {
      console.log('🔄 Reloading all modules...');

      const result = await initComponentSystem();

      if (result.success) {
        console.log('✅ Module reload successful!');
        console.log('Total components:', result.componentCount);

        console.log('Module data:', registry.getModuleData());

        const hasSupervisor = registry.hasComponent('SYSTEM-SupervisorPane');
        console.log('Has SYSTEM-SupervisorPane:', hasSupervisor);

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
