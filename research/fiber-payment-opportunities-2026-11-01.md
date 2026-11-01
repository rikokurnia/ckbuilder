# Fiber payment opportunities: CKBuilder grant research

Research date: 1 November 2026. Public pages inspected with gstack `/browse`; ideas screened using the demand, status quo, narrowest wedge, alternatives, and future-fit criteria in `/office-hours`. This is a research shortlist, not an approved implementation design or a claim of product-market fit.

## Conclusion

The strongest immediate direction is a reusable application settlement-recovery runtime: recover a correct business payment state after missed notifications, process crashes, and retries. A mobile receive-continuity SDK is the second direction. A Lightning-funded Fiber spending session is a third, more dependent research direction.

The funding pattern favors ecosystem utility, reusable deliverables, demonstrated work, and clear scope. Infrastructure is a strong fit, but the program does fund user-facing products. Neither an infrastructure label nor a named core-roadmap gap establishes grant eligibility.

## What the tracker actually establishes

The tracker describes itself as a hub for demos, MVPs, feedback, and project review. On the research date it contained 59 project rows:

| Status | Count |
|---|---:|
| Ongoing | 33 |
| Implementing feedback | 11 |
| POC complete | 9 |
| DAO grant | 4 |
| Paused | 1 |
| Inactive | 1 |

The four DAO-grant labels belong to Pocket Node, Fiber Desktop, Vellum, and FiberLatch. The associated proposals requested $15,000, $6,000, $7,000, and $3,000 respectively. These figures describe proposal budgets, not an independently audited sum of disbursements.

Three are primarily developer/protocol/access tooling; Pocket Node is a user-facing wallet built around an embedded light client. All four make existing CKB/Fiber technology more usable. The small, selected sample does not establish an approval probability by category, and 4/59 is not an approval rate.

The README is also not a complete funding registry. Blackbox is marked Ongoing there, but its POS prototype-testing work received a $750 Spark grant and completed a six-tester study. NCC's Q3 report records Vellum passing on its second attempt, additional proposals at different voting stages, and plans for a subsequent Fiber event focused on products and market-facing applications.

Sources:

- [CKBuilder tracker](https://github.com/Nervos-Community-Catalyst/CKBuilder-projects)
- [Pocket Node proposal](https://talk.nervos.org/t/dis-mobile-ready-ckb-light-client-pocket-node-for-android/9879)
- [Pocket Node completion](https://talk.nervos.org/t/pocket-node-completion-report/10530)
- [Fiber Desktop proposal](https://talk.nervos.org/t/dis-fiber-desktop-v1-ground-up-rebuild-and-launch-fnn-desktop-app/10317)
- [FiberLatch proposal and updates](https://talk.nervos.org/t/dis-fiberlatch-access-open-source-access-control-for-fiber-payments/10414)
- [Vellum resubmission](https://talk.nervos.org/t/dis-vellum-reputation-extension-on-did-ckb/10613)
- [Blackbox approval](https://talk.nervos.org/t/ckb-eco-fund-spark-program-announcement-for-the-blackbox/9583)
- [Blackbox completion](https://talk.nervos.org/t/spark-program-blackbox-completion-report/9844)
- [NCC Q3 report](https://talk.nervos.org/t/nervos-community-catalyst-quarterly-reports/8822/7)

## Existing supply changes the opportunity

Generic paid API calls, usage metering, spending permissions, signed access receipts, merchant checkout, desktop node operation, and liquidity dashboards already have implementations. Relevant projects include Infern, FiberPass, Trickle, FiberLatch, FiberFlow, Fiber Studio, Sluice, and AgentPay. TexLabs has already proposed multi-provider routed payment sessions. TapFiber, posted on 31 October, already proposes payment-intent binding, deterministic order state, and signed receipts.

FiberLatch's current maintained package starts after an application has trusted a payment. Its README explicitly leaves payment verification, persistence decisions, and final resource enforcement to the host. Its October FiberFlow experiment already demonstrated idempotent access issuance after a signed paid webhook timed out and retried. A new receipt or webhook retry package alone would duplicate existing work.

External alternatives have also advanced. x402 batch settlement already supports deposits, off-chain cumulative vouchers, durable server storage, recovery, and batched redemption. Aperture supports L402 and also payment sessions with deposits and refunds. A generic session is not a novel Fiber advantage.

Sources:

- [Opportunity map, evidence snapshot 22 August](https://talk.nervos.org/t/ai-machine-payments-and-fiber-in-2026-an-opportunity-map-for-ckb-and-fiber-developers/10665)
- [FiberLatch current boundary](https://github.com/Ticoworld/fiber-latch)
- [FiberFlow](https://talk.nervos.org/t/fiberflow-self-hosted-merchant-payments-for-fiber-try-the-live-demo/10574)
- [Infern](https://github.com/truthixify/infern)
- [TapFiber](https://talk.nervos.org/t/11079)
- [TexLabs routed sessions](https://talk.nervos.org/t/routed-machine-payment-sessions-on-fiber-looking-for-community-feedback/10694)
- [x402 batch settlement](https://docs.x402.org/schemes/batch-settlement)
- [Aperture](https://github.com/lightninglabs/aperture)

## Fiber's concrete problems and boundaries

1. **Notification loss.** Issue #1717 reports a subscription terminating after a burst of 17 store changes; 100 tenant activations exposed the problem. It was reproduced on develop commit 11846d6. A protocol fix and an application recovery runtime are different deliverables: an application still has to survive its own crash or missed webhook after the protocol defect is repaired.
2. **Mobile suspension.** Issue #1571 describes Android killing the in-app node, dropped connections, inability to sign new commitments, and incoming TLC expiry. Watchtower monitoring does not let an offline endpoint accept and sign a new payment.
3. **Hosted signing is still being productized.** #1625 documents a hosted-LSP implementation and explicit remote-signer release blockers. #1695 describes a preimage/signing deadlock, but a maintainer says it was fixed in commit 3026c6f. Do not pitch that specific bug as unfixed.
4. **Measured latency differs from protocol slogans.** Cellula's 29–31 October report describes a local dev-chain LSP with 11,496 channels. Replacing wallet polling reduced a same-machine median from 4.49s to 0.55s; with 80ms added per call, from 6.55s to 3.17s. A testnet measurement with added delay and backup writes reported 4.98s for the payee and 7.29s for the payer. These are controlled measurements, not 11,496 users or commercial traffic.
5. **Liquidity and conditional protocols overlap core work.** #1541 already scopes Loop In/Out, provider mode, planning, and automation. Basic MPP and watchtower functionality already exist. PTLC and arbitrary on-chain conditional payment inside channels are not stable released functionality.
6. **Stable-value availability is an operating dependency.** The maintainer's August status overview records USDI's exit and the absence of a publicly reusable mainnet stable-value UDT path. The current public-node guide demonstrates RUSD on testnet. UDT protocol support does not establish issuer redemption or usable mainnet liquidity.

Sources: [#1717](https://github.com/nervosnetwork/fiber/issues/1717), [#1571](https://github.com/nervosnetwork/fiber/issues/1571), [#1625](https://github.com/nervosnetwork/fiber/issues/1625), [#1695](https://github.com/nervosnetwork/fiber/issues/1695), [Cellula measurements](https://talk.nervos.org/t/one-fiber-lsp-11-496-channels/11068), [#1541](https://github.com/nervosnetwork/fiber/issues/1541), [maintainer overview](https://gist.github.com/quake/0440eed5a0b02dfb35a43648d06ae64f), [public-node guide](https://github.com/nervosnetwork/fiber/blob/develop/docs/public-nodes.md), [releases](https://github.com/nervosnetwork/fiber/releases).

## Idea 1: Fiber Reconcile

**Problem:** A payment settles in Fiber, but the business application loses the notification or crashes before completing its order. The customer sees a charge while the application remains pending, or a retry risks duplicate fulfillment.

**Solution:** A self-hosted runtime records pending invoice/order bindings durably, checks authoritative FNN invoice state after reconnect or restart, and emits stable, idempotent business events through a transactional outbox. It continues tracking ambiguous or late payments instead of treating a transport timeout as payment failure. The reference merchant consumes events idempotently. Transport may redeliver; the product must not promise universal exactly-once external side effects.

**Why now:** #1717 supplies a reproducible real event-loss scenario. FiberFlow/FiberLatch's October test supplies an existing integrated payment/access workload, including a timeout and duplicate webhook delivery. FNN's recent releases also emphasize payment and recovery correctness.

**Competitors / existing work / improvement:** FiberFlow owns checkout and webhook delivery; TapFiber owns signed intent/order semantics; FiberLatch owns access receipts. Reuse those boundaries. The new product is crash recovery and reconciliation of application payment state across those components. It is not another invoice screen, receipt format, retry button, or alternative FNN implementation.

**Market fit:** Strongest fit as an ecosystem developer public good. The published evidence demonstrates implementation pain and a running integration, not merchant subscription revenue. The initial value is less duplicated recovery code and fewer unresolved payment incidents for existing builders.

**Target user:** Maintainers of Fiber merchant/API applications. FiberFlow and Infern are concrete initial integration targets; Loavix is a relevant invoice-workflow reference. They are targets, not announced customers or partners.

**Substantial change / grant package:** A standalone package/service with a durable reconciliation model, FNN adapter, transactional event delivery, two application integrations, and a reproducible fault-injection suite. A narrow Spark phase can demonstrate one payment type and one runtime before a broader DAO proposal. Proposed acceptance: restart after payment; disconnect event subscription; duplicate delivery; consumer crash after processing; late settlement; no false-paid state; no double fulfillment in the reference app. These are proposed targets, not completed results.

## Idea 2: Fiber Receive Continuity

**Problem:** A phone app closes or Android kills it while receiving a Fiber payment. The wallet cannot sign and the user gets a stalled or expired payment instead of a clear receiving workflow.

**Solution:** A wallet integration layer around the hosted-LSP/remote-signer boundary. Keep keys and signer state on the device, retain pending invoice/session information, resume the same signing workflow on reconnect, and show a correct pending/received/expired outcome. A hosted payment may wait within its safe deadline and complete after the signer returns. This does not promise final receipt while every required signer remains offline.

**Why now:** #1571 names the mobile integration problem; #1625 supplies an implementation to build against and explicit blockers; Cellula supplies current operating measurements. The problem has named engineering users, not just a hypothetical consumer persona.

**Competitors / existing work / improvement:** The core Fiber LSP SDK, Cellula, Fiber FFI, browser fiber-js, and Lightning's hosted-node/LSP approach all cover pieces. Start with an Android integration and reproducible app-kill/reconnect cases rather than a new full wallet. Reuse the core protocol and contribute protocol defects upstream. The contribution must be a portable wallet lifecycle and recovery implementation, not a second implementation of the core hosted LSP.

**Market fit:** Wallet-team infrastructure first. Its end-user benefit is a receiving experience that survives normal phone lifecycle events. A mobile OS interruption is a documented problem; a mass-market payments business is a separate commercial step. This direction is more coupled to evolving core work than Idea 1.

**Target user:** Fiber mobile/browser wallet maintainers, including the integration described in #1571 and teams operating wallets like Cellula. Pocket Node supplies relevant native-wallet and distribution precedent, not an existing Fiber integration or agreed partner.

**Substantial change / grant package:** A reusable wallet module, persisted signer/session lifecycle, Android reference integration, and interoperability/failure evidence across two LSP instances. Proposed acceptance: kill app during receiving; reconnect before deadline; reopen after deadline; restart signer; interrupt network; restore supported local state; ensure the UI never claims receipt before the actual payment result. Scope and tested core version must be pinned. Production custody claims require the core signer release boundaries to be satisfied.

## Idea 3: Lightning-Funded Fiber Sessions

**Problem:** An existing Fiber service wants to sell repeated small actions to a buyer who holds Lightning BTC. Converting separately for each tiny action can make bridge overhead dominate the purchase.

**Solution:** One Lightning-funded session tops up a buyer-controlled Fiber balance in the operator-supported wrapped-BTC UDT. Repeated calls then spend over existing Fiber routes. Show the entry quote, spending budget, remaining balance, and exit cost explicitly. Start with one asset, one controlled CCH operator, and two existing Fiber-native services, rather than an agent marketplace or a new bridge protocol.

**Why now:** CCH has live bidirectional testnet smoke coverage, including an external service and relayed Lightning path. Its current published test configuration provides a concrete cost problem: a sample BTC→cWBTC flow sends 200 sats to deliver 100 raw cWBTC, consisting of 100 sats principal plus 100 sats CCH fee. That is test configuration, not a universal CCH tariff.

**Competitors / existing work / improvement:** CCH, FiberSwap, AgentPay, TexLabs's routed-session proposal, Aperture/L402, and x402 batch settlement. The product difference must be end-to-end BTC-funded use of existing CKB/Fiber-native services, with real quote/capital/recovery measurements. Sessions and batching by themselves are already implemented elsewhere. For a seller that only needs ordinary BTC API billing, Aperture is a simpler existing option.

**Market fit:** Narrowest and weakest business evidence of the three. Public evidence establishes functioning interoperability and costly small cross-network test flows. It does not establish repeat-paying buyers for a new Fiber bridge product. Position the initial funding as a bounded interoperability experiment serving existing Fiber providers, with measured operator cost, rather than claiming an established market.

**Target user:** Existing Fiber-native paid-service operators and BTC-funded software clients. Infern is an integration candidate; the CCH operator is a required operating counterpart, not an assumed public mainnet service.

**Substantial change / grant package:** Extend a one-off swap into a reusable session funding/spending/recovery lifecycle and integrate two independent services. Keep CCH and existing session primitives. Proposed acceptance: compare per-purchase conversion with one-session funding at the same quote; record all fees and locked capital; interrupt either side; recover or expose the correct unresolved state; close the session and account for its remaining balance. Funding a proof is separate from funding liquidity or an asset issuer.

Sources: [CCH smoke tests and fee example](https://github.com/sunchengzhu/cch-daily-smoke), [testnet demo](https://talk.nervos.org/t/paying-a-bitcoin-lightning-invoice-with-ckb-udt-on-fiber/10486), [AgentPay](https://talk.nervos.org/t/agent-pay-btc-first-agent-pay/10086), [Aperture](https://github.com/lightninglabs/aperture), [x402](https://docs.x402.org/schemes/batch-settlement).

## Grant interpretation and next deliverable

Spark's March 2026 clarification sets a $2,000 overall ceiling; requests above $1,000 need a concrete complexity justification. Its June template asks for current state versus funded scope, specific deliverables, and inexpensive independent verification. The later update removes mandatory bilingual forum content.

Do not interpret this as automatic funding for infrastructure. FNN Safeguard drew maintainer criticism that its differentiation from integration of existing recovery tools was insufficiently clear. Fiber Weir was explicitly rejected on overlap with the core roadmap, incremental application value, feasibility, scope/budget, and the applicant's delivery record.

Recommended next deliverable: for Fiber Reconcile, produce a reproducible lost-notification/crash example and a minimal recovery runtime attached to one existing application. The next milestone is a second independently maintained integration. A short operational report should show unresolved payments, duplicate business actions, recovery time, and the amount of recovery code the integrating app still owns. These outcomes are more persuasive than a large dashboard or another SDK surface alone.

Sources: [Spark rules and updates](https://talk.nervos.org/t/spark-program-mini-grant-initiative/8752/4), [Spark template](https://talk.nervos.org/t/spark-program-mini-grant-initiative/8752/7), [FNN Safeguard review](https://talk.nervos.org/t/dis-fnn-safeguard-recovery-verification-and-pre-upgrade-qualification-for-fiber-nodes/10712/4), [Fiber Weir decision](https://talk.nervos.org/t/spark-program-fiber-weir-condition-gated-payment-streams-for-fiber-network/10723/4).
