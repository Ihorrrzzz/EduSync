"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  getSession,
  logoutSession,
  refreshSession,
  setSession,
  subscribeToSession,
  type Profile,
} from "./api";

interface AuthState {
  accessToken: string | null;
  profile: Profile | null;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (accessToken: string, profile: Profile) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const initialSession = getSession();
  const [accessToken, setAccessToken] = useState(initialSession.accessToken);
  const [profile, setProfile] = useState(initialSession.profile);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    return subscribeToSession((nextSession) => {
      setAccessToken(nextSession.accessToken);
      setProfile(nextSession.profile);
    });
  }, []);

  useEffect(() => {
    let isMounted = true;

    refreshSession().finally(() => {
      if (isMounted) {
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const login = (nextAccessToken: string, nextProfile: Profile) => {
    setSession({
      accessToken: nextAccessToken,
      profile: nextProfile,
    });
  };

  const logout = async () => {
    await logoutSession();
    router.push("/auth/login");
  };

  return (
    <AuthContext.Provider
      value={{
        accessToken,
        profile,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
