"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "./auth-context";
import { fetchMe, type DashboardMe } from "./mvp-api";

type DashboardDataContextValue = {
  me: DashboardMe | null;
  isLoading: boolean;
  error: string;
  refreshMe: () => Promise<void>;
};

const DashboardDataContext = createContext<DashboardDataContextValue | undefined>(
  undefined,
);

export function DashboardDataProvider({ children }: { children: ReactNode }) {
  const { profile, isLoading: isAuthLoading } = useAuth();
  const [me, setMe] = useState<DashboardMe | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadMe = async () => {
    if (!profile) {
      setMe(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const meResponse = await fetchMe();
      setMe(meResponse);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Не вдалося завантажити кабінет",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthLoading) {
      return;
    }

    void loadMe();
  }, [isAuthLoading, profile?.id]);

  return (
    <DashboardDataContext.Provider
      value={{
        me,
        isLoading: isAuthLoading || isLoading,
        error,
        refreshMe: loadMe,
      }}
    >
      {children}
    </DashboardDataContext.Provider>
  );
}

export function useDashboardData() {
  const context = useContext(DashboardDataContext);

  if (!context) {
    throw new Error("useDashboardData must be used within DashboardDataProvider");
  }

  return context;
}
