/**
 * React context providing /api/me data to all dashboard pages.
 * Fetches once after auth resolves, then exposes refreshMe() for manual reloads.
 */
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
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

  const loadMe = useCallback(async () => {
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
  }, [profile]);

  useEffect(() => {
    if (isAuthLoading) {
      return;
    }

    void loadMe();
  }, [isAuthLoading, loadMe]);

  const value = useMemo<DashboardDataContextValue>(
    () => ({
      me,
      isLoading: isAuthLoading || isLoading,
      error,
      refreshMe: loadMe,
    }),
    [me, isAuthLoading, isLoading, error, loadMe],
  );

  return (
    <DashboardDataContext.Provider value={value}>
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
