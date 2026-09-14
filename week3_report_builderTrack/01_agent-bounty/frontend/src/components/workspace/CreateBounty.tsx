"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSigner } from "@ckb-ccc/connector-react";
import {
  ArrowLeft,
  ArrowRight,
  FileCode2,
  ScanLine,
  Check,
} from "lucide-react";
import Link from "next/link";
import { useWorkspace } from "./WorkspaceProvider";
import { PageHeading } from "./WorkspaceShell";
export function CreateBounty() {
  const router = useRouter();
  const signer = useSigner();
  const { refresh, channel } = useWorkspace();
  const [category, setCategory] = useState("CODE_AUDIT");
  const [title, setTitle] = useState("");
  const [brief, setBrief] = useState("");
  const [criteria, setCriteria] = useState("");
  const [reward, setReward] = useState("250");
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const valid = () => {
    if (!title.trim() || !brief.trim() || !criteria.trim()) {
      setError(
        "Add a title, a brief, and acceptance criteria before continuing.",
      );
      return false;
    }
    if (
      !/^\d+(\.\d{1,8})?$/.test(reward) ||
      Number(reward) <= 0 ||
      Number(reward) > (channel?.creatorBalanceCkb ?? 0)
    ) {
      setError(
        "Enter a positive reward with at most 8 decimals within the available demo balance.",
      );
      return false;
    }
    setError("");
    return true;
  };
  const submit = async () => {
    if (busy || !valid()) return;
    setBusy(true);
    try {
      const bytes = crypto.getRandomValues(new Uint8Array(32));
      const digest = await crypto.subtle.digest("SHA-256", bytes);
      const paymentHash = Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      const creator = signer
        ? await signer.getRecommendedAddress()
        : "demo_guest";
      const res = await fetch("/api/bounties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: brief.trim(),
          prompt:
            brief.trim() +
            "\n\nAcceptance criteria (requested, not automatically enforced):\n" +
            criteria.trim(),
          category,
          rewardCkb: Number(reward),
          creator,
          paymentHash,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success)
        throw new Error(json.error || "Could not publish bounty");
      await refresh();
      router.push("/marketplace");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not publish bounty");
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <Link href="/marketplace" className="text-link">
        <ArrowLeft size={16} /> Marketplace
      </Link>
      <PageHeading
        eyebrow="A WELL-DEFINED START"
        title="Write a better brief."
        description="Tell the agent what to do, what to return, and what you will check."
        action={false}
      />
      <div className="publish-layout">
        <section className="panel publish-form">
          <div className="steps">
            <span className={step === 1 ? "active" : ""}>
              01 Brief & budget
            </span>
            <ArrowRight size={15} />
            <span className={step === 2 ? "active" : ""}>
              02 Review & publish
            </span>
          </div>
          {error && (
            <div className="error-banner" role="alert">
              {error}
            </div>
          )}
          {step === 1 ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (valid()) setStep(2);
              }}
            >
              <fieldset>
                <legend>What kind of work?</legend>
                <div className="template-picker">
                  {(
                    [
                      ["CODE_AUDIT", "Repository review", FileCode2],
                      ["DEEP_RESEARCH", "Technical research", ScanLine],
                    ] as const
                  ).map(([v, l, Icon]) => (
                    <button
                      type="button"
                      key={String(v)}
                      aria-pressed={category === v}
                      className={category === v ? "selected" : ""}
                      onClick={() => setCategory(String(v))}
                    >
                      <Icon size={21} />
                      <span>{String(l)}</span>
                      {category === v && <Check size={16} />}
                    </button>
                  ))}
                </div>
              </fieldset>
              <label htmlFor="task-title">
                Task title
                <input
                  id="task-title"
                  required
                  maxLength={160}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={
                    category === "CODE_AUDIT"
                      ? "Review witness validation in my CKB lock"
                      : "Compare hold-invoice recovery approaches"
                  }
                />
              </label>
              <label htmlFor="task-brief">
                The brief
                <textarea
                  id="task-brief"
                  required
                  rows={6}
                  value={brief}
                  onChange={(e) => setBrief(e.target.value)}
                  placeholder={
                    category === "CODE_AUDIT"
                      ? "Add the repository URL, commit SHA, relevant code, and the questions to investigate. Repository retrieval is not automatic; include the code to review."
                      : "Describe the question, scope, and sources you want the agent to examine. Live source retrieval is not configured."
                  }
                />
              </label>
              <label htmlFor="task-criteria">
                Acceptance criteria
                <textarea
                  id="task-criteria"
                  required
                  rows={3}
                  value={criteria}
                  onChange={(e) => setCriteria(e.target.value)}
                  placeholder="For example: list file references, explain each finding, and include a command to reproduce it."
                />
                <small>
                  Included in the prompt. Automated enforcement is not
                  available.
                </small>
              </label>
              <label htmlFor="task-reward">
                Demo reward (CKB)
                <input
                  id="task-reward"
                  type="text"
                  inputMode="decimal"
                  required
                  value={reward}
                  onChange={(e) => setReward(e.target.value)}
                />
                <small>
                  Available in simulation:{" "}
                  {channel?.creatorBalanceCkb.toLocaleString() ?? "…"} CKB
                </small>
              </label>
              <div className="form-actions">
                <Link href="/marketplace" className="button">
                  Cancel
                </Link>
                <button className="button primary" type="submit">
                  Review brief <ArrowRight size={16} />
                </button>
              </div>
            </form>
          ) : (
            <div className="review-brief">
              <span className="small-tag">
                {category === "CODE_AUDIT"
                  ? "Repository review"
                  : "Technical research"}
              </span>
              <h2>{title}</h2>
              <h3>Brief</h3>
              <p>{brief}</p>
              <h3>Acceptance criteria</h3>
              <p>{criteria}</p>
              <div className="review-reward">
                <span>Demo reward</span>
                <strong>{reward} CKB</strong>
              </div>
              <p className="notice-banner">
                Publishing creates an in-memory demo task and simulated invoice.
                It does not fund a real Fiber channel.
              </p>
              <div className="form-actions">
                <button
                  className="button"
                  disabled={busy}
                  onClick={() => setStep(1)}
                >
                  Edit brief
                </button>
                <button
                  className="button primary"
                  disabled={busy}
                  onClick={() => void submit()}
                >
                  {busy ? "Publishing…" : "Publish demo bounty"}
                  <ArrowUpRightIcon />
                </button>
              </div>
            </div>
          )}
        </section>
        <aside className="brief-help">
          <span className="eyebrow">A NOTE ON GOOD BRIEFS</span>
          <h2>
            Specific beats
            <br />
            ambitious.
          </h2>
          <p>
            One focused question is easier to review than an open-ended request
            to “audit everything.”
          </p>
          <ol>
            <li>
              <b>Pin the context.</b> Include a commit or a specific source
              version.
            </li>
            <li>
              <b>Name the output.</b> A report, a comparison, or a reproducible
              finding.
            </li>
            <li>
              <b>Set the check.</b> Explain how you will judge a useful result.
            </li>
          </ol>
          <div className="help-divider" />
          <p>
            Wallet connection is optional for demo publishing. Guest tasks
            appear in Marketplace; connected tasks also appear in My work.
          </p>
        </aside>
      </div>
    </>
  );
}
function ArrowUpRightIcon() {
  return <ArrowRight size={16} />;
}
