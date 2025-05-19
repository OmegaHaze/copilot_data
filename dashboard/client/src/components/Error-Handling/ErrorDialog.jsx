// ErrorDialog.jsx
import React, { useRef, useEffect, useState } from 'react';
import ErrorEffects from './ErrorEffects';
import { useDragDisable } from '../Panes/Utility/Context/DragDisableContext';
import { useSocket } from '../Panes/Utility/Context/SocketContext';

const ErrorDialog = ({ isOpen, onClose, paneName, errors: propErrors }) => {
  const audioRef = useRef(null);
  const [shake, setShake] = useState(false);
  const { setIsDragDisabled } = useDragDisable();
  const { errorLogs } = useSocket();
  
  // Combine provided errors with any from socket context
  const getErrors = () => {
    // If direct errors are provided, use those
    if (propErrors && propErrors.length > 0) {
      return propErrors;
    }
    
    // Otherwise check for errors in socket context
    if (paneName && errorLogs) {
      const serviceKey = paneName.toLowerCase();
      const logs = errorLogs[serviceKey];
      if (logs && logs.length > 0) {
        return logs.join('\n');
      }
    }
    
    return '';
  };
  
  // Combined errors
  const errors = getErrors();
  
  useEffect(() => {
    // Set drag disabled when dialog opens/closes
    setIsDragDisabled(isOpen);
    
    // Play the sound and trigger screen shake when dialog opens
    if (isOpen && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.volume = 0.3;
      
      audioRef.current.play().catch(err => console.error("Error playing audio:", err));
      
      // Trigger screen shake animation
      setShake(true);
      setTimeout(() => setShake(false), 400);
    }
  }, [isOpen, setIsDragDisabled]);

  if (!isOpen) return null;

  return (
    <>
      <ErrorEffects isActive={true} />
      
      {/* Hidden audio element for the alert sound */}
      <audio 
        ref={audioRef} 
        src="/789037__mediasaur__error_sfx.wav" 
        preload="auto"
        style={{ display: 'none' }}
      />
      
      {/* Error dialog with close button */}
      <div className={`fixed inset-0 z-[9999] flex items-center justify-center ${shake ? 'screen-shake' : ''}`}>
        <div className="relative bg-black/70 border border-red-600 p-6 max-w-2xl w-full h-full max-h-[calc(100vh-4rem)] text-left overflow-hidden">
          <div className="text-red-300 font-mono mb-4 text-lg flex justify-between items-center">
            <span>ERRORS: <span className="text-white glow-pulse">{typeof paneName === 'string' ? paneName.toUpperCase() : 'UNKNOWN COMPONENT'}</span></span>
            
            <button 
              onClick={onClose}
              className="text-red-400 hover:text-red-200 font-mono"
            >
              [X]
            </button>
          </div>
          
          <div className="overflow-y-auto h-[calc(100%-3rem)] font-mono text-sm text-red-200 terminal-error">
            {errors && errors.length > 0 ? (
              <pre className="whitespace-pre-wrap break-words">{errors}</pre>
            ) : (
              <p className="text-yellow-300">No specific error details available.</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ErrorDialog;