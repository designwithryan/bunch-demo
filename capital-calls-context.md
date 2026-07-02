# Capital Calls — Domain Deep Dive & Bunch's Current Approach

> **Document status:** Living reference, v1.3 — v1.0 built mid-2026, pre-hire; v1.1 added full-form expansions for all abbreviations throughout (LP, GP, LPA, IRR, BaFin, FCA, CSSF, AFM, KAGB, AIFMD, ELTIF, VC, PE) and a new open question on jurisdictional notice-delivery format requirements; v1.2 adds Section 3 on scheduled vs. investment-driven capital calls and renumbers all subsequent sections accordingly; v1.3 adds Part II (Sections 15–24): private markets lifecycle, full persona/role/dependency map, user flows by persona, review and approval workflow, calculation logic, manual override and incomplete data handling, payment tracking and reconciliation, full state machine with default-handling logic, risk register, and assumptions/open questions.
>
> *This file builds on the brief provided for the take-home/interview challenge and adds research from bunch's own published material plus general private-markets industry sources. Treat the "Current Reality at Bunch" section as the authoritative problem statement; everything else is supporting context to help reason about a redesign.*

## 1. What Is a Capital Call

In private equity and venture capital, investors (Limited Partners, or LPs) commit a fixed amount of capital to a fund but do not transfer it all upfront. Capital is instead drawn down over time through **capital calls** (also called *drawdowns*): a formal, legally binding request from the General Partner (GP) / fund manager asking each LP (Limited Partner) to transfer a portion of their committed capital, governed by the Limited Partnership Agreement (LPA).

Capital calls exist so that LPs (Limited Partners)' money isn't sitting idle in a fund's bank account earning nothing (which would drag down the fund's IRR (Internal Rate of Return)) — capital is called only when there's an actual use for it.

## 2. Why Capital Calls Are Triggered

- A new investment is being made (the most common trigger).
- Management fees need to be covered (typically called on a recurring schedule — often quarterly — as a fixed percentage of commitment, usually 1–3% per year, rather than pro-rata to invested amounts).
- Fund expenses arise (legal, administrative, formation costs — often subject to a cap defined in the LPA (Limited Partnership Agreement)).
- Reserves are being built for follow-on investments or to support existing portfolio companies (GPs (General Partners) typically model reserve requirements at roughly 10–30% of initial investment amounts).
- Regulatory or liquidity buffer requirements must be maintained (jurisdiction-dependent — see Section 8).
- A new LP (Limited Partner) is joining at a subsequent closing and must be "equalised" to the position of existing LPs (Limited Partners) (see Section 5).


## 3. The Two Regimes: Scheduled vs. Investment-Driven Capital Calls

Not all capital calls are operationally the same. They fall into two distinct regimes with fundamentally different workflow implications — and conflating them is a common source of design confusion.

**Scheduled / routine calls** happen on a fixed cadence defined in the LPA (Limited Partnership Agreement) at fund setup. The most common example is the management fee — called quarterly, at a fixed percentage of each LP (Limited Partner)'s total commitment. The timing is known months in advance, the calculation is formulaic, and the amount per LP (Limited Partner) changes only at a pre-defined milestone (e.g., a fee step-down once the investment period ends). Because the inputs are stable and predictable, these calls can in principle run with minimal human intervention once configured: the system generates the notice, sends it, tracks payment, and reconciles — surfacing only genuine exceptions (a payment that hasn't arrived, an LP (Limited Partner) whose bank details have changed, a fee step-down that just triggered). Other examples include periodic expense drawdowns and liquidity buffer top-ups where the LPA (Limited Partnership Agreement) defines a fixed reserve requirement and replenishment cadence.

**Investment-driven / unplanned calls** are triggered by an external event — almost always a specific investment being made or about to close. The GP (General Partner) determines the amount and timing on a deal-by-deal basis, often with some urgency since investment timelines can be tight. The calculation is more complex: it must account for pro-rata splits across all current LPs (Limited Partners), any side-letter exemptions, potential equalisation if a new LP (Limited Partner) recently joined, and any currency adjustments. This is the regime that requires the full eight-step workflow described in Section 4: GP (General Partner) initiates → system calculates → ops reviews → notices go out → payments tracked → reconciled.

**Why this distinction matters for system design**

The two regimes warrant fundamentally different UX treatment in a well-designed platform:

- **Scheduled calls** should be configured once at fund setup (cadence, fee rate, LP (Limited Partner) roster, payment details) and then largely run automatically — the GP (General Partner)-facing experience is monitoring, not triggering. The system should alert only on exceptions.
- **Investment-driven calls** require GP (General Partner) initiation each time, with a full review-and-approval workflow before notices go out, because the inputs — amount, purpose, timing — change with every deal.

A fund manager dashboard should surface both regimes distinctly: scheduled calls on a predictable timeline (low-friction, configuration-driven) and active investment-driven calls by lifecycle stage (draft → under review → sent → partially paid → reconciled). Treating both as the same workflow creates unnecessary friction for routine calls and insufficient safeguards for complex ones.

**In practice: frequency vs. complexity**

Scheduled calls are far more frequent — a 10-year fund with quarterly management fee calls runs roughly 40 scheduled calls over its life, versus perhaps 15–25 investment-driven calls concentrated in the first 3–5 years (the investment period). Investment-driven calls are where the operational complexity and risk live, which is why most public discussion — including bunch's own content and the design challenge brief — focuses on them. But the routine call volume is real and shapes the overall system load and LP (Limited Partner) experience across a fund's full lifecycle.

## 4. The Capital Call Process, End to End

1. **Determine the total amount required** for the call.
2. **Allocate pro-rata across investors**, based on commitment size, capital already drawn, and ownership percentage.
3. **Apply adjustments** for edge cases: late joiners, defaulting investors, equalisation, currency considerations, side-letter-specific terms (fee discounts, excuse rights, co-investment rights, etc.).
4. **Generate capital call notices** — investor-specific documents stating the amount due, purpose, payment instructions, and deadline.
5. **Internal review and approval** — typically by the fund's operations team or fund administrator before notices go out.
6. **Send notices to investors.**
7. **Track payments** as they come in against the expected amounts and deadlines.
8. **Reconcile received funds** against the call and update capital accounts.

This is a recurring cycle, not a one-off — a fund will run this process dozens of times across its lifecycle (most calls cluster in the investment period, roughly the first 3–5 years of a 7–10 year fund life).

## 5. The Line Items Inside a Single Capital Call

Drawing on bunch's own breakdown of how VC (Venture Capital) capital calls actually decompose:

- **Working Capital** — money used for actual investments. Called pro-rata to commitment.
- **Expenses** — legal/administrative fund costs. Called pro-rata, but often capped at the fund level.
- **Management Fee** — called on a fixed cadence (commonly quarterly), calculated as a fixed % of each LP (Limited Partner)'s commitment per year (can vary LP (Limited Partner) to LP (Limited Partner), often 1–3%). Unlike Working Capital, this is *not* called pro-rata to invested amount — it's a function of commitment size, independent of how much has actually been drawn for investments.
- **Equalisation Payments** — triggered whenever a new LP (Limited Partner) joins in a subsequent closing (a "sub close"). Every previous capital call is recalculated for every LP (Limited Partner) based on the new, updated ownership percentages. The difference is paid back to "old" LPs (Limited Partners) and collected from "new" LPs (Limited Partners), effectively rebalancing everyone's pro-rata share of every prior call as if all LPs (Limited Partners) had joined on day one.
- **Equalisation Interest** — new LPs (Limited Partners) also typically owe interest to existing LPs (Limited Partners) on the equalised amount, compensating early LPs for having had their capital invested longer (often calculated daily, using a rate set in the LPA (Limited Partnership Agreement) — frequently "market rate + basis points" or a flat hurdle like 8%).
- **Management Fee Catch-up** — new LPs (Limited Partners) pay the management fee they would have owed had they joined at the initial closing. Unlike equalisation payments, this goes to the fund itself, not to existing LPs (Limited Partners).
- **Management Fee Catch-up Interest** — calculated the same way as equalisation interest, though not always present in every LPA (Limited Partnership Agreement).

## 6. The Legal Foundation: LPA (Limited Partnership Agreement) and Side Letters

Every capital call calculation is ultimately governed by the fund's **Limited Partnership Agreement (LPA)** and any **side letters** (bilateral agreements that modify standard terms for specific LPs (Limited Partners) — e.g., fee discounts, most-favored-nation clauses, excuse rights for certain investment types, co-investment rights). Because side letters proliferate as a fund signs more LPs, the "rules" governing a capital call are not one document but a fragmented, evolving set of legal documents that must be cross-referenced for every single call.

This creates real operational risk: fund administrators must continually re-derive the correct calculation logic from legal text rather than working off a single structured rule set, which invites oversight and inconsistency, especially as fund size and LP (Limited Partner) count grow.

## 7. Defaulting LPs and Late Joiners

**Defaulting LPs (Limited Partners).** An LP (Limited Partner) default occurs when an LP (Limited Partner) fails to fund a capital call. LPAs (Limited Partnership Agreements) typically specify:
- A **cure period** during which the LP (Limited Partner) can still pay, often with penalty/default interest accruing.
- If default continues past the cure period, the GP (General Partner) typically gains broader remedies: selling the defaulting LP (Limited Partner)'s interest to other LPs (Limited Partners) or third parties (often at a discount to fair value), reallocating the capital call to other LPs (Limited Partners) or third parties who then receive a preferred interest in the relevant investment, or compulsory forfeiture of the LP (Limited Partner)'s existing interest (sometimes combined with cancellation of their remaining commitment).
- Defaults are historically rare in institutional private equity (reputational consequences are severe), but as more — and more varied — LPs (Limited Partners) enter the market via vehicles like ELTIFs (European Long-Term Investment Funds), default-handling logic becomes more operationally relevant, not less.

**Late joiners / subsequent closings.** Handled via the equalisation mechanism described in Section 5. The complexity compounds because each new subsequent closing requires recalculating *every prior call* for *every existing LP (Limited Partner)*, not just computing a number for the new LP (Limited Partner).

## 8. Notice Periods, Standards, and Jurisdictional Variation

- **Standard notice periods** range roughly **10–30 business days** between notice and the funds being due, as set out in the LPA (Limited Partnership Agreement). LPs (Limited Partners) sometimes negotiate longer notice (45–60 days) for unusually large calls.
- The **ILPA (Institutional Limited Partners Association) Capital Call & Distribution Notice Template** is a widely referenced industry best-practice format, standardizing line items like working capital, expenses, subsequent-close interest, placement agent fees, and distribution categories (return of capital, carry, clawback) so LPs across different funds can compare notices consistently.
- **Jurisdictional complexity in Europe**: a fund operating across Germany, the UK, Luxembourg, and the Netherlands cannot apply one uniform process — each jurisdiction layers its own regulatory and accounting expectations on top of the LPA (Limited Partnership Agreement) mechanics (BaFin (German Federal Financial Supervisory Authority)/KAGB (Kapitalanlagegesetzbuch — German Capital Investment Code) in Germany, FCA (Financial Conduct Authority) in the UK, CSSF (Commission de Surveillance du Secteur Financier — Luxembourg Financial Regulator) in Luxembourg, AFM (Autoriteit Financiële Markten — Dutch Financial Markets Authority) in the Netherlands). "Liquidity buffer" requirements specifically tend to be jurisdiction- or fund-structure-specific rather than a single pan-European rule — under AIFMD II (Alternative Investment Fund Managers Directive), the harmonized liquidity management tooling requirements are primarily aimed at *open-ended* funds (redemption-driven liquidity risk), so closed-ended VC (Venture Capital)/PE (Private Equity) funds' "liquidity buffer" practices are more likely to be a function of local regulatory guidance, the LPA (Limited Partnership Agreement) itself, or prudent treasury management (maintaining a working-capital reserve to cover near-term fees/expenses without an emergency call) rather than a single statutory mandate. This is a nuance worth probing rather than assuming a single EU-wide rule exists.
- **ELTIF 2.0** (European Long-Term Investment Fund Regulation) is structurally relevant here too: as funds raise from larger pools of smaller, sometimes retail-adjacent LPs (Limited Partners), the *number* of capital call notices per call event grows substantially even as the average amount per LP (Limited Partner) shrinks — multiplying the operational and communication burden without necessarily multiplying total capital raised.

## 9. Why Capital Calls Are Operationally Hard

- **Precise, compounding calculations.** Equalisation interest calculated daily, management fee step-downs, and per-LP (Limited Partner) exemptions mean every new closing requires recalculating every previous call for every investor. Bunch's own description: in extreme cases this becomes a dataset on the order of 100 rows (LPs — Limited Partners) by 100 columns (one set of columns per prior call) for a fund with 10 capital calls and 100 LPs (Limited Partners) — and that's before side-letter exceptions are layered in.
- **Legal interpretation burden.** Because the rules live in unstructured legal documents (LPA (Limited Partnership Agreement) + side letters) rather than a structured rule engine, administrators must re-derive correct logic by hand for every call, which is both slow and error-prone.
- **Downstream data dependency.** Capital call data feeds directly into capital account balances and future capital call calculations. If historical call data is stored inconsistently (e.g., differently structured spreadsheets per call), reconciliation and future reporting become exponentially harder over the fund's life.
- **LP relationship management.** Capital calls are one of the most LP (Limited Partner)-visible touchpoints in the entire GP (General Partner)-LP (Limited Partner) relationship. Industry best practice (echoed by bunch) is to keep calls "LP (Limited Partner)-friendly" — e.g., avoiding very small calls (sub-$1,000) and minor capital-contribution returns that create unnecessary administrative noise for LPs (Limited Partners), since a clunky or error-prone call process directly damages trust.
- **Security/operational risk.** Capital call notices traditionally travel as email attachments (PDFs), which are a known phishing vector — a spoofed notice with altered wire instructions can misdirect real investor funds, a risk multiple platforms (including bunch) cite explicitly as a reason to keep the entire notice-and-payment loop inside a closed, authenticated system rather than email. Beyond the phishing risk, the *format* of notice delivery may also carry legal and regulatory weight: whether email constitutes valid legal delivery of a capital call notice depends on what the LPA (Limited Partnership Agreement) specifies and, in some cases, on the rules of the jurisdiction where the LP (Limited Partner) is based. In most modern fund structures, the LPA (Limited Partnership Agreement) explicitly permits email or in-platform notice — and bunch's in-platform delivery model is specifically designed to satisfy this. However, older or more conservative LPAs (Limited Partnership Agreements) may still require registered mail or courier for notices above a certain size, or for LPs (Limited Partners) in specific jurisdictions. Whether all four of bunch's operating jurisdictions (Germany, UK, Luxembourg, Netherlands) treat email/in-platform delivery as legally sufficient under all fund structures is not confirmed from public sources — see Section 14.

## 10. Current Reality at Bunch (Problem Statement)

As described in the original brief:

> Today, our capital call workflow is partially automated, partially manual, reviewed by operations before being finalised, not always fully transparent to fund managers, and sometimes fragmented across tools. Some calculations are verified manually before final notices are generated. In certain jurisdictions, additional rules (e.g., liquidity buffers) may apply. Data may occasionally be incomplete or require overrides.

Read against everything above, this maps to specific, nameable failure points worth interrogating in a redesign:
- **"Partially automated, partially manual"** → likely the calculation engine doesn't fully encode every LPA (Limited Partnership Agreement)/side-letter edge case (equalisation, fee step-downs, exemptions), so humans still hand-verify the output — exactly the "Excel re-derivation" problem the industry has historically had.
- **"Reviewed by operations before finalised"** → a manual approval gate exists, which is *appropriate* for a financially sensitive process (you don't want to remove human review entirely) but raises the question of *why* review is needed: is it catching genuine calculation risk, or compensating for an engine that isn't trusted to be correct on its own?
- **"Not always fully transparent to fund managers"** → suggests the GP (General Partner)/CFO persona doesn't have real-time visibility into where a call is in its lifecycle (calculated → reviewed → sent → paid → reconciled), which directly undercuts the "system of record" value proposition bunch markets externally.
- **"Sometimes fragmented across tools"** → an internal version of the same fragmentation problem bunch's marketing accuses *competitors* of having — worth probing what's actually fragmented (calculation tooling vs. notice generation vs. payment tracking vs. accounting) since the answer changes what "fixing" it means.
- **"Additional rules (e.g., liquidity buffers) may apply in certain jurisdictions"** → confirms that jurisdiction-specific logic is currently handled as exceptions/overlays rather than being natively modeled — a scalability risk as bunch expands into new countries.
- **"Data may occasionally be incomplete or require overrides"** → real-world fintech constraint: LPA (Limited Partnership Agreement) terms, side letters, or historical data migrated from a previous administrator won't always be clean, so any redesign needs a sane way to handle missing/uncertain data without blocking the entire call (escalation paths, default assumptions, explicit flagging) rather than assuming perfect input data.

## 11. How Bunch Already Approaches This (Published, Pre-Existing Capabilities)

Worth knowing what bunch has *already shipped* so a redesign proposal builds on top of it rather than reinventing it:

- **Capital Call Assistant** — a GP (General Partner)-facing tool where the fund manager specifies the amount to call and its purpose; bunch automatically generates the underlying calculations (against LPA (Limited Partnership Agreement)/side-letter data), produces a reviewable, downloadable Excel export of those calculations, and — once confirmed — auto-generates investor-specific notices.
- **Notice distribution and payment tracking** — notices are distributed as in-platform tasks (not email PDFs), with automatic tracking of incoming payments and a real-time payment-status view.
- **Bank integrations (Treasury/Transfer Agency)** — bulk payment triggering and automatic reconciliation across LPs (Limited Partners), intended to remove manual bank-portal work.
- **Audit trail** — every call, payment, and confirmation is logged and traceable, explicitly positioned as meeting BaFin (German Federal Financial Supervisory Authority)/FCA (Financial Conduct Authority)/CSSF (Luxembourg Financial Regulator) expectations.
- **Data backfill** — when migrating a fund onto bunch, historical transaction history is backfilled and capital calls are adjusted to reflect actual LPA terms without requiring manual correction.

This means the "reimagine from a clean slate" exercise likely isn't about inventing automation from zero — it's about identifying *where the existing automation still breaks down* (the gap implied by "partially automated, partially manual" and "reviewed before finalised") and designing the missing layer: probably a more complete/trustworthy rules engine for LPA + side-letter logic, better handling of incomplete data, more transparency for the GP (General Partner) during the review window, and a cleaner model for jurisdiction-specific overlays.

## 12. Framing for a Redesign Exercise

Useful tensions to explicitly name in any proposed solution, since "realistic fintech constraints" was called out directly:
- **Accuracy and auditability are non-negotiable.** This is money movement with legal consequences — any automation has to be more *verifiably* correct, not just faster; removing the human review step entirely is unlikely to be the right answer, but the review step should be catching genuine exceptions, not re-deriving routine math.
- **Edge cases are the rule, not the exception**, once side letters, defaulting LPs (Limited Partners), multi-jurisdiction structures, and partial data are in play — a redesign that only works for the "clean" 80% case will recreate the existing problem.
- **Trust has to be earned incrementally** — GPs (General Partners — and bunch's own ops team) won't fully trust an opaque "black box" calculation engine on day one; transparency into *why* a number was calculated the way it was (traceable back to the specific LPA (Limited Partnership Agreement) clause or side-letter term) matters as much as the number being right.
- **Scale across jurisdictions without bespoke one-off logic per country** — the current state's jurisdiction-specific overlays are a scaling risk; a good redesign should treat jurisdictional rules as configurable data, not hardcoded exceptions.
- **Graceful degradation on bad data** — rather than blocking on incomplete LPA (Limited Partnership Agreement) data, the system should flag, escalate, or apply a documented default with an audit note, since perfect data at migration or onboarding is unrealistic.

## 13. Key Terms Glossary

- **LP (Limited Partner):** an investor who commits capital but has no role in investment decisions; liability limited to commitment.
- **GP (General Partner):** the entity managing the fund and making investment decisions.
- **LPA (Limited Partnership Agreement):** the governing legal contract for the fund.
- **Capital Commitment vs. Capital Contribution:** the pledge (commitment) vs. the actual wired money pursuant to a call (contribution).
- **Drawdown:** synonym for capital call.
- **Pro-rata:** allocation in proportion to commitment size.
- **Side Letter:** a bilateral agreement modifying standard fund terms for a specific LP.
- **Equalisation:** the rebalancing mechanism used when new LPs join at a subsequent closing.
- **Catch-up (management fee):** the retroactive fee a late-joining LP owes for the period before they joined.
- **ILPA:** Institutional Limited Partners Association — publishes widely used capital call/distribution notice best-practice templates.
- **Default (LP default):** failure to fund a capital call by the deadline, triggering LPA-specified remedies.

## 14. Open Questions to Validate Once Inside Bunch

This is where public research runs out and only being inside the building answers the question. Worth treating as both interview prompts (asking these shows you understand the problem at the right level) and a real onboarding checklist:

- A concrete, specific, anonymized example of where the current capital call workflow actually broke down recently — not the abstract version in the brief.
- How much operations time/headcount is currently consumed by manual verification per capital call cycle, and where exactly in the pipeline that time goes.
- Whether there's an existing structured rules engine for LPA (Limited Partnership Agreement)/side-letter logic at all, or whether the externally marketed "Capital Call Assistant" still leans on substantial manual spreadsheet work behind the scenes.
- Which specific jurisdictions currently have bespoke liquidity-buffer or similar overlay rules in production, and whether those are implemented as configurable data or as hardcoded one-off exceptions.
- What "not always fully transparent to fund managers" means operationally — a UI/visibility gap, a data-latency gap, or an organizational gap (ops not proactively sharing status)?
- The exact expected format of the design-challenge deliverable (written memo, slides, live whiteboard session, working prototype) and who will be in the room evaluating it.
- Whether defaulting-LP (Limited Partner) handling and equalisation calculations are already fully automated internally, or still substantially manual despite the external product framing.
- **Notice delivery format by jurisdiction:** Does each fund's LPA (Limited Partnership Agreement) explicitly permit email or in-platform delivery as legally valid notice, or do any funds require physical delivery (registered mail, courier) for capital call notices — and does bunch validate this per fund at onboarding? Specifically: do any of the four operating jurisdictions (Germany under KAGB/BaFin, UK under FCA, Luxembourg under CSSF, Netherlands under AFM) impose a statutory requirement for physical delivery that could override what the LPA (Limited Partnership Agreement) specifies, or does the LPA (Limited Partnership Agreement) always govern delivery format? Related: in jurisdictions where physical notice is required, does bunch handle this operationally, or is it the GP (General Partner)'s responsibility?

---

## Part II — Design Challenge Reference

*Sections 15–24 were added to support the Capital Call Creation & Execution design challenge. They are more operational and flow-oriented than the domain primer in Part I, and are intended to be used alongside design-challenge-capital-calls.md.*

---

## 15. Private Markets Lifecycle — Where Capital Calls Fit

```
STAGE 1 — FUND FORMATION & LEGAL SETUP (Months −12 to 0 before First Close)
├── Legal fund structure selected (LP, SICAV, SCS, SCSp, etc.)
├── LPA (Limited Partnership Agreement) drafted, negotiated, and signed
├── Side letters negotiated with anchor LPs (Limited Partners)
├── Regulatory registration filed: BaFin (Germany), FCA (UK), CSSF (Luxembourg), AFM (Netherlands)
├── Fund bank account opened
├── Management fee schedule and cadence defined in LPA (Limited Partnership Agreement)
└── Capital commitment target (fund size / hard cap) set

STAGE 2 — FUNDRAISING & LP ONBOARDING (Months 0–24, typically)
├── Marketing period: pitching to prospective LPs (Limited Partners)
├── LP (Limited Partner) due diligence on the fund and GP (General Partner)
├── Commitment letters signed (pledge of capital — not yet transferred)
├── KYC (Know Your Customer) / AML (Anti-Money Laundering) screening per LP (Limited Partner)
├── Subscription documents executed
├── First Close: initial group of LPs (Limited Partners) locked in
│   └── ← MANAGEMENT FEE CALLS BEGIN immediately after First Close
├── Subsequent Closings: new LPs (Limited Partners) join the fund after First Close
│   └── ← EQUALISATION CAPITAL CALLS TRIGGERED for each new LP (Limited Partner) joining
└── Fundraising period closes (hard cap reached or deadline passed)

STAGE 3 — INVESTMENT PERIOD (Typically Years 1–5)
├── Deal sourcing, due diligence, investment committee approval
├── GP (General Partner) makes investment decision
│   └── ← INVESTMENT-DRIVEN CAPITAL CALLS TRIGGERED HERE (primary call regime)
├── Capital deployed into portfolio company
├── Management fees continue on scheduled quarterly cadence
│   └── ← SCHEDULED FEE CALLS continue every quarter throughout
├── Portfolio company follow-on rounds identified
│   └── ← FOLLOW-ON CAPITAL CALLS TRIGGERED as each follow-on is approved
└── Reserve calls may be made to build capacity for anticipated follow-ons

STAGE 4 — PORTFOLIO MANAGEMENT & MONITORING (Years 2–8)
├── Ongoing portfolio company governance (board seats, reporting)
├── Quarterly NAV (Net Asset Value) calculations
├── LP (Limited Partner) reporting: quarterly letters, annual accounts
├── Management fees may step down once the investment period formally ends
│   └── ← SCHEDULED CALLS continue at reduced step-down rate
└── Exit planning for individual portfolio companies

STAGE 5 — HARVESTING / EXIT PERIOD (Years 5–10)
├── Portfolio company exits: IPO, M&A trade sale, secondary sale
│   └── ← DISTRIBUTIONS TRIGGERED (cash out to LPs — the reverse flow of capital calls)
├── Carried interest calculated and paid to GP (General Partner)
├── Clawback provisions assessed if GP (General Partner) received excess carry
└── Management fees cease or reduce to minimal wind-down rate

STAGE 6 — FUND WIND-DOWN (Years 8–12)
├── Final asset disposals and distributions
├── Carried interest finalized
├── Fund formally dissolved
└── LPA (Limited Partnership Agreement) obligations formally concluded
```

**Where capital calls sit in this map:**
Capital calls are active across Stages 2–4 but with different drivers at each stage. Stage 2 produces equalisation and early management fee calls. Stage 3 is the highest-volume period for investment-driven calls. Stage 4 continues scheduled fee calls (often at step-down rates) and occasional follow-on calls. No new capital calls are issued in Stages 5–6 under most fund structures — only distributions flow out.

**What must be in place before any capital call can be issued:**
Fund formation complete, LPA (Limited Partnership Agreement) signed and parsed into structured data, LP (Limited Partner) onboarding done (KYC/AML cleared, commitment confirmed, bank details on file), and the fund's bank account active and connected.

**What happens immediately after a capital call is reconciled:**
Capital account balances are updated per LP (Limited Partner); the fund's "called capital" total increases; NAV (Net Asset Value) and LP (Limited Partner) reporting are updated; and the updated "previously drawn capital" figures flow back into the calculation engine as inputs for the next call.

---

## 16. Personas, Roles, and Dependencies

### Primary Actors — directly interact with the capital call workflow

**1. Fund Manager / GP (General Partner)**
- Initiates all capital calls; defines purpose, amount, and timing; holds ultimate legal and fiduciary responsibility for the call's accuracy.
- In practice: may be a solo GP (General Partner) at a microfund or a Partner at an institutional firm. Often the one who presses "create" after an investment is signed.
- Depends on: LPA (Limited Partnership Agreement) and side-letter data being accurately structured in the system; LP (Limited Partner) records being current; ops reviewer being available.

**2. CFO / Head of Finance & Operations at the fund**
- The day-to-day power user of the capital call workflow. Often manages the process end to end — from initiating the call through to confirming reconciliation.
- In practice: may be a fractional CFO at smaller funds (per bunch's "Rise of the CFO 2.0" research). This persona cares most about NAV (Net Asset Value) turnaround, reducing manual errors, and having a single source of truth.
- Depends on: the calculation engine being trusted; the audit trail being clear enough to answer LP (Limited Partner) queries; real-time payment visibility.

**3. Bunch Operations Reviewer**
- Internal bunch team member (fund accountant or ops specialist) who validates the calculation, checks for errors or exceptions, and formally approves the call before notices go out.
- Acts as an embedded extension of the fund team — the last line of defence before money moves.
- Depends on: the calculation engine producing auditable, traceable output; clear flagging of incomplete data or manual overrides; an escalation path to legal counsel if an LPA (Limited Partnership Agreement) clause is ambiguous.

**4. LP (Limited Partner) / Investor**
- Receives the capital call notice, reviews it, and executes payment by the deadline. May also raise a dispute if the notice appears incorrect.
- Ranges from a single contact at a family office to a treasury team at an institutional investor with internal payment approval workflows of their own.
- Depends on: receiving the notice with sufficient lead time (10–30 business days per LPA (Limited Partnership Agreement)); the notice containing accurate wire instructions; being able to confirm receipt and payment status within the platform.

**5. LP's Finance / Treasury Contact**
- The operational counterpart at the LP (Limited Partner) organisation who actually processes the bank transfer. May be different from the LP's relationship contact with the fund.
- Depends on: correct wire instructions in the notice; their internal payment approval process having enough runway within the LPA (Limited Partnership Agreement) notice period.

### Supporting Actors — involved but not primary

**6. Compliance / AML Officer**
- Ensures each LP (Limited Partner) is KYC (Know Your Customer) / AML (Anti-Money Laundering)-cleared before a capital call notice is sent. Critically, this is **not a one-time onboarding check** — it is a recurring obligation. KYC (Know Your Customer) clearance expires and must be renewed periodically (typically every 1–3 years depending on the LP's (Limited Partner's) risk classification). Higher-risk profiles — family offices in certain jurisdictions, LPs (Limited Partners) with complex beneficial ownership structures — require more frequent re-verification than low-risk institutional investors. Re-verification is also triggered outside the scheduled cycle by: a change in the LP's (Limited Partner's) beneficial ownership structure, an adverse media hit, appearance on a sanctions list update, or a flag raised during a routine compliance audit.
- **Jurisdictional variation is significant:** The EU's Anti-Money Laundering Directives (currently 6AMLD) set the overarching framework, but each member state implements them differently. Germany (BaFin (German Federal Financial Supervisory Authority)) applies strict beneficial ownership transparency requirements; Luxembourg (CSSF (Commission de Surveillance du Secteur Financier)) has detailed circulars defining exactly what documentation is required and at what frequency; the Netherlands (AFM (Autoriteit Financiële Markten) / DNB) is particularly demanding on source-of-funds documentation; the UK (FCA (Financial Conduct Authority)), post-Brexit, follows its own Money Laundering Regulations (MLRs) which are diverging incrementally from the EU framework. A fund with LPs (Limited Partners) across these geographies must apply different renewal cadences and documentation standards per LP (Limited Partner) location.
- **Dependency on the capital call workflow:** If an LP's (Limited Partner's) KYC (Know Your Customer) status lapses or is flagged between calls, the notice for that LP (Limited Partner) must be held until clearance is renewed — the rest of the call proceeds for all other LPs (Limited Partners) (partial batch send). The system must track KYC (Know Your Customer) expiry dates per LP (Limited Partner) and surface approaching renewals proactively, so the Compliance Officer can act before the next call cycle begins rather than during it.

**7. Legal Counsel (internal or external)**
- Interprets LPA (Limited Partnership Agreement) / side-letter language when there is genuine ambiguity in the calculation logic. Brought in when a clause cannot be resolved by the reviewer alone.

**8. External Auditor**
- Read-only access to the complete audit trail of all capital calls, payments, overrides, and approvals. Validates that fund accounting is accurate and that every action is traceable.

**9. Third-Party Fund Administrator (if applicable)**
- In some fund structures, a separate administrator handles specific statutory tasks alongside bunch. The capital call workflow must produce data compatible with that administrator's systems.

### Technical Dependencies — systems, not people

**10. Banking / Payment Rails** — receives incoming LP (Limited Partner) payments; feeds reconciliation data back to the platform.

**11. LPA (Limited Partnership Agreement) / Side Letter Data Store** — source of truth for all calculation rules: fee rates, step-down triggers, side-letter discounts, equalisation methodology, notice periods. Must be structured (not a raw PDF) for the engine to use.

**12. Capital Account System / Fund Ledger** — updated after each reconciled call. The balance per LP (Limited Partner) feeds back into the next call's calculation as "previously drawn capital."

---

## 17. User Flows by Persona

### Flow 1 — Fund Manager: Create an Investment-Driven Capital Call

1. Log in → **Fund Dashboard** → select fund
2. Click **"New Capital Call"** → select type: **Investment-Driven**
3. **Step 1 — Call Details:** Enter total amount, purpose (e.g., "Investment in Portfolio Co. X — Series B"), proposed notice date, payment deadline
4. **Step 2 — Auto-Calculation:** System computes pro-rata allocation per LP (Limited Partner), applies side-letter adjustments, flags equalisation if a new LP (Limited Partner) joined recently
5. **Step 3 — Fund-Level Review:** Review total and line-item breakdown (working capital, management fee, expenses)
6. **Step 4 — LP (Limited Partner)-Level Breakdown:** Drill into per-LP (Limited Partner) table — LP (Limited Partner) name, commitment, % ownership, amount due, any side-letter override applied
7. **Step 5 — Incomplete Data Flags:** System surfaces any LP (Limited Partner) with missing bank details, lapsed KYC, or unresolved data gaps; Fund Manager resolves or adds a note for the ops reviewer
8. **Step 6 — Submit for Review:** Add optional notes → click **"Submit for Ops Review"** → status → **"Under Review"**
9. **Wait:** Notification received when reviewer approves or requests changes
10. **If changes requested:** View reviewer comments, correct, resubmit → loops back to Step 6
11. **Step 7 — Confirm Send:** Once approved, confirm **"Send Notices to Investors"** → notices dispatched in-platform
12. **Step 8 — Monitor Payments:** Real-time per-LP (Limited Partner) payment status (Pending / Paid / Overdue)
13. **Step 9 — Reconciliation:** System auto-reconciles as payments arrive; Fund Manager confirms final completion → call status → **"Reconciled"**

---

### Flow 2 — Fund Manager: Configure a Scheduled Management Fee Call

1. During fund setup → **Fund Settings > Capital Call Schedule**
2. Enter: annual fee rate (% of commitment), cadence (quarterly), start date (First Close date), step-down triggers (e.g., "rate reduces to X% after investment period ends")
3. System previews next 4 quarters of scheduled calls with projected per-LP (Limited Partner) amounts
4. Confirm and save → schedule is active
5. On each cadence date: system auto-generates the call → lightweight review (or auto-approval if configured) → notices sent → payments tracked → auto-reconciled when funds arrive
6. Fund Manager receives exception alerts only: missed payment, bank detail change, fee step-down approaching

---

### Flow 3 — Bunch Operations Reviewer: Review and Approve a Capital Call

1. Receive notification: "Capital call pending review — [Fund Name], €X total"
2. Open **Review Queue** → select the pending call
3. **Check 1 — Total Amount:** Does the amount match the investment memo / purpose stated?
4. **Check 2 — Calculation Logic:** Pro-rata applied correctly against current commitment schedule? Capital account up to date?
5. **Check 3 — Side-Letter Application:** For each LP (Limited Partner) with a side letter — is the right discount, excuse right, or MFN (most-favoured-nation) clause applied?
6. **Check 4 — Equalisation:** If a new LP (Limited Partner) joined since the last call, has equalisation been calculated across all prior calls?
7. **Check 5 — System Flags:** Review each incomplete data flag or override request; resolve or escalate as appropriate
8. **Check 6 — Jurisdiction Overlays:** Confirm any jurisdiction-specific rules are applied for LPs (Limited Partners) in relevant geographies
9. **If issues found:** Click **"Request Changes"** → add specific per-issue comments → Fund Manager notified; status → **"Changes Requested"**
10. **If approved:** Click **"Approve"** → sign with timestamp → status → **"Approved"** → system generates investor-specific notices

---

### Flow 4 — LP (Limited Partner): Receive and Respond to a Capital Call Notice

1. Receive in-platform notification (+ optional email alert): "Capital call notice — [Fund Name], €X due by [Date]"
2. Log in to investor portal → open notice
3. Review: amount due, payment deadline, call purpose, wire instructions (fund bank account)
4. Download PDF copy of notice for internal records if needed
5. Confirm digital receipt (logged in audit trail)
6. Execute bank transfer to fund bank account using the stated wire details
7. Payment arrives at fund bank → system detects and matches against expected amount
8. LP (Limited Partner) status → **"Paid"** → confirmation sent in-platform and by email

---

### Flow 5 — LP (Limited Partner): Raise a Dispute on a Notice

1. Review notice → identify discrepancy (wrong amount, incorrect wire instructions, etc.)
2. Click **"Flag Issue"** in the investor portal → describe the issue
3. Fund Manager and ops reviewer alerted immediately
4. Notice recalled for that LP (Limited Partner) (status → **"Recalled"**) pending investigation
5. Fund Manager / reviewer investigates, corrects, resubmits notice through standard approval flow
6. Corrected notice sent to LP (Limited Partner) → process restarts from Flow 4, Step 4

---

## 18. Review and Approval Workflow in Detail

### What the reviewer is actually checking

The ops review gate is not a rubber stamp. It exists because the calculation engine cannot fully encode every LPA (Limited Partnership Agreement) edge case, particularly for funds with multiple side letters or recent subsequent closings. The reviewer's job is to validate:

1. **Total amount:** Does it match the stated purpose? For investment-driven calls, is there an investment committee memo that confirms the deal size?
2. **Allocation logic:** Is pro-rata applied against current commitments (not stale figures)? Has the capital account been updated after the most recent reconciliation?
3. **Side-letter application:** For each LP (Limited Partner) with a side letter — is the correct adjustment applied (fee discount, excuse right for this investment type, MFN clause triggered by a better term given to another LP (Limited Partner))?
4. **Equalisation:** If a new LP (Limited Partner) joined since the last call, has equalisation been calculated across all prior calls, including the current one?
5. **Incomplete data flags:** For any LP (Limited Partner) flagged with missing or uncertain data — is it safe to proceed with an assumption, or must it be resolved first?
6. **Jurisdiction overlays:** Are jurisdiction-specific rules applied for LPs (Limited Partners) in each operating geography?
7. **Audit completeness:** Is every LP (Limited Partner) amount traceable to a specific LPA (Limited Partnership Agreement) clause or side-letter term in the calculation log?
8. **KYC (Know Your Customer) / AML (Anti-Money Laundering) status:** For every LP (Limited Partner) in the call, is their KYC (Know Your Customer) clearance current and not approaching expiry within the notice period? If any LP's (Limited Partner's) status has lapsed, is flagged, or expires before the payment deadline, their notice must be held and the Compliance Officer escalated — the call proceeds for all other LPs (Limited Partners) as a partial batch send.

### Approval states and transitions

| Transition | Trigger | What happens |
|---|---|---|
| Draft → Under Review | Fund Manager submits | Reviewer assigned; review SLA clock starts |
| Under Review → Changes Requested | Reviewer finds issues | Specific comments attached; Fund Manager notified; SLA pauses |
| Changes Requested → Under Review | Fund Manager corrects and resubmits | Reviewer re-reviews (full or targeted) |
| Under Review → Escalated | Ambiguous LPA clause or KYC flag | Escalated to Legal or Compliance; status holds; LP (Limited Partner) may be notified of delay |
| Under Review → Approved | Reviewer signs off | Notices auto-generated; timestamp and reviewer identity logged |
| Approved → Notices Sent | Fund Manager confirms (or auto-sends) | LP (Limited Partner) notifications dispatched; payment deadline clock starts |

### Escalation paths

- **Ambiguous LPA (Limited Partnership Agreement) clause:** Reviewer escalates to Legal Counsel; call holds at "Under Review — Escalated"; notice deadline may need to be extended with LP (Limited Partner) communication
- **KYC (Know Your Customer) / AML (Anti-Money Laundering) flag or expiry on an LP (Limited Partner):** Escalated to Compliance Officer. Important: this can happen even when the LP's (Limited Partner's) initial onboarding KYC was clean — clearance expires on a periodic cycle (typically 1–3 years depending on risk classification and jurisdiction) and is also re-triggered by events such as a beneficial ownership change or sanctions list match. The notice for the flagged LP (Limited Partner) is held; all other LP (Limited Partner) notices proceed as a partial batch send. The call status reflects the hold: **"Approved — Partial Hold (KYC)"**. Once the Compliance Officer clears the LP (Limited Partner), the held notice is dispatched separately and the call continues normally for that LP (Limited Partner).
- **Manual override request:** Reviewer approves or rejects; if approved, override is logged with rationale and approver identity
- **Multi-reviewer requirement:** Some funds require two approvals (four-eyes principle); system routes to second reviewer after first approves

---

## 19. Calculation Logic — What the Engine Must Cover

### Core pro-rata allocation (every capital call)

```
LP Amount Due = (LP Commitment / Total Fund Commitments) × Total Call Amount
```
Adjusted for: previously drawn capital per LP (Limited Partner); side-letter fee discounts; excuse rights (LP (Limited Partner) excluded from a specific investment — their share redistributed to other LPs (Limited Partners)).

### Management fee calculation (scheduled calls)

```
Quarterly Fee per LP = (LP Commitment × Annual Fee Rate) / 4
```
Fee rate set per LP (Limited Partner) class in the LPA (Limited Partnership Agreement); may vary LP (Limited Partner) to LP (Limited Partner) via side letters. Step-down rate applies once the investment period formally ends (rate and trigger defined in LPA (Limited Partnership Agreement)).

### Equalisation — when a new LP (Limited Partner) joins at a subsequent closing

For each prior call *i*:
```
New LP Equalisation Amount_i = 
  (New LP Commitment / Updated Total Commitments) × Prior Call Amount_i
```
Summed across all prior calls. Paid by the new LP (Limited Partner) to "catch up" existing LPs (Limited Partners), who simultaneously receive a proportional return on their prior contributions since the new LP's (Limited Partner's) entry dilutes their ownership percentage retroactively.

### Equalisation interest

```
Equalisation Interest = Equalisation Amount × (LPA Rate / 365) × Days Since Prior Call
```
Calculated daily from each prior call date to the subsequent closing date. Paid by the new LP (Limited Partner) to existing LPs (Limited Partners) directly — not to the fund.

### Management fee catch-up (new LP joining at a subsequent closing)

```
Catch-up Amount = Sum of (New LP's pro-rata management fee for each prior period)
```
Paid to the fund (not to existing LPs (Limited Partners)). May also carry catch-up interest per LPA (Limited Partnership Agreement).

### Rounding and de minimis rules

LPAs (Limited Partnership Agreements) typically define: rounding precision (usually to 2 decimal places, with any rounding difference absorbed by the largest LP (Limited Partner) or the GP (General Partner)); and a de minimis threshold below which a call is not issued to a specific LP (Limited Partner) — amounts below the threshold are rolled into the next call rather than generating a separate tiny notice.

---

## 20. Manual Overrides and Incomplete Data — How to Handle It

### What constitutes "incomplete" data

The system should flag an LP (Limited Partner) record as incomplete and surface it in the review screen if any of the following are missing or uncertain:

- Bank account details (IBAN, SWIFT/BIC) not on file or not verified
- Commitment amount not yet confirmed in the system (letter signed but not processed)
- KYC (Know Your Customer) / AML (Anti-Money Laundering) status lapsed or pending renewal
- Side-letter terms uploaded but not yet parsed into structured rules
- LPA (Limited Partnership Agreement) clause governing a specific calculation is present but ambiguous
- LP (Limited Partner) currency differs from the fund's base currency with no FX instruction on file

### Handling incomplete data without blocking the whole call

The system should not block the entire capital call because one LP (Limited Partner) record is incomplete. Instead:

1. **Flag, don't block:** Surface the incomplete LP (Limited Partner) clearly in the review screen with a specific description of what is missing
2. **Partial hold:** Generate and send notices for all fully complete LPs (Limited Partners); hold the incomplete LP's (Limited Partner's) notice pending resolution
3. **Default assumption pathway:** If the missing data can be reasonably assumed (e.g., known approximate bank reference, temporary management fee estimate), allow the reviewer to proceed with a documented assumption — logged with approver identity, rationale, and the original vs. assumed value
4. **Escalation timer:** If an incomplete record is not resolved within a defined window after the main batch is sent, trigger an escalation alert to the ops reviewer and Fund Manager
5. **Resolution and send:** Once resolved, the held LP's (Limited Partner's) notice is sent separately; the call remains open until that LP (Limited Partner) also reconciles

### Manual override mechanics

When any system-calculated value is overridden by a Fund Manager or reviewer:
1. Override field requires a written rationale (mandatory — cannot be blank)
2. Audit log records: who made the override, timestamp, the original calculated value, the override value, and the rationale
3. Override is visually distinct in the LP (Limited Partner) calculation table — flagged clearly (e.g., highlighted row, "Manual Override" label)
4. Override must be explicitly reviewed and approved by the ops reviewer — it does not bypass the approval gate
5. The override and its rationale are permanently attached to the call record and cannot be deleted or obscured after reconciliation

---

## 21. Payment Tracking and Reconciliation

### Payment states per LP (Limited Partner)

| State | Meaning |
|---|---|
| **Pending** | Notice sent; payment deadline not yet passed |
| **Paid** | Full payment received and matched |
| **Partially Paid** | Payment received below expected amount — shortfall outstanding |
| **Overdue** | Deadline passed; no payment received |
| **Overdue — Grace Period** | Within LPA (Limited Partnership Agreement)-defined cure period; default interest accruing |
| **In Default** | Cure period passed without payment; GP (General Partner) remedies applicable |
| **Disputed** | LP (Limited Partner) has raised a formal dispute on the notice |
| **Recalled** | Notice recalled pending correction; payment on hold |

### Reconciliation flow

1. **Expected amount set** at the moment notices are sent (from the approved calculation)
2. **Payment received** at fund bank account
3. **System matching:** Payment matched against expected LP (Limited Partner) amount using amount, wire reference, and originating bank details
4. **Matched → Paid:** LP (Limited Partner) status updates automatically; confirmation sent to LP (Limited Partner) in-platform and by email
5. **Unmatched payment:** Flagged for manual review — may be partial payment, wrong reference, or unexpected originating account
6. **Partial payment:** LP (Limited Partner) status → "Partially Paid"; shortfall calculated; Fund Manager and LP (Limited Partner) alerted
7. **All LPs (Limited Partners) paid:** Capital call status → "Fully Paid" → Fund Manager confirms reconciliation → status → "Reconciled / Completed"

### Over/underpayments and currency mismatches

- **Overpayment:** Excess flagged; Fund Manager decides to hold as credit against the next call or return to LP (Limited Partner); either way, logged in capital account
- **Underpayment:** LP (Limited Partner) notified; shortfall must be paid; default logic applies if cure period elapses
- **Currency mismatch:** FX conversion rate on the payment date applied; any FX difference logged; may result in a small subsequent correction call or credit note

### Capital account update (post-reconciliation)

Once a call is fully reconciled: each LP's (Limited Partner's) capital account balance is updated (contribution added); the fund's total called capital increases; these updated figures feed back into the calculation engine for the next call as "previously drawn capital"; fund accounting and NAV (Net Asset Value) are updated accordingly.

---

## 22. State Machine — Full State Handling and Failure Modes

### Capital call lifecycle states

```
[DRAFT]
  │  Fund Manager configures the call
  │  ✗ Abandoned → stays in Draft indefinitely (no cleanup unless manually deleted)
  ↓
[CALCULATION IN PROGRESS]
  │  System allocates pro-rata, applies side letters, runs equalisation if needed
  │  ✗ Missing LPA data → calculation pauses on affected LPs; flags surfaced
  ↓
[CALCULATION COMPLETE — flags present or clear]
  │  Fund Manager reviews; may add overrides or notes
  │  ✗ Serious error found by Fund Manager → reverts to Draft for correction
  ↓
[UNDER REVIEW]
  │  Submitted to ops reviewer; SLA clock starts
  │  ✗ Reviewer unavailable → SLA breach alert; escalation to ops manager
  ↓
[CHANGES REQUESTED]
  │  Reviewer sends back with comments; Fund Manager corrects and resubmits
  │  (may loop between Under Review ↔ Changes Requested multiple times)
  ↓
[UNDER REVIEW — ESCALATED]  (optional)
  │  Ambiguous LPA clause or KYC flag; Legal or Compliance input required
  │  ✗ Unresolvable before LP notice deadline → LP (Limited Partner) must be notified of delay
  ↓
[APPROVED]
  │  Reviewer signs off; investor-specific notices generated
  │  ✗ Notice generation error for a specific LP → partial hold logged
  │  ✗ KYC (Know Your Customer) lapse or flag detected for an LP (Limited Partner) at approval → that LP's notice held; status → [APPROVED — PARTIAL HOLD (KYC)]; all other notices proceed; Compliance Officer escalated
  ↓
[NOTICES SENT — PARTIAL or FULL]
  │  Notices dispatched; LP payment deadline clock starts
  │  ✗ LP disputes notice → [RECALLED] for that LP; all others proceed
  │  ✗ KYC (Know Your Customer) hold resolves → held LP's (Limited Partner's) notice dispatched separately; call remains open until that LP also reconciles
  ↓
[PARTIALLY PAID]
  │  Some LPs have paid; others pending or overdue
  │  ✗ LP overdue → [OVERDUE] state; cure period clock starts
  ↓
[OVERDUE — GRACE PERIOD]  (for affected LP only)
  │  LPA-defined cure window open; default interest accruing
  │  ✗ No payment within cure period → [IN DEFAULT]
  ↓
[IN DEFAULT]  (for affected LP only)
  │  GP (General Partner) remedies applicable per LPA (Limited Partnership Agreement)
  │  Call remains open for the defaulting LP's (Limited Partner's) share
  ↓
[FULLY PAID]
  │  All LP (Limited Partner) notices paid in full
  ↓
[RECONCILED / COMPLETED]
  Capital accounts updated; call closed; data feeds next call's calculation
```

### Terminal / exceptional states

| State | Trigger | Meaning |
|---|---|---|
| **CANCELLED** | Fund Manager cancels before notices sent | Rare; reason logged; no LP (Limited Partner) impact |
| **RECALLED** | Notices sent but recalled due to error | Reverts to Draft for correction and resubmission; LPs (Limited Partners) notified |
| **DISPUTED — UNRESOLVED** | LP dispute cannot be resolved within the call timeline | Requires legal intervention; call stays open |

### Default-handling logic in detail

1. Deadline passes without payment → LP (Limited Partner) status → **Overdue**; Fund Manager and ops reviewer alerted immediately
2. LPA (Limited Partnership Agreement) cure period begins (commonly 5–15 business days); default interest starts accruing at LPA-specified rate
3. System sends automated reminder to LP (Limited Partner) at the midpoint and 24 hours before cure period expires
4. Cure period closes without payment → status → **In Default**; Fund Manager prompted to exercise LPA (Limited Partnership Agreement) remedies
5. GP (General Partner) remedies (Fund Manager decides):
   - Direct negotiation with LP (Limited Partner)
   - Sell defaulting LP's (Limited Partner's) interest to another LP (Limited Partner) or third party at LPA-specified discount
   - Reallocate uncalled commitment to other LPs (Limited Partners) who receive a preferred interest
   - Compulsory forfeiture of the LP's (Limited Partner's) existing interest (most severe; requires formal notice)
6. Every remedy action logged in audit trail with timestamp and authorisation

---

## 23. Risk Register — Where Capital Calls Can Break

### Pre-call risks

| Risk | Where it breaks | Mitigation |
|---|---|---|
| Stale LP (Limited Partner) bank details | Payment fails or reaches wrong account | Bank details re-verified at each call creation; changes require dual confirmation |
| KYC (Know Your Customer) / AML (Anti-Money Laundering) clearance lapsed or expiring | Notice held for affected LP (Limited Partner); compliance risk if notice sent to an uncleared LP (Limited Partner) | System tracks KYC (Know Your Customer) expiry date per LP (Limited Partner) per jurisdiction; approaching renewals surfaced proactively before call cycle begins; lapsed LPs (Limited Partners) auto-flagged at call creation and reviewer checklist step |
| LPA (Limited Partnership Agreement) data not fully structured | Wrong allocation applied silently | Structured LPA (Limited Partnership Agreement) data is a prerequisite before any call can be initiated; unresolved clauses flagged before calculation runs |
| Side-letter term missed or misapplied | Specific LP (Limited Partner) over- or under-charged | Side-letter terms linked explicitly to LP (Limited Partner) records; reviewer checklist requires side-letter validation |
| Stale capital account data | Wrong "previously drawn" figure in allocation | Capital account updated after every reconciliation before next call can be created |
| New LP (Limited Partner) joined but equalisation not triggered | Existing LPs (Limited Partners) diluted without compensation | System detects new LP (Limited Partner) since last call and forces equalisation before calculation completes |

### During-review risks

| Risk | Where it breaks | Mitigation |
|---|---|---|
| Reviewer approves without checking all flags | Error-containing notices go out | Review checklist is mandatory; flags cannot be dismissed without written rationale |
| Reviewer unavailable | Notices delayed; LP (Limited Partner) relationships affected | Backup reviewer assigned per fund; SLA breach triggers ops manager alert |
| LPA (Limited Partnership Agreement) clause genuinely ambiguous | Call delayed pending legal interpretation | Legal escalation path defined; notice deadline may be extended with LP (Limited Partner) communication |
| Two approvers conflict (four-eyes funds) | Approval blocked | Clear escalation path to fund-level decision-maker; SLA enforced |

### Post-send risks

| Risk | Where it breaks | Mitigation |
|---|---|---|
| Phishing / spoofed notice with altered wire instructions | LP (Limited Partner) funds misdirected | In-platform delivery eliminates the email PDF vector; wire instructions never sent by email |
| LP (Limited Partner) internal approval delay | Payment received after deadline | LPA (Limited Partnership Agreement) notice period accounts for LP internal workflows; early notification where large calls anticipated |
| Payment matching failure (wrong reference) | Funds received but LP (Limited Partner) shows as unpaid | System uses amount + bank details + reference for matching; unmatched payments flagged within one business day for manual review |
| LP (Limited Partner) pays in wrong currency | FX difference creates underpayment | FX rate on payment date applied and logged; shortfall triggers alert; correction call or credit note issued |
| LP (Limited Partner) raises dispute after payment | Capital account incorrect; future calls affected | Dispute path exists post-payment; corrections propagate to capital account with full audit trail |
| System downtime during active payment window | Reconciliation delayed; confirmations delayed | Uptime SLA enforced; manual reconciliation override path available for critical calls |

### Systemic / structural risks

| Risk | Where it breaks | Mitigation |
|---|---|---|
| Historical data not migrated correctly | Every future call calculated on wrong baseline | Data backfill verified against original statements before first new call is permitted |
| Jurisdiction-specific rule not modelled | Non-compliant call in a specific geography | Jurisdiction rules treated as configurable data, not hardcoded; reviewed by legal per geography at fund onboarding |
| Fund LP (Limited Partner) count exceeds system performance threshold | Delays on large ELTIF (European Long-Term Investment Fund) funds | Async calculation with progress indicator; system stress-tested at 500+ LP (Limited Partner) scale |

---

## 24. Assumptions and Open Questions for a Successful Capital Call

### Assumptions — what must be true before, during, and after

**Before initiating any capital call:**
- LPA (Limited Partnership Agreement) and all current side letters are uploaded, parsed into structured data, and validated per LP (Limited Partner) record before the first call is created
- All LPs (Limited Partners) have completed KYC (Know Your Customer) / AML (Anti-Money Laundering) and their status is current (not lapsed)
- All LP (Limited Partner) bank details (IBAN, SWIFT/BIC) are on file and verified
- All commitment letters are reflected accurately in the system (no uncommitted amounts counted as committed)
- Capital account balances per LP (Limited Partner) are accurate and reflect all previously reconciled calls
- If a new LP (Limited Partner) joined since the last call, the system has detected this and will trigger equalisation automatically
- The fund's bank account is active and correctly connected to the platform
- At least one ops reviewer is assigned to the fund and available within the review SLA

**During the capital call:**
- The calculation engine correctly applies LPA (Limited Partnership Agreement) rules, side-letter terms, and jurisdiction-specific overlays for all LPs (Limited Partners)
- The ops reviewer has sufficient expertise to validate the output against the LPA (Limited Partnership Agreement) terms relevant to this call
- In-platform / email notice delivery constitutes legally valid delivery per the LPA (Limited Partnership Agreement) and applicable jurisdiction (unconfirmed — see open question below)
- LPs (Limited Partners) have sufficient liquidity to fund the call within the notice period
- No LP (Limited Partner) KYC (Know Your Customer) lapses between call initiation and notice delivery

**After the capital call:**
- All incoming payments are matched automatically — or flagged for manual matching — within one business day of receipt
- Capital account records are updated immediately upon reconciliation confirmation
- Updated capital account figures are available to the calculation engine for the next call without manual re-entry
- The audit trail is complete, tamper-evident, and sufficient to satisfy BaFin (German Federal Financial Supervisory Authority), FCA (Financial Conduct Authority), CSSF (Commission de Surveillance du Secteur Financier), and AFM (Autoriteit Financiële Markten — Dutch Financial Markets Authority) audit requirements

### Open questions — what needs to be validated internally at bunch

1. **Legal validity of in-platform delivery:** Does each fund's LPA (Limited Partnership Agreement) explicitly permit in-platform or email delivery as legally valid notice across all LP (Limited Partner) jurisdictions? Or do any LPAs (Limited Partnership Agreements) still require physical delivery?
2. **Calculation engine coverage:** What percentage of LPA (Limited Partnership Agreement) and side-letter logic is currently encoded in the engine versus handled manually by the ops reviewer?
3. **Equalisation automation:** Is equalisation fully automated today, or does it still require manual spreadsheet work that the reviewer then validates?
4. **Reviewer SLA:** What is the current target vs. actual time from submission to approval? Where is the bottleneck — calculation review, side-letter checking, or escalations?
5. **Default handling in production:** Has the default-handling logic been exercised in a real fund? If so, what did that workflow look like operationally, and what was missing from the platform?
6. **ELTIF (European Long-Term Investment Fund) scale:** Has the system been tested for funds with 500+ LPs (Limited Partners)? What is the current performance ceiling on LP (Limited Partner) count?
7. **Jurisdiction-specific logic:** Which jurisdictions have bespoke calculation or notice-delivery rules currently active in production, and are those rules encoded as configurable data or as one-off code exceptions?
8. **Partial batch sends:** Can the system currently send notices to a subset of LPs (Limited Partners) while holding others pending, or is it all-or-nothing per call?
9. **Capital account data source:** Is the capital account balance per LP (Limited Partner) maintained natively in bunch, or reconciled against an external general ledger or accounting system?
10. **Historical data verification for migrated funds:** When a fund migrates to bunch from a legacy administrator, how is the accuracy of historical capital account balances verified before the first new call is created?

## Sources

bunch.capital ("The complexities of Capital Calls and how to solve them," transfer-agency, investor-portal, treasury, compliance, glossary pages); ILPA Capital Call & Distribution Notice Best Practices (v1.1); Allvue Systems (subsequent closings/equalisation explainer); EisnerAmper (subsequent closings for PE funds); Private Equity Wire (consequences of LP defaults); Esinli Capital (capital calls and LP liquidity planning); IncepVision Law (PE fund equalisation explainer); Loyens & Loeff, Ogier, Paul Hastings, Dechert, CMS (AIFMD II liquidity management tools); Invest Europe (AIFMD policy overview); IQ-EQ, AIMA, PwC Switzerland, Euroclear, Citco, Irish Funds, European Commission (ELTIF 2.0 sources).
