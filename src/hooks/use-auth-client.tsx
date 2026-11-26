"use client";
import type { ReactNode } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { authClient } from "@/lib/auth-client";

type AuthContextType = {
  signIn: (email: string, password: string, signUp?: boolean) => Promise<void>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
  user: { email?: string } | null;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<{ email?: string } | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = await authClient.getSession();
        setIsAuthenticated(!!session.data);
        setUser(session.data?.user || null);
      } catch {
        setIsAuthenticated(false);
        setUser(null);
      }
    };
    checkAuth();
  }, []);

  const signIn = useCallback(
    async (email: string, password: string, signUp = false) => {
      const result = signUp
        ? await authClient.signUp.email({
            email,
            password,
            name: email.split("@")[0],
          })
        : await authClient.signIn.email({
            email,
            password,
          });

      if (result.error) {
        throw new Error(result.error.message || "Sign in failed");
      }

      const session = await authClient.getSession();
      if (!session.data || !session.data.user) {
        setIsAuthenticated(false);
        setUser(null);
        throw new Error("Sign in succeeded but no session was returned");
      }

      setUser(session.data.user);
      setIsAuthenticated(true);
    },
    [],
  );

  const signOut = useCallback(async () => {
    await authClient.signOut();
    setIsAuthenticated(false);
    setUser(null);
  }, []);

  const value: AuthContextType = {
    signIn,
    signOut,
    isAuthenticated,
    user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuthClient = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthClient must be used within AuthProvider");
  }
  return context;
};
