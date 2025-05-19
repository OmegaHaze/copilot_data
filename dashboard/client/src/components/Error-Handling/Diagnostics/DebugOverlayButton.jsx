import React from 'react';
import { useDebugOverlay } from './DebugOverlayContext.jsx';

/**
 * Debug Overlay Toggle Button
 * A standalone component that uses the DebugOverlay context
 */
export default function DebugOverlayButton() {
  const { toggleOverlay } = useDebugOverlay();
  
  return (
    <button 
      className="bg-green-700 text-white hover:bg-green-600 px-3 py-1 rounded text-xs"
      onClick={toggleOverlay}
    >
      Open Debug Overlay
    </button>
  );
}
