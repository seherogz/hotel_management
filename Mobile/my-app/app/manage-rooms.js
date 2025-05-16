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
  
  // Available statuses and floors
  const statusOptions = [
    { value: 'all', label: 'Tüm Durumlar' },
    { value: 'Available', label: 'Hazır' },
    { value: 'Occupied', label: 'Dolu' },
    { value: 'Maintenance', label: 'Bakımda' }
  ];
  
  // Get unique floors from rooms
  const getFloorOptions = () => {
    const floors = [...new Set(rooms.map(room => room.floor))].sort((a, b) => a - b);
    return [
      { value: 'all', label: 'Tüm Katlar' },
      ...floors.map(floor => ({ value: floor.toString(), label: `${floor}. Kat` }))
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
      const response = await roomService.getAllRooms();
      setRooms(response.data);
      setFilteredRooms(response.data);
    } catch (error) {
      console.error('Odalar yüklenirken hata:', error);
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
      filtered = filtered.filter(room => room.status === selectedStatus);
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

  // Oda özellikleri için seçenekler
  const roomFeatures = ['Wi-Fi', 'TV', 'Minibar', 'Klima', 'Balkon', 'Jakuzi', 'Kahve Makinesi'];
  
  // Oda türleri
  const roomTypes = [
    { value: 'Standard', label: 'Standart' },
    { value: 'Deluxe', label: 'Delüks' },
    { value: 'Suite', label: 'Süit' },
    { value: 'Royal', label: 'Kral Dairesi' }
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
        Alert.alert('Hata', 'Oda numarası ve gecelik ücret alanları zorunludur.');
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
      Alert.alert('Başarılı', 'Oda başarıyla eklendi.');
      
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
      Alert.alert('Hata', errorMessage);
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
        
        <View style={styles.content}>
          {/* Room type summary cards */}
          <View style={styles.summaryRow}>
            <View style={styles.summaryCard}>
              <Text style={styles.cardTitle}>Standart</Text>
              <View style={styles.cardContent}>
                <View>
                  <Text style={styles.cardLabel}>Toplam</Text>
                  <Text style={styles.totalCount}>
                    {rooms.filter(r => r.roomType === 'Standard').length || 0}
                  </Text>
                </View>
                <View>
                  <Text style={styles.cardLabel}>Müsait</Text>
                  <Text style={styles.availableCount}>
                    {rooms.filter(r => r.roomType === 'Standard' && r.status === 'Available').length || 0}
                  </Text>
                </View>
              </View>
            </View>
            
            <View style={styles.summaryCard}>
              <Text style={styles.cardTitle}>Delüks</Text>
              <View style={styles.cardContent}>
                <View>
                  <Text style={styles.cardLabel}>Toplam</Text>
                  <Text style={styles.totalCount}>
                    {rooms.filter(r => r.roomType === 'Deluxe').length || 0}
                  </Text>
                </View>
                <View>
                  <Text style={styles.cardLabel}>Müsait</Text>
                  <Text style={styles.availableCount}>
                    {rooms.filter(r => r.roomType === 'Deluxe' && r.status === 'Available').length || 0}
                  </Text>
                </View>
              </View>
            </View>
            
            <View style={styles.summaryCard}>
              <Text style={styles.cardTitle}>Süit</Text>
              <View style={styles.cardContent}>
                <View>
                  <Text style={styles.cardLabel}>Toplam</Text>
                  <Text style={styles.totalCount}>
                    {rooms.filter(r => r.roomType === 'Suite').length || 0}
                  </Text>
                </View>
                <View>
                  <Text style={styles.cardLabel}>Müsait</Text>
                  <Text style={styles.availableCount}>
                    {rooms.filter(r => r.roomType === 'Suite' && r.status === 'Available').length || 0}
                  </Text>
                </View>
              </View>
            </View>
            
            <View style={styles.summaryCard}>
              <Text style={styles.cardTitle}>Kral Dairesi</Text>
              <View style={styles.cardContent}>
                <View>
                  <Text style={styles.cardLabel}>Toplam</Text>
                  <Text style={styles.totalCount}>
                    {rooms.filter(r => r.roomType === 'Royal').length || 0}
                  </Text>
                </View>
                <View>
                  <Text style={styles.cardLabel}>Müsait</Text>
                  <Text style={styles.availableCount}>
                    {rooms.filter(r => r.roomType === 'Royal' && r.status === 'Available').length || 0}
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
                placeholder="Oda ara..."
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
                  measureStatusButton();
                  setStatusDropdownVisible(!statusDropdownVisible);
                }}
              >
                <Text style={styles.filterButtonText}>
                  {statusOptions.find(option => option.value === selectedStatus)?.label || 'Tüm Durumlar'}
                </Text>
                <Feather name="chevron-down" size={18} color="#999" />
              </TouchableOpacity>
              
              <Modal
                transparent={true}
                visible={statusDropdownVisible}
                animationType="fade"
                onRequestClose={() => setStatusDropdownVisible(false)}
              >
                <TouchableWithoutFeedback onPress={() => setStatusDropdownVisible(false)}>
                  <View style={styles.modalOverlay}>
                    <TouchableWithoutFeedback>
                      <View style={[styles.modalDropdown, {
                        top: statusDropdownPosition.top,
                        left: statusDropdownPosition.left,
                      }]}>
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
                    </TouchableWithoutFeedback>
                  </View>
                </TouchableWithoutFeedback>
              </Modal>
            </View>
            
            {/* Floor filter dropdown */}
            <View style={styles.dropdownContainer}>
              <TouchableOpacity 
                ref={floorButtonRef}
                style={styles.filterButton}
                onPress={() => {
                  setStatusDropdownVisible(false);
                  measureFloorButton();
                  setFloorDropdownVisible(!floorDropdownVisible);
                }}
              >
                <Text style={styles.filterButtonText}>
                  {getFloorOptions().find(option => option.value === selectedFloor)?.label || 'Tüm Katlar'}
                </Text>
                <Feather name="chevron-down" size={18} color="#999" />
              </TouchableOpacity>
              
              <Modal
                transparent={true}
                visible={floorDropdownVisible}
                animationType="fade"
                onRequestClose={() => setFloorDropdownVisible(false)}
              >
                <TouchableWithoutFeedback onPress={() => setFloorDropdownVisible(false)}>
                  <View style={styles.modalOverlay}>
                    <TouchableWithoutFeedback>
                      <View style={[styles.modalDropdown, {
                        top: floorDropdownPosition.top,
                        left: floorDropdownPosition.left,
                      }]}>
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
                    </TouchableWithoutFeedback>
                  </View>
                </TouchableWithoutFeedback>
              </Modal>
            </View>
            
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => setNewRoomModalVisible(true)}
            >
              <Feather name="plus" size={18} color="#FFF" />
              <Text style={styles.addButtonText}>YENİ ODA</Text>
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
                  Tüm Odalar
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.tab, activeTab === 'Standard' && styles.activeTab]}
                onPress={() => handleTabChange('Standard')}
              >
                <Text style={[styles.tabText, activeTab === 'Standard' && styles.activeTabText]}>
                  Standart
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.tab, activeTab === 'Deluxe' && styles.activeTab]}
                onPress={() => handleTabChange('Deluxe')}
              >
                <Text style={[styles.tabText, activeTab === 'Deluxe' && styles.activeTabText]}>
                  Delüks
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.tab, activeTab === 'Suite' && styles.activeTab]}
                onPress={() => handleTabChange('Suite')}
              >
                <Text style={[styles.tabText, activeTab === 'Suite' && styles.activeTabText]}>
                  Süit
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
          
          {/* Room List */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text>Yükleniyor...</Text>
            </View>
          ) : (
            <FlatList
              data={filteredRooms}
              numColumns={3}
              keyExtractor={item => item.id?.toString() || Math.random().toString()}
              renderItem={({ item }) => (
                <View style={styles.roomCard}>
                  <View style={styles.roomCardHeader}>
                    <Text style={styles.roomNumber}>Oda {item.roomNumber}</Text>
                    <View style={styles.roomStatus}>
                      <View style={[styles.statusDot, { 
                        backgroundColor: item.status === 'Available' ? '#52c41a' : 
                                        item.status === 'Occupied' ? '#f5222d' : '#faad14' 
                      }]} />
                      <Text style={styles.statusText}>
                        {item.status === 'Available' ? 'Hazır' : 
                         item.status === 'Occupied' ? 'Dolu' : 'Bakımda'}
                      </Text>
                    </View>
                  </View>
                  
                  <Text style={styles.roomDetails}>
                    {item.roomType === 'Standard' ? 'Standart' : 
                     item.roomType === 'Deluxe' ? 'Delüks' : 
                     item.roomType === 'Suite' ? 'Süit' : 'Kral Dairesi'} - 
                    {item.capacity || 2} Kişilik - {item.floor || 1}. Kat
                  </Text>
                  
                  <Text style={styles.roomPrice}>{item.pricePerNight || 500} ₺ / Gece</Text>
                  
                  <View style={styles.roomFeatures}>
                    {item.features && item.features.map((feature, index) => (
                      <View key={index} style={styles.featureTag}>
                        <Text style={styles.featureText}>{feature}</Text>
                      </View>
                    ))}
                  </View>
                  
                  <View style={styles.roomActions}>
                    <TouchableOpacity style={styles.roomAction}>
                      <MaterialIcons name="edit" size={22} color="#666" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.roomAction}>
                      <MaterialIcons name="delete" size={22} color="#666" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.roomAction}>
                      <MaterialIcons name="info-outline" size={22} color="#666" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              contentContainerStyle={styles.roomList}
              ListEmptyComponent={
                <View style={styles.emptyList}>
                  <MaterialIcons name="meeting-room" size={80} color="#E67E22" />
                  <Text style={styles.emptyTitle}>Oda Bulunamadı</Text>
                  <Text style={styles.emptySubtitle}>Arama kriterlerine uygun oda bulunamadı</Text>
                </View>
              }
            />
          )}
        </View>
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
                    <Text style={styles.modalTitle}>Yeni Oda Ekle</Text>
                    <TouchableOpacity onPress={() => setNewRoomModalVisible(false)}>
                      <MaterialIcons name="close" size={24} color="#666" />
                    </TouchableOpacity>
                  </View>
                  
                  <ScrollView style={styles.modalBody}>
                    {/* Oda Numarası */}
                    <View style={styles.formGroup}>
                      <Text style={styles.formLabel}>
                        <Text style={styles.required}>* </Text>
                        Oda Numarası
                      </Text>
                      <TextInput
                        style={styles.formInput}
                        placeholder="Oda numarası giriniz"
                        value={newRoom.roomNumber}
                        onChangeText={(value) => setNewRoom({...newRoom, roomNumber: value})}
                        keyboardType="numeric"
                      />
                    </View>
                    
                    {/* Oda Tipi */}
                    <View style={styles.formGroup}>
                      <Text style={styles.formLabel}>
                        <Text style={styles.required}>* </Text>
                        Oda Tipi
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
                          {roomTypes.find(t => t.value === newRoom.roomType)?.label || 'Seçiniz'}
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
                        Kat
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
                              <Text style={styles.dropdownItemText}>{floor}. Kat</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                    </View>
                    
                    {/* Kapasite */}
                    <View style={styles.formGroup}>
                      <Text style={styles.formLabel}>
                        <Text style={styles.required}>* </Text>
                        Kapasite
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
                              <Text style={styles.dropdownItemText}>{cap} Kişilik</Text>
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
                      onPress={() => setNewRoomModalVisible(false)}
                    >
                      <Text style={styles.cancelButtonText}>İptal</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.submitButton}
                      onPress={handleAddRoom}
                    >
                      <Text style={styles.submitButtonText}>Ekle</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
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
    backgroundColor: '#7843D9',
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
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    width: '23%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardLabel: {
    fontSize: 14,
    color: '#666',
  },
  totalCount: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  availableCount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#52c41a',
  },
  filtersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 4,
    paddingHorizontal: 10,
    flex: 1,
    height: 38,
    marginRight: 10,
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
    backgroundColor: 'white',
    borderRadius: 4,
    paddingHorizontal: 10,
    height: 38,
    marginRight: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  filterButtonText: {
    marginRight: 5,
    fontSize: 14,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#40A9FF',
    borderRadius: 4,
    paddingHorizontal: 15,
    height: 38,
    marginBottom: 10,
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
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginRight: 5,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#40A9FF',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  activeTabText: {
    color: '#40A9FF',
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
    marginRight: 15,
    width: '31%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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
    color: '#40A9FF',
    marginBottom: 10,
  },
  roomFeatures: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  featureTag: {
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginRight: 5,
    marginBottom: 5,
  },
  featureText: {
    fontSize: 12,
    color: '#666',
  },
  roomActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
  },
  roomAction: {
    marginLeft: 15,
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
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  dropdown: {
    position: 'absolute',
    top: 48,
    left: 0,
    backgroundColor: 'white',
    borderRadius: 4,
    padding: 5,
    width: 180,
    maxHeight: 200,
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
    color: '#40A9FF',
    fontWeight: '500',
  },
  dropdownContainer: {
    position: 'relative',
    zIndex: 1000,
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
    width: '90%',
    maxWidth: 500,
    maxHeight: '90%',
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
    color: '#333',
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
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
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
    backgroundColor: '#1890ff',
    borderRadius: 6,
  },
  submitButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 15,
  },
});