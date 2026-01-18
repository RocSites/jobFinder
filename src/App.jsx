import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Leads from "./pages/Leads";
import LeadDetail from "./pages/LeadDetail";
import Pipeline from "./pages/Pipeline";
import Referrals from "./pages/Referrals";
import ReferralDetail from "./pages/ReferralDetail";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ResetPassword from "./pages/ResetPassword";
import Profile from "./pages/Profile";

const App = () => (
  <AuthProvider>
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="profile" element={<Profile />} />
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
      </Route>
    </Routes>
  </AuthProvider>
);

export default App;
