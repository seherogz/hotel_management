import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext'; // AuthContext yolunuzu kontrol edin

// Bileşenler
import Login from './components/Login/Login';
import MainLayout from './components/Layout/MainLayout';
import Dashboard from './components/Dashboard/Dashboard';
import RoomStatusPage from './components/RoomStatus/RoomStatus';
import RegisterUser from './components/Register/RegisterUser';
import AccountingPage from './components/Accounting/Accounting';
import CheckIn from './components/CheckIn/CheckIn';
import CheckOut from './components/CheckOut/CheckOut';
import CustomerInfo from './components/Customers/CustomerInfo';
import Staff from './components/Staff/Staff';
import ManageRoom from './components/ManageRoom/ManageRoom'; // Bu bileşenin var olduğunu varsayıyoruz
import FinancialReports from './components/FinancialReports/FinancialReports'; // Yeni eklenen finansal raporlar bileşeni

// Yetkisiz Erişim Bileşeni (Kullanıcının sağladığı yoldan import edilecek)
import NotAllowed from './components/common/NotAllowed'; // Kullanıcının NotAllowed.js dosyasının yolu

// MUI Yükleme Bileşeni (İdealde ayrı bir dosyada olabilir)
import { Box, CircularProgress, Typography } from '@mui/material';

// --- Başlangıç: İdealde ayrı dosyalarda olacak yardımcı bileşenler ---
const LoadingScreen = () => (
  <Box display="flex" justifyContent="center" alignItems="center" minHeight="calc(100vh - 64px)">
    <CircularProgress />
    <Typography sx={{ ml: 2 }}>Yükleniyor...</Typography>
  </Box>
);

// ProtectedRoute: Rol tabanlı erişim kontrolü sağlar
// Bu bileşen App.js içinde tanımlanacak ve kullanıcının sağladığı mantığı içerecek
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, loading } = useAuth(); // AuthContext'ten user ve loading'i al
  const location = useLocation();

  if (loading) {
    return <LoadingScreen />; // Auth durumu yüklenirken bekleme ekranı
  }

  if (!isAuthenticated) {
    // Kullanıcı giriş yapmamışsa login sayfasına yönlendir
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // user objesinin ve user.userType'ın varlığını kontrol et
  // AuthContext'te user.userType, roller dizisinin ilk elemanı olarak ayarlanmıştı.
  const userRole = user?.userType;

  // Eğer user veya userRole tanımsızsa (beklenmedik bir durum), NotAllowed göster
  if (!userRole) {
      console.error("ProtectedRoute: Kullanıcı rolü (user.userType) bulunamadı.", user);
      return <NotAllowed />; // İçe aktarılan NotAllowed bileşeni
  }

  // Admin veya SuperAdmin her zaman erişebilir.
  if (userRole === 'Admin' || userRole === 'SuperAdmin') {
    return children;
  }

  // Belirli roller için kontrol
  if (allowedRoles && allowedRoles.includes(userRole)) {
    return children;
  }

  // Hiçbir koşul sağlanmazsa yetkisiz erişim sayfasını göster
  return <NotAllowed />; // İçe aktarılan NotAllowed bileşeni
};

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Herkesin erişebileceği Login sayfası */}
        <Route path="/login" element={<Login />} />

        {/* MainLayout altındaki korumalı rotalar */}
        <Route
          path="/"
          element={
            <AuthWrapper> {/* Sadece giriş yapmış kullanıcılar MainLayout'a erişebilir */}
              <MainLayout title="Otel Yönetim Sistemi" />
            </AuthWrapper>
          }
        >
          {/* index rotası /dashboard'a yönlendirir */}
          <Route index element={<Navigate to="dashboard" replace />} />

          {/* Dashboard: Admin, Receptionist, Accountant (SuperAdmin de Admin olduğu için erişebilir) */}
          <Route
            path="dashboard"
            element={
              <ProtectedRoute allowedRoles={['Receptionist', 'Accountant']}>
                {/* Admin/SuperAdmin zaten ProtectedRoute içinde genel erişime sahip olduğu için
                    burada ayrıca belirtmeye gerek yok, ama açıklık için eklenebilir:
                    allowedRoles={['Admin', 'SuperAdmin', 'Receptionist', 'Accountant']} 
                    Ancak mevcut ProtectedRoute mantığıyla Admin/SuperAdmin her zaman geçer.
                    Bu yüzden sadece diğer rolleri belirtmek yeterli.
                */}
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Receptionist (ve Admin/SuperAdmin) için sayfalar */}
          <Route
            path="customer-info"
            element={
              <ProtectedRoute allowedRoles={['Receptionist']}>
                <CustomerInfo />
              </ProtectedRoute>
            }
          />
          <Route
            path="check-in"
            element={
              <ProtectedRoute allowedRoles={['Receptionist']}>
                <CheckIn />
              </ProtectedRoute>
            }
          />
          <Route
            path="check-out"
            element={
              <ProtectedRoute allowedRoles={['Receptionist']}>
                <CheckOut />
              </ProtectedRoute>
            }
          />
          <Route
            path="room-status"
            element={
              <ProtectedRoute allowedRoles={['Receptionist']}>
                <RoomStatusPage />
              </ProtectedRoute>
            }
          />

          {/* Accountant (ve Admin/SuperAdmin) için sayfalar */}
          <Route
            path="accounting"
            element={
              <ProtectedRoute allowedRoles={['Accountant']}>
                <AccountingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="financial-reports"
            element={
              <ProtectedRoute allowedRoles={['Accountant']}>
                <FinancialReports />
              </ProtectedRoute>
            }
          />

          {/* Sadece Admin (ve SuperAdmin) için sayfalar */}
          {/* ProtectedRoute Admin/SuperAdmin'e zaten izin verdiği için allowedRoles belirtmeye gerek yok,
              ancak belirtmek istenirse ['Admin', 'SuperAdmin'] olabilir.
              Mevcut mantıkla boş bırakmak veya ['Admin'] yazmak yeterli olacaktır.
          */}
          <Route
            path="staff"
            element={
              <ProtectedRoute allowedRoles={[]}> {/* Sadece Admin/SuperAdmin erişebilir */}
                <Staff />
              </ProtectedRoute>
            }
          />
          <Route
            path="register"
            element={
              <ProtectedRoute allowedRoles={[]}> {/* Sadece Admin/SuperAdmin erişebilir */}
                <RegisterUser />
              </ProtectedRoute>
            }
          />
          <Route
            path="manage-rooms"
            element={
              <ProtectedRoute allowedRoles={[]}> {/* Sadece Admin/SuperAdmin erişebilir */}
                <ManageRoom />
              </ProtectedRoute>
            }
          />

          {/* MainLayout içinde tanımlanmamış bir yola gidilirse dashboard'a yönlendir */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />

        </Route> {/* MainLayout rotasının sonu */}

        {/* Uygulama genelinde tanımlanmamış bir yola gidilirse ana sayfaya (login kontrolüyle) yönlendir */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

// MainLayout'a erişim için basit bir kimlik doğrulama sarmalayıcısı
const AuthWrapper = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();
    const location = useLocation();

    if (loading) return <LoadingScreen />;
    if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
    return children;
};

export default App;
