// src/components/Layout/Sidebar.js

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  FaHome,
  FaUserAlt, // Müşteri ikonu
  FaSignInAlt,
  FaSignOutAlt,
  FaBed,
  FaCalculator,
  FaChartLine,
  FaUsers, // Staff ikonu (Müşteri için FaUserAlt kullanıldı)
  FaDoorOpen
} from 'react-icons/fa';
import styles from './Sidebar.module.css'; // Stil dosyasını import ediyoruz

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Menü öğeleri dizisi
  // Customer Info öğesinin path'i '/customers' olarak güncellendi
  const menuItems = [
    { id: 'main', name: 'Main Page', icon: <FaHome className={styles.navIcon} />, path: '/dashboard' }, //
    { id: 'customer', name: 'Customer Info', icon: <FaUserAlt className={styles.navIcon} />, path: '/customer-info' }, // Path güncellendi
    { id: 'checkIn', name: 'Check-In', icon: <FaSignInAlt className={styles.navIcon} />, path: '/check-in' }, //
    { id: 'checkOut', name: 'Check-Out', icon: <FaSignOutAlt className={styles.navIcon} />, path: '/check-out' }, //
    { id: 'roomStatus', name: 'Room Status', icon: <FaBed className={styles.navIcon} />, path: '/room-status' }, //
    { id: 'accounting', name: 'Accounting', icon: <FaCalculator className={styles.navIcon} />, path: '/accounting' }, //
    { id: 'financialReports', name: 'Financial Reports', icon: <FaChartLine className={styles.navIcon} />, path: '/financial-reports' }, //
    { id: 'staff', name: 'Manage Staff', icon: <FaUsers className={styles.navIcon} />, path: '/manage-staff' }, //
    { id: 'rooms', name: 'Manage Rooms', icon: <FaDoorOpen className={styles.navIcon} />, path: '/manage-rooms' }, //
  ];

  // Mevcut yolun aktif olup olmadığını kontrol eden fonksiyon
  const isActive = (path) => {
    return location.pathname === path;
  };

  // Belirtilen yola yönlendiren fonksiyon
  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <div className={styles.sidebar}> {/* Sidebar ana div'i */}
      {/* Menü öğelerini map ile dönüp render ediyoruz */}
      {menuItems.map((item) => (
        <div
          key={item.id}
          // Aktifse 'active' class'ını ekliyoruz
          className={`${styles.navItem} ${isActive(item.path) ? styles.active : ''}`}
          onClick={() => handleNavigation(item.path)} // Tıklanınca yönlendirme yapılıyor
        >
          {item.icon} {/* İkon */}
          <span className={styles.navText}>{item.name}</span> {/* Menü adı */}
        </div>
      ))}
    </div>
  );
};

export default Sidebar;