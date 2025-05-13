import React, { createContext, useState, useContext, useEffect } from 'react';

// Create context for debug overlay
const DebugOverlayContext = createContext();

/**
 * Provider for the Debug Overlay context
 * This allows components to toggle and control the Debug Overlay without global variables
 */
export function DebugOverlayProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  // Toggle the debug overlay visibility
  const toggleOverlay = () => setIsOpen(prev => !prev);
  
  // Open the debug overlay with a specific tab
  const openWithTab = (tab) => {
    setIsOpen(true);
    if (tab) {
      setActiveTab(tab);
    }
  };

  // Close the debug overlay
  const closeOverlay = () => setIsOpen(false);
  
  // Listen for custom event from debug bridge
  useEffect(() => {
    // Handler for the toggle event
    const handleToggleEvent = (event) => {
      if (event.detail?.forced) {
        // Force open
        setIsOpen(true);
      } else {
        // Toggle
        setIsOpen(prev => !prev);
      }
    };
    
    // Add event listener
    window.addEventListener('vaio:toggle-debug-overlay', handleToggleEvent);
    
    // Make the context methods available globally for debugging
    window.toggleDebugOverlay = toggleOverlay;
    
    // Clean up
    return () => {
      window.removeEventListener('vaio:toggle-debug-overlay', handleToggleEvent);
      // Clean up global reference if this component unmounts
      if (window.toggleDebugOverlay === toggleOverlay) {
        window.toggleDebugOverlay = undefined;
      }
    };
  }, []);

  return (
    <DebugOverlayContext.Provider 
      value={{ 
        isOpen, 
        activeTab,
        toggleOverlay, 
        openWithTab,
        closeOverlay,
        setActiveTab
      }}
    >
      {children}
    </DebugOverlayContext.Provider>
  );
}

/**
 * Hook to use the debug overlay context
 */
export function useDebugOverlay() {
  const context = useContext(DebugOverlayContext);
  
  if (context === undefined) {
    console.error('useDebugOverlay must be used within a DebugOverlayProvider');
    // Return a more robust fallback with dummy state setter functions
    // This prevents the "setIsOpen is not defined" error when used outside provider
    const [dummyIsOpen, dummySetIsOpen] = useState(false);
    const [dummyActiveTab, dummySetActiveTab] = useState('general');
    
    return {
      isOpen: dummyIsOpen,
      setIsOpen: dummySetIsOpen,
      activeTab: dummyActiveTab,
      setActiveTab: dummySetActiveTab,
      toggleOverlay: () => {
        console.warn('Debug Overlay toggle called outside provider');
        dummySetIsOpen(prev => !prev);
      },
      openWithTab: (tab) => {
        console.warn('Debug Overlay openWithTab called outside provider');
        dummySetIsOpen(true);
        if (tab) dummySetActiveTab(tab);
      },
      closeOverlay: () => {
        console.warn('Debug Overlay close called outside provider');
        dummySetIsOpen(false);
      }
    };
  }
  
  return context;
}
