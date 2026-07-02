import { Outlet } from 'react-router-dom';
import { AppShell } from '../../components/AppShell';
import type { NavSection } from '../../components/Sidebar';
import { useAppState } from '../../state/store';

const sections: NavSection[] = [
  {
    items: [
      { label: 'Dashboard', to: '/bunch-admin/dashboard', icon: 'dashboard' },
      { label: 'Review Queue', to: '/bunch-admin/review-queue', icon: 'reviewQueue' },
      { label: 'Escalations', to: '/bunch-admin/escalations', icon: 'escalations' },
      { label: 'All Funds / Clients', to: '/bunch-admin/all-funds', icon: 'allFunds' },
      { label: 'Compliance Oversight', to: '/bunch-admin/compliance-oversight', icon: 'complianceOversight' },
      { label: 'Account Management', to: '/bunch-admin/account-management', icon: 'accountManagement' },
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
