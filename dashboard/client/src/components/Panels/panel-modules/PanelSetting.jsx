import { useContext } from 'react'
import { SettingsContext } from '../../Panes/Utility/Context/SettingsContext'
import { useNotifications } from '../../Notifications/NotificationSystem';
import { clearAllModuleData } from '../../Panes/Utility/Loader/Module/module-operations';

export default function PanelSetting({ 
  settingsOpen, 
  setSettingsOpen, 
  activeExplanation, 
  setActiveExplanation,
}) {
  const { open } = useContext(SettingsContext);
  const { notify, confirm } = useNotifications();

  const handleOpenSettings = () => {
    open('general')
  }

  const handleClearSession = async () => {
    const confirmed = await confirm(
      'This will clear your session data including layouts and active modules from both the server and localStorage. Are you sure?'
    );
    
    if (!confirmed) return;
    
    try {
      // Remove grid layout from server
      await fetch('/api/user/session/grid', { method: 'DELETE' });
      
      // Clear localStorage data with verbose logging
      const { clearModuleStorage } = await import('../../Panes/Utility/Loader/Module/module-storage');
      const clearResult = clearModuleStorage(true);
      
      console.log('[PanelSetting] Cleared localStorage data:', clearResult);
      
      notify(`Session cleared successfully. Removed ${clearResult.keysRemoved.length} items from localStorage. The page will now reload.`, 'success', 2000);
      setTimeout(() => window.location.reload(), 2000);
    } catch (err) {
      console.error('[Frontend] Session Clear Failed:', err);
      notify(err.message, 'error');
    }
  }
  
  const handleResetDb = async () => {
    const confirmed = await confirm(
      'WARNING: This will RESET the modules database AND clear localStorage, removing any test modules or invalid data that might be causing issues, but keeping essential system modules. Are you sure?',
      'error'
    );
    
    if (!confirmed) return;
    
    try {
      // Remove grid layout
      await fetch('/api/user/session/grid', { method: 'DELETE' });
      
      // Use our comprehensive function to clear everything
      const result = await clearAllModuleData('modules');
      
      if (result.success) {
        notify('Module database and localStorage reset successfully. The page will now reload.', 'success', 2000);
        setTimeout(() => window.location.reload(), 2000);
      } else {
        console.error('[Frontend] DB Reset Failed:', result.error);
        notify('Failed to reset data: ' + result.error, 'error');
      }
    } catch (err) {
      console.error('[Frontend] DB Reset Request Failed:', err);
      notify(err.message, 'error');
    }
  }
  
  const handleDeleteDb = async () => {
    const confirmed = await confirm(
      'WARNING: This will DELETE ALL database data AND localStorage including modules, layouts, and sessions. ALL data will be COMPLETELY DELETED with NO seed data or system modules. Are you sure?',
      'error'
    );
    
    if (!confirmed) return;
    
    try {
      // Remove grid layout
      await fetch('/api/user/session/grid', { method: 'DELETE' });
      
      // Use our comprehensive function to clear everything
      const result = await clearAllModuleData('all');
      
      if (result.success) {
        notify('Database and localStorage completely cleared successfully. The page will now reload.', 'success', 2000);
        setTimeout(() => window.location.reload(), 2000);
      } else {
        console.error('[Frontend] DB Clear Failed:', result.error);
        notify('Failed to clear all data: ' + result.error, 'error');
      }
    } catch (err) {
      console.error('[Frontend] DB Clear Request Failed:', err);
      notify(err.message, 'error');
    }
  }
  
  const handleExplanationClick = (explanationName) => {
    if (activeExplanation === explanationName) {
      setActiveExplanation(null)
    } else {
      setActiveExplanation(explanationName)
    }
  }

  const renderExplanation = (name) => {
    switch(name) {
      case 'settings':
        return (
          <div className="bg-black/70 backdrop-blur-sm p-3">
            <div className="crt-text4 text-xs">
              <p>System Settings allows you to configure:</p>
              <p className="mt-2">• Theme preferences</p>
              <p className="mt-1">• Interface options</p>
              <p className="mt-1">• System behavior</p>
            </div>
          </div>
        )
      case 'clear-session':
        return (
          <div className="bg-black/70 backdrop-blur-sm p-3">
            <div className="crt-text4 text-xs">
              <p>Clear Session will:</p>
              <p className="mt-2">• Reset all layout positioning</p>
              <p className="mt-1">• Clear grid layouts for all panes</p>
              <p className="mt-1">• Trigger regeneration of default layouts</p>
              <p className="mt-1">• Keep module definitions intact</p>
            </div>
          </div>
        )
      case 'reset-db':
        return (
          <div className="bg-black/70 backdrop-blur-sm p-3">
            <div className="crt-text4 text-xs">
              <p>Clear Modules DB will:</p>
              <p className="mt-2">• Clear the modules database with seed data</p>
              <p className="mt-1">• Remove any test or invalid modules</p>
              <p className="mt-1">• Re-initialize the module registry</p>
              <p className="mt-1">• Keep essential system modules</p>
              <p className="mt-1 text-yellow-400">• WARNING: This action cannot be undone!</p>
            </div>
          </div>
        )
      case 'delete-db':
        return (
          <div className="bg-black/70 backdrop-blur-sm p-3">
            <div className="crt-text4 text-xs">
              <p>Delete DB will:</p>
              <p className="mt-2">• Delete ALL database entries</p>
              <p className="mt-1">• Clear ALL layouts and session data</p>
              <p className="mt-1">• Delete ALL modules including system modules</p>
              <p className="mt-1">• Leave database completely empty with NO seed data</p>
              <p className="mt-1 text-red-400">• WARNING: This action cannot be undone!</p>
            </div>
          </div>
        )
      case 'reset-layout':
        return (
          <div className="bg-black/70 backdrop-blur-sm p-3">
            <div className="crt-text4 text-xs">
              <p>Reset will:</p>
              <p className="mt-2">• Clear browser cache and storage</p>
              <p className="mt-1">• Clear application data</p>
              <p className="mt-1">• Reset to initial state</p>
            </div>
          </div>
        )
      /* Debug tools moved to left panel */
      default:
        return null
    }
  }

  return (
    <div className="fixed md:absolute bottom-0 left-0 right-0 shadow-lg crt-text4 z-50 bg-black/50 backdrop-blur-sm">
      <button 
        onClick={() => setSettingsOpen(!settingsOpen)}
        className="w-full px-2 py-1 crt-link5 flex items-center"
      >
        <span className="w-6 crt-text4 ">{settingsOpen ? '▽' : '△'}</span>
        <span className="flex-grow text-right text-lg ">SETTINGS</span>
      </button>
      
      {settingsOpen && (
        <div>
          <div>
            <div className="flex items-center">
              <button 
                onClick={() => handleExplanationClick('settings')}
                className=" w-6 px-2 py-1 crt-link5"
              >
                <span>{activeExplanation === 'settings' ? '▽' : '◁'}</span>
              </button>
              <button 
                onClick={handleOpenSettings}
                className="flex-grow px-2 py-1 text-right crt-link5 text-lg"
              >
                [⚙] SYS SETTINGS
              </button>
            </div>
            {activeExplanation === 'settings' && renderExplanation('settings')}
          </div>

          <div>
            <div className="flex items-center">
              <button 
                onClick={() => handleExplanationClick('clear-session')}
                className="w-6 px-2 py-1 crt-link5"
              >
                <span>{activeExplanation === 'clear-session' ? '▽' : '◁'}</span>
              </button>
              <button 
                onClick={handleClearSession}
                className="flex-grow px-2 py-1 text-right crt-link5 text-lg text-orange-400"
              >
                [⟳] CLEAR SESSION
              </button>
            </div>
            {activeExplanation === 'clear-session' && renderExplanation('clear-session')}
          </div>

          <div>
            <div className="flex items-center">
              <button 
                onClick={() => handleExplanationClick('reset-db')}
                className="w-6 px-2 py-1 crt-link5"
              >
                <span>{activeExplanation === 'reset-db' ? '▽' : '◁'}</span>
              </button>
              <button 
                onClick={handleResetDb}
                className="flex-grow px-2 py-1 text-right crt-link5 text-lg text-yellow-500"
              >
                [⚠] CLEAR MODULES DB
              </button>
            </div>
            {activeExplanation === 'reset-db' && renderExplanation('reset-db')}
          </div>
          
          <div>
            <div className="flex items-center">
              <button 
                onClick={() => handleExplanationClick('delete-db')}
                className="w-6 px-2 py-1 crt-link5"
              >
                <span>{activeExplanation === 'delete-db' ? '▽' : '◁'}</span>
              </button>
              <button 
                onClick={handleDeleteDb}
                className="flex-grow px-2 py-1 text-right crt-link5 text-lg text-red-500"
              >
                [☢] DELETE DB
              </button>
            </div>
            {activeExplanation === 'delete-db' && renderExplanation('delete-db')}
          </div>

          <div>
            <div className="flex items-center">
              <button 
                onClick={() => handleExplanationClick('reset-layout')}
                className="w-6 px-2 py-1 crt-link5"
              >
                <span>{activeExplanation === 'reset-layout' ? '▽' : '◁'}</span>
              </button>
              <button 
                onClick={async () => {
                  // Clear all caches
                  if ('caches' in window) {
                    const cacheKeys = await caches.keys();
                    await Promise.all(cacheKeys.map(key => caches.delete(key)));
                    window.location.reload(true);
                  }
                }}
                className="flex-grow px-2 py-1 text-right crt-link5 text-lg"
              >
                [⟲] RESET
              </button>
            </div>
            {activeExplanation === 'reset-layout' && renderExplanation('reset-layout')}
          </div>

        </div>
      )}
    </div>
  )
}