import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./Auth/Login";
import Dashboard from "./Dashboard/Dashboard";
import External from "./Dashboard/External/External";
import SalesData from "./Dashboard/Salesdata/Salesdata";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />

      <Route path="/login" element={<Login />} />
      <Route path="/otp" element={<Navigate to="/login" replace />} />

      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/dashboard/internal" element={<Dashboard />} />

      <Route path="/dashboard/external" element={<External />} />

      <Route path="/sales-data" element={<SalesData />} />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default AppRoutes;