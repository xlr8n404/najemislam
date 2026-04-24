'use client';

import { createContext, useContext, ReactNode } from 'react';

interface GuestModeContextType {
  isGuest: boolean;
}

const GuestModeContext = createContext<GuestModeContextType>({ isGuest: false });

export function GuestModeProvider({ children }: { children: ReactNode }) {
  return (
    <GuestModeContext.Provider value={{ isGuest: false }}>
      {children}
    </GuestModeContext.Provider>
  );
}

export function useGuestMode() {
  const context = useContext(GuestModeContext);
  if (!context) {
    return { isGuest: false };
  }
  return context;
}
