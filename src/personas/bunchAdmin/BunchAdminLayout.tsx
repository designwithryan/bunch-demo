import { Outlet } from 'react-router-dom';
import { AppShell } from '../../components/AppShell';
import { useAppState } from '../../state/store';

const sections = [
  {
    items: [
      { label: 'Dashboard', to: '/bunch-admin/dashboard' },
      { label: 'Review Queue', to: '/bunch-admin/review-queue' },
      { label: 'Escalations', to: '/bunch-admin/escalations' },
      { label: 'All Funds / Clients', to: '/bunch-admin/all-funds' },
      { label: 'Compliance Oversight', to: '/bunch-admin/compliance-oversight' },
      { label: 'Account Management', to: '/bunch-admin/account-management' },
    ],
  },
];

export function BunchAdminLayout() {
  const { state } = useAppState();
  return (
    <AppShell sections={sections} footerName={state.currentUser.bunchAdminName} footerRole="Bunch Ops Reviewer">
      <Outlet />
    </AppShell>
  );
}
