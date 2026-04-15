import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { SessionSummary } from "@/types/api";
import * as api from "@/lib/api";

const STORAGE_KEY = "skillpilot_sessionId";

interface SessionContextValue {
  session: SessionSummary | null;
  loading: boolean;
  error: string | null;
  refreshSession: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SessionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const bootstrap = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const storedId = localStorage.getItem(STORAGE_KEY);

      if (storedId) {
        try {
          const existing = await api.getSession(storedId);
          setSession(existing);
          setLoading(false);
          return;
        } catch (err) {
          if (err instanceof api.ApiError && err.status === 404) {
            localStorage.removeItem(STORAGE_KEY);
          } else {
            throw err;
          }
        }
      }

      const created = await api.createSession({
        displayName: "User",
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
      localStorage.setItem(STORAGE_KEY, created.sessionId);
      setSession(created);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to initialize session");
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshSession = useCallback(async () => {
    const id = localStorage.getItem(STORAGE_KEY);
    if (!id) return;
    try {
      const updated = await api.getSession(id);
      setSession(updated);
    } catch {
      // Silently ignore refresh failures; stale session is okay
    }
  }, []);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  return (
    <SessionContext.Provider value={{ session, loading, error, refreshSession }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return ctx;
}
