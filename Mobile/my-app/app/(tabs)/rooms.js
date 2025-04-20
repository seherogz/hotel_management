import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  Image,
  Alert
} from 'react-native';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { roomImages, getRandomRoomImage } from '../../assets/room-images';
import Colors from '../../constants/Colors';

export default function RoomsScreen() {
  const params = useLocalSearchParams();
  const username = params.username || "Utku Adanur";
  
  const [activeView, setActiveView] = useState('card'); // 'card' or 'calendar'
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('Tümü');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showFeaturesDropdown, setShowFeaturesDropdown] = useState(false);
  const [selectedFeatures, setSelectedFeatures] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activeFilters, setActiveFilters] = useState([]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarType, setCalendarType] = useState(''); // 'start' or 'end'
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarViewRange, setCalendarViewRange] = useState({
    start: new Date(2025, 3, 16), // April 16, 2025
    end: new Date(2025, 3, 30) // April 30, 2025
  });
  const [reservationModalVisible, setReservationModalVisible] = useState(false);
  const [reservationRoom, setReservationRoom] = useState(null);
  const [reservationDates, setReservationDates] = useState({ start: '', end: '' });
  const [guestName, setGuestName] = useState('');
  const [showReservationDateModal, setShowReservationDateModal] = useState(false);

  // Sample room data with added imageUrl property
  const [rooms, setRooms] = useState([
    {
      id: '101',
      status: 'available',
      capacity: '2 Kişilik',
      amenities: ['TV', 'Minibar', 'Wi-Fi'],
      price: '₺',
      imageUrl: ''
    },
    {
      id: '102',
      status: 'occupied',
      capacity: '2 Kişilik',
      amenities: ['TV', 'Minibar', 'Wi-Fi'],
      guest: 'Ayşe Yılmaz',
      checkIn: '15.04.2025',
      checkOut: '25.04.2025',
      imageUrl: ''
    },
    {
      id: '103',
      status: 'maintenance',
      capacity: '2 Kişilik',
      amenities: ['TV', 'Minibar', 'Wi-Fi'],
      maintenance: 'Klima arızası',
      expectedCompletion: '22.04.2025',
      imageUrl: ''
    },
    {
      id: '104',
      status: 'occupied',
      capacity: '4 Kişilik',
      amenities: ['TV', 'Minibar', 'Wi-Fi'],
      guest: 'Ali Kaya',
      checkIn: '16.04.2025',
      checkOut: '28.04.2025',
      imageUrl: ''
    },
    {
      id: '105',
      status: 'available',
      capacity: '2 Kişilik',
      amenities: ['TV', 'Minibar', 'Wi-Fi'],
      price: '₺',
      imageUrl: ''
    },
    {
      id: '201',
      status: 'available',
      capacity: '2 Kişilik',
      amenities: ['TV', 'Minibar', 'Wi-Fi'],
      price: '₺',
      imageUrl: ''
    },
    {
      id: '202',
      status: 'occupied',
      capacity: '2 Kişilik',
      amenities: ['TV', 'Minibar', 'Wi-Fi'],
      guest: 'Zeynep Demir',
      checkIn: '18.04.2025',
      checkOut: '26.04.2025',
      imageUrl: ''
    },
    {
      id: '203',
      status: 'available',
      capacity: '2 Kişilik',
      amenities: ['TV', 'Minibar', 'Wi-Fi'],
      price: '₺',
      imageUrl: ''
    }
  ]);

  // All available features for filtering
  const availableFeatures = ['TV', 'Minibar', 'Wi-Fi', 'Balkon', 'Deniz Manzarası', 'Jakuzi'];

  // Assign random images to rooms on component mount
  useEffect(() => {
    const roomsWithImages = rooms.map(room => ({
      ...room,
      imageUrl: getRandomRoomImage()
    }));
    setRooms(roomsWithImages);
  }, []);

  // Filter the rooms based on search text, status filter, and other filters
  const filteredRooms = rooms.filter(room => {
    // Filter by search text (room number)
    if (searchText && !room.id.toLowerCase().includes(searchText.toLowerCase())) {
      return false;
    }
    
    // Filter by status
    if (statusFilter !== 'Tümü') {
      const statusMap = {
        'Müsait': 'available',
        'Dolu': 'occupied',
        'Bakımda': 'maintenance'
      };
      if (room.status !== statusMap[statusFilter]) {
        return false;
      }
    }
    
    // Filter by selected features/amenities
    if (selectedFeatures.length > 0) {
      for (const feature of selectedFeatures) {
        if (!room.amenities.includes(feature)) {
          return false;
        }
      }
    }
    
    // Filter by date range (only for occupied rooms)
    if (startDate || endDate) {
      // Convert dates to comparable format
      const parseDate = (dateStr) => {
        if (!dateStr) return null;
        const [day, month, year] = dateStr.split('.').map(Number);
        return new Date(year, month - 1, day);
      };
      
      const start = parseDate(startDate);
      const end = parseDate(endDate);
      
      if (room.status === 'occupied') {
        const checkIn = parseDate(room.checkIn);
        const checkOut = parseDate(room.checkOut);
        
        if (start && end) {
          // Check if the room's occupied period overlaps with the filter period
          if (!(checkIn <= end && checkOut >= start)) {
            return false;
          }
        } else if (start && !end) {
          // Only start date specified, check if checkout is after start
          if (checkOut < start) {
            return false;
          }
        } else if (!start && end) {
          // Only end date specified, check if checkin is before end
          if (checkIn > end) {
            return false;
          }
        }
      }
    }
    
    return true;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'available':
        return '#4CAF50'; // Green
      case 'occupied':
        return '#E53935'; // Red
      case 'maintenance':
        return '#FF9800'; // Orange
      default:
        return '#757575';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'available':
        return 'Müsait';
      case 'occupied':
        return 'Dolu';
      case 'maintenance':
        return 'Bakımda';
      default:
        return 'Bilinmiyor';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'available':
        return 'meeting-room';
      case 'occupied':
        return 'person';
      case 'maintenance':
        return 'build';
      default:
        return 'help-outline';
    }
  };

  const showRoomDetails = (room) => {
    setSelectedRoom(room);
    setModalVisible(true);
  };

  const handleStatusFilter = (status) => {
    setStatusFilter(status);
    setShowStatusDropdown(false);
    
    // Update active filters
    const newFilters = [...activeFilters.filter(f => f.type !== 'status')];
    if (status !== 'Tümü') {
      newFilters.push({ type: 'status', value: status });
    }
    setActiveFilters(newFilters);
  };

  const handleFeatureToggle = (feature) => {
    let newSelectedFeatures;
    if (selectedFeatures.includes(feature)) {
      // Remove the feature
      newSelectedFeatures = selectedFeatures.filter(f => f !== feature);
    } else {
      // Add the feature
      newSelectedFeatures = [...selectedFeatures, feature];
    }
    setSelectedFeatures(newSelectedFeatures);
    
    // Update active filters
    const newFilters = [...activeFilters.filter(f => f.type !== 'feature' || !f.value.includes(feature))];
    if (!selectedFeatures.includes(feature)) {
      newFilters.push({ type: 'feature', value: feature });
    }
    setActiveFilters(newFilters);
  };

  const handleDateChange = (date, type) => {
    if (type === 'start') {
      setStartDate(date);
      // Update active filters
      const newFilters = [...activeFilters.filter(f => f.type !== 'startDate')];
      if (date) {
        newFilters.push({ type: 'startDate', value: date });
      }
      setActiveFilters(newFilters);
    } else {
      setEndDate(date);
      // Update active filters
      const newFilters = [...activeFilters.filter(f => f.type !== 'endDate')];
      if (date) {
        newFilters.push({ type: 'endDate', value: date });
      }
      setActiveFilters(newFilters);
    }
  };

  const removeFilter = (filterToRemove) => {
    const newFilters = activeFilters.filter(filter => 
      !(filter.type === filterToRemove.type && filter.value === filterToRemove.value)
    );
    setActiveFilters(newFilters);
    
    // Also update the corresponding state
    if (filterToRemove.type === 'status') {
      setStatusFilter('Tümü');
    } else if (filterToRemove.type === 'feature') {
      setSelectedFeatures(selectedFeatures.filter(f => f !== filterToRemove.value));
    } else if (filterToRemove.type === 'startDate') {
      setStartDate('');
    } else if (filterToRemove.type === 'endDate') {
      setEndDate('');
    }
  };

  const clearAllFilters = () => {
    setSearchText('');
    setStatusFilter('Tümü');
    setSelectedFeatures([]);
    setStartDate('');
    setEndDate('');
    setActiveFilters([]);
  };
  
  // Refresh room data
  const refreshRooms = () => {
    // In a real app, this would fetch data from an API
    // For this demo, we'll just reassign images
    const refreshedRooms = rooms.map(room => ({
      ...room,
      imageUrl: getRandomRoomImage()
    }));
    setRooms(refreshedRooms);
  };

  const openCalendar = (type) => {
    setCalendarType(type);
    setShowCalendar(true);
  };

  const handleDateSelect = (date) => {
    // Format the date as DD.MM.YYYY
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const formattedDate = `${day}.${month}.${year}`;
    
    if (calendarType === 'start') {
      handleDateChange(formattedDate, 'start');
    } else if (calendarType === 'end') {
      handleDateChange(formattedDate, 'end');
    } else if (calendarType === 'reservationStart') {
      setReservationDates(prev => ({ ...prev, start: formattedDate }));
    } else if (calendarType === 'reservationEnd') {
      setReservationDates(prev => ({ ...prev, end: formattedDate }));
    }
    
    setShowCalendar(false);
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysArray = [];
    
    // Add empty spaces for days before the first day of month
    for (let i = 0; i < firstDayOfMonth; i++) {
      daysArray.push({ day: '', date: null });
    }
    
    // Add all days of the month
    for (let i = 1; i <= days; i++) {
      daysArray.push({ 
        day: i, 
        date: new Date(year, month, i)
      });
    }
    
    return daysArray;
  };

  const changeMonth = (increment) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + increment);
    setCurrentMonth(newMonth);
  };

  const renderCalendar = () => {
    if (!showCalendar) return null;
    
    const daysOfWeek = ['Pzr', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
    const monthDays = getDaysInMonth(currentMonth);
    const month = currentMonth.toLocaleString('tr-TR', { month: 'long' });
    const year = currentMonth.getFullYear();
    
    // Parse currently selected date (if any)
    const parseSelectedDate = (dateStr) => {
      if (!dateStr) return null;
      const [day, month, year] = dateStr.split('.').map(Number);
      return new Date(year, month - 1, day);
    };
    
    const selectedDate = calendarType === 'start' 
      ? parseSelectedDate(startDate) 
      : parseSelectedDate(endDate);
    
    // Check if a date is today
    const isToday = (date) => {
      if (!date) return false;
      const today = new Date();
      return date.getDate() === today.getDate() && 
             date.getMonth() === today.getMonth() && 
             date.getFullYear() === today.getFullYear();
    };
    
    // Check if a date is the selected date
    const isSelectedDate = (date) => {
      if (!date || !selectedDate) return false;
      return date.getDate() === selectedDate.getDate() && 
             date.getMonth() === selectedDate.getMonth() && 
             date.getFullYear() === selectedDate.getFullYear();
    };
    
    return (
      <Modal
        animationType="fade"
        transparent={true}
        visible={showCalendar}
        onRequestClose={() => setShowCalendar(false)}
      >
        <View style={styles.calendarModalContainer}>
          <View style={styles.calendarContainer}>
            <View style={styles.calendarHeader}>
              <Text style={styles.calendarTitle}>
                {calendarType === 'start' ? 'Başlangıç Tarihi' : 'Bitiş Tarihi'}
              </Text>
              <TouchableOpacity 
                style={styles.closeCalendarButton}
                onPress={() => setShowCalendar(false)}
              >
                <MaterialIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.monthSelector}>
              <TouchableOpacity onPress={() => changeMonth(-1)}>
                <MaterialIcons name="chevron-left" size={24} color="#3C3169" />
              </TouchableOpacity>
              <Text style={styles.monthYearText}>{`${month} ${year}`}</Text>
              <TouchableOpacity onPress={() => changeMonth(1)}>
                <MaterialIcons name="chevron-right" size={24} color="#3C3169" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.daysOfWeek}>
              {daysOfWeek.map(day => (
                <Text key={day} style={styles.dayOfWeekText}>{day}</Text>
              ))}
            </View>
            
            <View style={styles.daysGrid}>
              {monthDays.map((item, index) => {
                const isSelected = item.date && isSelectedDate(item.date);
                const isTodayDate = item.date && isToday(item.date);
                
                return (
                  <TouchableOpacity 
                    key={index}
                    style={[
                      styles.dayCell,
                      item.day ? styles.validDay : styles.emptyDay,
                      isSelected && styles.selectedDay,
                      isTodayDate && styles.todayDay
                    ]}
                    disabled={!item.day}
                    onPress={() => item.day ? handleDateSelect(item.date) : null}
                  >
                    <Text 
                      style={[
                        styles.dayText,
                        item.day ? styles.validDayText : styles.emptyDayText,
                        isSelected && styles.selectedDayText,
                        isTodayDate && styles.todayDayText
                      ]}
                    >
                      {item.day}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            
            <View style={styles.calendarActions}>
              <TouchableOpacity 
                style={[styles.calendarButton, { backgroundColor: '#f0f0f0' }]}
                onPress={() => setShowCalendar(false)}
              >
                <Text style={[styles.calendarButtonText, { color: '#666' }]}>İPTAL</Text>
              </TouchableOpacity>
              
              {(calendarType === 'start' ? startDate : endDate) && (
                <TouchableOpacity 
                  style={[styles.calendarButton, { backgroundColor: '#FEE8E7' }]}
                  onPress={() => {
                    if (calendarType === 'start') {
                      handleDateChange('', 'start');
                    } else {
                      handleDateChange('', 'end');
                    }
                    setShowCalendar(false);
                  }}
                >
                  <Text style={[styles.calendarButtonText, { color: '#E53935' }]}>TEMİZLE</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity 
                style={[styles.calendarButton, { backgroundColor: '#3C3169', flex: 1 }]}
                onPress={() => setShowCalendar(false)}
              >
                <Text style={[styles.calendarButtonText, { color: 'white' }]}>TAMAM</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const handleReservation = (room) => {
    // Check if date range is already selected
    if (!startDate || !endDate) {
      // If dates aren't selected, open the reservation date modal first
      setReservationRoom(room);
      setReservationDates({ start: '', end: '' });
      setShowReservationDateModal(true);
    } else {
      // If dates are already selected, proceed directly to guest name
      setReservationRoom(room);
      setReservationDates({ start: startDate, end: endDate });
      setGuestName('');
      setReservationModalVisible(true);
    }
  };

  const confirmReservation = () => {
    if (!guestName.trim()) {
      alert('Lütfen misafir adını girin.');
      return;
    }
    
    // Update the room's status to occupied with the reservation details
    const updatedRooms = rooms.map(room => {
      if (room.id === reservationRoom.id) {
        return {
          ...room,
          status: 'occupied',
          guest: guestName,
          checkIn: reservationDates.start,
          checkOut: reservationDates.end
        };
      }
      return room;
    });
    
    setRooms(updatedRooms);
    setReservationModalVisible(false);
    
    // Clear date filters after reservation
    setStartDate('');
    setEndDate('');
    setActiveFilters(activeFilters.filter(filter => 
      filter.type !== 'startDate' && filter.type !== 'endDate'
    ));
    
    // Show confirmation
    alert(`Oda ${reservationRoom.id} başarıyla ${guestName} adına rezerve edildi.`);
  };

  const renderReservationModal = () => {
    if (!reservationRoom) return null;
    
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={reservationModalVisible}
        onRequestClose={() => setReservationModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Rezervasyon: Oda {reservationRoom.id}</Text>
              <TouchableOpacity onPress={() => setReservationModalVisible(false)}>
                <MaterialIcons name="close" size={24} color="white" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <Text style={styles.sectionTitle}>Rezervasyon Bilgileri</Text>
              
              <View style={styles.reservationInfo}>
                <Text style={styles.roomDetailText}>Giriş Tarihi: {reservationDates.start}</Text>
                <Text style={styles.roomDetailText}>Çıkış Tarihi: {reservationDates.end}</Text>
              </View>
              
              <View style={styles.guestInputContainer}>
                <Text style={styles.inputLabel}>Misafir Adı:</Text>
                <TextInput
                  style={styles.guestInput}
                  placeholder="Misafir adını girin"
                  value={guestName}
                  onChangeText={setGuestName}
                />
              </View>
              
              <View style={styles.modalActions}>
                <TouchableOpacity 
                  style={styles.cancelReservationButton}
                  onPress={() => setReservationModalVisible(false)}
                >
                  <Text style={styles.cancelText}>İPTAL</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.confirmReservationButton}
                  onPress={confirmReservation}
                >
                  <Text style={styles.confirmText}>REZERVASYONU ONAYLA</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const renderReservationDateModal = () => {
    if (!reservationRoom) return null;
    
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={showReservationDateModal}
        onRequestClose={() => setShowReservationDateModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Rezervasyon Tarihleri: Oda {reservationRoom.id}</Text>
              <TouchableOpacity onPress={() => setShowReservationDateModal(false)}>
                <MaterialIcons name="close" size={24} color="white" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <Text style={styles.sectionTitle}>Rezervasyon Tarihi Seçin</Text>
              
              <View style={styles.dateFilterRow}>
                <View style={[styles.dateFilter, { width: '48%' }]}>
                  <Text style={styles.smallLabel}>Giriş Tarihi</Text>
                  <TouchableOpacity 
                    style={styles.dateInput}
                    onPress={() => {
                      setCalendarType('reservationStart');
                      setShowCalendar(true);
                    }}
                  >
                    <Text>{reservationDates.start || 'GG.AA.YYYY'}</Text>
                    <MaterialIcons name="calendar-today" size={16} color="#333" />
                  </TouchableOpacity>
                </View>
                
                <View style={[styles.dateFilter, { width: '48%' }]}>
                  <Text style={styles.smallLabel}>Çıkış Tarihi</Text>
                  <TouchableOpacity 
                    style={styles.dateInput}
                    onPress={() => {
                      setCalendarType('reservationEnd');
                      setShowCalendar(true);
                    }}
                  >
                    <Text>{reservationDates.end || 'GG.AA.YYYY'}</Text>
                    <MaterialIcons name="calendar-today" size={16} color="#333" />
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.modalActions}>
                <TouchableOpacity 
                  style={styles.cancelReservationButton}
                  onPress={() => setShowReservationDateModal(false)}
                >
                  <Text style={styles.cancelText}>İPTAL</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.confirmReservationButton}
                  onPress={handleReservationDateSelect}
                >
                  <Text style={styles.confirmText}>DEVAM ET</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const handleReservationDateSelect = () => {
    if (!reservationDates.start || !reservationDates.end) {
      alert('Lütfen hem giriş hem de çıkış tarihini seçin.');
      return;
    }
    
    setShowReservationDateModal(false);
    setGuestName('');
    setReservationModalVisible(true);
  };

  const renderRoomCard = ({ item }) => (
    <View style={styles.roomCard}>
      <View style={[styles.roomHeader, { backgroundColor: getStatusColor(item.status) }]}>
        <MaterialIcons name={getStatusIcon(item.status)} size={20} color="white" />
        <Text style={styles.roomNumber}>{item.id}</Text>
        <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
      </View>
      
      {/* Room Image */}
      <Image
        source={{ uri: item.imageUrl }}
        style={styles.roomImage}
        resizeMode="cover"
      />
      
      <View style={styles.roomContent}>
        <Text style={styles.roomInfo}>• {item.capacity}</Text>
        <Text style={styles.roomInfo}>• {item.amenities.join(' • ')}</Text>
        
        {item.status === 'occupied' && (
          <>
            <Text style={styles.guestInfo}>Misafir: {item.guest}</Text>
            <Text style={styles.dateInfo}>Giriş/Çıkış: {item.checkIn} - {item.checkOut}</Text>
          </>
        )}
        
        {item.status === 'maintenance' && (
          <>
            <Text style={styles.maintenanceInfo}>Bakım: {item.maintenance}</Text>
            <Text style={styles.dateInfo}>Tahmini Bitiş: {item.expectedCompletion}</Text>
          </>
        )}
        
        {item.status === 'available' && (
          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>Gecelik Fiyat: </Text>
            <Text style={styles.price}>{item.price}</Text>
          </View>
        )}
      </View>
      
      <View style={styles.roomActions}>
        <TouchableOpacity 
          style={styles.detailsButton}
          onPress={() => showRoomDetails(item)}
        >
          <MaterialIcons name="info" size={16} color="#3C3169" />
          <Text style={styles.buttonText}>DETAYLAR</Text>
        </TouchableOpacity>
        
        {item.status === 'available' && (
          <TouchableOpacity 
            style={styles.reserveButton}
            onPress={() => handleReservation(item)}
          >
            <MaterialIcons name="date-range" size={16} color="white" />
            <Text style={styles.reserveText}>REZERVE ET</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderRoomDetails = () => {
    if (!selectedRoom) return null;
    
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Oda {selectedRoom.id}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialIcons name="close" size={24} color="white" />
              </TouchableOpacity>
            </View>
            
            {/* Room Image in Modal */}
            <Image
              source={{ uri: selectedRoom.imageUrl }}
              style={styles.modalRoomImage}
              resizeMode="cover"
            />
            
            <View style={styles.modalBody}>
              <View style={styles.roomInfoSection}>
                <Text style={styles.sectionTitle}>Oda Bilgileri</Text>
                <View style={[styles.statusBadge, {backgroundColor: getStatusColor(selectedRoom.status)}]}>
                  <Text style={styles.statusBadgeText}>
                    {getStatusText(selectedRoom.status)}
                  </Text>
                </View>
                <Text style={styles.roomDetailText}>Kapasite: {selectedRoom.capacity}</Text>
                <Text style={styles.roomDetailText}>Gecelik Fiyat: {selectedRoom.price || '-'}</Text>
              </View>
              
              {selectedRoom.status === 'occupied' && (
                <View style={styles.guestSection}>
                  <Text style={styles.sectionTitle}>Misafir Bilgileri</Text>
                  <Text style={styles.roomDetailText}>İsim: {selectedRoom.guest}</Text>
                  <Text style={styles.roomDetailText}>Giriş Tarihi: {selectedRoom.checkIn}</Text>
                  <Text style={styles.roomDetailText}>Çıkış Tarihi: {selectedRoom.checkOut}</Text>
                  
                  <TouchableOpacity 
                    style={styles.cancelButton}
                    onPress={() => handleCancelReservation(selectedRoom)}
                  >
                    <MaterialIcons name="cancel" size={16} color="#E53935" />
                    <Text style={styles.cancelText}>REZERVASYONU İPTAL ET</Text>
                  </TouchableOpacity>
                </View>
              )}
              
              <View style={styles.amenitiesSection}>
                <Text style={styles.sectionTitle}>Oda Özellikleri</Text>
                <View style={styles.amenitiesList}>
                  {selectedRoom.amenities.map((item, index) => (
                    <View key={index} style={styles.amenityBadge}>
                      <MaterialIcons 
                        name={
                          item === 'TV' ? 'tv' : 
                          item === 'Minibar' ? 'kitchen' : 
                          item === 'Wi-Fi' ? 'wifi' : 'check'
                        } 
                        size={16} 
                        color="#3C3169" 
                      />
                      <Text style={styles.amenityText}>{item}</Text>
                    </View>
                  ))}
                </View>
              </View>
              
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.closeButtonText}>KAPAT</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // Function to handle reservation cancellation
  const handleCancelReservation = (room) => {
    // Show confirmation dialog using React Native's Alert
    Alert.alert(
      "Rezervasyon İptali",
      `${room.guest} adına yapılan rezervasyonu iptal etmek istediğinizden emin misiniz?`,
      [
        {
          text: "İptal",
          style: "cancel"
        },
        {
          text: "Evet, İptal Et",
          onPress: () => {
            // Update the room status back to available
            const updatedRooms = rooms.map(r => {
              if (r.id === room.id) {
                return {
                  ...r,
                  status: 'available',
                  guest: undefined,
                  checkIn: undefined,
                  checkOut: undefined
                };
              }
              return r;
            });
            
            setRooms(updatedRooms);
            setModalVisible(false);
            
            // Show success message
            Alert.alert(
              "Rezervasyon İptal Edildi",
              `Oda ${room.id} rezervasyonu başarıyla iptal edildi.`
            );
          }
        }
      ]
    );
  };

  // Function to generate dates for the calendar view
  const generateCalendarDates = () => {
    const dates = [];
    const start = new Date(calendarViewRange.start);
    const end = new Date(calendarViewRange.end);
    
    while (start <= end) {
      dates.push(new Date(start));
      start.setDate(start.getDate() + 1);
    }
    
    return dates;
  };

  // Helper function to format date as "DD/MM EEE" (e.g., "24/03 Pzt")
  const formatDateHeader = (date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    
    const dayNames = ['Pzr', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
    const dayOfWeek = dayNames[date.getDay()];
    
    return `${day}/${month} ${dayOfWeek}`;
  };

  // Function to parse date from DD.MM.YYYY format
  const parseDate = (dateStr) => {
    if (!dateStr) return null;
    const [day, month, year] = dateStr.split('.').map(Number);
    return new Date(year, month - 1, day);
  };

  // Debug logging for initial status calculation
  useEffect(() => {
    const today = new Date(2025, 3, 16); // April 16, 2025
    console.log("Testing room status calculation...");
    rooms.forEach(room => {
      console.log(`Room ${room.id} (${room.status}) on ${today.toDateString()}: ${getRoomStatusForDate(room, today)}`);
      if (room.checkIn) {
        console.log(`  Check-in: ${room.checkIn}, Check-out: ${room.checkOut}`);
      }
      if (room.expectedCompletion) {
        console.log(`  Expected completion: ${room.expectedCompletion}`);
      }
    });
  }, []);

  // Simplified and direct room status calculation
  const getRoomStatusForDate = (room, date) => {
    // Format date for consistent comparison
    const formatDate = (d) => {
      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };
    
    const dateStr = formatDate(date);
    
    if (room.status === 'occupied') {
      const checkIn = parseDate(room.checkIn);
      const checkOut = parseDate(room.checkOut);
      
      if (checkIn && checkOut) {
        const checkInStr = formatDate(checkIn);
        const checkOutStr = formatDate(checkOut);
        
        if (dateStr >= checkInStr && dateStr <= checkOutStr) {
          return 'occupied';
        }
      }
    } 
    else if (room.status === 'maintenance') {
      const completion = parseDate(room.expectedCompletion);
      
      if (completion) {
        const completionStr = formatDate(completion);
        
        if (dateStr <= completionStr) {
          return 'maintenance';
        }
      }
    }
    
    // Default to available if not occupied or under maintenance for this date
    return 'available';
  };

  // Function to handle changing the calendar view date range
  const changeCalendarViewRange = (increment) => {
    const newStart = new Date(calendarViewRange.start);
    const newEnd = new Date(calendarViewRange.end);
    
    newStart.setDate(newStart.getDate() + (increment * 14));
    newEnd.setDate(newEnd.getDate() + (increment * 14));
    
    setCalendarViewRange({
      start: newStart,
      end: newEnd
    });
  };

  // Function to format the date range display
  const formatDateRangeDisplay = () => {
    const formatDate = (date) => {
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}.${month}.${year}`;
    };
    
    return `${formatDate(calendarViewRange.start)} - ${formatDate(calendarViewRange.end)}`;
  };

  // Modify the renderCalendarView function to modify the calendar rendering
  const renderCalendarView = () => {
    const dates = generateCalendarDates();
    const filteredRoomsByNumber = [...filteredRooms].sort((a, b) => parseInt(a.id) - parseInt(b.id));
    
    return (
      <View style={styles.calendarViewContainer}>
        <View style={styles.calendarViewHeader}>
          <TouchableOpacity onPress={() => changeCalendarViewRange(-1)}>
            <MaterialIcons name="chevron-left" size={24} color="#3C3169" />
          </TouchableOpacity>
          
          <Text style={styles.dateRangeText}>{formatDateRangeDisplay()}</Text>
          
          <TouchableOpacity onPress={() => changeCalendarViewRange(1)}>
            <MaterialIcons name="chevron-right" size={24} color="#3C3169" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.todayButton}
            onPress={() => {
              const today = new Date();
              setCalendarViewRange({
                start: today,
                end: new Date(new Date().setDate(today.getDate() + 14))
              });
            }}
          >
            <Text style={styles.todayButtonText}>BUGÜN</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={true}>
          <View>
            {/* Column Headers (Dates) */}
            <View style={styles.calendarHeaderRow}>
              <View style={styles.roomNumberCell}>
                <Text style={styles.roomNumberHeaderText}>Oda / Tarih</Text>
              </View>
              {dates.map((date, index) => (
                <View key={index} style={styles.dateHeaderCell}>
                  <Text style={styles.dateHeaderText}>{formatDateHeader(date)}</Text>
                </View>
              ))}
            </View>
            
            {/* Room Rows */}
            <ScrollView style={{ maxHeight: 550 }}>
              {filteredRoomsByNumber.map((room) => (
                <View key={room.id} style={styles.roomRow}>
                  <View style={styles.roomNumberCell}>
                    <Text style={styles.roomNumberText}>{room.id}</Text>
                  </View>
                  
                  {dates.map((date, dateIndex) => {
                    // Get the status for this room on this specific date
                    const status = getRoomStatusForDate(room, date);
                    
                    return (
                      <TouchableOpacity 
                        key={dateIndex} 
                        style={[
                          styles.roomStatusCell,
                          { backgroundColor: getStatusColor(status) }
                        ]}
                        onPress={() => showRoomDetails(room)}
                      />
                    );
                  })}
                </View>
              ))}
            </ScrollView>
          </View>
        </ScrollView>

        <View style={styles.calendarLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: getStatusColor('available') }]} />
            <Text style={styles.legendText}>Müsait</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: getStatusColor('occupied') }]} />
            <Text style={styles.legendText}>Dolu</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: getStatusColor('maintenance') }]} />
            <Text style={styles.legendText}>Bakımda</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Room Status</Text>
        <View style={styles.headerRight}>
          <Text style={styles.username}>{username}</Text>
          <MaterialIcons name="logout" size={24} color="white" />
        </View>
      </View>
      
      {/* Main Content */}
      <View style={styles.content}>
        <Text style={styles.title}>Oda Durumu</Text>
        
        {/* View Toggle */}
        <View style={styles.viewToggle}>
          <TouchableOpacity 
            style={[
              styles.toggleButton, 
              activeView === 'card' && styles.activeToggle
            ]}
            onPress={() => setActiveView('card')}
          >
            <MaterialIcons 
              name="grid-view" 
              size={20} 
              color={activeView === 'card' ? '#3C3169' : '#666'} 
            />
            <Text 
              style={[
                styles.toggleText, 
                activeView === 'card' && styles.activeToggleText
              ]}
            >
              KART GÖRÜNÜMÜ
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.toggleButton, 
              activeView === 'calendar' && styles.activeToggle
            ]}
            onPress={() => setActiveView('calendar')}
          >
            <MaterialIcons 
              name="calendar-today" 
              size={20} 
              color={activeView === 'calendar' ? '#3C3169' : '#666'} 
            />
            <Text 
              style={[
                styles.toggleText, 
                activeView === 'calendar' && styles.activeToggleText
              ]}
            >
              TAKVİM GÖRÜNÜMÜ
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={refreshRooms}
          >
            <MaterialIcons name="refresh" size={20} color="#3C3169" />
            <Text style={styles.refreshText}>YENİLE</Text>
          </TouchableOpacity>
        </View>
        
        {/* Search and Filters */}
        {activeView === 'card' && (
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Oda Numarası Ara"
              value={searchText}
              onChangeText={setSearchText}
            />
            
            <View style={styles.filterRow}>
              <TouchableOpacity 
                style={styles.statusFilter}
                onPress={() => setShowStatusDropdown(!showStatusDropdown)}
              >
                <Text style={styles.filterText}>{statusFilter}</Text>
                <MaterialIcons name="arrow-drop-down" size={24} color="#333" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.advancedFilter}
                onPress={() => setShowFilters(!showFilters)}
              >
                <MaterialIcons name="filter-list" size={20} color="#3C3169" />
                <Text style={styles.advancedFilterText}>GELİŞMİŞ FİLTRELER</Text>
              </TouchableOpacity>
            </View>
            
            {/* Status Dropdown */}
            {showStatusDropdown && (
              <View style={styles.dropdownMenu}>
                {['Tümü', 'Müsait', 'Dolu', 'Bakımda'].map((status) => (
                  <TouchableOpacity 
                    key={status} 
                    style={[
                      styles.dropdownItem,
                      statusFilter === status && styles.selectedDropdownItem
                    ]}
                    onPress={() => handleStatusFilter(status)}
                  >
                    <Text 
                      style={[
                        styles.dropdownText,
                        statusFilter === status && styles.selectedDropdownText
                      ]}
                    >
                      {status}
                    </Text>
                    {statusFilter === status && (
                      <MaterialIcons name="check" size={16} color="#3C3169" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}
        
        {/* Advanced Filters */}
        {activeView === 'card' && showFilters && (
          <View style={styles.advancedFiltersContainer}>
            <Text style={styles.filterSectionTitle}>Gelişmiş Filtreler</Text>
            
            <View style={styles.dateFilterRow}>
              <View style={styles.dateFilter}>
                <Text style={styles.dateLabel}>Tarih Aralığı</Text>
                <Text style={styles.smallLabel}>Başlangıç Tarihi</Text>
                <TouchableOpacity 
                  style={styles.dateInput}
                  onPress={() => openCalendar('start')}
                >
                  <Text>{startDate || 'GG.AA.YYYY'}</Text>
                  <MaterialIcons name="calendar-today" size={16} color="#333" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.dateFilter}>
                <Text style={styles.smallLabel}>Bitiş Tarihi</Text>
                <TouchableOpacity 
                  style={styles.dateInput}
                  onPress={() => openCalendar('end')}
                >
                  <Text>{endDate || 'GG.AA.YYYY'}</Text>
                  <MaterialIcons name="calendar-today" size={16} color="#333" />
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.featureFilter}>
              <Text style={styles.featureLabel}>Oda Özellikleri</Text>
              <TouchableOpacity 
                style={styles.featureDropdown}
                onPress={() => setShowFeaturesDropdown(!showFeaturesDropdown)}
              >
                <Text>
                  {selectedFeatures.length > 0 
                    ? `${selectedFeatures.length} özellik seçildi` 
                    : 'Özellikler'}
                </Text>
                <MaterialIcons 
                  name={showFeaturesDropdown ? "arrow-drop-up" : "arrow-drop-down"} 
                  size={24} 
                  color="#333" 
                />
              </TouchableOpacity>
              
              {showFeaturesDropdown && (
                <View style={styles.featuresDropdownMenu}>
                  {availableFeatures.map((feature) => (
                    <TouchableOpacity 
                      key={feature}
                      style={styles.featureCheckItem}
                      onPress={() => handleFeatureToggle(feature)}
                    >
                      <View style={styles.checkboxContainer}>
                        <View style={[
                          styles.checkbox,
                          selectedFeatures.includes(feature) && styles.checkedBox
                        ]}>
                          {selectedFeatures.includes(feature) && (
                            <MaterialIcons name="check" size={14} color="white" />
                          )}
                        </View>
                        <Text style={styles.featureItemText}>{feature}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
            
            <View style={styles.filterActions}>
              <TouchableOpacity 
                style={styles.clearFiltersButton}
                onPress={clearAllFilters}
              >
                <Text style={styles.clearFiltersText}>FİLTRELERİ TEMİZLE</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.applyFiltersButton}
                onPress={() => setShowFilters(false)}
              >
                <Text style={styles.applyFiltersText}>UYGULA</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        
        {/* Active Filter Tags */}
        {activeView === 'card' && activeFilters.length > 0 && (
          <View style={styles.activeFilters}>
            {activeFilters.map((filter, index) => {
              let displayText = '';
              
              if (filter.type === 'status') {
                displayText = filter.value;
              } else if (filter.type === 'feature') {
                displayText = filter.value;
              } else if (filter.type === 'startDate') {
                displayText = `Başlangıç: ${filter.value}`;
              } else if (filter.type === 'endDate') {
                displayText = `Bitiş: ${filter.value}`;
              }
              
              return (
                <View key={index} style={styles.filterTag}>
                  <Text style={styles.filterTagText}>{displayText}</Text>
                  <TouchableOpacity onPress={() => removeFilter(filter)}>
                    <MaterialIcons name="close" size={16} color="#3C3169" />
                  </TouchableOpacity>
                </View>
              );
            })}
            
            {activeFilters.length > 1 && (
              <TouchableOpacity 
                style={styles.clearAllTag}
                onPress={clearAllFilters}
              >
                <Text style={styles.clearAllText}>Tümünü Temizle</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        
        {/* Calendar View */}
        {activeView === 'calendar' && renderCalendarView()}
        
        {/* Empty state when no rooms match the filters */}
        {activeView === 'card' && filteredRooms.length === 0 && (
          <View style={styles.emptyState}>
            <MaterialIcons name="search-off" size={48} color="#999" />
            <Text style={styles.emptyStateTitle}>Sonuç Bulunamadı</Text>
            <Text style={styles.emptyStateText}>
              Arama kriterlerinize uygun oda bulunamadı. Lütfen filtreleri değiştirin.
            </Text>
            <TouchableOpacity 
              style={styles.resetButton}
              onPress={clearAllFilters}
            >
              <Text style={styles.resetButtonText}>FİLTRELERİ SIFIRLA</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {/* Room List */}
        {activeView === 'card' && filteredRooms.length > 0 && (
          <FlatList
            data={filteredRooms}
            renderItem={renderRoomCard}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.roomList}
            numColumns={1}
          />
        )}
        
        {/* Room Details Modal */}
        {renderRoomDetails()}
        
        {/* Calendar Modal */}
        {renderCalendar()}
        
        {/* Reservation Modal */}
        {renderReservationModal()}
        
        {/* Reservation Date Modal */}
        {renderReservationDateModal()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#3C3169',
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  username: {
    color: 'white',
    marginRight: 15,
    fontSize: 16,
  },
  content: {
    flex: 1,
    padding: 15,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  viewToggle: {
    flexDirection: 'row',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginRight: 10,
  },
  activeToggle: {
    borderBottomWidth: 2,
    borderBottomColor: '#3C3169',
  },
  toggleText: {
    marginLeft: 5,
    color: '#666',
    fontSize: 12,
    fontWeight: '500',
  },
  activeToggleText: {
    color: '#3C3169',
    fontWeight: 'bold',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginLeft: 'auto',
  },
  refreshText: {
    marginLeft: 5,
    color: '#3C3169',
    fontSize: 12,
    fontWeight: '500',
  },
  searchContainer: {
    marginBottom: 15,
  },
  searchInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginBottom: 10,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    paddingHorizontal: 15,
    paddingVertical: 10,
    width: '30%',
  },
  filterText: {
    flex: 1,
    color: '#333',
  },
  advancedFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    paddingHorizontal: 15,
    paddingVertical: 10,
    width: '65%',
  },
  advancedFilterText: {
    marginLeft: 5,
    color: '#3C3169',
    fontSize: 13,
    fontWeight: '500',
  },
  advancedFiltersContainer: {
    backgroundColor: 'white',
    borderRadius: 5,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  dateFilterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  dateFilter: {
    width: '48%',
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 10,
  },
  smallLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  dateInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  featureFilter: {
    marginBottom: 10,
  },
  featureLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 5,
  },
  featureDropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  activeFilters: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  filterTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8E4F3',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 15,
    marginRight: 10,
  },
  filterTagText: {
    color: '#3C3169',
    marginRight: 5,
    fontSize: 12,
  },
  roomList: {
    paddingBottom: 20,
  },
  roomCard: {
    backgroundColor: 'white',
    borderRadius: 5,
    marginBottom: 15,
    overflow: 'hidden',
    borderLeftWidth: 4,
    borderLeftColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  roomHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  roomNumber: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 10,
  },
  statusText: {
    color: 'white',
    marginLeft: 'auto',
  },
  // New styles for room images
  roomImage: {
    width: '100%',
    height: 150,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  modalRoomImage: {
    width: '100%',
    height: 200,
  },
  roomContent: {
    padding: 10,
  },
  roomInfo: {
    fontSize: 13,
    color: '#555',
    marginBottom: 3,
  },
  guestInfo: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 8,
    color: '#333',
  },
  dateInfo: {
    fontSize: 12,
    color: '#666',
    marginTop: 3,
  },
  maintenanceInfo: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 8,
    color: '#FF9800',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  priceLabel: {
    fontSize: 13,
    color: '#333',
  },
  price: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#3C3169',
  },
  roomActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    flex: 1,
  },
  buttonText: {
    marginLeft: 5,
    color: '#3C3169',
    fontSize: 12,
    fontWeight: '500',
  },
  reserveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    backgroundColor: '#3C3169',
    flex: 1,
  },
  reserveText: {
    marginLeft: 5,
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    maxHeight: '90%',
    backgroundColor: 'white',
    borderRadius: 10,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#3C3169',
    padding: 15,
  },
  modalTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalBody: {
    padding: 15,
  },
  roomInfoSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 15,
    marginBottom: 10,
  },
  statusBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  roomDetailText: {
    fontSize: 14,
    color: '#555',
    marginBottom: 5,
  },
  guestSection: {
    marginBottom: 20,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE8E7',
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
    marginTop: 10,
  },
  cancelText: {
    color: '#E53935',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 5,
  },
  amenitiesSection: {
    marginBottom: 20,
  },
  amenitiesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  amenityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8E4F3',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 10,
    marginBottom: 10,
  },
  amenityText: {
    color: '#3C3169',
    fontSize: 12,
    marginLeft: 5,
  },
  closeButton: {
    backgroundColor: '#3C3169',
    paddingVertical: 12,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  dropdownMenu: {
    backgroundColor: 'white',
    borderRadius: 5,
    padding: 5,
    marginTop: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    zIndex: 10,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedDropdownItem: {
    backgroundColor: '#E8E4F3',
  },
  dropdownText: {
    color: '#333',
  },
  selectedDropdownText: {
    fontWeight: 'bold',
    color: '#3C3169',
  },
  featuresDropdownMenu: {
    marginTop: 10,
    backgroundColor: 'white',
    borderRadius: 5,
    padding: 5,
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  featureCheckItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkedBox: {
    backgroundColor: '#3C3169',
    borderColor: '#3C3169',
  },
  featureItemText: {
    color: '#333',
  },
  filterActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
  },
  clearFiltersButton: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginRight: 10,
    alignItems: 'center',
  },
  clearFiltersText: {
    color: '#E53935',
    fontSize: 14,
    fontWeight: 'bold',
  },
  applyFiltersButton: {
    backgroundColor: '#3C3169',
    padding: 10,
    borderRadius: 5,
    flex: 1,
    alignItems: 'center',
  },
  applyFiltersText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyState: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 50,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 10,
    color: '#333',
    textAlign: 'center',
  },
  emptyStateText: {
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 20,
  },
  resetButton: {
    backgroundColor: '#3C3169',
    padding: 10,
    borderRadius: 5,
    paddingHorizontal: 20,
  },
  resetButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  clearAllTag: {
    backgroundColor: '#F5F5F5',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
    marginLeft: 5,
  },
  clearAllText: {
    color: '#E53935',
    fontSize: 12,
    fontWeight: '500',
  },
  calendarModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  calendarContainer: {
    width: '85%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeCalendarButton: {
    padding: 5,
  },
  monthSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  monthYearText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3C3169',
  },
  daysOfWeek: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
    marginBottom: 5,
  },
  dayOfWeekText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  dayCell: {
    width: '14.28%',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 2,
  },
  validDay: {
    backgroundColor: '#f9f9f9',
    borderRadius: 20,
  },
  emptyDay: {
    backgroundColor: 'transparent',
  },
  dayText: {
    fontSize: 14,
  },
  validDayText: {
    color: '#333',
  },
  emptyDayText: {
    color: 'transparent',
  },
  selectedDay: {
    backgroundColor: '#3C3169',
    borderRadius: 20,
  },
  todayDay: {
    backgroundColor: '#E8E4F3',
    borderRadius: 20,
  },
  selectedDayText: {
    color: 'white',
    fontWeight: 'bold',
  },
  todayDayText: {
    color: '#3C3169',
    fontWeight: '600',
  },
  calendarActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 15,
  },
  calendarButton: {
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  calendarButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  // Calendar view styles
  calendarViewContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  calendarViewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginBottom: 10,
  },
  dateRangeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  todayButton: {
    backgroundColor: '#3C3169',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
    marginLeft: 10,
  },
  todayButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  calendarHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  roomNumberCell: {
    width: 80,
    borderRightWidth: 1,
    borderRightColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
  },
  roomNumberHeaderText: {
    fontWeight: 'bold',
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
  },
  dateHeaderCell: {
    width: 70,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },
  dateHeaderText: {
    fontSize: 11,
    color: '#333',
    fontWeight: '500',
    textAlign: 'center',
  },
  roomRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  roomNumberText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  roomStatusCell: {
    width: 70,
    height: 40,
    borderWidth: 0.5,
    borderColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 15,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 4,
    marginRight: 5,
  },
  legendText: {
    fontSize: 12,
    color: '#333',
  },
  guestInputContainer: {
    marginVertical: 15,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 5,
    color: '#333',
  },
  guestInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
  },
  reservationInfo: {
    backgroundColor: '#f9f9f9',
    padding: 10,
    borderRadius: 5,
    marginTop: 5,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelReservationButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  cancelText: {
    color: '#E53935',
    fontSize: 14,
    fontWeight: '500',
  },
  confirmReservationButton: {
    backgroundColor: '#3C3169',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    alignItems: 'center',
    flex: 2,
  },
  confirmText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
}); 