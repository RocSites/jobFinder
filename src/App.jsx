import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Leads from "./pages/Leads";
import LeadDetail from "./pages/LeadDetail";
import Pipeline from "./pages/Pipeline";
import Referrals from "./pages/Referrals";
import ReferralDetail from "./pages/ReferralDetail";

const App = () => (
  <Routes>
    <Route element={<Layout />}>
      <Route index element={<Home />} />
      <Route path="pipeline" element={<Pipeline />} />
      <Route path="leads">
        <Route index element={<Leads />} />
        <Route path=":leadId" element={<LeadDetail />} />
      </Route>
      <Route path="referrals">
        <Route index element={<Referrals />} />
        <Route path=":referralId" element={<ReferralDetail />} />
      </Route>
    </Route>
  </Routes>
);

export default App;
