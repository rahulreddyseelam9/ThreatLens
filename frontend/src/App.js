import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/layout/ProtectedRoute";

import Home from "@/pages/Home";
import Platform from "@/pages/Platform";
import About from "@/pages/About";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Scanner from "@/pages/Scanner";
import BatchScanner from "@/pages/BatchScanner";
import ScanResult from "@/pages/ScanResult";
import Intelligence from "@/pages/Intelligence";
import Fusion from "@/pages/Fusion";
import AIAnalysis from "@/pages/AIAnalysis";
import EmergingThreats from "@/pages/EmergingThreats";
import Dashboard from "@/pages/Dashboard";
import History from "@/pages/History";
import Recommendations from "@/pages/Recommendations";
import Reports from "@/pages/Reports";
import Alerts from "@/pages/Alerts";
import MitreAttack from "@/pages/MitreAttack";

const protectedRoutes = [
  ["/dashboard", Dashboard],
  ["/scanner", Scanner],
  ["/batch-scanner", BatchScanner],
  ["/scan-result", ScanResult],
  ["/intelligence", Intelligence],
  ["/fusion", Fusion],
  ["/ai-analysis", AIAnalysis],
  ["/emerging-threats", EmergingThreats],
  ["/history", History],
  ["/recommendations", Recommendations],
  ["/reports", Reports],
  ["/alerts", Alerts],
  ["/mitre-attack", MitreAttack],
];

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/platform" element={<Platform />} />
            <Route path="/about" element={<About />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            {protectedRoutes.map(([path, Comp]) => (
              <Route key={path} path={path} element={<ProtectedRoute><Comp /></ProtectedRoute>} />
            ))}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </div>
  );
}

export default App;
