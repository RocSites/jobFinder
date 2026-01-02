import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Leads from "./pages/Leads";
import LeadDetail from "./pages/LeadDetail";
import Pipeline from "./pages/Pipeline";

const App = () => (
  <Routes>
    <Route element={<Layout />}>
      <Route index element={<Home />} />
      <Route path="pipeline" element={<Pipeline />} />
      <Route path="leads">
        <Route index element={<Leads />} />
        <Route path=":leadId" element={<LeadDetail />} />
      </Route>
    </Route>
  </Routes>
);

export default App;
