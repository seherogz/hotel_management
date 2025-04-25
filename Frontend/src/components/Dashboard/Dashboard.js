import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBed, FaSignInAlt, FaSignOutAlt, FaUserFriends } from 'react-icons/fa';
import styles from './Dashboard.module.css';

const Dashboard = () => {
  const navigate = useNavigate();
  
  // Bugünün tarihini formatlı olarak al
  const today = new Date().toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
      <div className={styles.dashboardContainer}>
        {/* Hoşgeldiniz Bölümü */}
        <div className={styles.welcomeSection}>
          <h1 className={styles.welcomeTitle}>Welcome to the Hotel Management System</h1>
          <h2 className={styles.welcomeSubtitle}>Today's Summary</h2>
        </div>

        {/* Özet Kartları */}
        <div className={styles.summaryCards}>
          {/* Odalar Kartı */}
          <div className={styles.summaryCard}>
            <div className={styles.cardHeader}>Rooms</div>
            <div className={styles.cardContent}>
              <div className={styles.bigNumber}>45 / 120</div>
              <div className={styles.statusDetails}>
                <div className={styles.statusItem}>
                  <span className={styles.statusDot} style={{ backgroundColor: '#4caf50' }}></span>
                  <span>45 available</span>
                </div>
                <div className={styles.statusItem}>
                  <span className={styles.statusDot} style={{ backgroundColor: '#ff9800' }}></span>
                  <span>68 occupied</span>
                </div>
                <div className={styles.statusItem}>
                  <span className={styles.statusDot} style={{ backgroundColor: '#9e9e9e' }}></span>
                  <span>7 under maintenance</span>
                </div>
              </div>
            </div>
          </div>

          {/* Check-In/Out Kartı */}
          <div className={styles.summaryCard}>
            <div className={styles.cardHeader}>Check-In/Out</div>
            <div className={styles.cardContent}>
              <div className={styles.splitInfo}>
                <div>
                  <div className={styles.mediumNumber}>15</div>
                  <div className={styles.labelText}>Check-ins today</div>
                </div>
                <div>
                  <div className={styles.mediumNumber}>12</div>
                  <div className={styles.labelText}>Check-outs today</div>
                </div>
              </div>
            </div>
          </div>

          {/* Gelir Kartı */}
          <div className={styles.summaryCard}>
            <div className={styles.cardHeader}>Revenue</div>
            <div className={styles.cardContent}>
              <div className={styles.splitInfo}>
                <div>
                  <div className={styles.mediumNumber}>24.500₺</div>
                  <div className={styles.labelText}>Today</div>
                </div>
                <div>
                  <div className={styles.mediumNumber}>356.000₺</div>
                  <div className={styles.labelText}>This month</div>
                </div>
              </div>
            </div>
          </div>

          {/* Rezervasyonlar Kartı */}
          <div className={styles.summaryCard}>
            <div className={styles.cardHeader}>Reservations</div>
            <div className={styles.cardContent}>
              <div className={styles.bigNumber}>32</div>
              <div className={styles.labelText}>Reservations in the next 7 days</div>
            </div>
          </div>
        </div>

        {/* Hızlı Erişim Butonları */}
        <div className={styles.quickAccessSection}>
          <button 
            className={`${styles.quickButton} ${styles.purpleButton}`}
            onClick={() => handleNavigation('/room-status')}
          >
            <FaBed className={styles.buttonIcon} />
            <span>View Room Status</span>
          </button>
          <button 
            className={`${styles.quickButton} ${styles.greenButton}`}
            onClick={() => handleNavigation('/check-in')}
          >
            <FaSignInAlt className={styles.buttonIcon} />
            <span>New Check-In</span>
          </button>
          <button 
            className={`${styles.quickButton} ${styles.blueButton}`}
            onClick={() => handleNavigation('/check-out')}
          >
            <FaSignOutAlt className={styles.buttonIcon} />
            <span>New Check-Out</span>
          </button>
          <button 
            className={`${styles.quickButton} ${styles.blueButton}`}
            onClick={() => handleNavigation('/customer-info')}
          >
            <FaUserFriends className={styles.buttonIcon} />
            <span>Customer List</span>
          </button>
        </div>

        {/* Veritabanı Durumu */}
        <div className={styles.databaseStatusSection}>
          <h3 className={styles.sectionTitle}>Database Status</h3>
          <div className={styles.statusGrid}>
            <div className={styles.statusItem}>
              <span className={styles.statusLabel}>Total Customers:</span>
              <span className={styles.statusValue}>250</span>
            </div>
            <div className={styles.statusItem}>
              <span className={styles.statusLabel}>Last Updated:</span>
              <span className={styles.statusValue}>26.03.2025 22:54:30</span>
            </div>
            <div className={styles.statusItem}>
              <span className={styles.statusLabel}>Database Connection:</span>
              <span className={`${styles.statusValue} ${styles.activeStatus}`}>Active</span>
            </div>
          </div>
        </div>
      </div>
  );
};

export default Dashboard; 