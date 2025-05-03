// Test button component to verify error notifications
import React from 'react';
import { useErrorSystem } from './ErrorNotificationSystem.jsx';
import { 
  generateTestConsoleError,
  generateTestConsoleWarning,
  testNotificationSystem
} from './ErrorTestFunction.js';

export default function ErrorTestButton() {
  const errorSystem = useErrorSystem();
  
  const triggerConsoleError = () => {
    generateTestConsoleError('Test console.error notification');
  };

  const triggerConsoleWarning = () => {
    generateTestConsoleWarning('Test console.warn notification');
  };
  
  const triggerFullTest = () => {
    testNotificationSystem(errorSystem);
  };

  return (
    <div className="fixed bottom-2 right-2 flex flex-col gap-2 opacity-70 hover:opacity-100 transition-opacity z-[9000]">
      <button 
        onClick={triggerConsoleError}
        className="glass-notification border border-red-500/40 text-red-300 px-3 py-1.5 rounded-md text-xs shadow-xl hover:border-red-500/60 transition-all debug-item-hover scanlines"
      >
        <div className="flex items-center">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5 shadow-glow-sm shadow-red-500/40 debug-indicator"></span>
          Test Error
        </div>
      </button>
      <button 
        onClick={triggerConsoleWarning}
        className="glass-notification border border-yellow-500/40 text-yellow-300 px-3 py-1.5 rounded-md text-xs shadow-xl hover:border-yellow-500/60 transition-all debug-item-hover scanlines"
      >
        <div className="flex items-center">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-yellow-500 mr-1.5 shadow-glow-sm shadow-yellow-500/40 debug-indicator"></span>
          Test Warning
        </div>
      </button>
      <button 
        onClick={triggerFullTest}
        className="glass-notification border border-green-500/40 text-green-300 px-3 py-1.5 rounded-md text-xs shadow-xl hover:border-green-500/60 transition-all debug-item-hover scanlines"
      >
        <div className="flex items-center">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5 shadow-glow-sm shadow-green-500/40 debug-indicator"></span>
          Full Test
        </div>
      </button>
    </div>
  );
}
