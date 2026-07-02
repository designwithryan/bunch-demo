import { Outlet } from 'react-router-dom';
import { AppShell } from '../../components/AppShell';
import { useAppState } from '../../state/store';

const sections = [
  {
    items: [
      { label: 'Dashboard', to: '/investor/dashboard' },
      { label: 'My Portfolio', to: '/investor/my-portfolio' },
      { label: 'Capital Calls', to: '/investor/capital-calls' },
      { label: 'Distributions', to: '/investor/distributions' },
      { label: 'Documents', to: '/investor/documents' },
      { label: 'Requests', to: '/investor/requests' },
      { label: 'Payments', to: '/investor/payments' },
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
