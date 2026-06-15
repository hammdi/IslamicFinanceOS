import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Wallet from "./pages/Wallet";
import QardHasan from "./pages/QardHasan";
import Musharaka from "./pages/Musharaka";
import Tontine from "./pages/Tontine";
import Murabaha from "./pages/Murabaha";
import Ijara from "./pages/Ijara";
import Takaful from "./pages/Takaful";
import Hawala from "./pages/Hawala";
import Sukuk from "./pages/Sukuk";
import Zakat from "./pages/Zakat";
import Waqf from "./pages/Waqf";
import Sadaqa from "./pages/Sadaqa";
import Screener from "./pages/Screener";
import Faraid from "./pages/Faraid";
import Marketplace from "./pages/Marketplace";
import CreditScore from "./pages/CreditScore";
import Family from "./pages/Family";
import Sulh from "./pages/Sulh";
import TimeBank from "./pages/TimeBank";
import Community from "./pages/Community";
import Transactions from "./pages/Transactions";
import AuditTrail from "./pages/AuditTrail";
import Notifications from "./pages/Notifications";
import Help from "./pages/Help";
import Settings from "./pages/Settings";
import Admin from "./pages/Admin";
import EmployeePortal from "./pages/EmployeePortal";
import NotFound from "./pages/NotFound";

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto" />
          <p className="text-gray-500 mt-4 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public pages — no sidebar */}
      {!user && <Route path="/" element={<Landing />} />}
      {!user && <Route path="/login" element={<div className="min-h-screen bg-gray-50 flex items-center justify-center p-4"><Login /></div>} />}
      {!user && <Route path="/register" element={<div className="min-h-screen bg-gray-50 flex items-center justify-center p-4"><Register /></div>} />}

      {/* App shell with sidebar — logged in */}
      <Route element={<Layout />}>
        {user && <Route path="/" element={<Dashboard />} />}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/wallet" element={<ProtectedRoute><Wallet /></ProtectedRoute>} />
        <Route path="/qard" element={<ProtectedRoute><QardHasan /></ProtectedRoute>} />
        <Route path="/musharaka" element={<ProtectedRoute><Musharaka /></ProtectedRoute>} />
        <Route path="/tontine" element={<ProtectedRoute><Tontine /></ProtectedRoute>} />
        <Route path="/murabaha" element={<ProtectedRoute><Murabaha /></ProtectedRoute>} />
        <Route path="/ijara" element={<ProtectedRoute><Ijara /></ProtectedRoute>} />
        <Route path="/takaful" element={<ProtectedRoute><Takaful /></ProtectedRoute>} />
        <Route path="/hawala" element={<ProtectedRoute><Hawala /></ProtectedRoute>} />
        <Route path="/sukuk" element={<ProtectedRoute><Sukuk /></ProtectedRoute>} />
        <Route path="/zakat" element={<ProtectedRoute><Zakat /></ProtectedRoute>} />
        <Route path="/waqf" element={<ProtectedRoute><Waqf /></ProtectedRoute>} />
        <Route path="/sadaqa" element={<ProtectedRoute><Sadaqa /></ProtectedRoute>} />
        <Route path="/screener" element={<ProtectedRoute><Screener /></ProtectedRoute>} />
        <Route path="/faraid" element={<ProtectedRoute><Faraid /></ProtectedRoute>} />
        <Route path="/marketplace" element={<ProtectedRoute><Marketplace /></ProtectedRoute>} />
        <Route path="/credit-score" element={<ProtectedRoute><CreditScore /></ProtectedRoute>} />
        <Route path="/family" element={<ProtectedRoute><Family /></ProtectedRoute>} />
        <Route path="/sulh" element={<ProtectedRoute><Sulh /></ProtectedRoute>} />
        <Route path="/timebank" element={<ProtectedRoute><TimeBank /></ProtectedRoute>} />
        <Route path="/community" element={<ProtectedRoute><Community /></ProtectedRoute>} />
        <Route path="/transactions" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
        <Route path="/audit" element={<ProtectedRoute><AuditTrail /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
        <Route path="/help" element={<Help />} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
            <Route path="/employee" element={<ProtectedRoute><EmployeePortal /></ProtectedRoute>} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
