import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity, Alert, TextInput, Platform } from 'react-native';
import { reservationService } from '../../services/api';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format, isValid } from 'date-fns';
// Web import for react-datepicker
// eslint-disable-next-line import/no-extraneous-dependencies
import ReactDatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { hasPageAccess } from '../../services/roleService';
import { useRouter } from 'expo-router';

function formatDate(date) {
  if (!date) return '';
  try {
    return format(date, 'yyyy-MM-dd'); // Format for API
  } catch {
    return '';
  }
}
function formatDisplayDate(date) {
  if (!date) return '';
  try {
    return format(date, 'dd.MM.yyyy'); // Format for display
  } catch {
    return '';
  }
}
function getToday() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
}

const PAGE_SIZE = 20;

export default function CheckOutScreen() {
  const { user } = useAuth();
  const router = useRouter();
  
  // Check for role-based access control
  useEffect(() => {
    if (!user) return;
    
    // Check if user has permission to access this page
    const canAccess = hasPageAccess(user, 'checkOut');
    
    if (!canAccess) {
      console.log('User does not have permission to access Check-Out');
      router.push({
        pathname: '/access-denied',
        params: { returnPath: '/(tabs)', page: 'Check-Out' }
      });
    }
  }, [user, router]);
  
  const [allCheckOuts, setAllCheckOuts] = useState([]); // Raw data from API
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [date, setDate] = useState(getToday());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [processingId, setProcessingId] = useState(null); // Track which reservation ID is being processed

  // Fetch data from API with just date, page and pageSize
  const fetchCheckOuts = async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const apiDate = params.date ? params.date : date;
      const apiPage = params.page ? params.page : page;
      const data = await reservationService.getCheckOuts({
        pageNumber: apiPage,
        pageSize: PAGE_SIZE,
        checkOutDate: formatDate(apiDate),
      });
      setAllCheckOuts(data.data || []);
      setTotalCount(data.totalCount || 0);
    } catch (err) {
      setError(err.message || 'An error occurred');
      setAllCheckOuts([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch data when date or page changes
  useEffect(() => {
    fetchCheckOuts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, page]);

  // Fetch today's data when page is focused
  useFocusEffect(
    React.useCallback(() => {
      const today = getToday();
      setDate(today);
      setPage(1);
      fetchCheckOuts({ date: today, page: 1 });
      
      return () => {
        // Cleanup function (if needed)
      };
    }, [])
  );

  // Frontend filtering (search box)
  const filteredCheckOuts = useMemo(() => {
    if (!search) return allCheckOuts;
    const lower = search.toLowerCase();
    return allCheckOuts.filter(item =>
      (item.customerName && item.customerName.toLowerCase().includes(lower)) ||
      (item.roomInfo && item.roomInfo.toLowerCase().includes(lower)) ||
      (item.reservationId && item.reservationId.toString().includes(lower))
    );
  }, [allCheckOuts, search]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCheckOuts();
  };

  const handleCheckOut = async (reservationId) => {
    try {
      setLoading(true);
      setProcessingId(reservationId); // Mark processing started
      console.log('Starting check-out, ID:', reservationId);
      
      const result = await reservationService.checkOut(reservationId);
      console.log('Check-out successful:', result);
      
      // After successful check-out
      if (Platform.OS === 'web') {
        // Web notification
        alert(`✅ Check-out successful for reservation ${reservationId}.`);
        
        // Fetch data again instead of page refresh
        setPage(1); // Reset page number
        await fetchCheckOuts({page: 1}); // Fetch data again
      } else {
        // Native platforms
        Alert.alert('Success', `Check-out completed for ${reservationId}.`);
        fetchCheckOuts(); // Refresh data on native
      }
    } catch (err) {
      console.error('Check-out error:', err);
      
      // Error notification
      const errorMsg = err.message || 'Check-out failed.';
      
      if (Platform.OS === 'web') {
        alert('❌ ' + errorMsg);
      } else {
        Alert.alert('Error', errorMsg);
      }
    } finally {
      setProcessingId(null); // Mark processing finished
      setLoading(false);
    }
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
      setPage(1);
    }
  };

  // FlatList onEndReached function for pagination
  const handleLoadMore = () => {
    if (allCheckOuts.length < totalCount && !loading) {
      setPage(prev => prev + 1);
    }
  };

  const renderStatus = (status) => {
    let color = '#FFA500';
    let label = status;
    if (status?.toLowerCase() === 'pending') { color = '#FFA500'; label = 'Pending'; }
    else if (status?.toLowerCase() === 'checked-in' || status?.toLowerCase() === 'checkedin') { color = '#4CAF50'; label = 'Checked-in'; }
    else if (status?.toLowerCase() === 'cancelled') { color = '#F44336'; label = 'Cancelled'; }
    return (
      <View style={[styles.badge, { backgroundColor: color }]}> 
        <Text style={styles.badgeText}>{label}</Text>
      </View>
    );
  };

  const renderItem = ({ item }) => {
    const isCheckedIn = item.status?.toLowerCase() === 'checked-in' || item.status?.toLowerCase() === 'checkedin';
    const isProcessing = processingId === item.reservationId;
    
    return (
      <View style={styles.item}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={styles.itemTitle}>{item.customerName || 'No Customer Information'}</Text>
          {renderStatus(item.status)}
        </View>
        <Text style={styles.itemSub}>Res. ID: {item.reservationId || '-'}</Text>
        <Text style={styles.itemSub}>Room: {item.roomInfo || '-'}</Text>
        <Text style={styles.itemSub}>Check-in: {formatDisplayDate(item.checkInDate) || '-'}</Text>
        <Text style={styles.itemSub}>Check-out: {formatDisplayDate(item.checkOutDate) || '-'}</Text>
        
        <TouchableOpacity 
          style={[
            styles.actionBtn,
            !isCheckedIn && styles.disabledBtn,
            isProcessing && styles.processingBtn
          ]}
          onPress={() => handleCheckOut(item.reservationId)}
          disabled={!isCheckedIn || isProcessing}
        >
          <Text style={styles.actionBtnText}>
            {isProcessing ? 'Processing...' : 'Check-out'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {Platform.OS === 'web' && (
        <style>{`
          .custom-datepicker-popper,
          .react-datepicker-popper,
          .react-datepicker {
            z-index: 999999 !important;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            position: absolute !important;
          }
          .react-datepicker-popper {
            position: absolute !important;
            top: auto !important;
            left: auto !important;
            inset: auto !important;
            transform: none !important;
          }
          .react-datepicker-wrapper, 
          .react-datepicker__input-container {
            position: static !important;
          }
          .react-datepicker {
            border-radius: 10px !important;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15) !important;
            border: none !important;
            font-size: 14px !important;
          }
          .react-datepicker__header {
            background-color: #f8f8f8 !important;
            border-bottom: 1px solid #e8e8e8 !important;
            border-top-left-radius: 10px !important;
            border-top-right-radius: 10px !important;
            padding-top: 10px !important;
          }
          .react-datepicker__month {
            margin: 8px !important;
          }
          .react-datepicker__day-name, .react-datepicker__day {
            width: 2rem !important;
            line-height: 2rem !important;
            margin: 0.2rem !important;
          }
          .react-datepicker__current-month {
            font-weight: bold !important;
            font-size: 16px !important;
            color: #333 !important;
          }
          .react-datepicker__day--selected {
            background-color: #6B3DC9 !important;
            border-radius: 50% !important;
          }
          .react-datepicker__day:hover {
            background-color: #f0f0f0 !important;
            border-radius: 50% !important;
          }
          .react-datepicker__day--keyboard-selected {
            background-color: rgba(107, 61, 201, 0.2) !important;
            border-radius: 50% !important;
          }
          .react-datepicker__navigation {
            top: 10px !important;
          }
        `}</style>
      )}
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Check-Out</Text>
      </View>
      <View style={styles.filtersRow}>
        <TextInput
          style={styles.input}
          placeholder="ID, Name, Room Info..."
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />
        {Platform.OS === 'web' ? (
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            marginLeft: 10, 
            marginRight: 10, 
            marginBottom: 10,
            position: 'relative',
            zIndex: 100000,
          }}>
            <label style={{ 
              fontWeight: 'bold', 
              marginBottom: 5, 
              fontSize: 14,
              color: '#333' 
            }}>Check-out Date</label>
            <ReactDatePicker
              selected={date}
              onChange={d => {
                setDate(d);
                setPage(1);
              }}
              dateFormat="dd.MM.yyyy"
              popperClassName="custom-datepicker-popper"
              calendarClassName="custom-datepicker-calendar"
              portalId="datepicker-portal"
              withPortal
              customInput={
                <input
                  style={{
                    background: 'white',
                    border: '1px solid #ddd',
                    borderRadius: 8,
                    padding: '12px 16px',
                    fontSize: 18,
                    width: '100%',
                    minWidth: '180px',
                    cursor: 'pointer',
                    textAlign: 'center',
                    fontWeight: 'bold',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    color: '#333'
                  }}
                  readOnly
                  placeholder="Select Date"
                />
              }
              showPopperArrow={false}
              popperPlacement="bottom-start"
              popperProps={{
                strategy: 'fixed',
                modifiers: [
                  { name: 'offset', options: { offset: [0, 8] } }
                ]
              }}
            />
          </div>
        ) : (
          <>
            <TouchableOpacity style={styles.dateBtn} onPress={() => setShowDatePicker(true)}>
              <Text style={styles.dateBtnText}>{date ? formatDisplayDate(date) : 'Select Date'}</Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={date || new Date()}
                mode="date"
                display="default"
                onChange={onDateChange}
              />
            )}
          </>
        )}
      </View>
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color="#6B3DC9" />
        ) : error ? (
          <Text style={{ color: 'red' }}>{error}</Text>
        ) : (
          <FlatList
            data={filteredCheckOuts}
            keyExtractor={(item, idx) => item.id?.toString() || item.reservationId?.toString() || idx.toString()}
            renderItem={renderItem}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            ListEmptyComponent={<Text>No check-out records found for the selected filters.</Text>}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    backgroundColor: '#6B3DC9',
    paddingVertical: 15,
    paddingHorizontal: 15,
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  filtersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  input: {
    flex: Platform.OS === 'web' ? 1 : 0.65,
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  dateBtn: {
    backgroundColor: '#ECE6F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    minWidth: 110,
    alignItems: 'center',
  },
  dateBtnText: {
    color: '#6B3DC9',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 10,
  },
  item: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  itemSub: {
    fontSize: 14,
    color: '#555',
  },
  badge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginLeft: 8,
  },
  badgeText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  actionBtn: {
    marginTop: 10,
    backgroundColor: '#6B3DC9',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    opacity: 1,
  },
  disabledBtn: {
    backgroundColor: '#C4C4C4',
    opacity: 0.6,
  },
  processingBtn: {
    backgroundColor: '#7B68EE',
  },
  actionBtnText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
}); 