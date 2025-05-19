// filepath: /workspace/dashboard/client/src/components/Error-Handling/DeleteConfirmationDialog.jsx
import React, { useRef, useEffect, useState } from 'react';
import ErrorEffects from './ErrorEffects';
import { useDragDisable } from '../Panes/Utility/Context/DragDisableContext';

const DeleteConfirmationDialog = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  paneName, 
  customLabels = {},
  isRestarting = false // Flag to indicate if this is a restart operation
}) => {
  const audioRef = useRef(null);
  const [shake, setShake] = useState(false);
  const { setIsDragDisabled } = useDragDisable();
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Default labels based on operation type (delete or restart)
  const operationType = isRestarting ? 'RESTART' : 'DELETE';
  const processingAction = isRestarting ? 'RESTARTING' : 'DELETING';
  
  // Default labels
  const labels = {
    title: customLabels.title || `${operationType} PANE ${paneName ? paneName.toUpperCase() : 'UNKNOWN'}?`,
    cancel: customLabels.cancel || '[CANCEL]',
    confirm: customLabels.confirm || '[CONFIRM]',
    processing: customLabels.processing || `[${processingAction}...]`,
  };
  
  useEffect(() => {
    // Reset processing state when dialog opens/closes
    if (!isOpen) {
      setIsProcessing(false);
    }
    
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

  // Handle close button click
  const handleClose = () => {
    if (typeof onClose === 'function' && !isProcessing) {
      onClose();
    }
  };

  // Handle confirm button click with loading state
  const handleConfirm = async () => {
    if (typeof onConfirm === 'function' && !isProcessing) {
      setIsProcessing(true);
      try {
        await onConfirm();
      } catch (error) {
        console.error(`${isRestarting ? 'Restart' : 'Delete'} operation failed:`, error);
        setIsProcessing(false);
      }
    }
  };

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
      
      {/* Simplified dialog - just buttons overlaid on the CRT effect */}
      <div className={`fixed inset-0 z-[9999] flex items-center justify-center ${shake ? 'screen-shake' : ''}`}>
        <div className="p-6 text-center">
          <div className="text-red-300 font-mono mb-6 text-lg">
            {labels.title}
          </div>
          
          <div className="flex justify-center space-x-6">
            <button 
              onClick={handleClose}
              disabled={isProcessing}
              className={`bg-transparent text-green-400 px-4 py-2 border border-green-600 hover:bg-green-900/30 font-mono ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {labels.cancel}
            </button>
            
            <button 
              onClick={handleConfirm}
              disabled={isProcessing}
              className={`bg-transparent text-red-400 px-4 py-2 border border-red-600 hover:bg-red-900/30 font-mono terminal-error ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isProcessing ? labels.processing : labels.confirm}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default DeleteConfirmationDialog;