import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, StatusBar, Alert, Modal, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { authService } from '@/services/api';
import dashboardService from '@/services/dashboardService';

export default function DashboardScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user, logout } = useAuth();
  const [registerModalVisible, setRegisterModalVisible] = useState(false);
  const [registerData, setRegisterData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    userName: '',
    password: '',
    confirmPassword: '',
    role: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  
  // Dashboard Data State
  const [dashboardData, setDashboardData] = useState({
    roomSummary: {
      totalRooms: 0,
      availableRooms: 0,
      occupiedRooms: 0,
      maintenanceRooms: 0
    },
    checkInOutSummary: {
      todaysCheckIns: 0,
      todaysCheckOuts: 0
    },
    revenueSummary: {
      todaysRevenue: 0,
      thisMonthRevenue: 0,
      revenueThisMonth: 0
    },
    upcomingReservationsNext7Days: 0
  });
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(true);
  const [dashboardError, setDashboardError] = useState(null);
  
  // Available roles
  const roles = ['Accountant', 'Receptionist'];
  
  // Use the email from the context or params as a fallback
  const userEmail = user?.email || params.email || "user@example.com";
  
  // Fetch dashboard data when component mounts
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Function to fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setIsLoadingDashboard(true);
      setDashboardError(null);
      
      console.log('Fetching dashboard summary data...');
      const data = await dashboardService.getSummary();
      console.log('Dashboard data received:', data);
      
      // Validate received data contains the expected structure
      const validatedData = {
        roomSummary: {
          totalRooms: data?.roomSummary?.totalRooms || 0,
          availableRooms: data?.roomSummary?.availableRooms || 0,
          occupiedRooms: data?.roomSummary?.occupiedRooms || 0,
          maintenanceRooms: data?.roomSummary?.maintenanceRooms || 0
        },
        checkInOutSummary: {
          todaysCheckIns: data?.checkInOutSummary?.checkInsToday || 
                         data?.checkInOutSummary?.todaysCheckIns || 0,
          todaysCheckOuts: data?.checkInOutSummary?.checkOutsToday || 
                          data?.checkInOutSummary?.todaysCheckOuts || 0
        },
        revenueSummary: {
          todaysRevenue: data?.revenueSummary?.revenueToday || 
                       data?.revenueSummary?.todaysRevenue || 0,
          thisMonthRevenue: data?.revenueSummary?.thisMonthRevenue || 
                          data?.revenueSummary?.revenueThisMonth || 
                          data?.revenueSummary?.monthlyRevenue || 0,
          revenueThisMonth: data?.revenueSummary?.revenueThisMonth || 
                          data?.revenueSummary?.thisMonthRevenue || 
                          data?.revenueSummary?.monthlyRevenue || 0
        },
        upcomingReservationsNext7Days: data?.upcomingReservationsNext7Days || 0
      };
      
      setDashboardData(validatedData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setDashboardError(error instanceof Error ? error.message : 'An error occurred while fetching dashboard data');
    } finally {
      setIsLoadingDashboard(false);
    }
  };
  
  const handleLogout = async () => {
    try {
      console.log('Logging out...');
      const success = await logout();
      
      if (success) {
        console.log('Logged out successfully, redirecting to login screen...');
        router.replace('../login');
      } else {
        console.error('Logout was not successful');
      }
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const handleRegister = async () => {
    // Validate form data
    if (!registerData.firstName || !registerData.lastName || !registerData.email || 
        !registerData.userName || !registerData.password || !registerData.confirmPassword || !registerData.role) {
      Alert.alert('Validation Error', 'All fields are required');
      return;
    }

    if (registerData.password !== registerData.confirmPassword) {
      Alert.alert('Validation Error', 'Passwords do not match');
      return;
    }

    try {
      setIsLoading(true);
      
      // Call the API to register the user
      const response = await authService.register(registerData);
      
      // Close modal and show success message
      setRegisterModalVisible(false);
      setRegisterData({
        firstName: '',
        lastName: '',
        email: '',
        userName: '',
        password: '',
        confirmPassword: '',
        role: '',
      });
      
      Alert.alert('Success', 'Employee registered successfully');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to register employee';
      Alert.alert('Registration Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  
  const selectRole = (role: string) => {
    setRegisterData({...registerData, role});
    setShowRoleDropdown(false);
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Custom Header with Register and Logout */}
<View style={styles.header}>
  <Text style={styles.headerTitle}>Hotel Management System</Text>
  <View style={styles.headerButtons}>
    {/* Conditionally render Register button based on Admin OR SuperAdmin role */}
    {(user?.roles?.includes('Admin') || user?.roles?.includes('SuperAdmin')) && (
      <TouchableOpacity
        style={styles.registerButton}
        onPress={() => setRegisterModalVisible(true)}
      >
        <MaterialIcons name="person-add" size={24} color="#fff" />
        <Text style={styles.buttonText}>Register</Text>
      </TouchableOpacity>
    )}
    <TouchableOpacity
      style={styles.logoutButton}
      onPress={handleLogout}
    >
      <MaterialIcons name="logout" size={24} color="#fff" />
      <Text style={styles.buttonText}>Logout</Text>
    </TouchableOpacity>
  </View>
</View>
      
      {/* Registration Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={registerModalVisible}
        onRequestClose={() => setRegisterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Register New Employee</Text>
              <TouchableOpacity onPress={() => setRegisterModalVisible(false)}>
                <MaterialIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>First Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter first name"
                  value={registerData.firstName}
                  onChangeText={(text) => setRegisterData({...registerData, firstName: text})}
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Last Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter last name"
                  value={registerData.lastName}
                  onChangeText={(text) => setRegisterData({...registerData, lastName: text})}
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter email address"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={registerData.email}
                  onChangeText={(text) => setRegisterData({...registerData, email: text})}
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Username</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter username"
                  autoCapitalize="none"
                  value={registerData.userName}
                  onChangeText={(text) => setRegisterData({...registerData, userName: text})}
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Role</Text>
                <TouchableOpacity 
                  style={styles.roleSelector}
                  onPress={() => setShowRoleDropdown(!showRoleDropdown)}
                >
                  <Text style={registerData.role ? styles.roleText : styles.placeholderText}>
                    {registerData.role || "Select a role"}
                  </Text>
                  <MaterialIcons name={showRoleDropdown ? "arrow-drop-up" : "arrow-drop-down"} size={24} color="#555" />
                </TouchableOpacity>
                
                {showRoleDropdown && (
                  <View style={styles.roleDropdown}>
                    {roles.map((role) => (
                      <TouchableOpacity 
                        key={role} 
                        style={styles.roleOption}
                        onPress={() => selectRole(role)}
                      >
                        <Text style={styles.roleOptionText}>{role}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter password"
                  secureTextEntry={true}
                  value={registerData.password}
                  onChangeText={(text) => setRegisterData({...registerData, password: text})}
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Confirm Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Confirm password"
                  secureTextEntry={true}
                  value={registerData.confirmPassword}
                  onChangeText={(text) => setRegisterData({...registerData, confirmPassword: text})}
                />
              </View>
              
              <TouchableOpacity 
                style={styles.registerSubmitButton} 
                onPress={handleRegister}
                disabled={isLoading}
              >
                <Text style={styles.registerSubmitButtonText}>
                  {isLoading ? 'Processing...' : 'Register Employee'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
      
      <ScrollView style={styles.content}>
        {/* Greeting */}
        <Text style={styles.greeting}>Welcome to Hotel Management System</Text>
        <Text style={styles.userInfo}>Logged in as: {userEmail}</Text>
        
        {/* Daily Summary */}
        <View style={styles.summaryHeaderContainer}>
        <Text style={styles.sectionTitle}>Today's Summary</Text>
          {isLoadingDashboard ? null : (
            <TouchableOpacity 
              style={styles.refreshButton} 
              onPress={fetchDashboardData}
            >
              <MaterialIcons name="refresh" size={18} color="#6B3DC9" />
              <Text style={styles.refreshText}>Refresh</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {/* Loading Indicator */}
        {isLoadingDashboard ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6B3DC9" />
            <Text style={styles.loadingText}>Loading dashboard data...</Text>
          </View>
        ) : dashboardError ? (
          <View style={styles.errorContainer}>
            <MaterialIcons name="error-outline" size={40} color="#E53935" />
            <Text style={styles.errorText}>{dashboardError}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchDashboardData}>
              <Text style={styles.retryButtonText}>RETRY</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* Stats Cards */
        <View style={styles.statsContainer}>
          {/* Rooms Card */}
          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <MaterialIcons name="hotel" size={24} color="#4C3A89" />
              <Text style={styles.statTitle}>Rooms</Text>
            </View>
              <Text style={styles.statValue}>
                {dashboardData.roomSummary?.availableRooms || 0}/{dashboardData.roomSummary?.totalRooms || 0}
              </Text>
            <Text style={styles.statSubtitle}>Available rooms</Text>
            <View style={styles.statDetails}>
                <Text style={styles.statDetailText}>{dashboardData.roomSummary?.availableRooms || 0} available</Text>
                <Text style={styles.statDetailText}>{dashboardData.roomSummary?.occupiedRooms || 0} occupied</Text>
                <Text style={styles.statDetailText}>{dashboardData.roomSummary?.maintenanceRooms || 0} maintenance</Text>
            </View>
          </View>
          
          {/* Check In/Out Card */}
          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <MaterialIcons name="swap-horiz" size={24} color="#4CAF50" />
              <Text style={styles.statTitle}>Check In/Out</Text>
            </View>
            <View style={styles.statDoubleValue}>
              <View style={styles.statDoubleItem}>
                  <Text style={styles.statValue}>{dashboardData.checkInOutSummary?.todaysCheckIns || 0}</Text>
                <Text style={styles.statSubtitle}>Today's check-ins</Text>
              </View>
              <View style={styles.statDoubleItem}>
                  <Text style={styles.statValue}>{dashboardData.checkInOutSummary?.todaysCheckOuts || 0}</Text>
                <Text style={styles.statSubtitle}>Today's check-outs</Text>
              </View>
            </View>
          </View>
          
          {/* Revenue Card */}
          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <FontAwesome5 name="dollar-sign" size={20} color="#2E7D32" />
              <Text style={styles.statTitle}>Revenue</Text>
            </View>
              <Text style={styles.statValue}>
                ${(dashboardData.revenueSummary?.todaysRevenue || 0).toLocaleString()}
              </Text>
            <Text style={styles.statSubtitle}>Today's revenue</Text>
              <Text style={styles.statDetail}>
                This month: ${(dashboardData.revenueSummary?.thisMonthRevenue || dashboardData.revenueSummary?.revenueThisMonth || dashboardData.revenueSummary?.monthlyRevenue || 0).toLocaleString()}
              </Text>
          </View>
          
          {/* Reservations Card */}
          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <MaterialIcons name="event-available" size={24} color="#1976D2" />
              <Text style={styles.statTitle}>Reservations</Text>
            </View>
              <Text style={styles.statValue}>{dashboardData.upcomingReservationsNext7Days || 0}</Text>
            <Text style={styles.statSubtitle}>Next 7 days</Text>
          </View>
        </View>
        )}
        
        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Access</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#4C3A89' }]}
            onPress={() => router.push('/rooms')}
          >
            <MaterialIcons name="meeting-room" size={24} color="white" />
            <Text style={styles.actionButtonText}>VIEW ROOM STATUS</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
            onPress={() => router.push('/checkIn')}
          >
            <MaterialIcons name="login" size={24} color="white" />
            <Text style={styles.actionButtonText}>NEW CHECK-IN</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#3949AB' }]}
            onPress={() => router.push('/checkOut')}
          >
            <MaterialIcons name="logout" size={24} color="white" />
            <Text style={styles.actionButtonText}>NEW CHECK-OUT</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#1976D2' }]}
            onPress={() => router.push('/customerInfo')}
          >
            <MaterialIcons name="people" size={24} color="white" />
            <Text style={styles.actionButtonText}>CUSTOMER LIST</Text>
          </TouchableOpacity>
        </View>
        
        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2023 Hotel Management System - All Rights Reserved</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#6B3DC9',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  registerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    marginLeft: 5,
    fontWeight: 'bold',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    maxHeight: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6B3DC9',
  },
  modalContent: {
    padding: 15,
  },
  inputGroup: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: 5,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  // Role selector styles
  roleSelector: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    backgroundColor: '#f9f9f9',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roleText: {
    fontSize: 16,
    color: '#333',
  },
  placeholderText: {
    fontSize: 16,
    color: '#aaa',
  },
  roleDropdown: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    backgroundColor: 'white',
    marginTop: 5,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  roleOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  roleOptionText: {
    fontSize: 16,
    color: '#333',
  },
  registerSubmitButton: {
    backgroundColor: '#6B3DC9',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  registerSubmitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 15,
  },
  greeting: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  userInfo: {
    fontSize: 16,
    color: '#555',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 15,
    marginBottom: 10,
  },
  summaryHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 10,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#f0f0f0',
  },
  refreshText: {
    color: '#6B3DC9',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 20,
  },
  loadingText: {
    color: '#6B3DC9',
    fontSize: 14,
    marginTop: 10,
    fontWeight: '500',
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    backgroundColor: '#fff3f3',
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ffcdd2',
  },
  errorText: {
    color: '#E53935',
    fontSize: 14,
    marginTop: 10,
    marginBottom: 15,
    textAlign: 'center',
  },
  retryButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#6B3DC9',
    borderRadius: 4,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    width: '48%',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  statTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#555',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statSubtitle: {
    fontSize: 12,
    color: '#777',
    marginTop: 5,
  },
  statDetails: {
    marginTop: 10,
  },
  statDetailText: {
    fontSize: 12,
    color: '#777',
    marginTop: 2,
  },
  statDoubleValue: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statDoubleItem: {
    width: '45%',
  },
  statDetail: {
    fontSize: 13,
    color: '#777',
    marginTop: 10,
  },
  quickActions: {
    marginBottom: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4C3A89',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
  },
  actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 10,
    fontSize: 14,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  footerText: {
    color: '#777',
    fontSize: 12,
  },
});
