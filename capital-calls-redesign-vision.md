# Capital Call Creation & Execution — Redesign Vision

> Ryan's proposed redesign for bunch's Capital Call Creation & Execution experience. Synthesizes: the domain deep-dive (`capital-calls-context.md`), the original take-home brief and execution guide (`design-challenge-capital-calls.md`), the as-is reference flows (`carta-flow-context.md`, `bunch-capital-call-flow.md`), and bunch's own product suite and positioning (`bunch-products-overview-context.md`). This is not a Carta clone or a polish pass on Bunch's current wizard — it's a from-scratch structure built around one deliberate decision: **scheduled and investment-driven capital calls are different workflows wearing the same coat**, and the design has to make that legible without fragmenting the fund manager's mental model of "everything happening with my capital."
>
> **v2 note:** This revision reflects the full Figma build, produced iteratively with rounds of direct feedback. Three structural changes from v1 worth flagging up front: (1) the single "Bunch Operations Reviewer" persona split into two distinct layers — a fund's own **internal peer review** (Reviews) and Bunch's separate **cross-fund ops review** (Review Queue); (2) capital calls are no longer assumed fund-wide-to-everyone by default — recipient targeting is now an explicit step; (3) a **"Request Bunch Support" chat** exists at every stage a fund manager might get stuck, wired end-to-end so Bunch can actually see and answer it.

---

## 1. Problem Framing

### The problem in one sentence
Bunch's capital call workflow today is accurate enough to trust with money movement but not legible enough to trust with visibility — fund managers can't see where a call actually is, reviewers (internal or Bunch's own) have no real workspace, and both automated and manual work happen in the same undifferentiated screen, so a routine quarterly fee call and a complex, side-letter-laden investment-driven call get treated as the same kind of event when they aren't.

### Key users and roles

| Persona | Role in the flow | What they need from the system |
|---|---|---|
| **Fund Manager / GP** | Initiates calls; targets recipients; holds fiduciary responsibility for accuracy | Fast initiation, real-time visibility into where a call sits, confidence the math is right before it goes to LPs |
| **CFO / Head of Finance & Ops** | Day-to-day power user; often both creates calls *and* is asked to peer-review a colleague's | A single source of truth, low manual-error surface, clear NAV/capital-account impact |
| **A fund-team colleague acting as internal reviewer** | Not a separate role so much as a delegation — one GP/CFO creates a call and assigns it to another on the same team to check before it leaves the fund | A real workspace (**Reviews**, Fund Manager persona) — calculation + notice + Approve/Request-Revision, not a rubber stamp |
| **Bunch Ops / Account Management** | Bunch's own cross-fund team; validates and approves every call across every client fund before notices go out; also the destination for in-flow support chats | A "God view" workspace (**Review Queue**, Bunch Admin persona) — SLA-prioritized, checklist-driven, with visibility into every fund manager's open support threads |
| **Compliance / AML Officer** | Clears or blocks LPs on KYC/AML grounds; triggered both on a renewal cycle and by ad hoc events | Proactive visibility into upcoming expiries, not just reactive alerts when a call is already blocked |
| **LP / Investor** | Receives notices, pays, may dispute; also now has a real (if simple) portal of their own | Enough lead time, unambiguous amount and wire instructions, a way to confirm and a way to flag a problem, visibility into every fund they're committed to |
| **LP's Treasury/Finance Contact** | Executes the actual transfer at the LP org | Correct wire details, enough runway inside their own internal approval process |

Three personas get their own top-level surface now (switchable from a persona control in the top nav, each with its own left nav): **Fund Manager**, **Bunch Admin**, **Investor**. This is a bigger structural change than it looks — see Section 10.

### Workflow dependencies
- A call cannot be calculated until LPA + side-letter data is structured, KYC is current, and the capital account reflects the last reconciliation.
- Internal peer review (if a colleague is assigned) happens before or alongside Bunch's own review — neither is a substitute for the other. Bunch's Review Queue approval is the gate that must clear before notices dispatch, regardless of what happened internally.
- Notice send is blocked, per-LP, by KYC status — the rest of the batch is never blocked by one LP's exception.
- A fund manager can **park a call mid-flow** via "Request Bunch Support" — the call stays in its current state, visibly flagged as awaiting a reply, and does not silently drop off anyone's queue.
- Reconciliation depends on payment tracking, which depends on notices actually reaching LPs, which depends on approval, which depends on review, which depends on calculation, which depends on clean upstream data and (new) a deliberate recipient list. Every stage inherits the previous stage's data quality — which is exactly why traceability has to be visible at every step, not just logged.

### Risks (full register in `capital-calls-context.md` §23; the load-bearing ones for this design)
1. **KYC/AML lapses silently blocking an LP's notice** — surfaced proactively (before a call is even created) and tied to the LP's jurisdiction, since renewal cadence and documentation requirements are country-specific. This is the reference failure path used throughout (Section 7) — deliberately *not* a generic "missing data" placeholder, because the real regulatory reason (and the country it's tied to) is what a reviewer actually needs to act on it.
2. **A calculation error reaching an LP** — the review gate(s) exist precisely because the engine can't fully encode every side-letter edge case; the design has to make the reviewer's job doable, not decorative, at both the internal-peer and Bunch-ops layers.
3. **Working capital or similar balancing mechanics used opaquely** — itemized as its own line everywhere it appears, never a silent balancing figure.
4. **Assuming every call goes to every LP** — the original design's biggest blind spot. Equalisation, excuse rights, and corrective calls all legitimately target a subset. Defaulting silently to "everyone" and giving no way to override it would have been wrong for a meaningful share of real calls.

### Assumptions (stated explicitly, not left implicit)
- LPA and side-letter data are already uploaded and parsed into structured fund data before this flow begins (parsing itself is out of scope).
- Equalisation is calculated by the engine and surfaces as a distinct, explained line item — the UI for *setting up* equalisation parameters when a new LP joins a subsequent closing is out of scope; triggering an equalisation call *to* that one LP via recipient targeting is in scope.
- Multi-currency handling exists (FX rate applied and logged) but a full multi-currency configuration UI is out of scope.
- In-platform notice delivery is assumed legally valid for all four operating jurisdictions for the funds using this flow (a real open question in the domain file — flagged, not silently assumed away).
- Distributions (the reverse flow) exist as a nav destination in every persona's IA but are not designed here — out of scope, same as v1.
- "Request Bunch Support" is a lightweight, threaded chat scoped to one capital call — it is not a general-purpose messaging product, and search/history-across-calls is explicitly deferred (Section 9).

### Open questions (genuinely unresolvable without being inside bunch — see domain file §14/§24 for the full list)
- What share of LPA/side-letter logic is actually encoded in the engine today vs. handled manually by ops?
- What's the real reviewer SLA today, and where does time actually go?
- Has default-handling logic ever been exercised on a real fund, and what did that reveal?
- **New:** how should internal peer review (Reviews) and Bunch's own review (Review Queue) actually sequence in production — must internal review complete before a call reaches Bunch, or do they run in parallel? This design treats them as independent gates that both must clear, but the real operational SLA implications need validation inside bunch.

---

## 2. The Automation Boundary

Unchanged in spirit from v1, with one addition:

**The system calculates automatically:**
- Pro-rata allocation for both scheduled and investment-driven calls, scoped to whichever recipients are targeted (all LPs by default, or a manually selected subset)
- Management fee schedules and step-downs
- Equalisation amounts and equalisation interest when a new LP is detected since the last call
- Working capital as an itemized line, never as a silent balancing figure
- Payment matching against expected amounts (amount + wire reference + originating bank)

**The system flags for human review, but does not block the whole call:**
- Lapsed or soon-to-expire KYC/AML status, tied to the LP's jurisdiction
- Side-letter terms present but not yet parsed into structured rules
- An LPA clause that's ambiguous for a specific calculation
- Currency mismatch with no FX instruction on file

**A human must explicitly sign off before anything is financially binding:**
- **Recipient targeting itself** — "all investors" is the default, but it is a visible, deliberate choice, not a silent assumption (new in v2)
- Internal peer approval, where a colleague is assigned (Reviews)
- Bunch's own ops approval, against the structured checklist (Review Queue) — this gate is never removed, only made legible
- Any manual override (requires a written rationale, is visually distinct, and is permanently attached to the audit trail)
- The fund manager's final "Submit for Review" / "Confirm & Activate" action

This boundary is rendered as a literal design element: every calculated value in the LP-level breakdown carries a "Calculated" vs. "Overridden" indicator, the recipient-selection step shows a running total that changes as the human overrides the default, and both review screens are structured entirely around this boundary.

---

## 3. State Model

Reused directly from the domain file's state machine (`capital-calls-context.md` §22):

```
DRAFT → CALCULATION IN PROGRESS → CALCULATION COMPLETE →
UNDER REVIEW ⇄ CHANGES REQUESTED → (UNDER REVIEW — ESCALATED, optional) →
APPROVED [— PARTIAL HOLD (KYC)] → NOTICES SENT (PARTIAL or FULL) →
PARTIALLY PAID → (OVERDUE → GRACE PERIOD → IN DEFAULT, per-LP) → FULLY PAID →
RECONCILED / COMPLETED
```
Terminal/exceptional: `CANCELLED`, `RECALLED`, `DISPUTED — UNRESOLVED`.

**Support-parked is a UI affordance, not a new lifecycle state.** When a fund manager clicks "Save & Close" inside a support chat, the call's underlying state doesn't change — it just gets a visible "awaiting Bunch's reply" indicator wherever it's listed (Dashboard, Reviews, Review Queue), so it isn't confused with being blocked by the workflow itself.

Scheduled calls still run a **collapsed version** of this same state machine (Draft/Calculation/Review compress into a single "generated" moment). Every state is still a per-LP state where it needs to be, not just a per-call state — now made concrete in the Dashboard's flattened, one-row-per-investor table (Section 6).

---

## 4. Core User Flows

### 4.1 Flow — Create a Capital Call (unified, 4 steps)

Scheduled and one-time calls now share **one flow**; they only diverge at Step 2.

1. **Step 1 — Type + Fund:** toggle **One-time / Scheduled**, select fund.
2. **Step 2 — Details** *(the only step that differs by type)*:
   - *One-time:* purpose, optional linked investment record, amount, notice date, due date (validated against the LPA's minimum notice period).
   - *Scheduled:* start date, repeat cadence, annual fee rate, step-down trigger, included line items.
3. **Step 3 — Recipients** *(new)*: a button group — **All investors in the fund** (default) or **Manual Select**. All-investors shows the full pro-rata table read-only, with a download option. Manual Select opens the same table with checkboxes and a running selection summary (LPs selected, total call amount, excluded-LP count) that updates live as rows are toggled. Excluded LPs are logged with a reason, visible in the audit trail as "not called this cycle" rather than silently omitted.
4. **Step 4 — Preview** *(merged — was two separate steps in v1)*: shows the calculation results (or, for Scheduled, the next 4 projected occurrences) **and** the generated notices — one fund-branded, letter-formatted document per selected LP, each zoomable and individually downloadable — in the same screen. Primary CTA **Submit for Review** (One-time) or **Confirm & Activate** (Scheduled); secondary actions **Save for Later** and **Request Bunch Support**.

Submitting routes the call to whichever colleague it's assigned to (their **Reviews** queue) and, independently, into Bunch's own **Review Queue** — see 4.2 and 4.3.

### 4.2 Flow — Fund-Team Peer Review (Reviews)

Not Bunch's review — this is one member of a fund's own team checking a colleague's work before (or in parallel with) Bunch's pass.

1. Open **Reviews** → table of calls a colleague created and assigned to this person, with a **Fund level / Investor level** toggle (investor level is the default — it expands the selected call into its per-LP rows so a flagged LP, like a KYC exception, is visible without leaving the table).
2. Select a call → right panel shows the calculation (downloadable) and the notice template (with a live thumbnail, downloadable) together, plus a flag callout naming the specific exception and LP.
3. **Approve**, or **Request Revision** — which opens a popup with structured category tags (Amount / Dates / Wording / Line items) and a notes field, rather than acting immediately.
4. **Request Bunch Support** is available here too — opens a threaded chat scoped to this call; sending a message and clicking "Save & Close" parks the call, visibly, until Bunch replies.

### 4.3 Flow — Bunch Admin: Review Queue → Approve

This is the mandatory ops gate from v1, now explicitly reframed as **cross-fund**, not scoped to any one client.

1. **Review Queue** (every pending call across every client fund, prioritized by SLA and priority) → open a pending call. Rows with an open fund-manager support thread show a chat indicator.
2. Structured 7-item checklist, each item individually resolvable: total amount vs. stated purpose, pro-rata allocation, side-letter terms, equalisation, incomplete-data flags, jurisdiction overlays, KYC/AML status.
3. **Per-item actions:** check off, request changes, or escalate — escalation doesn't block the rest of the checklist.
4. If a support thread is open, the checklist panel surfaces it directly ("Open thread & Reply") — Bunch reads and responds from the same screen, not a separate inbox.
5. **Approve** only once every item is resolved or escalated-and-accepted → `APPROVED` (or `APPROVED — PARTIAL HOLD (KYC)` if one LP is still blocked) → notices auto-generate for the cleared LPs.

### 4.4 Flow — LP: Receive, Confirm, Pay

Unchanged in shape from v1, now backed by the same shared notice template every other persona sees: notification → open notice (fund-branded, opens with a short letter paragraph, then the auto-calculated figures and wire instructions) → download PDF if needed → confirm digital receipt (logged) → transfer executed externally → system detects and matches → status → `Paid`. The Investor persona also now has **My Portfolio** (every fund they're committed to) and **My Capital Calls** with the same List/Timeline toggle pattern used on the Fund Manager Dashboard, scoped to their own calls.

### 4.5 Flow — LP: Raise a Dispute
Unchanged from the domain file's Flow 5: Flag Issue → Fund Manager and reviewer(s) alerted → that LP's notice recalled → investigated, corrected, resubmitted through the standard flow.

---

## 5. Happy Path — Full Worked Example

**Scenario:** Cherry Fund II, 14 LPs. Fund manager Priya initiates a €2M Series B follow-on call, targeting 9 of the 14 LPs (the other 5 sit this one out per a side-letter excuse right).

1. Priya opens the **Dashboard**, clicks **New Capital Call**, picks **One-time**, selects Cherry Fund II.
2. **Step 2:** enters purpose, amount, notice date; due date auto-suggests 20 business days out.
3. **Step 3 — Recipients:** switches to **Manual Select**, unchecks the 5 excused LPs. The selection summary updates live: 9 of 14 selected, €1,325,428 total.
4. **Step 4 — Preview:** calculation completes for the 9 selected LPs; one (Zara Quantum Solutions, Netherlands) is flagged — KYC clearance expired, AFM renewal cycle. Nine fund-branded notices render as thumbnails below the calculation card. Priya clicks **Submit for Review**, assigning it to her CFO, Tom, for a first pass.
5. Tom opens **Reviews**, sees the call at investor level, spot-checks the flagged LP's row, clicks **Approve**.
6. The call also lands in Bunch reviewer Marco's **Review Queue** (cross-fund, same-day SLA). He works the 7-item checklist — 6 clear immediately; he escalates the KYC item to Compliance without blocking the rest. Approves. State → `APPROVED — PARTIAL HOLD (KYC)`.
7. 8 notices dispatch immediately; Zara Quantum's is visibly held with the specific reason shown. Priya tracks payment progress from the same enriched **Dashboard** table she started from — one row per LP, per call, with Committed/Called/Paid/Status columns.
8. Three days later, Compliance clears Zara Quantum's renewed KYC; its held notice auto-dispatches.
9. Once all 9 are `Paid`, Priya opens **Reconciliation**, confirms — capital accounts update, and this call's total becomes the "previously drawn capital" figure for Cherry Fund II's next call.

Nothing broke. Every step was visible, including the decision about *who* was even being called.

---

## 6. Screen-by-Screen Spec

Screens are grouped by persona; each is reachable from that persona's own left nav (Section 10).

### Fund Manager

**Dashboard (Overview)** — the fund manager's landing page, and the one surface spanning their *entire* work lifecycle, not just capital calls. Where the Capital Calls screens below are call-centric, this is person-centric: it answers "what do I need to do today, and how is everything I'm responsible for actually doing," pulling a glanceable slice from every Bunch product line (Transfer Agency, Fund Accounting & Reporting, Investor Portal, Compliance, Treasury, Fund Admin Service, bunch tax) into one screen, each with a "View all / Show all" path back to that product's full surface. *(Note: "Dashboard (List view)" and "Dashboard (Timeline view)" immediately below describe the Capital Calls table, now reached via the dedicated **Capital Calls** nav item — kept under their original screen names for continuity with earlier sections of this document.)*

Widget catalog:

| Widget | What it shows | User story | KPI(s) it serves | Why it's here |
|---|---|---|---|---|
| **KPI strip** | Total AUM, Active Vehicles, Total LPs, Called-to-Date %, Blended NAV — five always-visible figures | As a Fund Manager, I want the numbers I'd otherwise ask my CFO for, or check three screens to find, visible the moment I log in. | Total AUM; Active Vehicles; Total LPs; Called-to-Date %; Blended NAV | These are exactly the figures the persona research (Section 1, "what they need from the system") named as table-stakes — a portfolio-level gut check before drilling into anything. |
| **Needs Your Attention** | A single, cross-product action inbox — a capital call awaiting review, a KYC expiry, an e-signature, an open Bunch Support chat reply, uncategorized bank transactions — sorted by urgency, each with a one-click destination | As a Fund Manager, I want every open item that needs *my* action surfaced in one place regardless of which Bunch product it lives in, so I don't have to visit five screens to find what's actually blocking on me. | Count of open action items by category; time since flagged | Directly answers the "~60% of week on infrastructure, not investing" pain point (`bunch-products-overview-context.md` §2) — the cost isn't doing the work, it's *finding* it. This is the dashboard's single most important widget. |
| **Capital Calls** | Status breakdown (Under Review / Notices Sent / Overdue) plus in-flight calls with progress bars | As a Fund Manager, I want to know at a glance whether any call needs attention before I open the full Capital Calls table. | Count of Overdue calls (risk signal); % paid per in-flight call | Overdue is the default failure path (Section 8) surfacing itself here before it's buried in a table row. |
| **Distributions** | Distributed YTD, DPI, next scheduled distribution, plus in-flight distributions with progress | As a Fund Manager, I want the same at-a-glance visibility into money going *out* to LPs that I have for money coming in. | Distributed YTD; DPI | Distributions are Transfer Agency's other half (`bunch-products-overview-context.md` §5) — a dashboard that only shows calls quietly assumes the job is one-directional, which it isn't. This widget is a glanceable summary only; the full distributions *flow* stays out of scope per Section 9. |
| **My Fund Performance** | Tabbed (Top Performers / Low Performers) horizontal bar chart ranking every fund/vehicle in the portfolio, with MoM / QoQ / YoY period filters | As a Fund Manager overseeing multiple vehicles, I want to see which funds are outperforming or underperforming *relative to each other*, on whatever time horizon comes up in an LP call, without exporting to a spreadsheet. | Comparative IRR (or NAV growth) across funds, by period | Multi-vehicle managers (the institutional end of Bunch's range, e.g. Cherry Ventures/Motive Partners) think in portfolio terms, not single-fund terms — this widget is built explicitly for that segment, distinct from the single-fund card next to it. |
| **Fund Performance** | This fund's own absolute metrics: Blended NAV, IRR, TVPI, DPI, MOIC | As a Fund Manager, I want my currently-selected fund's core return metrics without leaving the dashboard. | NAV, IRR, TVPI, DPI, MOIC | The standard LP-reporting metric set (`capital-calls-context.md` persona notes). Deliberately paired next to the comparative chart: one widget answers "how am I doing," the other "how am I doing *relative to my other funds*." |
| **Fund Accounting** | Close-cycle progress ("12 of 15 items"), days since last reconciliation, auditor access status | As a Fund Manager, I want to know where the current close actually stands without pinging my fund accountant. | Close-cycle completion %; days-since-reconciliation | Targets the NAV-turnaround pain point named explicitly in `bunch-products-overview-context.md` §8 (CFO persona: "frustration with the industry-standard 90-day post-quarter NAV cycle") — visible proof the cycle is moving, not a black box. |
| **Compliance** | KYC/AML expiring within 30 days, outstanding filings (LEI, FATCA/CRS) with due dates | As a Fund Manager, I want jurisdiction-specific compliance deadlines surfaced before they become a blocked capital call, not after. | Count of LPs with expiring KYC/AML; count of outstanding filings | Directly implements Risk #1 from Section 1 ("KYC/AML lapses silently blocking an LP's notice — surfaced proactively") at the dashboard level, before a call ever reaches Step 4's flag. |
| **Investors** | Portal logins (7d), pending e-signatures, new LP onboarding in progress | As a Fund Manager, I want to know whether my LPs are actually engaging with the portal and whether anything needs my signature. | Portal logins (7d); pending e-signatures; onboarding-in-progress count | Surfaces Investor Portal engagement (`bunch-products-overview-context.md` §5) — without this, a fund manager has no way of knowing if an LP has gone dark. |
| **Treasury** | Total cash balance, pending wires, last payment run | As a Fund Manager, I want my actual cash position across fund bank accounts without logging into the bank portal separately. | Total cash balance; pending wire count | Treasury is one of Bunch's core products (`bunch-products-overview-context.md` §5) and the thing the "single system of record" pitch is actually selling — omitting it would leave the fund manager's most consequential question ("can I actually pay this") off their own landing page. |
| **Bunch Support** | Named key account manager, open chat thread count, average response time | As a Fund Manager, I want to know who my dedicated Bunch contact is and whether I'm waiting on a reply, without hunting for the chat button on whichever screen I opened it from. | Open thread count; avg response time | Bunch's positioning is explicitly hybrid software-plus-service (`bunch-products-overview-context.md` §4) — this widget is the dashboard's acknowledgment that a named person, not just software, is part of the product. |
| **bunch tax** | Next filing deadline, jurisdiction/entity for the current filing, investor tax report status | As a Fund Manager, I want tax filing deadlines on the same dashboard as everything else, since a missed filing is operationally as serious as a missed capital call. | Days to next filing; investor tax report status (on track / at risk) | bunch tax's own stated value proposition is an ~80% cut in investor-reporting turnaround (`bunch-products-overview-context.md` §5) — this is the KPI that claim should be visibly proven against quarter over quarter, not just asserted in marketing. |
| **Right panel — My Tasks / Activity tabs** | A persistent, tabbed panel: **My Tasks** (items a colleague explicitly assigned to this person, distinct from system-flagged items) and **Activity** (recent cross-product actions — calls approved, notices sent, payments reconciled, documents signed) | As a Fund Manager, I want tasks a colleague assigned *to me specifically* kept visually separate from the system's own flagged items, plus a lightweight activity log I can glance at without leaving the dashboard. | Open assigned-task count; days-to-due per task | Collapsing person-assigned and system-flagged items into one list was considered and rejected during widget planning — they're different mental models (a colleague waiting on you vs. the platform surfacing a risk), and merging them would bury the assigned-to-you items under a system-generated firehose. |

*Acceptance:*
- No widget's "View all / Show all" link may point to a destination absent from that persona's left nav — every link maps to a real screen (Capital Calls, Distributions, Compliance, Investors, Treasury, Tasks, etc.).
- Needs Your Attention and My Tasks never merge into a single list — system-flagged and person-assigned items stay visually and structurally distinct.
- Any number shown on the Dashboard that also appears on a deeper screen (e.g. Blended NAV, on both the KPI strip and the Fund Performance card) is the same value from the same source — the Dashboard is a glanceable slice of the system of record, never a second copy of it.
- The right panel's Activity tab is spec'd but not yet content-designed in this pass — only My Tasks is built out. A Calendar/Gmail-recap tab was explored during widget planning but not carried into the final build; this is a deferred idea, not a silently dropped one.

**Dashboard (List view)** — the single place to see everything happening with capital. One row per call-investor pair (not per call) — Type, Fund, Call, Investor, Country, Notice→Due dates, Committed, Called, Paid, Status. Filter chips (All/Scheduled/One-time/Exceptions). Selecting a row opens a detail panel with the calculation and the notice (thumbnail + download).
*Acceptance:* an LP-level exception is visible from the row itself, not just on drill-in; status vocabulary matches Section 3 exactly.

**Dashboard (Timeline view)** — same data, plotted across the fund's full commitment period. Recurring/scheduled calls auto-project forward as light tick marks; one-time calls are diamonds (solid = realized, dashed outline = projected). Toggle lives next to the filter chips, List/Timeline.

**New Capital Call — Steps 1–4** (Section 4.1) — Type+Fund, Details (2 content states), Recipients (2 states: All/Manual, both with the full pro-rata table), Preview (merged calculation + notice grid, 2 content states by type).
*Acceptance:* step counters read consistently "Step X of 4" everywhere; switching recipient selection recalculates the running total live; no notice can reach the preview grid with an unpopulated field.

**Reviews** — internal peer-review queue (Section 4.2). Fund level/Investor level toggle, investor level default. Assigned-to shown as an avatar stack ("Me +3"). Approve / Request Revision (popup with category tags + notes) / Request Bunch Support.
*Acceptance:* the flagged LP's specific reason (not a generic "incomplete data") is visible without opening a sub-screen; the notice preview is the same template an LP will actually receive, not a mockup of it.

**Default Remedy** — triggered from an `In Default` row. Status stepper (Notice sent → Overdue → Grace period → In Default). Three remedy cards (Direct Negotiation / Sell Interest / Reallocate Commitment), each with a plain-language "what happens" consequence before selection.
*Acceptance:* selecting a remedy never alters the state of any other LP in the same call; the consequence text names real numbers (the specific LP's share, the specific redistribution), not a template placeholder.

**Reconciliation & Completion** — confirmation screen once every targeted LP is Paid. Call summary (expected vs. received, remedied defaults) alongside a "what happens when you confirm" card naming the downstream capital-account effect.
*Acceptance:* Confirm is unavailable while any targeted LP remains unresolved; the call becomes read-only afterward except for the audit trail.

### Bunch Admin

**Review Queue** — cross-fund (Section 4.3). Fund/Client, Call, Amount, Submitted, SLA, Priority columns; chat indicator on rows with an open fund-manager thread. Selecting a row opens the 7-item checklist, the support thread (if any, with "Open thread & Reply"), and Approve/Request Changes.
*Acceptance:* Approve is disabled until all 7 items have a resolution state; escalating one item never blocks the other six; an open chat thread is visible and answerable from this screen, not a separate inbox.

### Investor

**My Portfolio** — every fund/deal this LP is committed to, across every manager (not just bunch-run funds they happen to be in). Fund, Manager, Vintage, Committed, Called, Distributed, Status.

**Capital Calls (List / Timeline)** — this LP's own call history and pending items, across every fund, with the same List/Timeline toggle pattern as the Fund Manager Dashboard, scoped to their own data.

**Notice Detail** — Section 4.4. The shared branded notice template (Section 10) embedded in a page with a status pill, Confirm Receipt / Flag Issue actions, and a PDF download.
*Acceptance:* Flag Issue pauses only this LP's notice; Confirm Receipt is logged distinctly from "Paid."

---

## 7. Failure Path A — KYC Expiry (Worked Example)

**Scenario:** Same 9-LP targeted call as Section 5, but one LP — a family office based in the Netherlands — had their KYC clearance lapse 2 days before this call was created.

1. Priya creates the call as in the happy path. At **Step 4 (Preview)**, the system detects the lapsed KYC status and surfaces it live as a flag — not silently, and not blocking the other 8 LPs' calculation.
2. The flag names the specific reason: "KYC clearance expired — Netherlands, AFM renewal cycle." Priya cannot resolve this herself (it requires the Compliance Officer); she submits the call anyway — submission is never blocked by incomplete data.
3. At **Reviews**, Tom sees the flagged row (investor-level view surfaces it directly) and approves anyway, noting the escalation is Bunch's to action.
4. At **Review Queue**, Marco works the checklist. The KYC item is flagged red for this one LP. He escalates it to the Compliance Officer while approving the other six items normally.
5. Marco approves the call. State becomes `APPROVED — PARTIAL HOLD (KYC)`. The Compliance Officer gets a dedicated task: clear or reject this LP's KYC.
6. At **Preview's notice grid** (now dispatched), 8 notices go out immediately; the 9th LP's notice is visibly held with the specific reason shown, surfaced on the Dashboard row as "Held — flagged," never confused with a payment problem.
7. Three days later, Compliance clears the renewed KYC. The held notice auto-dispatches; the LP's row moves to Pending like the rest.
8. The call proceeds to full reconciliation once all 9 (including the late-starting 9th) have paid.

**Why this path matters:** it's the concrete proof that "flag, don't block" and "partial batch send" are an actual, navigable UI path — and that the *reason* (a jurisdiction-specific regulatory lapse, not a vague "missing data") is what makes the flag actionable rather than just alarming.

---

## 8. Failure Path B — Payment Default After Notice Sent (Worked Example)

**Scenario:** Same call, a different LP — cash-flow timing issues, doesn't pay by the due date.

1. Notice sent normally; the LP's row on the **Dashboard** starts in `Pending`, deadline countdown visible.
2. Due date passes with no payment. System moves the row to `Overdue`. Priya and the reviewers are alerted, naming the specific LP and amount.
3. The LPA's cure period begins — row updates to `Overdue — Grace Period`, with the default-interest rate accruing as a running figure.
4. Automated reminders fire at the cure period's midpoint and 24 hours before it closes.
5. Cure period closes with no payment. Row moves to `In Default`. Priya is prompted with the dedicated **Default Remedy** screen (Section 6): three named options straight from the LPA, each with its mechanical consequence shown in plain language before she picks one.
6. Whichever remedy she selects is logged with timestamp and authorization — the other 8 targeted LPs' journeys are entirely unaffected.
7. Once the remedy resolves, the call can fully close — the defaulting LP's line is marked resolved-via-remedy, distinct from Paid, permanently visible in that call's history.

**Why this path matters:** proof that one LP's worst-case outcome never contaminates the visibility or completion of everyone else's — now demonstrably true down to the recipient-targeting layer, since a defaulting LP was itself part of a deliberately chosen subset, not an assumed-in default.

---

## 9. Explicit Trade-Offs

**What was prioritized:** the automation boundary, the state model made visible end-to-end, a real workspace for *both* review layers (internal and Bunch), both failure paths fully specified, and — new in v2 — making recipient targeting and cross-team support (chat) first-class instead of assumed away.

**What changed from "simplified" in v1 to "now built" in v2:**
- Recipient targeting (All investors / Manual Select) was explicitly out of scope in v1 as an assumption; it's now a full step with a selectable table and live running total.
- A single generic notice template became one shared, fund-branded, dynamically-populated document used identically by every persona (Fund Manager preview, Bunch reviewer, LP recipient) — not three different renderings of "the same idea."

**What's still simplified:**
- Equalisation is shown as a calculated, traceable line item, but the UI for *configuring* equalisation parameters when a new LP joins a subsequent closing is not designed.
- Multi-currency is handled at the data level but has no dedicated configuration screen.
- The LP-side experience is three screens (My Portfolio, Capital Calls, Notice Detail), not a full portal — deeper investor-portal-grade reporting and document rooms are assumed to exist adjacently.
- Jurisdiction-specific overlays remain a checklist item the reviewer confirms, not a fully modeled configurable-rules UI.
- "Request Bunch Support" is scoped to one call at a time — there's no cross-call chat history, search, or SLA on Bunch's reply time yet.

**What would be deferred to a real V1's second sprint:**
1. The concurrent-reviewer conflict case (two reviewers on the same call) — still just a "currently being reviewed by" indicator, not a full locking/merge UX.
2. How internal peer review (Reviews) and Bunch's review (Review Queue) actually sequence — this design runs them as independent gates; production may need an explicit handoff state between them.
3. A dedicated equalisation-configuration flow for subsequent closings.
4. Chat as a first-class, searchable support surface beyond a single-call thread.

---

## 10. UX/UI System — Layout, Design System, and Best Practices

### Three personas, one shell language
The single biggest structural change from v1: **Fund Manager**, **Bunch Admin**, and **Investor** are three distinct top-level surfaces, switched from a persona control in a shared top nav (next to the bunch wordmark, alongside global search, notifications, and account). Each persona gets its **own left nav**, grounded in what that persona actually does — not one generic sidebar reused three times:
- **Fund Manager:** Dashboard, Portfolio, Capital Activity (Funds / Capital Calls / Reviews / Distributions), Fund Accounting & Reporting, Treasury, Investors, Compliance, Data Room, Tasks — mapped to Bunch's real product lines (Transfer Agency, Fund Accounting & Reporting, Compliance, per `bunch-products-overview-context.md` §5), not an invented generic SaaS nav.
- **Bunch Admin:** Dashboard, Review Queue, Escalations, All Funds/Clients, Compliance Oversight, Account Management — explicitly cross-fund; no fund switcher, since this persona spans every client.
- **Investor:** Dashboard, My Portfolio, Capital Calls, Distributions, Documents, Requests, Payments — simplest of the three, scoped entirely to this LP's own capital.

### The actionable right panel
Kept and formalized as the core interaction pattern from v1's split-pane instinct, now explicitly **actionable, not just informative**: selecting a row doesn't just show detail, it surfaces the specific action available on it — resolve a flag, approve/revise, reply to a chat, drill into a full breakdown. Used on the Dashboard, Reviews, and Review Queue.

### Shared component system
- **`Notice Document`** — one template, used at every scale (small thumbnail in a grid, zoomed popup, full page for the LP recipient) via uniform scaling of the same component, not three separately maintained designs. Opens with a short letter paragraph addressed to the specific investor, then the fund's branding, the auto-calculated figures (commitment %, recallable distributions, working capital, due date), and wire instructions. Carries the *fund's* branding with a small "Powered by bunch" mark — this is the fund's document to its own LP, not bunch's.
- **`Chat Drawer` ("Request Bunch Support")** — a button in the top action row of any call-level screen; opens a threaded panel (message history, input, "Save & Close") without navigating away. Same component on Reviews, the New Call flow, and surfaced in reverse (read + reply) on Bunch's Review Queue.
- **List/Timeline toggle** — one control, reused verbatim on the Fund Manager Dashboard and the Investor's Capital Calls screen, each scoped to that persona's own data.
- **Status pills** — pill-style, color-coded, covering the full state vocabulary from Section 3 plus review-specific states (Pending review, Changes requested, Approved) and payment states (Paid, Sent, Overdue, Held).

### Typography and color
Serif display type (Source Serif 4) for page-level H1s, sans-serif (Inter) for everything else — same "this is a serious financial system of record" signal as v1's Carta borrow. Indigo (`#3554EC`) as the single primary action color across every persona and screen, extended via variables so it — and every status color — means the same thing everywhere.

### Layout and spacing
Consistent vertical rhythm (~32px between major sections, ~16px between related fields), dense financial-table conventions (hairline dividers, right-aligned numerics, small uppercase column headers) for anything LP-level. Every screen with a calculated value keeps its "why" or "download" affordance no more than one click away.

### Accessibility and clarity baseline
Status is never color-only — every pill carries a text label. Numeric precision is consistent (2 decimals), rounding remainders shown as their own line. Every binding action (Send, Approve, Reconcile, Confirm & Activate) requires an explicit confirmation step distinct from the action that produced the data being confirmed.

---

## 11. Testing & Validation Rules Summary

1. **No screen may show a fund-level aggregate without the underlying per-LP detail being reachable in at most one click.**
2. **No calculated number may exist in the UI without a traceable source** — every dollar figure either links to a "why" panel citing the specific LPA/side-letter clause, or is explicitly marked as a manual override with a rationale.
3. **No workflow step may silently block on incomplete or exceptional data for LPs not affected by that exception** — the KYC and default failure paths (Sections 7–8) are the reference test cases.
4. **Fund-level and investor-level views of the same data must always reconcile** — a call's aggregate total on Reviews' Fund-level toggle must always equal the sum of its expanded Investor-level rows; the same rule applies to the Dashboard's flattened table vs. any future rolled-up view.
5. **A parked (chat-pending) call must never disappear from any queue it belongs to** — it should be visibly flagged as awaiting reply everywhere it's listed, not filtered out.

---

## 12. What I'd Tackle First in a Real V1

The internal-review-to-Bunch-review handoff (Section 9, deferred item 2) is now the most under-specified surface — not because either review workspace is weak (both are fully designed), but because the *relationship* between them is asserted, not validated: does a call need internal sign-off before it can even reach Bunch's queue, or do both run in parallel with Bunch as the final gate regardless? Getting this sequencing wrong would either create a false sense of security (fund manager thinks Tom's approval means it's handled) or duplicate work neither team asked for. This is exactly the kind of question that needs to be answered inside bunch, not assumed in a design file — and it's the one piece where I'd want a real conversation before shipping anything, since a two-tier review system that ships assuming (b) parallel-with-Bunch-as-final-gate but is expected to work (a) internal-must-clear-first would produce SLA confusion on day one.
