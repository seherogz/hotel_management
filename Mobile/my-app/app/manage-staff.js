import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, TextInput, ActivityIndicator, FlatList, ScrollView, Modal, Switch, Platform, Alert, RefreshControl, StatusBar } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import { staffService, shiftService } from '../services/api';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { useAuth } from '../context/AuthContext';
import { hasPageAccess } from '../services/roleService';
import AccessDenied from '../components/AccessDenied';

const DEPARTMENTS = [
  { key: 'all', label: 'All' },
  { key: 'front_office', label: 'Front Office' },
  { key: 'housekeeping', label: 'Housekeeping' },
  { key: 'other', label: 'Other Departments' },
];

const STATUS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'inactive', label: 'Inactive' },
];

const TABS = [
  { key: 'home', label: 'Ana Sayfa', icon: 'home', route: '/home' },
  { key: 'staff', label: 'Personel', icon: 'groups', route: '/manage-staff' },
  { key: 'rooms', label: 'Odalar', icon: 'hotel', route: '/rooms' },
  { key: 'accounting', label: 'Muhasebe', icon: 'attach-money', route: '/accounting' },
  { key: 'profile', label: 'Profil', icon: 'person', route: '/profile' },
];
const DEPARTMENTS_MODAL = [
  { key: 'front_office', label: 'Front Office', icon: 'business-center' },
  { key: 'housekeeping', label: 'Housekeeping', icon: 'cleaning-services' },
  { key: 'kitchen', label: 'Kitchen', icon: 'restaurant' },
  { key: 'security', label: 'Security', icon: 'security' },
  { key: 'finance', label: 'Finance', icon: 'attach-money' },
  { key: 'technical', label: 'Technical', icon: 'build' },
  { key: 'other', label: 'Other', icon: 'more-horiz' },
];

export default function ManageStaffScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [hasAccess, setHasAccess] = useState(true);
  
  // Check if user has permission to access this page
  useEffect(() => {
    // Don't check access until user is loaded
    if (!user) return;
    
    console.log('Checking manage-staff access for:', user);
    
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
      const canAccess = hasPageAccess(user, 'manage-staff');
      console.log('Access result from permission check:', canAccess);
      setHasAccess(canAccess);
    } catch (error) {
      console.error('Error in access check:', error);
      // On error, default to grant access to avoid lockouts
      setHasAccess(true);
    }
  }, [user]);
  
  // If user doesn't have access, show access denied screen
  if (!hasAccess) {
    return <AccessDenied />;
  }
  
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [activeTab, setActiveTab] = useState('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [componentKey, setComponentKey] = useState(Date.now().toString());

  useEffect(() => {
    fetchStaff();
  }, [status, activeTab, search]);

  const fetchStaff = async () => {
    setLoading(true);
    setError(null);
    try {
      const filters = {};
      if (status !== 'all') filters.status = status;
      
      // Handle department filtering in a more specific way
      if (activeTab === 'front_office') {
        filters.department = 'front_office';
      } else if (activeTab === 'housekeeping') {
        filters.department = 'housekeeping';
      } else if (activeTab === 'other') {
        // For 'other', we'll handle filtering on the client side after fetching
        // since the backend might not support this complex filter
      }
      
      if (search) filters.search = search;
      const response = await staffService.getAllStaff(1, 50, filters);
      
      console.log('API Staff Response:', response);
      
      if (response.data && response.data.length > 0) {
        console.log('First staff details:', JSON.stringify(response.data[0], null, 2));
      }
      
      setStaff(response.data || []);
    } catch (err) {
      console.error('Staff fetch error:', err);
      setError('Veriler alınamadı: ' + (err.message || ''));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStaff();
  };

  const handleStaffCreated = () => {
    console.log('Staff created, refreshing list...');
    fetchStaff();
  };

  const handleStaffUpdated = () => {
    console.log('Staff updated, refreshing list...');
    fetchStaff();
  };

  const handleStaffDeleted = () => {
    console.log('Staff deleted, refreshing list...');
    setDetailsModalVisible(false);
    setSelectedStaff(null);
    fetchStaff();
  };

  const filteredStaff = staff.filter((person) => {
    const matchesSearch = (person.firstName && person.lastName ? `${person.firstName} ${person.lastName}` : person.name || '').toLowerCase().includes(search.toLowerCase());
    
    // İsActive kontrolünü normalleştir - IsActive veya status alanlarından hangisi varsa kullan
    const isActive = person.IsActive !== undefined ? person.IsActive : person.status === 'Active';
    
    const matchesStatus =
      status === 'all' ||
      (status === 'active' && isActive) ||
      (status === 'inactive' && !isActive);
    
    // Fix the department filtering based on the active tab
    const departmentValue = person.department || person.Department || '';
    const matchesTab = 
      activeTab === 'all' || 
      (activeTab === 'front_office' && departmentValue.toLowerCase() === 'front_office') ||
      (activeTab === 'housekeeping' && departmentValue.toLowerCase() === 'housekeeping') ||
      (activeTab === 'other' && departmentValue.toLowerCase() !== 'front_office' && departmentValue.toLowerCase() !== 'housekeeping');
    
    return matchesSearch && matchesStatus && matchesTab;
  });

  const renderStaffCard = ({ item }) => {
    // İsActive kontrolünü normalleştir
    const isActive = item.IsActive !== undefined ? item.IsActive : item.status === 'Active';
    console.log('Kart verisi:', item);
    return (
      <View style={styles.card}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{((item.firstName && item.lastName) ? `${item.firstName[0]}${item.lastName[0]}` : (item.name ? item.name.split(' ').map(n => n[0]).join('') : '')).toLowerCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.staffName}>{item.firstName && item.lastName ? `${item.firstName} ${item.lastName}` : item.name}</Text>
          <Text style={styles.staffRole}>{item.role} ({item.department || item.Department})</Text>
          <Text style={styles.staffInfo}>Department: {item.department || item.Department}</Text>
          <Text style={styles.staffInfo}>Start Date: {(item.startDate || item.StartDate)?.slice(0, 10)}</Text>
          <Text style={styles.staffInfo}>Email: {item.email || item.Email}</Text>
          <Text style={styles.staffInfo}>Phone: {item.phoneNumber || item.PhoneNumber}</Text>
        </View>
        <View style={{ alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <View style={isActive ? styles.statusActive : styles.statusInactive}>
            <Text style={styles.statusText}>{isActive ? 'Active' : 'Inactive'}</Text>
          </View>
          <TouchableOpacity style={styles.detailsButton} onPress={() => { setSelectedStaff(item); setDetailsModalVisible(true); }}>
            <Text style={styles.detailsButtonText}>Details</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const forceUpdate = useCallback(() => {
    setComponentKey(Date.now().toString());
  }, []);

  // Geri navigasyon fonksiyonu
  const handleGoBack = () => {
    try {
      // Geri tuşuna basıldığında doğrudan other tabına yönlendir
      router.push('/(tabs)/other');
    } catch (error) {
      console.error("Navigation error:", error);
      // Hata olursa yine de other tabına gitmeye çalış
      router.replace('/(tabs)');
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor="#3C3169" barStyle="light-content" />
        <View style={styles.header}>
          <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Personel Yönetimi</Text>
          </View>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.filters}>
          <View style={styles.searchRow}>
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Personel ara..."
                value={search}
                onChangeText={setSearch}
              />
            </View>
            <TouchableOpacity style={styles.newStaffButton} onPress={() => setModalVisible(true)}>
              <MaterialIcons name="person-add" size={20} color="#fff" style={{ marginRight: 5 }} />
              <Text style={styles.newStaffButtonText}>New Staff</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabs}>
            {DEPARTMENTS.map(tab => (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tab, activeTab === tab.key && styles.activeTab]}
                onPress={() => setActiveTab(tab.key)}
              >
                <Text style={activeTab === tab.key ? styles.activeTabText : styles.tabText}>{tab.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statusFilters}>
            {STATUS.map(s => (
              <TouchableOpacity
                key={s.key}
                style={[styles.statusTab, status === s.key && styles.activeStatusTab]}
                onPress={() => setStatus(s.key)}
              >
                <Text style={status === s.key ? styles.activeStatusText : styles.statusText}>{s.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        <View style={styles.content}>
          {loading ? (
            <ActivityIndicator size="large" color="#3C3169" />
          ) : error ? (
            <Text style={{ color: 'red' }}>{error}</Text>
          ) : (
            <FlatList
              data={filteredStaff}
              keyExtractor={item => item.id.toString()}
              renderItem={renderStaffCard}
              ListEmptyComponent={<Text style={{ textAlign: 'center', color: '#666', marginTop: 40 }}>Personel bulunamadı.</Text>}
              contentContainerStyle={{ paddingBottom: 20 }}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  colors={['#3C3169']}
                />
              }
            />
          )}
        </View>
        <CreateStaffModal visible={modalVisible} onClose={() => setModalVisible(false)} onCreated={handleStaffCreated} />
        <StaffDetailsModal
          visible={detailsModalVisible}
          staff={selectedStaff}
          onClose={() => setDetailsModalVisible(false)}
          onUpdated={handleStaffUpdated}
          onDeleted={handleStaffDeleted}
        />
      </SafeAreaView>
    </>
  );
}

function CreateStaffModal({ visible, onClose, onCreated }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [department, setDepartment] = useState(DEPARTMENTS_MODAL[0].key);
  const [role, setRole] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [salary, setSalary] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [departmentModal, setDepartmentModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Format the date for display
  const formatDate = (date) => {
    try {
      if (!date) return '';
      return date.toLocaleDateString();
    } catch (e) {
      console.error('Date formatting error:', e);
      return '';
    }
  };

  // Handle date change
  const onDateChange = (event, selectedDate) => {
    try {
      console.log('Date selected:', selectedDate);
      const currentDate = selectedDate || startDate;
      setShowDatePicker(Platform.OS === 'ios'); // Only keep open on iOS
      setStartDate(currentDate);
    } catch (e) {
      console.error('Date change error:', e);
    }
  };

  const handleSave = async () => {
    setError(null);
    if (!firstName || !lastName || !department || !role || !startDate || !email || !phoneNumber || !salary) {
      setError('Lütfen tüm alanları doldurun.');
      return;
    }
    setLoading(true);
    try {
      const staffData = {
        FirstName: firstName,
        LastName: lastName,
        Department: department,
        Role: role,
        StartDate: startDate.toISOString(),
        Email: email,
        PhoneNumber: phoneNumber,
        Salary: parseFloat(salary) || 0,
        IsActive: isActive,
      };
      console.log('Gönderilen veri:', staffData);
      await staffService.createStaff(staffData);
      setLoading(false);
      onCreated && onCreated();
      onClose();
    } catch (err) {
      setError('Kayıt başarısız.');
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainerMobile}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create New Staff</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalClose}>
              <MaterialIcons name="close" size={24} color="#3C3169" />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalScrollContent}>
            {/* Personal Info Card */}
            <View style={styles.modalCard}>
              <Text style={styles.modalSectionMobile}><MaterialIcons name="person" size={18} color="#6B3DC9" />  Personal Information</Text>
              <View style={styles.modalInputIconBox}>
                <MaterialIcons name="person" size={20} color="#aaa" style={styles.modalInputIcon} />
                <TextInput style={styles.modalInputMobile} placeholder="First Name *" value={firstName} onChangeText={setFirstName} />
              </View>
              <View style={styles.modalInputIconBox}>
                <MaterialIcons name="person" size={20} color="#aaa" style={styles.modalInputIcon} />
                <TextInput style={styles.modalInputMobile} placeholder="Last Name *" value={lastName} onChangeText={setLastName} />
              </View>
              <View style={styles.modalInputIconBox}>
                <MaterialIcons name="email" size={20} color="#aaa" style={styles.modalInputIcon} />
                <TextInput style={styles.modalInputMobile} placeholder="Email *" value={email} onChangeText={setEmail} keyboardType="email-address" />
              </View>
              <View style={styles.modalInputIconBox}>
                <MaterialIcons name="phone" size={20} color="#aaa" style={styles.modalInputIcon} />
                <TextInput style={styles.modalInputMobile} placeholder="Phone Number *" value={phoneNumber} onChangeText={setPhoneNumber} keyboardType="phone-pad" />
              </View>
            </View>
            {/* Employment Info Card */}
            <View style={styles.modalCard}>
              <Text style={styles.modalSectionMobile}><MaterialIcons name="work" size={18} color="#6B3DC9" />  Employment Information</Text>
              {/* Department Modal Trigger */}
              <TouchableOpacity style={styles.modalInputIconBox} onPress={() => setDepartmentModal(true)}>
                <MaterialIcons name={DEPARTMENTS_MODAL.find(d => d.key === department)?.icon || 'business-center'} size={20} color="#aaa" style={styles.modalInputIcon} />
                <Text style={[styles.modalInputMobile, { color: department ? '#333' : '#aaa' }]}>{DEPARTMENTS_MODAL.find(d => d.key === department)?.label || 'Select Department *'}</Text>
                <MaterialIcons name={'expand-more'} size={20} color="#aaa" style={{ marginLeft: 4 }} />
              </TouchableOpacity>
              <View style={styles.modalInputIconBox}>
                <MaterialIcons name="badge" size={20} color="#aaa" style={styles.modalInputIcon} />
                <TextInput style={styles.modalInputMobile} placeholder="Role/Position *" value={role} onChangeText={setRole} />
              </View>
              
              {/* Date Picker Button */}
              <TouchableOpacity 
                style={styles.datePickerButton} 
                onPress={() => {
                  console.log('Opening date picker');
                  setShowDatePicker(true);
                }}
              >
                <MaterialIcons name="event" size={20} color="#3C3169" style={styles.modalInputIcon} />
                <Text style={styles.datePickerText}>
                  {formatDate(startDate) || 'Select Start Date *'}
                </Text>
                <MaterialIcons name="arrow-drop-down" size={24} color="#3C3169" />
              </TouchableOpacity>

              {/* Simple Date Picker - will show inline on Android and as a modal on iOS */}
              {showDatePicker && (
                <View style={styles.datePickerContainer}>
                  {Platform.OS === 'android' ? (
                    <DateTimePickerModal
                      isVisible={showDatePicker}
                      mode="date"
                      display="default"
                      onConfirm={(date) => {
                        setStartDate(date);
                        setShowDatePicker(false);
                      }}
                      onCancel={() => setShowDatePicker(false)}
                      date={startDate}
                    />
                  ) : (
                    // Fallback to alternative date selection for iOS
                    <View style={styles.iosDatePickerContainer}>
                      <View style={styles.iosDatePickerHeader}>
                        <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                          <Text style={styles.iosDatePickerCancel}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          onPress={() => {
                            setShowDatePicker(false);
                          }}
                        >
                          <Text style={styles.iosDatePickerDone}>Done</Text>
                        </TouchableOpacity>
                      </View>
                      <DateTimePickerModal
                        isVisible={showDatePicker}
                        mode="date"
                        display="spinner"
                        onConfirm={(date) => {
                          setStartDate(date);
                          setShowDatePicker(false);
                        }}
                        onCancel={() => setShowDatePicker(false)}
                        date={startDate}
                      />
                    </View>
                  )}
                </View>
              )}
              
              <View style={styles.modalInputIconBox}>
                <MaterialIcons name="attach-money" size={20} color="#aaa" style={styles.modalInputIcon} />
                <TextInput 
                  style={styles.modalInputMobile} 
                  placeholder="Salary *" 
                  value={salary} 
                  onChangeText={setSalary} 
                  keyboardType="numeric" 
                />
              </View>
              <View style={styles.modalSwitchRow}>
                <Text style={{ fontWeight: 'bold', color: isActive ? '#16A085' : '#aaa', marginRight: 8 }}>{isActive ? 'Active' : 'Inactive'}</Text>
                <Switch value={isActive} onValueChange={setIsActive} trackColor={{ true: '#16A085', false: '#aaa' }} />
              </View>
            </View>
            {error && <Text style={{ color: 'red', textAlign: 'center', marginTop: 8 }}>{error}</Text>}
            <View style={styles.modalButtonRowMobile}>
              <TouchableOpacity style={styles.modalCancelMobile} onPress={onClose}><Text style={styles.modalCancelTextMobile}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveMobile} onPress={handleSave} disabled={loading}>
                <Text style={styles.modalSaveTextMobile}>{loading ? 'Saving...' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
          
          {/* Department Modal */}
          <Modal visible={departmentModal} transparent animationType="fade">
            <TouchableOpacity style={styles.departmentModalOverlay} activeOpacity={1} onPress={() => setDepartmentModal(false)}>
              <View style={styles.departmentModalBox}>
                {DEPARTMENTS_MODAL.map(opt => (
                  <TouchableOpacity key={opt.key} style={styles.departmentModalItem} onPress={() => { setDepartment(opt.key); setDepartmentModal(false); }}>
                    <MaterialIcons name={opt.icon} size={20} color="#6B3DC9" style={{ marginRight: 10 }} />
                    <Text style={{ color: '#3C3169', fontWeight: 'bold', fontSize: 16 }}>{opt.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </TouchableOpacity>
          </Modal>
          
          {/* Alternative Date Picker Modal for when inline picker doesn't work */}
          <Modal
            visible={Platform.OS !== 'android' && showDatePicker}
            transparent
            animationType="slide"
          >
            <View style={styles.datePickerModalContainerAlt}>
              <View style={styles.datePickerModalContentAlt}>
                <View style={styles.datePickerHeaderAlt}>
                  <Text style={styles.datePickerTitleAlt}>Select Date</Text>
                  <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                    <MaterialIcons name="close" size={24} color="#666" />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.datePickerCalendarContainerAlt}>
                  {/* Calendar UI */}
                  <View style={styles.calendarGrid}>
                    {/* Month selection */}
                    <View style={styles.monthSelector}>
                      <TouchableOpacity>
                        <MaterialIcons name="chevron-left" size={24} color="#3C3169" />
                      </TouchableOpacity>
                      <Text style={styles.monthYearText}>
                        {startDate.toLocaleString('default', { month: 'long' })} {startDate.getFullYear()}
                      </Text>
                      <TouchableOpacity>
                        <MaterialIcons name="chevron-right" size={24} color="#3C3169" />
                      </TouchableOpacity>
                    </View>
                    
                    {/* Simple date grid */}
                    <View style={styles.daysContainer}>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30].map(day => (
                        <TouchableOpacity 
                          key={`day-${day}`}
                          style={[
                            styles.dayButton,
                            startDate.getDate() === day && styles.selectedDayButton
                          ]}
                          onPress={() => {
                            const newDate = new Date(startDate);
                            newDate.setDate(day);
                            setStartDate(newDate);
                          }}
                        >
                          <Text 
                            style={[
                              styles.dayButtonText,
                              startDate.getDate() === day && styles.selectedDayButtonText
                            ]}
                          >
                            {day}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>
                
                <View style={styles.datePickerButtonsAlt}>
                  <TouchableOpacity 
                    style={styles.datePickerCancelBtnAlt} 
                    onPress={() => setShowDatePicker(false)}
                  >
                    <Text style={styles.datePickerCancelTextAlt}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.datePickerConfirmBtnAlt} 
                    onPress={() => setShowDatePicker(false)}
                  >
                    <Text style={styles.datePickerConfirmTextAlt}>Confirm</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
          
        </View>
      </View>
    </Modal>
  );
}

function StaffDetailsModal({ visible, staff, onClose, onUpdated, onDeleted }) {
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('staff_info');
  const [shifts, setShifts] = useState([]);
  const [loadingShifts, setLoadingShifts] = useState(false);
  const [dayPickerVisible, setDayPickerVisible] = useState(false);
  
  // Shift management states
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [editingShiftId, setEditingShiftId] = useState(null);
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const [startTimePicker, setStartTimePicker] = useState(false);
  const [endTimePicker, setEndTimePicker] = useState(false);

  // Zaman seçicisi için yardımcı fonksiyonlar
  const showStartTimePicker = () => {
    setStartTimePicker(true);
  };

  const showEndTimePicker = () => {
    setEndTimePicker(true);
  };

  const hideStartTimePicker = () => {
    setStartTimePicker(false);
  };

  const hideEndTimePicker = () => {
    setEndTimePicker(false);
  };

  // Zaman formatı için yardımcı fonksiyon
  const formatTime = (hours, minutes) => {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const handleStartTimeChange = (date) => {
    console.log('Start time selected:', date);
    if (date) {
      // Ensure we're getting a valid Date object
      const timeDate = new Date(date);
      const hours = timeDate.getHours();
      const minutes = timeDate.getMinutes();
      const formattedTime = formatTime(hours, minutes);
      console.log('Formatted start time:', formattedTime);
      setStartTime(formattedTime);
    }
    hideStartTimePicker();
  };

  const handleEndTimeChange = (date) => {
    console.log('End time selected:', date);
    if (date) {
      // Ensure we're getting a valid Date object
      const timeDate = new Date(date);
      const hours = timeDate.getHours();
      const minutes = timeDate.getMinutes();
      const formattedTime = formatTime(hours, minutes);
      console.log('Formatted end time:', formattedTime);
      setEndTime(formattedTime);
    }
    hideEndTimePicker();
  };

  // Organize shifts by day
  const [shiftsByDay, setShiftsByDay] = useState({});
  
  // Keep track of API operations to prevent race conditions
  const [isApiOperationInProgress, setIsApiOperationInProgress] = useState(false);
  
  // Add a unique key to force React to recreate the component when needed
  const [componentKey, setComponentKey] = useState(Date.now().toString());
  
  // Force a re-render when needed
  const forceUpdate = useCallback(() => {
    setComponentKey(Date.now().toString());
  }, []);

  useEffect(() => {
    if (staff) {
      console.log('Staff detail data:', JSON.stringify(staff, null, 2));
      // Make sure all fields are properly mapped for both camelCase and PascalCase API responses
      const formData = {
        ...staff,
        // Ensure we have normalized field names regardless of API response format
        id: staff.id,
        firstName: staff.firstName || (staff.FirstName || ''),
        lastName: staff.lastName || (staff.LastName || ''),
        name: staff.name || `${staff.firstName || staff.FirstName || ''} ${staff.lastName || staff.LastName || ''}`,
        email: staff.email || staff.Email || '',
        phoneNumber: staff.phoneNumber || staff.PhoneNumber || '',
        department: staff.department || staff.Department || '',
        role: staff.role || staff.Role || staff.position || '',
        position: staff.position || staff.role || staff.Role || '',
        startDate: staff.startDate || staff.StartDate || '',
        salary: staff.salary || staff.Salary || 0,
        status: staff.IsActive !== undefined ? (staff.IsActive ? 'Active' : 'Inactive') : (staff.status || 'Active')
      };
      console.log('Normalized form data:', formData);
      setForm(formData);
      setEditMode(false);
      setError(null);
      
      // Reset shifts state when staff changes
      setShifts([]);
      setShiftsByDay({});
    }
  }, [staff, visible]);

  useEffect(() => {
    if (staff && visible) {
      // Only fetch shifts when the modal is visible
      if (activeTab === 'shift_schedule') {
        console.log('Active tab is shift_schedule, fetching shifts...');
        fetchShifts();
      }
    }
  }, [staff, visible, activeTab]);

  // Effect to organize shifts by day when shifts array changes
  useEffect(() => {
    if (Array.isArray(shifts) && shifts.length > 0) {
      console.log(`Organizing ${shifts.length} shifts by day...`);
      const byDay = {};
      days.forEach(day => {
        byDay[day] = shifts.filter(shift => 
          shift && 
          shift.dayOfTheWeek === day &&
          shift.id &&
          shift.startTime && 
          shift.endTime
        );
      });
      
      console.log('Organized shifts by day:', JSON.stringify(byDay, null, 2));
      console.log('Total organized shifts:', Object.values(byDay).flat().length);
      
      // Verify integrity of data
      const totalOrganizedShifts = Object.values(byDay).flat().length;
      if (totalOrganizedShifts !== shifts.length) {
        console.warn(`Data integrity warning: shifts array has ${shifts.length} items but organized shifts has ${totalOrganizedShifts}`);
      }
      
      setShiftsByDay(byDay);
    } else if (Array.isArray(shifts) && shifts.length === 0) {
      // Initialize empty structure if no shifts
      const emptyByDay = {};
      days.forEach(day => {
        emptyByDay[day] = [];
      });
      setShiftsByDay(emptyByDay);
    }
  }, [shifts]);
  
  // New effect to handle auto-refresh functionality
  useEffect(() => {
    let refreshTimer = null;
    
    if (staff && visible && activeTab === 'shift_schedule' && !isApiOperationInProgress) {
      // Set up auto-refresh every 10 seconds to check for server changes
      refreshTimer = setInterval(() => {
        console.log('Auto-refresh timer triggered');
        fetchShifts();
      }, 60000); // Refresh every minute
    }
    
    return () => {
      if (refreshTimer) {
        clearInterval(refreshTimer);
      }
    };
  }, [staff, visible, activeTab, isApiOperationInProgress]);

  const fetchShifts = async () => {
    if (!staff || !staff.id) {
      console.warn('Cannot fetch shifts: missing staff ID');
      return;
    }
    
    if (isApiOperationInProgress) {
      console.warn('Skipping fetchShifts because another API operation is in progress');
      return;
    }
    
    setLoadingShifts(true);
    setIsApiOperationInProgress(true);
    
    try {
      console.log(`Fetching shifts for staff ID: ${staff.id}`);
      
      // Backup current shifts for safety
      const currentShiftsCopy = [...shifts];
      console.log(`Backing up ${currentShiftsCopy.length} existing shifts before fetch`);
      
      // Create a more robust cache-busting mechanism
      const timestamp = Date.now() + Math.random().toString(36).substring(2, 15);
      
      // 1. Get shifts from the API with cache-busting
      const response = await shiftService.getShifts(staff.id, timestamp);
      console.log('Fetched shifts raw response:', JSON.stringify(response));
      
      // Handle unexpected response formats
      if (!response) {
        console.warn('API returned empty response - keeping existing shifts');
        return; // Keep current shifts
      }
      
      if (!Array.isArray(response)) {
        console.warn('Unexpected shift data format - keeping existing shifts:', response);
        return; // Keep current shifts
      }
      
      // 2. Filter and validate shifts
      const validShifts = response.filter(shift => 
        shift && 
        shift.id && 
        shift.dayOfTheWeek && 
        shift.startTime && 
        shift.endTime
      );
      
      console.log(`Found ${validShifts.length} valid shifts out of ${response.length} returned`);
      
      // Merge just updated shifts with existing shifts
      // If API returns empty array but we have shifts locally, this is a red flag
      const shouldKeepLocalShifts = validShifts.length === 0 && currentShiftsCopy.length > 0;
      
      if (shouldKeepLocalShifts) {
        console.warn('API returned empty array but we have local shifts - keeping local data');
        // Don't update the state with empty data
        return;
      }
      
      console.log(`Updating shifts state from ${shifts.length} to ${validShifts.length} shifts`);
      
      // Maintain current shift IDs if the API returns new ones
      const mergedShifts = validShifts.map(shift => {
        // Look for existing shift with same ID
        const existingShift = currentShiftsCopy.find(s => s.id === shift.id);
        if (existingShift) {
          // If found, use dayOfWeek from server but preserve times in case they were just edited
          return {
            ...shift,
            // Keep client-side formatted times if they exist
            startTime: shift.startTime || existingShift.startTime,
            endTime: shift.endTime || existingShift.endTime
          };
        }
        return shift;
      });
      
      setShifts(mergedShifts);
      
      // 3. Organize shifts by day to ensure UI is consistent
      const byDay = {};
      days.forEach(day => {
        byDay[day] = mergedShifts.filter(shift => 
          shift && 
          shift.dayOfTheWeek === day &&
          shift.id &&
          shift.startTime && 
          shift.endTime
        );
      });
      
      console.log('Updated shifts by day:', JSON.stringify(byDay, null, 2));
      setShiftsByDay(byDay);
      
      // 4. Log detailed info for debugging
      console.log("DEBUGGING: Full shift data after fetch:");
      mergedShifts.forEach(shift => {
        console.log(`Shift ID: ${shift.id}, Day: ${shift.dayOfTheWeek}, Time: ${shift.startTime}-${shift.endTime}`);
      });
      
    } catch (err) {
      console.error('Error loading shifts:', err);
      console.error('Failed to load shifts: ' + (err.message || ''));
    } finally {
      setLoadingShifts(false);
      setIsApiOperationInProgress(false);
      // Force component re-render
      setComponentKey(Date.now().toString());
    }
  };

  // Helper function to get shifts for a specific day
  const getShiftsForDay = (day) => {
    return shiftsByDay[day] || [];
  };

  const handleAddUpdateShift = async () => {
    if (!staff || !staff.id) {
      console.error('Staff information is missing');
      return;
    }
    
    if (isApiOperationInProgress) {
      console.warn('Another operation is in progress');
      return;
    }
    
    console.log('============= ADD/UPDATE SHIFT STARTED =============');
    console.log('Staff ID:', staff.id);
    console.log('Selected Day:', selectedDay);
    console.log('Start Time:', startTime);
    console.log('End Time:', endTime);
    console.log('Editing Shift ID:', editingShiftId || 'NEW SHIFT');
    console.log('Current shift count:', shifts.length);
    
    // Input validation (same as before)
    if (!selectedDay) {
      console.error('Validation Error: Please select a day for the shift');
      return;
    }
    
    if (!startTime) {
      console.error('Validation Error: Please enter a start time');
      return;
    }
    
    if (!endTime) {
      console.error('Validation Error: Please enter an end time');
      return;
    }
    
    // Validate time format (should be in HH:MM format)
    const timeFormatRegex = /^\d{2}:\d{2}$/;
    if (!timeFormatRegex.test(startTime) || !timeFormatRegex.test(endTime)) {
      console.error('Validation Error: Times must be in HH:MM format (e.g., 09:00)');
      return;
    }
    
    // Check if start time is before end time
    if (startTime >= endTime) {
      console.error('Validation Error: Start time must be before end time');
      return;
    }
    
    setLoading(true);
    setIsApiOperationInProgress(true);
    
    try {
      // Deep copy of current shifts to avoid any reference issues
      const currentShiftsCopy = JSON.parse(JSON.stringify(shifts));
      console.log('Current shifts copy:', currentShiftsCopy);
      
      // Prepare shift data
      const newShiftData = {
        dayOfTheWeek: selectedDay,
        startTime: startTime,
        endTime: endTime,
        staffId: parseInt(staff.id)
      };
      
      console.log('Preparing shift data:', JSON.stringify(newShiftData, null, 2));
      
      let result;
      
      // Check if we are in edit mode or if there's already a shift for the selected day
      if (editingShiftId) {
        // EDIT MODE - Update existing shift
        console.log(`Updating shift with ID: ${editingShiftId}`);
        
        try {
          // 1. First find the existing shift to be updated
          const existingShift = shifts.find(shift => shift.id === editingShiftId);
          
          if (!existingShift) {
            console.error(`Cannot find shift with ID ${editingShiftId} in local state`);
            throw new Error('Shift not found');
          }
          
          // 2. Check if there's any actual change to avoid unnecessary API calls
          if (existingShift.dayOfTheWeek === selectedDay && 
              existingShift.startTime === startTime && 
              existingShift.endTime === endTime) {
            console.log('No changes detected in shift data, skipping update');
            setEditingShiftId(null);
            setLoading(false);
            setIsApiOperationInProgress(false);
            return;
          }
          
          // 3. Immediately update UI state optimistically
          const updatedShift = {
            id: editingShiftId,
            dayOfTheWeek: selectedDay,
            startTime: startTime,
            endTime: endTime,
            staffId: parseInt(staff.id)
          };
          
          // Update the shifts array - replace old shift with updated one
          const updatedShifts = currentShiftsCopy.map(shift => 
            shift.id === editingShiftId ? updatedShift : shift
          );
          console.log('Updated shifts after edit:', updatedShifts.length);
          setShifts(updatedShifts);
          
          // Update shifts by day
          const updatedShiftsByDay = {...shiftsByDay};
          
          // First, remove the shift from its current day (which might be different)
          Object.keys(updatedShiftsByDay).forEach(day => {
            updatedShiftsByDay[day] = updatedShiftsByDay[day].filter(shift => shift.id !== editingShiftId);
          });
          
          // Then add it to the correct day
          if (!updatedShiftsByDay[selectedDay]) {
            updatedShiftsByDay[selectedDay] = [];
          }
          updatedShiftsByDay[selectedDay].push(updatedShift);
          
          setShiftsByDay(updatedShiftsByDay);
          
          // 4. Call API to update the shift - FIXED: Instead of updating just one shift, 
          // send all shifts including the updated one
          // Prepare all shifts data for POST request
          const allShiftsData = updatedShifts.map(shift => ({
            dayOfTheWeek: shift.dayOfTheWeek,
            startTime: shift.startTime,
            endTime: shift.endTime,
            staffId: parseInt(staff.id)
          }));
          
          console.log(`Sending ${allShiftsData.length} shifts with the updated shift`);
          console.log('All shifts data:', JSON.stringify(allShiftsData, null, 2));
          
          // Call API with all shifts
          result = await shiftService.addShift(staff.id, allShiftsData);
          
          console.log('Shift update result:', JSON.stringify(result, null, 2));
          
          // 5. Force UI to refresh with the updated data
          setComponentKey(Date.now().toString());
          
          // 6. Reset the editing state
          setEditingShiftId(null);
          
          // 7. Refresh shifts after a short delay to ensure server sync
          setTimeout(() => {
            fetchShifts();
          }, 800);
          
        } catch (error) {
          console.error('Failed to update shift:', error);
          alert('There was an error updating the shift, but changes have been applied to the view.');
        }
      } else {
        // NEW SHIFT MODE - First check if there's already a shift for this day
        console.log('Checking if there is already a shift for this day...');
        const existingShiftForDay = shifts.find(shift => shift.dayOfTheWeek === selectedDay);
        
        if (existingShiftForDay) {
          // FOUND EXISTING SHIFT FOR THIS DAY
          console.log(`Found existing shift for ${selectedDay}, will update instead of creating new`);
          
          // Create an updated shift object with the existing ID but new time values
          const updatedShift = {
            id: existingShiftForDay.id,
            dayOfTheWeek: selectedDay,
            startTime: startTime,  // Use the new start time
            endTime: endTime,      // Use the new end time
            staffId: parseInt(staff.id)
          };
          
          // Update the shifts array - replace old shift with updated one
          const updatedShifts = currentShiftsCopy.map(shift => 
            shift.id === existingShiftForDay.id ? updatedShift : shift
          );
          console.log('Updated shifts after edit:', updatedShifts.length);
          setShifts(updatedShifts);
          
          // Update shifts by day
          const updatedShiftsByDay = {...shiftsByDay};
          
          // Remove old shift from day
          if (updatedShiftsByDay[selectedDay]) {
            updatedShiftsByDay[selectedDay] = updatedShiftsByDay[selectedDay].filter(
              shift => shift.id !== existingShiftForDay.id
            );
          } else {
            updatedShiftsByDay[selectedDay] = [];
          }
          
          // Add updated shift to day
          updatedShiftsByDay[selectedDay].push(updatedShift);
          setShiftsByDay(updatedShiftsByDay);
          
          // Prepare all shifts data for API call
          const allShiftsData = updatedShifts.map(shift => ({
            dayOfTheWeek: shift.dayOfTheWeek,
            startTime: shift.startTime,
            endTime: shift.endTime,
            staffId: parseInt(staff.id)
          }));
          
          console.log(`Sending ${allShiftsData.length} shifts with the updated shift`);
          
          // Call API with all shifts
          result = await shiftService.addShift(staff.id, allShiftsData);
          console.log('Shift update result:', JSON.stringify(result, null, 2));
          
          // Force UI update
          setComponentKey(Date.now().toString());
          
          setTimeout(() => {
            fetchShifts();
          }, 800);
          
        } else {
          // NO EXISTING SHIFT FOR THIS DAY - Create a new one
          console.log('No existing shift for this day, creating new shift');
        
        try {
          // Check if we have existing shifts for other days
          if (currentShiftsCopy && currentShiftsCopy.length > 0) {
            console.log('Existing shifts found. Sending all shifts together.');
            
            // Filter out any invalid shifts first
            const validShifts = currentShiftsCopy.filter(shift => 
              shift && 
              shift.dayOfTheWeek && 
              shift.startTime && 
              shift.endTime
            );
            
            if (validShifts.length > 0) {
              console.log(`Found ${validShifts.length} valid shifts to include in request`);
              
              // Create a combined array of all existing shifts + new shift
              const allShiftsData = [
                ...validShifts.map(shift => ({
                  dayOfTheWeek: shift.dayOfTheWeek,
                  startTime: shift.startTime,
                  endTime: shift.endTime,
                  staffId: parseInt(staff.id)
                })),
                newShiftData
              ];
              
              console.log('Sending combined shifts data:', JSON.stringify(allShiftsData, null, 2));
              
              // Send the entire array of shifts instead of just the new one
              result = await shiftService.addShift(staff.id, allShiftsData);
            } else {
              console.log('No valid shifts found in current shifts array. Sending only new shift.');
              result = await shiftService.addShift(staff.id, newShiftData);
            }
          } else {
            // No existing shifts, send just the new one
            console.log('No existing shifts. Sending only new shift.');
            result = await shiftService.addShift(staff.id, newShiftData);
          }
          
          console.log('New shift result:', JSON.stringify(result, null, 2));
          
          if (result && result.id) {
            // Make sure we have the new shift in the proper format
            const newShift = {
              id: result.id,
              dayOfTheWeek: selectedDay, 
              startTime: startTime,
              endTime: endTime,
              staffId: parseInt(staff.id)
            };
            
            // 1. Add to shifts array WITHOUT losing existing shifts
            const newShiftsArray = [...currentShiftsCopy, newShift];
            console.log(`Adding new shift. Original count: ${currentShiftsCopy.length}, New count: ${newShiftsArray.length}`);
            setShifts(newShiftsArray);
            
            // 2. Add to shifts by day
            const updatedShiftsByDay = {...shiftsByDay};
            if (!updatedShiftsByDay[selectedDay]) {
              updatedShiftsByDay[selectedDay] = [];
            }
            updatedShiftsByDay[selectedDay].push(newShift);
            
            setShiftsByDay(updatedShiftsByDay);
            console.log(`Updated shifts by day. Day: ${selectedDay}, Count: ${updatedShiftsByDay[selectedDay].length}`);
          } else {
            console.error('API returned invalid data for new shift');
            
            // Even though API didn't return a proper ID, still update the UI with a temporary ID
            const tempId = Date.now();
            const newShift = {
              id: tempId,
              dayOfTheWeek: selectedDay, 
              startTime: startTime,
              endTime: endTime,
              staffId: parseInt(staff.id)
            };
            
            // Add to shifts array
            const newShiftsArray = [...currentShiftsCopy, newShift];
            setShifts(newShiftsArray);
            
            // Add to shifts by day
            const updatedShiftsByDay = {...shiftsByDay};
            if (!updatedShiftsByDay[selectedDay]) {
              updatedShiftsByDay[selectedDay] = [];
            }
            updatedShiftsByDay[selectedDay].push(newShift);
            setShiftsByDay(updatedShiftsByDay);
            
            console.log(`Added temporary shift with ID: ${tempId} to UI state`);
          }
        } catch (error) {
          console.error('Failed to create new shift:', error);
          
          // Even on error, update the UI with a temporary ID to provide feedback
          const tempId = Date.now();
          const newShift = {
            id: tempId,
            dayOfTheWeek: selectedDay, 
            startTime: startTime,
            endTime: endTime,
            staffId: parseInt(staff.id)
          };
          
          // Add to shifts array
          const newShiftsArray = [...currentShiftsCopy, newShift];
          setShifts(newShiftsArray);
          
          // Add to shifts by day
          const updatedShiftsByDay = {...shiftsByDay};
          if (!updatedShiftsByDay[selectedDay]) {
            updatedShiftsByDay[selectedDay] = [];
          }
          updatedShiftsByDay[selectedDay].push(newShift);
          setShiftsByDay(updatedShiftsByDay);
          
          console.log(`Added temporary shift with ID: ${tempId} to UI state despite API error`);
          }
        }
      }
      
      // Reset form after successful operation
      resetShiftForm();
      
      // Force UI update
      setComponentKey(Date.now().toString());
      
    } catch (err) {
      console.error('Error in shift operation:', err);
    } finally {
      setLoading(false);
      setIsApiOperationInProgress(false);
    }
  };

  const handleDeleteShift = async (shiftId) => {
    if (!staff || !staff.id) {
      console.error('Error: Staff information is missing');
      return;
    }
    
    // Show confirmation before deleting
    if (Platform.OS === 'web') {
      if (!confirm('Are you sure you want to delete this shift?')) {
        return;
      }
    } else {
      // Use Alert component for mobile platforms
      Alert.alert(
        "Delete Shift",
        "Are you sure you want to delete this shift?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Delete", style: "destructive", onPress: () => performDeleteShift(shiftId) }
        ]
      );
      return;
    }
    
    // If web platform or Alert not available, continue with delete
    await performDeleteShift(shiftId);
  };
  
  const performDeleteShift = async (shiftId) => {
    console.log(`Deleting shift ${shiftId} for staff ${staff.id}`);
    
    setLoading(true);
    setIsApiOperationInProgress(true);
    
    try {
      // 1. Find the shift we're about to delete for reference
      const shiftToDelete = shifts.find(shift => shift.id === shiftId);
      const dayOfWeek = shiftToDelete?.dayOfTheWeek;
      
      if (!shiftToDelete) {
        console.error(`Shift ID ${shiftId} not found in local state`);
        return;
      }
      
      console.log(`Found shift to delete: ID=${shiftId}, Day=${dayOfWeek}`);
      
      // 2. Immediately update UI state optimistically
      const updatedShifts = shifts.filter(shift => shift.id !== shiftId);
      setShifts(updatedShifts);
      
      // Update shifts by day structure
      if (dayOfWeek) {
        const updatedShiftsByDay = {...shiftsByDay};
        if (updatedShiftsByDay[dayOfWeek]) {
          updatedShiftsByDay[dayOfWeek] = updatedShiftsByDay[dayOfWeek].filter(
            shift => shift.id !== shiftId
          );
          setShiftsByDay(updatedShiftsByDay);
        }
      }
      
      // 3. Instead of calling delete API (which doesn't exist), send all remaining shifts
      // Prepare remaining shifts data for POST request
      const remainingShifts = updatedShifts.map(shift => ({
        dayOfTheWeek: shift.dayOfTheWeek,
        startTime: shift.startTime,
        endTime: shift.endTime,
        staffId: parseInt(staff.id)
      }));
      
      console.log(`Sending ${remainingShifts.length} remaining shifts after removing shift ${shiftId}`);
      console.log('Remaining shifts data:', JSON.stringify(remainingShifts, null, 2));
      
      // Call API with all remaining shifts
      const result = await shiftService.addShift(staff.id, remainingShifts);
      console.log(`Shift update after deletion result:`, result);
      
      // 4. Force UI update
      setComponentKey(Date.now().toString());
      
      console.log('Shift successfully deleted');
      
      // 5. Refresh shifts after a short delay to ensure server sync
      setTimeout(() => {
        fetchShifts();
      }, 800);
      
    } catch (err) {
      console.error('Error deleting shift:', err);
      
      // Even if there's an error, keep UI updated (optimistic update)
      alert('There was an error contacting the server, but the shift has been removed from the view.');
    } finally {
      setLoading(false);
      setIsApiOperationInProgress(false);
    }
  };

  const handleEditShift = (shift) => {
    if (!shift || !shift.id) {
      console.error('Cannot edit shift: invalid shift data');
      return;
    }
    
    console.log('Editing shift:', shift);
    setSelectedDay(shift.dayOfTheWeek);
    setStartTime(shift.startTime);
    setEndTime(shift.endTime);
    setEditingShiftId(shift.id);
  };

  const resetShiftForm = () => {
    setSelectedDay('Monday');
    setStartTime('09:00');
    setEndTime('17:00');
    setEditingShiftId(null);
  };

  if (!staff) return null;

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleUpdate = async () => {
    setLoading(true);
    setError(null);
    try {
      // Validation check
      if (!form.id) {
        throw new Error('Staff ID is missing');
      }

      // Ad ve soyadı ayır
      const fullName = form.name || '';
      const nameParts = fullName.split(' ');
      const firstName = nameParts[0] || form.firstName || '';
      const lastName = nameParts.slice(1).join(' ') || form.lastName || '';

      // Backend'in beklediği alan adlarıyla veri oluştur
      const updatedStaff = {
        id: form.id,
        FirstName: firstName,
        LastName: lastName,
        Department: form.department || form.Department,
        Role: form.position || form.role || form.Role,
        StartDate: form.startDate || form.StartDate,
        Email: form.email || form.Email,
        PhoneNumber: form.phoneNumber || form.PhoneNumber,
        Salary: 0, // Maaş bilgisi 0 olarak ayarlandı
        IsActive: form.status === 'Active'
      };
      
      console.log('Güncellenecek veri:', updatedStaff);
      const result = await staffService.updateStaff(form.id, updatedStaff);
      console.log('Update result:', result);
      
      // Update success - close edit mode
      setEditMode(false);
      // Alert.alert('Success', 'Staff information updated successfully');
      console.log('Success: Staff information updated successfully');
      
      // Refresh data
      onUpdated && onUpdated();
    } catch (err) {
      console.error('Update error:', err);
      setError('Update failed: ' + (err.message || 'Unknown error'));
      // Alert.alert('Update Failed', err.message || 'Failed to update staff information');
      console.error('Update Failed: ' + (err.message || 'Failed to update staff information'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmVisible) {
      setDeleteConfirmVisible(true);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Validation check
      if (!staff || !staff.id) {
        throw new Error('Staff ID is missing');
      }
      
      console.log('Silinecek personel ID:', staff.id);
      
      const result = await staffService.deleteStaff(staff.id);
      console.log('Delete result:', result);
      
      console.log('Silme başarılı!');
      // Alert.alert('Success', 'Staff deleted successfully');
      console.log('Success: Staff deleted successfully');
      
      // Close modal and refresh parent list
      onDeleted && onDeleted();
      onClose();
    } catch (err) {
      console.error('Silme hatası:', err);
      setError('Delete failed: ' + (err.message || 'Unknown error'));
      setDeleteConfirmVisible(false);
      // Alert.alert('Delete Failed', err.message || 'Failed to delete staff');
      console.error('Delete Failed: ' + (err.message || 'Failed to delete staff'));
    } finally {
      setLoading(false);
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmVisible(false);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={[styles.detailsModalContainer, { width: '92%', maxHeight: '92%' }]}> 
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Staff Details</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalClose}>
              <MaterialIcons name="close" size={24} color="#3C3169" />
            </TouchableOpacity>
          </View>
          {error && <Text style={styles.detailsError}>{error}</Text>}
          
          {/* Tab Navigation */}
          <View style={styles.staffTabMenu}>
            <TouchableOpacity 
              style={[styles.staffTabItem, activeTab === 'staff_info' && styles.staffTabItemActive]}
              onPress={() => setActiveTab('staff_info')}
            >
              <MaterialIcons name="person" size={20} color="#3C3169" />
              <Text style={styles.staffTabText}>Staff Information</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.staffTabItem, activeTab === 'shift_schedule' && styles.staffTabItemActive]}
              onPress={() => setActiveTab('shift_schedule')}
            >
              <MaterialIcons name="schedule" size={20} color="#3C3169" />
              <Text style={styles.staffTabText}>Current Shift Schedule</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView>
            {activeTab === 'staff_info' && (
              <>
                {/* Avatar & Name */}
                <View style={styles.detailsAvatarBlock}>
                  <View style={styles.detailsAvatarCircle}>
                    <Text style={styles.detailsAvatarText}>{(staff.name ? staff.name.split(' ').map(n => n[0]).join('') : (staff.firstName && staff.lastName ? `${staff.firstName[0]}${staff.lastName[0]}` : '')).toLowerCase()}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
                    <View style={staff.IsActive !== undefined ? (staff.IsActive ? styles.statusActive : styles.statusInactive) : (staff.status === 'Active' ? styles.statusActive : styles.statusInactive)}>
                      <Text style={styles.statusText}>{staff.IsActive !== undefined ? (staff.IsActive ? 'Active' : 'Inactive') : (staff.status === 'Active' ? 'Active' : 'Inactive')}</Text>
                    </View>
                    <Text style={styles.detailsName}>{staff.name || `${staff.firstName || ''} ${staff.lastName || ''}`}</Text>
                  </View>
                  <Text style={styles.detailsPosition}>{staff.position || staff.role}</Text>
                </View>
                
                {/* Info Sections */}
                <View style={styles.detailsCard}>
                  <Text style={styles.detailsSection}><MaterialIcons name="info" size={20} color="#6B3DC9" />  Basic Information</Text>
                  <View style={styles.detailsRow}><Text style={styles.detailsLabel}>Staff ID:</Text><Text style={styles.detailsValue}>{staff.id}</Text></View>
                  <View style={styles.detailsRow}><Text style={styles.detailsLabel}>Email:</Text>{editMode ? <TextInput value={form.email} onChangeText={v => handleChange('email', v)} style={styles.detailsInput} /> : <Text style={styles.detailsValue}>{staff.email}</Text>}</View>
                  <View style={styles.detailsRow}><Text style={styles.detailsLabel}>Phone:</Text>{editMode ? <TextInput value={form.phoneNumber} onChangeText={v => handleChange('phoneNumber', v)} style={styles.detailsInput} /> : <Text style={styles.detailsValue}>{staff.phoneNumber}</Text>}</View>
                  {editMode && (
                    <View style={styles.detailsRow}>
                      <Text style={styles.detailsLabel}>Status:</Text>
                      <View style={{flexDirection: 'row', alignItems: 'center'}}>
                        <Text style={{ color: form.status === 'Active' ? '#16A085' : '#aaa', marginRight: 8 }}>
                          {form.status === 'Active' ? 'Active' : 'Inactive'}
                        </Text>
                        <Switch 
                          value={form.status === 'Active'} 
                          onValueChange={(value) => handleChange('status', value ? 'Active' : 'Inactive')}
                          trackColor={{ true: '#16A085', false: '#aaa' }}
                        />
                      </View>
                    </View>
                  )}
                </View>
                <View style={styles.detailsCard}>
                  <Text style={styles.detailsSection}><MaterialIcons name="work" size={20} color="#6B3DC9" />  Employment Information</Text>
                  <View style={styles.detailsRow}><Text style={styles.detailsLabel}>Department:</Text>{editMode ? <TextInput value={form.department} onChangeText={v => handleChange('department', v)} style={styles.detailsInput} /> : <Text style={styles.detailsValue}>{staff.department}</Text>}</View>
                  <View style={styles.detailsRow}><Text style={styles.detailsLabel}>Start Date:</Text>{editMode ? <TextInput value={form.startDate} onChangeText={v => handleChange('startDate', v)} style={styles.detailsInput} /> : <Text style={styles.detailsValue}>{(staff.startDate || '').slice(0, 10)}</Text>}</View>
                  <View style={styles.detailsRow}><Text style={styles.detailsLabel}>Position/Role:</Text>{editMode ? <TextInput value={form.position || form.role} onChangeText={v => handleChange('position', v)} style={styles.detailsInput} /> : <Text style={styles.detailsValue}>{staff.position || staff.role}</Text>}</View>
                </View>
                <View style={styles.detailsButtonRow}>
                  {editMode ? (
                    <>
                      <TouchableOpacity style={styles.detailsCancelBtn} onPress={() => setEditMode(false)}><Text style={styles.detailsCancelText}>Cancel</Text></TouchableOpacity>
                      <TouchableOpacity style={styles.detailsSaveBtn} onPress={handleUpdate} disabled={loading}>
                        <Text style={styles.detailsSaveText}>{loading ? 'Saving...' : 'Save'}</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <>
                      {deleteConfirmVisible ? (
                        <View style={styles.deleteConfirmBox}>
                          <Text style={styles.deleteConfirmText}>Are you sure you want to delete this staff?</Text>
                          <View style={styles.deleteConfirmButtons}>
                            <TouchableOpacity style={[styles.detailsCancelBtn, {marginRight: 10}]} onPress={cancelDelete}>
                              <Text style={styles.detailsCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.detailsDeleteBtn]} onPress={handleDelete}>
                              <MaterialIcons name="delete-forever" size={20} color="#fff" />
                              <Text style={styles.detailsDeleteText}>Confirm Delete</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ) : (
                        <>
                          <TouchableOpacity style={styles.detailsEditBtn} onPress={() => setEditMode(true)}>
                            <MaterialIcons name="edit" size={20} color="#fff" />
                            <Text style={styles.detailsEditText}>Edit</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.detailsDeleteBtn} onPress={handleDelete}>
                            <MaterialIcons name="delete" size={20} color="#fff" />
                            <Text style={styles.detailsDeleteText}>Delete</Text>
                          </TouchableOpacity>
                        </>
                      )}
                    </>
                  )}
                </View>
              </>
            )}
            
            {activeTab === 'shift_schedule' && (
              <>
                <View style={styles.shiftCard}>
                  <Text style={styles.shiftSectionTitle}>
                    <MaterialIcons name="schedule" size={22} color="#6B3DC9" /> Current Shift Schedule
                  </Text>
                  
                  {/* Add/Update Shift Section - Updated UI */}
                  <View style={styles.addShiftContainer}>
                    <Text style={styles.addShiftTitle}>
                      <MaterialIcons name={editingShiftId ? "edit" : "add"} size={20} color="#3C3169" /> 
                      {editingShiftId ? "Update Shift" : "Add New Shift"}
                    </Text>
                    
                    <View style={styles.shiftFormRow}>
                      <View style={styles.shiftFormGroup}>
                        <Text style={styles.shiftFormLabel}>Day</Text>
                        <TouchableOpacity 
                          style={styles.shiftSelect}
                          onPress={() => {
                            setDayPickerVisible(true);
                          }}
                        >
                          <Text style={styles.shiftSelectText}>{selectedDay}</Text>
                          <MaterialIcons name="arrow-drop-down" size={24} color="#3C3169" />
                        </TouchableOpacity>
                      </View>
                    </View>
                    
                    <View style={styles.shiftTimeRow}>
                      <View style={styles.shiftTimeGroup}>
                        <Text style={styles.shiftFormLabel}>Start Time</Text>
                        <TouchableOpacity 
                          style={styles.shiftTimeInput}
                          onPress={() => {
                            console.log("Opening start time picker");
                            setStartTimePicker(true);
                          }}
                          activeOpacity={0.6}
                        >
                          <Text style={{fontSize: 16}}>{startTime}</Text>
                          <MaterialIcons name="schedule" size={20} color="#3C3169" />
                        </TouchableOpacity>
                      </View>
                      
                      <View style={styles.shiftTimeGroup}>
                        <Text style={styles.shiftFormLabel}>End Time</Text>
                        <TouchableOpacity 
                          style={styles.shiftTimeInput}
                          onPress={() => {
                            console.log("Opening end time picker");
                            setEndTimePicker(true);
                          }}
                          activeOpacity={0.6}
                        >
                          <Text style={{fontSize: 16}}>{endTime}</Text>
                          <MaterialIcons name="schedule" size={20} color="#3C3169" />
                        </TouchableOpacity>
                      </View>
                      
                      <View style={styles.shiftButtonGroup}>
                        {editingShiftId && (
                          <TouchableOpacity 
                            style={styles.cancelShiftButton}
                            onPress={resetShiftForm}
                          >
                            <MaterialIcons name="close" size={20} color="#777" />
                          </TouchableOpacity>
                        )}
                        
                        <TouchableOpacity 
                          style={[styles.addShiftButton, editingShiftId && {backgroundColor: '#16A085'}]}
                          onPress={handleAddUpdateShift}
                          disabled={loading}
                        >
                          <MaterialIcons name={editingShiftId ? "check" : "add"} size={20} color="#fff" />
                          <Text style={styles.addShiftButtonText}>
                            {loading ? "..." : (editingShiftId ? "UPDATE" : "ADD")}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>
                
                {/* Zaman Seçiciler */}
                {/* Custom Time Pickers */}
                
                {/* Start Time Picker */}
                <Modal
                  visible={startTimePicker}
                  transparent
                  animationType="fade"
                >
                  <View style={styles.timeModalOverlay}>
                    <View style={styles.timePickerWrapper}>
                      <View style={styles.timePickerHeader}>
                        <Text style={styles.timePickerTitle}>Başlangıç Saati</Text>
                        <TouchableOpacity onPress={hideStartTimePicker}>
                          <MaterialIcons name="close" size={24} color="#666" />
                        </TouchableOpacity>
                      </View>
                      
                      <View style={styles.timePickerGrid}>
                        {/* Saat ve dakika seçimi */}
                        <View style={styles.timePickerColumns}>
                          <View style={styles.timePickerColumnHeader}>
                            <Text style={styles.timePickerColumnLabel}>Saat</Text>
                          </View>
                          <ScrollView style={styles.timePickerScroll}>
                            {['06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22'].map(hour => {
                              const currentHour = startTime.split(':')[0];
                              return (
                                <TouchableOpacity 
                                  key={`hour-${hour}`}
                                  style={[
                                    styles.timePickerGridItem,
                                    currentHour === hour && styles.timePickerGridItemSelected
                                  ]}
                                  onPress={() => {
                                    const minutes = startTime.split(':')[1] || '00';
                                    setStartTime(`${hour}:${minutes}`);
                  }}
                                >
                                  <Text style={[
                                    styles.timePickerGridItemText,
                                    currentHour === hour && styles.timePickerGridItemTextSelected
                                  ]}>
                                    {hour}
                                  </Text>
                                </TouchableOpacity>
                              );
                            })}
                          </ScrollView>
                        </View>
                        
                        <View style={styles.timePickerDivider} />
                        
                        <View style={styles.timePickerColumns}>
                          <View style={styles.timePickerColumnHeader}>
                            <Text style={styles.timePickerColumnLabel}>Dakika</Text>
                          </View>
                          <ScrollView style={styles.timePickerScroll}>
                            {['00', '15', '30', '45'].map(minute => {
                              const currentMinute = startTime.split(':')[1] || '00';
                              return (
                                <TouchableOpacity 
                                  key={`minute-${minute}`}
                                  style={[
                                    styles.timePickerGridItem,
                                    currentMinute === minute && styles.timePickerGridItemSelected
                                  ]}
                                  onPress={() => {
                                    const hour = startTime.split(':')[0] || '09';
                                    setStartTime(`${hour}:${minute}`);
                                  }}
                                >
                                  <Text style={[
                                    styles.timePickerGridItemText,
                                    currentMinute === minute && styles.timePickerGridItemTextSelected
                                  ]}>
                                    {minute}
                                  </Text>
                                </TouchableOpacity>
                              );
                            })}
                          </ScrollView>
                        </View>
                      </View>
                
                      <View style={styles.timePickerPreview}>
                        <Text style={styles.timePickerPreviewText}>{startTime}</Text>
                      </View>
                      
                      <View style={styles.timePickerFooter}>
                        <TouchableOpacity 
                          style={styles.timePickerCancelBtn}
                          onPress={hideStartTimePicker}
                        >
                          <Text style={styles.timePickerCancelText}>İptal</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={styles.timePickerConfirmBtn}
                          onPress={hideStartTimePicker}
                        >
                          <Text style={styles.timePickerConfirmText}>Tamam</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </Modal>
                
                {/* End Time Picker */}
                <Modal
                  visible={endTimePicker}
                  transparent
                  animationType="fade"
                >
                  <View style={styles.timeModalOverlay}>
                    <View style={styles.timePickerWrapper}>
                      <View style={styles.timePickerHeader}>
                        <Text style={styles.timePickerTitle}>Bitiş Saati</Text>
                        <TouchableOpacity onPress={hideEndTimePicker}>
                          <MaterialIcons name="close" size={24} color="#666" />
                        </TouchableOpacity>
                      </View>
                      
                      <View style={styles.timePickerGrid}>
                        {/* Saat ve dakika seçimi */}
                        <View style={styles.timePickerColumns}>
                          <View style={styles.timePickerColumnHeader}>
                            <Text style={styles.timePickerColumnLabel}>Saat</Text>
                          </View>
                          <ScrollView style={styles.timePickerScroll}>
                            {['06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22'].map(hour => {
                              const currentHour = endTime.split(':')[0];
                              return (
                                <TouchableOpacity 
                                  key={`hour-${hour}`}
                                  style={[
                                    styles.timePickerGridItem,
                                    currentHour === hour && styles.timePickerGridItemSelected
                                  ]}
                                  onPress={() => {
                                    const minutes = endTime.split(':')[1] || '00';
                                    setEndTime(`${hour}:${minutes}`);
                                  }}
                                >
                                  <Text style={[
                                    styles.timePickerGridItemText,
                                    currentHour === hour && styles.timePickerGridItemTextSelected
                                  ]}>
                                    {hour}
                                  </Text>
                                </TouchableOpacity>
                              );
                            })}
                          </ScrollView>
                        </View>
                        
                        <View style={styles.timePickerDivider} />
                        
                        <View style={styles.timePickerColumns}>
                          <View style={styles.timePickerColumnHeader}>
                            <Text style={styles.timePickerColumnLabel}>Dakika</Text>
                          </View>
                          <ScrollView style={styles.timePickerScroll}>
                            {['00', '15', '30', '45'].map(minute => {
                              const currentMinute = endTime.split(':')[1] || '00';
                              return (
                                <TouchableOpacity 
                                  key={`minute-${minute}`}
                                  style={[
                                    styles.timePickerGridItem,
                                    currentMinute === minute && styles.timePickerGridItemSelected
                                  ]}
                                  onPress={() => {
                                    const hour = endTime.split(':')[0] || '17';
                                    setEndTime(`${hour}:${minute}`);
                                  }}
                                >
                                  <Text style={[
                                    styles.timePickerGridItemText,
                                    currentMinute === minute && styles.timePickerGridItemTextSelected
                                  ]}>
                                    {minute}
                                  </Text>
                                </TouchableOpacity>
                              );
                            })}
                          </ScrollView>
                        </View>
                      </View>
                      
                      <View style={styles.timePickerPreview}>
                        <Text style={styles.timePickerPreviewText}>{endTime}</Text>
                      </View>
                      
                      <View style={styles.timePickerFooter}>
                        <TouchableOpacity 
                          style={styles.timePickerCancelBtn}
                          onPress={hideEndTimePicker}
                        >
                          <Text style={styles.timePickerCancelText}>İptal</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={styles.timePickerConfirmBtn}
                          onPress={hideEndTimePicker}
                        >
                          <Text style={styles.timePickerConfirmText}>Tamam</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </Modal>
                
                {/* Weekly Schedule Display - Grid layout matching web version */}
                <View style={styles.shiftCard}>
                  <View 
                    style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15}}
                    key={`weekly-header-${componentKey}`}
                  >
                    <Text style={styles.weeklyScheduleTitle}>Weekly Schedule</Text>
                    <TouchableOpacity 
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center', 
                        backgroundColor: '#eaeaea',
                        padding: 8,
                        borderRadius: 8
                      }}
                      onPress={() => {
                        if (!loadingShifts) {
                          // Force a complete re-render
                          forceUpdate();
                          // Then fetch fresh data with no cache
                          fetchShifts();
                        }
                      }}
                      disabled={loadingShifts}
                    >
                      <MaterialIcons name="refresh" size={18} color="#3C3169" style={{marginRight: 5}} />
                      <Text style={{color: '#3C3169', fontWeight: '500'}}>Refresh</Text>
                    </TouchableOpacity>
                  </View>
                  
                  {loadingShifts ? (
                    <ActivityIndicator size="large" color="#3C3169" style={{marginVertical: 20}} />
                  ) : (
                    <View style={styles.weeklyScheduleContainer} key={`weekly-grid-${componentKey}`}>
                      {/* First Row */}
                      <View style={styles.weeklyScheduleRow}>
                        <WeekDayCard 
                          day="Monday"
                          shifts={getShiftsForDay("Monday")}
                          onAddShift={() => {
                            setSelectedDay("Monday");
                            setEditingShiftId(null);
                          }}
                          onEditShift={handleEditShift}
                          onDeleteShift={handleDeleteShift}
                        />
                        <WeekDayCard 
                          day="Tuesday"
                          shifts={getShiftsForDay("Tuesday")}
                          onAddShift={() => {
                            setSelectedDay("Tuesday");
                            setEditingShiftId(null);
                          }}
                          onEditShift={handleEditShift}
                          onDeleteShift={handleDeleteShift}
                        />
                      </View>
                      
                      {/* Second Row */}
                      <View style={styles.weeklyScheduleRow}>
                        <WeekDayCard 
                          day="Wednesday"
                          shifts={getShiftsForDay("Wednesday")}
                          onAddShift={() => {
                            setSelectedDay("Wednesday");
                            setEditingShiftId(null);
                          }}
                          onEditShift={handleEditShift}
                          onDeleteShift={handleDeleteShift}
                        />
                        <WeekDayCard 
                          day="Thursday"
                          shifts={getShiftsForDay("Thursday")}
                          onAddShift={() => {
                            setSelectedDay("Thursday");
                            setEditingShiftId(null);
                          }}
                          onEditShift={handleEditShift}
                          onDeleteShift={handleDeleteShift}
                        />
                      </View>
                      
                      {/* Third Row */}
                      <View style={styles.weeklyScheduleRow}>
                        <WeekDayCard 
                          day="Friday"
                          shifts={getShiftsForDay("Friday")}
                          onAddShift={() => {
                            setSelectedDay("Friday");
                            setEditingShiftId(null);
                          }}
                          onEditShift={handleEditShift}
                          onDeleteShift={handleDeleteShift}
                        />
                        <WeekDayCard 
                          day="Saturday"
                          shifts={getShiftsForDay("Saturday")}
                          onAddShift={() => {
                            setSelectedDay("Saturday");
                            setEditingShiftId(null);
                          }}
                          onEditShift={handleEditShift}
                          onDeleteShift={handleDeleteShift}
                        />
                      </View>
                      
                      {/* Fourth Row */}
                      <View style={styles.weeklyScheduleRow}>
                        <WeekDayCard 
                          day="Sunday"
                          shifts={getShiftsForDay("Sunday")}
                          onAddShift={() => {
                            setSelectedDay("Sunday");
                            setEditingShiftId(null);
                          }}
                          onEditShift={handleEditShift}
                          onDeleteShift={handleDeleteShift}
                        />
                        <View style={styles.emptyDayCard} />
                      </View>
                    </View>
                  )}
                </View>
                
                <TouchableOpacity style={styles.closeButton} onPress={() => onClose()}>
                  <Text style={styles.closeButtonText}>CLOSE</Text>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </View>
      </View>
      {/* Day Picker Modal */}
      <Modal visible={dayPickerVisible} transparent animationType="fade">
        <TouchableOpacity 
          style={styles.dayPickerOverlay} 
          activeOpacity={1} 
          onPress={() => setDayPickerVisible(false)}
        >
          <View style={styles.dayPickerContainer}>
            {days.map(day => (
              <TouchableOpacity 
                key={day} 
                style={styles.dayPickerItem}
                onPress={() => {
                  setSelectedDay(day);
                  setDayPickerVisible(false);
                }}
              >
                <Text style={[
                  styles.dayPickerText,
                  selectedDay === day && styles.dayPickerTextSelected
                ]}>
                  {day}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </Modal>
  );
}

// WeekDayCard component to match web version layout
const WeekDayCard = ({ day, shifts, onAddShift, onEditShift, onDeleteShift }) => {
  const hasShift = shifts && shifts.length > 0;
  
  console.log(`Rendering ${day} card with ${shifts?.length || 0} shifts`);
  
  return (
    <View style={styles.dayCard} key={`day-card-${day}-${Date.now()}`}>
      <View style={styles.dayHeaderRow}>
        <Text style={styles.dayName}>{day}</Text>
      </View>
      
      {hasShift ? (
        <View style={styles.shiftsContainer}>
          {shifts.map((shift) => (
            <View key={`${shift.id}-${shift.dayOfTheWeek}`} style={styles.shiftItem}>
              <View style={styles.shiftTimeContainer}>
                <MaterialIcons name="access-time" size={14} color="#3C3169" style={{marginRight: 5}} />
                <Text style={styles.shiftTimeText}>{shift.startTime} - {shift.endTime}</Text>
              </View>
              
              <View style={styles.shiftActionButtons}>
                <TouchableOpacity 
                  style={styles.shiftEditButton}
                  onPress={() => onEditShift(shift)}
                >
                  <MaterialIcons name="edit" size={18} color="#3C3169" />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.shiftDeleteButton}
                  onPress={() => onDeleteShift(shift.id)}
                >
                  <MaterialIcons name="delete" size={18} color="#e74c3c" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.noShiftText}>No shift assigned</Text>
      )}
      
      <TouchableOpacity 
        style={styles.addShiftCardButton}
        onPress={onAddShift}
      >
        <MaterialIcons name="add" size={16} color="#fff" />
        <Text style={styles.addShiftCardText}>ADD SHIFT</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#7736CE',
    paddingTop: 15,
    paddingBottom: 15,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  backButton: {
    padding: 5,
  },
  filters: {
    padding: 15,
    backgroundColor: '#fff',
    paddingTop: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    justifyContent: 'space-between',
  },
  searchContainer: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginRight: 15,
    height: 46,
    justifyContent: 'center',
  },
  searchInput: {
    paddingHorizontal: 15,
    fontSize: 16,
  },
  newStaffButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6B3DC9',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minWidth: 120,
  },
  newStaffButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  tabs: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#eee',
    marginRight: 8,
  },
  activeTab: {
    backgroundColor: '#3C3169',
  },
  tabText: {
    color: '#3C3169',
    fontWeight: 'bold',
  },
  activeTabText: {
    color: 'white',
    fontWeight: 'bold',
  },
  statusFilters: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  statusTab: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#eee',
    marginRight: 8,
  },
  activeStatusTab: {
    backgroundColor: '#16A085',
  },
  statusText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 14,
  },
  activeStatusText: {
    color: 'white',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 10,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3C3169',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
    textTransform: 'lowercase',
  },
  staffName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 3,
  },
  staffRole: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  staffInfo: {
    fontSize: 13,
    color: '#888',
    marginBottom: 2,
  },
  statusActive: {
    backgroundColor: '#16A085',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  statusInactive: {
    backgroundColor: '#aaa',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  detailsButton: {
    borderWidth: 1,
    borderColor: '#3C3169',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  detailsButtonText: {
    color: '#3C3169',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainerMobile: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 16,
    width: '94%',
    maxHeight: '90%',
  },
  modalScrollContent: {
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#3C3169',
  },
  modalClose: {
    padding: 5,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  modalSectionMobile: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  modalInputIconBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  modalInputIcon: {
    marginRight: 7,
  },
  modalInputMobile: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 4,
  },
  modalButtonRowMobile: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  modalCancelMobile: {
    backgroundColor: '#aaa',
    borderRadius: 8,
    padding: 12,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  modalCancelTextMobile: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalSaveMobile: {
    backgroundColor: '#16A085',
    borderRadius: 8,
    padding: 12,
    flex: 1,
    alignItems: 'center',
  },
  modalSaveTextMobile: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalSwitchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  departmentModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  departmentModalBox: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: '80%',
    maxHeight: '80%',
  },
  departmentModalItem: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  detailsModalContainer: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    alignSelf: 'center',
  },
  detailsAvatarBlock: {
    alignItems: 'center',
    marginBottom: 18,
  },
  detailsAvatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3C3169',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsAvatarText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 32,
    textTransform: 'lowercase',
  },
  detailsName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginLeft: 10,
    color: '#222',
  },
  detailsPosition: {
    color: '#666',
    fontSize: 16,
    marginTop: 2,
  },
  detailsCard: {
    backgroundColor: '#f7f7fa',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  detailsSection: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6B3DC9',
    marginBottom: 10,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailsLabel: {
    fontWeight: 'bold',
    color: '#333',
    width: 120,
  },
  detailsValue: {
    color: '#444',
    fontSize: 15,
    flex: 1,
  },
  detailsInput: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  detailsButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 10,
  },
  detailsEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6B3DC9',
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginRight: 8,
  },
  detailsEditText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 6,
    fontSize: 16,
  },
  detailsDeleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e74c3c',
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  detailsDeleteText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 6,
    fontSize: 16,
  },
  detailsCancelBtn: {
    backgroundColor: '#aaa',
    borderRadius: 8,
    padding: 12,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  detailsCancelText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 17,
  },
  detailsSaveBtn: {
    backgroundColor: '#16A085',
    borderRadius: 8,
    padding: 12,
    flex: 1,
    alignItems: 'center',
  },
  detailsSaveText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 17,
  },
  detailsError: {
    color: '#e74c3c',
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: 8,
    fontSize: 16,
  },
  deleteConfirmBox: {
    backgroundColor: '#ffefef',
    borderRadius: 8,
    padding: 15,
    marginTop: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ffcdd2',
    width: '100%',
  },
  deleteConfirmText: {
    color: '#e53935',
    fontSize: 16,
    marginBottom: 15,
    textAlign: 'center',
  },
  deleteConfirmButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  staffTabMenu: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    marginBottom: 15,
  },
  staffTabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 10,
  },
  staffTabItemActive: {
    borderBottomWidth: 3,
    borderBottomColor: '#6B3DC9',
  },
  staffTabText: {
    marginLeft: 8,
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
  },
  shiftCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
  },
  shiftSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3C3169',
    marginBottom: 15,
  },
  addShiftContainer: {
    backgroundColor: '#f5f7fa',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  addShiftTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3C3169',
    marginBottom: 15,
  },
  shiftFormRow: {
    marginBottom: 15,
  },
  shiftFormGroup: {
    flex: 1,
  },
  shiftTimeRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  shiftTimeGroup: {
    flex: 1,
    marginRight: 10,
  },
  shiftFormLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 5,
  },
  shiftSelect: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  shiftSelectText: {
    fontSize: 16,
    color: '#333',
  },
  shiftTimeInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  shiftButtonGroup: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    marginTop: 20,
  },
  cancelShiftButton: {
    backgroundColor: '#f2f2f2',
    padding: 8,
    borderRadius: 8,
    marginRight: 8,
  },
  addShiftButton: {
    backgroundColor: '#6B3DC9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    height: 42,
  },
  addShiftButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 5,
  },
  weeklyScheduleTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3C3169',
    marginBottom: 15,
    marginTop: 10,
  },
  weeklyScheduleContainer: {
    flexDirection: 'column',
  },
  weeklyScheduleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  dayCard: {
    width: '48%',
    backgroundColor: '#f5f7fa',
    borderRadius: 10,
    padding: 12,
    marginBottom: 5,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  emptyDayCard: {
    width: '48%',
  },
  dayHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  dayName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3C3169',
  },
  dayActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dayEditButton: {
    marginRight: 8,
  },
  dayDeleteButton: {
    marginRight: 8,
  },
  dayShiftInfo: {
    flexDirection: 'column',
    backgroundColor: '#fff',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  timeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  shiftsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3C3169',
  },
  shiftsContainer: {
    marginBottom: 8,
    width: '100%',
  },
  dayAddButton: {
    padding: 5,
    marginLeft: 5,
  },
  shiftDivider: {
    height: 1,
    width: '100%',
    backgroundColor: '#ddd',
    marginVertical: 5,
  },
  dayShiftItem: {
    width: '100%',
    paddingVertical: 3,
  },
  dayShiftTime: {
    fontSize: 14,
    color: '#3C3169',
    fontWeight: '500',
  },
  noShiftContainer: {
    alignItems: 'center',
  },
  noShiftText: {
    fontSize: 14,
    color: '#888',
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 15,
  },
  addDayShiftButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16A085',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  addDayShiftText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  closeButton: {
    backgroundColor: '#6B3DC9',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 15,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dayPickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  dayPickerContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    width: '60%',
    marginTop: 370, // Position it below the day selection field
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  dayPickerItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dayPickerText: {
    fontSize: 16,
    color: '#3C3169',
  },
  dayPickerTextSelected: {
    fontWeight: 'bold',
    color: '#6B3DC9',
  },
  shiftItem: {
    backgroundColor: '#fff',
    borderRadius: 6,
    padding: 8,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#efefef',
  },
  shiftTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shiftTimeText: {
    fontSize: 14,
    color: '#3C3169',
    fontWeight: '500',
  },
  shiftActionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shiftEditButton: {
    marginRight: 8,
  },
  shiftDeleteButton: {
    marginRight: 8,
  },
  addShiftCardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6B3DC9',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginTop: 10,
  },
  addShiftCardText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  timeModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timePickerWrapper: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  timePickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  timePickerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3C3169',
  },
  timePickerContent: {
    marginVertical: 15,
  },
  timePickerScrollView: {
    maxHeight: 300,
  },
  timePickerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  timePickerCancelBtn: {
    backgroundColor: '#ccc',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  timePickerCancelText: {
    color: '#333',
    fontWeight: 'bold',
    fontSize: 16,
  },
  timePickerOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: 'white',
  },
  timePickerOptionSelected: {
    backgroundColor: '#f0f5ff',
  },
  timePickerOptionText: {
    fontSize: 16,
    color: '#3C3169',
  },
  timePickerOptionTextSelected: {
    fontWeight: 'bold',
    color: '#3C3169',
  },
  timePickerGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    height: 280,
  },
  timePickerColumns: {
    flex: 1,
    marginHorizontal: 5,
  },
  timePickerColumnHeader: {
    marginBottom: 10,
    alignItems: 'center',
    padding: 5,
  },
  timePickerColumnLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3C3169',
  },
  timePickerScroll: {
    flex: 1,
  },
  timePickerGridItem: {
    padding: 15,
    marginVertical: 5,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    marginHorizontal: 5,
  },
  timePickerGridItemSelected: {
    backgroundColor: '#e0f2f1',
    borderColor: '#16A085',
    borderWidth: 2,
  },
  timePickerGridItemText: {
    fontSize: 18,
    color: '#3C3169',
  },
  timePickerGridItemTextSelected: {
    fontWeight: 'bold',
    color: '#16A085',
  },
  timePickerDivider: {
    width: 1,
    backgroundColor: '#ddd',
    marginHorizontal: 5,
  },
  timePickerPreview: {
    flex: 1,
    textAlign: 'right',
  },
  timePickerPreviewText: {
    fontSize: 16,
    color: '#3C3169',
  },
  timePickerConfirmBtn: {
    backgroundColor: '#16A085',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  timePickerConfirmText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8e8f8',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#d0d0e0',
  },
  datePickerText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  datePickerContainer: {
    marginBottom: 10,
  },
  iosDatePickerContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    overflow: 'hidden',
  },
  iosDatePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  iosDatePickerCancel: {
    color: '#3C3169',
    fontSize: 16,
  },
  iosDatePickerDone: {
    color: '#16A085',
    fontWeight: 'bold',
    fontSize: 16,
  },
  // Alternative date picker styles
  datePickerModalContainerAlt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  datePickerModalContentAlt: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 16,
    width: '90%',
    maxWidth: 350,
  },
  datePickerHeaderAlt: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginBottom: 15,
  },
  datePickerTitleAlt: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3C3169',
  },
  datePickerCalendarContainerAlt: {
    paddingVertical: 10,
  },
  calendarGrid: {
    marginVertical: 10,
  },
  monthSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  monthYearText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3C3169',
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  dayButton: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
  },
  selectedDayButton: {
    backgroundColor: '#3C3169',
    borderRadius: 20,
  },
  dayButtonText: {
    fontSize: 14,
    color: '#333',
  },
  selectedDayButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  datePickerButtonsAlt: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 15,
  },
  datePickerCancelBtnAlt: {
    backgroundColor: '#f2f2f2',
    borderRadius: 8,
    padding: 12,
    flex: 1,
    marginRight: 10,
    alignItems: 'center',
  },
  datePickerCancelTextAlt: {
    color: '#666',
    fontWeight: 'bold',
    fontSize: 16,
  },
  datePickerConfirmBtnAlt: {
    backgroundColor: '#3C3169',
    borderRadius: 8,
    padding: 12,
    flex: 1,
    alignItems: 'center',
  },
  datePickerConfirmTextAlt: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
}); 