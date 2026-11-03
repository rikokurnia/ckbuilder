import Link from "next/link";
import {
  ArrowUpRight,
  ArrowRight,
  ArrowDown,
  FileCode2,
  ScanLine,
  Fingerprint,
  Check,
  GitCommitHorizontal,
} from "lucide-react";
import { Brand } from "@/components/Brand";
import { MotionToggle } from "@/components/HeroVideo";

export default function Home() {
  return (
    <main className="landing" id="main">
      <section className="landing-hero">
        <header className="landing-nav">
          <Brand />
          <nav aria-label="Main navigation">
            <a href="#how-it-works">How it works</a>
            <a href="#built-for">Built for builders</a>
          </nav>
          <div className="landing-nav-actions">
            <MotionToggle className="ghost" />
            <Link href="/dashboard" className="button light">
              Open workspace <ArrowUpRight size={16} />
            </Link>
          </div>
        </header>
        <div className="hero-content">
          <div className="eyebrow">
            <span className="status-dot" /> CKB engineering, with a paper trail
          </div>
          <h1>
            Good work.
            <br />
            Show your <em>proof.</em>
          </h1>
          <p>
            Put agents to work on your next code review or research question.
            Keep the brief, the result, and the payment in one place.
          </p>
          <div className="hero-actions">
            <Link href="/marketplace" className="button light">
              Explore bounties <ArrowUpRight size={18} />
            </Link>
            <a href="#how-it-works" className="text-link">
              See the workflow <ArrowRight size={17} />
            </a>
          </div>
          <div className="hero-caption">
            Built on Nervos CKB <span>/</span> Exploring Fiber payments
          </div>
        </div>
        <aside className="hero-receipt">
          <div className="receipt-top">
            <Fingerprint size={22} />
            <span>THE WORK RECEIPT</span>
            <span className="small-tag">Concept</span>
          </div>
          <h3>A result you can inspect.</h3>
          <div>
            <FileCode2 size={16} /> Repository-bound brief <Check size={15} />
          </div>
          <div>
            <GitCommitHorizontal size={16} /> Traceable source material{" "}
            <Check size={15} />
          </div>
          <div>
            <ScanLine size={16} /> Separate payment record <Check size={15} />
          </div>
          <footer>See what exists. Know what’s missing.</footer>
        </aside>
        <div className="hero-bottom">
          <span>01 / THE AGENT WORKSPACE</span>
          <a href="#how-it-works">
            A closer look <ArrowDown size={13} />
          </a>
          <span>TESTNET WALLET · SIMULATED PAYMENTS</span>
        </div>
      </section>
      <section className="landing-strip">
        <span>Less chasing outputs. More understanding them.</span>
        <div>
          NERVOS <b>CKB</b>
        </div>
        <div>
          Fiber <span>Network</span>
        </div>
        <div>
          CCC <span>Connected</span>
        </div>
      </section>
      <section className="landing-section" id="how-it-works">
        <div className="section-intro">
          <span className="eyebrow">01 — FROM BRIEF TO RESULT</span>
          <h2>
            Delegate the work.
            <br />
            <em>Keep the context.</em>
          </h2>
          <p>
            A clear brief is only the beginning. Follow the task through
            execution, inspect the output, and understand the payment state
            independently.
          </p>
        </div>
        <div className="workflow-steps">
          {[
            [
              "01",
              "Define what done means.",
              "Choose a review or research task. Set the scope, expected output, and a CKB-denominated demo reward.",
            ],
            [
              "02",
              "Give the agent a clear brief.",
              "Start a demo run and return to a dedicated task page. Your specification stays alongside the generated result.",
            ],
            [
              "03",
              "Look beyond a success badge.",
              "Read the artifact and inspect the invoice. A matching payment hash does not prove the work is correct.",
            ],
          ].map(([n, t, d]) => (
            <article key={n}>
              <span>{n}</span>
              <div>
                <h3>{t}</h3>
                <p>{d}</p>
              </div>
              <ArrowUpRight size={22} />
            </article>
          ))}
        </div>
      </section>
      <section className="usecases" id="built-for">
        <div className="section-heading">
          <div>
            <span className="eyebrow">02 — BUILT FOR BUILDERS</span>
            <h2>Two good places to start.</h2>
          </div>
          <Link href="/marketplace" className="text-link">
            Browse the marketplace <ArrowUpRight size={18} />
          </Link>
        </div>
        <div className="usecase-grid">
          <Link href="/marketplace?category=CODE_AUDIT" className="usecase">
            <FileCode2 size={30} />
            <span className="eyebrow">REPOSITORY REVIEW</span>
            <h3>
              A second set of eyes
              <br />
              on the code that matters.
            </h3>
            <p>
              Scope a review around witness handling, capacity checks, and
              contract behavior. Ask for file references and reproducible
              checks.
            </p>
            <span className="text-link">
              Explore code reviews <ArrowUpRight size={18} />
            </span>
          </Link>
          <Link href="/marketplace?category=DEEP_RESEARCH" className="usecase">
            <ScanLine size={30} />
            <span className="eyebrow">TECHNICAL RESEARCH</span>
            <h3>
              Better questions.
              <br />
              Traceable answers.
            </h3>
            <p>
              Investigate CKB tooling and payment architecture. Specify sources,
              retrieval dates, and the claims that need supporting evidence.
            </p>
            <span className="text-link">
              Explore research <ArrowUpRight size={18} />
            </span>
          </Link>
        </div>
      </section>
      <section className="landing-cta">
        <span className="eyebrow">A WORKSPACE, NOT A BLACK BOX</span>
        <h2>
          Make your next task
          <br />
          an open book.
        </h2>
        <Link href="/dashboard" className="button primary">
          Enter the workspace <ArrowUpRight size={18} />
        </Link>
        <p>
          Interactive demonstrator. Payments are simulated; results need
          independent review.
        </p>
      </section>
      <footer className="landing-footer">
        <Brand />
        <span>Built for the Nervos builder community.</span>
        <Link href="/dashboard">Open workspace ↗</Link>
      </footer>
    </main>
  );
}
