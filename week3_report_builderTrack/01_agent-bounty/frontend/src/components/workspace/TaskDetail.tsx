"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Download,
  Play,
  FileText,
  CircleCheck,
  CircleDashed,
  Copy,
} from "lucide-react";
import { useWorkspace } from "./WorkspaceProvider";
import { categories, Status, number } from "./WorkspaceViews";
function download(name: string, content: string, type = "text/plain") {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function Artifact({ text }: { text: string }) {
  return (
    <div className="artifact-content">
      {text.split("\n").map((line, i) => {
        if (line.startsWith("### ")) return <h3 key={i}>{line.slice(4)}</h3>;
        if (line.startsWith("## ")) return <h2 key={i}>{line.slice(3)}</h2>;
        if (line.startsWith("# ")) return <h2 key={i}>{line.slice(2)}</h2>;
        return (
          <p key={i}>
            {line
              .split(/(\*\*[^*]+\*\*)/g)
              .map((part, j) =>
                part.startsWith("**") ? (
                  <strong key={j}>{part.slice(2, -2)}</strong>
                ) : (
                  part
                ),
              ) || " "}
          </p>
        );
      })}
    </div>
  );
}
export function TaskDetail({ id }: { id: string }) {
  const { bounties, invoices, loading, error, execute, executing } =
    useWorkspace();
  const params = useSearchParams();
  const selected = params.get("tab") || "brief";
  const [copied, setCopied] = useState(false);
  const [check, setCheck] = useState("");
  const t = bounties.find((t) => t.id === id);
  const invoice = invoices.find((i) => i.taskId === id);
  if (loading) return <div className="skeleton" aria-label="Loading task" />;
  if (!t)
    return (
      <div className="empty-state">
        <h1>{error ? "Task could not be loaded" : "Task not found"}</h1>
        <p>
          {error
            ? "Retry loading the workspace above."
            : "The demo server may have restarted, or this task ID does not exist."}
        </p>
        <Link href="/marketplace" className="button primary">
          Return to marketplace
        </Link>
      </div>
    );
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(t.paymentHash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCheck("Clipboard unavailable. Select and copy the displayed hash.");
    }
  };
  const verify = async () => {
    if (!invoice?.preimage) {
      setCheck("No preimage is available to check.");
      return;
    }
    try {
      if (!/^(?:[a-fA-F0-9]{2})+$/.test(invoice.preimage))
        throw new Error("Invalid preimage encoding");
      const bytes = new Uint8Array(
        invoice.preimage.match(/.{2}/g)!.map((h) => parseInt(h, 16)),
      );
      const hash = Array.from(
        new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)),
      )
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      setCheck(
        hash === invoice.paymentHash.toLowerCase()
          ? "Hash matches the current demo invoice. This does not verify the artifact, original commitment, or payment on a network."
          : "Hash mismatch. The preimage does not match this invoice.",
      );
    } catch (e) {
      setCheck(e instanceof Error ? e.message : "Could not verify hash");
    }
  };
  return (
    <>
      <Link href="/marketplace" className="text-link">
        <ArrowLeft size={16} /> All bounties
      </Link>
      <div className="task-detail-heading">
        <div className="eyebrow">
          {categories[t.category]} <span> / </span>{" "}
          {t.id === "task_seed_01" ? "SAMPLE TASK" : t.id}
        </div>
        <h1>{t.title}</h1>
        <div className="detail-meta">
          <Status value={t.status} />
          <span>Created {new Date(t.createdAt).toLocaleDateString()}</span>
          <span>
            Payment:{" "}
            {invoice ? <Status value={invoice.status} /> : "Unavailable"}
          </span>
        </div>
      </div>
      <div className="detail-layout">
        <section className="panel detail-panel">
          <nav className="tabs detail-tabs" aria-label="Task sections">
            {[
              ["brief", "Brief"],
              ["run", "Run"],
              ["result", "Result & sources"],
              ["validation", "Validation"],
              ["payment", "Payment"],
            ].map(([v, l]) => (
              <Link
                aria-current={selected === v ? "page" : undefined}
                className={selected === v ? "active" : ""}
                key={v}
                href={"?tab=" + v}
                scroll={false}
              >
                {l}
              </Link>
            ))}
          </nav>
          <div className="detail-content">
            {selected === "brief" && (
              <>
                <span className="eyebrow">THE ASSIGNMENT</span>
                <h2>Task brief</h2>
                <p className="pre-wrap">{t.description}</p>
                <h3>Instructions to the agent</h3>
                <p className="brief-text">{t.prompt}</p>
                <div className="notice-banner">
                  Requested checks are part of the brief. The demo backend does
                  not enforce acceptance criteria.
                </div>
              </>
            )}
            {selected === "run" && (
              <>
                <span className="eyebrow">EXECUTION SNAPSHOT</span>
                <h2>From brief to output</h2>
                <p className="muted">
                  Observed task states refresh every 15 seconds. Detailed worker
                  events are not available.
                </p>
                <ol className="timeline">
                  {[
                    [
                      true,
                      "Brief published",
                      new Date(t.createdAt).toLocaleString(),
                    ],
                    [
                      t.status === "IN_PROGRESS" || t.status === "COMPLETED",
                      "Agent execution",
                      t.status === "OPEN"
                        ? "Not started"
                        : t.status === "CANCELLED"
                          ? "Task cancelled"
                          : "Detailed logs unavailable",
                    ],
                    [
                      t.status === "COMPLETED",
                      "Result returned",
                      t.resultArtifact
                        ? "Artifact available for independent review"
                        : "Awaiting output",
                    ],
                    [
                      false,
                      "Independent acceptance",
                      "No acceptance decision supplied by the backend",
                    ],
                  ].map(([done, title, desc]) => (
                    <li key={String(title)}>
                      {done ? (
                        <CircleCheck size={21} />
                      ) : (
                        <CircleDashed size={21} />
                      )}
                      <div>
                        <h3>{String(title)}</h3>
                        <p>{String(desc)}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </>
            )}
            {selected === "result" && (
              <>
                <div className="panel-heading inline">
                  <h2>Result artifact</h2>
                  {t.resultArtifact && (
                    <button
                      className="button"
                      onClick={() =>
                        download(
                          t.id + "-result.md",
                          t.resultArtifact!,
                          "text/markdown",
                        )
                      }
                    >
                      <Download size={16} /> Download
                    </button>
                  )}
                </div>
                {t.resultArtifact ? (
                  <>
                    <div className="notice-banner">
                      {t.id === "task_seed_01"
                        ? "Illustrative sample report."
                        : "Generated text; model provenance is not provided and demo fallback may have been used."}{" "}
                      Findings have not been independently validated.
                    </div>
                    <Artifact text={t.resultArtifact} />
                  </>
                ) : (
                  <div className="empty-state">
                    <FileText size={26} />
                    <h3>No result yet</h3>
                    <p>A result will appear here when the demo run finishes.</p>
                  </div>
                )}
                <h3>Sources & provenance</h3>
                <dl className="check-list">
                  <div>
                    <dt>Source snapshots</dt>
                    <dd>Not attached</dd>
                  </div>
                  <div>
                    <dt>Repository commit</dt>
                    <dd>Not recorded</dd>
                  </div>
                  <div>
                    <dt>Model metadata</dt>
                    <dd>Not supplied</dd>
                  </div>
                </dl>
              </>
            )}
            {selected === "validation" && (
              <>
                <span className="eyebrow">EVIDENCE READINESS</span>
                <h2>No universal “verified” badge.</h2>
                <p className="muted">
                  Each check answers a different question. Missing evidence
                  remains visible.
                </p>
                <dl className="check-list">
                  <div>
                    <dt>Result artifact</dt>
                    <dd>
                      {t.resultArtifact ? "Text available" : "Not available"}
                    </dd>
                  </div>
                  <div>
                    <dt>Committed artifact digest</dt>
                    <dd>Not supplied</dd>
                  </div>
                  <div>
                    <dt>Source provenance</dt>
                    <dd>Not supplied</dd>
                  </div>
                  <div>
                    <dt>Deterministic checks</dt>
                    <dd>Not run</dd>
                  </div>
                  <div>
                    <dt>Human acceptance</dt>
                    <dd>Not recorded</dd>
                  </div>
                  <div>
                    <dt>Issuer signature</dt>
                    <dd>Not supplied</dd>
                  </div>
                </dl>
              </>
            )}
            {selected === "payment" && (
              <>
                <span className="eyebrow">SIMULATED INVOICE</span>
                <h2>Payment & receipt</h2>
                {invoice ? (
                  <>
                    <dl className="check-list">
                      <div>
                        <dt>Invoice ID</dt>
                        <dd>
                          <code>{invoice.id}</code>
                        </dd>
                      </div>
                      <div>
                        <dt>Amount</dt>
                        <dd>{number(invoice.amountCkb)} CKB</dd>
                      </div>
                      <div>
                        <dt>Demo status</dt>
                        <dd>
                          <Status value={invoice.status} />
                        </dd>
                      </div>
                      <div>
                        <dt>Network observation</dt>
                        <dd>Not available</dd>
                      </div>
                      <div>
                        <dt>Signed receipt</dt>
                        <dd>Not available</dd>
                      </div>
                    </dl>
                    <h3>Payment hash</h3>
                    <div className="hash-box">
                      <code>{invoice.paymentHash}</code>
                      <button
                        className="icon-button"
                        onClick={() => void copy()}
                        aria-label="Copy payment hash"
                      >
                        <Copy size={17} />
                      </button>
                    </div>
                    {copied && <p role="status">Copied payment hash.</p>}
                    <div className="detail-actions">
                      <button
                        className="button"
                        onClick={() => void verify()}
                        disabled={!invoice.preimage}
                      >
                        Check preimage hash
                      </button>
                      <button
                        className="button"
                        onClick={() =>
                          download(
                            t.id + "-demo-record.json",
                            JSON.stringify(
                              {
                                mode: "simulation",
                                signed: false,
                                taskId: t.id,
                                invoiceId: invoice.id,
                                paymentHash: invoice.paymentHash,
                                amountCkb: invoice.amountCkb,
                                status: invoice.status,
                                createdAt: invoice.createdAt,
                                settledAt: invoice.settledAt,
                                limitations:
                                  "Unsigned demo record. No native payment observation or artifact validation.",
                              },
                              null,
                              2,
                            ),
                            "application/json",
                          )
                        }
                      >
                        <Download size={16} /> Demo record
                      </button>
                    </div>
                    {!invoice.preimage && (
                      <p className="muted">
                        Hash checking is available after a preimage is returned.
                      </p>
                    )}
                    {check && (
                      <p className="notice-banner" role="status">
                        {check}
                      </p>
                    )}
                  </>
                ) : (
                  <p>No invoice record available.</p>
                )}
                <p className="page-note">
                  A preimage hash check only establishes a hash relationship in
                  the current record. It does not establish work quality or
                  actual settlement.
                </p>
              </>
            )}
            {!["brief", "run", "result", "validation", "payment"].includes(
              selected,
            ) && (
              <p>
                Unknown section. <Link href="?tab=brief">Open the brief</Link>.
              </p>
            )}
          </div>
        </section>
        <aside className="detail-aside">
          <div className="panel reward-panel">
            <span className="eyebrow">DEMO REWARD</span>
            <strong>
              {number(t.rewardCkb)} <small>CKB</small>
            </strong>
            <p>Simulated funds only</p>
            {t.status === "OPEN" ? (
              <button
                className="button primary"
                disabled={!!executing}
                onClick={() => void execute(t.id)}
              >
                <Play size={16} />
                {executing === t.id ? "Running demo…" : "Start demo run"}
              </button>
            ) : t.status === "COMPLETED" ? (
              <Link href="?tab=result" className="button primary">
                Inspect result <ArrowUpRight size={16} />
              </Link>
            ) : (
              <button className="button" disabled>
                {t.status === "CANCELLED" ? "Task cancelled" : "Agent running"}
              </button>
            )}
            <small>
              {t.status === "CANCELLED"
                ? "Cancelled tasks cannot be dispatched."
                : "Demo execution can use a template fallback. Payment is simulated automatically."}
            </small>
          </div>
          <div className="task-people">
            <h3>Task details</h3>
            <span>Posted by</span>
            <code>{t.creator}</code>
            <span>Worker</span>
            <p>{t.completedBy || "Unassigned"}</p>
            <span>Review deadline</span>
            <p>Not specified</p>
          </div>
        </aside>
      </div>
    </>
  );
}
