"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { getMe, login as loginRequest, logout as logoutRequest, normalizeApiError } from "@/lib/api";
import type { AuthContextValue, AuthStatus } from "@/types/auth";
import type { LoginPayload, MeDto } from "@/types/api";

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MeDto | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  const reloadUser = useCallback(async () => {
    setStatus("loading");

    try {
      const nextUser = await getMe();
      setUser(nextUser);
      setStatus(nextUser ? "authenticated" : "anonymous");
    } catch {
      setUser(null);
      setStatus("anonymous");
    }
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    try {
      const nextUser = await loginRequest(payload);
      if (!nextUser) throw new Error("Backend не вернул пользователя.");
      setUser(nextUser);
      setStatus("authenticated");
    } catch (error) {
      setUser(null);
      setStatus("anonymous");
      throw new Error(normalizeApiError(error));
    }
  }, []);

  const logout = useCallback(async () => {
    await logoutRequest();
    setUser(null);
    setStatus("anonymous");
  }, []);

  useEffect(() => {
    void reloadUser();
  }, [reloadUser]);

  const value = useMemo(
    () => ({
      user,
      status,
      login,
      logout,
      reloadUser,
    }),
    [login, logout, reloadUser, status, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return value;
}
