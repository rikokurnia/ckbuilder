"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { BountyTask, HoldInvoice, ChannelStats, SignedReceipt } from "@/lib/types";
import { useSigner } from "@ckb-ccc/connector-react";
interface Data {
  bounties: BountyTask[];
  invoices: HoldInvoice[];
  receipts: SignedReceipt[];
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
      authenticate: () => Promise<string>;
      review: (id: string, decision: "accept" | "reject", note?: string) => Promise<boolean>;
      cancel: (id: string) => Promise<boolean>;
      notice: string;
      clearNotice: () => void;
    })
  | null
>(null);
export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const signer = useSigner();
  const [data, setData] = useState<Data>({
    bounties: [],
    invoices: [],
    receipts: [],
    channel: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updated, setUpdated] = useState("");
  const [executing, setExecuting] = useState<string | null>(null);
  const lock = useRef(false);
  const [notice, setNotice] = useState("");
  const clearNotice = useCallback(() => setNotice(""), []);
  const [actor, setActor] = useState("");
  const authenticate = async () => {
    if (actor) return actor;
    if (!signer) throw new Error("Connect a wallet before continuing.");
    const challengeResponse = await fetch("/api/auth", { cache: "no-store" });
    const challenge = await challengeResponse.json();
    if (!challengeResponse.ok || !challenge.success) throw new Error(challenge.error || "Could not start wallet authentication.");
    const signature = await signer.signMessage(challenge.data.message);
    const verifyResponse = await fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...challenge.data, signature }) });
    const verified = await verifyResponse.json();
    if (!verifyResponse.ok || !verified.success) throw new Error(verified.error || "Wallet authentication failed.");
    setActor(verified.data.actor);
    return verified.data.actor as string;
  };
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
  useEffect(() => {
    if (!actor) return;
    const events = new EventSource("/api/events");
    const update = (event: MessageEvent) => {
      try {
        setData(JSON.parse(event.data));
        setUpdated(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      } catch { /* recovery polling remains active */ }
    };
    events.addEventListener("snapshot", update as EventListener);
    return () => events.close();
  }, [actor]);
  const execute = async (id: string) => {
    if (lock.current) return;
    lock.current = true;
    setExecuting(id);
    setNotice(
      "Demo run started. This can take a minute; payment settlement is simulated.",
    );
    try {
      await authenticate();
      const r = await fetch("/api/execute-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": crypto.randomUUID() },
        body: JSON.stringify({
          taskId: id,
          workerName: "Autonomous Sentinel Node",
        }),
      });
      const j = await r.json();
      if (!r.ok || !j.success) throw new Error(j.error || "Execution failed");
      setNotice(
        "Run finished. Automated checks are recorded; the creator must review the artifact before settlement.",
      );
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Execution failed");
    } finally {
      await refresh();
      setExecuting(null);
      lock.current = false;
    }
  };
  const action = async (id: string, action: "accept" | "reject" | "cancel", note = "") => {
    if (lock.current) return false;
    lock.current = true;
    setExecuting(id);
    try {
      await authenticate();
      const r = await fetch("/api/execute-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": crypto.randomUUID() },
        body: JSON.stringify({ taskId: id, action, note }),
      });
      const j = await r.json();
      if (!r.ok || !j.success) throw new Error(j.error || "Action failed");
      setNotice(action === "accept" ? "Artifact accepted. Settlement reached its terminal state." : action === "reject" ? "Revision requested. The held payment remains unsettled." : "Open task cancelled and its reservation released.");
      return true;
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Action failed");
      return false;
    } finally {
      await refresh();
      setExecuting(null);
      lock.current = false;
    }
  };
  const review = (id: string, decision: "accept" | "reject", note = "") => action(id, decision, note);
  const cancel = (id: string) => action(id, "cancel");
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
        authenticate,
        review,
        cancel,
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
