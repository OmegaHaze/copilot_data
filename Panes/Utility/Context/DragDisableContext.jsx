import React, { createContext, useContext, useState } from 'react';

const DragDisableContext = createContext();

export function DragDisableProvider({ children }) {
  const [isDragDisabled, setIsDragDisabled] = useState(false);

  return (
    <DragDisableContext.Provider value={{ isDragDisabled, setIsDragDisabled }}>
      {children}
    </DragDisableContext.Provider>
  );
}

export function useDragDisable() {
  const context = useContext(DragDisableContext);
  if (!context) {
    throw new Error('useDragDisable must be used within a DragDisableProvider');
  }
  return context;
}