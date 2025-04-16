import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  FaHome, 
  FaUserAlt, 
  FaSignInAlt, 
  FaSignOutAlt, 
  FaBed, 
  FaCalculator, 
  FaChartLine, 
  FaUsers, 
  FaDoorOpen 
} from 'react-icons/fa';
import styles from './Sidebar.module.css';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const menuItems = [
    { id: 'main', name: 'Main Page', icon: <FaHome className={styles.navIcon} />, path: '/dashboard' },
    { id: 'customer', name: 'Customer Info', icon: <FaUserAlt className={styles.navIcon} />, path: '/customer-info' },
    { id: 'checkIn', name: 'Check-In', icon: <FaSignInAlt className={styles.navIcon} />, path: '/check-in' },
    { id: 'checkOut', name: 'Check-Out', icon: <FaSignOutAlt className={styles.navIcon} />, path: '/check-out' },
    { id: 'roomStatus', name: 'Room Status', icon: <FaBed className={styles.navIcon} />, path: '/room-status' },
    { id: 'accounting', name: 'Accounting', icon: <FaCalculator className={styles.navIcon} />, path: '/accounting' },
    { id: 'financialReports', name: 'Financial Reports', icon: <FaChartLine className={styles.navIcon} />, path: '/financial-reports' },
    { id: 'staff', name: 'Manage Staff', icon: <FaUsers className={styles.navIcon} />, path: '/manage-staff' },
    { id: 'rooms', name: 'Manage Rooms', icon: <FaDoorOpen className={styles.navIcon} />, path: '/manage-rooms' },
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <div className={styles.sidebar}>
      {menuItems.map((item) => (
        <div
          key={item.id}
          className={`${styles.navItem} ${isActive(item.path) ? styles.active : ''}`}
          onClick={() => handleNavigation(item.path)}
        >
          {item.icon}
          <span className={styles.navText}>{item.name}</span>
        </div>
      ))}
    </div>
  );
};

export default Sidebar; 