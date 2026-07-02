# Bunch — Products & Company Overview

> **Document status:** Living reference, v1.0 — built mid-2026 from public sources only, before joining bunch. Two intended lifespans: (1) ground truth for final-stage interview prep, (2) the founding version of an ongoing internal reference you maintain and expand throughout your time at bunch. Anything learned on the job should eventually supersede the external-research version below — see the Open Questions section near the end for exactly where the gaps are, and the project readme file for how to fold updates back in.
>
> *Original research note: compiled from bunch.capital, bunch's blog/help center, press coverage, and third-party sources. Funding figures, headcount, and customer counts move quickly at this stage of the company — verify anything time-sensitive before relying on it.*

## 1. Company Snapshot

- **Full name / legal entity:** bunch technology GmbH (the platform/technology entity). A separate, independent legal entity, **agora tax GmbH**, performs the statutory tax and other "reserved task" services bundled into the bunch tax product — bunch is explicit that the two entities cannot act for or bind one another.
- **Founded:** 2021, by **Levent Altunel** and **Enrico Ohnemüller** (Ohnemüller is CEO). Both encountered the pain points of fund administration first-hand in prior venture roles and built bunch to fix what they saw as a stagnant, service-heavy incumbent market.
- **Headquarters:** Berlin, Germany. Additional offices in **London (UK), Amsterdam (Netherlands), and Luxembourg**.
- **One-line positioning:** "Building the backbone of private markets" — an integrated system combining secure data infrastructure, AI-powered workflows, and expert fund services for fund managers across the full fund lifecycle.
- **Scale (as of the most recent funding announcement, May 2026):** 150+ asset managers, 12,000+ investors (LPs), 500+ investment structures under management, operating across major European jurisdictions. ARR grew roughly 300% in 2025, with net revenue retention of 156%.
- **Funding:** Total raised exceeds **$58M**. Key rounds: a Series A of **$15.5M in 2024**, led by FinTech Collective with participation from Motive Partners, Cherry Ventures, and angels connected to Moonfare and AngelList; and a **Series B of $35M (~€30.1M) closed May 2026**, led by Portage with participation from Illuminate Financial and continued backing from Motive Partners, Cherry Ventures, and Fintech Collective.
- **Certifications:** ISO 27001 (information security management) certified.
- **Notable customers / logos:** Cherry Ventures, Motive Ventures/Motive Partners, Hummingbird VC, Passion Capital, FINVIA Family Office, Merantix, Tiny / Tiny Supercomputer, Antler, Redstone, Heal Capital, Auxxo Female Catalyst Fund, AB Capital, Pina Capital, VORNvc, Andrena Ventures, w3.fund, Prequel, Collective Ventures, Signature Ventures, May Ventures, Gaius Capital, Aescuvest.

## 2. The Problem Bunch Solves

Private markets fund operations in Europe have historically run on a patchwork of:
- **Legacy fund administrators** (often founded in the 1970s–90s) that are people-first, technology-light, and charge premium fees for largely manual processes.
- **Spreadsheets, email threads, and PDF attachments** for anything from capital calls to investor reporting — slow, error-prone, and a phishing/security risk (a spoofed capital-call PDF can misdirect investor funds).
- **Fragmented point solutions** — one tool for cap tables, another for data rooms, another for accounting, another for compliance — none of which talk to each other, forcing manual reconciliation.
- **Jurisdictional complexity unique to Europe**: a fund operating across Germany, the UK, Luxembourg, and the Netherlands must apply different regulatory, accounting, and tax regimes simultaneously (BaFin vs. FCA vs. CSSF vs. AFM oversight; German GAAP/E-Bilanz vs. Dutch *jaarrekening* vs. UK statutory accounts; INVEST Europe vs. BVCA reporting standards) — something US-built competitors (Carta, Juniper Square) were not designed for.

The result: fund managers (especially smaller/emerging managers) spend a disproportionate amount of time on administrative coordination instead of sourcing deals and supporting portfolio companies — one GP cited in bunch's own content estimated spending **~60% of their week** on what was effectively fund infrastructure rather than investing.

## 3. Company Evolution

Bunch did not start as today's institutional-grade platform. Its help center still reflects its origins, with legacy categories for **"Angel Roll-Ups"** and **"Syndicates (SPVs)"** alongside a newer, smaller **"Funds"** category — evidence that bunch began closer to the angel-investing / SPV-administration space (helping individuals and scouts pool capital into single deals) before evolving into a full end-to-end fund administration platform for institutional VC and PE funds. This evolution mirrors the broader market: AngelList/Odin occupy a similar "started in SPVs, moved toward funds" trajectory in the US/UK.

Today bunch explicitly serves three vehicle types on its own intake form: **Funds, SPVs, and Club Deals** — so the SPV/syndicate layer hasn't disappeared, but the company's strategic center of gravity and marketing now sit firmly on institutional-grade VC and PE **fund** operations.

## 4. Business Model

Bunch sells a **hybrid software + expert-services model**, not pure SaaS:
- The **software layer** (investor portal, transfer agency, accounting engine, treasury, compliance workflows) is described as "AI-native infrastructure" — proprietary, not a wrapper around third-party tools like Investran, eFront, or Yardi (which several incumbent administrators rely on).
- The **services layer** wraps the software: dedicated key account managers, fund accountants, legal/compliance specialists, and tax experts (via agora tax) work *inside* the bunch environment alongside the client's team, rather than as a detached outsourced back office.
- Bunch frames this as replacing "fragmented, service-intensive, paper-based processes" with a single accountable partner, while still acknowledging that private markets remain a people-driven, relationship-heavy industry — bunch is not trying to fully disintermediate the human fund-ops relationship, just consolidate and digitize it.
- Target customer: VC and PE fund managers in Europe, from first-time/solo emerging managers (microfunds) up to institutional-scale firms; family offices; fund-of-funds. Bunch explicitly courts the "long tail" of European emerging managers and microfunds that legacy administrators historically underserved or overcharged, while also landing larger institutional names (Cherry Ventures, Motive Partners).
- Go-to-market signal: bunch was selected as one of three official service providers on the UK's **British Business Bank "Pathways Capital" programme** — a £400M initiative backing first-time solo GPs launching UK microfunds (£5M–£20M) — partnering with fractional-CFO firm Plug Capital to deliver bundled regulatory hosting + fund administration + embedded CFO support. This is a clear example of bunch's emerging-manager strategy in practice.

## 5. The Product Suite

Bunch organizes its offering into two vertical entry points — **"For Venture Capital"** and **"For Private Equity"** — that lead into the same six core products, plus a seventh (bunch tax) marketed separately.

### Investor Portal
A unified, branded portal giving LPs real-time access to performance, documents, and capital calls. Centralizes investor communications, capital call delivery, and the investor data room (with dynamic watermarking and granular permissions). Positioned as the LP-facing front end that replaces static PDFs and scattered email threads. Key sub-features: simplified LP communications, real-time performance/cash-flow reporting with custom KPIs, secure role-based document access, and in-platform digital voting/resolutions with e-signature and audit trail.

### Transfer Agency
The capital-call and distribution engine — "run capital calls and distributions in hours, not days." Inputs (drawdown or distribution amount) flow through automated calculations (working capital through equalisations), generating compliant, investor- and side-letter-specific notices. Includes built-in bank integrations for bulk payment execution and automatic reconciliation, LP-facing notice delivery with digital confirmation and payment tracking, and a full audit trail designed to meet BaFin, FCA, and CSSF expectations. This is the product area most directly relevant to the capital calls challenge (see the companion Capital Calls context file).

### Fund Accounting & Reporting
Positioned as "your digital fund accountant, embedded in software." Unifies GAAP and INVEST Europe/BVCA-standard reporting so data is entered once and flows to tax books, investor reports, and advisors without manual reconciliation. Includes customizable/white-labelled LP reporting, side-letter obligation tracking, live bank feeds with automated transaction categorization, and direct, read-only access for external auditors and tax advisors. Pre-built export formats cover German E-Bilanz, Dutch *jaarrekening*, and UK statutory accounts.

### Treasury
Connects bank accounts to the rest of fund operations for cash-flow monitoring, bulk distributions (to 100+ investors at once), and audit-ready transaction tracking. Bunch assists with opening bank accounts for the fund or ancillary entities (via partner banks or an embedded payment-partner interface), and backfills historical transaction data so capital calls adjust correctly to actual LPA terms without manual correction.

### Compliance
Manages KYC, AML, FATCA, CRS, LEI/GIIN registration, and ESG/SFDR-adjacent disclosure work as a largely automated, expert-overseen workflow rather than a fragmented mix of external legal counsel and spreadsheets. Includes in-platform governance (investor votes, e-signatures, syncing back to the cap table/data room), granular access control, and jurisdiction-specific filing logic so a fund operating across Germany, the UK, Luxembourg, and the Netherlands doesn't have to rebuild its compliance process per country. An appointed AML officer (internal or external) connects directly to the platform; bunch's own regulatory specialists liaise with BaFin, FCA, CSSF, or AFM as needed.

### Fund Admin Service
The "human layer" wrapped around the software — dedicated key account managers and fund accountants/specialists who work directly inside the client's bunch environment rather than as a detached outsourced vendor. This is the explicit answer to the "people-driven industry" acknowledgment: automation handles routine processes, but a named team is accountable for edge cases.

### bunch tax (launched 2025/2026, marketed as a distinct, newer product line)
"The integrated tax operating experience: driven by technology, delivered by tax experts." Connects local GAAP directly to fund-level accounting to eliminate the historical gap between fund administration and tax reporting, replacing multi-week manual processes with faster, data-driven investor reporting (bunch's own marketing cites an ~80% cut in investor-reporting turnaround time once bunch tax is live). Statutory tax services are performed by the separate, regulated entity agora tax GmbH, with bunch technology GmbH operating the technical platform — a structure designed to combine software efficiency with the regulatory weight of a licensed tax practice.

## 6. How the Products Interconnect

Bunch's core pitch is **"a single system of record"**: rather than separate vendors for cap table/investor data, accounting, compliance, and banking, every product reads and writes against the same underlying fund and investor dataset (LPA terms, side letters, commitment schedules, bank details, KYC status). This is what allows, for example, a capital call calculated in Transfer Agency to automatically flow into Fund Accounting & Reporting without re-entry, and for Treasury reconciliation to update the Investor Portal's real-time cash-flow view simultaneously. Bunch explicitly frames this architecture as its key differentiator versus competitors who "wrap around" third-party general ledgers (Investran, Xero, eFront) rather than owning the data natively — see the Competitive Analysis file for more on this distinction.

## 7. Geography & Regulatory Footprint

Bunch operates across **Germany, the UK, the Netherlands, and Luxembourg**, with stated ambitions to expand further across Europe (and eventually beyond). This is a deliberate strategic bet: Europe's private markets regulatory environment is fragmented by design (no single EU-wide fund administrator regime equivalent to a unified market), which both raises the barrier to entry for new entrants and the switching cost once a manager is embedded — bunch's investors (e.g., Portage) describe this fragmentation as the source of bunch's defensibility, not just a headwind.

Key regulatory and accounting touchpoints bunch explicitly handles or references:
- **AIFMD** (Alternative Investment Fund Managers Directive) — the core EU framework governing how PE/VC fund managers operate, report, and market funds. AIFMD II (transposition ongoing into 2026) introduces stricter liquidity management tooling, though most of those specific tools (e.g., redemption gates, swing pricing) target *open-ended* funds; closed-ended VC/PE funds are more directly affected by AIFMD's broader disclosure, depositary, and reporting obligations.
- **National regulators**: BaFin (Germany), FCA (UK), CSSF (Luxembourg), AFM (Netherlands).
- **KAGB** (German Capital Investment Code) — defines categories like "semi-professional investor," relevant to which European investors can access which fund structures.
- **ELTIF 2.0** — the revised European Long-Term Investment Fund regulation (in force since 2024, accelerating through 2025–2026) that removes prior retail-investor minimums and caps, broadens eligible assets, and grants an EU-wide marketing passport. This is opening private markets to a much larger base of retail and "mass affluent" investors — directly increasing the number of LPs (and therefore the operational complexity of capital calls, KYC, and reporting) a given fund must service. Luxembourg is the dominant ELTIF domicile.
- **Accounting standards**: INVEST Europe and BVCA reporting standards (industry-specific, not GAAP-equivalent), alongside local GAAP variants and country-specific filing formats (German E-Bilanz, Dutch jaarrekening, UK statutory accounts).

## 8. Personas

**General Partner / Fund Manager (the buyer/champion).** Spans a wide range: solo GPs and first-time emerging managers running microfunds (the British Business Bank's Pathways Capital cohort is an explicit bunch target segment) up to multi-fund institutional managers like Cherry Ventures or Motive Partners. Pain point in common: wants to spend time on deals and LP relationships, not infrastructure coordination.

**CFO / Head of Finance & Operations (the day-to-day power user).** Often the actual buyer and primary in-platform user — e.g., Cecilia von Oldershausen at Heal Capital (Senior Manager Finance & Operations / CFO-COO), Alexander Langholz-Baikousis (CFO & Operating Partner, Cherry Ventures). Increasingly this role is filled by a **"fractional/embedded CFO"** (per bunch's "Rise of the CFO 2.0" content, featuring Plug Capital's Rebekah Kasumu) for lean or first-time fund teams that can't justify a full-time finance hire. This persona cares about: NAV turnaround time (frustration with the industry-standard 90-day post-quarter NAV cycle), automation reducing human error, and having a single source of truth instead of reconciling across providers.

**Limited Partner (LP) / Investor (the end consumer of the Investor Portal).** Ranges from large institutional LPs (e.g., German private health insurers and the European Investment Fund as Heal Capital's backers, each with bespoke reporting and capital-call requirements) to family offices (FINVIA) to, increasingly under ELTIF 2.0, smaller semi-professional or retail-adjacent investors. LPs want transparency, predictable/LP-friendly capital call cadence, and self-service access to documents and reporting rather than waiting on email.

**Operations / Account Management at bunch itself.** Bunch's own internal operating model (dedicated key account managers, fund accountants, legal ops specialists) is itself a "persona" worth understanding for an interview — bunch positions its own people as embedded extensions of the client's team, not a ticket queue.

## 9. Leadership Team

- **Enrico Ohnemüller** — Co-Founder & CEO
- **Levent Altunel** — Co-Founder
- **Jessica McBride** — General Counsel
- **Diana Dinis** — VP Product
- **Leandro Storoli** — VP Engineering
- **Viktor Apelganz** — VP Tax
- **Aylin Üzsal** — VP Operations
- **Christian Pätzold** — VP Accounting
- **Tim Ferguson** — VP Commercial
- **Cheyenne Riley** — Head of Account Management

## 10. Stated Values

Bunch lists five operating values: **Aim for impact** (outcome focus, precision), **Own it** (default ownership of work and customer outcomes), **Empower others** (invest in colleagues and customers, win as a team), **Enjoy the ride** (have fun solving hard problems together), **Always be curious** (keep asking why, never settle for "that's just how it's done").

## 11. Market Context & Tailwinds

- Global alternative assets under management are forecast to reach **$32 trillion by 2030** (Preqin), and private markets are described industry-wide as entering "a new phase of growth — and operational pressure," i.e., AUM growth is outpacing the operational infrastructure built to service it.
- **ELTIF 2.0** is structurally expanding the investor base for private funds (more, smaller LPs, including retail/mass-affluent), which multiplies the operational load of onboarding, KYC, capital calls, and reporting — a direct tailwind for any platform that can automate those workflows at scale.
- **AIFMD II** and tightening EU regulatory expectations (disclosure, liquidity management, value-for-money) raise the compliance bar for fund managers, especially smaller ones without in-house compliance teams.
- A wave of **emerging and first-time/solo GP funds** is launching across Europe (amplified by programmes like Pathways Capital in the UK), and these managers structurally need outsourced/embedded infrastructure rather than building in-house teams — bunch's stated target segment.
- Recent funding momentum (300% ARR growth in 2025, 156% net revenue retention) suggests strong product-market fit with existing customers expanding usage, not just new-logo growth.

## 12. Open Questions to Validate Once Inside Bunch

These are the things public research structurally cannot answer — treat this as both an interview-question bank and a personal onboarding checklist for your first weeks:

- The actual org chart beneath the ten named leadership profiles — team sizes per function, reporting lines, where "Operations" ends and "Account Management" begins.
- The real pricing model and unit economics: per-LP fee, per-fund flat fee, AUM-based, blended with services hours, or some mix — and how that compares to what's claimed publicly about being "affordable for smaller funds."
- True technical architecture: is the full stack proprietary end-to-end, or are there third-party dependencies (banking rails, document parsing/OCR, payment processors) sitting behind the "AI-native infrastructure" framing?
- How product and sales actually segment customers internally (emerging manager vs. institutional) — is it a different product tier, a different services intensity, or purely a sales-motion distinction?
- The live product roadmap — the public site reflects what's shipped, not what's being built next.
- How bunch technology GmbH and agora tax GmbH actually coordinate day to day (data handoffs, SLAs, shared systems) beyond the legal disclaimer that they're independent entities.
- What's actually driving the 300% ARR growth and 156% NRR figures — new-logo vs. expansion revenue, and which products are pulling the most expansion.
- Real reasons customers churn or get lost in competitive deals, and how that compares to the competitive narrative built in the companion competitive-analysis file.

## Sources

bunch.capital (homepage, investor-portal, transfer-agency, fund-accounting-reporting, treasury, compliance, bunch-tax, company/about, case-studies, private-markets-glossary, blog posts "bunch Raises $35M Series B," "The Rise of the CFO 2.0," "The complexities of Capital Calls and how to solve them"); EU-Startups; BeBeez International; TechFundingNews; FinTech Collective; FinTech Alliance; help.bunch.capital.
