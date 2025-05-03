import React from 'react';

/**
 * Button component to test the Debug Overlay functionality
 */
export default function DebugOverlayTestButton() {
  // Function to open the debug overlay programmatically
  const openDebugOverlay = () => {
    // Check if the debug window toggle function is available
    if (typeof window.toggleDebugOverlay === 'function') {
      // Open the debug overlay
      window.toggleDebugOverlay();
    } else {
      // Fallback to dispatching a custom event if the function isn't available
      const event = new CustomEvent('vaio:toggle-debug-overlay', {
        detail: { forced: true }
      });
      window.dispatchEvent(event);
      
      // Also show a notification to confirm the action
      if (window.errorSystem && typeof window.errorSystem.showInfo === 'function') {
        window.errorSystem.showInfo('Opening debug overlay...', 'debug');
      }
    }
  };

  return (
    <button 
      onClick={openDebugOverlay}
      className="crt-border6 px-2 py-1 rounded text-green-300 hover:bg-green-900/20 hover:text-green-200 transition-all text-xs flex items-center debug-item-hover"
      title="Open Debug Overlay"
    >
      <span className="crt-text4 inline-flex items-center">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5 shadow-glow-sm shadow-green-500/40 debug-indicator"></span>
        DBG
      </span>
    </button>
  );
}
