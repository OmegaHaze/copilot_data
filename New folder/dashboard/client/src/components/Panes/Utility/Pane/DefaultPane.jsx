//DO NOT USE THIS FILE DIRECTLY. THIS IS A PLACEHOLDER COMPONENT. NOT FOR USE AT ALL. EXAMPLE ONLY.

import PaneHeader from '../PaneHeader'
import { useState, useEffect } from 'react';

/**
 * DefaultPane - A fallback component for when a pane fails to load
 * @deprecated Use dynamic pane rendering instead of DefaultPane
 */
export default function DefaultPane({ name, status, logo, moduleType, slug, error, staticIdentifier }) {
  const [errorDetails, setErrorDetails] = useState({
    message: error || `No pane component found for ${slug || 'unknown'}`,
    timestamp: new Date().toISOString()
  });
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [componentRegistry, setComponentRegistry] = useState(null);

  // Dynamic import of ComponentRegistry
  useEffect(() => {
    const loadComponentRegistry = async () => {
      const registry = await import('../Loader/ComponentRegistry');
      setComponentRegistry(registry.componentRegistry);
    };

    loadComponentRegistry();
  }, []);

  // Check component registry for errors related to this component
  useEffect(() => {
    if (slug && componentRegistry) {
      const registryErrors = componentRegistry.getErrors && componentRegistry.getErrors();
      if (registryErrors && registryErrors[slug]) {
        const errInfo = registryErrors[slug];
        setErrorDetails({
          message: errInfo.error || error || `Failed to load component: ${slug}`,
          timestamp: errInfo.timestamp || new Date().toISOString(),
          details: errInfo.componentName ? `Component: ${errInfo.componentName}` : null
        });
      }
    }
  }, [slug, error, componentRegistry]);

  const handleReload = async () => {
    if (!slug) return;
    
    setLoading(true);
    setAttempts(a => a + 1);
    
    try {
      // Try to reload through global helper if available
      if (window.reloadComponentByName) {
        await window.reloadComponentByName(slug);
      }
      // Also try component registry directly
      else if (componentRegistry && componentRegistry.loadComponent) {
        await componentRegistry.loadComponent(slug, null, true); // Force reload
      }
      
      setErrorDetails(prev => ({
        ...prev,
        message: `Reload attempt ${attempts + 1} completed. Refresh the page if component appears.`
      }));
    } catch (err) {
      setErrorDetails(prev => ({
        ...prev,
        message: `Reload failed: ${err.message || 'Unknown error'}`,
        timestamp: new Date().toISOString()
      }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-full bg-black rounded border border-green-600/60 shadow-inner overflow-hidden">
      <PaneHeader 
        name={name || 'Unknown'} 
        status={status || 'Error'} 
        logo={logo} 
        moduleType={moduleType} 
        staticIdentifier={staticIdentifier || (slug && slug.split('-')[1]) || 'unknown'} 
      />
      <div className="p-4 text-xs text-green-400 flex flex-col gap-2">
        <p className="text-yellow-400 font-semibold">⚠️ {errorDetails.message}</p>
        <p>This is a placeholder pane. The component may be missing or failed to load.</p>
        
        {slug && (
          <div className="mt-2 text-green-500/80">
            <p><strong>Module ID:</strong> {slug}</p>
            {moduleType && <p><strong>Module Type:</strong> {moduleType}</p>}
            {errorDetails.details && <p><strong>Details:</strong> {errorDetails.details}</p>}
            <p><strong>Last attempt:</strong> {new Date(errorDetails.timestamp).toLocaleTimeString()}</p>
          </div>
        )}
        
        <div className="mt-4 flex gap-2">
          <button 
            onClick={handleReload}
            disabled={loading}
            className={`px-2 py-1 text-xs ${loading 
              ? 'bg-gray-700 cursor-not-allowed' 
              : 'bg-green-700/60 hover:bg-green-700'} text-white rounded flex items-center`}
          >
            {loading ? (
              <>
                <span className="animate-spin mr-1">⟳</span> Reloading...
              </>
            ) : (
              <>Reload Component</>
            )}
          </button>
          <button 
            onClick={() => window.location.reload()}
            className="px-2 py-1 text-xs bg-yellow-700/60 hover:bg-yellow-700 text-white rounded"
          >
            Refresh Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}
