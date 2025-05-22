// React Context for session state
import React, { createContext, useState, useEffect } from 'react';
import { syncSessionData } from './session-manager';

const SessionContext = createContext();

export function SessionProvider({ children }) {
  const [sessionData, setSessionData] = useState(null);

  useEffect(() => {
    syncSessionData().then(setSessionData).catch(console.error);
  }, []);

  return (
    <SessionContext.Provider value={{ sessionData, setSessionData }}>
      {children}
    </SessionContext.Provider>
  );
}

export default SessionContext;
