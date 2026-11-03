# Week 10 Builder Track Master Report: Fiber Reconcile

**Name Builder**: Riko Kurnia Sandi  
**Date**: 4 November 2026  
**Track**: CKB Builder Track (Phase 4: Capstone Objective — Fiber Network Infrastructure)  
**Project Repository**: [https://github.com/rikokurnia/fiber-reconcile](https://github.com/rikokurnia/fiber-reconcile) *(Maintained in a separate repository)*  
**Live Deployments**:
* Analytics, Documentation & SDK Web: [https://fiber-reconcile.vercel.app/](https://fiber-reconcile.vercel.app/)
* Reference Checkout Demo Store: [https://fiber-reconcile-demo.vercel.app/](https://fiber-reconcile-demo.vercel.app/)  
**Local Objective Reference**: [`/myobjective/fiber-reconcile/`](../myobjective/fiber-reconcile/)  

---

## Executive Summary

During **Week 10** of the Nervos CKB Builder Track, engineering focused on building **Fiber Reconcile**, an open-source payment observability and application reconciliation runtime for the **Nervos Fiber Network**.

In payment channel systems, an off-chain payment settling inside a Fiber channel does not automatically guarantee that the host application successfully completes the corresponding business order. Real-world integrations frequently encounter transport disconnects, process restarts, dropped WebSocket events, and webhook timeouts. 

Fiber Reconcile bridges the gap between raw Fiber Node (`FNN`) invoice states and application order fulfillment. It combines:
1. A **server-side TypeScript SDK** (`@fiber-reconcile/sdk`) for durable payment registration, order binding, and signature verification.
2. A **background reconciliation service** that continuously polls authoritative FNN invoice status, verifies application order readback, and dispatches idempotent events through a transactional outbox.
3. A **read-only Analytics interface** (`/analytics`) providing real-time metrics, mismatch detection, source-attributed timelines, and traceable audit proofs.
4. A **reference checkout application** (`apps/demo`) demonstrating end-to-end normal payments and controlled failure recoveries.

The project is hosted in its dedicated repository at [github.com/rikokurnia/fiber-reconcile](https://github.com/rikokurnia/fiber-reconcile) and indexed locally in [`myobjective/fiber-reconcile/`](../myobjective/fiber-reconcile/).

---

## 1. Problem Statement and Empirical Evidence

Off-chain payment networks offer millisecond-level execution and zero L1 miner fees. However, distributed application architectures introduce operational boundaries where network transport failures leave payments settled while orders remain stuck in a pending state. 

Fiber Reconcile was designed based on documented public issues, live testnet benchmarks, and explicit architecture boundaries observed across the Nervos Fiber ecosystem.

### 1.1 Dropped Event Subscriptions (Issue #1717 and PR #1718)
In event-driven architectures, relying exclusively on active socket streams creates silent points of failure:
* **The Defect:** Official Fiber repository [Issue #1717](https://github.com/nervosnetwork/fiber/issues/1717) demonstrated that payment event subscriptions could stop receiving updates after a burst of 17 store modifications. In an automated test suite executing 100 burst changes followed by an additional event, the existing subscription received 0 out of 101 events. This issue was originally isolated under a controlled dev-chain Lightning Service Provider (LSP) environment with 100 concurrent tenant activations.
* **Protocol Fix:** On 4 November 2026, the underlying subscription bug was officially resolved and merged in [PR #1718](https://github.com/nervosnetwork/fiber/pull/1718).
* **Architectural Boundary:** Fiber Reconcile is explicitly **not** a fix for core protocol bugs. Even with a bug-free protocol subscription, application processes still experience local crashes, network partitions, container restarts, and dropped connections. Fiber Reconcile provides an application-level recovery layer that queries authoritative FNN state over durable polling intervals to catch any notifications missed during transport anomalies.

### 1.2 Timeouts and Redeliveries in Production Integrations
Network timeouts frequently cause applications to assume a transaction failed when the settlement actually succeeded:
* **Evidence from Live Testing:** On 10 October 2026, developers testing [FiberLatch and FiberFlow](https://talk.nervos.org/t/10414/8) documented an integration flow on a testnet with decoupled payer and merchant nodes:
  1. The off-chain payment settled successfully, and the FNN invoice transitioned to `Paid`.
  2. The initial merchant webhook timed out after the payment had already been processed.
  3. FiberFlow retried and redelivered the webhook payload.
  4. The consumer application correctly deduplicated the request, successfully provisioning exactly one entitlement.
* **Key Takeaway:** A network timeout does not imply transaction failure. Applications must decouple transport acknowledgments from payment finality, maintain durable payment-to-order bindings, and process delivery retries with strict idempotency.

### 1.3 The Unaddressed Responsibility Boundary in Existing Tools
Specialized payment and access packages purposefully constrain their operational scope:
* **FiberLatch Scope Boundary:** The [FiberLatch documentation](https://github.com/Ticoworld/fiber-latch) explicitly defines that payment verification, purchase binding, data persistence, retry policies, and final access enforcement remain the sole responsibility of the integrating application.
* **The Gap:** A payment hash or isolated "Paid" status string alone does not confirm that an order was credited to the correct customer, asset, and invoice amount. Integrators currently write custom, redundant, and error-prone reconciliation code to monitor ambiguous payments.

---

## 2. Product Solution: How Fiber Reconcile Solves Application Mismatches

Fiber Reconcile establishes a persistent reconciliation loop between the merchant's Fiber Node daemon (`FNN`) and the business database.

| Application Failure Mode | Fiber Reconcile Mechanism |
|---|---|
| **Missed Payment Notifications** | Queries registered invoices directly against FNN RPC endpoints on scheduled polling ticks. |
| **Fiber Settled, Order Pending** | Detects status discrepancies exceeding the configured grace period (e.g., 60 seconds) and triggers an automated reconciliation cycle. |
| **Worker / Service Crash** | Resumes reconciliation deterministically from persistent storage (PostgreSQL / SQLite) and a transactional event outbox. |
| **Duplicate Event Deliveries** | Enforces message deduplication using deterministic event IDs and cryptographic webhook signature verification (`x-reconcile-signature`). |
| **Event Delivered, Order Unfulfilled** | Requires consumer HTTP `200 OK` acknowledgment with structured payload and re-verifies application state via readback endpoints. |
| **Lack of Observability** | Surfaces full lifecycle history, retry counts, timing latencies, and raw state payloads in a read-only Analytics dashboard. |

### 2.1 Authoritative Settlement Source (`get_invoice`)
Fiber Reconcile relies on the official FNN RPC specification ([FNN RPC Documentation v0.9.1](https://github.com/nervosnetwork/fiber/blob/v0.9.1/crates/fiber-lib/src/rpc/README.md)). The service calls `get_invoice` to evaluate authoritative payment states, strictly distinguishing intermediate settlement states:
* `Received`: The HTLC/PTLC has arrived off-chain, but preimage reveal / commitment confirmation is still finalizing.
* `Paid`: The payment is fully settled and irreversible within the channel balance.
* `Expired` / `Cancelled`: The invoice deadline passed without complete balance commitment.

---

## 3. System Architecture & Core Components

```
+-----------------------------------------------------------------------------------+
|                              MERCHANT ECOSYSTEM                                   |
|                                                                                   |
|  +-----------------------+                    +--------------------------------+  |
|  |  Merchant Application | <--- Readback ---  |    Fiber Reconcile Worker      |  |
|  |  (Next.js Demo Store) | --- Webhook --->   |    (Outbox Dispatcher)         |  |
|  +-----------+-----------+                    +---------------+----------------+  |
|              |                                                |                   |
|              | @fiber-reconcile/sdk                           | FNN JSON-RPC      |
|              v                                                v                   |
|  +-----------------------+                    +--------------------------------+  |
|  |  PostgreSQL / SQLite  | <----------------- |       Fiber Node (FNN)         |  |
|  |  Payment Registry     |                    |       Testnet Daemon           |  |
|  +-----------------------+                    +--------------------------------+  |
+-----------------------------------------------------------------------------------+
                                       |
                                       v Read-Only API
+-----------------------------------------------------------------------------------+
|                        FIBER RECONCILE ANALYTICS WEB                              |
|  - Realtime Payment Metrics (Monitored, Mismatches, Recovered, Unresolved)        |
|  - Activity Breakdown Chart (Normal Matched vs Confirmed Recoveries)              |
|  - Payment Inspection Details (Source-attributed timeline & delivery attempts)    |
|  - Developer Documentation, Examples Guide, and Interactive SDK Reference         |
+-----------------------------------------------------------------------------------+
```

### 3.1 Implemented Repositories and Packages

The codebase is structured as a monorepo containing modular packages and independent deployments:

| Directory | Package Name | Responsibility | Live Deployment |
|---|---|---|---|
| `packages/sdk` | `@fiber-reconcile/sdk` | Client library for merchant backends: register payments, query status, compute webhook HMAC signatures, and parse structured payloads. | N/A (Library) |
| `packages/contracts` | `@fiber-reconcile/contracts` | Shared TypeScript domain schemas, event definitions, state transition enums, and API request/response types. | N/A (Shared Types) |
| `services/reconcile` | `fiber-reconcile-service` | Standalone Node.js daemon containing the polling scheduler, FNN RPC adapter, application readback client, and transactional outbox dispatcher. | Server Runtime |
| `apps/web` | `fiber-reconcile-web` | Public interface including the Analytics dashboard (`/analytics`), documentation portal (`/docs`), demo walk-throughs (`/examples/demo-store`), and SDK reference (`/sdk`). | [fiber-reconcile.vercel.app](https://fiber-reconcile.vercel.app/) |
| `apps/demo` | `fiber-reconcile-demo` | Reference checkout store simulating physical and digital purchases, order creation, payment registration, and controlled failure modes. | [fiber-reconcile-demo.vercel.app](https://fiber-reconcile-demo.vercel.app/) |

---

## 4. Differentiators Against Existing Ecosystem Tools

To ensure clear positioning, Fiber Reconcile complements rather than duplicates existing Nervos developer tooling:
* **vs. FiberFlow:** FiberFlow focuses on merchant checkout workflows, customer-facing invoice generation, and initial webhook dispatching. Fiber Reconcile acts as the downstream safety net, ensuring that if a webhook fails or times out, the payment status is actively reconciled against FNN and resolved.
* **vs. FiberLatch:** FiberLatch standardizes conditional access tokens and cryptographic receipts after payment verification. Fiber Reconcile operates prior to access enforcement, verifying that the on-chain/off-chain settlement strictly matches the business order parameters.
* **Core Value:** Fiber Reconcile provides **persistent, cross-application payment-to-order reconciliation with auditable proof**.

---

## 5. Summary Statement for Grant and Project Proposals

> **Fiber Reconcile ensures that settled Fiber payments reliably translate into fulfilled application orders—even when notifications are dropped, network calls time out, or application processes restart—through automated state reconciliation, idempotent delivery, and verifiable audit evidence.**

---

## 6. Implementation Deliverables & Verification Status

1. **Monorepo Architecture:** All services, shared libraries, and web portals configured with shared build caching and TypeScript project references.
2. **Type Safety and Code Quality:** Clean compilation across all modules with `npm run typecheck`, zero lint violations via `npm run lint`, and unit tests covering SDK signing and outbox retry mechanics.
3. **Controlled Failure Demo:** Built-in simulation scenarios in `apps/demo` allowing developers to trigger missed notifications, process crashes, and duplicate deliveries to observe live reconciliation in `/analytics`.
4. **Documentation & Reference:** Fully integrated technical documentation, SDK guides, and API specifications available directly within the application shell.
