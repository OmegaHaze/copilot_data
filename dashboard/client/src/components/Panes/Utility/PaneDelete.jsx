// components/Panes/Utility/PaneDelete.jsx
import { useState, useContext } from 'react'
import { SettingsContext } from './Context/SettingsContext'
import DeleteConfirmationDialog from '../../Error-Handling/DeleteConfirmationDialog'
import { deletePaneState, removeModule } from './Loader/Session/session-api'
import { saveSessionLayouts, saveSessionModules } from './Loader/Session/session-index'

export default function PaneDelete({ name, _gridId }) {
  const { activeModules, setActiveModules, gridLayout, setGridLayout } = useContext(SettingsContext)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  // Handle the pane deletion
  const handlePaneDelete = async () => {
    try {
      if (!_gridId) {
        console.error("Cannot remove pane: No grid ID provided")
        return
      }
      
      console.log(`Complete pane deletion process for: ${_gridId}`);
      
      // Setup updated state
      const updatedModules = Array.isArray(activeModules) ? 
        activeModules.filter(id => id !== _gridId) : [];
      
      // Update layout state
      const updatedLayouts = { ...gridLayout }
      Object.keys(updatedLayouts).forEach(bp => {
        if (Array.isArray(updatedLayouts[bp])) {
          updatedLayouts[bp] = updatedLayouts[bp].filter(item => item.i !== _gridId)
        }
      })
      
      // Update UI immediately for responsiveness
      setActiveModules(updatedModules)
      setGridLayout(updatedLayouts)

      // COMPREHENSIVE DELETION PROCESS
      // 1. DELETE module from active_modules list and layout
      console.log(`1. DELETE module from session modules: ${_gridId}`);
      try {
        // Use API function
        await removeModule(_gridId);
      } catch (err) {
        console.warn(`Failed to use removeModule API, trying direct fetch: ${err.message}`);
        // Direct fetch fallback
        await fetch(`/api/user/session/modules/${_gridId}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // 2. DELETE pane state specifically
      console.log(`2. DELETE pane state: ${_gridId}`);
      try {
        await deletePaneState(_gridId);
      } catch (err) {
        console.warn(`Failed to delete pane state via API, trying direct fetch: ${err.message}`);
        await fetch(`/api/user/session/pane/${_gridId}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // 3. GET current session data to find orphaned panes
      console.log(`3. Checking for orphaned pane states...`);
      try {
        const sessionResponse = await fetch('/api/user/session');
        const sessionData = await sessionResponse.json();
        
        // Extract module type pattern without instance ID
        const moduleBaseName = _gridId.split('-').slice(0, -1).join('-');
        console.log(`Looking for orphaned panes with pattern: ${moduleBaseName}`);
        
        // Check for orphaned pane states
        if (sessionData && sessionData.pane_states) {
          for (const stateId of Object.keys(sessionData.pane_states)) {
            // If it matches our pattern but isn't in active modules
            if (stateId.startsWith(moduleBaseName) && 
                (!Array.isArray(sessionData.active_modules) || 
                 !sessionData.active_modules.includes(stateId))) {
              console.log(`Found orphaned pane state to clean: ${stateId}`);
              
              // Delete orphaned pane state
              await fetch(`/api/user/session/pane/${stateId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
              });
              console.log(`Deleted orphaned pane state: ${stateId}`);
            }
          }
        }
      } catch (err) {
        console.warn(`Error checking for orphaned states: ${err.message}`);
      }

      // 5. Save updated modules and layouts via API
      console.log(`5. Saving updated modules and layouts via API`);
      try {
        await saveSessionModules(updatedModules);
        await saveSessionLayouts(updatedLayouts);
      } catch (err) {
        console.warn(`Error saving session data via API: ${err.message}`);
      }

      // 6. Clean local storage session data
      console.log(`6. Cleaning local session storage`);
      try {
        const sessionKey = 'vaio_session';
        const sessionData = JSON.parse(sessionStorage.getItem(sessionKey) || '{}');
        
        // Remove from active_modules
        if (sessionData.active_modules) {
          sessionData.active_modules = sessionData.active_modules.filter(id => id !== _gridId);
        }
        
        // Remove from pane_states
        if (sessionData.pane_states && sessionData.pane_states[_gridId]) {
          delete sessionData.pane_states[_gridId];
        }
        
        // Clean layouts
        if (sessionData.gridLayout) {
          Object.keys(sessionData.gridLayout).forEach(bp => {
            if (Array.isArray(sessionData.gridLayout[bp])) {
              sessionData.gridLayout[bp] = sessionData.gridLayout[bp].filter(item => item.i !== _gridId);
            }
          });
        }
        
        // Save updated data
        sessionStorage.setItem(sessionKey, JSON.stringify(sessionData));
      } catch (err) {
        console.warn(`Error cleaning local session storage: ${err.message}`);
      }
      
      console.log(`✅ Complete pane deletion successful: ${_gridId}`);
      setShowDeleteDialog(false);
    } catch (err) {
      console.error(`Failed to remove pane: ${_gridId}`, err);
      setShowDeleteDialog(false);
    }
  }

  // Handle direct deletion logic
  const handleDirectDelete = async () => {
    // Only proceed if we have an actual grid ID
    if (!_gridId) {
      console.warn("Cannot remove pane: No grid ID provided")
      return
    }
    
    // COMPREHENSIVE DIRECT DELETION
    console.log(`Direct delete ALL occurrences of module ${_gridId}`);
    try {
      // 1. DELETE PANE STATE
      console.log(`1. Deleting pane state: ${_gridId}`);
      await fetch(`/api/user/session/pane/${_gridId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      
      // 2. DELETE FROM ACTIVE MODULES
      console.log(`2. Deleting from active_modules: ${_gridId}`);
      await fetch(`/api/user/session/modules/${_gridId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      
      // 3. GET CURRENT SESSION DATA
      console.log(`3. Fetching current session data for cleanup...`);
      const sessionResponse = await fetch('/api/user/session');
      const sessionData = await sessionResponse.json();
      
      // 4. CLEANUP ORPHANED PANE STATES WITH SAME BASE NAME
      const moduleBaseName = _gridId.split('-').slice(0, -1).join('-');
      console.log(`4. Looking for orphaned states with base: ${moduleBaseName}`);
      
      if (sessionData && sessionData.pane_states) {
        for (const stateId of Object.keys(sessionData.pane_states)) {
          if (stateId.startsWith(moduleBaseName)) {
            console.log(`Deleting related pane state: ${stateId}`);
            await fetch(`/api/user/session/pane/${stateId}`, {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' }
            });
          }
        }
      }
      
      // 5. FIX BROWSER STORAGE INCONSISTENCIES
      console.log(`5. Fixing storage inconsistencies`);
      
      // Fix localStorage vaio_active_modules
      const activeModulesList = JSON.parse(localStorage.getItem('vaio_active_modules') || '[]');
      if (Array.isArray(activeModulesList)) {
        const updatedList = activeModulesList.filter(id => id !== _gridId);
        localStorage.setItem('vaio_active_modules', JSON.stringify(updatedList));
        console.log(`Updated localStorage vaio_active_modules`);
      }
      
      // Fix sessionStorage vaio_session
      const sessionStorageData = JSON.parse(sessionStorage.getItem('vaio_session') || '{}');
      if (sessionStorageData) {
        // Fix active modules in session storage
        if (sessionStorageData.activeModules) {
          sessionStorageData.activeModules = sessionStorageData.activeModules.filter(id => id !== _gridId);
        }
        
        // Fix pane states in session storage
        if (sessionStorageData.pane_states && sessionStorageData.pane_states[_gridId]) {
          delete sessionStorageData.pane_states[_gridId];
        }
        
        // Also check for related pane states with same base name
        if (sessionStorageData.pane_states) {
          Object.keys(sessionStorageData.pane_states).forEach(stateId => {
            if (stateId.startsWith(moduleBaseName)) {
              delete sessionStorageData.pane_states[stateId];
            }
          });
        }
        
        sessionStorage.setItem('vaio_session', JSON.stringify(sessionStorageData));
        console.log(`Updated sessionStorage vaio_session`);
      }
      
      // Update vaio_layouts as well
      const layoutsData = JSON.parse(localStorage.getItem('vaio_layouts') || '{}');
      if (layoutsData) {
        Object.keys(layoutsData).forEach(bp => {
          if (Array.isArray(layoutsData[bp])) {
            layoutsData[bp] = layoutsData[bp].filter(item => item.i !== _gridId);
          }
        });
        localStorage.setItem('vaio_layouts', JSON.stringify(layoutsData));
        console.log(`Updated localStorage vaio_layouts`);
      }
      
      console.log(`🧹 Successfully cleaned up ALL occurrences of ${_gridId}`);
    } catch (err) {
      console.error(`Failed during direct deletion: ${err.message}`);
    }
    
    // Show confirmation dialog for the rest of the deletion process
    setShowDeleteDialog(true);
  }

  return (
    <>
      {/* Remove button */}
      <button
        onMouseDown={(e) => e.stopPropagation()}
        onClick={async (e) => {
          e.stopPropagation();
          await handleDirectDelete();
        }}
        className="text-red-400 hover:text-red-500 mr-2 cursor-pointer"
        title="Remove pane"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
      
      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        paneName={name}
        onConfirm={handlePaneDelete}
      />
    </>
  )
}
