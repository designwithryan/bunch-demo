# bunch — Capital Call Creation & Execution (Prototype)

A clickable, interactive prototype of a redesigned **Capital Call Creation & Execution** experience for [bunch](https://bunch.capital), a European private-markets fund administration platform. Built from a from-scratch UX/product spec (not a Bunch production artifact), then implemented in React from a full Figma design covering three personas and 18 screens.

**Live demo:** https://bunch-demo.ryanmohammad.com

## What this is

A fund manager creates a capital call, a colleague peer-reviews it, Bunch's own ops team runs it through a structured checklist (including a KYC exception on one LP), and the LP investor receives and pays the notice — all as one continuous, stateful flow across three switchable personas:

- **Fund Manager** — Dashboard, Capital Calls (list/timeline), a 4-step New Capital Call wizard (one-time or scheduled, recipient targeting, live pro-rata calculation, notice preview), Reviews (peer approval), Default Remedy, Reconciliation.
- **Bunch Admin** — a cross-fund Review Queue with a structured 7-item approval checklist and an inline support chat with the fund manager.
- **Investor** — My Portfolio, Capital Calls, and the actual notice a fund's LP receives, with Confirm Payment / Flag Issue actions.

Switch personas from the top nav at any time — **state is shared and live**: approve a call as the peer reviewer and it shows up immediately in Bunch's Review Queue; approve it there and the LP sees the notice arrive.

A floating **"Try this prototype"** guide (bottom-right) suggests a click-through script if you don't know where to start, and includes a **Reset demo data** control.

## Why it's built this way

The full design rationale — problem framing, the automation boundary between what the system calculates vs. what a human must sign off on, the state machine, and worked failure paths (a KYC exception, a payment default) — lives in `capital-calls-redesign-vision.md` in this repo, built on top of `capital-calls-context.md` (the domain deep-dive) and `bunch-products-overview-context.md` (company/product context). Read those first if you want the "why," not just the "what."

## Scope & honest trade-offs

This is a prototype, not a production app — no backend, no auth, no real payments:

- **State** lives in a single React Context + `useReducer` store, persisted to `localStorage` in your browser. Nothing is sent to a server, and nothing here is shared between visitors.
- **Calculations are real, not decorative.** Pro-rata amounts are computed live from each LP's commitment and the call's target amount — toggle a recipient in or out and the numbers actually recompute, they're not hand-typed per screen.
- **Time can't actually pass** in a demo, so a few state transitions that would normally take days (KYC clearing, a notice going overdue → grace period → in default) are reachable via explicit, clearly-labeled "Simulate" buttons rather than real waiting.
- **Left-nav items without a designed screen** (Funds, Distributions, Fund Accounting & Reporting, Treasury, Investors, Compliance, Data Room, Tasks, and their Bunch Admin/Investor equivalents) show a plain "not built in this pass" placeholder instead of a broken link — this mirrors the explicit scope line in the redesign vision doc rather than pretending the surface is complete.
- The specific dollar figures in the seed data are internally consistent (computed from a real pro-rata formula) but were not reverse-engineered to match every individual number in the original Figma mockup pixel-for-pixel, since the source mockup's own numbers weren't fully self-consistent across screens.

## Tech stack

Vite + React 18 + TypeScript + `react-router-dom` (`HashRouter`, so it deploys cleanly to GitHub Pages with no server rewrite rules). CSS Modules with a small hand-written token file (`src/styles/tokens.css`) matching the Figma file's exact color/type variables. `framer-motion` for the chat drawer, modals, and step transitions. No component library, no chart library, no backend.

## Running locally

```bash
npm install
npm run dev
```

Open the printed local URL. `npm run build` produces a static `dist/` bundle; `npm run preview` serves it locally.

## Deployment

Deploys automatically via GitHub Actions (`.github/workflows/deploy.yml`) to GitHub Pages on every push to `main` — no third-party hosting (Vercel, Netlify, etc.) involved.

## Source docs in this repo

- `bunch-products-overview-context.md` — company and product-suite context
- `capital-calls-context.md` — domain deep-dive on capital calls, personas, state machine
- `capital-calls-redesign-vision.md` — the actual design spec this prototype implements
