import React from 'react';
import { FaUserCircle, FaDoorOpen, FaUserPlus } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import styles from './TopBar.module.css';

const TopBar = ({ title }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    logout();
  };

  const handleCreateUser = () => {
    navigate('/register');
  };

  return (
    <div className={styles.topBar}>
      <div className={styles.pageTitle}>{title}</div>
      <div className={styles.rightSection}>
        {/* Create User Account button visible to all users */}
        <button 
          className={styles.createUserButton} 
          onClick={handleCreateUser}
          title="Kullanıcı Kaydı Oluştur"
        >
          <FaUserPlus />
          <span>Kullanıcı Kaydı Oluştur</span>
        </button>
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