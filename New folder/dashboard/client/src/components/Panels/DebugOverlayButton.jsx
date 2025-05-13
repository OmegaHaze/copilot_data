import React, { useState } from 'react';
import { useDebugOverlay } from '../Error-Handling/Diagnostics/DebugOverlayContext.jsx';

/**
 * Debug Overlay Toggle Button
 * A standalone component that uses the DebugOverlay context
 */
export default function DebugOverlayButton() {
  // Use the context directly
  const debugContext = useDebugOverlay();
  
  // Use proper error handling
  if (!debugContext) {
    console.error('Debug context not available in DebugOverlayButton');
    // Create a local fallback if context is not available
    const [localIsOpen, setLocalIsOpen] = useState(false);
    
    return (
      <button 
        className="bg-green-700 text-white hover:bg-green-600 px-3 py-1 rounded text-xs"
        onClick={() => {
          setLocalIsOpen(!localIsOpen);
          console.warn('Debug Overlay context not found, using local state');
        }}
      >
        Open Debug Overlay (Disconnected)
      </button>
    );
  }
  
  // Extract the toggleOverlay function from the context
  const { toggleOverlay } = debugContext;
  
  return (
    <button 
      className="bg-green-700 text-white hover:bg-green-600 px-3 py-1 rounded text-xs"
      onClick={toggleOverlay}
    >
      Open Debug Overlay
    </button>
  );
}
