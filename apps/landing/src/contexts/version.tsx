import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { fetchLatestPublishedVersion } from "../lib/npmjs";

export type ToolVersionContextValue = {
  staticVersion: string;
  npmLatest: string | null;
  status: "loading" | "ready";
  isNpmReachable: boolean;
  updateAvailable: boolean;
};

const ToolVersionContext = createContext<ToolVersionContextValue | null>(null);

export function ToolVersionProvider({ children }: { children: ReactNode }) {
  const staticVersion = '0.1.0';
  const [npmLatest, setNpmLatest] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "ready">("loading");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const v = await fetchLatestPublishedVersion();
      if (!cancelled) {
        setNpmLatest(v);
        setStatus("ready");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<ToolVersionContextValue>(
    () => ({
      staticVersion,
      npmLatest,
      status,
      isNpmReachable: npmLatest != null,
      updateAvailable: npmLatest != null && npmLatest !== staticVersion,
    }),
    [staticVersion, npmLatest, status],
  );

  return (
    <ToolVersionContext.Provider value={value}>
      {children}
    </ToolVersionContext.Provider>
  );
}

export function useToolVersion(): ToolVersionContextValue {
  const ctx = useContext(ToolVersionContext);
  if (!ctx) {
    throw new Error("useToolVersion must be used within ToolVersionProvider");
  }
  return ctx;
}
