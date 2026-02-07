import React, { createContext, useContext, useState } from 'react';

export const AuthContext = createContext(null);

export function AuthProvider({ children, initialLoggedIn = false }) {
  const [isLoggedIn, setIsLoggedIn] = useState(initialLoggedIn);
  return (
    <AuthContext.Provider value={{ isLoggedIn, setIsLoggedIn }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  return ctx || { isLoggedIn: false, setIsLoggedIn: () => {} };
}
