import Home from "./pages/Home";
import Leads from "./pages/Leads";
import Layout from "./components/Layout";
import { Routes, Route } from "react-router-dom";

const App = () => (
  <Routes>
    <Route element={<Layout />}>
      <Route index element={<Home />} />
      <Route path="leads" element={<Leads />} />
    </Route>
  </Routes>

);

export default App;
