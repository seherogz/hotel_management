import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ActivityIndicator, FlatList, Alert, ScrollView, Dimensions } from 'react-native';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { hasPageAccess } from '../services/roleService';
import AccessDenied from '../components/AccessDenied';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';

// API configuration based on environment
let API_BASE_URL = 'http://localhost:5002/api';
if (Platform.OS === 'android') {
  API_BASE_URL = 'http://10.0.2.2:5002/api';
}

export default function FinancialReportsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [hasAccess, setHasAccess] = useState(true);
  const [financialData, setFinancialData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState([]);
  const [summaryData, setSummaryData] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    profitMargin: 0
  });
  
  // Generate available years (current year and 5 years back)
  useEffect(() => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = 0; i < 6; i++) {
      years.push(currentYear - i);
    }
    setAvailableYears(years);
  }, []);
  
  // Check if user has permission to access this page
  useEffect(() => {
    // Don't check access until user is loaded
    if (!user) return;
    
    console.log('Checking financial-reports access for:', user);
    
    // Debug the roles array
    if (user.roles) {
      if (Array.isArray(user.roles)) {
        console.log('User roles (array):', user.roles);
      } else if (typeof user.roles === 'string') {
        // Handle case where roles might be stored as a string
        console.log('User roles (string):', user.roles);
        // If roles are stored as a comma-separated string
        const rolesArray = user.roles.split(',').map(r => r.trim());
        console.log('Converting to array:', rolesArray);
        // Overwrite user for permission check
        user.roles = rolesArray;
      } else {
        console.log('Unexpected roles format:', typeof user.roles);
      }
    } else {
      console.log('No roles found for user');
    }
    
    try {
      // Check for admin/administrator directly
      if (user.roles && Array.isArray(user.roles)) {
        const hasAdminRole = user.roles.some(role => 
          typeof role === 'string' && 
          (role.toLowerCase() === 'admin' || role.toLowerCase() === 'administrator')
        );
        
        if (hasAdminRole) {
          console.log('User has admin role, granting access');
          setHasAccess(true);
          return;
        }
      }
      
      // Fallback to standard permission check
      const canAccess = hasPageAccess(user, 'financial-reports');
      console.log('Access result from permission check:', canAccess);
      setHasAccess(canAccess);
    } catch (error) {
      console.error('Error in access check:', error);
      // On error, default to grant access to avoid lockouts
      setHasAccess(true);
    }
  }, [user]);
  
  // Get month names based on month number
  const getMonthName = (month) => {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return monthNames[month - 1]; // month is 1-based
  };
  
  // Calculate summary data from monthly data
  const calculateSummary = (data) => {
    const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);
    const totalExpenses = data.reduce((sum, item) => sum + item.expenses, 0);
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0;
    
    setSummaryData({
      totalRevenue,
      totalExpenses,
      netProfit,
      profitMargin
    });
  };
  
  // Fetch financial data from API
  useEffect(() => {
    const fetchFinancialData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log(`🔍 Fetching financial report data for year ${year}`);
        console.log(`📡 API path: ${API_BASE_URL}/v1/FinancialReport/calculated-monthly-details?year=${year}`);
        
        // Get the auth token
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          console.warn('⚠️ No auth token found');
          setError('Authentication required');
          setLoading(false);
          return;
        }
        
        // Make the API request
        const response = await axios.get(
          `${API_BASE_URL}/v1/FinancialReport/calculated-monthly-details?year=${year}`,
          { 
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            }
          }
        );
        
        console.log(`✅ Received financial data: ${response.data.length} records`);
        
        // Transform data if needed
        const monthlyData = response.data.map(item => ({
          year: item.year,
          month: item.month,
          monthName: getMonthName(item.month),
          revenue: item.revenue || 0,
          expenses: item.expenses || 0,
          profit: (item.revenue || 0) - (item.expenses || 0),
          profitMargin: item.revenue ? Math.round(((item.revenue - item.expenses) / item.revenue) * 100) : 0
        }));
        
        // Sort by month (January to December)
        monthlyData.sort((a, b) => a.month - b.month);
        
        setFinancialData(monthlyData);
        calculateSummary(monthlyData);
      } catch (error) {
        console.error('❌ Error fetching financial data:', error);
        setError('Failed to fetch financial data');
        
        // Generate fallback data for demo/testing
        if (__DEV__) {
          console.log('⚠️ Generating fallback data for development');
          const fallbackData = generateFallbackData(year);
          setFinancialData(fallbackData);
          calculateSummary(fallbackData);
        }
      } finally {
        setLoading(false);
      }
    };
    
    if (hasAccess && user) {
      fetchFinancialData();
    }
  }, [hasAccess, user, year]);
  
  // Generate fallback data for testing purposes
  const generateFallbackData = (year) => {
    const months = [];
    for (let month = 1; month <= 12; month++) {
      months.push({
        year,
        month,
        monthName: getMonthName(month),
        revenue: Math.floor(Math.random() * 100000) + 50000,
        expenses: Math.floor(Math.random() * 60000) + 30000,
        profit: 0,
        profitMargin: 0
      });
    }
    
    // Calculate profit and margin
    return months.map(month => {
      const profit = month.revenue - month.expenses;
      return {
        ...month,
        profit,
        profitMargin: Math.round((profit / month.revenue) * 100)
      };
    });
  };
  
  // If user doesn't have access, show access denied screen
  if (!hasAccess) {
    return <AccessDenied />;
  }
  
  // Render a table row
  const renderItem = ({ item }) => {
    // Direct mapping of month number to month name
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    // Get month name directly from the month number (1-12)
    const monthName = item.month >= 1 && item.month <= 12 
      ? monthNames[item.month - 1] 
      : `${item.month}`;
    
    // Check if we're on mobile
    const windowWidth = Dimensions.get('window').width;
    const isMobile = windowWidth < 500;
    
    if (isMobile) {
      // Mobile optimized view with a card layout
      return (
        <View style={styles.mobileCard}>
          <View style={styles.mobileCardHeader}>
            <Text style={styles.mobileCardTitle}>{monthName}</Text>
            <Text style={[styles.mobileCardProfit, item.profit < 0 ? styles.negativeProfit : styles.positiveProfit]}>
              {item.profit.toLocaleString()} ₺
            </Text>
          </View>
          
          <View style={styles.mobileCardRow}>
            <View style={styles.mobileCardColumn}>
              <Text style={styles.mobileCardLabel}>Revenue:</Text>
              <Text style={styles.mobileCardValue}>{item.revenue.toLocaleString()} ₺</Text>
            </View>
            <View style={styles.mobileCardColumn}>
              <Text style={styles.mobileCardLabel}>Expenses:</Text>
              <Text style={styles.mobileCardValue}>{item.expenses.toLocaleString()} ₺</Text>
            </View>
          </View>
          
          <View style={styles.mobileCardFooter}>
            <Text style={styles.mobileCardLabel}>Profit Margin:</Text>
            <Text style={[styles.mobileCardMargin, item.profitMargin < 0 ? styles.negativeProfit : styles.positiveProfit]}>
              %{item.profitMargin}
            </Text>
          </View>
        </View>
      );
    }
    
    // Desktop view (original table row)
    return (
      <View style={styles.tableRow}>
        <Text style={styles.tableCell}>{monthName}</Text>
        <Text style={styles.tableCellRight}>{item.revenue.toLocaleString()} ₺</Text>
        <Text style={styles.tableCellRight}>{item.expenses.toLocaleString()} ₺</Text>
        <Text style={[styles.tableCellRight, item.profit < 0 ? styles.negativeProfit : styles.positiveProfit]}>
          {item.profit.toLocaleString()} ₺
        </Text>
        <Text style={[styles.tableCellRight, item.profitMargin < 0 ? styles.negativeProfit : styles.positiveProfit]}>
          %{item.profitMargin}
        </Text>
      </View>
    );
  };
  
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Financial Reports</Text>
        <View style={{ width: 24 }} />
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3C3169" />
          <Text style={styles.loadingText}>Loading financial data...</Text>
        </View>
      ) : error ? (
        <View style={styles.content}>
          <FontAwesome5 name="exclamation-circle" size={80} color="#e74c3c" />
          <Text style={styles.title}>Error Occurred</Text>
          <Text style={styles.subtitle}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => setYear(prev => prev)} // This will trigger a re-fetch
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : financialData.length === 0 ? (
        <View style={styles.content}>
          <FontAwesome5 name="chart-line" size={80} color="#2E86C1" />
          <Text style={styles.title}>No Data Found</Text>
          <Text style={styles.subtitle}>No financial data found for the year {year}.</Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollContainer}>
          {/* Year selector */}
          <View style={styles.yearSelectorContainer}>
            <Text style={styles.yearSelectorLabel}>Year</Text>
              <View style={[styles.pickerContainer, Dimensions.get('window').width < 500 ? styles.mobilePickerContainer : null]}>
              <Picker
                selectedValue={year}
                onValueChange={(itemValue) => setYear(itemValue)}
                  style={[styles.yearPicker, Dimensions.get('window').width < 500 ? styles.mobileYearPicker : null]}
                mode="dropdown"
                  dropdownIconColor="#7e3aed"
              >
                {availableYears.map((y) => (
                  <Picker.Item key={y} label={y.toString()} value={y} />
                ))}
              </Picker>
            </View>
          </View>
          
          {/* Summary Cards */}
          <View style={styles.summaryContainer}>
              {Dimensions.get('window').width < 500 ? (
                // Mobile-optimized summary cards
                <>
                  <View style={styles.mobileSummaryCard}>
                    <Text style={styles.summaryTitle}>Total Revenue ({year})</Text>
                    <Text style={styles.summaryValueRevenue}>{summaryData.totalRevenue.toLocaleString()} ₺</Text>
                  </View>
                  
                  <View style={styles.mobileSummaryCard}>
                    <Text style={styles.summaryTitle}>Total Expenses ({year})</Text>
                    <Text style={styles.summaryValueExpense}>{summaryData.totalExpenses.toLocaleString()} ₺</Text>
                  </View>
                  
                  <View style={styles.mobileSummaryCard}>
                    <Text style={styles.summaryTitle}>Net Profit ({year})</Text>
                    <Text style={[styles.summaryValueProfit, summaryData.netProfit < 0 ? styles.negativeProfit : styles.positiveProfit]}>
                      {summaryData.netProfit.toLocaleString()} ₺
                    </Text>
                    <Text style={styles.profitPercentage}>
                      {summaryData.profitMargin}% of total revenue
                    </Text>
                  </View>
                </>
              ) : (
                // Desktop view - original cards
                <>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Total Revenue ({year})</Text>
              <Text style={styles.summaryValueRevenue}>{summaryData.totalRevenue.toLocaleString()} ₺</Text>
            </View>
            
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Total Expenses ({year})</Text>
              <Text style={styles.summaryValueExpense}>{summaryData.totalExpenses.toLocaleString()} ₺</Text>
            </View>
            
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Net Profit ({year})</Text>
              <Text style={[styles.summaryValueProfit, summaryData.netProfit < 0 ? styles.negativeProfit : styles.positiveProfit]}>
                {summaryData.netProfit.toLocaleString()} ₺
              </Text>
              <Text style={styles.profitPercentage}>
                {summaryData.profitMargin}% of total revenue
              </Text>
            </View>
                </>
              )}
          </View>
          
          {/* Table of monthly data */}
          <View style={styles.tableContainer}>
            <Text style={styles.tableTitle}>Monthly Financial Data - {year}</Text>
            
              {/* Check screen width for responsive design */}
              {Dimensions.get('window').width < 500 ? (
                // Mobile view - we'll use cards layout instead of table
                <View style={styles.mobileCardContainer}>
                  {financialData.map((item) => renderItem({ item }))}
                </View>
              ) : (
                // Desktop view - traditional table
                <>
            {/* Table header */}
            <View style={styles.tableHeader}>
              <Text style={styles.tableHeaderCell}>Month</Text>
              <Text style={styles.tableHeaderCellRight}>Revenue</Text>
              <Text style={styles.tableHeaderCellRight}>Expenses</Text>
              <Text style={styles.tableHeaderCellRight}>Profit</Text>
              <Text style={styles.tableHeaderCellRight}>Profit Margin</Text>
            </View>
            
            {/* Table rows */}
            {financialData.map((item) => renderItem({ item }))}
                </>
              )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flex: 1,
  },
  header: {
    backgroundColor: '#7e3aed',
    paddingVertical: 15,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  yearSelectorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  yearSelectorLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 10,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    width: 150,
    overflow: 'hidden',
  },
  yearPicker: {
    height: 50,
    width: 150,
  },
  summaryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 10,
  },
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    marginBottom: 15,
    marginHorizontal: 5,
    width: '30%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  summaryValueRevenue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#3C3169',
  },
  summaryValueExpense: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#e74c3c',
  },
  summaryValueProfit: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  profitPercentage: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  tableTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 10,
    marginLeft: 15,
  },
  tableContainer: {
    flex: 1,
    padding: 15,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#3C3169',
    paddingVertical: 10,
    paddingHorizontal: 5,
    marginBottom: 5,
    borderRadius: 5,
  },
  tableHeaderCell: {
    flex: 1.5,
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  tableHeaderCellRight: {
    flex: 1,
    textAlign: 'right',
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tableCell: {
    flex: 1.5,
    fontSize: 14,
  },
  tableCellRight: {
    flex: 1,
    textAlign: 'right',
    fontSize: 14,
  },
  positiveProfit: {
    color: '#27ae60',
  },
  negativeProfit: {
    color: '#e74c3c',
  },
  retryButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#3C3169',
    borderRadius: 5,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  
  // Mobile-optimized card layout styles
  mobileCardContainer: {
    marginTop: 10,
  },
  mobileCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 2,
    padding: 15,
  },
  mobileCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 10,
    marginBottom: 10,
  },
  mobileCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3C3169',
  },
  mobileCardProfit: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  mobileCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  mobileCardColumn: {
    flex: 1,
  },
  mobileCardLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 3,
  },
  mobileCardValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  mobileCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 10,
  },
  mobileCardMargin: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  
  // Responsive styles for different screen sizes
  '@media (max-width: 768px)': {
    summaryCard: {
      width: '47%',
    },
  },
  '@media (max-width: 480px)': {
    yearSelectorContainer: {
      justifyContent: 'space-between',
    },
    summaryContainer: {
      flexDirection: 'column',
    },
    summaryCard: {
      width: '100%',
      marginHorizontal: 0,
    },
    yearSelectorLabel: {
      fontSize: 14,
    },
    pickerContainer: {
      width: 120,
    },
    yearPicker: {
      width: 120,
    },
  },
  
  // Mobile summary card styles
  mobileSummaryCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 2,
  },
  
  // Add mobile specific picker styles
  mobilePickerContainer: {
    width: 130,
    borderRadius: 8,
    backgroundColor: 'white',
    borderColor: '#7e3aed',
    borderWidth: 1,
  },
  mobileYearPicker: {
    width: 130,
    height: 45,
    color: '#7e3aed',
  },
}); 