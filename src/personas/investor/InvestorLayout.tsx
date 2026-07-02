import { Outlet } from 'react-router-dom';
import { AppShell } from '../../components/AppShell';
import type { NavSection } from '../../components/Sidebar';
import { useAppState } from '../../state/store';

const sections: NavSection[] = [
  {
    items: [
      { label: 'Dashboard', to: '/investor/dashboard', icon: 'dashboard' },
      { label: 'My Portfolio', to: '/investor/my-portfolio', icon: 'portfolio' },
      { label: 'Capital Calls', to: '/investor/capital-calls', icon: 'capitalCalls' },
      { label: 'Distributions', to: '/investor/distributions', icon: 'distributions' },
      { label: 'Documents', to: '/investor/documents', icon: 'documents' },
      { label: 'Requests', to: '/investor/requests', icon: 'requests' },
      { label: 'Payments', to: '/investor/payments', icon: 'payments' },
    ],
  },
];

export function InvestorLayout() {
  const { state } = useAppState();
  return (
    <AppShell sections={sections} footerName={state.currentUser.investorName} footerRole="LP Investor">
      <Outlet />
    </AppShell>
  );
}
