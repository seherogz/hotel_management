import React from 'react';
import { FaUserCircle, FaDoorOpen } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import styles from './TopBar.module.css';

const TopBar = ({ title }) => {
  const { user, logout } = useAuth();
  
  const handleLogout = () => {
    logout();
  };

  return (
    <div className={styles.topBar}>
      <div className={styles.pageTitle}>{title}</div>
      <div className={styles.rightSection}>
        <div className={styles.userInfo}>
          <div className={styles.userAvatar}>
            <FaUserCircle />
          </div>
          <div className={styles.userName}>
            {user ? user.fullName || 'Utku Adanur' : 'Guest User'}
          </div>
        </div>
        <button 
          className={styles.logoutButton} 
          onClick={handleLogout}
          title="Logout"
        >
          <FaDoorOpen />
        </button>
      </div>
    </div>
  );
};

export default TopBar; 