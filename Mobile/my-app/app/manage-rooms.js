import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, FlatList, TextInput, ScrollView, Modal, TouchableWithoutFeedback, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { hasPageAccess } from '../services/roleService';
import AccessDenied from '../components/AccessDenied';
import roomService from '../services/roomService';
import axios from 'axios';

export default function ManageRoomsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [hasAccess, setHasAccess] = useState(true);
  const [rooms, setRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedFloor, setSelectedFloor] = useState('all');
  const [activeTab, setActiveTab] = useState('all');
  
  // Dropdown state
  const [statusDropdownVisible, setStatusDropdownVisible] = useState(false);
  const [floorDropdownVisible, setFloorDropdownVisible] = useState(false);
  
  // References for measuring button positions
  const statusButtonRef = useRef(null);
  const floorButtonRef = useRef(null);
  
  // Position state for dropdowns
  const [statusDropdownPosition, setStatusDropdownPosition] = useState({ top: 130, left: 120 });
  const [floorDropdownPosition, setFloorDropdownPosition] = useState({ top: 130, left: 240 });
  
  // Düzenleme modu için state'ler
  const [editMode, setEditMode] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  
  // Room details modal state
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [roomForDetails, setRoomForDetails] = useState(null);
  const [maintenanceIssues, setMaintenanceIssues] = useState([]);
  
  // Maintenance issue modal state
  const [maintenanceModalVisible, setMaintenanceModalVisible] = useState(false);
  const [maintenanceIssue, setMaintenanceIssue] = useState({
    description: '',
    completionDate: null
  });
  
  // Calendar state
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Available statuses and floors
  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'Available', label: 'Available' },
    { value: 'Occupied', label: 'Occupied' },
    { value: 'Maintenance', label: 'Under Maintenance' }
  ];
  
  // Get unique floors from rooms
  const getFloorOptions = () => {
    // Static floor options 0-4 as requested
    return [
      { value: 'all', label: 'All Floors' },
      { value: '0', label: 'Floor 0' },
      { value: '1', label: 'Floor 1' },
      { value: '2', label: 'Floor 2' },
      { value: '3', label: 'Floor 3' },
      { value: '4', label: 'Floor 4' }
    ];
  };
  
  // Check if user has permission to access this page
  useEffect(() => {
    // Don't check access until user is loaded
    if (!user) return;
    
    console.log('Checking manage-rooms access for:', user);
    
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
      const canAccess = hasPageAccess(user, 'manage-rooms');
      console.log('Access result from permission check:', canAccess);
      setHasAccess(canAccess);
    } catch (error) {
      console.error('Error in access check:', error);
      // On error, default to grant access to avoid lockouts
      setHasAccess(true);
    }
  }, [user]);
  
  // Fetch rooms data
  useEffect(() => {
    if (hasAccess) {
      fetchRooms();
    }
  }, [hasAccess]);
  
  // Filter rooms when data or filters change
  useEffect(() => {
    filterRooms();
  }, [rooms, searchText, activeTab, selectedStatus, selectedFloor]);
  
  const fetchRooms = async () => {
    try {
      setLoading(true);
      console.log('Fetching all rooms data...');
      const response = await roomService.getAllRooms();
      
      // Update rooms data
      setRooms(response.data);
      
      // Update filtered rooms immediately based on current filters
      let filtered = [...response.data];
      
      // Apply current filters
      if (searchText) {
        filtered = filtered.filter(room => 
          room.roomNumber.toString().includes(searchText) || 
          room.description?.toLowerCase().includes(searchText.toLowerCase())
        );
      }
      
      if (activeTab !== 'all') {
        filtered = filtered.filter(room => room.roomType === activeTab);
      }
      
      if (selectedStatus !== 'all') {
        filtered = filtered.filter(room => room.computedStatus === selectedStatus);
      }
      
      if (selectedFloor !== 'all') {
        filtered = filtered.filter(room => room.floor.toString() === selectedFloor);
      }
      
      // Update filtered rooms with the newly filtered data
      setFilteredRooms(filtered);
      
      console.log('Room data refreshed successfully');
    } catch (error) {
      console.error('Error loading rooms:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const filterRooms = () => {
    if (!rooms.length) return;
    
    let filtered = [...rooms];
    
    // Search filter
    if (searchText) {
      filtered = filtered.filter(room => 
        room.roomNumber.toString().includes(searchText) || 
        room.description?.toLowerCase().includes(searchText.toLowerCase())
      );
    }
    
    // Room type filter
    if (activeTab !== 'all') {
      filtered = filtered.filter(room => room.roomType === activeTab);
    }
    
    // Status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(room => room.computedStatus === selectedStatus);
    }
    
    // Floor filter
    if (selectedFloor !== 'all') {
      filtered = filtered.filter(room => room.floor.toString() === selectedFloor);
    }
    
    setFilteredRooms(filtered);
  };
  
  // Tab navigation handler
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };
  
  const handleStatusChange = (status) => {
    setSelectedStatus(status);
    setStatusDropdownVisible(false);
  };

  const handleFloorChange = (floor) => {
    setSelectedFloor(floor);
    setFloorDropdownVisible(false);
  };
  
  // Function to measure button position and update dropdown position
  const measureStatusButton = () => {
    if (statusButtonRef.current) {
      statusButtonRef.current.measure((fx, fy, width, height, px, py) => {
        setStatusDropdownPosition({
          top: py + height + 5,
          left: px,
        });
      });
    }
  };
  
  const measureFloorButton = () => {
    if (floorButtonRef.current) {
      floorButtonRef.current.measure((fx, fy, width, height, px, py) => {
        setFloorDropdownPosition({
          top: py + height + 5,
          left: px,
        });
      });
    }
  };
  
  // Yeni oda modal state
  const [newRoomModalVisible, setNewRoomModalVisible] = useState(false);
  const [newRoom, setNewRoom] = useState({
    roomNumber: '',
    roomType: 'Standard',
    floor: '1',
    capacity: '2',
    pricePerNight: '',
    description: '',
    features: []
  });

  // Room features options
  const roomFeatures = ['Wi-Fi', 'TV', 'Minibar', 'Air Conditioning', 'Balcony', 'Jacuzzi', 'Coffee Machine'];
  
  // Room types
  const roomTypes = [
    { value: 'Standard', label: 'Standard' },
    { value: 'Deluxe', label: 'Deluxe' },
    { value: 'Suite', label: 'Suite' },
    { value: 'Royal', label: 'Royal Suite' }
  ];

  // Dropdown durumları
  const [roomTypeDropdownVisible, setRoomTypeDropdownVisible] = useState(false);
  const [capacityDropdownVisible, setCapacityDropdownVisible] = useState(false);
  const [featuresDropdownVisible, setFeaturesDropdownVisible] = useState(false);
  const [featuresInputText, setFeaturesInputText] = useState('');
  
  // Yeni oda ekleme fonksiyonu
  const handleAddRoom = async () => {
    try {
      // Veri doğrulama
      if (!newRoom.roomNumber || !newRoom.pricePerNight) {
        alert('Hata: Oda numarası ve gecelik ücret alanları zorunludur.');
        return;
      }
      
      setLoading(true);
      
      // API'ye gönderilecek veri yapısını oluştur
      const roomData = {
        roomNumber: parseInt(newRoom.roomNumber),
        roomType: newRoom.roomType,
        floor: parseInt(newRoom.floor),
        roomCapacity: newRoom.capacity,
        pricePerNight: parseFloat(newRoom.pricePerNight),
        description: newRoom.description || '',
        features: newRoom.features,
        isOnMaintenance: false
      };
      
      console.log('API\'ye gönderilecek oda verisi:', roomData);

      // roomService kullanarak API isteği gönder
      const response = await roomService.createRoom(roomData);
      
      console.log('Oda başarıyla eklendi:', response);
      
      // Başarılı eklemeden sonra modal'ı kapat ve odaları yeniden getir
      setNewRoomModalVisible(false);
      fetchRooms();
      
      // Kullanıcıya başarılı mesajı göster
      alert('Başarılı: Oda başarıyla eklendi.');
      
      // Formu sıfırla
      setNewRoom({
        roomNumber: '',
        roomType: 'Standard',
        floor: '1',
        capacity: '2',
        pricePerNight: '',
        description: '',
        features: []
      });
    } catch (error) {
      console.error('Oda eklenirken hata:', error);
      
      let errorMessage = 'Bilinmeyen bir hata oluştu';
      
      if (error.response) {
        console.log('Hata detayı:', error.response.status, error.response.data);
        console.log('Tam hata bilgisi:', JSON.stringify(error.response.data, null, 2));
        
        // HTTP durum koduna göre özel mesaj
        if (error.response.status === 401) {
          errorMessage = 'Yetkilendirme hatası. Lütfen tekrar giriş yapın.';
        } else if (error.response.status === 400) {
          errorMessage = `Geçersiz veri: ${error.response.data?.message || 'Form alanlarını kontrol edin'}`;
        } else if (error.response.status === 500) {
          errorMessage = 'Sunucu hatası. Lütfen daha sonra tekrar deneyin.';
        } else {
          errorMessage = `Hata: ${error.response.data?.message || error.message}`;
        }
      }
      
      // Kullanıcıya hata mesajı göster
      alert('Hata: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  // Feature seçim fonksiyonu
  const toggleFeature = (feature) => {
    if (newRoom.features.includes(feature)) {
      setNewRoom({
        ...newRoom,
        features: newRoom.features.filter(f => f !== feature)
      });
    } else {
      setNewRoom({
        ...newRoom,
        features: [...newRoom.features, feature]
      });
    }
  };
  
  // Oda düzenleme fonksiyonu
  const handleEditRoom = (room) => {
    // Odayı düzenleme için seç ve formu doldur
    setSelectedRoom(room);
    setNewRoom({
      roomNumber: room.roomNumber.toString(),
      roomType: room.roomType,
      floor: room.floor.toString(),
      capacity: room.capacity.toString() || '2',
      pricePerNight: room.pricePerNight.toString(),
      description: room.description || '',
      features: room.features || [],
    });
    setEditMode(true);
    setNewRoomModalVisible(true);
  };

  // Odayı güncelleme fonksiyonu
  const handleUpdateRoom = async () => {
    try {
      // Veri doğrulama
      if (!newRoom.roomNumber || !newRoom.pricePerNight) {
        alert('Hata: Oda numarası ve gecelik ücret alanları zorunludur.');
        return;
      }
      
      setLoading(true);
      
      // API'ye gönderilecek veri yapısını oluştur
      const roomData = {
        id: selectedRoom.id, // Güncelleme için ID gerekli
        roomNumber: parseInt(newRoom.roomNumber),
        roomType: newRoom.roomType,
        floor: parseInt(newRoom.floor),
        roomCapacity: newRoom.capacity,
        pricePerNight: parseFloat(newRoom.pricePerNight),
        description: newRoom.description || '',
        features: newRoom.features,
        isOnMaintenance: selectedRoom.computedStatus === 'Maintenance'
      };
      
      console.log('API\'ye gönderilecek güncellenmiş oda verisi:', roomData);

      // roomService kullanarak API isteği gönder
      const response = await roomService.updateRoom(selectedRoom.id, roomData);
      
      console.log('Oda başarıyla güncellendi:', response);
      
      // Başarılı güncellemeden sonra modal'ı kapat ve odaları yeniden getir
      setNewRoomModalVisible(false);
      setEditMode(false);
      setSelectedRoom(null);
      fetchRooms();
      
      // Kullanıcıya başarılı mesajı göster
      alert('Başarılı: Oda başarıyla güncellendi.');
      
      // Formu sıfırla
      setNewRoom({
        roomNumber: '',
        roomType: 'Standard',
        floor: '1',
        capacity: '2',
        pricePerNight: '',
        description: '',
        features: []
      });
    } catch (error) {
      console.error('Oda güncellenirken hata:', error);
      
      let errorMessage = 'Bilinmeyen bir hata oluştu';
      
      if (error.response) {
        console.log('Hata detayı:', error.response.status, error.response.data);
        console.log('Tam hata bilgisi:', JSON.stringify(error.response.data, null, 2));
        
        // HTTP durum koduna göre özel mesaj
        if (error.response.status === 401) {
          errorMessage = 'Yetkilendirme hatası. Lütfen tekrar giriş yapın.';
        } else if (error.response.status === 400) {
          errorMessage = `Geçersiz veri: ${error.response.data?.message || 'Form alanlarını kontrol edin'}`;
        } else if (error.response.status === 500) {
          errorMessage = 'Sunucu hatası. Lütfen daha sonra tekrar deneyin.';
        } else {
          errorMessage = `Hata: ${error.response.data?.message || error.message}`;
        }
      }
      
      // Kullanıcıya hata mesajı göster
      alert('Hata: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  // Function to handle room deletion
  const handleDeleteRoom = (room) => {
    // Show confirmation alert before deleting
    const confirmDelete = confirm(`"Oda ${room.roomNumber}" silinecek. Bu işlem geri alınamaz. Devam etmek istiyor musunuz?`);
    if (confirmDelete) {
      const deleteRoom = async () => {
        try {
          setLoading(true);
          
          console.log(`Deleting room ID ${room.id}`);
          
          // Call API to delete room
          await roomService.deleteRoom(room.id);
          
          // Refresh room data after deletion
          fetchRooms();
          
          // Show success message
          alert('Başarılı: Oda başarıyla silindi.');
        } catch (error) {
          console.error('Error deleting room:', error);
          
          let errorMessage = 'Bilinmeyen bir hata oluştu';
          
          if (error.response) {
            // HTTP status code based custom message
            if (error.response.status === 401) {
              errorMessage = 'Yetkilendirme hatası. Lütfen tekrar giriş yapın.';
            } else if (error.response.status === 400) {
              errorMessage = `Geçersiz istek: ${error.response.data?.message || 'Lütfen daha sonra tekrar deneyin'}`;
            } else if (error.response.status === 500) {
              errorMessage = 'Sunucu hatası. Lütfen daha sonra tekrar deneyin.';
            } else if (error.response.status === 404) {
              errorMessage = 'Oda bulunamadı.';
            } else {
              errorMessage = `Hata: ${error.response.data?.message || error.message}`;
            }
          }
          
          // Show error message
          alert('Hata: ' + errorMessage);
        } finally {
          setLoading(false);
        }
      };
      
      // Execute the async function
      deleteRoom();
    }
  };
  
  // Function to handle showing room details modal
  const handleShowDetails = async (room) => {
    console.log('Showing details for room:', room);
    setRoomForDetails(room);
    setDetailsModalVisible(true);
    
          // Fetch maintenance issues for this room with GET /api/v1/Room/{id}/maintenance-issues
    try {
      setLoading(true);
      console.log(`Fetching maintenance issues for room ID ${room.id}`);
      
      // Call the API to get maintenance issues
      const response = await roomService.getRoomMaintenanceIssues(room.id);
      console.log('GET /api/v1/Room/{id}/maintenance-issues response:', response);
      
      // Add more detailed debugging
      console.log('Full response:', JSON.stringify(response, null, 2));
      
      let issues = [];
      
      // Comprehensive response structure handling
      if (response) {
        // Case 1: Response is an array directly
        if (Array.isArray(response)) {
          console.log('Response is an array with length:', response.length);
          issues = response;
        } 
        // Case 2: Response has a data property
        else if (response.data) {
          console.log('Response has data property, type:', typeof response.data);
          
          // Case 2a: response.data is an array
          if (Array.isArray(response.data)) {
            console.log('Data is an array with length:', response.data.length);
            issues = response.data;
          } 
          // Case 2b: response.data has a nested data property
          else if (response.data.data && Array.isArray(response.data.data)) {
            console.log('Data.data is an array with length:', response.data.data.length);
            issues = response.data.data;
          }
          // Case 2c: response.data is a single object (not an array)
          else if (typeof response.data === 'object' && response.data !== null) {
            console.log('Data is a single object');
            
            // Check if it has issueDescription which would indicate it's a maintenance issue
            if (response.data.issueDescription) {
              console.log('Data is a maintenance issue object');
              issues = [response.data];
            }
            // It could have a different structure with results array
            else if (response.data.results && Array.isArray(response.data.results)) {
              console.log('Data has results array with length:', response.data.results.length);
              issues = response.data.results;
            }
            // Check if it has items array
            else if (response.data.items && Array.isArray(response.data.items)) {
              console.log('Data has items array with length:', response.data.items.length);
              issues = response.data.items;
            }
            // Check if any key in the object is an array
            else {
              const arrayProps = Object.keys(response.data).filter(key => 
                Array.isArray(response.data[key]) && response.data[key].length > 0
              );
              
              if (arrayProps.length > 0) {
                console.log('Found array property:', arrayProps[0], 'with length:', response.data[arrayProps[0]].length);
                issues = response.data[arrayProps[0]];
              }
            }
          }
        }
      }
      
      // Final processing of found issues
      if (issues.length > 0) {
        console.log('Found', issues.length, 'maintenance issues');
        console.log('Sample issue:', JSON.stringify(issues[0], null, 2));
        setMaintenanceIssues(issues);
      } else {
        console.log('No maintenance issues found after all checks');
        setMaintenanceIssues([]);
      }
    } catch (error) {
      console.error(`Error fetching maintenance issues for room ${room.id}:`, error);
      setMaintenanceIssues([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Function to handle resolving a maintenance issue
  const handleResolveIssue = async (issueId) => {
    try {
      setLoading(true);
      
      console.log(`Resolving maintenance issue ${issueId} for room ${roomForDetails.id}`);
      
      // Call API to mark the issue as resolved
      await roomService.resolveMaintenanceIssue(roomForDetails.id, issueId);
      
      console.log('Issue resolved successfully, refreshing maintenance issues');
      
      // Refresh room data
      fetchRooms();
      
      // Make GET request to refresh maintenance issues
      try {
        const issuesResponse = await roomService.getRoomMaintenanceIssues(roomForDetails.id);
        console.log('GET /api/v1/Room/{id}/maintenance-issues response after resolve:', issuesResponse);
        
        if (issuesResponse && Array.isArray(issuesResponse.data)) {
          console.log(`Received ${issuesResponse.data.length} maintenance issues after resolution`);
          setMaintenanceIssues(issuesResponse.data);
        } else {
          console.log('No maintenance issues data returned after resolution, setting empty array');
          setMaintenanceIssues([]);
        }
      } catch (error) {
        console.error('Error refreshing maintenance issues:', error);
        setMaintenanceIssues([]);
      }
      
      // Show success message
      alert('Success: Maintenance issue marked as resolved successfully.');
      
    } catch (error) {
      console.error('Error resolving maintenance issue:', error);
      alert('Error: Failed to resolve maintenance issue. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Function to open maintenance issue modal
  const handleOpenMaintenanceModal = () => {
    console.log('Opening maintenance modal for room:', roomForDetails?.roomNumber);
    setMaintenanceModalVisible(true);
    // Keep the details modal open in background
    // setDetailsModalVisible(false);
  };
  
  // Function to handle adding maintenance issue
  const handleAddMaintenanceIssue = async () => {
    try {
      // Validate required fields
      if (!maintenanceIssue.description || !maintenanceIssue.completionDate) {
        alert('Error: Please fill in all required fields');
        return;
      }
      
      setLoading(true);
      
      // Format data for API - use the correct field names expected by the API
      const issueData = {
        issueDescription: maintenanceIssue.description,
        estimatedCompletionDate: maintenanceIssue.completionDate.toISOString()
      };
      
      console.log('Sending maintenance issue data:', issueData);
      
      // Call API to add maintenance issue
      const response = await roomService.addMaintenanceIssue(roomForDetails.id, issueData);
      
      console.log('Maintenance issue added successfully:', response);
      
      // --------------------------------------------------------
      // STEP 1: EXPLICITLY UPDATE ROOM TO MAINTENANCE STATUS
      // --------------------------------------------------------
      console.log('Current room details before status update:', roomForDetails);
      console.log('Current status:', roomForDetails.computedStatus, 'isOnMaintenance:', roomForDetails.isOnMaintenance);
      
      try {
        // Create a minimal update payload focusing only on maintenance status
        const maintenanceUpdateData = {
          id: roomForDetails.id,
          roomNumber: roomForDetails.roomNumber,
          isOnMaintenance: true
        };
        
        console.log('Sending direct maintenance status update:', maintenanceUpdateData);
        
        // Call the API to update the room's maintenance status
        const updateResponse = await roomService.updateRoom(roomForDetails.id, maintenanceUpdateData);
        console.log('Room maintenance status update response:', updateResponse);
        
        // Also update the local room data to reflect this change immediately
        setRoomForDetails({
          ...roomForDetails,
          isOnMaintenance: true,
          computedStatus: 'Maintenance'
        });
        
        // --------------------------------------------------------
        // STEP 2: REFRESH ALL ROOMS DATA TO UPDATE UI
        // --------------------------------------------------------
        // First fetch just this room to verify the status change
        try {
          const singleRoomResponse = await roomService.getRoom(roomForDetails.id);
          console.log('Single room refresh response:', singleRoomResponse);
          console.log('Updated room status:', 
            singleRoomResponse.data.computedStatus, 
            'isOnMaintenance:', singleRoomResponse.data.isOnMaintenance
          );
        } catch (singleFetchError) {
          console.error('Error fetching single room:', singleFetchError);
        }
        
        // Now refresh all rooms to update the UI
        try {
          console.log('Refreshing all rooms after maintenance update');
          const allRoomsResponse = await roomService.getAllRooms();
          
          // Log the specific room we updated to verify its status changed
          const updatedRoom = allRoomsResponse.data.find(r => r.id === roomForDetails.id);
          if (updatedRoom) {
            console.log('Updated room in all rooms response:', updatedRoom);
            console.log('Status:', updatedRoom.computedStatus, 'isOnMaintenance:', updatedRoom.isOnMaintenance);
          } else {
            console.log('Could not find updated room in all rooms response');
          }
          
          // Update the rooms state which should update the UI
          setRooms(allRoomsResponse.data);
          filterRooms(); // Make sure filtered rooms are also updated
        } catch (refreshError) {
          console.error('Error refreshing all rooms:', refreshError);
        }
      } catch (updateError) {
        console.error('Error updating room maintenance status:', updateError);
      }
      
      // --------------------------------------------------------
      // STEP 3: FETCH UPDATED MAINTENANCE ISSUES
      // --------------------------------------------------------
      try {
        console.log(`Fetching updated maintenance issues for room ${roomForDetails.id}`);
        const issuesResponse = await roomService.getRoomMaintenanceIssues(roomForDetails.id);
        
        // Use our comprehensive issue parsing logic
        let issues = [];
        if (issuesResponse) {
          if (Array.isArray(issuesResponse)) {
            issues = issuesResponse;
          } else if (issuesResponse.data) {
            if (Array.isArray(issuesResponse.data)) {
              issues = issuesResponse.data;
            } else if (issuesResponse.data.data && Array.isArray(issuesResponse.data.data)) {
              issues = issuesResponse.data.data;
            } else if (typeof issuesResponse.data === 'object' && issuesResponse.data !== null) {
              if (issuesResponse.data.issueDescription) {
                issues = [issuesResponse.data];
              } else if (issuesResponse.data.results && Array.isArray(issuesResponse.data.results)) {
                issues = issuesResponse.data.results;
              } else if (issuesResponse.data.items && Array.isArray(issuesResponse.data.items)) {
                issues = issuesResponse.data.items;
              }
            }
          }
        }
        
        if (issues.length > 0) {
          console.log('Found maintenance issues after update:', issues.length);
          setMaintenanceIssues(issues);
        } else {
          console.log('No maintenance issues found after update');
          setMaintenanceIssues([]);
        }
      } catch (issuesError) {
        console.error('Error fetching maintenance issues after update:', issuesError);
        setMaintenanceIssues([]);
      }
      
      // Reset form and close modals
      setMaintenanceModalVisible(false);
      setMaintenanceIssue({
        description: '',
        completionDate: null
      });
      
      // Show success message and close details modal
      alert('Maintenance issue added and room status changed to maintenance.');
      
      // Refresh room data without requiring manual refresh
      fetchRooms();
      
      // Close the details modal
      setDetailsModalVisible(false);
      
    } catch (error) {
      console.error('Error adding maintenance issue:', error);
      
      let errorMessage = 'An unknown error occurred';
      
      if (error.response) {
        console.log('Error details:', error.response.status, error.response.data);
        
        if (error.response.status === 401) {
          errorMessage = 'Authentication error. Please log in again.';
        } else if (error.response.status === 400) {
          errorMessage = `Invalid data: ${
            error.response.data?.message || 
            (error.response.data?.errors ? JSON.stringify(error.response.data.errors) : 'Please check form fields')
          }`;
        } else if (error.response.status === 500) {
          errorMessage = 'Server error. Please try again later.';
        } else {
          errorMessage = `Error: ${error.response.data?.message || error.message}`;
        }
      }
      
      alert('Error: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  // Date picker handlers
  const openDatePicker = () => {
    setShowCalendar(true);
  };

  const hideDatePicker = () => {
    setShowCalendar(false);
  };

  const handleDateSelect = (date) => {
    setMaintenanceIssue({...maintenanceIssue, completionDate: date});
    hideDatePicker();
  };
  
  // Calendar helper functions
  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };
  
  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };
  
  const getPreviousMonthDays = (year, month) => {
    const firstDay = getFirstDayOfMonth(year, month);
    if (firstDay === 0) return []; // Sunday is first day of week
    
    const daysInPrevMonth = getDaysInMonth(year, month - 1);
    let days = [];
    for (let i = 0; i < firstDay; i++) {
      days.unshift(daysInPrevMonth - i);
    }
    return days;
  };
  
  const getNextMonthDays = (year, month) => {
    const daysInMonth = getDaysInMonth(year, month);
    const lastDay = new Date(year, month, daysInMonth).getDay();
    if (lastDay === 6) return []; // Saturday is last day of week
    
    let days = [];
    for (let i = 1; i <= 6 - lastDay; i++) {
      days.push(i);
    }
    return days;
  };
  
  const formatDateString = (date) => {
    if (!date) return "";
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${year}-${month}-${day}`;
  };
  
  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };
  
  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };
  
  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const daysInMonth = getDaysInMonth(year, month);
    const prevMonthDays = getPreviousMonthDays(year, month);
    const nextMonthDays = getNextMonthDays(year, month);
    
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                         'July', 'August', 'September', 'October', 'November', 'December'];
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return (
      <View style={styles.calendar}>
        <View style={styles.calendarHeader}>
          <TouchableOpacity onPress={prevMonth}>
            <Text style={styles.calendarNavButton}>{"<"}</Text>
          </TouchableOpacity>
          <Text style={styles.calendarTitle}>{monthNames[month]} {year}</Text>
          <TouchableOpacity onPress={nextMonth}>
            <Text style={styles.calendarNavButton}>{">"}</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.calendarDaysOfWeek}>
          <Text style={styles.calendarDayOfWeek}>Su</Text>
          <Text style={styles.calendarDayOfWeek}>Mo</Text>
          <Text style={styles.calendarDayOfWeek}>Tu</Text>
          <Text style={styles.calendarDayOfWeek}>We</Text>
          <Text style={styles.calendarDayOfWeek}>Th</Text>
          <Text style={styles.calendarDayOfWeek}>Fr</Text>
          <Text style={styles.calendarDayOfWeek}>Sa</Text>
        </View>
        
        <View style={styles.calendarDays}>
          {prevMonthDays.map((day, index) => (
            <TouchableOpacity 
              key={`prev-${index}`}
              style={styles.calendarDay}
              disabled={true}
            >
              <Text style={styles.calendarDayTextDisabled}>{day}</Text>
            </TouchableOpacity>
          ))}
          
          {Array.from({length: daysInMonth}, (_, i) => i + 1).map(day => {
            const date = new Date(year, month, day);
            const isToday = date.getTime() === today.getTime();
            const isSelected = maintenanceIssue.completionDate && 
                              date.getTime() === new Date(maintenanceIssue.completionDate).setHours(0,0,0,0);
            const isPast = date < today;
            
            return (
              <TouchableOpacity 
                key={`current-${day}`}
                style={[
                  styles.calendarDay,
                  isToday && styles.calendarDayToday,
                  isSelected && styles.calendarDaySelected,
                ]}
                disabled={isPast}
                onPress={() => handleDateSelect(date)}
              >
                <Text style={[
                  styles.calendarDayText,
                  isPast && styles.calendarDayTextDisabled,
                  isSelected && styles.calendarDayTextSelected,
                ]}>
                  {day}
                </Text>
              </TouchableOpacity>
            );
          })}
          
          {nextMonthDays.map((day, index) => (
            <TouchableOpacity 
              key={`next-${index}`}
              style={styles.calendarDay}
              disabled={true}
            >
              <Text style={styles.calendarDayTextDisabled}>{day}</Text>
            </TouchableOpacity>
          ))}
        </View>
        
        <TouchableOpacity 
          style={styles.calendarTodayButton}
          onPress={() => {
            handleDateSelect(new Date());
          }}
        >
          <Text style={styles.calendarTodayButtonText}>Today</Text>
        </TouchableOpacity>
      </View>
    );
  };
  
  // If user doesn't have access, show access denied screen
  if (!hasAccess) {
    return <AccessDenied />;
  }
  
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => {
              console.log('Other sayfasına yönlendiriliyor');
              router.push('/other');
            }} 
            style={styles.backButton}
          >
            <MaterialIcons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Manage Room</Text>
          <View style={{ width: 24 }} />
        </View>
        
                  <ScrollView style={styles.content}>
            {/* Room type summary cards */}
            <View style={styles.summaryRow}>
            <View style={styles.summaryCard}>
              <Text style={styles.cardTitle}>Standard</Text>
              <View style={styles.cardContent}>
                <View>
                  <Text style={styles.cardLabel}>Total</Text>
                  <Text style={styles.totalCount}>
                    {rooms.filter(r => r.roomType === 'Standard').length || 0}
                  </Text>
                </View>
                <View>
                  <Text style={styles.cardLabel}>Available</Text>
                  <Text style={styles.availableCount}>
                    {rooms.filter(r => r.roomType === 'Standard' && r.computedStatus === 'Available').length || 0}
                  </Text>
                </View>
              </View>
            </View>
            
            <View style={styles.summaryCard}>
              <Text style={styles.cardTitle}>Deluxe</Text>
              <View style={styles.cardContent}>
                <View>
                  <Text style={styles.cardLabel}>Total</Text>
                  <Text style={styles.totalCount}>
                    {rooms.filter(r => r.roomType === 'Deluxe').length || 0}
                  </Text>
                </View>
                <View>
                  <Text style={styles.cardLabel}>Available</Text>
                  <Text style={styles.availableCount}>
                    {rooms.filter(r => r.roomType === 'Deluxe' && r.computedStatus === 'Available').length || 0}
                  </Text>
                </View>
              </View>
            </View>
            
            <View style={styles.summaryCard}>
              <Text style={styles.cardTitle}>Suite</Text>
              <View style={styles.cardContent}>
                <View>
                  <Text style={styles.cardLabel}>Total</Text>
                  <Text style={styles.totalCount}>
                    {rooms.filter(r => r.roomType === 'Suite').length || 0}
                  </Text>
                </View>
                <View>
                  <Text style={styles.cardLabel}>Available</Text>
                  <Text style={styles.availableCount}>
                    {rooms.filter(r => r.roomType === 'Suite' && r.computedStatus === 'Available').length || 0}
                  </Text>
                </View>
              </View>
            </View>
            
            <View style={styles.summaryCard}>
              <Text style={styles.cardTitle}>Royal Suite</Text>
              <View style={styles.cardContent}>
                <View>
                  <Text style={styles.cardLabel}>Total</Text>
                  <Text style={styles.totalCount}>
                    {rooms.filter(r => r.roomType === 'Royal').length || 0}
                  </Text>
                </View>
                <View>
                  <Text style={styles.cardLabel}>Available</Text>
                  <Text style={styles.availableCount}>
                    {rooms.filter(r => r.roomType === 'Royal' && r.computedStatus === 'Available').length || 0}
                  </Text>
                </View>
              </View>
            </View>
          </View>
          
          {/* Search and filters */}
          <View style={styles.filtersRow}>
            <View style={styles.searchBox}>
              <Feather name="search" size={18} color="#999" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search rooms..."
                value={searchText}
                onChangeText={setSearchText}
              />
            </View>
            
            {/* Status filter dropdown */}
            <View style={styles.dropdownContainer}>
              <TouchableOpacity 
                ref={statusButtonRef}
                style={styles.filterButton}
                onPress={() => {
                  setFloorDropdownVisible(false);
                  setStatusDropdownVisible(!statusDropdownVisible);
                }}
              >
                <Text style={styles.filterButtonText}>
                  {statusOptions.find(option => option.value === selectedStatus)?.label || 'All Statuses'}
                </Text>
                <Feather name="chevron-down" size={18} color="#999" />
              </TouchableOpacity>
              
              {statusDropdownVisible && (
                <View style={[styles.dropdownList, { zIndex: 2000 }]}>
                  {statusOptions.map((option) => (
                    <TouchableOpacity 
                      key={option.value}
                      style={[
                        styles.dropdownItem,
                        selectedStatus === option.value && styles.selectedDropdownItem
                      ]}
                      onPress={() => handleStatusChange(option.value)}
                    >
                      <Text style={[
                        styles.dropdownItemText,
                        selectedStatus === option.value && styles.selectedDropdownItemText
                      ]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
            
            {/* Floor filter dropdown */}
            <View style={[styles.dropdownContainer, { marginTop: statusDropdownVisible ? 150 : 0 }]}>
              <TouchableOpacity 
                ref={floorButtonRef}
                style={styles.filterButton}
                onPress={() => {
                  setStatusDropdownVisible(false);
                  setFloorDropdownVisible(!floorDropdownVisible);
                }}
              >
                <Text style={styles.filterButtonText}>
                  {getFloorOptions().find(option => option.value === selectedFloor)?.label || 'All Floors'}
                </Text>
                <Feather name="chevron-down" size={18} color="#999" />
              </TouchableOpacity>
              
              {floorDropdownVisible && (
                <View style={[styles.dropdownList, { zIndex: 2000 }]}>
                  {getFloorOptions().map((option) => (
                    <TouchableOpacity 
                      key={option.value}
                      style={[
                        styles.dropdownItem,
                        selectedFloor === option.value && styles.selectedDropdownItem
                      ]}
                      onPress={() => handleFloorChange(option.value)}
                    >
                      <Text style={[
                        styles.dropdownItemText,
                        selectedFloor === option.value && styles.selectedDropdownItemText
                      ]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
            
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => setNewRoomModalVisible(true)}
            >
              <Feather name="plus" size={18} color="#FFF" />
              <Text style={styles.addButtonText}>NEW ROOM</Text>
            </TouchableOpacity>
          </View>
          
          {/* Tabs */}
          <View style={styles.tabContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <TouchableOpacity 
                style={[styles.tab, activeTab === 'all' && styles.activeTab]}
                onPress={() => handleTabChange('all')}
              >
                <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>
                  All Rooms
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.tab, activeTab === 'Standard' && styles.activeTab]}
                onPress={() => handleTabChange('Standard')}
              >
                <Text style={[styles.tabText, activeTab === 'Standard' && styles.activeTabText]}>
                  Standard
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.tab, activeTab === 'Deluxe' && styles.activeTab]}
                onPress={() => handleTabChange('Deluxe')}
              >
                <Text style={[styles.tabText, activeTab === 'Deluxe' && styles.activeTabText]}>
                  Deluxe
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.tab, activeTab === 'Suite' && styles.activeTab]}
                onPress={() => handleTabChange('Suite')}
              >
                <Text style={[styles.tabText, activeTab === 'Suite' && styles.activeTabText]}>
                  Suite
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
          
          {/* Room List */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text>Loading...</Text>
            </View>
          ) : (
            <FlatList
              data={filteredRooms}
              numColumns={1} // Single column for mobile
              keyExtractor={item => item.id?.toString() || Math.random().toString()}
              initialNumToRender={5}
              showsVerticalScrollIndicator={true}
              contentContainerStyle={styles.roomListContent}
              renderItem={({ item }) => (
                <View style={styles.roomCard}>
                  <View style={styles.roomCardHeader}>
                    <Text style={styles.roomNumber}>Room {item.roomNumber}</Text>
                    <View style={styles.roomStatus}>
                      <View style={[styles.statusDot, { 
                        backgroundColor: item.computedStatus === 'Available' ? '#52c41a' : 
                                        item.computedStatus === 'Occupied' ? '#f5222d' : '#faad14' 
                      }]} />
                      <Text style={styles.statusText}>
                        {item.computedStatus === 'Available' ? 'Available' : 
                         item.computedStatus === 'Occupied' ? 'Occupied' : 'Under Maintenance'}
                      </Text>
                    </View>
                  </View>
                  
                  <Text style={styles.roomDetails}>
                    {item.roomType === 'Standard' ? 'Standard' : 
                     item.roomType === 'Deluxe' ? 'Deluxe' : 
                     item.roomType === 'Suite' ? 'Suite' : 'Royal Suite'} - 
                    {item.capacity || 2} Person - Floor {item.floor || 1}
                  </Text>
                  
                  <Text style={styles.roomPrice}>{item.pricePerNight || 500} ₺ / Night</Text>
                  
                  <View style={styles.roomFeatures}>
                    {item.features && item.features.map((feature, index) => (
                      <View key={index} style={styles.featureTag}>
                        <Text style={styles.featureText}>{feature}</Text>
                      </View>
                    ))}
                  </View>
                  
                  <View style={styles.roomActions}>
                    <TouchableOpacity 
                      style={styles.roomAction}
                      onPress={() => handleEditRoom(item)}
                    >
                      <MaterialIcons name="edit" size={22} color="#666" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.roomAction}
                      onPress={() => handleDeleteRoom(item)}
                    >
                      <MaterialIcons name="delete" size={22} color="#f5222d" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.roomAction}
                      onPress={() => handleShowDetails(item)}
                    >
                      <MaterialIcons name="info-outline" size={22} color="#666" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              ListEmptyComponent={
                <View style={styles.emptyList}>
                  <MaterialIcons name="meeting-room" size={80} color="#E67E22" />
                  <Text style={styles.emptyTitle}>No Rooms Found</Text>
                  <Text style={styles.emptySubtitle}>No rooms match your search criteria</Text>
                </View>
              }
            />
          )}
        </ScrollView>
      </SafeAreaView>
      
      {/* Yeni Oda Ekle Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={newRoomModalVisible}
        onRequestClose={() => setNewRoomModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <TouchableWithoutFeedback onPress={() => setNewRoomModalVisible(false)}>
            <View style={styles.modalCenteredView}>
              <TouchableWithoutFeedback>
                <View style={styles.newRoomModal}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>{editMode ? 'Edit Room' : 'Add New Room'}</Text>
                    <TouchableOpacity onPress={() => {
                      setNewRoomModalVisible(false);
                      if (editMode) {
                        setEditMode(false);
                        setSelectedRoom(null);
                        // Formları sıfırla
                        setNewRoom({
                          roomNumber: '',
                          roomType: 'Standard',
                          floor: '1',
                          capacity: '2',
                          pricePerNight: '',
                          description: '',
                          features: []
                        });
                      }
                    }}>
                      <MaterialIcons name="close" size={24} color="#666" />
                    </TouchableOpacity>
                  </View>
                  
                  <ScrollView style={styles.modalBody}>
                    {/* Oda Numarası */}
                    <View style={styles.formGroup}>
                      <Text style={styles.formLabel}>
                        <Text style={styles.required}>* </Text>
                        Room Number
                      </Text>
                      <TextInput
                        style={styles.formInput}
                        placeholder="Enter room number"
                        value={newRoom.roomNumber}
                        onChangeText={(value) => setNewRoom({...newRoom, roomNumber: value})}
                        keyboardType="numeric"
                      />
                    </View>
                    
                    {/* Oda Tipi */}
                    <View style={styles.formGroup}>
                      <Text style={styles.formLabel}>
                        <Text style={styles.required}>* </Text>
                        Room Type
                      </Text>
                      <TouchableOpacity 
                        style={styles.formSelect}
                        onPress={() => {
                          setRoomTypeDropdownVisible(!roomTypeDropdownVisible);
                          setFloorDropdownVisible(false);
                          setCapacityDropdownVisible(false);
                        }}
                      >
                        <Text>
                          {roomTypes.find(t => t.value === newRoom.roomType)?.label || 'Select'}
                        </Text>
                        <MaterialIcons name="arrow-drop-down" size={24} color="#666" />
                      </TouchableOpacity>
                      
                      {roomTypeDropdownVisible && (
                        <View style={styles.formDropdown}>
                          {roomTypes.map(type => (
                            <TouchableOpacity 
                              key={type.value}
                              style={styles.dropdownItem}
                              onPress={() => {
                                setNewRoom({...newRoom, roomType: type.value});
                                setRoomTypeDropdownVisible(false);
                              }}
                            >
                              <Text style={styles.dropdownItemText}>{type.label}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                    </View>
                    
                    {/* Kat */}
                    <View style={styles.formGroup}>
                      <Text style={styles.formLabel}>
                        <Text style={styles.required}>* </Text>
                        Floor
                      </Text>
                      <TouchableOpacity 
                        style={styles.formSelect}
                        onPress={() => {
                          setFloorDropdownVisible(!floorDropdownVisible);
                          setRoomTypeDropdownVisible(false);
                          setCapacityDropdownVisible(false);
                        }}
                      >
                        <Text>{newRoom.floor}</Text>
                        <MaterialIcons name="arrow-drop-down" size={24} color="#666" />
                      </TouchableOpacity>
                      
                      {floorDropdownVisible && (
                        <View style={styles.formDropdown}>
                          {[1, 2, 3].map(floor => (
                            <TouchableOpacity 
                              key={floor}
                              style={styles.dropdownItem}
                              onPress={() => {
                                setNewRoom({...newRoom, floor: floor.toString()});
                                setFloorDropdownVisible(false);
                              }}
                            >
                              <Text style={styles.dropdownItemText}>Floor {floor}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                    </View>
                    
                    {/* Kapasite */}
                    <View style={styles.formGroup}>
                      <Text style={styles.formLabel}>
                        <Text style={styles.required}>* </Text>
                        Capacity
                      </Text>
                      <TouchableOpacity 
                        style={styles.formSelect}
                        onPress={() => {
                          setCapacityDropdownVisible(!capacityDropdownVisible);
                          setRoomTypeDropdownVisible(false);
                          setFloorDropdownVisible(false);
                        }}
                      >
                        <Text>{newRoom.capacity}</Text>
                        <MaterialIcons name="arrow-drop-down" size={24} color="#666" />
                      </TouchableOpacity>
                      
                      {capacityDropdownVisible && (
                        <View style={styles.formDropdown}>
                          {[1, 2, 3, 4].map(cap => (
                            <TouchableOpacity 
                              key={cap}
                              style={styles.dropdownItem}
                              onPress={() => {
                                setNewRoom({...newRoom, capacity: cap.toString()});
                                setCapacityDropdownVisible(false);
                              }}
                            >
                              <Text style={styles.dropdownItemText}>{cap} Person</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                    </View>
                    
                    {/* Gecelik Ücret */}
                    <View style={styles.formGroup}>
                      <Text style={styles.formLabel}>
                        <Text style={styles.required}>* </Text>
                        Gecelik Ücret (₺)
                      </Text>
                      <TextInput
                        style={styles.formInput}
                        placeholder="Ücret giriniz"
                        value={newRoom.pricePerNight}
                        onChangeText={(value) => setNewRoom({...newRoom, pricePerNight: value})}
                        keyboardType="numeric"
                      />
                    </View>
                    
                    {/* Açıklama */}
                    <View style={styles.formGroup}>
                      <Text style={styles.formLabel}>Açıklama</Text>
                      <TextInput
                        style={[styles.formInput, styles.textArea]}
                        placeholder="Oda hakkında açıklama giriniz"
                        value={newRoom.description}
                        onChangeText={(value) => setNewRoom({...newRoom, description: value})}
                        multiline={true}
                        numberOfLines={4}
                      />
                    </View>
                    
                    {/* Özellikler */}
                    <View style={styles.formGroup}>
                      <Text style={styles.formLabel}>Özellikler</Text>
                      
                      {/* Özellik arama kutusu - tıklanınca açılacak */}
                      <TouchableOpacity 
                        style={styles.searchContainer}
                        onPress={() => setFeaturesDropdownVisible(!featuresDropdownVisible)}
                      >
                        <Text style={styles.searchInput}>
                          {newRoom.features.length > 0 
                            ? `${newRoom.features.length} özellik seçildi` 
                            : 'Özellikleri seçin'
                          }
                        </Text>
                        <MaterialIcons 
                          name={featuresDropdownVisible ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
                          size={20} 
                          color="#999" 
                          style={styles.searchIcon} 
                        />
                      </TouchableOpacity>
                      
                      {/* Dropdown açıldığında gösterilecek özellikler listesi */}
                      {featuresDropdownVisible && (
                        <View style={styles.featuresListContainer}>
                          {roomFeatures.map(feature => (
                            <TouchableOpacity 
                              key={feature} 
                              style={[
                                styles.featureOptionItem,
                                newRoom.features.includes(feature) && styles.featureOptionSelected
                              ]}
                              onPress={() => toggleFeature(feature)}
                            >
                              <Text style={styles.featureText}>{feature}</Text>
                              {newRoom.features.includes(feature) && (
                                <MaterialIcons name="check" size={20} color="#1890ff" style={styles.checkIcon} />
                              )}
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                      
                      {/* Seçilen özelliklerin etiketleri */}
                      {newRoom.features.length > 0 && (
                        <View style={styles.selectedTagsContainer}>
                          {newRoom.features.map(feature => (
                            <View key={feature} style={styles.selectedTag}>
                              <Text style={styles.selectedTagText}>{feature}</Text>
                              <TouchableOpacity onPress={() => toggleFeature(feature)}>
                                <MaterialIcons name="close" size={16} color="#666" />
                              </TouchableOpacity>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  </ScrollView>
                  
                  <View style={styles.modalFooter}>
                    <TouchableOpacity 
                      style={styles.cancelButton}
                      onPress={() => {
                        setNewRoomModalVisible(false);
                        if (editMode) {
                          setEditMode(false);
                          setSelectedRoom(null);
                        }
                      }}
                    >
                      <Text style={styles.cancelButtonText}>İptal</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.submitButton}
                      onPress={editMode ? handleUpdateRoom : handleAddRoom}
                    >
                      <Text style={styles.submitButtonText}>{editMode ? 'Güncelle' : 'Ekle'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
      
      {/* Room Details Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={detailsModalVisible}
        onRequestClose={() => setDetailsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.detailsModalContainer}>
            <View style={styles.detailsModalHeader}>
              <Text style={styles.detailsModalTitle}>
                Room {roomForDetails?.roomNumber} - Details
              </Text>
              <TouchableOpacity onPress={() => setDetailsModalVisible(false)}>
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.detailsModalContent}>
              {roomForDetails ? (
                <ScrollView>
                  <View style={styles.detailsSection}>
                    <Text style={styles.detailLabel}>Room Status:</Text>
                    <View style={styles.statusBadge}>
                      <View style={[styles.statusDot, { 
                        backgroundColor: roomForDetails.computedStatus === 'Available' ? '#52c41a' : 
                                        roomForDetails.computedStatus === 'Occupied' ? '#f5222d' : '#faad14' 
                      }]} />
                      <Text style={styles.statusBadgeText}>
                        {roomForDetails.computedStatus === 'Available' ? 'Available' : 
                         roomForDetails.computedStatus === 'Occupied' ? 'Occupied' : 'Under Maintenance'}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.detailsSection}>
                    <Text style={styles.detailLabel}>Room Type:</Text>
                    <Text style={styles.detailValue}>
                      {roomForDetails.roomType === 'Standard' ? 'Standard' : 
                       roomForDetails.roomType === 'Deluxe' ? 'Deluxe' : 
                       roomForDetails.roomType === 'Suite' ? 'Suite' : 'Royal Suite'}
                    </Text>
                  </View>
                  
                  <View style={styles.detailsSection}>
                    <Text style={styles.detailLabel}>Floor:</Text>
                    <Text style={styles.detailValue}>Floor {roomForDetails.floor || 1}</Text>
                  </View>
                  
                  <View style={styles.detailsSection}>
                    <Text style={styles.detailLabel}>Capacity:</Text>
                    <Text style={styles.detailValue}>{roomForDetails.capacity || 2} Person</Text>
                  </View>
                  
                  <View style={styles.detailsSection}>
                    <Text style={styles.detailLabel}>Nightly Rate:</Text>
                    <Text style={styles.detailValue}>{roomForDetails.pricePerNight || 500} ₺</Text>
                  </View>
                  
                  <View style={styles.detailsSection}>
                    <Text style={styles.detailLabel}>Description:</Text>
                    <Text style={styles.detailValue}>
                      {roomForDetails.description || 'No description available.'}
                    </Text>
                  </View>
                  
                  <View style={styles.detailsSection}>
                    <Text style={styles.detailLabel}>Features:</Text>
                    <View style={styles.featuresContainer}>
                      {roomForDetails.features && roomForDetails.features.length > 0 ? (
                        roomForDetails.features.map((feature, index) => (
                          <View key={index} style={styles.featureTagLarge}>
                            <Text style={styles.featureTextLarge}>{feature}</Text>
                          </View>
                        ))
                      ) : (
                        <Text style={styles.detailValue}>No features available.</Text>
                      )}
                    </View>
                  </View>
                  
                  <View style={styles.maintenanceSection}>
                    <Text style={styles.maintenanceSectionTitle}>Maintenance Issues</Text>
                    
                    {maintenanceIssues && maintenanceIssues.length > 0 ? (
                      maintenanceIssues.map((item, index) => (
                        <View key={index} style={styles.maintenanceItem}>
                          <View style={styles.maintenanceHeader}>
                            <Text style={styles.issueTitle}>{item.issueDescription}</Text>
                            <View style={styles.inProgressBadge}>
                              <Feather name="edit-2" size={14} color="#1890ff" />
                              <Text style={styles.inProgressText}>In Progress</Text>
                            </View>
                          </View>
                          
                          <Text style={styles.issueDetailText}>Report Date: {formatToTurkishDate(item.reportDate || new Date())}</Text>
                          <Text style={styles.issueDetailText}>Estimated Completion: {formatToTurkishDate(item.estimatedCompletionDate)}</Text>
                          
                          <TouchableOpacity 
                            style={styles.markAsResolvedButton}
                            onPress={() => handleResolveIssue(item.id)}
                          >
                            <MaterialIcons name="check" size={16} color="white" style={{marginRight: 5}} />
                            <Text style={styles.markAsResolvedText}>Mark as Resolved</Text>
                          </TouchableOpacity>
                        </View>
                      ))
                    ) : (
                      <View style={styles.emptyMaintenanceContainer}>
                        <MaterialIcons name="build" size={50} color="#e0e0e0" />
                        <Text style={styles.emptyMaintenanceText}>No maintenance issues found for this room</Text>
                      </View>
                    )}
                  </View>
                </ScrollView>
              ) : (
                <View style={styles.loadingContainer}>
                  <Text>Yükleniyor...</Text>
                </View>
              )}
            </View>
            
            <View style={styles.detailsModalFooter}>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setDetailsModalVisible(false)}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.addMaintenanceButton}
                onPress={handleOpenMaintenanceModal}
              >
                <MaterialIcons name="build" size={18} color="white" />
                <Text style={styles.addMaintenanceButtonText}>Add Maintenance Issue</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Add Maintenance Issue Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={maintenanceModalVisible}
        onRequestClose={() => setMaintenanceModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.maintenanceModalContainer}>
            <View style={styles.maintenanceModalHeader}>
              <Text style={styles.maintenanceModalTitle}>Add Maintenance Issue</Text>
              <TouchableOpacity onPress={() => setMaintenanceModalVisible(false)}>
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.maintenanceModalContent}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>
                  <Text style={styles.required}>* </Text>
                  Issue Description
                </Text>
                <TextInput
                  style={[styles.formInput, styles.textArea]}
                  placeholder="Describe the maintenance issue"
                  value={maintenanceIssue.description}
                  onChangeText={(value) => setMaintenanceIssue({...maintenanceIssue, description: value})}
                  multiline={true}
                  numberOfLines={4}
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>
                  <Text style={styles.required}>* </Text>
                  Estimated Completion Date
                </Text>
                <TouchableOpacity 
                  style={styles.datePickerButton}
                  onPress={openDatePicker}
                >
                  <Text style={styles.datePickerText}>
                    {maintenanceIssue.completionDate 
                      ? maintenanceIssue.completionDate.toLocaleDateString() 
                      : "Select date"}
                  </Text>
                  <MaterialIcons name="calendar-today" size={20} color="#666" />
                </TouchableOpacity>
                
                {showCalendar && renderCalendar()}
              </View>
            </View>
            
            <View style={styles.maintenanceModalFooter}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setMaintenanceModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.submitButton}
                onPress={handleAddMaintenanceIssue}
              >
                <Text style={styles.submitButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#3f2b7b',
    paddingVertical: 15,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  backButton: {
    padding: 5,
  },
  content: {
    flex: 1,
    padding: 15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    width: '48%', // 2 cards per row on mobile
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderTopWidth: 3,
    borderTopColor: '#3f2b7b',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#3f2b7b',
    textAlign: 'center',
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 5,
  },
  cardLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  totalCount: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#3f2b7b',
  },
  availableCount: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#52c41a',
  },
  filtersRow: {
    flexDirection: 'column',
    alignItems: 'stretch',
    marginBottom: 20,
    zIndex: 1000, // Add high z-index to ensure filters stay on top
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 4,
    paddingHorizontal: 10,
    width: '100%',
    height: 38,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    borderRadius: 4,
    paddingHorizontal: 10,
    height: 38,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    width: '100%',
  },
  filterButtonText: {
    marginRight: 5,
    fontSize: 14,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3f2b7b',
    borderRadius: 4,
    paddingHorizontal: 15,
    height: 38,
    marginBottom: 10,
    width: '100%',
  },
  addButtonText: {
    color: 'white',
    fontWeight: '500',
    marginLeft: 5,
  },
  tabContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    marginBottom: 20,
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    marginRight: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#3f2b7b',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  activeTabText: {
    color: '#3f2b7b',
    fontWeight: '500',
  },
  roomList: {
    paddingBottom: 20,
  },
  roomCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    marginRight: 0, // Remove right margin for mobile
    width: '100%', // Full width on mobile
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderTopWidth: 2,
    borderTopColor: '#3f2b7b',
  },
  roomCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  roomNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3f2b7b',
  },
  roomStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 5,
  },
  statusText: {
    fontSize: 12,
    color: '#666',
  },
  roomDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  roomPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3f2b7b',
    marginBottom: 10,
  },
  roomFeatures: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  featureTag: {
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginRight: 7,
    marginBottom: 7,
  },
  featureText: {
    fontSize: 12,
    color: '#666',
  },
  roomActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 15,
    paddingBottom: 5,
  },
  roomAction: {
    padding: 10,
  },
  emptyList: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 10,
    color: '#3f2b7b',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  dropdown: {
    position: 'absolute',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 5,
    maxHeight: 300,
    zIndex: 9999,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#eee',
  },
  dropdownItem: {
    padding: 10,
    borderRadius: 4,
  },
  selectedDropdownItem: {
    backgroundColor: '#f5f5f5',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#666',
  },
  selectedDropdownItemText: {
    color: '#3f2b7b',
    fontWeight: '500',
  },
  dropdownContainer: {
    position: 'relative',
    zIndex: 1000,
    marginBottom: 10,
  },
  dropdownList: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1001,
    maxHeight: 200,
    overflow: 'scroll',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCenteredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  newRoomModal: {
    backgroundColor: 'white',
    borderRadius: 10,
    width: '95%',
    maxWidth: '100%',
    maxHeight: '95%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#f8f8f8',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3f2b7b',
  },
  modalBody: {
    padding: 16,
    maxHeight: 500,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#f8f8f8',
  },
  formGroup: {
    marginBottom: 18,
  },
  formLabel: {
    fontSize: 15,
    marginBottom: 8,
    fontWeight: '600',
    color: '#333',
  },
  required: {
    color: '#f56c6c',
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    marginBottom: 5,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  formSelect: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'white',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  formDropdown: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    marginTop: 5,
    backgroundColor: 'white',
    maxHeight: 200,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 4,
    overflow: 'hidden',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 8,
    backgroundColor: 'white',
    justifyContent: 'space-between',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  searchIcon: {
    marginLeft: 8,
  },
  featuresListContainer: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  featureOptionItem: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  featureOptionSelected: {
    backgroundColor: '#f0f8ff',
  },
  featureText: {
    fontSize: 16,
    color: '#333',
  },
  checkIcon: {
    marginLeft: 10,
  },
  selectedTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    marginBottom: 12,
  },
  selectedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedTagText: {
    fontSize: 14,
    color: '#333',
    marginRight: 6,
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    marginRight: 12,
    backgroundColor: 'white',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '500',
    fontSize: 15,
  },
  submitButton: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    backgroundColor: '#3f2b7b',
    borderRadius: 6,
  },
  submitButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 15,
  },
  // Room details modal styles
  detailsModalContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    width: '95%',
    maxWidth: '100%',
    maxHeight: '95%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  detailsModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#f8f8f8',
  },
  detailsModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3f2b7b',
  },
  detailsModalContent: {
    padding: 15,
    maxHeight: '80%',
  },
  detailsModalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#f8f8f8',
  },
  detailsSection: {
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 16,
    flexWrap: 'wrap',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  statusBadgeText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  featuresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  featureTagLarge: {
    backgroundColor: '#f5f5f5',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  featureTextLarge: {
    fontSize: 14,
    color: '#333',
  },
  maintenanceSection: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 20,
  },
  maintenanceSectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#3f2b7b',
    marginBottom: 20,
  },
  emptyMaintenanceContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyMaintenanceText: {
    marginTop: 12,
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  closeButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    backgroundColor: 'white',
  },
  closeButtonText: {
    color: '#666',
    fontWeight: '500',
    fontSize: 15,
  },
  addMaintenanceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3f2b7b',
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  addMaintenanceButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 15,
    marginLeft: 8,
  },
  // Maintenance modal styles
  maintenanceModalContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    width: '95%',
    maxWidth: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  maintenanceModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#f8f8f8',
  },
  maintenanceModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3f2b7b',
  },
  maintenanceModalContent: {
    padding: 20,
  },
  maintenanceModalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#f8f8f8',
  },
  datePickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: 'white',
  },
  datePickerText: {
    fontSize: 16,
    color: '#333',
  },
  // Calendar styles
  calendar: {
    backgroundColor: 'white',
    borderRadius: 8,
    margin: 10,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
  },
  calendarTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3f2b7b',
  },
  calendarNavButton: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3f2b7b',
    padding: 5,
  },
  calendarDaysOfWeek: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 5,
  },
  calendarDayOfWeek: {
    width: 30,
    textAlign: 'center',
    fontWeight: '500',
    color: '#666',
  },
  calendarDays: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  calendarDay: {
    width: '14.28%',
    height: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  calendarDayToday: {
    backgroundColor: '#e6f7ff',
    borderRadius: 17.5,
  },
  calendarDaySelected: {
    backgroundColor: '#3f2b7b',
    borderRadius: 17.5,
  },
  calendarDayText: {
    color: '#333',
  },
  calendarDayTextDisabled: {
    color: '#ccc',
  },
  calendarDayTextSelected: {
    color: 'white',
    fontWeight: 'bold',
  },
  calendarTodayButton: {
    alignSelf: 'center',
    padding: 8,
    paddingHorizontal: 15,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    marginTop: 10,
  },
  calendarTodayButtonText: {
    color: '#3f2b7b',
    fontWeight: '500',
  },
  maintenanceItem: {
    marginBottom: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#eaeaea',
    paddingBottom: 20,
  },
  maintenanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  issueTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#52307c',
  },
  inProgressBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e6f7ff',
    borderColor: '#91d5ff',
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  inProgressText: {
    fontSize: 13,
    color: '#1890ff',
    marginLeft: 5,
  },
  issueDetailText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  markAsResolvedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3f2b7b',
    borderRadius: 4,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  markAsResolvedText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 14,
  },
});

// Function to format dates in Turkish format like "18 Mayıs 2025"
const formatToTurkishDate = (dateString) => {
  if (!dateString) return 'Belirtilmemiş';
  
  try {
  const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.log('Invalid date format:', dateString);
      return 'Geçersiz Tarih';
    }
    
  const day = date.getDate();
  
  const monthNames = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ];
  
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear();
  
  return `${day} ${month} ${year}`;
    } catch (error) {
    console.error('Error formatting date:', error);
    return 'Tarih Hatası';
  }
};