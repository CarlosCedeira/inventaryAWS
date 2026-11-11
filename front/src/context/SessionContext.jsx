import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getCurrentUser, login, logout } from "../services/authService";

const SessionContext = createContext(null);
const SESSION_INVALID_EVENT = "bretema:session-invalid";

export function SessionProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      return currentUser;
    } catch {
      setUser(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshSession();
    const invalidateSession = () => {
      setUser(null);
      setIsLoading(false);
    };
    window.addEventListener(SESSION_INVALID_EVENT, invalidateSession);
    return () => window.removeEventListener(SESSION_INVALID_EVENT, invalidateSession);
  }, [refreshSession]);

  const signIn = useCallback(async (email, password) => {
    const session = await login(email, password);
    setUser(session.user);
    setIsLoading(false);
    return session.user;
  }, []);

  const signOut = useCallback(async () => {
    try {
      await logout();
    } finally {
      setUser(null);
      setIsLoading(false);
    }
  }, []);

  const value = useMemo(() => ({ user, isLoading, refreshSession, signIn, signOut }), [user, isLoading, refreshSession, signIn, signOut]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) throw new Error("useSession debe utilizarse dentro de SessionProvider");
  return context;
}
