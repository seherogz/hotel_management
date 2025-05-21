import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaBed, 
  FaSignInAlt, 
  FaSignOutAlt, 
  FaUserFriends, 
  FaMoneyBillWave, 
  FaCalendarAlt
} from 'react-icons/fa';
import styles from './Dashboard.module.css';
import dashboardService from '../../services/dashboardService';

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    roomSummary: {
      totalRooms: 0,
      availableRooms: 0,
      occupiedRooms: 0,
      roomsUnderMaintenance: 0
    },
    checkInOutSummary: {
      checkInsToday: 0,
      checkOutsToday: 0
    },
    revenueSummary: {
      revenueToday: 0,
      revenueThisMonth: 0
    },
    upcomingReservationsNext7Days: 0
  });
  
  // Get today's date formatted
  const today = new Date().toLocaleDateString('en-US', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const data = await dashboardService.getSummary();
        setDashboardData(data);
        setError(null);
      } catch (err) {
        setError('An error occurred while fetching data. Please try again later.');
        console.error('Dashboard data error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleNavigation = (path) => {
    navigate(path);
  };

  if (loading) {
    return <div className={styles.loadingSpinner}>Loading...</div>;
  }

  if (error) {
    return <div className={styles.errorMessage}>{error}</div>;
  }

  const { roomSummary, checkInOutSummary, revenueSummary, upcomingReservationsNext7Days } = dashboardData;

  return (
      <div className={styles.dashboardContainer}>
        {/* Welcome Section */}
        <div className={styles.welcomeSection}>
          <h1 className={styles.welcomeTitle}>Welcome to Hotel Management System</h1>
          <h2 className={styles.welcomeSubtitle}>Today's Summary</h2>
        </div>

        {/* Summary Cards */}
        <div className={styles.summaryCards}>
          {/* Rooms Card */}
          <div className={styles.summaryCard}>
            <div className={styles.cardHeader}>
              <FaBed className={styles.headerIcon} /> Rooms
            </div>
            <div className={styles.cardContent}>
              <div className={styles.bigNumber}>{roomSummary.availableRooms} / {roomSummary.totalRooms}</div>
              <div className={styles.availableRoomsLabel}>Available Rooms</div>
              <div className={styles.statusDetails}>
                <div className={styles.statusItem}>
                  <span className={styles.statusDot} style={{ backgroundColor: '#4caf50' }}></span>
                  <span>{roomSummary.availableRooms} available</span>
                </div>
                <div className={styles.statusItem}>
                  <span className={styles.statusDot} style={{ backgroundColor: '#ff9800' }}></span>
                  <span>{roomSummary.occupiedRooms} occupied</span>
                </div>
                <div className={styles.statusItem}>
                  <span className={styles.statusDot} style={{ backgroundColor: '#9e9e9e' }}></span>
                  <span>{roomSummary.roomsUnderMaintenance} under maintenance</span>
                </div>
              </div>
            </div>
          </div>

          {/* Check-In/Out Card */}
          <div className={styles.summaryCard}>
            <div className={styles.cardHeader}>
              <FaSignInAlt className={styles.headerIcon} /> Check-In/Out
            </div>
            <div className={styles.cardContent}>
              <div className={styles.checkInOutContainer}>
                <div className={styles.checkInOutItem}>
                  <div className={styles.mediumNumber}>{checkInOutSummary.checkInsToday}</div>
                  <div className={styles.checkInOutLabel}>
                     Check-ins today
                  </div>
                </div>
                <div className={styles.checkInOutItem}>
                  <div className={styles.mediumNumber}>{checkInOutSummary.checkOutsToday}</div>
                  <div className={styles.checkInOutLabel}>
                    Check-outs today
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Revenue Card */}
          <div className={styles.summaryCard}>
            <div className={styles.cardHeader}>
              <FaMoneyBillWave className={styles.headerIcon} /> Revenue
            </div>
            <div className={styles.cardContent}>
              <div className={styles.revenueContainer}>
                <div className={styles.revenueItem}>
                  <div className={styles.mediumNumber}>${revenueSummary.revenueToday.toLocaleString('en-US')}</div>
                  <div className={styles.revenueLabel}>
                    <FaMoneyBillWave className={styles.smallIcon} /> Today
                  </div>
                </div>
                <div className={styles.revenueItem}>
                  <div className={styles.mediumNumber}>${revenueSummary.revenueThisMonth.toLocaleString('en-US')}</div>
                  <div className={styles.revenueLabel}>
                    <FaMoneyBillWave className={styles.smallIcon} /> This month
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Reservations Card */}
          <div className={styles.summaryCard}>
            <div className={styles.cardHeader}>
              <FaCalendarAlt className={styles.headerIcon} /> Reservations
            </div>
            <div className={styles.cardContent}>
              <div className={styles.reservationContainer}>
                <div className={styles.bigNumber}>{upcomingReservationsNext7Days}</div>
                <div className={styles.reservationLabel}>
                  <FaCalendarAlt className={styles.smallIcon} /> Reservations in the next 7 days
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Access Buttons */}
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
      </div>
  );
};

export default Dashboard; 