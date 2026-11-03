"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCcc, useSigner } from "@ckb-ccc/connector-react";
import {
  LayoutDashboard,
  Compass,
  BriefcaseBusiness,
  CreditCard,
  Files,
  ArrowUpRight,
  Search,
  Menu,
  X,
  Wallet,
  RefreshCw,
  Plus,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";

import { Brand } from "@/components/Brand";
import { MotionToggle } from "@/components/HeroVideo";
import { useWorkspace } from "./WorkspaceProvider";
const nav = [
  ["/dashboard", "Overview", LayoutDashboard],
  ["/marketplace", "Marketplace", Compass],
  ["/work", "My work", BriefcaseBusiness],
  ["/payments", "Payments", CreditCard],
  ["/evidence", "Evidence", Files],
] as const;
export function WorkspaceShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const { open, disconnect } = useCcc();
  const signer = useSigner();
  const [menu, setMenu] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);
  const menuTrigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!menu) return;
    const previous = document.activeElement as HTMLElement;
    const sidebar = sidebarRef.current;
    const focusable = () =>
      Array.from(
        sidebar?.querySelectorAll<HTMLElement>(
          "a[href],button:not([disabled])",
        ) || [],
      ).filter((el) => el.getClientRects().length);
    focusable()[0]?.focus();
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenu(false);
      if (event.key === "Tab") {
        const items = focusable();
        const first = items[0],
          last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", key);
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, [menu]);
  const { updated, refresh, error, notice, clearNotice } = useWorkspace();
  return (
    <div className="workspace">
      <a className="skip-link" href="#workspace-main">
        Skip to content
      </a>
      <aside
        ref={sidebarRef}
        role={menu ? "dialog" : undefined}
        aria-modal={menu ? true : undefined}
        aria-label="Workspace navigation"
        className={"sidebar " + (menu ? "mobile-open" : "")}
      >
        <div className="sidebar-brand">
          <Brand />
          <button
            className="icon-button mobile-only"
            onClick={() => setMenu(false)}
            aria-label="Close navigation"
          >
            <X size={20} />
          </button>
        </div>
        <div className="workspace-label">
          <span className="workspace-avatar">B</span>
          <div>
            Builder workspace<small>Personal · Demonstrator</small>
          </div>
        </div>
        <span className="nav-label">WORKSPACE</span>
        <nav aria-label="Workspace">
          {nav.map(([href, label, Icon]) => (
            <Link
              href={href}
              key={href}
              aria-current={path === href ? "page" : undefined}
              onClick={() => setMenu(false)}
            >
              <Icon size={18} />
              {label}
              {path === href && <span className="nav-active-dot" />}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="network-card">
            <span className="eyebrow">
              <span className="status-dot" /> SIMULATION MODE
            </span>
            <p>
              Real wallet connection.
              <br />
              Demo tasks and payments.
            </p>
            <Link href="/payments">
              Understand the payment state <ArrowUpRight size={14} />
            </Link>
          </div>
          <Link href="/" className="back-home">
            ↗ Back to AgentBounty
          </Link>
        </div>
      </aside>
      {menu && (
        <button
          className="nav-scrim"
          aria-label="Close navigation"
          onClick={() => setMenu(false)}
        />
      )}
      <div className="workspace-body">
        <header className="workspace-topbar">
          <button
            ref={menuTrigger}
            className="icon-button mobile-only"
            aria-label="Open navigation"
            aria-expanded={menu}
            onClick={() => setMenu(true)}
          >
            <Menu size={21} />
          </button>
          <span className="breadcrumb">
            Workspace <span>/</span>{" "}
            <b>
              {nav.find(([p]) => p === path)?.[1] ||
                (path === "/bounties/new" ? "Publish bounty" : "Task detail")}
            </b>
          </span>
          <form
            className="global-search"
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              const q = new FormData(e.currentTarget).get("search");
              router.push(
                "/marketplace?q=" + encodeURIComponent(String(q || "")),
              );
            }}
          >
            <Search size={16} />
            <input
              name="search"
              aria-label="Search workspace"
              placeholder="Search tasks…"
            />
            <kbd>↵</kbd>
          </form>
          <button
            className="button wallet-button"
            onClick={() => (signer ? disconnect() : open())}
          >
            <Wallet size={16} />
            {signer ? "Disconnect wallet" : "Connect wallet"}
          </button>
        </header>
        <div className="mode-strip">
          <span>
            <span className="status-dot" /> Simulation workspace{" "}
            <span className="strip-detail">
              · No real funds are moved by demo actions
            </span>
          </span>
          <div className="mode-strip-actions">
            <MotionToggle />
            <button onClick={() => void refresh()} aria-label="Refresh workspace">
              <RefreshCw size={13} />
              {updated ? `Updated ${updated}` : "Connecting…"}
            </button>
          </div>
        </div>
        <main id="workspace-main" className="workspace-main">
          {error && (
            <div className="error-banner" role="alert">
              {error} <button onClick={() => void refresh()}>Try again</button>
            </div>
          )}
          {notice && (
            <div className="notice-banner dismissible" role="status">
              <span>{notice}</span>
              <button
                onClick={clearNotice}
                aria-label="Dismiss notification"
                className="banner-dismiss"
              >
                <X size={15} />
              </button>
            </div>
          )}
          {children}
        </main>
        <footer className="workspace-footer">
          <span>AgentBounty / Builder workspace</span>
          <span>CKB testnet wallet · Simulated Fiber adapter</span>
        </footer>
      </div>
    </div>
  );
}
export function PageHeading({
  eyebrow,
  title,
  description,
  action = true,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: boolean;
}) {
  return (
    <div className="page-heading">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action && (
        <Link className="button primary" href="/bounties/new">
          <Plus size={17} /> Publish bounty
        </Link>
      )}
    </div>
  );
}
