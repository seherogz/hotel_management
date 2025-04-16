import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login from './components/Login/Login';
import RoomStatusPage from './components/RoomStatus/RoomStatus';
import { AuthProvider, useAuth } from './context/AuthContext';
import Dashboard from './components/Dashboard/Dashboard';

// Protected route component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // Show loading state or redirect to login if not authenticated
  if (loading) {
    return <div>Loading...</div>;
  }

  // Aktifleştiriyoruz - giriş yapmayan kullanıcılar login sayfasına yönlendirilecek
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

// Placeholder components for other routes
const CustomerInfo = () => <div>Customer Info Page - Coming Soon</div>;
const CheckIn = () => <div>Check-In Page - Coming Soon</div>;
const CheckOut = () => <div>Check-Out Page - Coming Soon</div>;
const Accounting = () => <div>Accounting Page - Coming Soon</div>;
const FinancialReports = () => <div>Financial Reports Page - Coming Soon</div>;
const ManageStaff = () => <div>Manage Staff Page - Coming Soon</div>;
const ManageRooms = () => <div>Manage Rooms Page - Coming Soon</div>;

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      
      <Route path="/customer-info" element={
        <ProtectedRoute>
          <CustomerInfo />
        </ProtectedRoute>
      } />
      
      <Route path="/check-in" element={
        <ProtectedRoute>
          <CheckIn />
        </ProtectedRoute>
      } />
      
      <Route path="/check-out" element={
        <ProtectedRoute>
          <CheckOut />
        </ProtectedRoute>
      } />
      
      <Route path="/room-status" element={
        <ProtectedRoute>
          <RoomStatusPage />
        </ProtectedRoute>
      } />
      
      <Route path="/accounting" element={
        <ProtectedRoute>
          <Accounting />
        </ProtectedRoute>
      } />
      
      <Route path="/financial-reports" element={
        <ProtectedRoute>
          <FinancialReports />
        </ProtectedRoute>
      } />
      
      <Route path="/manage-staff" element={
        <ProtectedRoute>
          <ManageStaff />
        </ProtectedRoute>
      } />
      
      <Route path="/manage-rooms" element={
        <ProtectedRoute>
          <ManageRooms />
        </ProtectedRoute>
      } />
      
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </div>
  );
}

export default App;