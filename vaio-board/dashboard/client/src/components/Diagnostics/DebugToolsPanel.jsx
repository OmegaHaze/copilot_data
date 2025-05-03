import React, { useState } from 'react';
import ModuleReloadButton from './ModuleReloadButton';
import SupervisorRegistrationUtil from './SupervisorRegistrationUtil';
import LayoutDebugUtil from './LayoutDebugUtil';

/**
 * Debug Tools Panel - Contains all diagnostic utilities
 */
export default function DebugToolsPanel() {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Collapsed button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-gray-800 hover:bg-gray-700 text-white px-3 py-2 rounded shadow text-xs"
        >
          Debug Tools
        </button>
      )}
      
      {/* Expanded panel */}
      {isOpen && (
        <div className="bg-black border border-green-700 shadow-lg rounded p-3 w-64 text-green-400">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-sm font-bold">vAIO Debug Tools</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="text-xs text-gray-400 hover:text-white"
            >
              Close
            </button>
          </div>
          
          <hr className="border-green-900 my-2" />
          
          <div className="space-y-3">
            <div>
              <h3 className="text-xs font-bold mb-1">Module Operations</h3>
              <ModuleReloadButton />
            </div>
            
            <SupervisorRegistrationUtil />
            
            <LayoutDebugUtil />
          </div>
        </div>
      )}
    </div>
  );
}
