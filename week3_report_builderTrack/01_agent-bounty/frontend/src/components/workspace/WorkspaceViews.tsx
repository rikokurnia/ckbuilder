"use client";
import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useSigner } from "@ckb-ccc/connector-react";
import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  FileCode2,
  ScanLine,
  Search,
  SlidersHorizontal,
  CircleCheck,
  Clock3,
  Files,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { BountyTask } from "@/lib/types";
import { useWorkspace } from "./WorkspaceProvider";
import { PageHeading } from "./WorkspaceShell";
export const categories: Record<string, string> = {
  CODE_AUDIT: "Code review",
  DEEP_RESEARCH: "Research",
  DATA_EXTRACTION: "Data extraction",
};
export const statuses: Record<string, string> = {
  OPEN: "Open",
  IN_PROGRESS: "Running",
  NEEDS_REVIEW: "Needs review",
  NEEDS_REVISION: "Needs revision",
  FAILED: "Failed",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  HELD: "Payment held",
  SETTLED: "Settled",
};
export const number = (n: number) =>
  n.toLocaleString("en-US", { maximumFractionDigits: 8 });
export function Status({ value }: { value: string }) {
  return (
    <span className={"status status-" + value.toLowerCase()}>
      <span />
      {statuses[value] || value}
    </span>
  );
}
export function Empty({ title, copy }: { title: string; copy: string }) {
  return (
    <div className="empty-state">
      <Files size={27} />
      <h3>{title}</h3>
      <p>{copy}</p>
      <Link className="text-link" href="/bounties/new">
        Create a task <ArrowRight size={16} />
      </Link>
    </div>
  );
}
export function TaskTable({ tasks }: { tasks: BountyTask[] }) {
  const { invoices } = useWorkspace();
  return (
    <div className="task-table">
      <div className="table-head">
        <span>TASK / CATEGORY</span>
        <span>REWARD</span>
        <span>WORK STATUS</span>
        <span>PAYMENT · DEMO</span>
        <span />
      </div>
      {tasks.map((t) => (
        <Link className="task-row" href={"/bounties/" + t.id} key={t.id}>
          <div className="task-title-cell">
            <span
              className={
                "task-icon " +
                (t.category === "DEEP_RESEARCH" ? "research" : "")
              }
            >
              {t.category === "DEEP_RESEARCH" ? (
                <ScanLine size={20} />
              ) : (
                <FileCode2 size={20} />
              )}
            </span>
            <div>
              <h3>{t.title}</h3>
              <p>
                {categories[t.category]} <span>·</span>{" "}
                {t.id === "task_seed_01"
                  ? "Sample task"
                  : new Date(t.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
              </p>
            </div>
          </div>
          <div className="reward">
            {number(t.rewardCkb)} <small>CKB</small>
          </div>
          <div>
            <Status value={t.status} />
          </div>
          <div className="payment-cell">
            {statuses[
              invoices.find((i) => i.id === t.invoiceId)?.status || ""
            ] || "Unavailable"}
          </div>
          <ArrowUpRight className="row-arrow" size={18} />
        </Link>
      ))}
    </div>
  );
}
export function Overview() {
  const { bounties, invoices, channel, loading } = useWorkspace();
  const active = bounties.filter(
    (t) => ["OPEN", "IN_PROGRESS", "NEEDS_REVIEW", "NEEDS_REVISION"].includes(t.status),
  );
  return (
    <>
      <PageHeading
        eyebrow="YOUR BUILDER WORKSPACE"
        title="Make room for good work."
        description="A clear view of your tasks, outputs, and demo payments."
      />
      <section className="overview-feature">
        <div>
          <span className="eyebrow">YOUR NEXT GOOD QUESTION</span>
          <h2>
            What will you put
            <br />
            an agent to work on?
          </h2>
          <p>
            Start with a focused brief. Give every result a place to be
            reviewed.
          </p>
          <Link href="/bounties/new" className="button primary">
            Create your first brief <ArrowUpRight size={17} />
          </Link>
        </div>
        <div className="brief-illustration" aria-hidden="true">
          <div className="paper-back" />
          <div className="paper-front">
            <span>AGENTBOUNTY / TASK BRIEF</span>
            <FileCode2 size={28} />
            <h3>
              A closer look at
              <br />
              your next contract.
            </h3>
            <div className="paper-line" />
            <div className="paper-line short" />
            <footer>
              <span>01 — Define the scope</span>
              <ArrowUpRight size={19} />
            </footer>
          </div>
          <span className="illustration-note">
            Good inputs. Better outputs.
          </span>
        </div>
      </section>
      <section className="stats-grid" aria-label="Simulation summary">
        {[
          [
            "Available · demo",
            channel ? number(channel.creatorBalanceCkb) : "—",
            "CKB",
            "Simulated channel balance",
          ],
          [
            "Reserved · demo",
            number(
              invoices
                .filter((i) => i.status === "OPEN" || i.status === "HELD")
                .reduce((s, i) => s + i.amountCkb, 0),
            ),
            "CKB",
            "Open and held demo invoices",
          ],
          [
            "Active work",
            String(active.length),
            "tasks",
            "Open or currently running",
          ],
          [
            "Results to inspect",
            String(bounties.filter((t) => t.resultArtifact).length),
            "outputs",
            "Not independently validated",
          ],
        ].map(([label, val, unit, hint]) => (
          <article className="stat" key={label}>
            <span>{label}</span>
            <strong>
              {loading ? "—" : val} <small>{unit}</small>
            </strong>
            <p>{hint}</p>
          </article>
        ))}
      </section>
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>
              Recent work <span className="count">{bounties.length}</span>
            </h2>
            <p>Your latest tasks, from brief to output.</p>
          </div>
          <Link href="/marketplace" className="text-link">
            View all tasks <ArrowRight size={16} />
          </Link>
        </div>
        {loading ? (
          <div className="skeleton" aria-label="Loading tasks" />
        ) : bounties.length ? (
          <TaskTable tasks={bounties.slice(0, 4)} />
        ) : (
          <Empty
            title="Your next task starts here"
            copy="Publish a code review or research brief to get started."
          />
        )}
      </section>
      <div className="overview-bottom">
        <Link href="/evidence" className="quiet-card">
          <Files size={23} />
          <div>
            <h3>Inspect the output</h3>
            <p>Read generated artifacts and see which evidence is missing.</p>
          </div>
          <ArrowUpRight size={20} />
        </Link>
        <Link href="/payments" className="quiet-card">
          <Clock3 size={23} />
          <div>
            <h3>Follow the payment</h3>
            <p>
              Explore invoice states without confusing them with work quality.
            </p>
          </div>
          <ArrowUpRight size={20} />
        </Link>
      </div>
    </>
  );
}
export function Marketplace({ mine = false }: { mine?: boolean }) {
  const { bounties, loading } = useWorkspace();
  const params = useSearchParams();
  const router = useRouter();
  const path = usePathname();
  const q = params.get("q") || "";
  const status = params.get("status") || "ALL";
  const category = params.get("category") || "ALL";
  const sort = params.get("sort") || "newest";
  const tab = params.get("tab") || "posted";
  const [search, setSearch] = useState(q);
  const signer = useSigner();
  const [address, setAddress] = useState("");
  useEffect(() => {
    let current = true;
    setAddress("");
    if (signer)
      signer
        .getRecommendedAddress()
        .then((a) => {
          if (current) setAddress(a);
        })
        .catch(() => {});
    return () => {
      current = false;
    };
  }, [signer]);
  useEffect(() => setSearch(q), [q]);
  const update = (key: string, value: string) => {
    const p = new URLSearchParams(params.toString());
    if (value) p.set(key, value);
    else p.delete(key);
    p.delete("page");
    router.push(path + "?" + p.toString(), { scroll: false });
  };
  let tasks = bounties.filter(
    (t) =>
      (status === "ALL" || t.status === status) &&
      (category === "ALL" || t.category === category) &&
      [t.title, t.description, t.id, t.paymentHash].some((s) =>
        s.toLowerCase().includes(q.toLowerCase()),
      ),
  );
  if (mine)
    tasks = tasks.filter((t) =>
      tab === "assigned"
        ? !!address && t.completedBy === address
        : tab === "history"
          ? t.creator === address &&
            (t.status === "COMPLETED" || t.status === "CANCELLED")
          : !!address && t.creator === address,
    );
  tasks.sort((a, b) =>
    sort === "reward" ? b.rewardCkb - a.rewardCkb : b.createdAt - a.createdAt,
  );
  const pages = Math.max(1, Math.ceil(tasks.length / 8));
  const page = Math.min(pages, Math.max(1, Number(params.get("page")) || 1));
  return (
    <>
      <PageHeading
        eyebrow={mine ? "YOUR TASKS" : "THE OPEN WORKSPACE"}
        title={mine ? "My work" : "Find your next piece of work."}
        description={
          mine
            ? "Tasks associated with your connected wallet address."
            : "Focused engineering briefs. Clear rewards. Inspectable outputs."
        }
      />
      {mine && (
        <div className="tabs">
          {[
            ["posted", "Posted by me"],
            ["assigned", "Assigned to me"],
            ["history", "History"],
          ].map(([v, l]) => (
            <button
              key={v}
              className={tab === v ? "active" : ""}
              onClick={() => update("tab", v)}
            >
              {l}
            </button>
          ))}
        </div>
      )}
      <section className="panel">
        <div className="market-toolbar">
          <form
            className="search-field"
            onSubmit={(e) => {
              e.preventDefault();
              update("q", search.trim());
            }}
          >
            <Search size={18} />
            <input
              aria-label="Search tasks"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title, task ID, or payment hash…"
            />
            <button type="submit">Search</button>
          </form>
          <label className="select-field">
            <SlidersHorizontal size={16} />
            <select
              aria-label="Task category"
              value={category}
              onChange={(e) => update("category", e.target.value)}
            >
              <option value="ALL">All categories</option>
              {Object.entries(categories).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="filter-bar">
          <div className="filter-tabs">
            {[
              ["ALL", "All tasks"],
              ["OPEN", "Open"],
              ["IN_PROGRESS", "Running"],
              ["NEEDS_REVIEW", "Needs review"],
              ["COMPLETED", "Completed"],
              ["CANCELLED", "Cancelled"],
            ].map(([v, l]) => (
              <button
                key={v}
                className={status === v ? "active" : ""}
                onClick={() => update("status", v)}
              >
                {l}
              </button>
            ))}
          </div>
          <select
            aria-label="Sort tasks"
            value={sort}
            onChange={(e) => update("sort", e.target.value)}
          >
            <option value="newest">Newest first</option>
            <option value="reward">Highest reward</option>
          </select>
        </div>
        {loading ? (
          <div className="skeleton" aria-label="Loading tasks" />
        ) : tasks.length ? (
          <TaskTable tasks={tasks.slice((page - 1) * 8, page * 8)} />
        ) : (
          <Empty
            title={
              mine && !address
                ? "Connect your wallet to find your work"
                : "No tasks found"
            }
            copy={
              mine
                ? "Work is matched to the connected address. Shared sample tasks appear in Marketplace."
                : "Try another search or publish a new bounty."
            }
          />
        )}
        <div className="table-footer">
          <span>
            {tasks.length} {tasks.length === 1 ? "task" : "tasks"}
            {q && ` matching “${q}”`}
          </span>
          {(q || category !== "ALL" || status !== "ALL") && (
            <Link href={path} className="text-link">
              Clear filters
            </Link>
          )}
          <div>
            <button
              className="icon-button"
              aria-label="Previous page"
              disabled={page <= 1}
              onClick={() => {
                const p = new URLSearchParams(params.toString());
                p.set("page", String(page - 1));
                router.push(path + "?" + p);
              }}
            >
              <ChevronLeft size={16} />
            </button>
            <span>
              {page} / {pages}
            </span>
            <button
              className="icon-button"
              aria-label="Next page"
              disabled={page >= pages}
              onClick={() => {
                const p = new URLSearchParams(params.toString());
                p.set("page", String(page + 1));
                router.push(path + "?" + p);
              }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </section>
      <p className="page-note">
        Search and filters apply to the current demo snapshot. Tasks are stored
        in memory and may reset when the server restarts.
      </p>
    </>
  );
}
export function Payments() {
  const { invoices, channel, bounties, loading } = useWorkspace();
  return (
    <>
      <PageHeading
        eyebrow="PAYMENT EXPLORER"
        title="Every payment has a state."
        description="Inspect simulated invoices independently from the quality of the work."
        action={false}
      />
      <div className="notice-banner">
        Simulation only. No FNN node observations, routing fees, or chain
        confirmations are available.
      </div>
      <section className="stats-grid three">
        {[
          ["Available", channel?.creatorBalanceCkb],
          [
            "Reserved",
            invoices
              .filter((i) => ["OPEN", "HELD"].includes(i.status))
              .reduce((s, i) => s + i.amountCkb, 0),
          ],
          ["Worker balance", channel?.workerBalanceCkb],
        ].map(([l, v]) => (
          <article className="stat" key={l}>
            <span>{l} · demo</span>
            <strong>
              {typeof v === "number" ? number(v) : "—"} <small>CKB</small>
            </strong>
            <p>Simulated ledger, not wallet capacity</p>
          </article>
        ))}
      </section>
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Invoice ledger</h2>
            <p>
              Open means reserved in this demo. It is not a native payment
              observation.
            </p>
          </div>
        </div>
        {loading ? (
          <div className="skeleton" />
        ) : invoices.length ? (
          invoices.map((i) => (
            <Link
              href={"/bounties/" + i.taskId + "?tab=payment"}
              className="ledger-row"
              key={i.id}
            >
              <div>
                <h3>
                  {bounties.find((t) => t.id === i.taskId)?.title || i.taskId}
                </h3>
                <code>{i.id}</code>
              </div>
              <strong>
                {number(i.amountCkb)} <small>CKB</small>
              </strong>
              <Status value={i.status} />
              <ArrowUpRight size={18} />
            </Link>
          ))
        ) : (
          <Empty
            title="No invoices yet"
            copy="Publish a demo task to explore its invoice lifecycle."
          />
        )}
      </section>
    </>
  );
}
export function Evidence() {
  const { bounties, receipts, loading } = useWorkspace();
  const tasks = bounties.filter((t) => t.resultArtifact);
  return (
    <>
      <PageHeading
        eyebrow="THE EVIDENCE LIBRARY"
        title="Read the work. Check the claims."
        description="Generated artifacts are a starting point for review, not proof of correctness."
        action={false}
      />
      <div className="evidence-explainer">
        <CircleCheck size={24} />
        <div>
          <h3>Integrity, provenance, and acceptance are different checks.</h3>
          <p>
            This demo provides result text, deterministic validation, a payment
            commitment, and a signed receipt after acceptance. Source snapshots
            remain a separate provenance layer.
          </p>
        </div>
      </div>
      <section className="panel">
        <div className="panel-heading">
          <h2>
            Result artifacts <span className="count">{tasks.length}</span>
          </h2>
          <span className="muted">Includes labeled sample data</span>
        </div>
        {loading ? (
          <div className="skeleton" />
        ) : tasks.length ? (
          tasks.map((t) => (
            <Link
              href={"/bounties/" + t.id + "?tab=result"}
              key={t.id}
              className="artifact-row"
            >
              <span className="task-icon">
                <Files size={23} />
              </span>
              <div>
                <h3>{t.title}</h3>
                <p>
                  {t.id === "task_seed_01"
                    ? "Sample artifact"
                    : "Generated artifact"}{" "}
                  · Independent review required
                </p>
              </div>
              <span className="small-tag">{receipts.some((receipt) => receipt.taskId === t.id) ? "Signed receipt" : "Awaiting acceptance"}</span>
              <ArrowUpRight size={19} />
            </Link>
          ))
        ) : (
          <Empty
            title="No artifacts to inspect"
            copy="Results appear here after a demo task finishes."
          />
        )}
      </section>
    </>
  );
}
