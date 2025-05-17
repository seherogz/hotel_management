// src/components/auth/ProtectedRoute.js
import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext'; // AuthContext yolunu kontrol edin
import NotAllowed from '../common/NotAllowed'; // NotAllowed bileşeninin yolunu kontrol edin
import { CircularProgress, Box } from '@mui/material'; // Yükleme göstergesi için

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, userInfo, loadingAuth } = useContext(AuthContext);

  if (loadingAuth) {
    // Auth durumu yüklenirken bekleme ekranı göster
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    // Kullanıcı giriş yapmamışsa login sayfasına yönlendir
    return <Navigate to="/login" replace />;
  }

  const userRole = userInfo?.role; // userInfo.role 'Admin', 'Receptionist', 'Accountant' gibi bir değer olmalı

  // Admin tüm sayfalara erişebilir
  if (userRole === 'Admin' || userRole === 'SuperAdmin') {
    return children;
  }

  // Belirli roller için kontrol
  if (allowedRoles && allowedRoles.includes(userRole)) {
    return children;
  }

  // Hiçbir koşul sağlanmazsa yetkisiz erişim sayfasını göster
  return <NotAllowed />;
};

export default ProtectedRoute;