import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getCurrentUser, initStore, logIn, logOut, resetDemo, signUp } from "./store.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState(null);
  const [version, setVersion] = useState(0);

  const refresh = useCallback(() => {
    setUser(getCurrentUser());
    setVersion((value) => value + 1);
  }, []);

  useEffect(() => {
    let active = true;
    initStore().then(() => {
      if (!active) return;
      setUser(getCurrentUser());
      setReady(true);
    });
    return () => {
      active = false;
    };
  }, []);

  const value = useMemo(
    () => ({
      ready,
      user,
      version,
      refresh,
      async login(email, password) {
        const result = await logIn({ email, password });
        if (result.ok) refresh();
        return result;
      },
      async register(payload) {
        const result = await signUp(payload);
        if (result.ok) refresh();
        return result;
      },
      logout() {
        logOut();
        refresh();
      },
      async resetDemoData() {
        await resetDemo();
        setUser(null);
        setVersion((current) => current + 1);
      },
    }),
    [ready, user, version, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
