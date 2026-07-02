export type NavIconName =
  | 'dashboard'
  | 'portfolio'
  | 'funds'
  | 'capitalCalls'
  | 'reviews'
  | 'distributions'
  | 'fundAccounting'
  | 'treasury'
  | 'investors'
  | 'compliance'
  | 'dataRoom'
  | 'tasks'
  | 'reviewQueue'
  | 'escalations'
  | 'allFunds'
  | 'complianceOversight'
  | 'accountManagement'
  | 'documents'
  | 'requests'
  | 'payments';

const common = {
  width: 16,
  height: 16,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

const PATHS: Record<NavIconName, React.ReactNode> = {
  dashboard: (
    <>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
    </>
  ),
  portfolio: (
    <>
      <rect x="3" y="7.5" width="18" height="12" rx="2" />
      <path d="M8 7.5V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1.5" />
      <path d="M3 12.5h18" />
    </>
  ),
  funds: (
    <>
      <path d="M12 3 21 8l-9 5-9-5 9-5Z" />
      <path d="M3 12l9 5 9-5" />
      <path d="M3 16.5l9 5 9-5" />
    </>
  ),
  capitalCalls: (
    <>
      <path d="M4 12a8 8 0 0 1 14-5.3L20 8" />
      <path d="M20 4v4h-4" />
      <path d="M20 12a8 8 0 0 1-14 5.3L4 16" />
      <path d="M4 20v-4h4" />
    </>
  ),
  reviews: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="2.5" />
      <path d="M7.5 12.5l3 3 6-6.5" />
    </>
  ),
  distributions: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5v9M8.5 11l3.5-3.5L15.5 11" />
    </>
  ),
  fundAccounting: (
    <>
      <rect x="4.5" y="3.5" width="15" height="17" rx="2" />
      <path d="M8 8h8M8 12h8M8 16h5" />
    </>
  ),
  treasury: (
    <>
      <path d="M3 9.5 12 4l9 5.5" />
      <path d="M5 9.5v9M9.5 9.5v9M14.5 9.5v9M19 9.5v9" />
      <path d="M3.5 18.5h17" />
    </>
  ),
  investors: (
    <>
      <circle cx="8.5" cy="8" r="3" />
      <path d="M2.5 19c0-3 2.7-5.2 6-5.2s6 2.2 6 5.2" />
      <circle cx="16.5" cy="8.5" r="2.3" />
      <path d="M15.7 13.9c2.6.3 4.8 2.3 4.8 5.1" />
    </>
  ),
  compliance: (
    <>
      <path d="M12 3.5 19.5 6v6c0 4.5-3.2 7.5-7.5 8.5-4.3-1-7.5-4-7.5-8.5V6L12 3.5Z" />
      <path d="M9 12l2.2 2.2L15.5 10" />
    </>
  ),
  dataRoom: (
    <>
      <path d="M3.5 7.5A1.5 1.5 0 0 1 5 6h4.2l1.6 2H19a1.5 1.5 0 0 1 1.5 1.5v8A1.5 1.5 0 0 1 19 19H5a1.5 1.5 0 0 1-1.5-1.5v-10Z" />
    </>
  ),
  tasks: (
    <>
      <path d="M4.5 6.5h2M4.5 12h2M4.5 17.5h2" />
      <path d="M9.5 6.5h10M9.5 12h10M9.5 17.5h10" />
    </>
  ),
  reviewQueue: (
    <>
      <path d="M3.5 12h4.2l1.3 2.5h5.6l1.3-2.5h4.2" />
      <path d="M5 6.5h14l1.5 5.5V17a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 17v-5l1.5-5.5Z" />
    </>
  ),
  escalations: (
    <>
      <path d="M12 4 21.5 20h-19L12 4Z" />
      <path d="M12 10.5v4M12 17.2v.1" />
    </>
  ),
  allFunds: (
    <>
      <path d="M5 20.5V5.5A1.5 1.5 0 0 1 6.5 4h7A1.5 1.5 0 0 1 15 5.5v15" />
      <path d="M15 10.5h3.5A1.5 1.5 0 0 1 20 12v8" />
      <path d="M8 8h1M11 8h1M8 11.5h1M11 11.5h1M8 15h1M11 15h1" />
      <path d="M4 20.5h16" />
    </>
  ),
  complianceOversight: (
    <>
      <path d="M12 3.5 19.5 6v6c0 4.5-3.2 7.5-7.5 8.5-4.3-1-7.5-4-7.5-8.5V6L12 3.5Z" />
      <circle cx="12" cy="11" r="2.2" />
    </>
  ),
  accountManagement: (
    <>
      <circle cx="10" cy="8.5" r="3.2" />
      <path d="M4 19c0-3.2 2.7-5.5 6-5.5s6 2.3 6 5.5" />
      <circle cx="18" cy="7.5" r="1.4" />
      <path d="M18 10.2v1.1M18 15v1.1M15.9 12.6h-1.1M21.2 12.6h-1.1M16.5 9.9l-.8.8M20.3 14.5l-.8.8M16.5 15.3l-.8-.8M20.3 10.7l-.8-.8" />
    </>
  ),
  documents: (
    <>
      <path d="M7 3.5h7l4 4v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-16a1 1 0 0 1 1-1Z" />
      <path d="M14 3.5v4h4" />
      <path d="M8.5 13h7M8.5 16.5h7" />
    </>
  ),
  requests: (
    <>
      <path d="M4 5.5h16a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H9l-4 3.5V16.5H4a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1Z" />
    </>
  ),
  payments: (
    <>
      <rect x="3" y="5.5" width="18" height="13" rx="2" />
      <path d="M3 9.5h18" />
      <path d="M6.5 14.5h4" />
    </>
  ),
};

export function NavIcon({ name }: { name: NavIconName }) {
  return (
    <svg {...common} aria-hidden>
      {PATHS[name]}
    </svg>
  );
}
