"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { BountyTask, HoldInvoice, ChannelStats } from "@/lib/types";
interface Data {
  bounties: BountyTask[];
  invoices: HoldInvoice[];
  channel: ChannelStats | null;
}
const Context = createContext<
  | (Data & {
      loading: boolean;
      error: string;
      updated: string;
      refresh: () => Promise<void>;
      executing: string | null;
      execute: (id: string) => Promise<void>;
      notice: string;
      clearNotice: () => void;
    })
  | null
>(null);
export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<Data>({
    bounties: [],
    invoices: [],
    channel: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updated, setUpdated] = useState("");
  const [executing, setExecuting] = useState<string | null>(null);
  const lock = useRef(false);
  const [notice, setNotice] = useState("");
  const clearNotice = useCallback(() => setNotice(""), []);
  const refresh = useCallback(async () => {
    try {
      setError("");
      const r = await fetch("/api/bounties", { cache: "no-store" });
      const j = await r.json();
      if (!r.ok || !j.success)
        throw new Error(j.error || "Could not load the workspace.");
      setData(j.data);
      setUpdated(
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      );
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not load the workspace.",
      );
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void refresh();
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, 15000);
    return () => clearInterval(timer);
  }, [refresh]);
  const execute = async (id: string) => {
    if (lock.current) return;
    lock.current = true;
    setExecuting(id);
    setNotice(
      "Demo run started. This can take a minute; payment settlement is simulated.",
    );
    try {
      const r = await fetch("/api/execute-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId: id,
          workerName: "Autonomous Sentinel Node",
        }),
      });
      const j = await r.json();
      if (!r.ok || !j.success) throw new Error(j.error || "Execution failed");
      setNotice(
        "Demo run finished. Inspect the result before relying on its findings.",
      );
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Execution failed");
    } finally {
      await refresh();
      setExecuting(null);
      lock.current = false;
    }
  };
  return (
    <Context.Provider
      value={{
        ...data,
        loading,
        error,
        updated,
        refresh,
        executing,
        execute,
        notice,
        clearNotice,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useWorkspace() {
  const c = useContext(Context);
  if (!c) throw new Error("Workspace provider missing");
  return c;
}
