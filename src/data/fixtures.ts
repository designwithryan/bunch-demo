import type {
  AppState,
  CapitalCall,
  ChecklistItem,
  Fund,
  LineItem,
  LP,
  NoticeLine,
} from './types';

// Aggregates a call's notice-level breakdown into the fund-level Calculation
// card rows (capital-calls-context.md §5) — computed from the actual notices
// rather than hand-typed, so the two can never drift out of sync.
export function standardLineItems(notices: NoticeLine[]): LineItem[] {
  const capitalCall = Math.round(notices.reduce((s, n) => s + n.capitalCall, 0) * 100) / 100;
  const managementFee = Math.round(notices.reduce((s, n) => s + n.managementFee, 0) * 100) / 100;
  const workingCapital = Math.round(notices.reduce((s, n) => s + n.workingCapital, 0) * 100) / 100;
  const items: LineItem[] = [];
  if (capitalCall) items.push({ label: 'Capital call (pro-rata)', amount: capitalCall });
  if (managementFee) items.push({ label: 'Management fee', amount: managementFee });
  if (workingCapital) items.push({ label: 'Working capital', amount: workingCapital });
  return items;
}

const round2 = (n: number) => Math.round(n * 100) / 100;
export const WORKING_CAPITAL_RATE = 0.00015;

// Every one-time / scheduled call breaks a per-LP notice into three itemized
// components (capital-calls-context.md §5): the pro-rata capital-call draw
// itself, the management fee, and a small working-capital reserve line. The
// call's headline `amount` is the capital-call draw only — fees are shown as
// separate additive lines, never folded silently into one number.
function proRataNotices(
  lps: LP[],
  recipientIds: string[],
  rate: number,
  options: { includeManagementFee?: boolean; includeWorkingCapital?: boolean } = {},
  overrides: Partial<Record<string, Partial<NoticeLine>>> = {}
): NoticeLine[] {
  const { includeManagementFee = true, includeWorkingCapital = true } = options;
  const byId = Object.fromEntries(lps.map((lp) => [lp.id, lp]));
  return recipientIds.map((id) => {
    const lp = byId[id];
    const capitalCall = round2(lp.commitment * rate);
    const managementFee = includeManagementFee ? round2(lp.commitment * lp.feePct) : 0;
    const workingCapital = includeWorkingCapital ? round2(lp.commitment * WORKING_CAPITAL_RATE) : 0;
    return {
      lpId: id,
      commitmentBefore: lp.commitment,
      commitmentAfter: lp.commitment,
      capitalCall,
      managementFee,
      workingCapital,
      amountDue: round2(capitalCall + managementFee + workingCapital),
      ...overrides[id],
    };
  });
}

// ---- LPs: Cherry Fund II ------------------------------------------------

const cherryLps: LP[] = [
  { id: 'crimson-tide', name: 'Crimson Tide Enterprises', country: 'Germany', jurisdictionAuthority: 'BaFin', commitment: 100000, feePct: 0.025, kycStatus: 'clear' },
  { id: 'azure-blue', name: 'Azure Blue Technologies', country: 'United Kingdom', jurisdictionAuthority: 'FCA', commitment: 200000, feePct: 0.025, kycStatus: 'clear' },
  { id: 'marigold', name: 'Marigold Innovations', country: 'United Kingdom', jurisdictionAuthority: 'FCA', commitment: 200000, feePct: 0.025, kycStatus: 'clear' },
  { id: 'zara-quantum', name: 'Zara Quantum Solutions', country: 'Netherlands', jurisdictionAuthority: 'AFM', commitment: 100000, feePct: 0.025, kycStatus: 'expired', kycNote: 'KYC clearance expired — AFM renewal cycle lapsed 2 days before this call was created.' },
  { id: 'eclipse-ventures', name: 'Eclipse Ventures', country: 'Germany', jurisdictionAuthority: 'BaFin', commitment: 200000, feePct: 0.025, kycStatus: 'clear' },
  { id: 'isla-rivera', name: 'Isla Rivera', country: 'Germany', jurisdictionAuthority: 'BaFin', commitment: 200000, feePct: 0.025, kycStatus: 'clear' },
  { id: 'orion-starlight', name: 'Orion Starlight Corp', country: 'Germany', jurisdictionAuthority: 'BaFin', commitment: 175000, feePct: 0.025, kycStatus: 'clear' },
  { id: 'sage-dynamics', name: 'Sage Dynamics', country: 'Luxembourg', jurisdictionAuthority: 'CSSF', commitment: 250000, feePct: 0.025, kycStatus: 'clear', sideLetter: 'MFN clause — added 2026' },
  { id: 'griffin-archer', name: 'Griffin Archer', country: 'Luxembourg', jurisdictionAuthority: 'CSSF', commitment: 100000, feePct: 0.025, kycStatus: 'clear' },
  { id: 'velvet-sun', name: 'Velvet Sun LLC', country: 'Germany', jurisdictionAuthority: 'BaFin', commitment: 200000, feePct: 0.025, kycStatus: 'expiring', kycNote: 'KYC renewal due in 18 days.' },
  { id: 'niamh-oconnor', name: 'Niamh O’Connor', country: 'Ireland', jurisdictionAuthority: 'CBI', commitment: 200000, feePct: 0.025, kycStatus: 'clear' },
  { id: 'electra-networks', name: 'Electra Networks', country: 'United Kingdom', jurisdictionAuthority: 'FCA', commitment: 500000, feePct: 0.025, kycStatus: 'clear' },
  { id: 'felix-star', name: 'Felix Star Enterprises', country: 'Netherlands', jurisdictionAuthority: 'AFM', commitment: 200000, feePct: 0.025, kycStatus: 'expiring', kycNote: 'KYC renewal due in 26 days.' },
  { id: 'nova-terra', name: 'Nova Terra Industries', country: 'Luxembourg', jurisdictionAuthority: 'CSSF', commitment: 300000, feePct: 0.025, kycStatus: 'clear' },
  { id: 'nordic-impact', name: 'Nordic Impact Partners', country: 'Sweden', jurisdictionAuthority: 'Finansinspektionen', commitment: 310000, feePct: 0.025, kycStatus: 'clear' },
  { id: 'cherry-ventures-lp', name: 'Cherry Ventures LP', country: 'Germany', jurisdictionAuthority: 'BaFin', commitment: 100000, feePct: 0.025, kycStatus: 'clear', userId: 'james-whitfield' },
];

const CHERRY_ORIGINAL_14 = [
  'crimson-tide', 'azure-blue', 'marigold', 'zara-quantum', 'eclipse-ventures',
  'isla-rivera', 'orion-starlight', 'sage-dynamics', 'griffin-archer', 'velvet-sun',
  'niamh-oconnor', 'electra-networks', 'felix-star', 'nova-terra',
];
const CHERRY_TOTAL_COMMITMENT = cherryLps
  .filter((l) => CHERRY_ORIGINAL_14.includes(l.id))
  .reduce((sum, l) => sum + l.commitment, 0);
const SERIES_B_RATE = 2_000_000 / CHERRY_TOTAL_COMMITMENT;

// ---- LPs: secondary funds ------------------------------------------------

const motiveLps: LP[] = [
  { id: 'motive-lp-1', name: 'Falcon Ridge Capital', country: 'Germany', jurisdictionAuthority: 'BaFin', commitment: 400000, feePct: 0.02, kycStatus: 'clear' },
  { id: 'motive-lp-2', name: 'Whitfield Holdings', country: 'Germany', jurisdictionAuthority: 'BaFin', commitment: 300000, feePct: 0.02, kycStatus: 'clear' },
  { id: 'motive-ventures-lp', name: 'Motive Ventures LP', country: 'Germany', jurisdictionAuthority: 'BaFin', commitment: 262200, feePct: 0.02, kycStatus: 'clear', userId: 'james-whitfield' },
];

const healLps: LP[] = [
  { id: 'heal-lp-1', name: 'Meridian Health Partners', country: 'Germany', jurisdictionAuthority: 'BaFin', commitment: 350000, feePct: 0.02, kycStatus: 'clear' },
  { id: 'heal-ventures-lp', name: 'Heal Ventures LP', country: 'Germany', jurisdictionAuthority: 'BaFin', commitment: 500000, feePct: 0.02, kycStatus: 'clear', userId: 'james-whitfield' },
];

export const allLps: LP[] = [...cherryLps, ...motiveLps, ...healLps];

// ---- Funds ----------------------------------------------------------------

export const funds: Fund[] = [
  {
    id: 'cherry-ii',
    name: 'Cherry Fund II',
    manager: 'Cherry Ventures',
    vintage: 2026,
    currency: 'EUR',
    lpIds: allLps.filter((l) => cherryLps.includes(l)).map((l) => l.id),
    aum: 2_925_000,
    irr: 0.243,
    tvpi: 2.1,
    dpi: 1.8,
    moic: 2.4,
    nav: 118_300_000 * 0.02, // scaled down so multi-fund KPI strip still reads sensibly
    momPct: 0.217,
    status: 'Investing',
  },
  {
    id: 'motive-iii',
    name: 'Motive Fund III',
    manager: 'Motive Partners',
    vintage: 2024,
    currency: 'EUR',
    lpIds: motiveLps.map((l) => l.id),
    aum: 962200,
    irr: 0.284,
    tvpi: 1.6,
    dpi: 0.9,
    moic: 1.9,
    nav: 1_450_000,
    momPct: 0.284,
    status: 'Active',
  },
  {
    id: 'heal-i',
    name: 'Heal Capital I',
    manager: 'Heal Capital',
    vintage: 2021,
    currency: 'EUR',
    lpIds: healLps.map((l) => l.id),
    aum: 850000,
    irr: 0.182,
    tvpi: 1.4,
    dpi: 1.2,
    moic: 1.5,
    nav: 980000,
    momPct: 0.182,
    status: 'Harvesting',
  },
];

// ---- Capital Calls: Cherry Fund II -----------------------------------------

const seriesBRecipients = [
  'crimson-tide', 'azure-blue', 'zara-quantum', 'eclipse-ventures', 'orion-starlight',
  'sage-dynamics', 'velvet-sun', 'electra-networks', 'felix-star', 'cherry-ventures-lp',
];
const seriesBExcluded = ['marigold', 'isla-rivera', 'griffin-archer', 'niamh-oconnor', 'nova-terra'];

const seriesBChecklist: ChecklistItem[] = [
  { id: 'amount', label: 'Total amount matches investment memo', state: 'clear' },
  { id: 'proRata', label: 'Pro-rata allocation applied against current commitments', state: 'clear' },
  { id: 'sideLetters', label: 'Side-letter terms correctly applied (1 LP discount verified)', state: 'clear' },
  { id: 'equalisation', label: 'Equalisation calculated across all prior calls', state: 'clear', note: 'No new LP since last call — n/a' },
  { id: 'incompleteData', label: 'Incomplete-data flags resolved or escalated', state: 'clear' },
  { id: 'jurisdiction', label: 'Jurisdiction-specific overlays applied', state: 'clear' },
  { id: 'kyc', label: 'KYC/AML status current for every LP', state: 'escalated', note: 'Zara Quantum Solutions (NL) — KYC expired, escalated to Compliance.' },
];

const seriesBNotices = proRataNotices(cherryLps, seriesBRecipients, SERIES_B_RATE, {}, {
  'zara-quantum': { status: 'held_kyc', flagged: true, flagReason: 'KYC clearance expired — Netherlands, AFM renewal cycle.' },
});
export const seriesBCall: CapitalCall = {
  id: 'call-series-b',
  fundId: 'cherry-ii',
  type: 'one-time',
  purpose: 'Series B follow-on — Portfolio Co. X',
  linkedInvestment: 'Portfolio Co. X — Series B, €4.2M round',
  amount: round2(seriesBNotices.reduce((s, n) => s + n.capitalCall, 0)),
  noticeDate: '2026-06-01',
  dueDate: '2026-08-03',
  recipientMode: 'manual',
  recipientLpIds: seriesBRecipients,
  excludedLpIds: seriesBExcluded,
  excludedReason: 'Side-letter excuse right — sat out this investment',
  lineItems: standardLineItems(seriesBNotices),
  notices: seriesBNotices,
  status: 'under_review',
  assignedReviewer: 'Tom Weber',
  peerStatus: 'pending',
  reviewNotes: [],
  bunchChecklist: seriesBChecklist,
  submittedBy: 'Priya Sharma',
  submittedAt: '2026-07-02T09:14:00Z',
};

const mgmtFeeRecipients = CHERRY_ORIGINAL_14.concat('cherry-ventures-lp');
const mgmtFeeNotices = proRataNotices(cherryLps, mgmtFeeRecipients, 0, { includeWorkingCapital: false }).map((n, i) => ({
  ...n,
  status: (i % 4 === 3 ? 'sent' : 'paid') as NoticeLine['status'],
}));
export const mgmtFeeCall: CapitalCall = {
  id: 'call-mgmt-fee-q4',
  fundId: 'cherry-ii',
  type: 'scheduled',
  purpose: 'Quarterly Management Fee — Q4',
  amount: round2(mgmtFeeNotices.reduce((s, n) => s + n.managementFee, 0)),
  noticeDate: '2026-09-24',
  dueDate: '2026-10-01',
  recipientMode: 'all',
  recipientLpIds: mgmtFeeRecipients,
  excludedLpIds: [],
  lineItems: standardLineItems(mgmtFeeNotices),
  notices: mgmtFeeNotices,
  status: 'approved',
  peerStatus: 'approved',
  reviewNotes: [],
  bunchChecklist: seriesBChecklist.map((c) => ({ ...c, state: 'clear', note: undefined })),
  submittedBy: 'Auto-generated',
  cadence: 'Quarterly',
  annualFeeRate: 0.025,
  stepDownTrigger: 'Reduce to 1.5% after investment period ends',
  startDate: '2026-10-01',
};

export const equalisationCall: CapitalCall = {
  id: 'call-equalisation-nordic',
  fundId: 'cherry-ii',
  type: 'one-time',
  purpose: 'Equalisation — New LP Onboarding',
  amount: 310000,
  noticeDate: '2026-07-10',
  dueDate: '2026-07-31',
  recipientMode: 'manual',
  recipientLpIds: ['nordic-impact'],
  excludedLpIds: [],
  lineItems: [
    { label: 'Equalisation — catch-up on prior calls', amount: 298400 },
    { label: 'Equalisation interest', amount: 11600 },
  ],
  notices: [
    {
      lpId: 'nordic-impact',
      commitmentBefore: 0,
      commitmentAfter: 310000,
      capitalCall: 298400,
      managementFee: 0,
      workingCapital: 11600,
      amountDue: 310000,
    },
  ],
  status: 'under_review',
  assignedReviewer: 'Tom Weber',
  peerStatus: 'pending',
  reviewNotes: [],
  bunchChecklist: seriesBChecklist.map((c) => (c.id === 'equalisation'
    ? { ...c, state: 'pending', note: 'New LP joining at subsequent closing — verify catch-up across all 5 prior calls.' }
    : { ...c, state: 'pending', note: undefined })),
  submittedBy: 'Priya Sharma',
  submittedAt: '2026-07-02T06:40:00Z',
};

const bridgeRecipients = ['crimson-tide', 'azure-blue', 'eclipse-ventures', 'orion-starlight', 'sage-dynamics', 'velvet-sun', 'niamh-oconnor', 'electra-networks', 'nova-terra'];
const bridgeNotices = proRataNotices(cherryLps, bridgeRecipients, 650000 / bridgeRecipients.reduce((s, id) => s + cherryLps.find((l) => l.id === id)!.commitment, 0));
export const bridgeFinancingCall: CapitalCall = {
  id: 'call-bridge-financing',
  fundId: 'cherry-ii',
  type: 'one-time',
  purpose: 'Bridge Financing — Portfolio Co. Z',
  linkedInvestment: 'Portfolio Co. Z — Bridge note, €650,000',
  amount: round2(bridgeNotices.reduce((s, n) => s + n.capitalCall, 0)),
  noticeDate: '2026-09-05',
  dueDate: '2026-09-26',
  recipientMode: 'manual',
  recipientLpIds: bridgeRecipients,
  excludedLpIds: ['marigold', 'zara-quantum', 'griffin-archer', 'felix-star', 'nordic-impact', 'cherry-ventures-lp'],
  excludedReason: 'Not participating in this bridge tranche',
  lineItems: standardLineItems(bridgeNotices),
  notices: bridgeNotices,
  status: 'changes_requested',
  assignedReviewer: 'Tom Weber',
  peerStatus: 'changes_requested',
  reviewNotes: [
    { category: 'Amount', note: 'The €650,000 total doesn’t match the investment committee memo (€1,950,000) — please confirm which figure is correct before I can approve.', ts: '2026-09-04T14:02:00Z' },
  ],
  bunchChecklist: seriesBChecklist.map((c) => ({ ...c, state: 'pending', note: undefined })),
  submittedBy: 'Priya Sharma',
  submittedAt: '2026-09-04T10:00:00Z',
};

const defaultRecipients = ['crimson-tide', 'azure-blue', 'marigold', 'isla-rivera', 'griffin-archer', 'niamh-oconnor', 'nova-terra', 'cherry-ventures-lp'];
const followOnNotices = proRataNotices(
  cherryLps,
  defaultRecipients,
  500000 / defaultRecipients.reduce((s, id) => s + cherryLps.find((l) => l.id === id)!.commitment, 0),
  {},
  { 'griffin-archer': { status: 'in_default' } }
).map((n) => (n.lpId === 'griffin-archer' ? n : { ...n, status: 'paid' as NoticeLine['status'] }));
export const followOnDefaultCall: CapitalCall = {
  id: 'call-follow-on-w',
  fundId: 'cherry-ii',
  type: 'one-time',
  purpose: 'Follow-on — Portfolio Co. W',
  linkedInvestment: 'Portfolio Co. W — Follow-on, €1.2M round',
  amount: round2(followOnNotices.reduce((s, n) => s + n.capitalCall, 0)),
  noticeDate: '2026-01-05',
  dueDate: '2026-02-02',
  recipientMode: 'manual',
  recipientLpIds: defaultRecipients,
  excludedLpIds: [],
  lineItems: standardLineItems(followOnNotices),
  notices: followOnNotices,
  status: 'partially_paid',
  peerStatus: 'approved',
  reviewNotes: [],
  bunchChecklist: seriesBChecklist.map((c) => ({ ...c, state: 'clear', note: undefined })),
  submittedBy: 'Priya Sharma',
  submittedAt: '2025-12-20T09:00:00Z',
  approvedAt: '2025-12-22T09:00:00Z',
};

const reconciledRecipients = ['crimson-tide', 'azure-blue', 'marigold', 'zara-quantum', 'eclipse-ventures', 'isla-rivera', 'orion-starlight', 'sage-dynamics', 'griffin-archer', 'velvet-sun', 'niamh-oconnor', 'electra-networks', 'felix-star', 'nova-terra'];
const initialDrawdownNotices = proRataNotices(cherryLps, reconciledRecipients, 0.1).map((n) => ({ ...n, status: 'paid' as NoticeLine['status'] }));
export const initialDrawdownCall: CapitalCall = {
  id: 'call-initial-drawdown',
  fundId: 'cherry-ii',
  type: 'one-time',
  purpose: 'Initial Drawdown',
  amount: round2(initialDrawdownNotices.reduce((s, n) => s + n.capitalCall, 0)),
  noticeDate: '2026-01-15',
  dueDate: '2026-02-15',
  recipientMode: 'all',
  recipientLpIds: reconciledRecipients,
  excludedLpIds: [],
  lineItems: standardLineItems(initialDrawdownNotices),
  notices: initialDrawdownNotices,
  status: 'reconciled',
  peerStatus: 'approved',
  reviewNotes: [],
  bunchChecklist: seriesBChecklist.map((c) => ({ ...c, state: 'clear', note: undefined })),
  submittedBy: 'Priya Sharma',
  submittedAt: '2026-01-10T09:00:00Z',
  approvedAt: '2026-01-12T09:00:00Z',
};

export const cherryCalls = [seriesBCall, mgmtFeeCall, equalisationCall, bridgeFinancingCall, followOnDefaultCall, initialDrawdownCall];

// ---- Capital Calls: secondary funds -----------------------------------------

const motiveSeriesCNotices = proRataNotices(motiveLps, motiveLps.map((l) => l.id), 210000 / motiveLps.reduce((s, l) => s + l.commitment, 0));
export const motiveSeriesCCall: CapitalCall = {
  id: 'call-motive-series-c',
  fundId: 'motive-iii',
  type: 'one-time',
  purpose: 'Series C Initial Close',
  linkedInvestment: 'Portfolio Co. M — Series C',
  amount: round2(motiveSeriesCNotices.reduce((s, n) => s + n.capitalCall, 0)),
  noticeDate: '2026-06-28',
  dueDate: '2026-07-24',
  recipientMode: 'all',
  recipientLpIds: motiveLps.map((l) => l.id),
  excludedLpIds: [],
  lineItems: standardLineItems(motiveSeriesCNotices),
  notices: motiveSeriesCNotices,
  status: 'under_review',
  peerStatus: 'approved',
  reviewNotes: [],
  bunchChecklist: seriesBChecklist.map((c) => ({ ...c, state: 'pending', note: undefined })),
  submittedBy: 'Alexander Langholz-Baikousis',
  submittedAt: '2026-07-01T15:00:00Z',
};

const healInitialNotices = proRataNotices(healLps, healLps.map((l) => l.id), 150000 / healLps.reduce((s, l) => s + l.commitment, 0)).map((n) => ({ ...n, status: 'paid' as NoticeLine['status'] }));
export const healReconciledCall: CapitalCall = {
  id: 'call-heal-initial',
  fundId: 'heal-i',
  type: 'one-time',
  purpose: 'Initial Drawdown',
  amount: round2(healInitialNotices.reduce((s, n) => s + n.capitalCall, 0)),
  noticeDate: '2021-11-01',
  dueDate: '2021-12-01',
  recipientMode: 'all',
  recipientLpIds: healLps.map((l) => l.id),
  excludedLpIds: [],
  lineItems: standardLineItems(healInitialNotices),
  notices: healInitialNotices,
  status: 'reconciled',
  peerStatus: 'approved',
  reviewNotes: [],
  bunchChecklist: seriesBChecklist.map((c) => ({ ...c, state: 'clear', note: undefined })),
  submittedAt: '2021-10-15T09:00:00Z',
  approvedAt: '2021-10-20T09:00:00Z',
};

export const allCalls: CapitalCall[] = [...cherryCalls, motiveSeriesCCall, healReconciledCall];

// ---- Chats -------------------------------------------------------------

export const initialState: AppState = {
  activePersona: 'fundManager',
  activeFundId: 'cherry-ii',
  funds: Object.fromEntries(funds.map((f) => [f.id, f])),
  lps: Object.fromEntries(allLps.map((l) => [l.id, l])),
  calls: Object.fromEntries(allCalls.map((c) => [c.id, c])),
  chats: {
    'call-bridge-financing': {
      id: 'chat-bridge-financing',
      callId: 'call-bridge-financing',
      parked: true,
      messages: [
        { id: 'm1', author: 'Priya Sharma', authorRole: 'fundManager', body: 'Side letter for Sage Dynamics has a new MFN clause — can you confirm it’s reflected before I submit?', ts: '2026-09-04T10:02:00Z' },
        { id: 'm2', author: 'Bunch Support', authorRole: 'bunch', body: 'Checking now — give me a few minutes to verify against the amendment on file.', ts: '2026-09-04T10:04:00Z' },
        { id: 'm3', author: 'Bunch Support', authorRole: 'bunch', body: 'Confirmed — the MFN clause is applied correctly, matching the discount shown on Sage Dynamics’ line. Safe to submit.', ts: '2026-09-04T10:11:00Z' },
      ],
    },
  },
  callOrder: allCalls.map((c) => c.id),
  currentUser: {
    fundManagerName: 'Priya Sharma',
    bunchAdminName: 'Marco Rossi',
    investorName: 'James Whitfield',
    investorLpId: 'cherry-ventures-lp',
  },
};
