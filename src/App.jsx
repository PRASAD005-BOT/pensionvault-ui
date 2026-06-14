import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, ThemeProvider, useAuth } from './context.jsx';
import Sidebar from './components/Sidebar.jsx';
import Topbar from './components/Topbar.jsx';
import Login from './pages/Login.jsx';
import Landing from './pages/Landing.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Members from './pages/Members.jsx';
import Employers from './pages/Employers.jsx';
import Claims from './pages/Claims.jsx';
import Remittances from './pages/Remittances.jsx';
import Ledger from './pages/Ledger.jsx';
import Schemes from './pages/Schemes.jsx';
import Investments from './pages/Investments.jsx';
import Annuity from './pages/Annuity.jsx';
import Reports from './pages/Reports.jsx';
import Notifications from './pages/Notifications.jsx';
import Profile from './pages/Profile.jsx';
import './index.css';

function Layout() {
  const { user } = useAuth();
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);
  if (!user) return <Navigate to="/login" replace />;
  return (
    <div className={`app-shell ${isCollapsed ? 'collapsed' : ''}`}>
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />
      <div className="main-content">
        <Topbar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />
        <Outlet />
      </div>
    </div>
  );
}

// Login guard — if already logged in, skip login and go straight to dashboard
function LoginRoute() {
  const { user } = useAuth();
  if (user) return <Navigate to="/dashboard" replace />;
  return <Login />;
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            {/* ── PUBLIC ROUTES ── */}
            <Route path="/"        element={<Landing />} />   {/* Landing page is the root */}
            <Route path="/login"   element={<LoginRoute />} />

            {/* ── PROTECTED APP ROUTES ── */}
            <Route element={<Layout />}>
              <Route path="/dashboard"    element={<Dashboard />} />
              <Route path="/members"      element={<Members />} />
              <Route path="/employers"    element={<Employers />} />
              <Route path="/claims"       element={<Claims />} />
              <Route path="/remittances"  element={<Remittances />} />
              <Route path="/ledger"       element={<Ledger />} />
              <Route path="/schemes"      element={<Schemes />} />
              <Route path="/investments"  element={<Investments />} />
              <Route path="/annuity"      element={<Annuity />} />
              <Route path="/reports"      element={<Reports />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/profile"      element={<Profile />} />
              <Route path="*"             element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
