// src/App.js
import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login/Login';
import MainLayout from './components/Layout/MainLayout';
import Dashboard from './components/Dashboard/Dashboard';
import RoomStatusPage from './components/RoomStatus/RoomStatus';
import RegisterUser from './components/Register/RegisterUser';
import AccountingPage from './components/Accounting/Accounting';
import CheckIn from './components/CheckIn/CheckIn';
import CheckOut from './components/CheckOut/CheckOut';

// ProtectedRoute: only for authenticated users
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div>Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
};

// AdminRoute: only for admin users
const AdminRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  if (loading) return <div>Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
  if (user?.role !== 'Admin') return <Navigate to="/dashboard" replace />;
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />

        {/* Protected under MainLayout */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout title="Hotel Management System" />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="room-status" element={<RoomStatusPage />} />
          <Route path="accounting" element={<AccountingPage />} />
          <Route path="register" element={<RegisterUser />} />
          <Route path="check-in" element={<CheckIn />} />
          <Route path="check-out" element={<CheckOut />} />

          {/* Admin-only */}
          <Route
            path="register"
            element={
              <AdminRoute>
                <RegisterUser />
              </AdminRoute>
            }
          />
        </Route>

        {/* Redirect unknown to dashboard */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
