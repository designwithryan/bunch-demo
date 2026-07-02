import { Navigate, Route, Routes } from 'react-router-dom';
import { FundManagerLayout } from './personas/fundManager/FundManagerLayout';
import { FundManagerDashboard } from './personas/fundManager/Dashboard';
import { FundManagerCapitalCalls } from './personas/fundManager/CapitalCalls';
import { NewCapitalCallWizard } from './personas/fundManager/NewCapitalCall/Wizard';
import { Reviews } from './personas/fundManager/Reviews';
import { DefaultRemedy } from './personas/fundManager/DefaultRemedy';
import { Reconciliation } from './personas/fundManager/Reconciliation';

import { BunchAdminLayout } from './personas/bunchAdmin/BunchAdminLayout';
import { BunchAdminDashboard } from './personas/bunchAdmin/Dashboard';
import { ReviewQueue } from './personas/bunchAdmin/ReviewQueue';

import { InvestorLayout } from './personas/investor/InvestorLayout';
import { InvestorDashboard } from './personas/investor/Dashboard';
import { MyPortfolio } from './personas/investor/MyPortfolio';
import { InvestorCapitalCalls } from './personas/investor/CapitalCalls';
import { NoticeDetail } from './personas/investor/NoticeDetail';

import { Placeholder } from './components/Placeholder';
import { DemoGuide } from './components/DemoGuide';

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/fund-manager/dashboard" replace />} />

        <Route path="/fund-manager" element={<FundManagerLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<FundManagerDashboard />} />
          <Route path="capital-calls" element={<FundManagerCapitalCalls />} />
          <Route path="capital-calls/new" element={<NewCapitalCallWizard />} />
          <Route path="capital-calls/:callId/default/:lpId" element={<DefaultRemedy />} />
          <Route path="capital-calls/:callId/reconcile" element={<Reconciliation />} />
          <Route path="reviews" element={<Reviews />} />
          <Route path="portfolio" element={<Placeholder title="Portfolio" />} />
          <Route path="funds" element={<Placeholder title="Funds" />} />
          <Route path="distributions" element={<Placeholder title="Distributions" />} />
          <Route path="fund-accounting" element={<Placeholder title="Fund Accounting & Reporting" />} />
          <Route path="treasury" element={<Placeholder title="Treasury" />} />
          <Route path="investors" element={<Placeholder title="Investors" />} />
          <Route path="compliance" element={<Placeholder title="Compliance" />} />
          <Route path="data-room" element={<Placeholder title="Data Room" />} />
          <Route path="tasks" element={<Placeholder title="Tasks" />} />
        </Route>

        <Route path="/bunch-admin" element={<BunchAdminLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<BunchAdminDashboard />} />
          <Route path="review-queue" element={<ReviewQueue />} />
          <Route path="escalations" element={<Placeholder title="Escalations" />} />
          <Route path="all-funds" element={<Placeholder title="All Funds / Clients" />} />
          <Route path="compliance-oversight" element={<Placeholder title="Compliance Oversight" />} />
          <Route path="account-management" element={<Placeholder title="Account Management" />} />
        </Route>

        <Route path="/investor" element={<InvestorLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<InvestorDashboard />} />
          <Route path="my-portfolio" element={<MyPortfolio />} />
          <Route path="capital-calls" element={<InvestorCapitalCalls />} />
          <Route path="capital-calls/:callId" element={<NoticeDetail />} />
          <Route path="distributions" element={<Placeholder title="Distributions" />} />
          <Route path="documents" element={<Placeholder title="Documents" />} />
          <Route path="requests" element={<Placeholder title="Requests" />} />
          <Route path="payments" element={<Placeholder title="Payments" />} />
        </Route>

        <Route path="*" element={<Navigate to="/fund-manager/dashboard" replace />} />
      </Routes>
      <DemoGuide />
    </>
  );
}
