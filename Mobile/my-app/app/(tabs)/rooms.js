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
  ActivityIndicator
} from 'react-native';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { useLocalSearchParams, useFocusEffect, useRouter } from 'expo-router';
import Colors from '../../constants/Colors';
import roomService from '../../services/roomService';
import { useAuth } from '../../context/AuthContext';
import { hasPageAccess } from '../../services/roleService';

export default function RoomsScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const username = params.username || "Utku Adanur";
  
  // Check for role-based access control
  useEffect(() => {
    if (!user) return;
    
    // Check if user has permission to access this page
    const canAccess = hasPageAccess(user, 'rooms');
    
    if (!canAccess) {
      console.log('User does not have permission to access Rooms');
      router.push({
        pathname: '/access-denied',
        params: { returnPath: '/(tabs)', page: 'Room Status' }
      });
    }
  }, [user, router]);
  
  // Get today's date formatted as DD.MM.YYYY
  const getTodayFormatted = () => {
    const today = new Date();
    const day = today.getDate().toString().padStart(2, '0');
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const year = today.getFullYear();
    return `${day}.${month}.${year}`;
  };
  
  const [activeView, setActiveView] = useState('card'); // 'card' or 'calendar'
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showFeaturesDropdown, setShowFeaturesDropdown] = useState(false);
  const [selectedFeatures, setSelectedFeatures] = useState([]);
  const [startDate, setStartDate] = useState(getTodayFormatted()); // Initialize with today's date
  const [endDate, setEndDate] = useState('');
  const [activeFilters, setActiveFilters] = useState([{ type: 'startDate', value: getTodayFormatted() }]); // Add today's date as initial filter
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarType, setCalendarType] = useState(''); // 'start' or 'end'
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarViewRange, setCalendarViewRange] = useState({
    start: new Date(), // Today's date
    end: new Date(new Date().setDate(new Date().getDate() + 6)) // 6 days after today (total 7 days)
  });
  const [reservationModalVisible, setReservationModalVisible] = useState(false);
  const [reservationRoom, setReservationRoom] = useState(null);
  const [reservationDates, setReservationDates] = useState({ start: '', end: '' });
  const [customerIdNumber, setCustomerIdNumber] = useState('');
  const [numberOfGuests, setNumberOfGuests] = useState('2');
  const [showReservationDateModal, setShowReservationDateModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Room data state
  const [rooms, setRooms] = useState([]);

  // All available features for filtering - Use English names
  const availableFeatures = ['TV', 'WiFi', 'Air Conditioning', 'Hot Tub', 'Balcony', 'Coffee Machine', 'Minibar'];

  // useFocusEffect to fetch rooms data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('Rooms screen focused, fetching today\'s rooms...');
      // Set view to card view each time
      setActiveView('card');
      
      // Reset filters to today's date
      const todayDate = getTodayFormatted();
      setStartDate(todayDate);
      setEndDate('');
      setActiveFilters([{ type: 'startDate', value: todayDate }]);
      setStatusFilter('All');
      setSelectedFeatures([]);
      
      // Fetch rooms with today's date
      fetchRooms();
      
      return () => {
        // Cleanup if needed when screen loses focus
        console.log('Rooms screen unfocused');
      };
    }, [])
  );

  // useEffect to set card view as default when component mounts
  useEffect(() => {
    setActiveView('card');
  }, []);

  // Fetch rooms data from API on component mount
  useEffect(() => {
    fetchRooms();
  }, [startDate, endDate]); // Re-fetch rooms when date filters change

  // Function to fetch rooms from API
  const fetchRooms = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Prepare filter parameters
      const params = {};
      
      // Add date filters if available
      if (startDate) {
        // Convert DD.MM.YYYY to YYYY-MM-DD
        const [day, month, year] = startDate.split('.');
        params.AvailabilityStartDate = `${year}-${month}-${day}`;
      }
      
      if (endDate) {
        // Convert DD.MM.YYYY to YYYY-MM-DD
        const [day, month, year] = endDate.split('.');
        params.AvailabilityEndDate = `${year}-${month}-${day}`;
      }
      
      // Add maintenance filter if needed
      if (statusFilter === 'Under Maintenance') {
        params.IsOnMaintenance = true;
      }
      
      // Get rooms from API
      const response = await roomService.getAllRooms(params);
      
      // Transform API response to match our UI format
      const formattedRooms = response.data.map(room => roomService.formatRoomData(room));
      
      console.log("Formatted rooms (first 2):", formattedRooms.slice(0, 2).map(r => ({id: r.id, roomNumber: r.roomNumber})));
      setRooms(formattedRooms);
    } catch (err) {
      console.error('Error fetching rooms:', err);
      setError('An error occurred while loading rooms. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Refresh room data with default today filter
  const refreshRooms = () => {
    // Reset to today's date
    const todayDate = getTodayFormatted();
    
    // Update start date to today
    setStartDate(todayDate);
    
    // Clear end date
    setEndDate('');
    
    // Update filters to just show today
    setActiveFilters([{ type: 'startDate', value: todayDate }]);
    
    // Reset status filter
    setStatusFilter('All');
    
    // Clear selected features
    setSelectedFeatures([]);
    
    // Fetch rooms (useEffect will trigger this since startDate is changed)
    fetchRooms();
  };

  // Function to parse date string to Date object
  const parseDate = (dateStr) => {
    if (!dateStr) return null;
    const [day, month, year] = dateStr.split('.').map(Number);
    return new Date(year, month - 1, day);
  };

  // Filter the rooms based on search text, status filter, and other filters
  const filteredRooms = rooms.filter(room => {
    // Filter by search text (room number)
    if (searchText && !room.roomNumber?.toLowerCase().includes(searchText.toLowerCase())) {
      return false;
    }
    
    // Filter by status
    if (statusFilter !== 'All') {
      const statusMap = {
        'Available': 'available',
        'Occupied': 'occupied',
        'Under Maintenance': 'maintenance'
      };
      
      // Get actual status based on current data
      let actualStatus = room.status;
      
      if (actualStatus !== statusMap[statusFilter]) {
        return false;
      }
    }
    
    // Filter by selected features/amenities
    if (selectedFeatures.length > 0) {
      for (const feature of selectedFeatures) {
        // Room cannot pass filter if it has no features
        if (!room.features || !room.features.length) return false;
        
        // Check if room has this feature
        let featureExists = false;
        const featureLower = feature.toLowerCase().trim();

        // Compare with each room feature
        for (const roomFeature of room.features) {
          const roomFeatureLower = roomFeature.toLowerCase().trim();
          
          // Direct match check
          if (roomFeatureLower === featureLower) {
            featureExists = true;
            break;
          }
          
          // Handle Wi-Fi/WiFi case
          if ((featureLower === 'wi-fi' || featureLower === 'wifi') && 
              (roomFeatureLower.includes('wifi') || roomFeatureLower.includes('wi-fi'))) {
            featureExists = true;
            break;
          }
          
          // Handle Hot Tub/Jacuzzi case
          if ((featureLower === 'jakuzi' || featureLower === 'hot tub' || featureLower === 'jacuzzi') && 
              (roomFeatureLower.includes('jacuzzi') || roomFeatureLower.includes('hot tub') || roomFeatureLower.includes('jakuzi'))) {
            featureExists = true;
            break;
          }
          
          // Handle Mini Bar/Minibar case
          if ((featureLower === 'mini bar' || featureLower === 'minibar') && 
              (roomFeatureLower.includes('minibar') || roomFeatureLower.includes('mini bar') || roomFeatureLower.includes('mini-bar'))) {
            featureExists = true;
            break;
          }
          
          // Handle Air Conditioning case
          if ((featureLower === 'klima' || featureLower === 'air conditioning') && 
              (roomFeatureLower.includes('air conditioning') || roomFeatureLower.includes('klima') || roomFeatureLower.includes('ac'))) {
            featureExists = true;
            break;
          }
          
          // Handle Balcony case
          if ((featureLower === 'balkon' || featureLower === 'balcony') && 
              (roomFeatureLower.includes('balcony') || roomFeatureLower.includes('balkon'))) {
            featureExists = true;
            break;
          }
          
          // Handle Coffee Machine case
          if ((featureLower === 'kahve mak.' || featureLower === 'coffee machine') && 
              (roomFeatureLower.includes('coffee') || roomFeatureLower.includes('kahve'))) {
            featureExists = true;
            break;
          }
          
          // Handle Sea View case
          if ((featureLower === 'deniz manzarası' || featureLower === 'sea view') && 
              (roomFeatureLower.includes('sea view') || roomFeatureLower.includes('deniz manzarası'))) {
            featureExists = true;
            break;
          }
          
          // General partial match check
          if (roomFeatureLower.includes(featureLower) || featureLower.includes(roomFeatureLower)) {
            featureExists = true;
            break;
          }
        }
        
        if (!featureExists) {
          return false;
        }
      }
    }
    
    // Apply date range filtering if specified
    if (startDate || endDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const searchStartDate = startDate ? parseDate(startDate) : today;
      const searchEndDate = endDate ? parseDate(endDate) : null;
      
      // Check if room has checkout date or maintenance completion date
      if (room.status === 'occupied') {
        const checkoutDate = parseDate(room.checkOut);
        
        // If checkout date is set and before our search start date
        // then this room will be available for the dates we're looking for
        if (checkoutDate && checkoutDate < searchStartDate) {
          return true; // Room will be available by our desired start date
        }
      } else if (room.status === 'maintenance') {
        const completionDate = parseDate(room.expectedCompletion);
        
        // If maintenance completion date is set and before our search start date
        // then this room will be available for the dates we're looking for
        if (completionDate && completionDate < searchStartDate) {
          return true; // Room will be available by our desired start date
        }
      }
    }
    
    return true;
  });
  
  // For Calendar view, filter by date availability
  const isRoomAvailableForDate = (room, date) => {
    // Format date for comparison
    const formatDate = (d) => {
      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };
    
    const currentDate = new Date(date);
    currentDate.setHours(0, 0, 0, 0);
    
    // Check if room is under maintenance
    if (room.maintenanceIssueDescription) {
      const completionDate = parseDate(room.expectedCompletion);
      // If maintenance ends before or on this date, room will be available
      if (completionDate && completionDate <= currentDate) {
        return true;
      } else if (!completionDate) {
        // No completion date means indefinite maintenance
        return false;
      } else {
        return false; // Still under maintenance on this date
      }
    }
    
    // Check if room is occupied
    if (room.currentReservationId) {
      const checkoutDate = parseDate(room.checkOut);
      // If guest checks out before or on this date, room will be available
      if (checkoutDate && checkoutDate <= currentDate) {
        return true;
      } else {
        return false; // Still occupied on this date
      }
    }
    
    // If not under maintenance or occupied, room is available
    return true;
  };

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
        return 'Available';
      case 'occupied':
        return 'Occupied';
      case 'maintenance':
        return 'Under Maintenance';
      default:
        return 'Unknown';
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
    // Check if we're looking at a future date 
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const searchStartDate = startDate ? parseDate(startDate) : today;
    
    // Deep copy the room to modify without affecting the original
    const roomCopy = JSON.parse(JSON.stringify(room));
    
    // If we're looking at a future date, recalculate the status
    if (searchStartDate > today) {
      if (roomCopy.status === 'occupied') {
        const checkoutDate = parseDate(roomCopy.checkOut);
        if (checkoutDate && checkoutDate < searchStartDate) {
          // Room will be available by our search date
          roomCopy.status = 'available';
          roomCopy.futureDateInfo = {
            originalStatus: 'occupied',
            availableFrom: roomCopy.checkOut,
            searchDate: startDate
          };
        }
      } else if (roomCopy.status === 'maintenance') {
        const completionDate = parseDate(roomCopy.expectedCompletion);
        if (completionDate && completionDate < searchStartDate) {
          // Room will be available by our search date
          roomCopy.status = 'available';
          roomCopy.futureDateInfo = {
            originalStatus: 'maintenance',
            availableFrom: roomCopy.expectedCompletion,
            searchDate: startDate
          };
        }
      }
    }
    
    setSelectedRoom(roomCopy);
    setModalVisible(true);
  };

  const handleStatusFilter = (status) => {
    setStatusFilter(status);
    setShowStatusDropdown(false);
    
    // Update active filters
    const newFilters = [...activeFilters.filter(f => f.type !== 'status')];
    if (status !== 'All') {
      newFilters.push({ type: 'status', value: status });
    }
    setActiveFilters(newFilters);
  };

  // Helper function for feature translation
  const translateFeature = (feature) => {
    if (!feature) return '';
    
    switch (feature.toLowerCase()) {
      case 'tv': return 'TV';
      case 'wifi': case 'wi-fi': return 'Wi-Fi';
      case 'air conditioning': case 'ac': return 'Air Conditioning';
      case 'hot tub': case 'jacuzzi': return 'Hot Tub';
      case 'balcony': return 'Balcony';
      case 'coffee machine': case 'coffee maker': return 'Coffee Machine';
      case 'minibar': return 'Minibar';
      case 'sea view': return 'Sea View';
      case 'refrigerator': case 'fridge': return 'Refrigerator';
      case 'shower': return 'Shower';
      case 'bathtub': return 'Bathtub';
      case 'safe': return 'Safe';
      case 'desk': return 'Desk';
      default: return feature; // Return original text for unknown features
    }
  };

  // Helper function for feature icon selection
  const getFeatureIcon = (feature) => {
    if (!feature) return 'check';
    
    const lowercaseFeature = feature.toLowerCase();
    
    // Check for TV
    if (lowercaseFeature.includes('tv')) return 'tv';
    
    // Check for Wi-Fi
    if (lowercaseFeature.includes('wifi') || lowercaseFeature.includes('wi-fi')) return 'wifi';
    
    // Check for Air Conditioning
    if (lowercaseFeature.includes('air') || 
        lowercaseFeature.includes('conditioning') || 
        lowercaseFeature.includes('klima')) return 'ac-unit';
    
    // Check for Hot Tub
    if (lowercaseFeature.includes('hot') || 
        lowercaseFeature.includes('tub') || 
        lowercaseFeature.includes('jacuzzi') || 
        lowercaseFeature.includes('jakuzi')) return 'hot-tub';
    
    // Check for Balcony
    if (lowercaseFeature.includes('balcony') || 
        lowercaseFeature.includes('balkon')) return 'balcony';
    
    // Check for Coffee Machine
    if (lowercaseFeature.includes('coffee') || 
        lowercaseFeature.includes('kahve')) return 'coffee';
    
    // Check for Minibar
    if (lowercaseFeature.includes('minibar') || 
        lowercaseFeature.includes('mini bar') || 
        lowercaseFeature.includes('mini-bar')) return 'local-bar';
    
    // Check for Sea View
    if (lowercaseFeature.includes('sea') || 
        lowercaseFeature.includes('view') || 
        lowercaseFeature.includes('manzara')) return 'landscape';
    
    // Check for Refrigerator
    if (lowercaseFeature.includes('refrigerator') || 
        lowercaseFeature.includes('fridge') || 
        lowercaseFeature.includes('buzdolabı')) return 'kitchen';
    
    // Check for Shower
    if (lowercaseFeature.includes('shower') || 
        lowercaseFeature.includes('duş')) return 'shower';
    
    // Check for Bathtub
    if (lowercaseFeature.includes('bathtub') || 
        lowercaseFeature.includes('küvet')) return 'bathtub';
    
    // Check for Safe
    if (lowercaseFeature.includes('safe') || 
        lowercaseFeature.includes('kasa')) return 'lock';
    
    // Check for Desk
    if (lowercaseFeature.includes('desk') || 
        lowercaseFeature.includes('çalışma') || 
        lowercaseFeature.includes('masa')) return 'desktop-mac';
    
    return 'star'; // Star icon for unknown features
  };

  // Feature color selection
  const getFeatureColor = (feature) => {
    if (!feature) return '#666';
    
    const lowercaseFeature = feature.toLowerCase();
    
    // Assign specific color for each feature
    if (lowercaseFeature.includes('wifi') || lowercaseFeature.includes('wi-fi')) 
      return '#0077B6'; // Blue
    
    if (lowercaseFeature.includes('tv')) 
      return '#2E7D32'; // Green
    
    if (lowercaseFeature.includes('air') || lowercaseFeature.includes('conditioning') || lowercaseFeature.includes('klima')) 
      return '#00B4D8'; // Light blue
    
    if (lowercaseFeature.includes('hot') || lowercaseFeature.includes('tub') || lowercaseFeature.includes('jakuzi') || lowercaseFeature.includes('jacuzzi')) 
      return '#D81B60'; // Pink
    
    if (lowercaseFeature.includes('balcony') || lowercaseFeature.includes('balkon')) 
      return '#FF9800'; // Orange
    
    if (lowercaseFeature.includes('coffee') || lowercaseFeature.includes('kahve')) 
      return '#795548'; // Brown
    
    if (lowercaseFeature.includes('minibar') || lowercaseFeature.includes('mini bar') || lowercaseFeature.includes('mini-bar')) 
      return '#8E24AA'; // Purple
    
    if (lowercaseFeature.includes('sea') || lowercaseFeature.includes('view') || lowercaseFeature.includes('manzara')) 
      return '#039BE5'; // Ocean blue
    
    if (lowercaseFeature.includes('refrigerator') || lowercaseFeature.includes('fridge') || lowercaseFeature.includes('buzdolabı')) 
      return '#26A69A'; // Teal
    
    if (lowercaseFeature.includes('shower') || lowercaseFeature.includes('duş')) 
      return '#29B6F6'; // Light blue
    
    if (lowercaseFeature.includes('bathtub') || lowercaseFeature.includes('küvet')) 
      return '#42A5F5'; // Blue
    
    if (lowercaseFeature.includes('safe') || lowercaseFeature.includes('kasa')) 
      return '#455A64'; // Navy-gray
    
    if (lowercaseFeature.includes('desk') || lowercaseFeature.includes('çalışma') || lowercaseFeature.includes('masa')) 
      return '#5D4037'; // Dark brown
    
    return '#666'; // Default gray
  };

  // Helper function to convert display feature name to database name
  const getOriginalFeatureName = (displayName) => {
    if (!displayName) return '';
    
    // Convert to lowercase and trim spaces
    const normalizedName = displayName.toLowerCase().trim();
    
    switch (normalizedName) {
      case 'tv': return 'TV';
      
      // Wi-Fi variations
      case 'wi-fi': 
      case 'wifi': 
      case 'wi fi': 
        return 'WiFi';
      
      // Air Conditioning variations
      case 'klima': 
      case 'air conditioning': 
      case 'ac': 
        return 'Air Conditioning';
      
      // Hot Tub variations
      case 'jakuzi': 
      case 'hot tub': 
      case 'jacuzzi': 
        return 'Hot Tub';
      
      // Balcony variations
      case 'balkon': 
      case 'balcony': 
        return 'Balcony';
      
      // Coffee Machine variations
      case 'kahve mak.': 
      case 'kahve makinesi': 
      case 'coffee machine': 
      case 'coffee maker': 
        return 'Coffee Machine';
      
      // Minibar variations
      case 'mini bar': 
      case 'minibar': 
      case 'mini-bar': 
        return 'Minibar';
      
      // Sea View variations
      case 'deniz manzarası': 
      case 'sea view': 
        return 'Sea View';
        
      default: return displayName;
    }
  };

  // Helper function to find a feature
  const findFeatureByName = (features, featureName) => {
    if (!features || !features.length) return false;
    
    // Search by Turkish or English name
    const lowercaseFeatureName = featureName.toLowerCase();
    return features.some(feature => {
      // Look at both original and translated names
      const translatedName = translateFeature(feature).toLowerCase();
      return feature.toLowerCase().includes(lowercaseFeatureName) || 
             translatedName.includes(lowercaseFeatureName);
    });
  };

  // Check if a feature is selected (English only)
  const isFeatureSelected = (feature) => {
    if (!selectedFeatures || !selectedFeatures.length) return false;
    return selectedFeatures.some(selectedFeature => 
      selectedFeature.toLowerCase() === feature.toLowerCase()
    );
  };
  
  const handleFeatureToggle = (feature) => {
    // Get current selected features
    let newSelectedFeatures = [...selectedFeatures];
    
    // Check if feature is already selected
    const index = newSelectedFeatures.findIndex(
      f => f.toLowerCase() === feature.toLowerCase()
    );
    
    if (index !== -1) {
      // Feature is already selected, remove it
      newSelectedFeatures.splice(index, 1);
    } else {
      // Feature is not selected, add it
      newSelectedFeatures.push(feature);
    }
    
    setSelectedFeatures(newSelectedFeatures);
    
    // Update active filters
    const newFilters = [...activeFilters.filter(f => 
      f.type !== 'feature' || f.value !== feature
    )];
    
    if (index === -1) {
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
      setStatusFilter('All');
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
    setStatusFilter('All');
    setSelectedFeatures([]);
    setStartDate('');
    setEndDate('');
    setActiveFilters([]);
    setShowStatusDropdown(false);
    setShowFeaturesDropdown(false);
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
      // Check if end date is after start date
      if (startDate) {
        const startDateObj = parseDate(startDate);
        if (date < startDateObj) {
          alert("Invalid Date Range - End date must be after start date.");
          return;
        }
      }
      handleDateChange(formattedDate, 'end');
    } else if (calendarType === 'reservationStart') {
      // When selecting reservation start date, update start date and clear end date if needed
      const newStartDate = formattedDate;
      setReservationDates(prev => {
        // If there's an existing end date, check if it's still valid
        if (prev.end) {
          const endDateObj = parseDate(prev.end);
          if (date >= endDateObj) {
            // End date is now invalid, clear it
            return { start: newStartDate, end: '' };
          }
        }
        return { ...prev, start: newStartDate };
      });
    } else if (calendarType === 'reservationEnd') {
      // When selecting reservation end date, make sure it's after start date
      if (reservationDates.start) {
        const startDateObj = parseDate(reservationDates.start);
        if (date <= startDateObj) {
          alert("Invalid Date - End date must be after start date.");
          return;
        }
      }
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
    
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthDays = getDaysInMonth(currentMonth);
    const month = currentMonth.toLocaleString('en-US', { month: 'long' });
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
                {calendarType === 'start' ? 'Start Date' : 'End Date'}
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
                <MaterialIcons name="chevron-left" size={24} color="#6B3DC9" />
              </TouchableOpacity>
              <Text style={styles.monthYearText}>{`${month} ${year}`}</Text>
              <TouchableOpacity onPress={() => changeMonth(1)}>
                <MaterialIcons name="chevron-right" size={24} color="#6B3DC9" />
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
                <Text style={[styles.calendarButtonText, { color: '#666' }]}>CANCEL</Text>
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
                  <Text style={[styles.calendarButtonText, { color: '#E53935' }]}>CLEAR</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity 
                style={[styles.calendarButton, { backgroundColor: '#6B3DC9', flex: 1 }]}
                onPress={() => setShowCalendar(false)}
              >
                <Text style={[styles.calendarButtonText, { color: 'white' }]}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const handleReservation = (room, selectedDate = null) => {
    // Log room object to help debug
    console.log("Room for reservation:", JSON.stringify(room, null, 2));
    console.log("DEBUG - handleReservation - Room ID:", room.id, "Room Number:", room.roomNumber);
    
    // If we have a selected date from calendar view, use it
    if (selectedDate) {
      const formatDateString = (date) => {
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}.${month}.${year}`;
      };
      // Set start date to selected date
      const startDateStr = formatDateString(selectedDate);
      // Set end date to day after selected date
      const endDate = new Date(selectedDate);
      endDate.setDate(endDate.getDate() + 1);
      const endDateStr = formatDateString(endDate);
      // Set up the reservation with pre-filled dates
      setReservationRoom({
        ...room,
        id: room.id // Use room.id directly, no fallback
      });
      setReservationDates({ start: startDateStr, end: endDateStr });
      setCustomerIdNumber('');
      setNumberOfGuests('2');
      setReservationModalVisible(true);
    } else {
      // Original behavior for non-calendar reservation
      if (!startDate || !endDate) {
        setReservationRoom({
          ...room,
          id: room.id // Use room.id directly, no fallback
        });
        setReservationDates({ start: '', end: '' });
        setShowReservationDateModal(true);
      } else {
        setReservationRoom({
          ...room,
          id: room.id // Use room.id directly, no fallback
        });
        setReservationDates({ start: startDate, end: endDate });
        setCustomerIdNumber('');
        setNumberOfGuests('2');
        setReservationModalVisible(true);
      }
    }
  };

  // Add this function to format the date nicely for display
  const formatDateForDisplay = (date) => {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const dayName = dayNames[date.getDay()];
    
    return `${day}.${month}.${year} ${dayName}`;
  };

  // Add this function to show the room details with reservation option
  const showRoomDetailsForReservation = (room, selectedDate) => {
    setSelectedRoom({
      ...room,
      showReservationOption: true,
      selectedDate
    });
    setModalVisible(true);
  };

  const confirmReservation = async () => {
    if (!customerIdNumber.trim()) {
      alert('Error - Please enter customer ID number.');
      return;
    }
    
    if (!reservationDates.start || !reservationDates.end) {
      alert('Error - Please select check-in and check-out dates.');
      return;
    }
    
    // Parse dates to validate
    const startDateObj = parseDate(reservationDates.start);
    const endDateObj = parseDate(reservationDates.end);
    
    if (endDateObj <= startDateObj) {
      alert("Invalid Date Range - End date must be after start date.");
      return;
    }
    
    // Validate number of guests against room capacity
    if (reservationRoom) {
      const roomCapacity = parseInt(reservationRoom.capacity) || 2;
      const guestNum = parseInt(numberOfGuests) || 1;
      
      if (guestNum > roomCapacity) {
        alert(`Capacity Exceeded - This room has a maximum capacity of ${roomCapacity} people.`);
        setNumberOfGuests(roomCapacity.toString());
        return;
      }
    }
    
    try {
      setIsLoading(true);
      console.log("Reservation dates:", reservationDates);
      
      // Format dates for API (DD.MM.YYYY to YYYY-MM-DD)
      const formatDateForApi = (dateStr) => {
        // Parse DD.MM.YYYY format
        const parts = dateStr.split('.');
        if (parts.length !== 3) {
          console.error("Invalid date format:", dateStr);
          return null;
        }
        
        const day = parts[0].padStart(2, '0');
        const month = parts[1].padStart(2, '0');
        const year = parts[2];
        
        // Return in YYYY-MM-DD format
        return `${year}-${month}-${day}`;
      };
      
      // Create reservation payload
      const reservationData = {
        roomId: reservationRoom.roomId || reservationRoom.id,
        customerIdNumber: customerIdNumber.trim(),
        checkInDate: formatDateForApi(reservationDates.start),
        checkOutDate: formatDateForApi(reservationDates.end),
        numberOfGuests: parseInt(numberOfGuests) || 1
      };
      
      // Debug - Room ID being sent to API
      console.log("DEBUG - confirmReservation - Room ID:", reservationRoom.roomId || reservationRoom.id);
      console.log("DEBUG - confirmReservation - Full room object:", JSON.stringify(reservationRoom, null, 2));
      
      console.log("Sending reservation data:", reservationData);
      
      // Call API to create reservation
      try {
        const response = await roomService.reserveRoom(reservationData);
        console.log("Reservation response:", response);
        
        // Refresh data immediately after successful reservation
        if (activeView === 'calendar') {
          console.log('Refreshing calendar data immediately after reservation...');
          await fetchCalendarViewData(); // Refresh calendar data immediately
        } else {
          console.log('Refreshing card view data immediately after reservation...');
          await fetchRooms(); // Refresh card view data immediately
        }
        
        // Close modal
        setReservationModalVisible(false);
        
        // Show confirmation and refresh data
        alert(`Success - Room ${reservationRoom.roomNumber || reservationRoom.id} has been successfully reserved.`);
        
        // Refresh data again based on active view
        if (activeView === 'calendar') {
          console.log('Refreshing calendar data again after alert...');
          fetchCalendarViewData();
        } else {
          console.log('Refreshing card view data again after alert...');
          refreshRooms();
        }
      } catch (error) {
        console.error('API error:', error);
        let errorMessage = 'An error occurred while making the reservation.';
        
        if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        alert(`Reservation Error - ${errorMessage}`);
      }
    } catch (error) {
      console.error('Reservation error:', error);
      alert('Error - An error occurred while making the reservation. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderReservationModal = () => {
    if (!reservationRoom) return null;
    
    // Get room capacity as a number
    const roomCapacity = parseInt(reservationRoom.capacity) || 2;
    
    // Validate and update number of guests
    const handleGuestNumberChange = (value) => {
      // Remove any non-numeric characters
      const numericValue = value.replace(/[^0-9]/g, '');
      
      // Convert to number (default to 1 if empty)
      const guestNum = numericValue === '' ? '' : parseInt(numericValue);
      
      // Ensure number is not higher than room capacity
      if (guestNum > roomCapacity) {
        // If over capacity, set to max capacity
        setNumberOfGuests(roomCapacity.toString());
        // Optionally show alert about the limit
        alert(`Warning - This room has a maximum capacity of ${roomCapacity} people.`);
      } else if (guestNum === 0) {
        // Minimum 1 guest
        setNumberOfGuests('1');
      } else {
        // Valid input
        setNumberOfGuests(numericValue);
      }
    };
    
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={reservationModalVisible}
        onRequestClose={() => setReservationModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.reservationModalContent}>
            <View style={styles.reservationModalHeader}>
              <Text style={styles.reservationModalTitle}>Reservation for Room {reservationRoom.id}</Text>
              <TouchableOpacity onPress={() => setReservationModalVisible(false)}>
                <MaterialIcons name="close" size={24} color="#888" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.reservationModalBody}>
              {/* Customer ID */}
              <View style={styles.reservationInputGroup}>
                <Text style={styles.reservationInputLabel}>
                  <MaterialIcons name="person" size={18} color="#666" /> Customer ID Number:
                </Text>
                <TextInput
                  style={styles.reservationTextInput}
                  placeholder="11-digit ID Number"
                  value={customerIdNumber}
                  onChangeText={setCustomerIdNumber}
                  keyboardType="number-pad"
                  maxLength={11}
                />
              </View>
              
              {/* Check-in Date */}
              <View style={styles.reservationInputGroup}>
                <Text style={styles.reservationInputLabel}>
                  <MaterialIcons name="calendar-today" size={18} color="#666" /> Check-in Date:
                </Text>
                <TouchableOpacity 
                  style={styles.reservationDateInput}
                  onPress={() => {
                    setCalendarType('reservationStart');
                    setShowCalendar(true);
                  }}
                >
                  <Text>{reservationDates.start || 'DD.MM.YYYY'}</Text>
                </TouchableOpacity>
              </View>
              
              {/* Check-out Date */}
              <View style={styles.reservationInputGroup}>
                <Text style={styles.reservationInputLabel}>
                  <MaterialIcons name="calendar-today" size={18} color="#666" /> Check-out Date:
                </Text>
                <TouchableOpacity 
                  style={styles.reservationDateInput}
                  onPress={() => {
                    setCalendarType('reservationEnd');
                    setShowCalendar(true);
                  }}
                >
                  <Text>{reservationDates.end || 'DD.MM.YYYY'}</Text>
                </TouchableOpacity>
              </View>
              
              {/* Number of Guests */}
              <View style={styles.reservationInputGroup}>
                <Text style={styles.reservationInputLabel}>
                  <MaterialIcons name="people" size={18} color="#666" /> Number of Guests: 
                  <Text style={styles.capacityInfo}> (Max: {roomCapacity} people)</Text>
                </Text>
                <View style={styles.guestNumberContainer}>
                  <TouchableOpacity 
                    style={styles.guestNumberButton}
                    onPress={() => {
                      const currentNum = parseInt(numberOfGuests) || 1;
                      if (currentNum > 1) {
                        setNumberOfGuests((currentNum - 1).toString());
                      }
                    }}
                    disabled={numberOfGuests === '1'}
                  >
                    <MaterialIcons 
                      name="remove" 
                      size={20} 
                      color={numberOfGuests === '1' ? '#ccc' : '#6B3DC9'} 
                    />
                  </TouchableOpacity>
                  
                  <TextInput
                    style={styles.guestNumberInput}
                    value={numberOfGuests}
                    onChangeText={handleGuestNumberChange}
                    keyboardType="number-pad"
                    maxLength={2}
                  />
                  
                  <TouchableOpacity 
                    style={styles.guestNumberButton}
                    onPress={() => {
                      const currentNum = parseInt(numberOfGuests) || 1;
                      if (currentNum < roomCapacity) {
                        setNumberOfGuests((currentNum + 1).toString());
                      } else {
                        alert(`Warning - This room has a maximum capacity of ${roomCapacity} people.`);
                      }
                    }}
                    disabled={parseInt(numberOfGuests) >= roomCapacity}
                  >
                    <MaterialIcons 
                      name="add" 
                      size={20} 
                      color={parseInt(numberOfGuests) >= roomCapacity ? '#ccc' : '#6B3DC9'} 
                    />
                  </TouchableOpacity>
                </View>
              </View>
              
              {/* Action Buttons */}
              <View style={styles.reservationButtonContainer}>
                <TouchableOpacity 
                  style={styles.reservationCancelBtn}
                  onPress={() => setReservationModalVisible(false)}
                >
                  <Text style={styles.reservationCancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.reservationCreateBtn}
                  onPress={confirmReservation}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <>
                      <MaterialIcons name="event-available" size={18} color="white" />
                      <Text style={styles.reservationCreateBtnText}>Create Reservation</Text>
                    </>
                  )}
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
              <Text style={styles.modalTitle}>Reservation Dates: Room {reservationRoom.id}</Text>
              <TouchableOpacity onPress={() => setShowReservationDateModal(false)}>
                <MaterialIcons name="close" size={24} color="white" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <Text style={styles.sectionTitle}>Select Reservation Dates</Text>
              
              <View style={styles.dateFilterRow}>
                <View style={[styles.dateFilter, { width: '48%' }]}>
                  <Text style={styles.smallLabel}>Check-in Date</Text>
                  <TouchableOpacity 
                    style={styles.dateInput}
                    onPress={() => {
                      setCalendarType('reservationStart');
                      setShowCalendar(true);
                    }}
                  >
                    <Text>{reservationDates.start || 'DD.MM.YYYY'}</Text>
                    <MaterialIcons name="calendar-today" size={16} color="#333" />
                  </TouchableOpacity>
                </View>
                
                <View style={[styles.dateFilter, { width: '48%' }]}>
                  <Text style={styles.smallLabel}>Check-out Date</Text>
                  <TouchableOpacity 
                    style={styles.dateInput}
                    onPress={() => {
                      setCalendarType('reservationEnd');
                      setShowCalendar(true);
                    }}
                  >
                    <Text>{reservationDates.end || 'DD.MM.YYYY'}</Text>
                    <MaterialIcons name="calendar-today" size={16} color="#333" />
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.modalActions}>
                <TouchableOpacity 
                  style={styles.cancelReservationButton}
                  onPress={() => setShowReservationDateModal(false)}
                >
                  <Text style={styles.cancelText}>CANCEL</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.confirmReservationButton}
                  onPress={handleReservationDateSelect}
                >
                  <Text style={styles.confirmText}>CONTINUE</Text>
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
      alert('Warning - Please select both check-in and check-out dates.');
      return;
    }
    
    // Parse dates to validate
    const startDateObj = parseDate(reservationDates.start);
    const endDateObj = parseDate(reservationDates.end);
    
    if (endDateObj <= startDateObj) {
      alert("Invalid Date Range - End date must be after start date.");
      return;
    }
    
    setShowReservationDateModal(false);
    setCustomerIdNumber('');
    setNumberOfGuests('2');
    setReservationModalVisible(true);
  };

  // Function to format maintenance completion date (remove time part)
  const formatMaintenanceDate = (dateString) => {
    if (!dateString) return "Not specified";
    
    // Check if dateString contains time (includes T or spaces followed by numbers and colons)
    if (dateString.includes('T') || /\s\d{1,2}:\d{1,2}/.test(dateString)) {
      // Extract just the date part
      const dateParts = dateString.split(/[T\s]/)[0];
      
      // If it's in YYYY-MM-DD format, convert to DD.MM.YYYY
      if (dateParts.includes('-')) {
        const [year, month, day] = dateParts.split('-');
        return `${day}.${month}.${year}`;
      }
      
      // If it's already in DD.MM.YYYY format
      return dateParts;
    }
    
    // If dateString is already just a date
    return dateString;
  };

  const renderRoomCard = ({ item }) => {
    // Check if the room is actually available for the selected dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const searchStartDate = startDate ? parseDate(startDate) : today;
    
    // Determine actual status for display
    let displayStatus = item.status;
    
    // If we're looking at a future date, recalculate the status
    if (searchStartDate > today) {
      if (item.status === 'occupied') {
        const checkoutDate = parseDate(item.checkOut);
        if (checkoutDate && checkoutDate < searchStartDate) {
          // Room will be available by our search date
          displayStatus = 'available';
        }
      } else if (item.status === 'maintenance') {
        const completionDate = parseDate(item.expectedCompletion);
        if (completionDate && completionDate < searchStartDate) {
          // Room will be available by our search date
          displayStatus = 'available';
        }
      }
    }
    
    // Status color based on actual status
    const statusColor = 
      displayStatus === 'occupied' ? '#E53935' :  // Red if reserved
      displayStatus === 'maintenance' ? '#FF9800' :  // Yellow if in maintenance
      '#4CAF50';  // Green if available
      
    // Determine whether to show reservation button
    const canReserve = displayStatus === 'available';
    
    return (
      <View style={styles.roomCard}>
        <View style={[
          styles.roomHeader, 
          { backgroundColor: statusColor }
        ]}>
          <Text style={styles.roomNumber}>{item.roomNumber || item.id}</Text>
          <Text style={styles.capacityText}>{item.capacity}</Text>
        </View>
        
        <View style={styles.roomContent}>
          {/* Feature Icons Row */}
          <View style={styles.amenitiesRow}>
            {item.features && item.features.map((feature, index) => {
              // Check if this is a Wi-Fi feature
              const isWifi = feature.toLowerCase().includes('wifi') || feature.toLowerCase().includes('wi-fi');
              
              return (
                <View key={index} style={styles.featureIconContainer}>
                  <MaterialIcons 
                    name={getFeatureIcon(feature)}
                    size={isWifi ? 20 : 18} 
                    color={getFeatureColor(feature)} 
                  />
                  <Text style={[styles.featureIconText, { color: getFeatureColor(feature) }]}>{translateFeature(feature)}</Text>
                </View>
              );
            })}
          </View>
          
          {displayStatus === 'available' && (
            <>
              <View style={styles.priceContainer}>
                <Text style={styles.priceLabel}>Nightly Rate: </Text>
                <Text style={styles.price}>{item.price}</Text>
              </View>
              <Text style={styles.roomTypeText}>{item.roomType}</Text>
              <Text style={styles.descriptionText}>{item.description}</Text>
            </>
          )}
          
          {displayStatus === 'occupied' && (
            <View style={styles.occupiedInfo}>
              <View style={styles.guestInfoRow}>
                <MaterialIcons name="person" size={18} color="#E53935" />
                <Text style={styles.guestInfo}>Guest: {item.occupantName || "Reserved"}</Text>
              </View>
              <View style={styles.dateInfoRow}>
                <MaterialIcons name="date-range" size={18} color="#666" />
                <Text style={styles.dateInfo}>Check-in: {item.occupantCheckInDate || item.checkIn || "Not specified"}</Text>
              </View>
              <View style={styles.dateInfoRow}>
                <MaterialIcons name="logout" size={18} color="#666" />
                <Text style={styles.dateInfo}>Check-out: {item.occupantCheckOutDate || item.checkOut || "Not specified"}</Text>
                {searchStartDate > today && (
                  <Text style={styles.futureAvailableInfo}> (Will be available on selected date)</Text>
                )}
              </View>
              
              <TouchableOpacity 
                style={styles.cancelReservationBtn}
                onPress={() => handleCancelReservation(item)}
              >
                <MaterialIcons name="cancel" size={16} color="#E53935" />
                <Text style={styles.cancelReservationText}>CANCEL RESERVATION</Text>
              </TouchableOpacity>
            </View>
          )}
          
          {displayStatus === 'maintenance' && (
            <View style={styles.maintenanceInfo}>
              <View style={styles.maintenanceRow}>
                <MaterialIcons name="build" size={18} color="#FF9800" />
                <Text style={styles.maintenanceText}>Maintenance: {item.maintenanceIssueDescription}</Text>
              </View>
              <View style={styles.dateInfoRow}>
                <MaterialIcons name="event-available" size={18} color="#666" />
                <Text style={styles.dateInfo}>Est. Completion: {formatMaintenanceDate(item.maintenanceCompletionDate || item.expectedCompletion)}</Text>
                {searchStartDate > today && (
                  <Text style={styles.futureAvailableInfo}> (Will be available on selected date)</Text>
                )}
              </View>
            </View>
          )}
          
          {/* Display selected date information if different from today */}
          {searchStartDate > today && (displayStatus !== item.status) && (
            <View style={styles.dateNoteContainer}>
              <MaterialIcons name="info-outline" size={16} color="#1565C0" />
              <Text style={styles.dateNoteText}>
                This room will be available on the selected date ({startDate})
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.roomActions}>
          <TouchableOpacity 
            style={styles.detailsButton}
            onPress={() => showRoomDetails(item)}
          >
            <MaterialIcons name="info-outline" size={16} color="#673AB7" />
            <Text style={styles.buttonText}>DETAILS</Text>
          </TouchableOpacity>
          
          {canReserve && (
            <TouchableOpacity 
              style={styles.reserveButton}
              onPress={() => handleReservation(item)}
            >
              <MaterialIcons name="event-available" size={16} color="white" />
              <Text style={styles.reserveText}>RESERVE</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderRoomDetails = () => {
    if (!selectedRoom) return null;
    
    // Check if the room is available for reservation
    const isAvailableForReservation = selectedRoom.showReservationOption || 
                                     selectedRoom.status === 'available';
    
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
              <Text style={styles.modalTitle}>
                Room {selectedRoom.roomNumber || selectedRoom.id}
                {selectedRoom.formattedDate ? ` - ${selectedRoom.formattedDate}` : ''}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialIcons name="close" size={24} color="white" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={true}>
              <View style={styles.roomInfoSection}>
                <Text style={styles.sectionTitle}>Room Features</Text>
                
                {/* Status badge */}
                <View style={styles.statusBadgeContainer}>
                  <View style={[styles.statusBadge, {backgroundColor: getStatusColor(selectedRoom.status)}]}>
                    <Text style={styles.statusBadgeText}>
                      {getStatusText(selectedRoom.status)}
                    </Text>
                  </View>
                </View>
                
                {/* Show future date info if available */}
                {selectedRoom.futureDateInfo && (
                  <View style={styles.futureStatusNote}>
                    <MaterialIcons name="event-available" size={16} color="#4CAF50" />
                    <Text style={styles.futureStatusText}>
                      {selectedRoom.futureDateInfo.originalStatus === 'occupied' 
                        ? `This room will be vacated on ${selectedRoom.futureDateInfo.availableFrom}.`
                        : `Maintenance for this room will be completed on ${formatMaintenanceDate(selectedRoom.futureDateInfo.availableFrom)}.`
                      }
                    </Text>
                  </View>
                )}
                
                {/* Room details */}
                <View style={styles.roomDetailsGrid}>
                  <View style={styles.roomDetailRow}>
                    <Text style={styles.roomDetailLabel}>Capacity:</Text>
                    <Text style={styles.roomDetailValue}>{selectedRoom.capacity}</Text>
                  </View>
                  
                  <View style={styles.roomDetailRow}>
                    <Text style={styles.roomDetailLabel}>Room Type:</Text>
                    <Text style={styles.roomDetailValue}>{selectedRoom.roomType}</Text>
                  </View>
                  
                  <View style={styles.roomDetailRow}>
                    <Text style={styles.roomDetailLabel}>Nightly Rate:</Text>
                    <Text style={styles.roomDetailValue}>{selectedRoom.price}</Text>
                  </View>
                </View>
              </View>
              
              {/* Reservation section for available rooms */}
              {isAvailableForReservation && (
                <View style={styles.reservationSection}>
                  <TouchableOpacity 
                    style={styles.reserveButtonModal}
                    onPress={() => {
                      setModalVisible(false);
                      const selectedDateObj = selectedRoom.selectedDate 
                        ? new Date(selectedRoom.selectedDate) 
                        : new Date();
                      handleReservation(selectedRoom, selectedDateObj);
                    }}
                  >
                    <MaterialIcons name="event-available" size={18} color="white" />
                    <Text style={styles.reserveButtonText}>CREATE RESERVATION</Text>
                  </TouchableOpacity>
                </View>
              )}
              
              {selectedRoom.status === 'occupied' && (
                <View style={styles.guestSection}>
                  <Text style={styles.sectionTitle}>Guest Information</Text>
                  <Text style={styles.roomDetailText}>Name: {selectedRoom.guest || "Guest"}</Text>
                  <Text style={styles.roomDetailText}>Check-in Date: {selectedRoom.checkIn}</Text>
                  <Text style={styles.roomDetailText}>Check-out Date: {selectedRoom.checkOut}</Text>
                  
                  <TouchableOpacity 
                    style={styles.cancelButton}
                    onPress={() => handleCancelReservation(selectedRoom)}
                  >
                    <MaterialIcons name="cancel" size={16} color="#E53935" />
                    <Text style={styles.cancelText}>CANCEL RESERVATION</Text>
                  </TouchableOpacity>
                </View>
              )}
              
              {selectedRoom.status === 'maintenance' && (
                <View style={styles.maintenanceSection}>
                  <Text style={styles.sectionTitle}>Maintenance Information</Text>
                  <Text style={styles.roomDetailText}>Maintenance Reason: {selectedRoom.maintenance || "Under maintenance"}</Text>
                  <Text style={styles.roomDetailText}>Estimated Completion: {formatMaintenanceDate(selectedRoom.expectedCompletion) || "Not specified"}</Text>
                </View>
              )}
              
              <View style={styles.amenitiesSection}>
                <Text style={styles.sectionTitle}>Room Features</Text>
                <View style={styles.amenitiesList}>
                  {selectedRoom.features && selectedRoom.features.map((item, index) => {
                    const isWifi = item.toLowerCase().includes('wifi') || item.toLowerCase().includes('wi-fi');
                    
                    return (
                      <View key={index} style={styles.amenityBadge}>
                        <MaterialIcons 
                          name={getFeatureIcon(item)} 
                          size={isWifi ? 18 : 16} 
                          color={getFeatureColor(item)} 
                        />
                        <Text style={[styles.amenityText, { color: getFeatureColor(item) }]}>{translateFeature(item)}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
              
              {selectedRoom.description && (
                <View style={styles.descriptionSection}>
                  <Text style={styles.sectionTitle}>Description</Text>
                  <Text style={styles.descriptionText}>{selectedRoom.description}</Text>
                </View>
              )}
              
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.closeButtonText}>CLOSE</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  // Function to handle reservation cancellation
  const handleCancelReservation = async (room) => {
    try {
      setIsLoading(true);

      // Check all possible reservationId fields
      const reservationId =
        room.selectedDateReservationId ||
        room.reservationId ||
        room.currentReservationId;

      if (reservationId) {
        console.log("Cancelling reservation ID:", reservationId);

        // Call API
        const response = await roomService.cancelReservation(reservationId);
        console.log("Cancellation response:", response);

        // If in calendar view, refresh calendar data immediately after successful cancellation
        if (activeView === 'calendar') {
          console.log('Refreshing calendar data immediately after reservation cancellation...');
          await fetchCalendarViewData(); // Refresh calendar data immediately
        } else {
          console.log('Refreshing card view data immediately after reservation cancellation...');
          await fetchRooms(); // Refresh card view data immediately
        }

        setModalVisible(false);

        // Show success message and refresh data again
        alert('Success - Reservation has been successfully cancelled.');
        
        // Refresh data again
        if (activeView === 'calendar') {
          console.log('Refreshing calendar data again after alert...');
          fetchCalendarViewData();
        } else {
          console.log('Refreshing card view data again after alert...');
          refreshRooms();
        }
      } else {
        console.error('Reservation ID not found');
        alert('Error - Reservation information not found.');
      }
    } catch (error) {
      console.error('Error cancelling reservation:', error);
      if (error.response?.data?.message) {
        console.error('API Error:', error.response.data.message);
      } else if (error.message) {
        console.error('Error Message:', error.message);
      }
      
      alert('Cancellation Error - An error occurred while cancelling the reservation. Please try again.');
      
      // Still refresh data based on active view
      if (activeView === 'calendar') {
        fetchCalendarViewData();
      } else {
        refreshRooms();
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Function to get calendar view data from API
  const fetchCalendarViewData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Format dates for API (YYYY-MM-DD)
      const formatDateForApi = (date) => {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      
      // Prepare parameters
      const params = {
        StartDate: formatDateForApi(calendarViewRange.start),
        EndDate: formatDateForApi(calendarViewRange.end)
      };
      
      console.log("DEBUG - Requesting calendar data with params:", params);
      
      // Call API
      const response = await roomService.getCalendarViewData(params);
      console.log("DEBUG - Calendar API response type:", typeof response);
      console.log("DEBUG - Calendar API response is array:", Array.isArray(response));
      console.log("DEBUG - Calendar API response length:", response ? (Array.isArray(response) ? response.length : 'not array') : 'null response');
      
      // Get the actual data array based on API response format
      let calendarData;
      if (Array.isArray(response)) {
        calendarData = response;
      } else if (response && Array.isArray(response.data)) {
        calendarData = response.data;
      } else {
        console.error("Unexpected API response format:", response);
        setError("Unexpected data format received from API. Please try again.");
        return;
      }
      
      console.log(`DEBUG - Calendar data processed: ${calendarData.length} rooms`);
      if (calendarData.length > 0) {
        console.log('DEBUG - First room sample:', JSON.stringify({
          roomId: calendarData[0].roomId, 
          id: calendarData[0].id,
          roomNumber: calendarData[0].roomNumber,
          dailyStatuses: calendarData[0].dailyStatuses?.length || 'no daily statuses'
        }, null, 2));
      }
      
      // Process and update the local state with returned data
      const processedRooms = calendarData.map(roomData => {
        // Check if the room data already has dailyStatuses for calendar view
        if (roomData.dailyStatuses && Array.isArray(roomData.dailyStatuses)) {
          // Data is already in calendar format, just format it for our UI
          return {
            ...roomService.formatRoomData(roomData),
            dailyStatuses: roomData.dailyStatuses.map(day => ({
              date: day.date,
              status: day.status.toLowerCase() || 'available',
              reservationId: day.reservationId,
              maintenanceId: day.maintenanceId,
              guestName: day.guestName
            }))
          };
        } else {
          // Standard room data - transform to match our UI format and calculate daily statuses
          const formattedRoom = roomService.formatRoomData(roomData);
          
          // Generate daily statuses for each day in the range
          const dailyStatuses = [];
          const start = new Date(calendarViewRange.start);
          const end = new Date(calendarViewRange.end);
          
          // Loop through each day and determine status
          for (let day = new Date(start); day <= end; day.setDate(day.getDate() + 1)) {
            const status = getRoomStatusForDate(formattedRoom, new Date(day));
            dailyStatuses.push({
              date: formatDateForApi(new Date(day)),
              status: status
            });
          }
          
          return {
            ...formattedRoom,
            dailyStatuses
          };
        }
      });
      
      console.log("DEBUG - Processed rooms for calendar view:", processedRooms.map(r => ({roomNumber: r.roomNumber, id: r.id, roomId: r.roomId})));
      setRooms(processedRooms);
    } catch (error) {
      console.error('Error fetching calendar data:', error);
      setError('An error occurred while loading calendar data: ' + (error.message || 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };
  
  // Update calendar view when range changes
  useEffect(() => {
    if (activeView === 'calendar') {
      fetchCalendarViewData();
    }
  }, [calendarViewRange, activeView]);

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

  // Helper function to format date as "DD/MM EEE" (e.g., "24/03 Mon")
  const formatDateHeader = (date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayOfWeek = dayNames[date.getDay()];
    
    return `${day}/${month} ${dayOfWeek}`;
  };
  
  // Function to get room status for a specific date
  const getRoomStatusForDate = (room, date) => {
    // Check if room is available for this date using our helper
    if (isRoomAvailableForDate(room, date)) {
      return 'available';
    }
    
    // Format date for consistent comparison
    const formatDate = (d) => {
      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };
    
    const currentDate = new Date(date);
    currentDate.setHours(0, 0, 0, 0);
    
    // Check if room is occupied on this date
    if (room.status === 'occupied' || room.currentReservationId) {
      const checkIn = parseDate(room.checkIn);
      const checkOut = parseDate(room.checkOut);
      
      if (checkIn && checkOut) {
        if (currentDate >= checkIn && currentDate < checkOut) {
          return 'occupied';
        }
      }
    }
    
    // Check if room is under maintenance on this date 
    if (room.status === 'maintenance' || room.maintenanceIssueDescription) {
      const completionDate = parseDate(room.expectedCompletion);
      
      if (completionDate) {
        if (currentDate < completionDate) {
          return 'maintenance';
        }
      } else {
        // No completion date specified, assume indefinite maintenance
        return 'maintenance';
      }
    }
    
    // Default to available if not occupied or under maintenance for this date
    return 'available';
  };

  // Function to handle changing the calendar view date range
  const changeCalendarViewRange = (increment) => {
    const newStart = new Date(calendarViewRange.start);
    const newEnd = new Date(calendarViewRange.end);
    
    newStart.setDate(newStart.getDate() + (increment * 7)); // 7 days change instead of 14
    newEnd.setDate(newEnd.getDate() + (increment * 7)); // 7 days change instead of 14
    
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

  // Modify the renderCalendarView function to display daily statuses
  const renderCalendarView = () => {
    const dates = generateCalendarDates();
    
    // Debug room data
    console.log("Calendar rooms data:", filteredRooms.map(r => ({
      roomId: r.roomId,
      id: r.id,
      roomNumber: r.roomNumber
    })));
    
    // Önce roomId, sonra id, sonra roomNumber'a göre sırala
    const filteredRoomsByNumber = [...filteredRooms].sort((a, b) => {
      // Önce roomId'ye göre sırala
      if (a.roomId && b.roomId) return parseInt(a.roomId) - parseInt(b.roomId);
      // roomId yoksa id'ye göre sırala
      if (a.id && b.id) return parseInt(a.id) - parseInt(b.id);
      // İkisi de yoksa roomNumber'a göre sırala
      return parseInt(a.roomNumber || 0) - parseInt(b.roomNumber || 0);
    });
    
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6B3DC9" />
          <Text style={styles.loadingText}>Takvim verisi yükleniyor...</Text>
        </View>
      );
    }
    
    if (error) {
      return (
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={32} color="#E53935" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => fetchCalendarViewData()}
          >
            <Text style={styles.retryButtonText}>TEKRAR DENE</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    return (
      <View style={styles.calendarViewContainer}>
        <View style={styles.calendarViewHeader}>
          <TouchableOpacity onPress={() => changeCalendarViewRange(-1)}>
            <MaterialIcons name="chevron-left" size={24} color="#6B3DC9" />
          </TouchableOpacity>
          
          <Text style={styles.dateRangeText}>{formatDateRangeDisplay()}</Text>
          
          <TouchableOpacity onPress={() => changeCalendarViewRange(1)}>
            <MaterialIcons name="chevron-right" size={24} color="#6B3DC9" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.todayButton}
            onPress={goToCurrentDate}
          >
            <Text style={styles.todayButtonText}>TODAY</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={true}>
          <View>
            {/* Column Headers (Dates) */}
            <View style={styles.calendarHeaderRow}>
              <View style={styles.roomNumberCell}>
                <Text style={styles.roomNumberHeaderText}>Room / Date</Text>
              </View>
              {dates.map((date, index) => (
                <View key={index} style={styles.dateHeaderCell}>
                  <Text style={styles.dateHeaderText}>{formatDateHeader(date)}</Text>
                </View>
              ))}
            </View>
            
            {/* Room Rows - Fully scrollable */}
            <FlatList
              data={filteredRoomsByNumber}
              keyExtractor={(item, index) => `room-${item.roomId || item.id || item.roomNumber}-${index}`}
              renderItem={({item: room, index: roomIndex}) => (
                <View style={styles.roomRow}>
                  <View style={styles.roomNumberCell}>
                    <Text style={styles.roomNumberText}>{room.roomNumber}</Text>
                    <Text style={styles.roomTypeIndicator}>{room.roomType}</Text>
                  </View>
                  
                  {dates.map((date, dateIndex) => {
                    // Format the date to match API format YYYY-MM-DD for comparison
                    const formatDateStr = (date) => {
                      return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                    };
                    
                    // Try to get status from dailyStatuses if available
                    let status = 'available';
                    if (room.dailyStatuses && Array.isArray(room.dailyStatuses)) {
                      const dailyStatus = room.dailyStatuses.find(d => 
                        d.date === formatDateStr(date)
                      );
                      if (dailyStatus) {
                        status = dailyStatus.status;
                      }
                    } else {
                      // Fall back to calculating status
                      status = getRoomStatusForDate(room, date);
                    }
                    
                    return (
                      <TouchableOpacity 
                        key={`cell-${room.roomNumber || roomIndex}-${dateIndex}`} 
                        style={[
                          styles.roomStatusCell,
                          { backgroundColor: getStatusColor(status) }
                        ]}
                        onPress={() => {
                          // When clicking a cell, check status and show appropriate popup
                          if (status === 'available') {
                            // For available rooms, show the reservation popup dialog
                            const selectedDateStr = formatDateStr(date);
                            const formattedDate = formatDateForDisplay(date);
                            
                            // Create a copy of the room with reservation info for the popup
                            const roomForReservation = {
                              ...room,
                              id: room.roomId || room.id || parseInt(room.roomNumber) || 0,
                              status: 'available',
                              selectedDate: selectedDateStr,
                              formattedDate: formattedDate
                            };
                            
                            // Show room details with reservation option
                            showRoomDetailsForReservation(roomForReservation, date);
                          } else if (status === 'occupied') {
                            let reservationId = null;
                            let guestName = null;
                            let checkIn = null;
                            let checkOut = null;
                            if (room.dailyStatuses && Array.isArray(room.dailyStatuses)) {
                              const dailyStatus = room.dailyStatuses.find(d => d.date === formatDateStr(date));
                              if (dailyStatus) {
                                reservationId = dailyStatus.reservationId;
                                guestName = dailyStatus.guestName;
                                checkIn = dailyStatus.checkIn;
                                checkOut = dailyStatus.checkOut;
                              }
                            }
                            const roomWithDateInfo = {
                              ...room,
                              status: 'occupied',
                              selectedDate: formatDateStr(date),
                              formattedDate: formatDateForDisplay(date),
                              selectedDateStatus: status,
                              selectedDateReservationId: reservationId,
                              selectedDateGuestName: guestName,
                              checkIn,
                              checkOut
                            };
                            showRoomDetails(roomWithDateInfo);
                          } else {
                            // For other statuses, just show the regular room details
                            const roomWithDateInfo = {
                              ...room,
                              selectedDate: formatDateStr(date),
                              formattedDate: formatDateForDisplay(date),
                              selectedDateStatus: status
                            };
                            showRoomDetails(roomWithDateInfo);
                          }
                        }}
                      />
                    );
                  })}
                </View>
              )}
              showsVerticalScrollIndicator={true}
              initialNumToRender={10}
              windowSize={5}
              style={styles.roomsListContainer}
            />
          </View>
        </ScrollView>

        <View style={styles.calendarLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: getStatusColor('available') }]} />
            <Text style={styles.legendText}>Available</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: getStatusColor('occupied') }]} />
            <Text style={styles.legendText}>Occupied</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: getStatusColor('maintenance') }]} />
            <Text style={styles.legendText}>Under Maintenance</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.clearAllTag}
          onPress={clearAllFilters}
        >
          <Text style={styles.clearAllText}>Clear All</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Advanced filters modal
  const renderAdvancedFiltersModal = () => {
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={showFilters}
        onRequestClose={() => setShowFilters(false)}
      >
        <View style={styles.modalFilterContainer}>
          <View style={styles.modalFilterContent}>
            <View style={styles.modalFilterHeader}>
              <Text style={styles.modalFilterTitle}>Advanced Filters</Text>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <MaterialIcons name="close" size={24} color="white" />
              </TouchableOpacity>
            </View>
            
            <ScrollView 
              style={styles.filterScrollView} 
              showsVerticalScrollIndicator={true}
            >
              <View style={styles.dateFilterSection}>
                <Text style={styles.dateLabel}>Date Range</Text>
                
                <View style={styles.dateFilterRow}>
                  <View style={{width: '48%'}}>
                    <Text style={styles.smallLabel}>Start Date</Text>
                    <TouchableOpacity 
                      style={styles.dateInput}
                      onPress={() => openCalendar('start')}
                    >
                      <Text>{startDate || 'DD.MM.YYYY'}</Text>
                      <MaterialIcons name="calendar-today" size={16} color="#333" />
                    </TouchableOpacity>
                  </View>
                  
                  <View style={{width: '48%'}}>
                    <Text style={styles.smallLabel}>End Date</Text>
                    <TouchableOpacity 
                      style={styles.dateInput}
                      onPress={() => openCalendar('end')}
                    >
                      <Text>{endDate || 'DD.MM.YYYY'}</Text>
                      <MaterialIcons name="calendar-today" size={16} color="#333" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
              
              <View style={styles.featureFilterSection}>
                <Text style={styles.featureLabel}>Room Features</Text>
                
                {availableFeatures.map((feature) => {
                  // Check if this is a Wi-Fi feature
                  const isWifi = feature.toLowerCase().includes('wifi') || feature.toLowerCase().includes('wi-fi');
                  
                  return (
                    <TouchableOpacity 
                      key={feature}
                      style={styles.featureCheckItem}
                      onPress={() => handleFeatureToggle(feature)}
                    >
                      <View style={[
                        styles.checkbox,
                        isFeatureSelected(feature) && styles.checkedBox
                      ]}>
                        {isFeatureSelected(feature) && (
                          <MaterialIcons name="check" size={14} color="white" />
                        )}
                      </View>
                      <MaterialIcons 
                        name={getFeatureIcon(feature)} 
                        size={isWifi ? 22 : 20} 
                        color={getFeatureColor(feature)} 
                        style={{marginRight: 8, marginLeft: 8}}
                      />
                      <Text style={[
                        styles.featureItemText, 
                        isWifi ? {color: getFeatureColor(feature), fontWeight: '600'} : null
                      ]}>{translateFeature(feature)}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
            
            <View style={styles.modalFilterActions}>
              <TouchableOpacity 
                style={styles.clearFiltersButton}
                onPress={() => {
                  clearAllFilters();
                  setShowFilters(false);
                }}
              >
                <Text style={styles.clearFiltersText}>CLEAR FILTERS</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.applyFiltersButton}
                onPress={() => setShowFilters(false)}
              >
                <Text style={styles.applyFiltersText}>APPLY</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // Function to initialize to today's date for calendar view
  const goToCurrentDate = () => {
    const today = new Date();
    const oneWeekLater = new Date();
    oneWeekLater.setDate(today.getDate() + 6); // 7 days view
    
    setCalendarViewRange({
      start: today,
      end: oneWeekLater
    });
    
    // Fetch calendar data for the new date range
    fetchCalendarViewData();
    
    // Inform the user
    alert('Date Updated - Calendar has been set to today\'s date.');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Room Status</Text>
      </View>
      
      {/* Main Content */}
      <View style={styles.content}>
        <Text style={styles.title}>Room Status</Text>
        
        {/* View Toggle */}
        <View style={styles.viewToggle}>
          <TouchableOpacity 
            style={[
              styles.toggleButton, 
              activeView === 'card' && styles.activeToggle
            ]}
            onPress={() => {
              // If already in card view, do nothing
              if (activeView === 'card') return;
              
              // Change view
              setActiveView('card');
              
              // Set today's date when switching to card view and refresh data
              const todayDate = getTodayFormatted();
              setStartDate(todayDate);
              setEndDate('');
              setActiveFilters([{ type: 'startDate', value: todayDate }]);
              setStatusFilter('All');
              setSelectedFeatures([]);
              
              // Fetch today's data
              console.log('Switching to card view, fetching today\'s rooms...');
              fetchRooms();
            }}
          >
            <MaterialIcons 
              name="grid-view" 
              size={20} 
              color={activeView === 'card' ? '#6B3DC9' : '#666'} 
            />
            <Text 
              style={[
                styles.toggleText, 
                activeView === 'card' && styles.activeToggleText
              ]}
            >
              CARD VIEW
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.toggleButton, 
              activeView === 'calendar' && styles.activeToggle
            ]}
            onPress={() => {
              // If already in calendar view, do nothing
              if (activeView === 'calendar') return;
              
              // Change view
              setActiveView('calendar');
              
              // Automatically set to today's date when switching to calendar view
              const today = new Date();
              const oneWeekLater = new Date();
              oneWeekLater.setDate(today.getDate() + 6);
              
              setCalendarViewRange({
                start: today,
                end: oneWeekLater
              });
              
              // Fetch calendar data
              fetchCalendarViewData();
            }}
          >
            <MaterialIcons 
              name="calendar-today" 
              size={20} 
              color={activeView === 'calendar' ? '#6B3DC9' : '#666'} 
            />
            <Text 
              style={[
                styles.toggleText, 
                activeView === 'calendar' && styles.activeToggleText
              ]}
            >
              CALENDAR VIEW
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={() => {
              // Call different refresh functions based on view type
              if (activeView === 'calendar') {
                console.log('Refreshing calendar view...');
                fetchCalendarViewData(); // Call CalendarView API for calendar view
              } else {
                console.log('Refreshing card view...');
                refreshRooms(); // Call normal room listing API for card view
              }
            }}
            disabled={isLoading}
          >
            <MaterialIcons name="refresh" size={20} color="#6B3DC9" />
            <Text style={styles.refreshText}>REFRESH</Text>
          </TouchableOpacity>
        </View>
        
        {/* Search and Filters */}
        {activeView === 'card' && (
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search Room Number"
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
                <MaterialIcons name="filter-list" size={20} color="#6B3DC9" />
                <Text style={styles.advancedFilterText}>ADVANCED FILTERS</Text>
              </TouchableOpacity>
            </View>
            
            {/* Status Dropdown */}
            {showStatusDropdown && (
              <View style={styles.dropdownMenu}>
                {['All', 'Available', 'Occupied', 'Under Maintenance'].map((status) => (
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
                      <MaterialIcons name="check" size={16} color="#6B3DC9" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}
        
        {/* Loading Indicator */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6B3DC9" />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        )}
        
        {/* Error Message */}
        {error && !isLoading && (
          <View style={styles.errorContainer}>
            <MaterialIcons name="error-outline" size={32} color="#E53935" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={refreshRooms}
            >
              <Text style={styles.retryButtonText}>TRY AGAIN</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {/* Advanced Filters */}
        {activeView === 'card' && showFilters && (
          <View style={styles.advancedFiltersContainer}>
            <Text style={styles.filterSectionTitle}>Advanced Filters</Text>
            
            <View style={styles.dateFilterRow}>
              <View style={styles.dateFilter}>
                <Text style={styles.dateLabel}>Date Range</Text>
                <Text style={styles.smallLabel}>Start Date</Text>
                <TouchableOpacity 
                  style={styles.dateInput}
                  onPress={() => openCalendar('start')}
                >
                  <Text>{startDate || 'DD.MM.YYYY'}</Text>
                  <MaterialIcons name="calendar-today" size={16} color="#333" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.dateFilter}>
                <Text style={styles.smallLabel}>End Date</Text>
                <TouchableOpacity 
                  style={styles.dateInput}
                  onPress={() => openCalendar('end')}
                >
                  <Text>{endDate || 'DD.MM.YYYY'}</Text>
                  <MaterialIcons name="calendar-today" size={16} color="#333" />
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.featureFilter}>
              <Text style={styles.featureLabel}>Room Features</Text>
              <TouchableOpacity 
                style={styles.featureDropdown}
                onPress={() => setShowFeaturesDropdown(!showFeaturesDropdown)}
              >
                <Text>
                  {selectedFeatures.length > 0 
                    ? `${selectedFeatures.length} features selected` 
                    : 'Features'}
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
                          isFeatureSelected(feature) && styles.checkedBox
                        ]}>
                          {isFeatureSelected(feature) && (
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
                <Text style={styles.clearFiltersText}>CLEAR FILTERS</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.applyFiltersButton}
                onPress={() => setShowFilters(false)}
              >
                <Text style={styles.applyFiltersText}>APPLY</Text>
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
                displayText = `Start: ${filter.value}`;
              } else if (filter.type === 'endDate') {
                displayText = `End: ${filter.value}`;
              }
              
              return (
                <View key={index} style={styles.filterTag}>
                  <Text style={styles.filterTagText}>{displayText}</Text>
                  <TouchableOpacity onPress={() => removeFilter(filter)}>
                    <MaterialIcons name="close" size={16} color="#6B3DC9" />
                  </TouchableOpacity>
                </View>
              );
            })}
            
            {activeFilters.length > 1 && (
              <TouchableOpacity 
                style={styles.clearAllTag}
                onPress={clearAllFilters}
              >
                <Text style={styles.clearAllText}>Clear All</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        
        {/* Empty state when no rooms match the filters */}
        {activeView === 'card' && !isLoading && !error && filteredRooms.length === 0 && (
          <View style={styles.emptyState}>
            <MaterialIcons name="search-off" size={48} color="#999" />
            <Text style={styles.emptyStateTitle}>No Results Found</Text>
            <Text style={styles.emptyStateText}>
              No rooms match your search criteria. Please try different filters.
            </Text>
            <TouchableOpacity 
              style={styles.resetButton}
              onPress={clearAllFilters}
            >
              <Text style={styles.resetButtonText}>RESET FILTERS</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {/* Room List */}
        {activeView === 'card' && !isLoading && !error && filteredRooms.length > 0 && (
          <FlatList
            data={filteredRooms}
            renderItem={renderRoomCard}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.roomList}
            numColumns={1}
          />
        )}
        
        {/* Calendar View */}
        {activeView === 'calendar' && renderCalendarView()}
        
        {/* Room Details Modal */}
        {renderRoomDetails()}
        
        {/* Calendar Modal */}
        {renderCalendar()}
        
        {/* Reservation Modal */}
        {renderReservationModal()}
        
        {/* Reservation Date Modal */}
        {renderReservationDateModal()}
        
        {/* Gelişmiş filtreler modalı */}
        {renderAdvancedFiltersModal()}
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
    paddingHorizontal: 10,
    marginRight: 5,
    flexShrink: 1,
  },
  activeToggle: {
    borderBottomWidth: 2,
    borderBottomColor: '#6B3DC9',
  },
  toggleText: {
    marginLeft: 3,
    color: '#666',
    fontSize: 11,
    fontWeight: '500',
    flexShrink: 1,
  },
  activeToggleText: {
    color: '#6B3DC9',
    fontWeight: 'bold',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginLeft: 'auto',
    flexShrink: 1,
  },
  refreshText: {
    marginLeft: 3,
    color: '#6B3DC9',
    fontSize: 11,
    fontWeight: '500',
    flexShrink: 1,
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
    color: '#6B3DC9',
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
    paddingLeft: 30,
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
    color: '#6B3DC9',
    marginRight: 5,
    fontSize: 12,
  },
  roomList: {
    paddingBottom: 20,
  },
  roomCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  roomHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    paddingVertical: 8,
    backgroundColor: '#4CAF50',
  },
  roomNumber: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 22,
  },
  capacityText: {
    color: 'white',
    fontWeight: '500',
  },
  roomContent: {
    padding: 15,
    paddingTop: 12,
  },
  amenitiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
    marginTop: 5,
  },
  amenityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
    marginBottom: 8,
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  amenityItemText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#333',
  },
  priceContainer: {
    marginTop: 8,
    marginBottom: 5,
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceLabel: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 4,
  },
  roomTypeText: {
    fontSize: 15,
    color: '#333',
    marginTop: 3,
    marginBottom: 5,
    fontWeight: '500',
  },
  descriptionText: {
    fontSize: 14,
    color: '#555',
    marginBottom: 5,
    fontStyle: 'italic',
  },
  guestInfo: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 8,
    marginLeft: 5,
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
  roomActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    flex: 1,
    backgroundColor: '#EDE7F6',
  },
  buttonText: {
    marginLeft: 5,
    color: '#673AB7',
    fontSize: 13,
    fontWeight: 'bold',
  },
  reserveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#673AB7',
    flex: 1,
  },
  reserveText: {
    marginLeft: 5,
    color: 'white',
    fontSize: 13,
    fontWeight: 'bold',
  },
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
    backgroundColor: '#6B3DC9',
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
    borderWidth: 1,
    borderColor: '#e0daea',
  },
  amenityText: {
    color: '#6B3DC9',
    fontSize: 12,
    marginLeft: 5,
  },
  closeButton: {
    backgroundColor: '#673AB7',
    paddingVertical: 12,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10
  },
  closeButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    textTransform: 'uppercase'
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
    color: '#6B3DC9',
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
    padding: 12,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  featureItemText: {
    color: '#333',
    fontSize: 15,
    fontWeight: '500',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: '#6B3DC9',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkedBox: {
    backgroundColor: '#6B3DC9',
    borderColor: '#6B3DC9',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
    backgroundColor: '#6B3DC9',
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
    backgroundColor: '#6B3DC9',
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
    paddingHorizontal: 8,
    borderRadius: 15,
    marginLeft: 5,
    alignSelf: 'flex-start',
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
    color: '#6B3DC9',
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
    backgroundColor: '#6B3DC9',
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
    color: '#6B3DC9',
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
    flex: 1, // Add flex:1 to allow container to expand
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
    backgroundColor: '#6B3DC9',
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
    zIndex: 1, // Ensure the header stays on top
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
  confirmReservationButton: {
    backgroundColor: '#6B3DC9',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    alignItems: 'center',
    flex: 2,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  confirmText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 5,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#6B3DC9',
    fontSize: 14,
  },
  errorContainer: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  errorText: {
    fontSize: 14,
    color: '#E53935',
    textAlign: 'center',
    marginVertical: 10,
  },
  retryButton: {
    backgroundColor: '#6B3DC9',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginTop: 10,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  occupiedInfo: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#FFF9C4',
    borderRadius: 5,
  },
  guestInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  dateInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  maintenanceInfo: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#FFEBEE',
    borderRadius: 5,
  },
  maintenanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  maintenanceText: {
    marginLeft: 5,
    color: '#FF9800',
    fontSize: 13,
    fontWeight: '500',
  },
  maintenanceSection: {
    marginBottom: 20,
  },
  futureAvailableInfo: {
    fontSize: 12,
    color: '#4CAF50',
    fontStyle: 'italic',
    marginLeft: 5,
  },
  dateNoteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    padding: 8,
    backgroundColor: '#E3F2FD',
    borderRadius: 5,
  },
  dateNoteText: {
    fontSize: 13,
    color: '#1565C0',
    marginLeft: 5,
  },
  futureStatusNote: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#E8F5E9',
    borderRadius: 5,
    marginVertical: 8,
  },
  futureStatusText: {
    fontSize: 13,
    color: '#2E7D32',
    fontStyle: 'italic',
    marginLeft: 5,
    flex: 1,
  },
  formGroup: {
    marginBottom: 15,
  },
  formGroupIcon: {
    position: 'absolute',
    left: 0,
    top: 24,
    zIndex: 1,
  },
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    paddingHorizontal: 15,
    paddingVertical: 8,
    paddingLeft: 30,
    fontSize: 14,
  },
  reservationFormContainer: {
    marginBottom: 20,
  },
  reservationFormGroup: {
    marginBottom: 15,
  },
  reservationFormIcon: {
    position: 'absolute',
    left: 0,
    top: 24,
    zIndex: 1,
  },
  reservationFormLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 5,
    color: '#333',
  },
  reservationFormInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    paddingHorizontal: 15,
    paddingVertical: 8,
    paddingLeft: 30,
    fontSize: 14,
  },
  reservationFormRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  reservationDateGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  reservationDateInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    paddingHorizontal: 15,
    paddingVertical: 10,
    paddingLeft: 30,
    fontSize: 14,
  },
  reservationActionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  reservationCancelButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  reservationCancelText: {
    color: '#E53935',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 5,
  },
  reservationConfirmButton: {
    backgroundColor: '#6B3DC9',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    alignItems: 'center',
    flex: 2,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  reservationConfirmText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 5,
  },
  reservationModalContent: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  reservationModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  reservationModalTitle: {
    color: '#333',
    fontSize: 18,
    fontWeight: '600',
  },
  reservationModalBody: {
    padding: 15,
  },
  reservationInputGroup: {
    marginBottom: 20,
  },
  reservationInputIcon: {
    position: 'absolute',
    left: 15,
    top: 33,
    zIndex: 1,
  },
  reservationInputLabel: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  reservationTextInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    height: 45,
    paddingHorizontal: 15,
    fontSize: 14,
  },
  reservationDateInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    height: 45,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 14,
  },
  reservationButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 15,
  },
  reservationCancelBtn: {
    backgroundColor: '#f5f5f5',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    width: '30%',
  },
  reservationCancelBtnText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '500',
  },
  reservationCreateBtn: {
    backgroundColor: '#6B3DC9',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    width: '65%',
  },
  reservationCreateBtnText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  cancelReservationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE8E7',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  cancelReservationText: {
    color: '#E53935',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 5,
  },
  modalFilterContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalFilterContent: {
    width: '90%',
    maxHeight: '90%',
    backgroundColor: 'white',
    borderRadius: 10,
    overflow: 'hidden',
  },
  modalFilterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#6B3DC9',
    padding: 15,
  },
  modalFilterTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  filterScrollView: {
    padding: 15,
    maxHeight: '70%',
  },
  dateFilterSection: {
    marginBottom: 20,
  },
  featureFilterSection: {
    marginBottom: 20,
  },
  modalFilterActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: 'white',
  },
  featureCheckItem: {
    padding: 12,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  dateFilterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  featureIconsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
    marginTop: 5,
  },
  featureIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    marginBottom: 8,
    backgroundColor: '#f9f9f9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#eee',
    minWidth: 80,
    justifyContent: 'center',
  },
  featureIconText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#444',
    fontWeight: '500',
  },
  capacityInfo: {
    fontSize: 13,
    color: '#888',
    fontStyle: 'italic',
  },
  guestNumberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    height: 45,
  },
  guestNumberButton: {
    width: 45,
    height: 45,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestNumberInput: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '500',
  },
  roomTypeIndicator: {
    fontSize: 12,
    color: '#888',
    fontWeight: '500',
    marginTop: 4,
  },
  reserveButtonModal: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 6,
    marginTop: 10,
    marginBottom: 15,
    height: 45,
  },
  reserveButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 10,
    textTransform: 'uppercase',
  },
  statusBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 15,
    marginBottom: 5,
  },
  statusBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  roomDetailsGrid: {
    flexDirection: 'column',
    marginBottom: 15,
  },
  roomDetailRow: {
    flexDirection: 'row',
    marginBottom: 8,
    width: '100%',
  },
  roomDetailLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    width: 120,
  },
  roomDetailValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  amenitiesSection: {
    marginBottom: 15,
    borderTopWidth: 1,
    borderTopColor: '#eeeeee',
    paddingTop: 15,
  },
  amenitiesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  amenityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    marginRight: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eeeeee',
  },
  amenityText: {
    color: '#555',
    fontSize: 12,
    marginLeft: 5,
  },
  descriptionSection: {
    marginBottom: 20,
  },
  descriptionText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  reservationSection: {
    marginTop: 5,
    marginBottom: 15,
    borderTopWidth: 1,
    borderTopColor: '#eeeeee',
    paddingTop: 15,
    alignItems: 'center',
  },
  roomsListContainer: {
    flexGrow: 1,
    height: '100%',
  },
}); 